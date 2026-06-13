import { useState, useEffect } from "react";
import { useAppDispatch } from "../../../../../store/store";
import {
  Card,
  Box,
  Typography,
  Alert,
  AlertTitle,
  Skeleton,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HistoryIcon from "@mui/icons-material/History";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { TabsAtom, type TabItem } from "../../../../../components/tabs";
import { PrimaryButton } from "../../../../../components/atom/button";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import {
  RecordPaymentModal,
  type RecordPaymentFormPayload,
} from "./components/RecordPaymentModal";
import { PaymentHistoryModal } from "./components/PaymentHistoryModal";
import {
  useGetPayrunDetailsQuery,
  useApprovePayrunMutation,
  useRejectPayrunMutation,
  useRecordPaymentMutation,
  useDeletePayrunMutation,
  useSkipPayrunMutation,
  useUnskipPayrunMutation,
  useDownloadEcrMutation,
  type PayrunStatus,
} from "./api/payrun.api";
import { StatusBadge } from "./components/StatusBadge";
import { PayDayCard, PeriodCostCard, TaxesSummaryCard } from "./components/PayrunSummaryCards";
import { EmployeeSummaryTab } from "./components/EmployeeSummaryTab";
import { TaxesDeductionsTab } from "./components/TaxesDeductionsTab";
import { PayoutReportModal } from "./components/PayoutReportModal";
import { getErrorMessage, payrunOutlinedReportButtonSx, payrunReportToolbarRowSx } from "./utils";
import { baseApi } from "../../../../../api/base.api";

export default function PayrollDetailsPage() {
  const { payrunId } = useParams<{ payrunId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const id = Number(payrunId);

  const [tab, setTab] = useState(0);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "success" });
  const [snackbarKey, setSnackbarKey] = useState(0);
  // Locally tracks status changes returned by approve/reject/record mutations
  // so we never need to refetch /payroll/:id just for status.
  const [statusOverride, setStatusOverride] = useState<PayrunStatus | null>(null);

  // Reset whenever the user navigates to a different payrun
  useEffect(() => {
    setStatusOverride(null);
  }, [id]);

  const showSnackbar = (
    msg: string,
    color: "success" | "error" | "info" | "warning" = "success"
  ) => {
    setSnackbarKey((k) => k + 1);
    setSnackbar({ open: true, message: msg, color });
  };

  const { data, isLoading, isFetching, isError } = useGetPayrunDetailsQuery(id, {
    skip: !id || isNaN(id),
    refetchOnMountOrArgChange: true,
  });

  // After a payment is deleted, wait for the refetch to land before clearing
  // the local status override so there is no stale-cache flash.
  const [pendingStatusReset, setPendingStatusReset] = useState(false);
  useEffect(() => {
    if (pendingStatusReset && !isFetching) {
      setStatusOverride(null);
      setPendingStatusReset(false);
    }
  }, [pendingStatusReset, isFetching]);

  const [approvePayrun, { isLoading: isApproving }] = useApprovePayrunMutation();
  const [rejectPayrun, { isLoading: isRejecting }] = useRejectPayrunMutation();
  const [recordPayment, { isLoading: isRecording }] = useRecordPaymentMutation();
  const [deletePayrun, { isLoading: isDeleting }] = useDeletePayrunMutation();
  const [skipPayrun, { isLoading: isSkippingPayrun }] = useSkipPayrunMutation();
  const [unskipPayrun, { isLoading: isUnskippingPayrun }] = useUnskipPayrunMutation();
  const [downloadEcr, { isLoading: isDownloadingEcr }] = useDownloadEcrMutation();

  /** Patches the getPayrunDetails cache so navigating away and back shows the
   *  correct status immediately, without waiting for a refetch to complete. */
  const patchCachedStatus = (newStatus: PayrunStatus) => {
    dispatch(
      baseApi.util.updateQueryData("getPayrunDetails" as never, id as never, (draft: any) => {
        if (draft?.summary) draft.summary.status = newStatus;
      })
    );
  };

  const handleApprove = async () => {
    try {
      const result = await approvePayrun(id).unwrap();
      setStatusOverride(result.payrunStatus);
      patchCachedStatus(result.payrunStatus);
      showSnackbar("Payroll approved successfully.", "success");
    } catch (err) {
      showSnackbar(getErrorMessage(err), "error");
    } finally {
      setApproveConfirmOpen(false);
    }
  };

  const handleReject = async () => {
    try {
      const result = await rejectPayrun(id).unwrap();
      setStatusOverride(result.payrunStatus);
      patchCachedStatus(result.payrunStatus);
      showSnackbar("Payroll rejected.", "success");
    } catch (err) {
      showSnackbar(getErrorMessage(err), "error");
    } finally {
      setRejectConfirmOpen(false);
    }
  };

  const handleRecordPayment = async (payload: RecordPaymentFormPayload) => {
    try {
      const result = await recordPayment({ id, payload }).unwrap();
      setStatusOverride(result.payrunStatus);
      patchCachedStatus(result.payrunStatus);
      showSnackbar("Payment recorded successfully.", "success");
      setRecordPaymentOpen(false);
    } catch (err) {
      showSnackbar(getErrorMessage(err), "error");
    }
  };

  const handleDeletePayrun = async () => {
    try {
      await deletePayrun(id).unwrap();
      setDeleteConfirmOpen(false);
      navigate("/people/home?tab=71", { replace: true });
    } catch (err) {
      showSnackbar(getErrorMessage(err), "error");
      setDeleteConfirmOpen(false);
    }
  };

  const handleSkipPayrun = async () => {
    try {
      await skipPayrun(id).unwrap();
      navigate("/people/home?tab=71", { replace: true });
    } catch (err) {
      showSnackbar(getErrorMessage(err), "error");
    } finally {
      setSkipConfirmOpen(false);
    }
  };

  const handleUnskipPayrun = async () => {
    try {
      await unskipPayrun(id).unwrap();
      // Unskip returns status "created" which normalises to "draft"
      setStatusOverride("draft");
      patchCachedStatus("draft");
      showSnackbar("Payrun unskipped successfully.", "success");
    } catch (err) {
      showSnackbar(getErrorMessage(err), "error");
    }
  };

  if (isError) {
    return (
      <Box p={3}>
        <Alert
          severity="error"
          variant="outlined"
          sx={{
            borderRadius: 2,
            alignItems: "flex-start",
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <AlertTitle sx={{ fontWeight: 700 }}>Unable to load payroll details</AlertTitle>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Something went wrong while fetching this payroll. Please try again.
          </Typography>
          <Box display="flex" gap={1}>
            <PrimaryButton
              variant="contained"
              size="small"
              startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 14 }} />}
              onClick={() => navigate(-1)}
            >
              Go Back
            </PrimaryButton>
          </Box>
        </Alert>
      </Box>
    );
  }

  const summary = data?.summary;
  // Prefer the status returned inline from the last mutation so /payroll/:id
  // never needs to be refetched just to update the UI.
  // Normalize "created" (backend alias) → "draft" so all checks are consistent.
  const rawFromServer = summary?.status?.toLowerCase() ?? "";
  const effectiveStatus: string =
    statusOverride ?? (rawFromServer === "created" ? "draft" : rawFromServer);

  const isApproved = effectiveStatus === "approved";
  const isPartiallyPaid = effectiveStatus === "partially_paid";
  const isPaid = effectiveStatus === "paid";
  const isSkippedPayrun =
    effectiveStatus === "skipped" ||
    (statusOverride == null && summary?.isPayrunSkipped === true);
  const isDraftOrRejected = !isApproved && !isPartiallyPaid && !isPaid && !isSkippedPayrun;
  const canDelete = isDraftOrRejected;

  const allEmployeesSkipped =
    (data?.employees?.length ?? 0) > 0 &&
    data?.employees?.every((e) => e.isSkipped === true) === true;

  const status: PayrunStatus = isApproved
    ? "approved"
    : isPartiallyPaid
    ? "partially_paid"
    : isPaid
    ? "paid"
    : isSkippedPayrun
    ? "skipped"
    : (effectiveStatus as PayrunStatus) || "draft";

  const payPeriodRange =
    summary?.cycleStart && summary?.cycleEnd
      ? `${dayjs(summary.cycleStart).format("MMM DD, YYYY")} - ${dayjs(summary.cycleEnd).format("MMM DD, YYYY")}`
      : undefined;

  const toTextFileName = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return `ecr-${id}.txt`;
    if (trimmed.toLowerCase().endsWith(".txt")) return trimmed;
    return trimmed.replace(/\.[^/.]+$/, "") + ".txt";
  };

  const handleDownloadEcr = async () => {
    try {
      const { blob, fileName } = await downloadEcr(id).unwrap();

      // Prefer Content-Disposition (requires Access-Control-Expose-Headers).
      // Otherwise match backend format, e.g. "May 2026-ECR.txt"
      let resolvedFileName: string;
      if (!fileName || fileName.startsWith("ecr-")) {
        const periodSource = summary?.payableDate ?? summary?.cycleStart;
        const period = periodSource
          ? dayjs(periodSource).format("MMMM YYYY")
          : dayjs().format("MMMM YYYY");
        resolvedFileName = `${period}-ECR.txt`;
      } else {
        resolvedFileName = toTextFileName(fileName);
      }

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = resolvedFileName;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      anchor.remove();
      showSnackbar("ECR report downloaded successfully.", "success");
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string; error?: string };
      showSnackbar(
        e?.data?.message ?? e?.message ?? e?.error ?? "Failed to download ECR report.",
        "error"
      );
    }
  };

  const tabs: TabItem[] = [
    {
      label: "Employee Summary",
      content: isLoading ? (
        <Box>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height={44} sx={{ mb: 0.5 }} />
          ))}
        </Box>
      ) : (
        <EmployeeSummaryTab
          employees={data?.employees ?? []}
          payrunId={id}
          status={status}
          payPeriodLabel={
            data?.summary?.cycleStart
              ? dayjs(data.summary.cycleStart).format("MMMM YYYY")
              : undefined
          }
          payPeriodRange={payPeriodRange}
          onToast={showSnackbar}
        />
      ),
    },
    {
      label: "Taxes & Deductions",
      content: isLoading ? (
        <Skeleton height={200} />
      ) : summary ? (
        <TaxesDeductionsTab summary={summary} />
      ) : (
        <Alert severity="info" icon={false}>
          No taxes & deductions data available.
        </Alert>
      ),
    },
  ];

  return (
    <>
      <Card
        elevation={2}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 2,
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2.5}
          flexWrap="wrap"
          gap={1}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Back">
              <IconButton
                size="small"
                onClick={() => navigate(-1)}
                sx={{
                  bgcolor: "grey.100",
                  "&:hover": { bgcolor: "grey.200" },
                  width: 30,
                  height: 30,
                }}
              >
                <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Typography variant="h6" fontWeight={700}>
              Regular Payroll
            </Typography>
            {!isLoading && <StatusBadge status={status} />}
          </Box>

          {/* Action buttons */}
          <Box display="flex" gap={1} alignItems="center">
            {isDraftOrRejected && !isLoading && (
              <>
                {allEmployeesSkipped ? (
                  <PrimaryButton
                    variant="contained"
                    onClick={() => setSkipConfirmOpen(true)}
                    disabled={isSkippingPayrun}
                    size="small"
                  >
                    {isSkippingPayrun ? "Skipping..." : "Skip Payroll"}
                  </PrimaryButton>
                ) : (
                  <PrimaryButton
                    variant="contained"
                    onClick={() => setApproveConfirmOpen(true)}
                    disabled={isApproving}
                    size="small"
                  >
                    {isApproving ? "Approving..." : "Approve Payroll"}
                  </PrimaryButton>
                )}
                {canDelete && (
                  <Tooltip title="Delete Payrun">
                    <IconButton
                      color="error"
                      onClick={() => setDeleteConfirmOpen(true)}
                      disabled={isDeleting}
                      size="small"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}

            {isSkippedPayrun && !isLoading && (
              <PrimaryButton
                variant="contained"
                onClick={handleUnskipPayrun}
                disabled={isUnskippingPayrun}
                size="small"
                sx={{ bgcolor: "#f57c00", "&:hover": { bgcolor: "#e65100" } }}
              >
                {isUnskippingPayrun ? "Unskipping..." : "Unskip Payroll"}
              </PrimaryButton>
            )}

            {isApproved && !isLoading && (
              <>
                <PrimaryButton
                  variant="contained"
                  onClick={() => setRecordPaymentOpen(true)}
                  size="small"
                >
                  Record Payment
                </PrimaryButton>
                <PrimaryButton
                  variant="contained"
                  onClick={() => setRejectConfirmOpen(true)}
                  disabled={isRejecting}
                  size="small"
                  sx={{ bgcolor: "#e91e63", "&:hover": { bgcolor: "#c2185b" } }}
                >
                  Reject Payroll
                </PrimaryButton>
              </>
            )}

            {isPartiallyPaid && !isLoading && (
              <>
                <PrimaryButton
                  variant="contained"
                  onClick={() => setRecordPaymentOpen(true)}
                  size="small"
                >
                  Record Payment
                </PrimaryButton>
                <PrimaryButton
                  variant="contained"
                  onClick={() => setPaymentHistoryOpen(true)}
                  size="small"
                  sx={{ bgcolor: "#e91e63", "&:hover": { bgcolor: "#c2185b" } }}
                >
                  Payment History
                </PrimaryButton>
              </>
            )}

            {isPaid && !isLoading && (
              <PrimaryButton
                variant="contained"
                onClick={() => setPaymentHistoryOpen(true)}
                size="small"
                startIcon={<HistoryIcon />}
                sx={{ bgcolor: "#e91e63", "&:hover": { bgcolor: "#c2185b" } }}
              >
                Payment History
              </PrimaryButton>
            )}
          </Box>
        </Box>

        {/* Summary cards */}
        {isLoading ? (
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} variant="rounded" width={200} height={110} sx={{ borderRadius: 2 }} />
            ))}
          </Box>
        ) : summary ? (
          <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="stretch">
            <PayDayCard summary={summary} />
            <PeriodCostCard summary={summary} />
            <TaxesSummaryCard summary={summary} />
          </Box>
        ) : null}

        {/* Tabs */}
        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            p: 2,
          }}
        >
          <TabsAtom
            tabs={tabs}
            value={tab}
            onChange={setTab}
            scrollable
            action={
              isApproved || isPartiallyPaid || isPaid ? (
                <Box
                  role="group"
                  aria-label={tab === 1 ? "Tax and payout reports" : "Payout report"}
                  sx={payrunReportToolbarRowSx}
                >
                  {tab === 1 && (
                    <Tooltip title="Download ECR report">
                      <span>
                        <PrimaryButton
                          variant="outlined"
                          color="primary"
                          size="small"
                          startIcon={
                            isDownloadingEcr ? (
                              <CircularProgress size={18} thickness={4} color="inherit" />
                            ) : (
                              <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />
                            )
                          }
                          onClick={handleDownloadEcr}
                          disabled={isDownloadingEcr}
                          sx={payrunOutlinedReportButtonSx}
                        >
                          {isDownloadingEcr ? "Preparing…" : "ECR report"}
                        </PrimaryButton>
                      </span>
                    </Tooltip>
                  )}
                  <Tooltip title="Download payout report">
                    <PrimaryButton
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<AssessmentOutlinedIcon sx={{ fontSize: 18 }} />}
                      onClick={() => setPayoutModalOpen(true)}
                      sx={payrunOutlinedReportButtonSx}
                    >
                      Payout report
                    </PrimaryButton>
                  </Tooltip>
                </Box>
              ) : null
            }
          />
        </Box>
      </Card>

      {/* Modals */}
      <RecordPaymentModal
        open={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        onSubmit={handleRecordPayment}
        isLoading={isRecording}
        employees={data?.employees ?? []}
        payrunId={id}
        defaultDate={summary?.payableDate}
        isPartiallyPaid={isPartiallyPaid}
      />

      <PaymentHistoryModal
        open={paymentHistoryOpen}
        onClose={() => setPaymentHistoryOpen(false)}
        payrunId={id}
        totalNetPay={summary?.totalNetPay ?? 0}
        onPaymentDeleted={() => setPendingStatusReset(true)}
      />

      <PayoutReportModal
        open={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        payrunId={id}
        onToast={showSnackbar}
      />

      <ConfirmDialog
        open={approveConfirmOpen}
        title="Approve Payroll"
        message="Are you sure you want to approve this payroll? Once approved, it can be paid or rejected."
        confirmText="Approve Payroll"
        confirmColor="primary"
        onClose={() => setApproveConfirmOpen(false)}
        onConfirm={handleApprove}
      />

      <ConfirmDialog
        open={skipConfirmOpen}
        title="Skip Payroll"
        message="Are you sure you want to skip this payroll? This action can be undone later."
        confirmText="Skip Payroll"
        confirmColor="primary"
        onClose={() => setSkipConfirmOpen(false)}
        onConfirm={handleSkipPayrun}
      />

      <ConfirmDialog
        open={rejectConfirmOpen}
        title="Reject Payroll"
        message="Are you sure you want to Reject this Payroll ?"
        confirmText="Reject Payroll"
        confirmColor="primary"
        onClose={() => setRejectConfirmOpen(false)}
        onConfirm={handleReject}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Payrun"
        message="Are you sure you want to permanently delete this payrun? This action cannot be undone."
        confirmText="Delete"
        confirmColor="error"
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeletePayrun}
      />

      {snackbar.open && (
        <Snackbar
          key={snackbarKey}
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </>
  );
}
