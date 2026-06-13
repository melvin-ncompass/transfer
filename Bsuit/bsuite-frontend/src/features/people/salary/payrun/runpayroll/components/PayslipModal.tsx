import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Skeleton,
  Alert,
  TextField,
  CircularProgress,
  IconButton,
  Drawer,
  Button,
  Chip,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import dayjs from "dayjs";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import {
  useGetPayslipQuery,
  useGetEmployeeBalancesQuery,
  useUpdateIncomeTaxOverrideMutation,
  useDownloadPayslipExportMutation,
} from "../api/payrun.api";

interface PayslipModalProps {
  open: boolean;
  onClose: () => void;
  payrunId: number;
  employeeId: number | string;
  employeeName?: string;
  disableDownload?: boolean;
  employeeDisplayId?: number | string;
  /** Paid payruns use history export; draft/approved/etc. use current payrun export. */
  isPayrunPaid?: boolean;
  /** When true, income tax override UI (edit/save) is hidden — e.g. approved or paid payrun. */
  readOnlyIncomeTax?: boolean;
}

function toFiniteAmount(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const fmt = (amount: unknown) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(toFiniteAmount(amount, 0));

/** Show whole days or up to 4 decimal places for fractional LOP */
function formatLopDaysForDisplay(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "");
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toFixed(4)));
}

/** Line amounts without ₹ symbol (matches typical payslip line layout). */
const fmtLine = (amount: unknown) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    toFiniteAmount(amount, 0)
  );

const sanitizeNumericInput = (value: string): string =>
  value.replace(/,/g, "").replace(/[^\d.]/g, "");

const formatNumericInput = (value: string): string => {
  const sanitized = sanitizeNumericInput(value);
  if (!sanitized) return "";
  const [integerPart, decimalPart] = sanitized.split(".");
  const formattedInteger = Number(integerPart || 0).toLocaleString("en-IN");
  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
};

