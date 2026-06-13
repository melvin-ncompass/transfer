import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  useTheme,
  Tooltip,
  IconButton,
  alpha,
} from "@mui/material";
import { CheckCircle, Cancel, Add, AutoAwesome } from "@mui/icons-material";
import { Checkbox } from "../../../../../../components/atom/check-box";
import { PrimaryButton } from "../../../../../../components/atom/button/PrimaryButton";
import { MatchTableAtom } from "../../../../../../components/tables/standard-table/MatchTableAtom";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import InvoiceModal from "../../../modals/InvoiceModal";
import BillModal from "../../../modals/BillModal";
import {
  useGetUncategorizedMatchQuery,
  useSaveUncategorizedMatchMutation,
} from "../api/match.api";
import CustomCircularProgress from "../../../../../../components/atom/circular-progress/CircularProgress";
import { useLazyGetFxHistoryQuery } from "../../../../transact/api/fx.api";
import {
  formatCurrencyByCommaSeparation,
  formatDateShort,
  formatNumberForTyping,
  parseNumberForTyping,
} from "../../../../../../utils/numberFormatter";
import dayjs from "dayjs";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { Chip } from "../../../../../../components/atom/chips";
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
import {
  ToggleButtonAtom,
  type ToggleOption,
} from "../../../../../../components/atom/toggle-button-atom/ToggleButtonAtom";
import JournalMatchTab from "./JournalMatchTab";
import { PrimaryIconButton } from "../../../../../../components/atom/button";

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  moneyDirection?: "in" | "out";
  total?: number;
  uncatId?: string;
  accountCurrencyData?: string;
  description?: string;
  showSnackbar: (message: string, color: "success" | "error") => void;
  refetchTransactCount?: () => void;
}

interface ExpandedRow {
  number: string;
  fxRate: string;
  originalFxRate: string;
  convertedAmount: string;
  transactionTypeId?: string;
}

type TabType = "MATCH" | "JOURNAL";

