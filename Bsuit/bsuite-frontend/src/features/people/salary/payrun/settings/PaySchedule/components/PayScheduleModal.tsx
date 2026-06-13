import { useState, useEffect, useRef, useMemo } from "react";
import { Box, Stack, Typography, Alert } from "@mui/material";
import { ModalElement } from "../../../../../../../components/dialogs/modal-element";
import { type WeekDay } from "../../../../../../../components/atom/date-picker";
import { MonthYearPickerElement } from "../../../../../../../components/atom/date-picker";
import { SingleSelectElement } from "../../../../../../../components/atom/select-field/SingleSelect";
import { DayPicker } from "../../../../../../../components/atom/date-picker";
import { Dayjs } from "dayjs";
import { DateRangePicker } from "../../../../../../../components/atom/custom-date-range-picker";
import { Checkbox } from "../../../../../../../components/atom/check-box";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import {
  useCreatePayScheduleMutation,
  useUpdatePayScheduleMutation,
} from "../api/payschedule.api";
import type { PaySchedulePayload } from "../types/payschedule.types";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const o = err as { data?: { message?: string }; message?: string };
    if (typeof o.data?.message === "string") return o.data.message;
    if (typeof o.message === "string") return o.message;
  }
  return "Something went wrong. Please try again.";
}

const WEEK_DAY_MAP: Record<string, WeekDay> = {
  MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun",
};

function parseWorkingDaysToWeekDays(workingDays?: string | string[] | null): WeekDay[] {
  if (workingDays == null || workingDays === "") return ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const rawList: string[] = Array.isArray(workingDays)
    ? workingDays.map((d) => (typeof d === "string" ? d.trim() : ""))
    : String(workingDays)
        .split(",")
        .map((s) => s.trim());
  const result: WeekDay[] = [];
  for (const s of rawList) {
    if (!s) continue;
    const code = s.toUpperCase().slice(0, 3);
    const day = WEEK_DAY_MAP[code];
    if (day && !result.includes(day)) result.push(day);
  }
  return result.length > 0 ? result : ["Mon", "Tue", "Wed", "Thu", "Fri"];
}

/** Normalize for comparison: same format as buildPayload (YYYY-MM, YYYY-MM-DD, "Mon, Tue", etc.) */
function normalizeForCompare(a: PaySchedulePayload): PaySchedulePayload {
  const normYyyyMm = (s: string | null | undefined): string | null =>
    s == null || s === "" ? null : String(s).slice(0, 7);
  const normYyyyMmDd = (s: string | null | undefined): string =>
    s == null || s === "" ? "" : String(s).slice(0, 10);
  const normWorkingDays = (s: string | null | undefined): string =>
    !s ? "" : s.split(",").map((p) => p.trim()).filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(", ");
  return {
    frequency: (a.frequency ?? "").toLowerCase(),
    workingDays: normWorkingDays(a.workingDays),
    dateOfProcessing: a.dateOfProcessing ?? 0,
    firstPayrollFrom: normYyyyMm(a.firstPayrollFrom),
    financialYearStart: normYyyyMm(a.financialYearStart),
    financialYearEnd: normYyyyMm(a.financialYearEnd),
    considerPoiFrom: a.considerPoiFrom ?? 4,
    isCalendarMonth: a.isCalendarMonth ?? false,
    fromPayCycle: normYyyyMmDd(a.fromPayCycle),
    toPayCycle: normYyyyMmDd(a.toPayCycle),
  };
}

export interface PayScheduleModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the backend response message on success (display as-is in snackbar) */
  onSuccess?: (message: string) => void;
  /** Called with the backend error message on failure */
  onError?: (message: string) => void;
  mode: "add" | "edit";
  /** Prefill for edit mode – from PayrunView (single source of truth), no GET in modal. */
  initialData?: PaySchedulePayload | null;
}

