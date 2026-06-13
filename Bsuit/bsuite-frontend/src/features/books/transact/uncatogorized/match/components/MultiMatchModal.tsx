import { useState, useEffect } from "react";
import { Box, Typography, useTheme, Tooltip, IconButton } from "@mui/material";
import { CheckCircle, Cancel, KeyboardArrowDown } from "@mui/icons-material";
import { PrimaryButton } from "../../../../../../components/atom/button/PrimaryButton";
import { MatchTableAtom } from "../../../../../../components/tables/standard-table/MatchTableAtom";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import InvoiceModal from "../../../modals/InvoiceModal";
import BillModal from "../../../modals/BillModal";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import {
  useGetMultiMatchMutation,
  useSaveUncategorizedMultiMatchMutation,
} from "../api/match.api";
import { useLazyGetFxHistoryQuery } from "../../../../transact/api/fx.api";
import {
  formatCurrencyByCommaSeparation,
  formatDateShort,
} from "../../../../../../utils/numberFormatter";
import dayjs from "dayjs";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { RadioButton } from "../../../../../../components/atom/radio-button";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetAllPaymentsQuery,
  useGetInvoiceByIdPreviewQuery,
} from "../../../api/invoice.api";
import {
  useGetBillByIdPreviewQuery,
  useGetBillPaymentsQuery,
} from "../../../api/bill.api";
import ViewInvoiceBill from "../../../transactHome/components/dialogs/ViewInvoiceBill";

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  moneyDirection?: "in" | "out";
  total?: number;
  selectedUncat: any[];
  accountCurrencyData?: string;
  refetchTransactCount?: () => void;
}

interface ExpandedRow {
  number: string;
  fxRate: string;
  originalFxRate: string;
  convertedAmount: string;
  transactionTypeId?: string;
}

