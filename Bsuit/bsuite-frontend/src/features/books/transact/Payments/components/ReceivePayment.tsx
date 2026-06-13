import { Box } from "@mui/system";
import {
  useMemo,
  useRef,
  useState,
  useEffect,
  type SetStateAction,
} from "react";
import dayjs from "dayjs";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { IconButton, InputAdornment } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { TextFieldElement } from "../../../../../components/atom/text-field/TextField";
import { TextAreaField } from "../../../../../components/atom/text-area-field";
import { DatePickerElement } from "../../../../../components/atom/date-picker";
import { PrimaryButton } from "../../../../../components/atom/button";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import CustomCircularProgress from "../../../../../components/atom/circular-progress/CircularProgress";
import {
  useCreatePaymentMutation,
  useEditPaymentMutation,
  useGetAllPaymentsQuery,
  useGetPaymentDetailsForInvoiceQuery,
} from "../../api/invoice.api";
import { useGetFxHistoryQuery } from "../../api/fx.api";
import {
  useDeleteJournalMutation,
  useGetDateRangeQuery,
} from "../../transactHome/api/transact.api";
import {
  extractCurrencyCode,
  getEffectiveFxRate,
  getFxTotal,
  isValidCode,
} from "../../transactHome/utils/transact.utils";
import type {
  HighlightedRow,
  StandardTableColumn,
} from "../../../../../types/types";
import {
  formatCurrencyByCommaSeparation,
  formatDateShort,
  formatNumberForTyping,
  parseNumberForTyping,
} from "../../../../../utils/numberFormatter";
import CheckIcon from "@mui/icons-material/Check";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import type { RefetchMetaDataTransactTable } from "../../transactHome/types/transact.types";
import { useAllAccountOptions } from "../../transactHome/hooks/useAllAccountOptions";
interface ReceivePaymentProps {
  transactionTypeId: string;
  mode?: "parent" | "transaction";
  initialPayment?: any;
  onSuccess?: (meta?: RefetchMetaDataTransactTable) => void;
  onPaymentCreated?: (paymentId: string) => void;
  onNotify?: (message: string, type: "success" | "error") => void;
  isEditReceivePayment: boolean;
  setIsEditReceivePayment: (temp: boolean) => void;
  fromCurrency: string;
  setHighlightedRow: React.Dispatch<SetStateAction<HighlightedRow>>;
}

