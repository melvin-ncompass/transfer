import {
    Box,
    Typography,
    Divider,
    Skeleton,
    Alert,
    Chip,
    Drawer,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useGetTdsSheetQuery } from "../../../../../../salary/payrun/runpayroll/api/payrun.api";
import type { TdsSheetResponse } from "../../../../../../salary/payrun/runpayroll/api/payrun.api";

interface TdsModalProps {
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

const pct = (value: unknown) => {
    const n = toFiniteAmount(value, 0);
    return Number.isInteger(n) ? `${n}%` : `${Number(n.toFixed(2))}%`;
};

export default function TdsModal({ open, onClose, employeeId, payrunId }: TdsModalProps) {
    const hasValidIds = payrunId != null && Number.isFinite(employeeId) && employeeId > 0;

    const { data, isLoading, isError } = useGetTdsSheetQuery(
        { payrunId: payrunId!, employeeId },
        { skip: !open || !hasValidIds }
    );

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            slotProps={{
                paper: {
                    sx: {
                        width: { xs: "100vw", sm: 420, md: 460 },
                        maxWidth: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: "#fafafa",
                    },
                },
            }}
        >
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
                    <Typography sx={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em" }}>
                        TDS Sheet
                    </Typography>
                    <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Content */}
                <Box
                    sx={{
                        px: 2.5,
                        py: 2,
                        overflowY: "auto",
                        flex: 1,
                        minHeight: 0,
                    }}
                >
                    {isLoading && (
                        <Box>
                            {[...Array(10)].map((_, i) => (
                                <Skeleton key={i} height={28} sx={{ mb: 1.2, borderRadius: 1 }} />
                            ))}
                        </Box>
                    )}

                    {isError && (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                            Failed to load TDS sheet. Please try again.
                        </Alert>
                    )}

                    {data && <TdsSheetContent data={data} />}
                </Box>
            </Box>
        </Drawer>
    );
}

function TdsSheetContent({ data }: { data: TdsSheetResponse }) {
    const hasHra = data.hraAmount != null && toFiniteAmount(data.hraAmount, 0) > 0;
    const hasPrevEmp = data.prevEmploymentData != null;

    return (
        <>
            {/* Header meta */}
            <Box sx={{ mb: 2 }} display="flex" gap={1} flexWrap="wrap" alignItems="center">
                <Chip size="small" label={data.taxConfigName || data.configName} color="primary" variant="outlined" sx={{ fontWeight: 600, fontSize: 12 }} />
                {data.panNumber && (
                    <Chip size="small" label={`PAN: ${data.panNumber}`} variant="outlined" sx={{ fontSize: 12 }} />
                )}
                {data.poiStatus && (
                    <Chip
                        size="small"
                        label={`POI: ${data.poiStatus}`}
                        color={data.poiStatus.toLowerCase() === "approved" ? "success" : "warning"}
                        variant="outlined"
                        sx={{ fontSize: 12 }}
                    />
                )}
            </Box>

            {/* Aggregated Earnings */}
            <SectionHeader label="Earnings" />
            {Object.entries(data.aggregatedEarnings).map(([name, row]) => (
                <ThreeColRow
                    key={name}
                    label={name}
                    left={fmtLine(row.actual)}
                    right={fmtLine(row.gross)}
                    leftLabel="Actual"
                    rightLabel="Gross"
                />
            ))}
            <SummaryRow label="Total Earnings" value={fmt(data.totalEarnings)} />

            <Divider sx={{ my: 2 }} />

            {/* Exemptions & Deductions */}
            <SectionHeader label="Exemptions & Deductions" />
            {hasHra && (
                <LineRow label="HRA Exemption" value={fmtLine(data.hraAmount)} />
            )}
            <LineRow label="Total Declared Exemptions" value={fmtLine(data.totalDeclaredExemptions)} />
            <LineRow label="Standard Deduction" value={fmtLine(data.standardDeduction)} />
            <LineRow label="Section 16 Total" value={fmtLine(data.section16Total)} />
            <SummaryRow label="After Exemptions" value={fmt(data.totalAfterExemptions)} />

            <Divider sx={{ my: 2 }} />

            {/* Previous Employment */}
            {hasPrevEmp && (
                <>
                    <SectionHeader label="Previous Employment" />
                    <LineRow label="Previous Earnings" value={fmtLine(data.prevEmploymentData!.prevEarnings)} />
                    <LineRow label="Tax Previously Paid" value={fmtLine(data.prevEmploymentData!.previouslyPaid)} />
                    <LineRow label="PF Paid" value={fmtLine(data.prevEmploymentData!.pfPaid)} />
                    <LineRow label="PT Paid" value={fmtLine(data.prevEmploymentData!.ptPaid)} />
                    {data.taxableIncomeFromPrevEmp != null && (
                        <LineRow label="Taxable from Prev. Emp" value={fmtLine(data.taxableIncomeFromPrevEmp)} />
                    )}
                    <Divider sx={{ my: 2 }} />
                </>
            )}

            {/* Income Summary */}
            <SectionHeader label="Income Summary" />
            <LineRow label="Total Income" value={fmtLine(data.totalIncome)} />
            <LineRow label="After House Loan" value={fmtLine(data.totalIncomeAfterHouseLoan)} />
            <LineRow label="Income Under Head Salaries" value={fmtLine(data.incomeUnderHeadSalaries)} />
            <SummaryRow label="Gross Total" value={fmt(data.grossTotal)} />

            <Divider sx={{ my: 2 }} />

            {/* Slab Breakdown */}
            {data.slabBreakdown?.length > 0 && (
                <>
                    <SectionHeader label="Tax Slab Breakdown" />
                    {data.slabBreakdown.map((slab, i) => (
                        <LineRow
                            key={i}
                            label={`${fmt(slab.from)} – ${slab.to >= 1e9 ? "Above" : fmt(slab.to)} @ ${pct(slab.tax)}`}
                            value={fmtLine(slab.taxAmount)}
                        />
                    ))}
                    <Divider sx={{ my: 2 }} />
                </>
            )}

            {/* Tax Summary */}
            <SectionHeader label="Tax Summary" />
            {data.taxAfterRebateRelief != null && (
                <LineRow label="Tax After Rebate / Relief" value={fmtLine(data.taxAfterRebateRelief)} />
            )}
            {data.totalSurchargeAmount != null && data.totalSurchargeAmount > 0 && (
                <LineRow label="Surcharge" value={fmtLine(data.totalSurchargeAmount)} />
            )}
            <LineRow label="Tax Payable" value={fmtLine(data.taxPayable)} />
            <LineRow label="Tax Deducted at Source" value={fmtLine(data.taxDeductedAtSource)} />
            <LineRow label="Upcoming TDS" value={fmtLine(data.upcomingTds)} />

            <Divider sx={{ my: 2 }} />

            {/* Net Tax */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.04em" }}>
                    INCOME TAX
                </Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 800, color: "error.main", fontVariantNumeric: "tabular-nums" }}>
                    {fmt(data.incomeTax)}
                </Typography>
            </Box>
        </>
    );
}

