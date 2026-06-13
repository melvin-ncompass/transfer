import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import {
  useGetPaymentDetailsForInvoiceQuery,
} from "../../../api/invoice.api";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { formatCurrencyByCommaSeparation } from "../../../../../../utils/numberFormatter";
import { useGetPaymentDetailsForBillQuery } from "../../../api/bill.api";

type PaymentDetailsCardProps = {
  paymentId: string;
  transactionId: string;
  type?: "invoice_payment" | "bill_payment";
};

export function PaymentDetailsCard({
  paymentId,
  transactionId,
  type,
}: PaymentDetailsCardProps) {
  // Dynamically pick which query hook to use based on `type`
  const useQueryHook =
    type === "bill_payment"
      ? useGetPaymentDetailsForBillQuery
      : useGetPaymentDetailsForInvoiceQuery;

  const {
    data: paymentDetails,
    isLoading,
    isSuccess,
  } = useQueryHook(
    { paymentId, transactionTypeId: transactionId },
    { skip: !paymentId || !transactionId }
  );

  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";

  const formatDate = (date?: string) =>
    date ? dayjs(date).format("MMM D, YYYY") : "-";

  // Loading state
  if (isLoading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Stack alignItems="center" py={4}>
            <CircularProgress size={28} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // If query failed or data missing
  if (!isSuccess || !paymentDetails) return null;

  const details = paymentDetails.data.paymentDetails?.[0];
  if (!details) return null;

  const {
    date,
    description,
    account: { accountName, accountCurrency },
    counterCurrencyAmount,
    counterCurrency,
  } = details;

  const paymentData = paymentDetails.data;
  const isInvoice = !!paymentData.invoiceNo;
  const docType = isInvoice ? "Invoice" : "Bill";
  const docNumber = paymentData.invoiceNo || paymentData.billNo || "-";
  const contactName = paymentData.contact?.name || "-";

  return (
    <Card variant="outlined">
      <CardContent>
        <Box mb={2}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            Payment for {docType} #{docNumber} ({contactName})
          </Typography>
        </Box>

        {/* Payment Details */}
        <Stack spacing={2}>
          <InfoRow
            label="Receive Payment In"
            value={`${accountName} (${
              accountCurrency?.split("-")[0] ||
              counterCurrency?.split("-")[0] ||
              ""
            })`}
          />
          <InfoRow
            label="Amount"
            value={formatCurrencyByCommaSeparation(
              Number(counterCurrencyAmount || 0),
              commaSeparation,
              counterCurrency?.split("-")[0] || ""
            )}
          />
          <InfoRow label="Payment Date" value={formatDate(date)} />
          {description && <InfoRow label="Notes" value={description} />}
        </Stack>
      </CardContent>
    </Card>
  );
}

/* ---------- Helpers ---------- */

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value?: string;
  valueColor?: string;
}) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: valueColor }}>
        {value ?? "-"}
      </Typography>
    </Stack>
  );
}