export default function ReceivePayment({
  transactionTypeId,
  mode = "parent",
  initialPayment,
  onSuccess,
  onNotify,
  onPaymentCreated,
  setIsEditReceivePayment,
  isEditReceivePayment,
  fromCurrency,
  setHighlightedRow,
}: ReceivePaymentProps) {
  const [createPayment] = useCreatePaymentMutation();
  const [editPayment] = useEditPaymentMutation();
  const [deleteJournal] = useDeleteJournalMutation();
  const [form, setForm] = useState({
    paymentAccountId: "",
    paymentDate: dayjs(),
    paymentAmount: "",
    notes: "",
  });
  const [errors, setErrors] = useState({
    paymentAmount: false,
    paymentDate: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isDataReady, setIsDataReady] = useState(true);

  /* ---------------- FX STATE ---------------- */
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [originalFxRate, setOriginalFxRate] = useState<number | null>(null);
  const [manualFxRate, setManualFxRate] = useState("");
  const [isEditingFxRate, setIsEditingFxRate] = useState(false);

  const { data: dateRangeData } = useGetDateRangeQuery();

  const { data: invoices } = useGetAllPaymentsQuery(transactionTypeId, {
    skip: mode === "transaction",
  });

  const { data: headerData } = useGetHeaderDataQuery(undefined);

  /* -------- PREFILL FOR TRANSACTION MODE -------- */
  const { data: paymentDetails, isSuccess } =
    useGetPaymentDetailsForInvoiceQuery(
      { paymentId: initialPayment?.paymentId!, transactionTypeId },
      { skip: !initialPayment?.paymentId || mode !== "transaction" },
    );

  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const { accountGroups, accountsData: fullaccData } = useAllAccountOptions(
    null,
    !isEditReceivePayment,
    "full",
  );

  const formRef = useRef<HTMLDivElement>(null);

  const parseAccountValue = (v: string): string => {
    if (!v) return "";
    const match = v.match(/^account_(\d+)$/);
    return match ? match[1] : v;
  };

  const toAccountValue = (id: string) => (id ? `account_${id}` : "");

  const toCurrency = useMemo(() => {
    if (!form.paymentAccountId) return "";
    const acc = fullaccData?.data?.find(
      (a: any) => String(a.id) === String(form.paymentAccountId),
    );
    return acc?.accountCurrency || "";
  }, [form.paymentAccountId, fullaccData]);

  const fromCode = extractCurrencyCode(
    fromCurrency ||
    paymentDetails?.data?.paymentDetails?.[0]?.counterCurrency ||
    "",
  );
  const toCode = extractCurrencyCode(toCurrency);
  const toCurrencySymbol = toCurrency?.split(" - ")[0]?.trim();

  const shouldFetchFx =
    isValidCode(fromCode) &&
    isValidCode(toCode) &&
    fromCode !== toCode &&
    Boolean(form.paymentDate) &&
    !isEditReceivePayment;

  const showFxRow =
    Boolean(form.paymentAccountId) &&
    Boolean(fromCode) &&
    Boolean(toCode) &&
    fromCode !== toCode;

  // Final FX rate used for calculation
  const effectiveFxRate = useMemo(() => {
    return getEffectiveFxRate(manualFxRate, fxRate);
  }, [manualFxRate, fxRate]);

  // Converted total amount (RIGHT SIDE)
  const fxTotal = useMemo(() => {
    return getFxTotal(form.paymentAmount, effectiveFxRate);
  }, [form.paymentAmount, effectiveFxRate]);

  const isSaveDisabled = useMemo(() => {
    if (isSaving) return true;
    const hasRequired =
      Boolean(form.paymentAccountId) &&
      Boolean(form.paymentDate) &&
      Boolean(String(form.paymentAmount).trim());
    if (!editingPayment) {
      return !hasRequired;
    }
    const formAmount = Number(parseNumberForTyping(form.paymentAmount)) || 0;
    const sameAsEdited =
      String(form.paymentAccountId) === String(editingPayment.accountId) &&
      form.paymentDate.format("YYYY-MM-DD") ===
      dayjs(editingPayment.date).format("YYYY-MM-DD") &&
      Math.abs(formAmount - Number(editingPayment.amount)) < 1e-6 &&
      (form.notes || "").trim() === (editingPayment.notes || "").trim();
    return !hasRequired || sameAsEdited;
  }, [
    isSaving,
    form.paymentAccountId,
    form.paymentDate,
    form.paymentAmount,
    form.notes,
    editingPayment,
  ]);

  const { data: fxData, isLoading: fxLoading } = useGetFxHistoryQuery(
    {
      from: fromCode,
      to: toCode,
      date: form.paymentDate.format("YYYY-MM-DD"),
    },
    { skip: !shouldFetchFx },
  );

  /* -------- SAVE -------- */
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const payload = {
      transactionTypeId,
      paymentAccountId: Number(form.paymentAccountId),
      paymentDate: form.paymentDate.format("YYYY-MM-DD"),
      paymentAmount: form.paymentAmount,
      notes: form.notes,
      fxRate: Number(manualFxRate || fxRate || 1),
      originalFxRate: originalFxRate || 1,
    };

    try {
      // ================= EDIT =================
      if (isEditReceivePayment && editingPayment) {
        await editPayment({
          ...payload,
          paymentId: editingPayment.paymentId,
        }).unwrap();

        const meta = {
          newTransactionId: transactionTypeId,
          newTransactionName: "invoice_payment",
          newPaymentId: String(editingPayment.paymentId),
        };

        setHighlightedRow({
          key: "paymentId",
          value: String(editingPayment.paymentId),
          type: "edit",
        });

        onNotify?.("Payment updated successfully", "success");
        onSuccess?.(meta);

        resetForm();
        return;
      }

      // ================= CREATE =================
      const response = await createPayment(payload).unwrap();

      const newPaymentId = response?.data?.paymentId;

      const meta = {
        newTransactionId: transactionTypeId,
        newTransactionName: "invoice_payment",
        newPaymentId: String(newPaymentId),
      };

      setHighlightedRow({
        key: "paymentId",
        value: String(newPaymentId),
        type: "add",
      });

      onNotify?.("Payment received successfully", "success");
      onPaymentCreated?.(newPaymentId);
      onSuccess?.(meta);

      resetForm();
    } catch (err: any) {
      setIsSaving(false);

      onNotify?.(
        err?.data?.message || err?.message || "Something went wrong",
        "error",
      );

      return;
    }
  };

  /* -------- DELETE -------- */
  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    try {
      await deleteJournal({
        transactionTypeId,
        transactionTypeName: "invoice_payment",
        paymentId: selectedPayment.paymentId,
      }).unwrap();

      onNotify?.("Payment deleted successfully", "success");
      setOpenDeleteDialog(false);
      setSelectedPayment(null);
      resetForm();
      onSuccess?.();
    } catch (err: any) {
      onNotify?.(err?.data?.message, "error");
    }
  };

  /* -------- TABLE -------- */
  const paymentRows = useMemo(
    () =>
      invoices?.payments?.map((p: any) => ({
        id: String(p.paymentId),
        accountId: p.account?.id,
        date: formatDateShort(p.date),
        receivedIn: p.account?.accountName,
        amount: Number(p.counterCurrencyAmount),
        currency: p.counterCurrency?.split("-")?.[0]?.trim() || "",
        notes: p.description,
        paymentId: p.paymentId,
      })) || [],
    [invoices],
  );

  const paymentColumns: StandardTableColumn[] = [
    { id: "date", label: "Date" },
    { id: "receivedIn", label: "Received In" },

    {
      id: "amount",
      label: "Amount",
      align: "right",
      render: (row) =>
        formatCurrencyByCommaSeparation(
          row.amount.toFixed(2),
          commaSeparation,
          row.currency,
        ),
    },
    {
      id: "edit",
      label: "Edit",
      render: (row) => (
        <IconButton
          size="small"
          onClick={() => {
            setIsEditReceivePayment(true);
            setEditingPayment(row);
            setForm({
              paymentAccountId: String(row.accountId),
              paymentDate: dayjs(row.date),
              paymentAmount: row.amount.toString(),
              notes: row.notes || "",
            });
            formRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      ),
    },
    {
      id: "delete",
      label: "Delete",
      render: (row) => (
        <IconButton
          size="small"
          color="error"
          onClick={() => {
            setSelectedPayment(row);
            setOpenDeleteDialog(true);
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const resetForm = () => {
    setForm({
      paymentAccountId: "",
      paymentDate: dayjs(),
      paymentAmount: "",
      notes: "",
    });
    setErrors({ paymentAmount: false, paymentDate: false });
    // setIsEditReceivePayment(false);
    setEditingPayment(null);
    setIsSaving(false);
  };

  const balanceInfo = useMemo(() => {
    if (!invoices) return null;

    const rawCurrency = invoices?.currency || toCurrency;

    const currencySymbol = rawCurrency.split("-")[0].trim();

    const balanceDue = invoices?.balanceDue ?? 0;

    return {
      currencySymbol,
      balanceDue,
    };
  }, [invoices]);

  const fallbackCurrencySymbol =
    paymentDetails?.data?.paymentDetails?.[0]?.counterCurrency
      ?.split("-")?.[0]
      ?.trim() || "";

  const inputCurrencySymbol =
    balanceInfo?.currencySymbol || fallbackCurrencySymbol;

  // API FX rate arrived
  useEffect(() => {
    if (fxData?.data?.rate) {
      setOriginalFxRate(Number(fxData.data.rate[fromCode]));
      setFxRate(Number(fxData.data.rate[fromCode]));
      setManualFxRate("");
      setIsEditingFxRate(false);
    }
  }, [fxData?.data?.rate]);

  // Same currency → FX = 1
  useEffect(() => {
    if (fromCode && toCode && fromCode === toCode) {
      setOriginalFxRate(1);
      setFxRate(1);
      setManualFxRate("");
      setIsEditingFxRate(false);
    }
  }, [fromCode, toCode]);

  // Reset override when dependencies change
  useEffect(() => {
    setManualFxRate("");
    setIsEditingFxRate(false);
  }, [form.paymentDate, fromCode, toCode]);

  useEffect(() => {
    if (initialPayment?.paymentId && mode === "transaction") {
      setIsEditReceivePayment(true);
      setIsDataReady(false);
    }
  }, [initialPayment?.paymentId, mode]);

  // Hydrate form when data loads
  useEffect(() => {
    if (
      mode === "transaction" &&
      initialPayment &&
      isSuccess &&
      paymentDetails
    ) {
      setEditingPayment(initialPayment);

      setForm({
        paymentAccountId: String(
          paymentDetails?.data?.paymentDetails[0].account?.id,
        ),
        paymentDate: dayjs(paymentDetails?.data?.paymentDetails[0].date),
        paymentAmount:
          paymentDetails?.data?.paymentDetails[0].counterCurrencyAmount,
        notes: paymentDetails?.data?.paymentDetails[0].description || "",
      });
      setIsDataReady(true);
      setOriginalFxRate(
        Number(
          paymentDetails?.data?.paymentDetails[0].counterOriginalExchangeRate,
        ),
      );
      setFxRate(
        Number(paymentDetails?.data?.paymentDetails[0].counterExchangeRate),
      );
      setManualFxRate("");
      setIsEditingFxRate(false);
    }
  }, [mode, initialPayment, isSuccess, paymentDetails]);

  const invoiceHeader = useMemo(() => {
    if (!invoices?.invoiceNo) return null;
    const contactName = invoices?.contact?.name ?? "";
    return contactName
      ? `Invoice #${invoices.invoiceNo} from ${contactName}`
      : `Invoice #${invoices.invoiceNo}`;
  }, [invoices?.invoiceNo, invoices?.contact?.name]);

  if (isEditReceivePayment && !isDataReady) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <CustomCircularProgress size={40} />
      </Box>
    );
  }

  return (
    <>
      <Box ref={formRef} sx={{ p: 2, pt: 0 }}>
        {invoiceHeader && (
          <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
            {invoiceHeader}
          </Typography>
        )}
        {balanceInfo && (
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Balance Due:&nbsp;
            <Typography component="span" fontWeight={700} color="primary.main">
              {" "}
              {Number(balanceInfo.balanceDue) < 0 && "-"}{" "}
              {formatCurrencyByCommaSeparation(
                Math.abs(Number(balanceInfo.balanceDue)).toFixed(2),
                commaSeparation,
                balanceInfo.currencySymbol,
              )}
            </Typography>
          </Typography>
        )}

        <SingleSelectElement
          required
          label="Receive Payment In"
          value={toAccountValue(form.paymentAccountId)}
          onChange={(v) => {
            setForm((p) => ({
              ...p,
              paymentAccountId: parseAccountValue(v as string),
            }));
          }}
          options={accountGroups}
          fullWidth
        />

        <Box sx={{ display: "flex", gap: 2, my: 3 }}>
          <TextFieldElement
            required
            label="Amount"
            type="text"
            value={formatNumberForTyping(form.paymentAmount, commaSeparation)}
            onChange={(e) => {
              const raw = parseNumberForTyping(e.target.value);

              setForm((p) => ({
                ...p,
                paymentAmount: raw,
              }));
            }}
            width="50%"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    {inputCurrencySymbol}
                  </InputAdornment>
                ),
                style: { textAlign: "right" },
              },
            }}
          />

          <DatePickerElement
            label="Payment Date"
            required
            value={form.paymentDate}
            min={
              dateRangeData?.data?.openingBalanceExists
                ? dayjs(dateRangeData?.data.minDate)
                : null
            }
            error={errors.paymentDate}
            width="50%"
            onChange={(v) =>
              setForm((p) => ({ ...p, paymentDate: v ?? dayjs() }))
            }
          />
        </Box>

        {/* FX RATE SECTION */}
        {showFxRow && (
          <Box
            sx={{
              mb: 2,
              p: 1,
              backgroundColor: "#f9f9f9",
              border: "1px solid #e0e0e0",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 40,
            }}
          >
            {/* LEFT SIDE – FX RATE */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {fxLoading ? (
                <Typography variant="body2">Loading FX rate...</Typography>
              ) : isEditingFxRate ? (
                <>
                  <TextFieldElement
                    label="FX Rate"
                    type="number"
                    value={manualFxRate}
                    onChange={(e) => setManualFxRate(e.target.value)}
                    width="120px"
                  />
                  <IconButton
                    size="small"
                    onClick={() => setIsEditingFxRate(false)}
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </>
              ) : fxRate && fromCode !== toCode ? (
                <>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    1 {fromCode} = {effectiveFxRate} {toCode}
                  </Typography>

                  {/*  EDIT ICON */}
                  <IconButton
                    size="small"
                    onClick={() => {
                      setManualFxRate(effectiveFxRate.toString());
                      setIsEditingFxRate(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <Typography variant="body2">Same currency</Typography>
              )}
            </Box>

            {/* RIGHT SIDE – FX TOTAL */}
            {fxTotal !== null && (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatCurrencyByCommaSeparation(
                  fxTotal.toFixed(2),
                  commaSeparation,
                  toCurrencySymbol,
                )}
              </Typography>
            )}
          </Box>
        )}

        <TextAreaField
          width="100%"
          label="Notes"
          value={form.notes}
          onChange={(v) => setForm((p) => ({ ...p, notes: v }))}
        />

        <Box
          sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 2 }}
        >
          {isEditReceivePayment && mode !== "transaction" && (
            <PrimaryButton variant="outlined" onClick={resetForm}>
              Cancel
            </PrimaryButton>
          )}
          <PrimaryButton onClick={handleSave} disabled={isSaveDisabled}>
            Save
          </PrimaryButton>
        </Box>

        {mode === "parent" && (
          <>
            <Divider sx={{ my: 3 }} />
            <StandardTable
              columns={paymentColumns}
              rows={paymentRows}
            // highlightedRow={receivePaymentHighlightedRow}
            />
          </>
        )}

        <ConfirmDialog
          open={openDeleteDialog}
          title="Delete Payment"
          message="Are you sure you want to delete this transaction?"
          onClose={() => setOpenDeleteDialog(false)}
          onConfirm={handleDeletePayment}
          confirmColor="error"
        />
      </Box>
    </>
  );
}