function LineRow({
  label,
  value,
  valueMuted,
  signSource,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  valueMuted?: boolean;
  /** Raw amount used only for sign: negative values render the amount in error (red). */
  signSource?: unknown;
}) {
  const n = signSource !== undefined ? toFiniteAmount(signSource, 0) : null;
  const isNegative = n !== null && n < 0;
  const valueColor = isNegative
    ? "error.main"
    : valueMuted
      ? "text.secondary"
      : "text.primary";

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="baseline"
      gap={2}
      sx={{ py: 0.65 }}
    >
      <Typography
        variant="body2"
        sx={{
          fontSize: 13,
          color: "text.secondary",
          fontWeight: 400,
          lineHeight: 1.4,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontSize: 13,
          fontWeight: valueMuted ? 400 : 500,
          textAlign: "right",
          color: valueColor,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export function PayslipModal({
  open,
  onClose,
  payrunId,
  employeeId,
  employeeName,
  disableDownload,
  employeeDisplayId,
  isPayrunPaid = false,
  readOnlyIncomeTax = false,
}: PayslipModalProps) {
  const directEmployeeId = Number(employeeId);
  const hasDirectNumericEmployeeId =
    Number.isFinite(directEmployeeId) && directEmployeeId > 0;
  const employeeCode =
    typeof employeeId === "string" && !hasDirectNumericEmployeeId
      ? employeeId.trim()
      : "";
  const { data: balancesData } = useGetEmployeeBalancesQuery(payrunId, {
    skip: !open || hasDirectNumericEmployeeId,
  });
  const mappedEmployeeId =
    !hasDirectNumericEmployeeId && employeeCode
      ? balancesData?.employees?.find((row) => row.employeeCode === employeeCode)?.employeeId
      : undefined;
  const resolvedEmployeeId = hasDirectNumericEmployeeId ? directEmployeeId : mappedEmployeeId;
  const hasValidEmployeeId =
    Number.isFinite(Number(resolvedEmployeeId)) && Number(resolvedEmployeeId) > 0;
  const { data, isLoading, isError } = useGetPayslipQuery(
    { payrunId, employeeId: Number(resolvedEmployeeId) },
    {
      skip: !open || !hasValidEmployeeId,
      /** Payslip changes during payroll; always hit the network when the modal opens. */
      refetchOnMountOrArgChange: true,
    }
  );
  const [editTax, setEditTax] = useState(false);
  const [incomeTaxInput, setIncomeTaxInput] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [updateIncomeTaxOverride, { isLoading: isSavingTax }] =
    useUpdateIncomeTaxOverrideMutation();
  const [downloadPayslipExport, { isLoading: isDownloadingPayslip }] =
    useDownloadPayslipExportMutation();
  const actualIncomeTax = data?.actualIncomeTax ?? data?.incomeTax ?? 0;
  const editedIncomeTax = data?.incomeTax ?? actualIncomeTax;
  const isIncomeTaxOverridden = actualIncomeTax !== editedIncomeTax;

  useEffect(() => {
    if (!open) {
      setEditTax(false);
      setIncomeTaxInput("");
      setMessage(null);
      return;
    }
    if (data) {
      setIncomeTaxInput(String(editedIncomeTax));
    }
  }, [open, data, editedIncomeTax]);

  useEffect(() => {
    if (readOnlyIncomeTax) setEditTax(false);
  }, [readOnlyIncomeTax]);

  const getErrorMessage = (err: unknown): string => {
    if (!err) return "Failed to update income tax.";
    if (typeof err === "string") return err;
    if (typeof err === "object") {
      const e = err as { data?: { message?: string }; message?: string; error?: string };
      return e?.data?.message ?? e?.message ?? e?.error ?? "Failed to update income tax.";
    }
    return "Failed to update income tax.";
  };

  const handleSaveIncomeTax = async () => {
    if (!hasValidEmployeeId) {
      setMessage({ type: "error", text: "Cannot update income tax without valid employee id." });
      return;
    }
    const parsed = Number(sanitizeNumericInput(incomeTaxInput));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setMessage({ type: "error", text: "Income tax must be a valid non-negative number." });
      return;
    }
    try {
      await updateIncomeTaxOverride({
        payrunId,
        employeeId: Number(resolvedEmployeeId),
        incomeTax: parsed,
      }).unwrap();
      setEditTax(false);
      setMessage({ type: "success", text: "Income tax updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  };

  const handleDownloadPayslip = async () => {
    if (!hasValidEmployeeId || !data) return;
    setMessage(null);
    try {
      const { blob, fileName } = await downloadPayslipExport({
        payrunId,
        employeeId: Number(resolvedEmployeeId),
        history: isPayrunPaid,
      }).unwrap();

      // Prefer filename from Content-Disposition (requires Access-Control-Expose-Headers).
      // Otherwise construct from payslip data, e.g. "May 2026-Deepseek.pdf"
      let resolvedFileName = fileName;
      if (!fileName || fileName.startsWith("payslip-")) {
        const period = dayjs(data.periodStart).format("MMMM YYYY");
        const rawName = employeeName || data?.employeeName || "";
        const firstName = rawName.split(" ")[0];
        resolvedFileName = `${period}-${firstName}.pdf`;
      }

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = resolvedFileName;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      anchor.remove();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string; error?: string };
      setMessage({
        type: "error",
        text: e?.data?.message ?? e?.message ?? e?.error ?? "Failed to download payslip.",
      });
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100vw", sm: 420, md: 440 },
            maxWidth: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid",
            borderColor: "divider",
            bgcolor: "#fafafa",
          },
        },
      }}
    >
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#fafafa",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "text.primary" }}>
            {employeeName || data?.employeeName || "Payslip"}
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box
          sx={{
            px: 2.5,
            py: 2,
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
            "& input[type=number]": { MozAppearance: "textfield" },
            "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
              { WebkitAppearance: "none", margin: 0 },
          }}
        >
          {isLoading && (
            <Box>
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} height={28} sx={{ mb: 1.2, borderRadius: 1 }} />
              ))}
            </Box>
          )}

          {isError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              Failed to load payslip. Please try again.
            </Alert>
          )}

          {!hasValidEmployeeId && !isLoading && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              Unable to resolve employee id for this row. Payslip requires numeric employee id.
            </Alert>
          )}

          {data && (
            <Box
              sx={{
                bgcolor: "background.paper",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                p: 2.5,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, fontSize: 12 }}>
                {dayjs(data.periodStart).format("MMM DD, YYYY")} – {dayjs(data.periodEnd).format("MMM DD, YYYY")}
                {employeeDisplayId != null && employeeDisplayId !== "" ? (
                  <> · #{String(employeeDisplayId)}</>
                ) : null}
              </Typography>

              <LineRow label="Payable Days" value={String(toFiniteAmount(data.noOfPaidDays, 0))} />
              {Number(data.lopDays) > 0 ? (
                <Box sx={{ mt: 1.25 }}>
                  <Chip
                    size="small"
                    label={`LOP: ${formatLopDaysForDisplay(data.lopDays)} days`}
                    color="error"
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: 12 }}
                  />
                </Box>
              ) : null}

              <Divider sx={{ my: 2, borderColor: "divider" }} />

              {/* Earnings */}
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "success.main",
                    letterSpacing: "0.02em",
                  }}
                >
                  (+) Earnings
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, fontWeight: 500 }}>
                  Amount
                </Typography>
              </Box>
              {data.earningDetails.map((row) => (
                <LineRow
                  key={`${row.earningId}-${row.earningComponentName}`}
                  label={row.earningComponentName || row.earningName}
                  value={fmtLine(row.monthlyAmount)}
                  signSource={row.monthlyAmount}
                />
              ))}
              <Box
                sx={{
                  mt: 1,
                  pt: 1,
                  borderTop: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <LineRow
                  label={<span style={{ fontWeight: 600, color: "inherit" }}>Gross earnings</span>}
                  value={<span style={{ fontWeight: 700 }}>{fmtLine(data.totalEarnings)}</span>}
                  signSource={data.totalEarnings}
                />
              </Box>

              <Divider sx={{ my: 2, borderColor: "divider" }} />

              {/* Deductions */}
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "error.main",
                      letterSpacing: "0.02em",
                    }}
                  >
                    (-) Deductions
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, fontWeight: 500 }}>
                  Amount
                </Typography>
              </Box>
              {(() => {
                const deductionDetailsForDisplay = data.deductionDetails.filter(
                  (d) => d.deductionComponentName !== "PF- Employer Contribution"
                );
                return deductionDetailsForDisplay.map((row) => (
                  <LineRow
                    key={`${row.deductionId}-${row.deductionComponentName}`}
                    label={row.deductionComponentName || row.deductionName}
                    value={fmtLine(row.monthlyAmount)}
                    signSource={row.monthlyAmount}
                  />
                ));
              })()}

              {(() => {
                const oc = data.otherComponents;
                if (oc == null || typeof oc !== "object") return null;
                if (Object.keys(oc).length === 0) return null;
                const name = oc.deductionComponentName;
                if (
                  !name ||
                  String(name).trim() === "" ||
                  name === "PF- Employer Contribution"
                ) {
                  return null;
                }
                return (
                  <LineRow
                    label={name}
                    value={fmtLine(oc.monthlyAmount)}
                    valueMuted
                    signSource={oc.monthlyAmount}
                  />
                );
              })()}

              <Divider sx={{ my: 2, borderColor: "divider" }} />

              {/* Taxes */}
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "text.primary" }}>
                Taxes
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
                <Typography sx={{ fontSize: 13, color: "text.secondary" }}>Income Tax</Typography>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="flex-end"
                  gap={0.5}
                  sx={{ minWidth: 170 }}
                >
                  {editTax && !readOnlyIncomeTax ? (
                    <>
                      <TextField
                        size="small"
                        type="text"
                        value={formatNumericInput(incomeTaxInput)}
                        onChange={(e) => setIncomeTaxInput(sanitizeNumericInput(e.target.value))}
                        inputProps={{ min: 0, step: "0.01", inputMode: "decimal" }}
                        sx={{
                          width: 120,
                          "& .MuiOutlinedInput-root": { fontSize: 13, bgcolor: "background.paper" },
                        }}
                      />
                      <IconButton size="small" color="primary" onClick={handleSaveIncomeTax} disabled={isSavingTax}>
                        {isSavingTax ? <CircularProgress size={16} color="inherit" /> : <CheckIcon fontSize="small" />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditTax(false);
                          setIncomeTaxInput(String(editedIncomeTax));
                        }}
                        disabled={isSavingTax}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      {isIncomeTaxOverridden ? (
                        <Box
                          sx={{
                            textAlign: "right",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            mr: 0.25,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 11,
                              color:
                                toFiniteAmount(actualIncomeTax, 0) < 0
                                  ? "error.main"
                                  : "text.secondary",
                              fontVariantNumeric: "tabular-nums",
                              textDecoration: "line-through",
                              lineHeight: 1.2,
                            }}
                          >
                            {fmtLine(actualIncomeTax)}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: 700,
                              color:
                                toFiniteAmount(editedIncomeTax, 0) < 0
                                  ? "error.main"
                                  : "text.primary",
                              fontVariantNumeric: "tabular-nums",
                              lineHeight: 1.2,
                            }}
                          >
                            {fmtLine(editedIncomeTax)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 700,
                            color:
                              toFiniteAmount(editedIncomeTax, 0) < 0
                                ? "error.main"
                                : "text.primary",
                            fontVariantNumeric: "tabular-nums",
                            mr: 0.25,
                          }}
                        >
                          {fmtLine(editedIncomeTax)}
                        </Typography>
                      )}
                      {!readOnlyIncomeTax ? (
                        <IconButton size="small" onClick={() => setEditTax(true)} sx={{ color: "text.secondary" }}>
                          <EditOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      ) : null}
                    </>
                  )}
                </Box>
              </Box>

            </Box>
          )}
        </Box>

        {data ? (
          <Box
            sx={{
              flexShrink: 0,
              px: 2.5,
              py: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              boxShadow: "0 -4px 12px rgba(0,0,0,0.06)",
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: !disableDownload ? 1.25 : '' }}
            >
              <Typography sx={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.04em" }}>
                NET PAY
              </Typography>
              <Typography
                sx={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: toFiniteAmount(data.netPay, 0) < 0 ? "error.main" : "success.main",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmt(data.netPay)}
              </Typography>
            </Box>
            {!disableDownload && <Button
              fullWidth
              size="small"
              variant="contained"
              disableElevation
              startIcon={
                isDownloadingPayslip ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />
                )
              }
              onClick={handleDownloadPayslip}
              disabled={isDownloadingPayslip || !hasValidEmployeeId}
              sx={{
                py: 0.75,
                borderRadius: 1.25,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Download Payslip
            </Button>}
          </Box>
        ) : null}

        {message && (
          <Snackbar
            message={message.text}
            color={message.type}
            onClose={() => setMessage(null)}
          />
        )}
      </Box>
    </Drawer>
  );
}