export default function MatchModal({
  isOpen,
  onClose,
  moneyDirection,
  uncatId,
  total,
  accountCurrencyData,
  showSnackbar,
  description,
  refetchTransactCount,
}: MatchModalProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<number>>(
    new Set(),
  );
  const [expandedRows, setExpandedRows] = useState<Record<number, ExpandedRow>>(
    {},
  );
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("MATCH");
  const [billOpen, setBillOpen] = useState(false);
  const [triggerFxHistory] = useLazyGetFxHistoryQuery();
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [matchDescription, setMatchDescription] = useState(description);
  const [saveUncategorizedMatch, { isLoading: isSaving }] =
    useSaveUncategorizedMatchMutation();

  const amountType = moneyDirection === "in" ? "debit" : "credit";
  const accountCurrency = accountCurrencyData?.split(" - ")[1] ?? "";
  const tabOptions: ToggleOption<TabType>[] = [
    { value: "MATCH", label: "Match" },
    { value: "JOURNAL", label: "Journal" },
  ];

  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const { data, isLoading, isFetching, refetch } =
    useGetUncategorizedMatchQuery(
      {
        amount: total?.toString() || "0",
        amountType,
        uncategorizedId: Number(uncatId),
      },
      {
        skip: !isOpen || !uncatId,
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        refetchOnReconnect: true,
      },
    );

  // Invoice preview
  const { data: invoiceData } = useGetInvoiceByIdPreviewQuery(
    selectedRow?.type === "Invoice"
      ? selectedRow?.transactionTypeId || selectedRow?.id
      : skipToken,
  );

  // Bill preview
  const { data: billData } = useGetBillByIdPreviewQuery(
    selectedRow?.type === "Bill"
      ? selectedRow?.transactionTypeId || selectedRow?.id
      : skipToken,
  );

  // Invoice payments
  const { data: invoicePayments } = useGetAllPaymentsQuery(
    selectedRow?.type === "Invoice"
      ? selectedRow?.transactionTypeId || selectedRow?.id
      : skipToken,
  );

  // Bill payments
  const { data: billPayments } = useGetBillPaymentsQuery(
    selectedRow?.type === "Bill"
      ? selectedRow?.transactionTypeId || selectedRow?.id
      : skipToken,
  );

  const previewData = {
    type: selectedRow?.type,
    mainData: selectedRow?.type === "Invoice" ? invoiceData : billData,
    payments: selectedRow?.type === "Invoice" ? invoicePayments : billPayments,
  };

  const relevantMatches = data?.data?.relevantMatches || [];
  const otherMatches = data?.data?.otherMatches || [];
  const aiMatches = data?.data?.aiMatches || [];

  const extractCurrencyCode = (currencyString?: string): string => {
    if (!currencyString) return "USD";
    const parts = currencyString.split(" - ");
    return parts[1]?.trim() || "USD";
  };

  /** API rows may omit invoiceCurrency / billCurrency; avoid .split on undefined. */
  const resolveMatchRowCurrencyDisplay = (item: any): string => {
    const forType =
      amountType === "credit" ? item.invoiceCurrency : item.billCurrency;
    const raw =
      forType ??
      item.invoiceCurrency ??
      item.billCurrency ??
      data?.data?.accountCurrency ??
      accountCurrencyData ??
      "";
    return typeof raw === "string" ? raw : "";
  };

  const currencySymbolFromDisplay = (display: string): string => {
    if (!display) return "";
    const [sym] = display.split(" - ");
    return sym?.trim() ?? "";
  };

  const tableData = [
    ...aiMatches.map((item: any, index: number) => {
      const currencyDisplay = resolveMatchRowCurrencyDisplay(item);
      const symbol = currencySymbolFromDisplay(currencyDisplay);
      return {
        rowKey: index,
        id: item.id,
        transactionTypeId: item.transactionTypeId,
        name:
          amountType === "credit"
            ? `Invoice #${item.invoiceNo}`
            : `Bill #${item.billNo}`,
        type: amountType === "credit" ? "Invoice" : "Bill",
        total: formatCurrencyByCommaSeparation(
          item.roundoffTotal ?? 0,
          commaSeparation,
          symbol,
        ),
        amount: formatCurrencyByCommaSeparation(
          item.balanceDue ?? 0,
          commaSeparation,
          symbol,
        ),
        date: amountType === "credit" ? item.invoiceDate : item.billDate,
        isRelevant: true,
        isAiMatch: true,
        contactName: item.contact?.name || "-",
        currency: extractCurrencyCode(currencyDisplay),
        currencySymbol: symbol,
      };
    }),
    ...relevantMatches.map((item: any, index: number) => {
      const currencyDisplay = resolveMatchRowCurrencyDisplay(item);
      const symbol = currencySymbolFromDisplay(currencyDisplay);
      return {
        rowKey: aiMatches.length + index,
        id: item.id,
        transactionTypeId: item.transactionTypeId,
        name:
          amountType === "credit"
            ? `Invoice #${item.invoiceNo}`
            : `Bill #${item.billNo}`,
        type: amountType === "credit" ? "Invoice" : "Bill",
        total: formatCurrencyByCommaSeparation(
          item.roundoffTotal ?? 0,
          commaSeparation,
          symbol,
        ),
        amount: formatCurrencyByCommaSeparation(
          item.balanceDue ?? 0,
          commaSeparation,
          symbol,
        ),
        date: amountType === "credit" ? item.invoiceDate : item.billDate,
        isRelevant: true,
        isAiMatch: false,
        contactName: item.contact?.name || "-",
        currency: extractCurrencyCode(currencyDisplay),
        currencySymbol: symbol,
      };
    }),
    ...otherMatches.map((item: any, index: number) => {
      const currencyDisplay = resolveMatchRowCurrencyDisplay(item);
      const symbol = currencySymbolFromDisplay(currencyDisplay);
      return {
        rowKey: aiMatches.length + relevantMatches.length + index,
        id: item.id,
        transactionTypeId: item.transactionTypeId,
        name:
          amountType === "credit"
            ? `Invoice #${item.invoiceNo}`
            : `Bill #${item.billNo}`,
        type: amountType === "credit" ? "Invoice" : "Bill",
        total: formatCurrencyByCommaSeparation(
          item.roundoffTotal ?? 0,
          commaSeparation,
          symbol,
        ),
        amount: formatCurrencyByCommaSeparation(
          item.balanceDue ?? 0,
          commaSeparation,
          symbol,
        ),
        date: amountType === "credit" ? item.invoiceDate : item.billDate,
        isRelevant: false,
        isAiMatch: false,
        contactName: item.contact?.name || "-",
        currency: extractCurrencyCode(currencyDisplay),
        currencySymbol: symbol,
      };
    }),
  ];

  const handleAddMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleCheckboxChange = async (rowKey: number) => {
    const newSelected = new Set(selectedRowKeys);
    const row = tableData.find((r) => r.rowKey === rowKey);
    if (!row) return;

    const isSameCurrency = row.currency === accountCurrency;

    if (newSelected.has(rowKey)) {
      newSelected.delete(rowKey);
      const updated = { ...expandedRows };
      delete updated[rowKey];
      setExpandedRows(updated);
    } else {
      newSelected.add(rowKey);
      let fxRate = "1.00";
      let originalFxRate = "1.00";

      if (!isSameCurrency) {
        try {
          const formattedDate = dayjs(row.date).format("YYYY-MM-DD");
          const fxResponse = await triggerFxHistory({
            from: accountCurrency,
            to: row.currency,
            date: formattedDate,
          }).unwrap();

          const rateObj = fxResponse?.data?.rate;
          const fetchedRate =
            rateObj?.[accountCurrency] ?? rateObj?.[row.currency];
          if (fetchedRate != null && fetchedRate !== "") {
            fxRate = String(fetchedRate);
            originalFxRate = String(fetchedRate);
          }
        } catch (err) {
          console.error("FX history fetch failed:", err);
          showSnackbar?.("Unable to fetch FX rate.", "error");
        }
      }

      setExpandedRows((prev) => ({
        ...prev,
        [rowKey]: {
          number: "",
          fxRate,
          originalFxRate,
          convertedAmount: "0.00",
          transactionTypeId: row.transactionTypeId || null,
        },
      }));
    }

    setSelectedRowKeys(newSelected);
  };

  const handleRowClick = (row: any) => {
    setSelectedRow(row);
    setPreviewOpen(true);
  };

  const handleFieldChange = (
    rowKey: number,
    field: keyof ExpandedRow,
    value: string,
  ) => {
    const rowCurrency =
      tableData.find((r) => r.rowKey === rowKey)?.currencySymbol ||
      accountCurrency;

    setExpandedRows((prev) => {
      const updated = { ...prev[rowKey], [field]: value };

      const amountVal =
        parseFloat((updated.number || "0").replace(/,/g, "")) || 0;
      const fxRate = parseFloat((updated.fxRate || "1").replace(/,/g, "")) || 1;
      const convertedVal = amountVal * fxRate;

      return {
        ...prev,
        [rowKey]: {
          ...updated,
          convertedAmount: formatCurrencyByCommaSeparation(
            convertedVal,
            commaSeparation,
            rowCurrency,
          ),
        },
      };
    });
  };

  const handleAddOption = (option: string) => {
    if (option === "Invoice") setInvoiceOpen(true);
    else if (option === "Bill") setBillOpen(true);
    handleAddMenuClose();
  };

  const handleSave = async () => {
    if (!canSave) return;

    const splitData: Record<string, any> = {};
    Array.from(selectedRowKeys).forEach((rowKey) => {
      const rowData = tableData.find((r) => r.rowKey === rowKey);
      const expanded = expandedRows[rowKey];
      if (rowData && expanded) {
        const fxRateNum =
          parseFloat(String(expanded.fxRate || "1").replace(/,/g, "")) || 1;
        const originalFxRateNum =
          parseFloat(
            String(expanded.originalFxRate || "1").replace(/,/g, ""),
          ) || 1;
        splitData[rowData.id] = {
          transactionTypeId: expanded.transactionTypeId,
          fxRate: fxRateNum,
          originalFxRate: originalFxRateNum,
          convertedAmount: (
            parseFloat(expanded.convertedAmount.replace(/[^0-9.-]/g, "")) || 0
          ).toString(),
          amountInAccCurr: expanded.number.replace(/,/g, ""),
        };
      }
    });

    try {
      const response = await saveUncategorizedMatch({
        uncategorizedId: uncatId,
        splitData,
        description: matchDescription,
      }).unwrap();

      const transactionId = String(response.data?.transactionTypeId || "");
      const paymentId = String(response.data?.paymentId || "");
      const transactionType = response.data?.transactionTypeName || "transfer";

      showSnackbar?.("Match saved successfully.", "success");
      navigate(
        `/books/transact/home?tab=transact&highlightId=${transactionId}&transactionType=${transactionType}&paymentId=${paymentId}`,
      );
      refetchTransactCount?.();
      onClose();
    } catch (err: unknown) {
      console.error("Save failed:", err);
      let message = "Failed to save match.";

      if (typeof err === "object" && err !== null) {
        const e = err as any;

        message =
          e?.data?.message ||
          e?.data?.error ||
          e?.error ||
          message;
      }

      showSnackbar?.(message, "error");
    }
  };

  const selectedTotal = Array.from(selectedRowKeys).reduce((sum, rowKey) => {
    const val = expandedRows[rowKey]?.number || "0";
    const numVal = parseFloat(val.replace(/,/g, "")) || 0;
    return sum + numVal;
  }, 0);

  const isAmountMatched = Math.abs(selectedTotal - (total || 0)) < 0.01;

  const allRowsHaveAmount = Array.from(selectedRowKeys).every(
    (rowKey) =>
      !!expandedRows[rowKey]?.number &&
      parseFloat(expandedRows[rowKey].number) > 0,
  );

  const canSave = isAmountMatched && allRowsHaveAmount && !isSaving;

  const columns = [
    { field: "select", headerName: "Select", width: "60px" },
    { field: "date", headerName: "Date", headerAlign: "left" as const },
    { field: "contactName", headerName: "To", headerAlign: "left" as const },
    {
      field: "name",
      headerName: moneyDirection == "out" ? "Invoice No" : "Bill No",
      headerAlign: "left" as const,
    },
    {
      field: "Total",
      headerName: moneyDirection == "out" ? "Invoice Total" : "Bill Total",
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
    id: row.rowKey,
    select: (
      <Checkbox
        checked={selectedRowKeys.has(row.rowKey)}
        onChange={() => handleCheckboxChange(row.rowKey)}
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
        onClick={() => {
          handleRowClick(row);
        }}
      >
        {row.name}
      </Typography>
    ),
    Total: (
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{row.total}</span>
    ),
    amount: (
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{row.amount}</span>
    ),
    relevant: (
      <Tooltip
        title={
          row.isAiMatch
            ? "AI Suggested"
            : row.isRelevant
              ? "Relevant"
              : "Not Relevant"
        }
      >
        <IconButton size="small" disabled>
          {row.isAiMatch ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                minWidth: 150,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "info.light",
                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                boxShadow: theme.shadows[1],
                px: 1,
              }}
            >
              <AutoAwesome sx={{ color: "info.main", fontSize: 18 }} />
              <Typography sx={{ color: "info.main", fontWeight: 500 }}>
                AI Suggested
              </Typography>
            </Box>
          ) : row.isRelevant ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                minWidth: 150,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "success.light",
                background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                boxShadow: theme.shadows[1],
                px: 1,
              }}
            >
              <CheckCircle sx={{ color: "success.main", fontSize: 18 }} />
              <Typography sx={{ color: "success.main", fontWeight: 500 }}>
                Relevant
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                minWidth: 150,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "error.light",
                background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
                boxShadow: theme.shadows[1],
                px: 1,
              }}
            >
              <CheckCircle sx={{ color: "error.main", fontSize: 18 }} />
              <Typography sx={{ color: "error.main", fontWeight: 500 }}>
                Non Relevant
              </Typography>
            </Box>
          )}
        </IconButton>
      </Tooltip>
    ),
  }));

  const renderExpandedRow = (row: any) => {
    const rowKey = row.id;
    const rowData = tableData.find((r) => r.rowKey === rowKey);
    if (!rowData) return null;

    const isSameCurrency = rowData.currency === accountCurrency;

    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 2,
          width: "100%",
        }}
      >
        <TextFieldElement
          label={`Amount (${accountCurrencyData?.split(" - ")[0] ?? ""})`}
          value={formatNumberForTyping(
            expandedRows[rowKey]?.number,
            commaSeparation,
          )}
          onChange={(e) => {
            const raw = parseNumberForTyping(e.target.value);
            handleFieldChange(rowKey, "number", raw);
          }}
          placeholder="Enter Amount"
          fullWidth
          sx={{
            backgroundColor: theme.palette.background.paper,
          }}
        />

        <TextFieldElement
          label="FX Rate"
          value={expandedRows[rowKey]?.fxRate || ""}
          onChange={(e) => handleFieldChange(rowKey, "fxRate", e.target.value)}
          type="number"
          placeholder="1.00"
          fullWidth
          disabled={isSameCurrency}
          helperText={
            expandedRows[rowKey]?.originalFxRate &&
            `Original Rate: ${expandedRows[rowKey]?.originalFxRate}`
          }
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            py: 1,
            // backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: "4px",
            fontSize: "0.875rem",
            minHeight: "40px",
            opacity: 1,
          }}
        >
          <span style={{ fontWeight: 500, color: theme.palette.text.primary }}>
            Converted Amount:
          </span>
          <span
            style={{
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            {expandedRows[rowKey]?.convertedAmount || "0.00"}
          </span>
        </Box>
      </Box>
    );
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedRowKeys(new Set());
      setExpandedRows({});
      setActiveTab("MATCH");
      setSelectedRow(null);
      setPreviewOpen(false);
    }
  }, [isOpen]);

  return (
    <>
      <ModalElement
        open={isOpen}
        onClose={onClose}
        title="Match"
        maxWidth="xl"
        draggable
        height={650}
      >
        {(isLoading || isFetching) && activeTab === "MATCH" ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "60vh",
            }}
          >
            <CustomCircularProgress size={40} />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: { xs: "flex-end", sm: "center" },
                justifyContent: "space-between",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    px: 2,
                    py: 1,
                    gap: 1,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    boxShadow: theme.shadows[1],
                    width: { xs: "100%", sm: "auto" },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {formatCurrencyByCommaSeparation(
                      total ?? 0,
                      commaSeparation,
                      accountCurrencyData?.split(" - ")[0] ?? "",
                    )}
                  </Typography>
                  <Chip
                    label={amountType === "credit" ? "Money in" : "Money out"}
                    size="small"
                    color={amountType === "credit" ? "success" : "error"}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                {activeTab === "MATCH" && (
                  <TextFieldElement
                    label="Description"
                    value={matchDescription}
                    onChange={(e) => setMatchDescription(e.target.value)}
                    fullWidth
                    sx={{ flex: 1 }}
                  />
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                {activeTab === "MATCH" && (
                  <>
                    <PrimaryIconButton
                      title={`Add ${moneyDirection === "out" ? "Invoice" : "Bill"}`}
                      onClick={handleAddMenuOpen}
                      icon={<Add />}
                      sx={{ width: 30, height: 30, mt: 0.5 }}
                    />
                    <MenuAtom
                      anchorEl={menuAnchor}
                      open={Boolean(menuAnchor)}
                      onCloseAll={handleAddMenuClose}
                      items={
                        moneyDirection === "out"
                          ? [
                            {
                              label: "Invoice",
                              onClick: () => handleAddOption("Invoice"),
                            },
                          ]
                          : [
                            {
                              label: "Bill",
                              onClick: () => handleAddOption("Bill"),
                            },
                          ]
                      }
                    />
                  </>
                )}

                <ToggleButtonAtom<TabType>
                  value={activeTab}
                  options={tabOptions}
                  onChange={(value) => setActiveTab(value)}
                />
              </Box>
            </Box>

            {activeTab === "MATCH" ? (
              <Box pt={1}>
                <MatchTableAtom
                  columns={columns}
                  rows={tableRows}
                  expandedContent={renderExpandedRow}
                  tableHeight="54vh"
                  expandedRowIds={Array.from(selectedRowKeys)}
                />
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    justifyContent: "flex-end",
                    mt: 2,
                  }}
                >
                  <Tooltip
                    title={
                      !allRowsHaveAmount
                        ? "Please enter amount for all selected rows."
                        : !isAmountMatched
                          ? "The total of selected amounts must match the uncategorized total."
                          : ""
                    }
                  >
                    <span>
                      <PrimaryButton onClick={handleSave} disabled={!canSave}>
                        {isSaving ? "Saving..." : "Save"}
                      </PrimaryButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            ) : (
              <JournalMatchTab
                isOpen={isOpen}
                uncatId={uncatId}
                total={total}
                amountType={amountType}
                showSnackbar={showSnackbar}
                refetchTransactCount={refetchTransactCount}
                onClose={onClose}
              />
            )}
          </>
        )}
      </ModalElement>

      {/* Sub-modals and snackbar */}
      <InvoiceModal
        open={invoiceOpen}
        mode="Make"
        onClose={() => {
          setInvoiceOpen(false);
        }}
        onSuccess={() => {
          refetch();
          setInvoiceOpen(false);
        }}
        showSnackBar={showSnackbar}
      />
      <BillModal
        open={billOpen}
        mode="Make"
        onClose={() => {
          setBillOpen(false);
        }}
        onSuccess={() => {
          refetch();
          setBillOpen(false);
        }}
        showSnackBar={showSnackbar}
      />

      {previewOpen && selectedRow && previewData && (
        <ModalElement
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={`${selectedRow?.type} `}
          maxWidth="lg"
          draggable
        >
          {previewData && (
            <ViewInvoiceBill
              selectedRow={selectedRow}
              data={previewData.mainData}
              paymentData={previewData.payments}
            />
          )}
        </ModalElement>
      )}
    </>
  );
}
