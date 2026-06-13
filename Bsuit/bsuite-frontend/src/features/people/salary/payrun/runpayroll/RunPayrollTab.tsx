import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Skeleton,
  Alert,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { PrimaryButton } from "../../../../../components/atom/button";
import { Snackbar } from "../../../../../components/atom/snackbar";
import {
  useGetNextPayableQuery,
  useCreatePayrollMutation,
} from "./api/payrun.api";

// ─── Metric column ────────────────────────────────────────────────────────────

interface MetricColProps {
  label: string;
  value: string | number;
  loading?: boolean;
  muted?: boolean;
}

function MetricCol({ label, value, loading, muted }: MetricColProps) {
  return (
    <Box sx={{ minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
        {label}
      </Typography>
      {loading ? (
        <Skeleton width={100} height={24} />
      ) : (
        <Typography
          variant="body1"
          fontWeight={600}
          color={muted ? "text.disabled" : "text.primary"}
        >
          {value}
        </Typography>
      )}
    </Box>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RunPayrollTab({ isActive = true }: { isActive?: boolean }) {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "success" });

  const { data, isLoading, isError, error, refetch } = useGetNextPayableQuery();
  const [createPayroll, { isLoading: isCreating }] = useCreatePayrollMutation();

  useEffect(() => {
    if (isActive) {
      refetch();
    }
  }, [isActive, refetch]);

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const handleCreatePayroll = async () => {
    try {
      const result = await createPayroll().unwrap();
      navigate(`/people/salary/payrun/${result.payrunId}`);
    } catch (err: unknown) {
      const e = err as any;
      const msg = e?.data?.message ?? e?.error ?? e?.message ?? "Failed to create payroll.";
      setSnackbar({ open: true, message: msg, color: "error" });
    }
  };

  const handleViewDetails = () => {
    if (data?.payRun?.id) {
      navigate(`/people/salary/payrun/${data.payRun.id}`);
    }
  };

  if (isError) {
    const errData = (error as any)?.data;
    const isPayScheduleMissing =
      (error as any)?.status === 404 &&
      errData?.message === "Pay schedule not configured";

    return (
      <Box pt={2}>
        {isPayScheduleMissing ? (
          <Alert
            severity="info"
            action={
              <PrimaryButton
                children="Configure Pay Schedule"
                variant="contained"
                size="small"
                onClick={() => navigate("/people/home?tab=71&mainTab=2&subtab=0")}
              />
            }
          >
            Pay schedule is not configured. Set it up to start running payroll.
          </Alert>
        ) : (
          <Alert severity="error">Failed to load payroll data. Please try again.</Alert>
        )}
      </Box>
    );
  }

  // ── Display values ─────────────────────────────────────────────────────────
  const period = data?.payableDate ? dayjs(data.payableDate).format("MMMM YYYY") : "";
  const paymentDateDisplay = data?.payableDate
    ? dayjs(data.payableDate).format("MMM DD, YYYY")
    : "—";

  // Show real cost numbers when payRun exists, otherwise "Yet To Calculate"
  const existingPayRun = data?.payRun;
  const payrollCostDisplay = existingPayRun
    ? fmt(existingPayRun.totalCostToCompany)
    : "Yet To Calculate";
  const netPayDisplay = existingPayRun
    ? fmt(existingPayRun.totalNetPay)
    : "Yet To Calculate";

  return (
    <Box pt={1}>
      {/* Title */}
      <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
        Process Pay Run for{" "}
        {isLoading ? (
          <Skeleton component="span" width={100} sx={{ display: "inline-block" }} />
        ) : (
          <Box component="span" fontWeight={700}>
            {period}
          </Box>
        )}
      </Typography>

      {/* Metrics row */}
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1.5,
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box display="flex" flex={1} alignItems="center" flexWrap="wrap" gap={0}>
          <MetricCol
            label="Payroll Cost"
            value={isLoading ? "—" : payrollCostDisplay}
            loading={isLoading}
            muted={!existingPayRun && !isLoading}
          />

          <Divider orientation="vertical" flexItem sx={{ mx: 2.5 }} />

          <MetricCol
            label="Employees' Net Pay"
            value={isLoading ? "—" : netPayDisplay}
            loading={isLoading}
            muted={!existingPayRun && !isLoading}
          />

          <Divider orientation="vertical" flexItem sx={{ mx: 2.5 }} />

          <MetricCol
            label="Payment Date"
            value={isLoading ? "—" : paymentDateDisplay}
            loading={isLoading}
          />

          <Divider orientation="vertical" flexItem sx={{ mx: 2.5 }} />

          <MetricCol
            label="No of Employees"
            value={isLoading ? "—" : (data?.noOfEmployees ?? "—")}
            loading={isLoading}
          />
        </Box>

        {/* Action button — View Details if payRun exists, Create Payroll otherwise */}
        <Box ml={2} flexShrink={0}>
          {isLoading ? (
            <Skeleton width={130} height={36} sx={{ borderRadius: 1 }} />
          ) : data?.payRun?.id ? (
            <PrimaryButton
              variant="contained"
              onClick={handleViewDetails}
              size="small"
            >
              View Details
            </PrimaryButton>
          ) : (
            <PrimaryButton
              variant="contained"
              onClick={handleCreatePayroll}
              disabled={isCreating}
              size="small"
            >
              {isCreating ? "Creating..." : "Create Payroll"}
            </PrimaryButton>
          )}
        </Box>
      </Box>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </Box>
  );
}
