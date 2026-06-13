import { useMemo } from "react";
import { Box, Typography, Stack, Divider } from "@mui/material";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import { DenseTableAtom } from "../../../../../../components/tables/standard-table/DenseTableAtom";
import dayjs from "dayjs";
import type { StandardTableColumn } from "../../../../../../types/types";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { formatCurrencyByCommaSeparation } from "../../../../../../utils/numberFormatter";
import { round2 } from "../../../utils/calculations";
import ViewSkeleton from "./ViewSkeleton";

type ViewInvoiceBillProps = {
  selectedRow?: any;
  data: any;
  paymentData?: any;
  isLoadingData?: boolean;
};

const formatDate = (date?: string) =>
  date ? dayjs(date).format("MMM D, YYYY") : "-";

export default function ViewInvoiceBill({
  data,
  paymentData,
  selectedRow,
  isLoadingData,
}: ViewInvoiceBillProps) {
  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const currency = headerData?.data?.reportingCurrency?.split(" - ")[0];
  const companyCurrencyCode = headerData?.data?.reportingCurrency
    ?.split(" - ")[1]
    ?.trim();

  const formatCurrency = (value?: string | number, currencySymbol?: string) => {
    const symbol = currencySymbol ?? "";
    return `${symbol}${formatCurrencyByCommaSeparation(
      Number(value || 0),
      commaSeparation,
    )}`;
  };

  // const { data: billPaymentData, isSuccess: billPaymentsSuccess } =
  //   useGetBillPaymentsQuery(
  //     selectedRow?.transactionTypeId || selectedRow?.id!,
  //     {
  //       skip: !selectedRow?.id,
  //     },
  //   );

  // const { data: invoiceData, isSuccess: invoiceSuccess } =
  //   useGetInvoiceByIdQuery(selectedRow?.transactionTypeId || selectedRow?.id!, {
  //     skip: !selectedRow?.id,
  //   });

  // const { data: invoicePaymentData, isSuccess: invoicePaymentsSuccess } =
  //   useGetAllPaymentsQuery(selectedRow?.transactionTypeId || selectedRow?.id!, {
  //     skip: !selectedRow?.id,
  //   });

  // Select main invoice/bill data
  let invoice: any = null;
  let payments: any[] = [];

  invoice = data?.invoice ?? data?.bill;
  // Invoice API returns `payments`; Bill API returns `paymentHistory`
  payments = paymentData?.payments ?? paymentData?.paymentHistory ?? [];
  const fxRate = Number(invoice?.fxRate ?? data?.fxRate ?? 1);
  const hasFxConversion = fxRate !== 1;

  // Extract currency code from invoice/bill currency (before conditional return)
  const extractCurrencyCode = (currencyString: string): string => {
    if (!currencyString) return "";
    const match = currencyString.match(/\b([A-Z]{3})\b/);
    return match ? match[1] : "";
  };

  const selectedCurrencyCode = extractCurrencyCode(
    invoice?.currency ??
    invoice?.invoiceCurrency ??
    invoice?.billCurrency ??
    "",
  );

  const selectedCurrencySymbol = (
    invoice?.currency ??
    invoice?.invoiceCurrency ??
    invoice?.billCurrency ??
    ""
  )?.split(" - ")[0];

  const taxes = Array.isArray(data?.taxes)
    ? data.taxes
    : Array.isArray(invoice?.taxes)
      ? invoice.taxes
      : [];

  // Totals and TDS grouping (must be before early return to keep hook count stable)
  const totals = data?.totals ??
    invoice?.totals ?? {
    subTotal: 0,
    discount: 0,
    billTds: 0,
    finalTotal: invoice?.invoiceTotal ?? invoice?.billTotal ?? 0,
  };
  const itemTdsTotal = (invoice?.items || []).reduce(
    (sum: number, item: any) => {
      const tdsVal = Number(item.tdsValue ?? item.itemTdsValue ?? 0);
      if (!tdsVal) return sum;
      const base = Number(item.unitPrice) * Number(item.quantity);
      const tdsType = item.tdsType ?? item.itemTdsType ?? "percent";
      const tdsAmount = tdsType === "percent" ? (base * tdsVal) / 100 : tdsVal;
      return sum + tdsAmount;
    },
    0,
  );
  const totalTds = round2(
    (totals?.billTds ?? totals?.invoiceTds ?? 0) + itemTdsTotal,
  );
  const itemTdsRaw = totals?.itemTds ?? [];
  const itemTdsBreakup = useMemo(() => {
    const byKey = new Map<
      string,
      { type?: string; rateOrValue?: number; totalAmount: number }
    >();
    const list = itemTdsRaw as Array<{
      type?: string;
      rateOrValue?: number;
      totalAmount?: number;
    }>;
    for (const t of list) {
      const key = `${t.type ?? "percent"}_${t.rateOrValue ?? 0}`;
      const existing = byKey.get(key);
      const amount = Number(t.totalAmount ?? 0);
      if (existing) {
        existing.totalAmount = round2(existing.totalAmount + amount);
      } else {
        byKey.set(key, {
          type: t.type,
          rateOrValue: t.rateOrValue,
          totalAmount: round2(amount),
        });
      }
    }
    return Array.from(byKey.values());
  }, [itemTdsRaw]);

  if (!invoice || isLoadingData) return <ViewSkeleton />;

  // Format with dual currency if FX rate exists
  const formatDualCurrency = (value?: string | number) => {
    const numValue = Number(value || 0);
    const companyAmount = fxRate ? numValue * fxRate : numValue;
    const companyFormatted = formatCurrencyByCommaSeparation(
      companyAmount,
      commaSeparation,
      currency,
    );

    if (fxRate && selectedCurrencyCode !== companyCurrencyCode) {
      const foreignFormatted = formatCurrencyByCommaSeparation(
        numValue,
        commaSeparation,
        selectedCurrencySymbol,
      );
      return `${foreignFormatted}`;
    }

    return companyFormatted;
  };

  // -------------------- Items Table --------------------
  const discountLevel = invoice?.discountLevel;
  const isItemLevelDiscount = discountLevel === "item";

  const itemColumns: StandardTableColumn[] = [
    { id: "item", label: "Item", align: "left", minWidth: 80},
    { id: "accountName", label: "Account", align: "left" },
    { id: "hsn", label: "HSN/SAC", align: "center" },
    { id: "qty", label: "Qty", align: "center" },
    { id: "unitPrice", label: "Unit Price", align: "right" },
    ...(isItemLevelDiscount
      ? [{ id: "discount", label: "Discount", align: "right" as const }]
      : []),
    { id: "amount", label: "Amount", align: "right" },
  ];

  const itemRows = (invoice?.items || []).map((item: any) => {
    const discountValue = Number(item.discountValue ?? 0);
    const discountType = item.discountType ?? "percent";
    const base = Number(item.unitPrice) * Number(item.quantity);
    const discountAmount =
      discountType === "percent" ? (base * discountValue) / 100 : discountValue;
    const hasDiscount = discountAmount > 0;

    return {
      item: (
        <Box>
          <Typography
            fontWeight={600}
            sx={{
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              whiteSpace: "normal",
            }}
          >
            {item.name ?? item.itemName}
          </Typography>
        </Box >
      ),
      accountName: item.account ?? item.itemAccount?.accountName ?? "-",
      hsn: item.hsnSac || "-",
      qty: item.quantity,
      unitPrice: formatDualCurrency(item.unitPrice),
      ...(isItemLevelDiscount && {
        discount: hasDiscount ? (
          <Box sx={{ textAlign: "right" }}>
            <Typography
              variant="body2"
              sx={{ color: "error.main", fontWeight: 500 }}
            >
              {discountType === "percent"
                ? `${discountValue}% (−${formatDualCurrency(discountAmount)})`
                : `−${formatDualCurrency(discountAmount)}`}
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{ textAlign: "right", color: "text.secondary" }}
          >
            —
          </Typography>
        ),
      }),
      amount: formatDualCurrency(item.total ?? item.itemTotal),
    };
  });

  const paymentColumns: StandardTableColumn[] = [
    { id: "date", label: "Date", align: "left" },
    { id: "account", label: "Account", align: "left" },
    { id: "amount", label: "Amount", align: "right", headerAlign: "right" },
    { id: "note", label: "Note", align: "left" },
  ];
  // ssxdsd
  const paymentRows = (payments || []).map((p: any) => ({
    date: formatDate(p.date ?? p.paymentDate),
    account: p.account?.accountName || "-",
    amount: formatCurrency(
      p.counterCurrencyAmount ??
      p.debitAmount ??
      p.amount ??
      p.creditAmount ??
      0,
      p.counterCurrency?.split(" - ")[0],
    ),
    note: p.description || "-",
  }));

  // -------------------- Totals --------------------
  const formatTaxLabel = (tax: any) => {
    if (tax.type === "percent") {
      return `${tax.abbreviation ?? tax.taxName} (${tax.rateOrValue}%)`;
    }

    // flat value tax
    return `${tax.abbreviation ?? tax.taxName}`;
  };

  const billTotalNumber = Number(
    totals?.billTotal ?? totals?.invoiceTotal ?? 0,
  );

  const finalTotalNumber = Number(totals?.finalTotal ?? billTotalNumber);

  const roundOffValue = round2(finalTotalNumber - billTotalNumber);

  const formattedRoundOff =
    roundOffValue > 0
      ? `+${formatDualCurrency(roundOffValue)}`
      : formatDualCurrency(roundOffValue);

  return (
    <Box>
      <Box
        sx={{
          background: "linear-gradient(135deg, #05060f 0%, #0a0f2c 100%)",
          color: "#fff",
          p: 3,
        }}
      >
        <Stack direction="row" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {invoice.billNo ? "BILL" : "INVOICE"}
            </Typography>
            <Typography variant="body2">
              {invoice.billNo ?? invoice.invoiceNo}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="caption">
              {selectedRow.type === "bill" ? "Bill Date" : "Invoice Date"}
            </Typography>
            <Typography fontWeight={600}>
              {formatDate(invoice.billDate ?? invoice.invoiceDate)}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Contact & Meta */}
      {/* Contact & Meta */}
      <Box p={3}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
          {/* Contact */}
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary">
              {selectedRow.type === "bill" ? "Contact" : "Bill To"}
            </Typography>
            <Typography fontWeight={600}>{invoice.contact?.name}</Typography>
            {invoice.contact?.phoneNumber && (
              <Typography variant="body2">
                📞 {invoice.contact.phoneNumber}
              </Typography>
            )}
            {invoice.contact?.addressLine1 && (
              <Typography variant="body2">
                {invoice.contact.addressLine1}, {invoice.contact.city},{" "}
                {invoice.contact.state} {invoice.contact.pincode}
              </Typography>
            )}
          </Box>

          {/* Meta Info */}
          <Box flex={1}>
            <MetaRow
              label="Service Period"
              value={`${formatDate(
                invoice.serviceStart ?? invoice.serviceStartDate,
              )} - ${formatDate(invoice.serviceEnd ?? invoice.serviceEndDate)}`}
            />
            <MetaRow
              label="Due Date"
              value={formatDate(
                invoice.dueDate ??
                invoice.invoiceDueDate ??
                invoice.billDueDate,
              )}
            />
            <MetaRow
              label="Currency"
              value={
                invoice.currency ??
                invoice.invoiceCurrency ??
                invoice.billCurrency
              }
            />
          </Box>
        </Stack>
      </Box>

      {/* Items Table */}
      <StandardTable
        columns={itemColumns}
        rows={itemRows}
        sticky
        sx={{ px: 2 }}
      />

      {/* Totals */}
      <Box px={3} py={2} display="flex" justifyContent="flex-end">
        <Box
          sx={{
            backgroundColor: "#f3f2f2ff",
            borderRadius: "5px",
            p: "13px",
            mt: 1,
            // mb: 2,
            width: "40%",
            typography: "body1",
          }}
        >
          <SummaryRow
            label="Subtotal"
            value={formatDualCurrency(totals?.subTotal)}
          />

          {taxes.length > 0 &&
            taxes.map((tax: any, idx: number) => (
              <SummaryRow
                key={`${tax.taxId}-${tax.rateOrValue}-${idx}`}
                label={formatTaxLabel(tax)}
                value={formatDualCurrency(tax.totalAmount)}
              />
            ))}

          {totals?.discount > 0 && invoice?.discountLevel === "total" && (
            <SummaryRow
              label={
                invoice?.discountType === "percent" &&
                  invoice?.discountValue != null
                  ? `Discount (${Number(invoice.discountValue)}%)`
                  : "Discount"
              }
              value={`-${formatDualCurrency(totals.discount)}`}
              color="error.main"
            />
          )}

          {itemTdsBreakup.length > 0 &&
            itemTdsBreakup.map((t: any, idx: number) => (
              <SummaryRow
                key={`tds-${t.rateOrValue}-${idx}`}
                label={
                  t.type === "percent"
                    ? `TDS (${Number(t.rateOrValue)}%)`
                    : "TDS"
                }
                value={`-${formatDualCurrency(t.totalAmount ?? 0)}`}
                color="error.main"
              />
            ))}

          {itemTdsBreakup.length === 0 && totalTds > 0 && (
            <SummaryRow
              label={
                invoice?.tdsLevel === "total" &&
                  invoice?.tdsType === "percent" &&
                  invoice?.tdsValue != null &&
                  String(invoice.tdsValue).trim() !== ""
                  ? `TDS (${Number(invoice.tdsValue)}%)`
                  : "TDS"
              }
              value={`-${formatDualCurrency(totalTds)}`}
              color="error.main"
            />
          )}

          {roundOffValue !== 0 && (
            <SummaryRow
              label="Round off"
              value={formattedRoundOff}
              color={roundOffValue > 0 ? "success.main" : "error.main"}
            />
          )}

          <Divider sx={{ my: 1 }} />

          <SummaryRow
            label="Total"
            value={formatDualCurrency(totals?.finalTotal)}
          />

          {hasFxConversion && (
            <SummaryRow
              label={`Total in ${companyCurrencyCode ?? "INR"}`}
              value={formatCurrency(finalTotalNumber * fxRate)}
            />
          )}
        </Box>
      </Box>

      {/* Notes */}
      {invoice.notes && (
        <Box px={3} py={2}>
          <Typography variant="caption" color="text.secondary">
            Notes
          </Typography>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              maxWidth: "100%",
            }}
          >
            {invoice.notes}
          </Typography>
        </Box>
      )}

      {/* Payments Table - beneath everything */}
      <Box px={3} pb={3}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Payments
        </Typography>
        <DenseTableAtom
          ariaLabel="Payments"
          columns={paymentColumns}
          rows={paymentRows}
          emptyMessage="No payments yet"
          sx={{
            maxHeight: 280,
            "& .MuiTableCell-root": { py: 1 },
          }}
        />
      </Box>
    </Box>
  );
}

/* ---------------------------- helpers ---------------------------- */
function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" mb={1}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Stack>
  );
}
const SummaryRow = ({
  label,
  value,
  color,
}: {
  label: string;
  value: React.ReactNode;
  color?: string;
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
      }}
    >
      {/* LABEL */}
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 600, pb: label === "Subtotal" ? 2 : 1 }}
      >
        {label}
      </Typography>

      {/* VALUE  */}
      <Typography
        sx={{
          fontWeight: 400,
          fontSize: 16,
          color,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};
