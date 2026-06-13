import { Box, Stack, Typography } from "@mui/material";
import CustomCircularProgress from "../../../../../../../components/atom/circular-progress/CircularProgress";
import type { PaySchedulePayload } from "../types/payschedule.types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ordinal(n: number): string {
  const s = String(n);
  const last = s.slice(-1);
  const last2 = s.slice(-2);
  if (last2 === "11" || last2 === "12" || last2 === "13") return `${n}th`;
  if (last === "1") return `${n}st`;
  if (last === "2") return `${n}nd`;
  if (last === "3") return `${n}rd`;
  return `${n}th`;
}

function formatWorkingDays(workingDays?: string | null): string {
  if (!workingDays) return "-";
  return workingDays
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(",");
}

function formatYyyyMmToMonthYear(yyyyMm?: string | null): string {
  if (!yyyyMm || yyyyMm.length < 7) return "-";
  const [y, m] = yyyyMm.split("-");
  const monthIdx = parseInt(m, 10) - 1;
  const month = MONTH_NAMES[monthIdx];
  return month && y ? `${month} ${y}` : "-";
}

function formatYyyyMmToMonthOnly(yyyyMm?: string | null): string {
  if (!yyyyMm || yyyyMm.length < 7) return "-";
  const m = yyyyMm.split("-")[1];
  const monthIdx = parseInt(m, 10) - 1;
  return MONTH_NAMES[monthIdx] ?? "-";
}

function dayFromIsoDate(iso?: string | null): number | null {
  if (!iso || iso.length < 10) return null;
  const d = parseInt(iso.slice(8, 10), 10);
  return Number.isNaN(d) ? null : d;
}

function formatDisplayValue(
  data: { frequency?: string; workingDays?: string; dateOfProcessing?: number; firstPayrollFrom?: string | null; financialYearStart?: string | null; financialYearEnd?: string | null; considerPoiFrom?: number; isCalendarMonth?: boolean; fromPayCycle?: string; toPayCycle?: string } | null
): { label: string; value: string }[] {
  if (!data) {
    return [
      { label: "Pay Frequency", value: "-" },
      { label: "Working Days", value: "-" },
      { label: "Pay Day", value: "-" },
      { label: "First Pay Period", value: "-" },
      { label: "Pay Cycle", value: "-" },
      { label: "Financial Year", value: "-" },
      { label: "Consider POI From", value: "-" },
    ];
  }
  const freq = data.frequency ? data.frequency.charAt(0).toUpperCase() + data.frequency.slice(1) : "-";
  const payDay =
    data.dateOfProcessing != null
      ? `${ordinal(data.dateOfProcessing)} of every Month`
      : "-";
  const firstPayPeriod = formatYyyyMmToMonthYear(data.firstPayrollFrom);
  const financialYear =
    data.financialYearStart && data.financialYearEnd
      ? `${formatYyyyMmToMonthOnly(data.financialYearStart)} - ${formatYyyyMmToMonthOnly(data.financialYearEnd)}`
      : "-";
  const payCycle =
    data.isCalendarMonth
      ? "Calendar month"
      : data.fromPayCycle && data.toPayCycle
        ? (() => {
            const d1 = dayFromIsoDate(data.fromPayCycle);
            const d2 = dayFromIsoDate(data.toPayCycle);
            if (d1 != null && d2 != null) return `${ordinal(d1)} of Month - ${ordinal(d2)} of Month`;
            return `${data.fromPayCycle} to ${data.toPayCycle}`;
          })()
        : "-";
  const poiFrom =
    data.considerPoiFrom != null && data.considerPoiFrom >= 1 && data.considerPoiFrom <= 12
      ? `${ordinal(data.considerPoiFrom)} Month`
      : "-";
  return [
    { label: "Pay Frequency", value: freq },
    { label: "Working Days", value: formatWorkingDays(data.workingDays) },
    { label: "Pay Day", value: payDay },
    { label: "First Pay Period", value: firstPayPeriod },
    { label: "Pay Cycle", value: payCycle },
    { label: "Financial Year", value: financialYear },
    { label: "Consider POI From", value: poiFrom },
  ];
}

export interface PayScheduleProps {
  /** Schedule data from parent (PayrunView) – single source of truth, no GET here. */
  scheduleData?: PaySchedulePayload | null;
  /** Loading state from parent fetch. */
  isLoading?: boolean;
  /** Called when Add/Edit is clicked so parent can open the modal. */
  onOpenModal?: () => void;
}

export function PaySchedule({ scheduleData = null, isLoading = false, onOpenModal }: PayScheduleProps) {
  const fields = formatDisplayValue(scheduleData ?? null);

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        backgroundColor: (theme) => theme.palette.background.paper,
        overflow: "auto",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        gap={1.5}
        mb={2}
      >
        <Typography variant="h6" fontWeight={600}>
          Pay Schedule
        </Typography>
      </Stack>

      {isLoading ? (
        <Stack alignItems="center" py={3}>
          <CustomCircularProgress size={24} />
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          {fields.map((field, idx) => (
            <Stack
              key={idx}
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={{ xs: 0.25, sm: 0 }}
            >
              <Box sx={{ minWidth: { xs: 0, sm: 140, md: 200 } }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {field.label}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {field.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default PaySchedule;
