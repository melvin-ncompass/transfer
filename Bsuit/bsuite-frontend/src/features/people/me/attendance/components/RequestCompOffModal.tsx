import { CircularProgress, Stack, Typography } from "@mui/material";
import { useState, useCallback, useEffect } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { DateRangePicker } from "../../../../../components/atom/custom-date-range-picker";
import { TextAreaField } from "../../../../../components/atom/text-area-field";
import { PrimaryButton } from "../../../../../components/atom/button";
import { Tooltip } from "../../../../../components/atom/tooltip/Tooltip";
import { useGetEmployeeInfoQuery } from "../../../api/people.api";
import type { ShowAttendanceModalSnackbar } from "./attendanceModalSnackbar.types";
import { useCreateCompOffCreditMutation } from "../api/attendance.api";
import { extractApiErrorMessage } from "../utils/extractApiErrorMessage";

/* ─── Types ───────────────────────────────────────────────────────────────── */

export interface RequestCompOffModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful API response */
  onSubmit?: (payload: RequestCompOffFormPayload) => void;
  /** Override employee id; otherwise uses GET /employee/info */
  employeeId?: number | null;
  /** Prefill range to this day (`YYYY-MM-DD` from the attendance log row) */
  initialCompOffDateIso?: string | null;
  onSuccess?: (message: string) => void;
  /** Parent-owned snackbar (e.g. AttendancePage) */
  showSnackbar: ShowAttendanceModalSnackbar;
}

export interface RequestCompOffFormPayload {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  note: string;
  dateRange: string[];
  flag: "request" | "award";
}

function enumerateDatesInclusive(start: Dayjs, end: Dayjs): string[] {
  const out: string[] = [];
  let d = start.startOf("day");
  const endDay = end.startOf("day");
  while (d.valueOf() <= endDay.valueOf()) {
    out.push(d.format("YYYY-MM-DD"));
    d = d.add(1, "day");
  }
  return out;
}

/* ─── Component ────────────────────────────────────────────────────────────── */

export function RequestCompOffModal({
  open,
  onClose,
  onSubmit,
  employeeId: employeeIdProp,
  initialCompOffDateIso = null,
  onSuccess,
  showSnackbar,
}: RequestCompOffModalProps) {
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [note, setNote] = useState("");

  const { data: employeeInfo, isLoading: employeeLoading } = useGetEmployeeInfoQuery(undefined, {
    skip: !open,
  });
  const resolvedEmployeeId = employeeIdProp ?? employeeInfo?.data?.employeeId ?? null;

  const [createCompOffCredit, { isLoading: isSubmitting }] = useCreateCompOffCreditMutation();

  useEffect(() => {
    if (!open) return;

    if (initialCompOffDateIso) {
      const d = dayjs(initialCompOffDateIso);
      if (d.isValid()) {
        const today = dayjs().startOf("day");
        const dayStart = d.startOf("day");
        const clamped = dayStart.isAfter(today) ? today : dayStart;
        setStartDate(clamped);
        setEndDate(clamped);
      } else {
        setStartDate(null);
        setEndDate(null);
      }
    } else {
      setStartDate(null);
      setEndDate(null);
    }

    setNote("");
  }, [open, initialCompOffDateIso]);

  const handleRangeChange = useCallback((dates: [Dayjs | null, Dayjs | null]) => {
    const todayStart = dayjs().startOf("day");
    const clampDay = (d: Dayjs | null) => {
      if (d == null || !d.isValid()) return d;
      const day = d.startOf("day");
      return day.isAfter(todayStart) ? todayStart : day;
    };
    const [rawStart, rawEnd] = dates;
    let start = clampDay(rawStart ?? null);
    let end = clampDay(rawEnd ?? null);
    if (start && end && start.isAfter(end)) {
      end = start;
    }
    setStartDate(start ?? null);
    setEndDate(end ?? null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!startDate || !endDate || !note.trim()) return;
    if (resolvedEmployeeId == null) {
      showSnackbar("Employee information not available. Please try again later.", "error");
      return;
    }

    const dateRange = enumerateDatesInclusive(startDate, endDate);
    if (dateRange.length === 0) {
      showSnackbar("Please select at least one valid date.", "error");
      return;
    }

    try {
      const res = await createCompOffCredit({
        employeeId: resolvedEmployeeId,
        body: {
          dateRange,
          note: note.trim(),
          flag: "request",
        },
      }).unwrap();

      const message = res.message ?? "Comp off request submitted successfully.";
      showSnackbar(message, "success");
      onSuccess?.(message);

      const payload: RequestCompOffFormPayload = {
        startDate,
        endDate,
        note: note.trim(),
        dateRange,
        flag: "request",
      };
      onSubmit?.(payload);
      onClose();
    } catch (err) {
      showSnackbar(extractApiErrorMessage(err), "error");
    }
  }, [
    startDate,
    endDate,
    note,
    resolvedEmployeeId,
    createCompOffCredit,
    onSubmit,
    onClose,
    onSuccess,
    showSnackbar,
  ]);

  const canSubmit =
    Boolean(startDate && endDate && note.trim()) &&
    resolvedEmployeeId != null &&
    !isSubmitting &&
    !employeeLoading;

  const validationErrors: string[] = [];
  if (!startDate || !endDate)
    validationErrors.push("• Select a date range (start and end date required)");
  if (!note.trim()) validationErrors.push("• Note is required");
  if (resolvedEmployeeId == null && !employeeLoading)
    validationErrors.push("• Employee information is required");

  return (
    <ModalElement
      open={open}
      onClose={onClose}
      title="Request credit for compensatory off"
      maxWidth="sm"
    >
      <Stack spacing={2.5} sx={{ pt: 0 }}>
        {employeeLoading ? (
          <Stack alignItems="center" py={3}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <>
            <DateRangePicker
              label="Choose the dates for which you're requesting comp off"
              startValue={startDate}
              endValue={endDate}
              onChange={handleRangeChange}
              max={dayjs().startOf("day")}
              months={2}
              width="100%"
            />

            <TextAreaField
              label="Note"
              value={note}
              onChange={setNote}
              rows={3}
              width="100%"
            />

            <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ pt: 1 }}>
              <Tooltip
                title={
                  !canSubmit && validationErrors.length > 0 ? (
                    <Stack spacing={0.5} component="span">
                      {validationErrors.map((err, i) => (
                        <Typography variant="inherit" key={i} component="span" display="block">
                          {err}
                        </Typography>
                      ))}
                    </Stack>
                  ) : (
                    ""
                  )
                }
                disableHoverListener={canSubmit}
              >
                <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
                  {isSubmitting ? "Submitting…" : "Submit"}
                </PrimaryButton>
              </Tooltip>
            </Stack>
          </>
        )}
      </Stack>
    </ModalElement>
  );
}
