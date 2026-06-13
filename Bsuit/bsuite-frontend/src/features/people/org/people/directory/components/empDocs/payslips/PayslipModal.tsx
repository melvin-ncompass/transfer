import {
    Box,
    Typography,
    Divider,
    Skeleton,
    Alert,
    Chip,
} from "@mui/material";
import dayjs from "dayjs";
import { ModalElement } from "../../../../../../../../components/dialogs/modal-element";
import { useGetPayslipQuery } from "../../../../../../salary/payrun/runpayroll/api/payrun.api";

interface PayslipModalProps {
    open: boolean;
    onClose: () => void;
    employeeId: number;
    payrunId: number | null;
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

const fmtLine = (amount: unknown) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
        toFiniteAmount(amount, 0)
    );

function formatLopDaysForDisplay(value: unknown): string {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value ?? "");
    if (Number.isInteger(n)) return String(n);
    return String(Number(n.toFixed(4)));
}

export default function PayslipModal({ open, onClose, employeeId, payrunId }: PayslipModalProps) {
    const hasValidIds = payrunId != null && Number.isFinite(employeeId) && employeeId > 0;

    const { data, isLoading, isError } = useGetPayslipQuery(
        { payrunId: payrunId!, employeeId },
        {
            skip: !open || !hasValidIds,
            refetchOnMountOrArgChange: true,
        }
    );

    return (
        <ModalElement open={open} onClose={onClose} title="Payslip" maxWidth="xs">
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

            {data && (
                <>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, fontSize: 12 }}>
                        {dayjs(data.periodStart).format("MMM DD, YYYY")} –{" "}
                        {dayjs(data.periodEnd).format("MMM DD, YYYY")}
                    </Typography>

                    <LineRow label="Payable Days" value={String(toFiniteAmount(data.noOfPaidDays, 0))} />
                    {Number(data.lopDays) > 0 && (
                        <Box sx={{ mt: 1.25, mb: 1 }}>
                            <Chip
                                size="small"
                                label={`LOP: ${formatLopDaysForDisplay(data.lopDays)} days`}
                                color="error"
                                variant="outlined"
                                sx={{ fontWeight: 600, fontSize: 12 }}
                            />
                        </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Earnings */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "success.main" }}>
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
                    <Box sx={{ mt: 1, pt: 1, borderTop: "1px dashed", borderColor: "divider" }}>
                        <LineRow
                            label={<span style={{ fontWeight: 600 }}>Gross earnings</span>}
                            value={<span style={{ fontWeight: 700 }}>{fmtLine(data.totalEarnings)}</span>}
                            signSource={data.totalEarnings}
                        />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Deductions */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "error.main" }}>
                            (-) Deductions
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, fontWeight: 500 }}>
                            Amount
                        </Typography>
                    </Box>
                    {data.deductionDetails
                        .filter((d) => d.deductionComponentName !== "PF- Employer Contribution")
                        .map((row) => (
                            <LineRow
                                key={`${row.deductionId}-${row.deductionComponentName}`}
                                label={row.deductionComponentName || row.deductionName}
                                value={fmtLine(row.monthlyAmount)}
                                signSource={row.monthlyAmount}
                            />
                        ))}
                    {(() => {
                        const oc = data.otherComponents;
                        if (!oc || typeof oc !== "object" || Object.keys(oc).length === 0) return null;
                        const name = oc.deductionComponentName;
                        if (!name || String(name).trim() === "" || name === "PF- Employer Contribution") return null;
                        return <LineRow label={name} value={fmtLine(oc.monthlyAmount)} valueMuted signSource={oc.monthlyAmount} />;
                    })()}

                    <Divider sx={{ my: 2 }} />

                    {/* Taxes */}
                    <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>Taxes</Typography>
                    <LineRow label="Income Tax" value={fmtLine(data.incomeTax)} signSource={data.incomeTax} />

                    <Divider sx={{ my: 2 }} />

                    {/* Net Pay */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
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
                </>
            )}
        </ModalElement>
    );
}

function LineRow({
    label,
    value,
    valueMuted,
    signSource,
}: {
    label: React.ReactNode;
    value: React.ReactNode;
    valueMuted?: boolean;
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
                sx={{ fontSize: 13, color: "text.secondary", fontWeight: 400, lineHeight: 1.4 }}
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