// ─── Shared layout components ─────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
    return (
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "text.primary" }}>
                {label}
            </Typography>
        </Box>
    );
}

function LineRow({
    label,
    value,
    muted,
}: {
    label: React.ReactNode;
    value: React.ReactNode;
    muted?: boolean;
}) {
    return (
        <Box
            display="flex"
            justifyContent="space-between"
            alignItems="baseline"
            gap={2}
            sx={{ py: 0.65 }}
        >
            <Typography variant="body2" sx={{ fontSize: 13, color: "text.secondary", fontWeight: 400, lineHeight: 1.4 }}>
                {label}
            </Typography>
            <Typography
                variant="body2"
                sx={{
                    fontSize: 13,
                    fontWeight: muted ? 400 : 500,
                    textAlign: "right",
                    color: muted ? "text.secondary" : "text.primary",
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {value}
            </Typography>
        </Box>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <Box sx={{ mt: 1, pt: 1, borderTop: "1px dashed", borderColor: "divider" }}>
            <LineRow
                label={<span style={{ fontWeight: 600 }}>{label}</span>}
                value={<span style={{ fontWeight: 700 }}>{value}</span>}
            />
        </Box>
    );
}

function ThreeColRow({
    label, left, right, leftLabel, rightLabel,
}: {
    label: string;
    left: string;
    right: string;
    leftLabel: string;
    rightLabel: string;
}) {
    return (
        <Box display="flex" justifyContent="space-between" alignItems="baseline" gap={2} sx={{ py: 0.65 }}>
            <Typography variant="body2" sx={{ fontSize: 13, color: "text.secondary", fontWeight: 400, flex: 1 }}>
                {label}
            </Typography>
            <Box display="flex" gap={3}>
                <Box textAlign="right">
                    <Typography sx={{ fontSize: 11, color: "text.disabled", fontWeight: 400 }}>{leftLabel}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{left}</Typography>
                </Box>
                <Box textAlign="right">
                    <Typography sx={{ fontSize: 11, color: "text.disabled", fontWeight: 400 }}>{rightLabel}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{right}</Typography>
                </Box>
            </Box>
        </Box>
    );
}