const defaultDays: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function PayScheduleModal({
  open,
  onClose,
  onSuccess,
  onError,
  mode = "add",
  initialData = null,
}: PayScheduleModalProps) {
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>([...defaultDays]);
  const [financialYearStart, setFinancialYearStart] = useState<Dayjs | null>(null);
  const [financialYearEnd, setFinancialYearEnd] = useState<Dayjs | null>(null);
  const [poiFrom, setPoiFrom] = useState<string>("April");
  const [frequency, setFrequency] = useState<string>("Monthly");
  const [payOnEvery, setPayOnEvery] = useState<string>("1");
  const [firstPayrollMonth, setFirstPayrollMonth] = useState<Dayjs | null>(null);
  const [paycycleRange, setPaycycleRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [calendarMonth, setCalendarMonth] = useState<boolean>(false);
  const hasPrefilledRef = useRef(false);

  const [errors, setErrors] = useState({
    financialYear: "",
    firstPayrollMonth: "",
    payCycle: "",
  });

  const [create, { isLoading: isCreatePending }] = useCreatePayScheduleMutation();
  const [update, { isLoading: isUpdatePending }] = useUpdatePayScheduleMutation();
  const isSavePending = isCreatePending || isUpdatePending;

  const months = MONTH_NAMES.map((m) => ({ label: m, value: m }));
  const daysInMonth = Array.from({ length: 31 }, (_, i) => ({
    label: `${i + 1}`,
    value: `${i + 1}`,
  }));

  // Populate form once when edit data loads; reset when closing. Avoid re-running so typing isn't overwritten.
  useEffect(() => {
    if (!open) {
      hasPrefilledRef.current = false;
      setSelectedDays([...defaultDays]);
      setFinancialYearStart(null);
      setFinancialYearEnd(null);
      setPoiFrom("April");
      setFrequency("Monthly");
      setPayOnEvery("1");
      setFirstPayrollMonth(null);
      setPaycycleRange([null, null]);
      setCalendarMonth(false);
      setErrors({ financialYear: "", firstPayrollMonth: "", payCycle: "" });
      return;
    }
    if (mode === "add") {
      setSelectedDays([...defaultDays]);
      setFinancialYearStart(null);
      setFinancialYearEnd(null);
      setPoiFrom("April");
      setFrequency("Monthly");
      setPayOnEvery("1");
      setFirstPayrollMonth(null);
      setPaycycleRange([null, null]);
      setCalendarMonth(false);
      setErrors({ financialYear: "", firstPayrollMonth: "", payCycle: "" });
      return;
    }
    const editData = mode === "edit" ? initialData : null;
    if (!editData) return;
    if (!hasPrefilledRef.current) {
      setSelectedDays(parseWorkingDaysToWeekDays(editData.workingDays));
      setFinancialYearStart(editData.financialYearStart ? dayjs(editData.financialYearStart) : null);
      setFinancialYearEnd(editData.financialYearEnd ? dayjs(editData.financialYearEnd) : null);
      setPoiFrom(MONTH_NAMES[(editData.considerPoiFrom ?? 4) - 1] ?? "April");
      setFrequency(editData.frequency ? editData.frequency.charAt(0).toUpperCase() + editData.frequency.slice(1) : "Monthly");
      setPayOnEvery(String(editData.dateOfProcessing ?? "1"));
      setFirstPayrollMonth(editData.firstPayrollFrom ? dayjs(editData.firstPayrollFrom) : null);
      setCalendarMonth(Boolean(editData.isCalendarMonth));
      if (editData.fromPayCycle && editData.toPayCycle) {
        setPaycycleRange([dayjs(editData.fromPayCycle), dayjs(editData.toPayCycle)]);
      } else {
        setPaycycleRange([null, null]);
      }
      setErrors({ financialYear: "", firstPayrollMonth: "", payCycle: "" });
      hasPrefilledRef.current = true;
    }
  }, [open, mode, initialData]);

  // ---------- Validation Logic ----------
  useEffect(() => {
    const newErrors = {
      financialYear: "",
      firstPayrollMonth: "",
      payCycle: "",
    };

    // Validate Financial Year - exactly 12 months span (e.g. Feb 2024 → Jan 2025)
    if (financialYearStart && financialYearEnd) {
      const expectedEnd = financialYearStart.add(11, "month");
      if (!financialYearEnd.isSame(expectedEnd, "month")) {
        newErrors.financialYear = `Financial year must span exactly 12 months. Expected end: ${expectedEnd.format("MMM YYYY")}`;
      }
    }

    // Validate First Payroll Month
    if (firstPayrollMonth && financialYearStart && financialYearEnd) {
      if (
        firstPayrollMonth.isBefore(financialYearStart, 'month') ||
        firstPayrollMonth.isAfter(financialYearEnd, 'month')
      ) {
        newErrors.firstPayrollMonth = "First payroll month must be within financial year";
      }
    }

    // Validate Pay Cycle Range (only if not calendar month)
    if (!calendarMonth && paycycleRange?.[0] && paycycleRange?.[1]) {
      const cycleStart = paycycleRange[0];
      const cycleEnd = paycycleRange[1];

      // Either pay cycle start or end must fall in the month of first payroll from
      if (firstPayrollMonth) {
        const startInFirstPayrollMonth = firstPayrollMonth.isSame(cycleStart, "month");
        const endInFirstPayrollMonth = firstPayrollMonth.isSame(cycleEnd, "month");
        if (!startInFirstPayrollMonth && !endInFirstPayrollMonth) {
          newErrors.payCycle =
            "Pay cycle start or end date must be in the month of first payroll from";
        }
      }

      // Check if pay cycle doesn't span more than 2 months
      if (!newErrors.payCycle) {
        const monthsDiff = cycleEnd.diff(cycleStart, "month", true);
        if (monthsDiff > 2) {
          newErrors.payCycle = "Pay cycle cannot span more than 2 months";
        }
      }
    }


    setErrors(newErrors);
  }, [
    financialYearStart,
    financialYearEnd,
    firstPayrollMonth,
    paycycleRange,
    calendarMonth,
  ]);

  const buildPayload = (): PaySchedulePayload => {
    const monthMap: Record<string, number> = {
      January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
      July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
    };
    const payload: PaySchedulePayload = {
      frequency: frequency.toLowerCase(),
      workingDays: selectedDays
        .map((d) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase())
        .join(", "),
      dateOfProcessing: Number(payOnEvery),
      firstPayrollFrom: firstPayrollMonth
        ? dayjs(firstPayrollMonth).format("YYYY-MM")
        : null,
      financialYearStart: financialYearStart
        ? dayjs(financialYearStart).format("YYYY-MM")
        : null,
      financialYearEnd: financialYearEnd
        ? dayjs(financialYearEnd).format("YYYY-MM")
        : null,
      considerPoiFrom: monthMap[poiFrom] ?? 4,
      isCalendarMonth: calendarMonth,
    };
    if (!calendarMonth && paycycleRange?.[0] && paycycleRange?.[1]) {
      payload.fromPayCycle = dayjs(paycycleRange[0]).format("YYYY-MM-DD");
      payload.toPayCycle = dayjs(paycycleRange[1]).format("YYYY-MM-DD");
    }
    return payload;
  };

  const hasNoChanges = useMemo(() => {
    if (mode !== "edit" || !initialData) return false;
    const current = buildPayload();
    const cur = normalizeForCompare(current);
    const init = normalizeForCompare(initialData);
    return (
      cur.frequency === init.frequency &&
      cur.workingDays === init.workingDays &&
      cur.dateOfProcessing === init.dateOfProcessing &&
      (cur.firstPayrollFrom ?? null) === (init.firstPayrollFrom ?? null) &&
      (cur.financialYearStart ?? null) === (init.financialYearStart ?? null) &&
      (cur.financialYearEnd ?? null) === (init.financialYearEnd ?? null) &&
      cur.considerPoiFrom === init.considerPoiFrom &&
      cur.isCalendarMonth === init.isCalendarMonth &&
      (cur.fromPayCycle ?? "") === (init.fromPayCycle ?? "") &&
      (cur.toPayCycle ?? "") === (init.toPayCycle ?? "")
    );
  }, [
    mode,
    initialData,
    frequency,
    payOnEvery,
    poiFrom,
    calendarMonth,
    selectedDays,
    financialYearStart,
    financialYearEnd,
    firstPayrollMonth,
    paycycleRange,
  ]);

  const hasErrors = Object.values(errors).some((error) => error !== "");
  const isValid =
    selectedDays.length > 0 &&
    financialYearStart &&
    financialYearEnd &&
    firstPayrollMonth &&
    !hasErrors &&
    (calendarMonth || (paycycleRange?.[0] && paycycleRange?.[1]));
  const isSaveDisabled = !isValid || isSavePending || hasNoChanges;

  const saveDisabledActionTooltip = useMemo(() => {
    if (!isSaveDisabled) return undefined;
    const reasons: string[] = [];
    if (isSavePending) reasons.push("Save is in progress.");
    if (hasNoChanges) reasons.push("Make a change before saving.");
    if (selectedDays.length === 0) reasons.push("Select at least one work week day.");
    if (!financialYearStart) reasons.push("Financial year start is required.");
    if (!financialYearEnd) reasons.push("Financial year end is required.");
    if (!firstPayrollMonth) reasons.push("First payroll from is required.");
    if (!calendarMonth && (!paycycleRange?.[0] || !paycycleRange?.[1])) {
      reasons.push("Select a pay cycle range, or enable Calendar Month.");
    }
    if (errors.financialYear) reasons.push(errors.financialYear);
    if (errors.firstPayrollMonth) reasons.push(errors.firstPayrollMonth);
    if (errors.payCycle) reasons.push(errors.payCycle);
    if (reasons.length === 0) return "Save is disabled.";
    return (
      <Stack component="ul" sx={{ m: 0, pl: 2, py: 0 }} spacing={0.5}>
        {reasons.map((text, i) => (
          <Typography key={i} component="li" variant="body2" sx={{ display: "list-item" }}>
            {text}
          </Typography>
        ))}
      </Stack>
    );
  }, [
    isSaveDisabled,
    isSavePending,
    hasNoChanges,
    selectedDays.length,
    financialYearStart,
    financialYearEnd,
    firstPayrollMonth,
    calendarMonth,
    paycycleRange,
    errors.financialYear,
    errors.firstPayrollMonth,
    errors.payCycle,
  ]);

  const handleSave = async () => {
    const payload = buildPayload();
    try {
      const result =
        mode === "edit"
          ? await update(payload).unwrap()
          : await create(payload).unwrap();
      onSuccess?.(result?.message ?? "Saved successfully.");
      onClose();
    } catch (err) {
      onError?.(getErrorMessage(err));
    }
  };

  return (
    <ModalElement
      open={open}
      title={mode === "edit" ? "Edit Pay Schedule" : "Add Pay Schedule"}
      onClose={onClose}
      onClick={handleSave}
      maxWidth="md"
      height="auto"
      disabled={isSaveDisabled}
      disabledActionTooltip={saveDisabledActionTooltip}
    >
      <Stack spacing={3.5} sx={{ py: 1 }}>
        <>
        {/* ---------- Work Week Section (Replaced with DayPicker Atom) ---------- */}
        <Box>
          <DayPicker
            value={selectedDays}
            onChange={setSelectedDays}
            label="Work Week"
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Select the days employees work during the week
          </Typography>
        </Box>

        {/* ---------- Financial Year Section ---------- */}
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            color="text.primary"
            gutterBottom
            sx={{ mb: 1.5 }}
          >
            Financial Year
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Box sx={{ flex: "1 1" }}>
              <MonthYearPickerElement
                label="Financial Year Start"
                width="100%"
                value={financialYearStart}
                onChange={setFinancialYearStart}
                required
                error={!!errors.financialYear}
                helperText={errors.financialYear || ""}
              />
            </Box>
            <Box sx={{ flex: "1 1" }}>
              <MonthYearPickerElement
                label="Financial Year End"
                width="100%"
                value={financialYearEnd}
                onChange={setFinancialYearEnd}
                required
                error={!!errors.financialYear}
                helperText={errors.financialYear || ""}
                min={financialYearStart}
                max={financialYearStart ? financialYearStart.add(11, "month") : null}
              />
            </Box>
          </Stack>
        </Box>

        {/* ---------- Payroll Configuration Section ---------- */}
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            color="text.primary"
            gutterBottom
            sx={{ mb: 1.5 }}
          >
            Payroll Configuration
          </Typography>
          
          <Stack spacing={2.5}>
            {/* Row 1: POI From & Frequency */}
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Box sx={{ flex: "1 1 45%", minWidth: "250px" }}>
                <SingleSelectElement
                  label="POI From"
                  value={poiFrom}
                  onChange={setPoiFrom}
                  options={months}
                  helperText="Proof of Investment"
                />
              </Box>
              <Box sx={{ flex: "1 1 45%", minWidth: "250px" }}>
                <SingleSelectElement
                  label="Frequency"
                  value={frequency}
                  onChange={setFrequency}
                  options={[{ label: "Monthly", value: "Monthly" }]}
                  disabled
                  helperText="Payment frequency (currently monthly only)"
                />
              </Box>
            </Stack>

            {/* Row 2: Pay On Every & First Payroll Month */}
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Box sx={{ flex: "1 1" }}>
                <SingleSelectElement
                  label="Pay Day of Month"
                  value={payOnEvery}
                  onChange={setPayOnEvery}
                  options={daysInMonth}
                  helperText="Day of the month to process payroll"
                />
              </Box>
              <Box sx={{ flex: "1 1" }}>
                <MonthYearPickerElement
                  required
                  width="100%"
                  label="First Payroll From"
                  value={firstPayrollMonth}
                  onChange={setFirstPayrollMonth}
                  error={!!errors.firstPayrollMonth}
                  helperText={errors.firstPayrollMonth || "When to start the first payroll"}
                  min={financialYearStart || undefined}
                  max={financialYearEnd || undefined}
                />
              </Box>
            </Stack>
          </Stack>
        </Box>

        {/* ---------- Pay Cycle Range Section ---------- */}
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            color="text.primary"
            gutterBottom
            sx={{ mb: 1.5 }}
          >
            Pay Cycle Range
          </Typography>

          {/* Checkbox — Calendar Month */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Checkbox
              checked={calendarMonth}
              onChange={(e) => setCalendarMonth(e.target.checked)}
            />
            <Typography variant="body2" color="text.primary">
              Calendar Month
            </Typography>
          </Stack>

          {/* Conditionally show DateRangePicker only if unchecked */}
          {!calendarMonth && (
            <Box sx={{ flex: "1 1 100%", minWidth: "300px" }}>
              <DateRangePicker
                label="Select Pay Cycle"
                startValue={paycycleRange?.[0] || null}
                endValue={paycycleRange?.[1] || null}
                onChange={setPaycycleRange}
                months={2}
                displayFormat="day-only"
                error={!!errors.payCycle}
                helperText={errors.payCycle || ""}
                /* Pay cycle: month *before* First Payroll From through end of that month (e.g. Feb → Jan–Feb, not Feb–Mar) */
                min={
                  firstPayrollMonth
                    ? firstPayrollMonth.subtract(1, "month").startOf("month")
                    : dayjs().subtract(1, "month").startOf("month")
                }
                max={
                  firstPayrollMonth
                    ? firstPayrollMonth.endOf("month")
                    : dayjs().endOf("month")
                }
              />
            </Box>
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1.5, display: "block" }}
          >
            {calendarMonth
              ? "Pay cycle is set to the full calendar month."
              : "Define the pay cycle period (e.g., 26th March to 25th April). Can span up to 2 months."}
          </Typography>
        </Box>

          </>
      </Stack>
    </ModalElement>
  );
}