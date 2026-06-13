import {
  Box,
  IconButton,
  Alert,
  Skeleton,
  Tooltip,
  LinearProgress,
  Paper,
  Typography,
  Divider,
  Stack,
  Collapse,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import dayjs from "dayjs";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { useEffect, useMemo, useState } from "react";
import {
  useGetPaymentHistoryQuery,
  useDeletePaymentMutation,
  type PaymentBatch,
} from "../api/payrun.api";

interface PaymentHistoryPanelProps {
  payrunId: number;
  totalNetPay: number;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
  onEmpty?: () => void;
  onPaymentDeleted?: () => void;
}

const fmtNum = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

const fmtDate = (value: string) =>
  dayjs(value).isValid() ? dayjs(value).format("MMM DD, YYYY") : "—";

const toMs = (value: string) => {
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
};

type DisplayBatch = {
  batch: PaymentBatch;
  paid: number;
  due: number;
  isLatest: boolean;
};

function PaymentBatchCard({
  entry,
  expanded,
  onToggle,
  onDelete,
}: {
  entry: DisplayBatch;
  expanded: boolean;
  onToggle: () => void;
  onDelete: (payrollPaymentId: string) => void;
}) {
  const { batch, paid, due, isLatest } = entry;
  const sortedItems = useMemo(
    () =>
      [...batch.items].sort(
        (a, b) => toMs(a.date) - toMs(b.date) || a.paymentId.localeCompare(b.paymentId)
      ),
    [batch.items]
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 1.5,
        overflow: "hidden",
        borderColor: expanded ? "primary.light" : "divider",
        transition: "border-color 0.2s ease",
      }}
    >
      <Box
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "auto 1fr auto",
            sm: "auto 1.2fr 1fr 1fr auto",
          },
          alignItems: "center",
          gap: { xs: 1, sm: 2 },
          px: 2,
          py: 1.5,
          bgcolor: expanded ? "action.selected" : "action.hover",
          cursor: "pointer",
          userSelect: "none",
          "&:hover": { bgcolor: "action.selected" },
        }}
      >
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            color: "text.secondary",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />

        <Box minWidth={0}>
          <Typography variant="caption" color="text.secondary" display="block">
            Payment Recorded on
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {fmtDate(batch.recordedAt)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: "block", sm: "none" }, mt: 0.25 }}
          >
            Paid {fmtNum(paid)} · Due {fmtNum(due)}
          </Typography>
        </Box>

        <Box textAlign="right" sx={{ display: { xs: "none", sm: "block" } }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Paid
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {fmtNum(paid)}
          </Typography>
        </Box>

        <Box textAlign="right" sx={{ display: { xs: "none", sm: "block" } }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Due
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {fmtNum(due)}
          </Typography>
        </Box>

        <Box justifySelf="center" onClick={(e) => e.stopPropagation()}>
          <Tooltip title={isLatest ? "Delete payment" : "Cannot delete older payments"}>
            <span>
              <IconButton
                size="small"
                onClick={() => (isLatest ? onDelete(batch.payrollPaymentId) : undefined)}
                disabled={!isLatest}
                sx={{ color: isLatest ? "error.main" : "text.disabled" }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <Box sx={{ px: 2, py: 1.5, bgcolor: "background.paper" }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Payment items ({sortedItems.length})
          </Typography>

          <Box
            sx={{
              maxHeight: 220,
              overflowY: "auto",
              overflowX: "hidden",
              pr: sortedItems.length > 6 ? 0.5 : 0,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                columnGap: 2,
                rowGap: 0.75,
                alignItems: "center",
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Payment Date
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                textAlign="right"
              >
                Amount
              </Typography>

              {sortedItems.map((item) => (
                <Box key={item.paymentId} sx={{ display: "contents" }}>
                  <Typography variant="body2">{fmtDate(item.date)}</Typography>
                  <Typography variant="body2" textAlign="right" fontWeight={500}>
                    {fmtNum(item.amount)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}

export function PaymentHistoryPanel({
  payrunId,
  totalNetPay,
  onError,
  onSuccess,
  onEmpty,
  onPaymentDeleted,
}: PaymentHistoryPanelProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hadPayments, setHadPayments] = useState(false);
  const { data, isLoading, isError } = useGetPaymentHistoryQuery(payrunId, {
    refetchOnMountOrArgChange: true,
  });
  const [deletePayment, { isLoading: isDeleting }] = useDeletePaymentMutation();
  const batches = data?.payments ?? [];

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      await deletePayment({ payrunId, payrollPaymentId: deleteConfirmId }).unwrap();
      onPaymentDeleted?.();
      onSuccess("Payment deleted successfully.");
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; error?: string; message?: string };
      onError(e?.data?.message ?? e?.error ?? e?.message ?? "Failed to delete payment.");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  useEffect(() => {
    if (batches.length > 0) {
      setHadPayments(true);
      return;
    }
    if (!isLoading && hadPayments && batches.length === 0) {
      onSuccess("All payments deleted.");
      onEmpty?.();
    }
  }, [batches.length, hadPayments, isLoading, onEmpty, onSuccess]);

  const displayRows = useMemo<DisplayBatch[]>(() => {
    const chronological = [...batches].sort(
      (a, b) => toMs(a.recordedAt) - toMs(b.recordedAt)
    );

    let cumPaid = 0;
    const rows = chronological.map((batch) => {
      const paid = batch.items.reduce((sum, item) => sum + item.amount, 0);
      cumPaid += paid;
      const due = Math.max(0, totalNetPay - cumPaid);
      return { batch, paid, due };
    });

    const latestId =
      rows.length > 0 ? rows[rows.length - 1].batch.payrollPaymentId : null;

    return [...rows]
      .reverse()
      .map((row) => ({
        ...row,
        isLatest: row.batch.payrollPaymentId === latestId,
      }));
  }, [batches, totalNetPay]);

  useEffect(() => {
    if (expandedId && !displayRows.some((row) => row.batch.payrollPaymentId === expandedId)) {
      setExpandedId(null);
    }
  }, [displayRows, expandedId]);

  const toggleExpanded = (payrollPaymentId: string) => {
    setExpandedId((prev) => (prev === payrollPaymentId ? null : payrollPaymentId));
  };

  if (isLoading) {
    return (
      <Stack spacing={1.5}>
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 1.5 }} />
        ))}
      </Stack>
    );
  }

  if (isError) {
    return <Alert severity="error">Failed to load payment history.</Alert>;
  }

  if (batches.length === 0) {
    return (
      <Alert severity="info" icon={false}>
        No payments recorded yet.
      </Alert>
    );
  }

  return (
    <>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          maxHeight: "min(60vh, 520px)",
          overflowY: "auto",
          overflowX: "hidden",
          pr: 0.5,
        }}
      >
        {isDeleting && (
          <LinearProgress
            sx={{
              position: "sticky",
              top: 0,
              left: 0,
              right: 0,
              borderRadius: "6px 6px 0 0",
              zIndex: 2,
            }}
          />
        )}

        <Stack spacing={1.5} sx={{ py: isDeleting ? 0.5 : 0 }}>
          {displayRows.map((entry) => (
            <PaymentBatchCard
              key={entry.batch.payrollPaymentId}
              entry={entry}
              expanded={expandedId === entry.batch.payrollPaymentId}
              onToggle={() => toggleExpanded(entry.batch.payrollPaymentId)}
              onDelete={setDeleteConfirmId}
            />
          ))}
        </Stack>
      </Box>

      <ConfirmDialog
        open={deleteConfirmId != null}
        title="Delete Payment"
        message="Are you sure you want to delete this payment? This action cannot be undone."
        confirmText="Delete"
        confirmColor="error"
        disableScrollLock
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