export default function MultiMatchModal({
  isOpen,
  onClose,
  moneyDirection,
  selectedUncat,
  total,
  accountCurrencyData,
  refetchTransactCount,
}: MatchModalProps) {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [fxTargetCurrency, setFxTargetCurrency] = useState<string>("");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [triggerFxHistory] = useLazyGetFxHistoryQuery();
  const [saveMultiMatch, { isLoading: isSaving }] =
    useSaveUncategorizedMultiMatchMutation();
  const [fxModalOpen, setFxModalOpen] = useState(false);
  const [fxTitle, setFxTitle] = useState("");
  const [fxRows, setFxRows] = useState<
    {
      from: string;
      to: string;
      rate: string;
      editedRate?: string;
      uncategorizedId?: number;
      description?: string;
    }[]
  >([]);
  const [selectedPreviewRow, setSelectedPreviewRow] = useState<any | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // ---------- Currency helpers ----------
  const extractCurrencyCode = (val?: string) => val?.split(" - ")[1] ?? "";

  const getUncatCurrencies = () =>
    selectedUncat.map((u) => extractCurrencyCode(u?.account?.accountCurrency));

  const areAllSameCurrency = (currencies: string[]) =>
    currencies.length > 0 && currencies.every((c) => c === currencies[0]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "info" as "success" | "error" | "info" | "warning",
  });

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  const amountType = moneyDirection === "in" ? "credit" : "debit";
  const accountCurrency = accountCurrencyData?.split(" - ")[1] ?? "";

  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";

  const [data, setData] = useState<any>(null);
  const [getMultiMatch] = useGetMultiMatchMutation();

  // Invoice preview
  const { data: invoiceData } = useGetInvoiceByIdPreviewQuery(
    selectedPreviewRow?.type === "Invoice"
      ? selectedPreviewRow?.transactionTypeId || selectedPreviewRow?.id
      : skipToken,
  );

  // Bill preview
  const { data: billData } = useGetBillByIdPreviewQuery(
    selectedPreviewRow?.type === "Bill"
      ? selectedPreviewRow?.transactionTypeId || selectedPreviewRow?.id
      : skipToken,
  );

  // Invoice payments
  const { data: invoicePayments } = useGetAllPaymentsQuery(
    selectedPreviewRow?.type === "Invoice"
      ? selectedPreviewRow?.transactionTypeId || selectedPreviewRow?.id
      : skipToken,
  );

  // Bill payments
  const { data: billPayments } = useGetBillPaymentsQuery(
    selectedPreviewRow?.type === "Bill"
      ? selectedPreviewRow?.transactionTypeId || selectedPreviewRow?.id
      : skipToken,
  );

  const previewData = {
    type: selectedPreviewRow?.type,
    mainData: selectedPreviewRow?.type === "Invoice" ? invoiceData : billData,
    payments: selectedPreviewRow?.type === "Invoice" ? invoicePayments : billPayments,
  };

  const getData = async () => {
    if (selectedUncat.length > 0) {
      try {
        const res = await getMultiMatch({
          data: selectedUncat.map((item) => ({
            uncategorizedId: item.id,
            amount: item.credit > 0 ? item.credit : item.debit,
            amountType: item.credit > 0 ? "credit" : "debit",
          })),
        }).unwrap();
        setData(res.data);
      } catch (error: any) {
        console.error(error);
      }
    }
  };

  useEffect(() => {
    if (isOpen && selectedUncat.length > 0) getData();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedRowId(null);
      setSelectedPreviewRow(null);
      setPreviewOpen(false);
    }
  }, [isOpen]);

  const relevantMatches = data?.relevantMatches || [];
  const otherMatches = data?.otherMatches || [];

  const resolveFxRate = async (billCurrency: string, billDate: string) => {
    const uncatCurrencies = getUncatCurrencies();
    const allSame = areAllSameCurrency(uncatCurrencies);

    let rows: {
      from: string;
      to: string;
      rate: string;
      editedRate?: string;
      uncategorizedId?: number;
    }[] = [];

    if (allSame) {
      const uncatCurrency = uncatCurrencies[0];
      rows = selectedUncat.map((u) => ({
        from: uncatCurrency,
        to: billCurrency,
        rate: "1.00",
        editedRate: "1.00",
        uncategorizedId: u.id,
      }));
      setFxRows(rows);
      if (uncatCurrency !== billCurrency) {
        const fx = await triggerFxHistory({
          from: uncatCurrency,
          to: billCurrency,
          date: dayjs(billDate).format("YYYY-MM-DD"),
        }).unwrap();

        rows = selectedUncat.map((u) => ({
          from: uncatCurrency,
          to: billCurrency,
          rate: fx?.data?.rate?.toString() ?? "1.00",
          editedRate: fx?.data?.rate?.toString() ?? "1.00",
          uncategorizedId: u.id,
        }));
        setFxRows(rows);
        setFxModalOpen(true);
      }
    } else {
      const fx = await triggerFxHistory({
        from: uncatCurrencies,
        to: billCurrency,
        date: dayjs(billDate).format("YYYY-MM-DD"),
      }).unwrap();

      const ratesMap = fx?.data?.rate as Record<string, string> | undefined;

      const rows = selectedUncat.map((u) => {
        const fromCurrency = u.account.accountCurrency.split(" - ")[1];
        const rateStr = ratesMap?.[fromCurrency] ?? "1.00";

        return {
          from: fromCurrency,
          to: billCurrency,
          rate: parseFloat(rateStr).toFixed(2),
          editedRate: parseFloat(rateStr).toFixed(2),
          uncategorizedId: u.id,
        };
      });

      setFxRows(rows);
      setFxModalOpen(true);
    }

    return {
      fxRate: rows[0]?.rate ?? "1.00",
      originalFxRate: rows[0]?.rate ?? "1.00",
    };
  };

  const resolveType = (item: any): "Invoice" | "Bill" =>
    item.transactionTypeName === "invoice" ? "Invoice" : "Bill";

  const tableData = [
    ...relevantMatches.map((item: any) => {
      const type = resolveType(item);
      const currency = item.invoiceCurrency ?? item.billCurrency;
      const total = item.invoiceTotal ?? item.billTotal;
      return {
        id: item.id,
        transactionTypeId: item.transactionTypeId,
        name: `${type} #${item.invoiceNo ?? item.billNo}`,
        type,
        total: formatCurrencyByCommaSeparation(
          total || 0,
          commaSeparation,
          currency?.split(" - ")[0],
        ),
        amount: formatCurrencyByCommaSeparation(
          item.balanceDue || 0,
          commaSeparation,
          currency?.split(" - ")[0],
        ),
        date: item.invoiceDate ?? item.billDate,
        isRelevant: true,
        contactName: item.contact?.name || "-",
        currency: extractCurrencyCode(currency),
        currencySymbol: currency?.split(" - ")[0] ?? "",
      };
    }),
    ...otherMatches.map((item: any) => {
      const type = resolveType(item);
      const currency = item.invoiceCurrency ?? item.billCurrency;
      const total = item.invoiceTotal ?? item.billTotal;
      return {
        id: item.id,
        transactionTypeId: item.transactionTypeId,
        name: `${type} #${item.invoiceNo ?? item.billNo}`,
        type,
        total: formatCurrencyByCommaSeparation(
          total || 0,
          commaSeparation,
          currency?.split(" - ")[0],
        ),
        amount: formatCurrencyByCommaSeparation(
          item.balanceDue || 0,
          commaSeparation,
          currency?.split(" - ")[0],
        ),
        date: item.invoiceDate ?? item.billDate,
        isRelevant: false,
        contactName: item.contact?.name || "-",
        currency: extractCurrencyCode(currency),
        currencySymbol: currency?.split(" - ")[0] ?? "",
      };
    }),
  ];

  const handleAddMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchor(event.currentTarget);
  };
  const handleAddMenuClose = () => setMenuAnchor(null);

  const handleRadioChange = async (id: number) => {
    const row = tableData.find((r) => r.id === id);
    if (!row) return;

    try {
      setSelectedRowId(row.id);
      setFxTargetCurrency(row.currencySymbol);
      setFxTitle(`${row.name} for ${row.contactName}`);
      await resolveFxRate(row.currency, row.date);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Unable to fetch FX rate.",
        color: "error",
      });
    }
  };

  const handleRowClick = (row: any) => {
    setSelectedPreviewRow(row);
    setPreviewOpen(true);
  };

  const canSave = !isSaving;

  const handleAddOption = (option: string) => {
    if (option === "Invoice") setInvoiceOpen(true);
    else if (option === "Bill") setBillOpen(true);
    handleAddMenuClose();
  };

  const handleSave = async () => {
    if (!canSave) return;

    try {
      const uncategorizedData = fxRows.map((row, index) => {
        const uncatAmount =
          selectedUncat[index]?.credit > 0
            ? selectedUncat[index].credit
            : selectedUncat[index].debit;
        const fxRate = parseFloat(row.editedRate ?? row.rate) || 1;
        const convertedAmount = (uncatAmount || 0) * fxRate;

        return {
          uncategorizedId: row.uncategorizedId ?? selectedUncat[index]?.id,
          amountInAccCurr: (uncatAmount || 0).toString(),
          fxRate,
          originalFxRate: parseFloat(row.rate),
          convertedAmount: convertedAmount.toFixed(2),
          description: row.description,
        };
      });

      const selectedTransaction = tableData.find((r) => r.id === selectedRowId);
      if (!selectedTransaction || !selectedTransaction.transactionTypeId) {
        setSnackbar({
          open: true,
          message: "Please select an Invoice/Bill to match.",
          color: "error",
        });
        return;
      }

      const transactionTypeId = selectedTransaction.transactionTypeId;

      await saveMultiMatch({
        transactionTypeId,
        amountType: amountType,
        uncategorizedData,
      }).unwrap();

      setSnackbar({
        open: true,
        message: "Match saved successfully.",
        color: "success",
      });
      refetchTransactCount?.();
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      setSnackbar({
        open: true,
        message: "Failed to save match",
        color: "error",
      });
    }
  };

  const columns = [
    { field: "select", headerName: "Select", width: "60px" },
    { field: "date", headerName: "Date", headerAlign: "left" as const },
    { field: "contactName", headerName: "To", headerAlign: "left" as const },
    {
      field: "name",
      headerName: "Invoice/Bill No",
      headerAlign: "left" as const,
    },
    {
      field: "total",
      headerName: "Total",
      headerAlign: "right" as const,
      align: "right" as const,
    },
    {
      field: "amount",
      headerName: "Balance Due",
      headerAlign: "right" as const,
      align: "right" as const,
    },
    { field: "relevant", headerName: "", width: "50px" },
  ];

  const tableRows = tableData.map((row) => ({
    id: row.id,
    select: (
      <RadioButton
        checked={selectedRowId === row.id}
        onChange={() => handleRadioChange(row.id)}
        value={row.id}
        name="multi-match-radio"
      />
    ),
    date: formatDateShort(row.date),
    contactName: row.contactName,
    name: (
      <Typography
        sx={{
          cursor: "pointer",
          color: theme.palette.primary.main,
          textDecoration: "underline",
          fontWeight: 500,
        }}
        onClick={() => handleRowClick(row)}
      >
        {row.name}
      </Typography>
    ),
    total: (
      <Box
        sx={{
          textAlign: "right",
          width: "100%",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {row.total}
      </Box>
    ),
    amount: (
      <Box
        sx={{
          textAlign: "right",
          width: "100%",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {row.amount}
      </Box>
    ),
    relevant: (
      <Tooltip title={row.isRelevant ? "Relevant" : "Not Relevant"}>
        <IconButton size="small" disabled>
          {row.isRelevant ? (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 150,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "success.light",
              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
              boxShadow: theme.shadows[1],
              px: 1,
            }}>
              <CheckCircle sx={{ color: "success.main", fontSize: 18 }} />
              <Typography sx={{ color: "success.main", fontWeight: 500 }}>Relevant</Typography>
            </Box>
          ) : (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 150,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "error.light",
              background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
              boxShadow: theme.shadows[1],
              px: 1,
            }}>
              <CheckCircle sx={{ color: "error.main", fontSize: 18 }} />
              <Typography sx={{ color: "error.main", fontWeight: 500 }}>Non Relevant</Typography>
            </Box>
          )}
        </IconButton>
      </Tooltip>
    ),
  }));

  return (
    <>
      <ModalElement
        open={isOpen}
        onClose={onClose}
        title="Multi Match"
        maxWidth="xl"
        draggable
        headerActions={
          <Box display={"flex"} width={"100%"} sx={{ justifyContent: "end" }}>
            <PrimaryButton
              onClick={handleAddMenuOpen}
              endIcon={
                <KeyboardArrowDown
                  sx={{
                    transform: menuAnchor
                      ? "rotate(180deg)"
                      : "rotate(0)",
                    transition: "transform 0.2s ease",
                  }}
                />
              }
            >
              Add
            </PrimaryButton>
            <MenuAtom
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onCloseAll={handleAddMenuClose}
              items={
                moneyDirection === "in"
                  ? [{ label: "Invoice", onClick: () => handleAddOption("Invoice") }]
                  : [{ label: "Bill", onClick: () => handleAddOption("Bill") }]
              }
            />
          </Box>
        }
      >
        <MatchTableAtom
          columns={columns}
          rows={tableRows}
          tableHeight="50vh"
        />

        <Box
          sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", mt: 3 }}
        >
          <span>
            <PrimaryButton onClick={handleSave} disabled={!canSave}>
              {isSaving ? "Saving..." : "Save"}
            </PrimaryButton>
          </span>
        </Box>
      </ModalElement>

      <InvoiceModal
        open={invoiceOpen}
        mode="Make"
        onClose={() => setInvoiceOpen(false)}
        onSuccess={() => setInvoiceOpen(false)}
        showSnackBar={showSnack}
      />
      <BillModal
        open={billOpen}
        mode="Make"
        onClose={() => setBillOpen(false)}
        onSuccess={() => setBillOpen(false)}
        showSnackBar={showSnack}
      />

      {/* FX Modal */}
      <ModalElement
        open={fxModalOpen}
        onClose={() => setFxModalOpen(false)}
        title={`Forex details for payments - ${fxTitle}`}
        maxWidth="md"
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
              fontWeight: 600,
              borderBottom: `1px solid ${theme.palette.divider}`,
              py: 1,
            }}
          >
            <span>Date</span>
            <span>Account Name</span>
            <span>Payment Amount</span>
            <span>FX Rate</span>
            <span>Converted Amount</span>
          </Box>

          {fxRows.map((row, index) => {
            const paymentAmount =
              selectedUncat[index]?.credit || selectedUncat[index]?.debit || 0;
            const fxRate = parseFloat(row.editedRate ?? row.rate) || 1;
            const convertedAmount = paymentAmount * fxRate;
            return (
              <Box
                key={index}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
                  alignItems: "center",
                  py: 1,
                  borderBottom:
                    index !== fxRows.length - 1
                      ? `1px solid ${theme.palette.divider}`
                      : "none",
                }}
              >
                <Typography>
                  {formatDateShort(selectedUncat[index]?.date) || "N/A"}
                </Typography>
                <Typography>
                  {selectedUncat[index]?.account?.accountName || "-"}
                </Typography>
                <Typography>
                  {formatCurrencyByCommaSeparation(
                    paymentAmount,
                    commaSeparation,
                    selectedUncat[index]?.account?.accountCurrency.split(" - ")[0] || accountCurrency,
                  )}
                </Typography>
                <TextFieldElement
                  label=""
                  value={row.editedRate ?? row.rate}
                  type="number"
                  onChange={(e) => {
                    const val = e.target.value;
                    setFxRows((prev) =>
                      prev.map((r, i) =>
                        i === index ? { ...r, editedRate: val } : r,
                      ),
                    );
                  }}
                  fullWidth
                />
                <Typography textAlign={"right"}>
                  {formatCurrencyByCommaSeparation(
                    convertedAmount,
                    commaSeparation,
                    fxTargetCurrency.split(" - ")[0] || accountCurrency,
                  )}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <PrimaryButton
            onClick={() => {
              setFxRows((prev) =>
                prev.map((r) => ({ ...r, rate: r.editedRate ?? r.rate })),
              );
              setFxModalOpen(false);
            }}
          >
            Submit
          </PrimaryButton>
        </Box>
      </ModalElement>

      {/* Invoice/Bill Preview Modal */}
      {previewOpen && selectedPreviewRow && (
        <ModalElement
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={`${selectedPreviewRow?.type}`}
          maxWidth="lg"
          draggable
        >
          {previewData && (
            <ViewInvoiceBill
              selectedRow={selectedPreviewRow}
              data={previewData.mainData}
              paymentData={previewData.payments}
            />
          )}
        </ModalElement>
      )}

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          autoClose={3000}
        />
      )}
    </>
  );
}