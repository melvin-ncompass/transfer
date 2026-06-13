import { Box, Stack, Typography, CircularProgress, Tooltip, IconButton, Chip } from "@mui/material";
import { useState, useCallback, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { DateRangePicker } from "../../../../../components/atom/custom-date-range-picker";
import { TextAreaField } from "../../../../../components/atom/text-area-field";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { MultiSelectElement } from "../../../../../components/atom/select-field/MultiSelect";
import { PrimaryButton } from "../../../../../components/atom/button";
import { Checkbox } from "../../../../../components/atom/check-box";
import { RadioButton } from "../../../../../components/atom/radio-button";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { useGetEmployeeInfoQuery } from "../../../api/people.api";
import { useGetEmployeesQuery } from "../../../org/people/directory/api/directory.api";
import type { Employee } from "../../../org/people/directory/types/employee.types";
import {
  useCheckApplyLeaveMutation,
  useGetEmployeeLeaveTypesQuery,
  useGetEmployeesOnLeaveQuery,
  type CheckApplyLeaveResponse,
  type EmployeeOnLeave
} from "../../../time/leaves/api/leaveType.api";
import {
  useApplyLeaveMutation,
  useGetLeaveStatsQuery,
  type ApplyLeaveResult,
  type LeaveStatRow,
} from "../api/attendance.api";
import type { ShowAttendanceModalSnackbar } from "./attendanceModalSnackbar.types";
import { extractApiErrorMessage } from "../utils/extractApiErrorMessage";
import { DatePickerElement } from "../../../../../components/atom/date-picker";

/* ─── Types ───────────────────────────────────────────────────────────────── */

export interface ApplyLeaveModalProps {
  open: boolean;
  onClose: () => void;
  /** Resolved after a successful API call (local form values) */
  onSubmit?: (payload: ApplyLeaveFormPayload) => void;
  /** If omitted, uses `GET /employee/info` → `employeeId` */
  employeeId?: number | null;
  /** Prefill "Leave on" range (e.g. `YYYY-MM-DD` from an attendance log row) */
  initialLeaveDateIso?: string | null;
  /** Parent-owned snackbar (e.g. AttendancePage) */
  showSnackbar: ShowAttendanceModalSnackbar;
  /** Extra success handling (e.g. parent snackbar) */
  onApplySuccess?: (message: string, result: ApplyLeaveResult) => void;
  id?: number;
  title?: string;
}

export interface ApplyLeaveFormPayload {
  leaveOnStart: Dayjs | null;
  leaveOnEnd: Dayjs | null;
  leaveType: string;
  reason: string;
  notifyPersonIds: string[];
  considerPartialLeave?: boolean;
  partialLeaveHalf?: "first" | "second";
}

/** Display name for directory / notify dropdowns */
function getEmployeeDisplayName(emp: Employee): string {
  const c = emp.contact;
  if (!c) return emp.employeeId ?? `Employee #${emp.id}`;
  if (c.name) return c.name;
  const parts = [c.firstName, c.middleName, c.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : emp.employeeId ?? `Employee #${emp.id}`;
}

/** Email used for leave notifications: contact email, then work, then personal */
function getEmployeeNotifyEmail(emp: Employee): string | null {
  const c = emp.contact?.email?.trim();
  if (c) return c;
  const w = emp.workEmail?.trim();
  if (w) return w;
  const p = emp.personalEmail?.trim();
  if (p) return p;
  return null;
}

/** Inclusive YYYY-MM-DD list between two days */
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

/** Units to compare with `available`: inclusive calendar days, or 0.5 for one day + partial */
function requestedLeaveDayUnits(start: Dayjs, end: Dayjs, considerPartialLeave: boolean): number {
  const n = enumerateDatesInclusive(start, end).length;
  if (n === 1 && considerPartialLeave) return 0.5;
  return n;
}

/** Map API row to read-only balance fields */
function formatLeaveStatFields(stat: LeaveStatRow | undefined): {
  available: string;
  consumed: string;
} {
  if (!stat) {
    return { available: "—", consumed: "—" };
  }
  const consumed = Number(stat.consumed ?? 0);
  const availRaw = stat.available;
  const isUnlimited =
    availRaw === "Unlimited" ||
    (typeof availRaw === "string" && availRaw.toLowerCase() === "unlimited");

  if (isUnlimited) {
    return {
      available: "Unlimited",
      consumed: String(consumed),
    };
  }

  const availableNum = typeof availRaw === "number" ? availRaw : Number(availRaw);
  const safeAvail = Number.isFinite(availableNum) ? availableNum : 0;

  return {
    available: String(safeAvail),
    consumed: String(consumed),
  };
}

const HALF_DAY_BALANCE_EPS = 1e-6;

function isHalfDayBalance(n: number): boolean {
  return Math.abs(n - 0.5) < HALF_DAY_BALANCE_EPS;
}

function getEffectiveLeaveDays(
  start: Dayjs,
  end: Dayjs,
  considerPartialLeave: boolean,
  skippedDates: { date: string }[] = []
): number {
  const allDates = enumerateDatesInclusive(start, end);

  const skippedSet = new Set(
    skippedDates.map(d => dayjs(d.date).format("YYYY-MM-DD"))
  );

  const validDates = allDates.filter(d => !skippedSet.has(d));

  if (allDates.length === 1 && considerPartialLeave) {
    return 0.5;
  }

  return validDates.length;
}

/* ─── Component ────────────────────────────────────────────────────────────── */

export function ApplyLeaveModal({
  open,
  onClose,
  onSubmit,
  title,
  employeeId: employeeIdProp,
  initialLeaveDateIso = null,
  showSnackbar,
  onApplySuccess
}: ApplyLeaveModalProps) {
  const [applyForRange, setApplyForRange] = useState(false);
  const [leaveOnStart, setLeaveOnStart] = useState<Dayjs | null>(null);
  const [leaveOnEnd, setLeaveOnEnd] = useState<Dayjs | null>(null);
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [notifyPersonIds, setNotifyPersonIds] = useState<string[]>([]);
  const [considerPartialLeave, setConsiderPartialLeave] = useState(false);
  const [partialLeaveHalf, setPartialLeaveHalf] = useState<"first" | "second">("first");

  const { data: employeeInfo, isLoading: employeeLoading } = useGetEmployeeInfoQuery(undefined, {
    skip: !open,
  });
  const resolvedEmployeeId =
    employeeIdProp ?? employeeInfo?.data?.employeeId ?? null;

  const { data: employeesResponse, isLoading: employeesLoading } = useGetEmployeesQuery(undefined, {
    skip: !open,
  });

  const notifyOptions = useMemo(() => {
    const rows = employeesResponse?.data ?? [];
    return rows
      .filter((emp) => resolvedEmployeeId == null || emp.id !== resolvedEmployeeId)
      .map((emp) => {
        const email = getEmployeeNotifyEmail(emp as Employee);
        if (!email) return null;
        return {
          label: getEmployeeDisplayName(emp as Employee),
          value: String(emp.id),
        };
      })
      .filter((o): o is { label: string; value: string } => o != null)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [employeesResponse, resolvedEmployeeId]);

  const { data: leaveTypes = [], isLoading: leaveTypesLoading } = useGetEmployeeLeaveTypesQuery(
    resolvedEmployeeId ?? 0,
    {
      skip: !open || resolvedEmployeeId == null,
    }
  );

  const leaveTypeOptions = useMemo(
    () =>
      leaveTypes
        .filter((lt) => lt.id != null)
        .map((lt) => ({ label: lt.leaveName, value: String(lt.id) })),
    [leaveTypes],
  );

  const [applyLeave, { isLoading: isApplyPending }] = useApplyLeaveMutation();

  const leaveTypeIdNum = leaveType ? Number(leaveType) : NaN;
  const skipLeaveStats =
    !open ||
    resolvedEmployeeId == null ||
    leaveType === "" ||
    Number.isNaN(leaveTypeIdNum);

  const { data: leaveStatsData, isFetching: leaveStatsLoading } = useGetLeaveStatsQuery(
    { employeeId: resolvedEmployeeId!, leaveTypeId: leaveTypeIdNum },
    { skip: skipLeaveStats, refetchOnMountOrArgChange: true }
  );

  // Fetch employees on leave for the selected date range
  const skipEmployeesOnLeave = !open || !leaveOnStart || !leaveOnEnd;
  const { data: employeesOnLeave = [], isLoading: employeesOnLeaveLoading } = useGetEmployeesOnLeaveQuery(
    {
      from: leaveOnStart?.format("YYYY-MM-DD") ?? "",
      to: leaveOnEnd?.format("YYYY-MM-DD") ?? "",
      status: "other"
    },
    {
      skip: skipEmployeesOnLeave,
      refetchOnMountOrArgChange: true
    }
  );

  const uniqueEmployeesOnLeave = useMemo(() => {
    if (!employeesOnLeave?.length) return [];

    const employeeMap = new Map<number, {
      employee: EmployeeOnLeave['employee'];
      dates: string[];
      leaveTypes: Set<string>;
    }>();

    employeesOnLeave.forEach((leave) => {
      const empId = leave.employee.id;
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          employee: leave.employee,
          dates: [],
          leaveTypes: new Set()
        });
      }
      const entry = employeeMap.get(empId)!;
      entry.dates.push(leave.date);
      entry.leaveTypes.add(leave.leaveType.name);
    });

    return Array.from(employeeMap.values()).map(({ employee, dates, leaveTypes }) => ({
      id: employee.id,
      name: employee.contact.name,
      dates: dates.sort(),
      leaveTypes: Array.from(leaveTypes)
    }));
  }, [employeesOnLeave]);

  const currentLeaveStat = useMemo((): LeaveStatRow | undefined => {
    if (skipLeaveStats) return undefined;
    return (
      leaveStatsData?.leaveStats?.find((s) => s.leaveTypeId === leaveTypeIdNum) ??
      leaveStatsData?.leaveStats?.[0]
    );
  }, [skipLeaveStats, leaveStatsData, leaveTypeIdNum]);

  const balances = useMemo(() => {
    if (!leaveType || resolvedEmployeeId == null) {
      return { available: "—", consumed: "—" };
    }
    if (leaveStatsLoading) {
      return { available: "…", consumed: "…" };
    }
    return formatLeaveStatFields(currentLeaveStat);
  }, [leaveType, resolvedEmployeeId, leaveStatsLoading, currentLeaveStat]);

  const isSingleDate =
    leaveOnStart != null &&
    leaveOnEnd != null &&
    leaveOnStart.isSame(leaveOnEnd, "day");

  const [checkApplyLeave] = useCheckApplyLeaveMutation();

  const [leaveCheckResult, setLeaveCheckResult] = useState<CheckApplyLeaveResponse | null>(null);

  const leaveBalanceConstraints = useMemo(() => {
    const requestedUnits =
      leaveOnStart && leaveOnEnd && leaveCheckResult
        ? getEffectiveLeaveDays(
          leaveOnStart,
          leaveOnEnd,
          considerPartialLeave,
          leaveCheckResult.skippedDates ?? []
        )
        : null;
    const withinAvailable = (available: number): boolean =>
      requestedUnits == null || requestedUnits <= available + HALF_DAY_BALANCE_EPS;

    if (!leaveType || skipLeaveStats) {
      return {
        ready: false as const,
        balanceAllowsSubmit: true,
        noBalance: false,
        halfDayOnly: false,
        unlimited: false,
        insufficientDays: false,
      };
    }
    if (leaveStatsLoading) {
      return {
        ready: true as const,
        balanceAllowsSubmit: false,
        noBalance: false,
        halfDayOnly: false,
        unlimited: false,
        insufficientDays: false,
      };
    }
    const stat = currentLeaveStat;
    if (!stat) {
      return {
        ready: true as const,
        balanceAllowsSubmit: false,
        noBalance: false,
        halfDayOnly: false,
        unlimited: false,
        insufficientDays: false,
      };
    }
    const availRaw = stat.available;
    const unlimited =
      availRaw === "Unlimited" ||
      (typeof availRaw === "string" && String(availRaw).trim().toLowerCase() === "unlimited");
    if (unlimited) {
      return {
        ready: true as const,
        balanceAllowsSubmit: true,
        noBalance: false,
        halfDayOnly: false,
        unlimited: true,
        insufficientDays: false,
      };
    }
    const numeric = typeof availRaw === "number" ? availRaw : Number(availRaw);
    if (!Number.isFinite(numeric)) {
      return {
        ready: true as const,
        balanceAllowsSubmit: false,
        noBalance: false,
        halfDayOnly: false,
        unlimited: false,
        insufficientDays: false,
      };
    }
    if (numeric <= 0) {
      return {
        ready: true as const,
        balanceAllowsSubmit: false,
        noBalance: true,
        halfDayOnly: false,
        unlimited: false,
        insufficientDays: false,
      };
    }
    if (isHalfDayBalance(numeric)) {
      const halfOk = isSingleDate && considerPartialLeave;
      const unitsOk = withinAvailable(numeric);
      return {
        ready: true as const,
        balanceAllowsSubmit: halfOk && unitsOk,
        noBalance: false,
        halfDayOnly: true,
        unlimited: false,
        insufficientDays: Boolean(requestedUnits != null && !unitsOk),
        requestedDayUnits: requestedUnits ?? undefined,
        availableNumeric: numeric,
      };
    }
    const unitsOk = withinAvailable(numeric);
    return {
      ready: true as const,
      balanceAllowsSubmit: unitsOk,
      noBalance: false,
      halfDayOnly: false,
      unlimited: false,
      insufficientDays: Boolean(requestedUnits != null && !unitsOk),
      requestedDayUnits: requestedUnits ?? undefined,
      availableNumeric: numeric,
    };
  }, [
    leaveType,
    skipLeaveStats,
    leaveStatsLoading,
    currentLeaveStat,
    isSingleDate,
    considerPartialLeave,
    leaveOnStart,
    leaveOnEnd,
    leaveCheckResult,
  ]);

  const triggerLeaveCheck = useCallback(async () => {
    if (!open) return;

    if (
      !leaveOnStart ||
      !leaveOnEnd ||
      !leaveType ||
      resolvedEmployeeId == null
    ) {
      setLeaveCheckResult(null);
      return;
    }

    try {
      const dates = enumerateDatesInclusive(leaveOnStart, leaveOnEnd);

      const res = await checkApplyLeave({
        employeeId: resolvedEmployeeId,
        leaveTypeId: Number(leaveType),
        dates,
        partial: isSingleDate ? considerPartialLeave : false,
        ...(isSingleDate &&
          considerPartialLeave && {
          leaveIndication:
            partialLeaveHalf === "first" ? "first_half" : "second_half",
        }),
      }).unwrap();

      setLeaveCheckResult(res);
    } catch (err) {
      console.error("checkApplyLeave failed", err);
      setLeaveCheckResult(null);
    }
  }, [
    open,
    leaveOnStart,
    leaveOnEnd,
    leaveType,
    resolvedEmployeeId,
    considerPartialLeave,
    partialLeaveHalf,
    isSingleDate,
    checkApplyLeave,
  ]);

  useEffect(() => {
    if (!open) return;

    const t = setTimeout(() => {
      triggerLeaveCheck();
    }, 300);

    return () => clearTimeout(t);
  }, [
    open,
    leaveOnStart,
    leaveOnEnd,
    leaveType,
    considerPartialLeave,
    partialLeaveHalf,
    resolvedEmployeeId,
  ]);

  useEffect(() => {
    if (!open || !employeesResponse?.data) return;
    const valid = new Set(employeesResponse.data.map((e) => String(e.id)));
    setNotifyPersonIds((prev) => prev.filter((id) => valid.has(id)));
  }, [open, employeesResponse]);

  useEffect(() => {
    if (!open) return;
    if (initialLeaveDateIso) {
      const d = dayjs(initialLeaveDateIso);
      if (d.isValid()) {
        const dayStart = d.startOf("day");
        setLeaveOnStart(dayStart);
        setLeaveOnEnd(dayStart);
      } else {
        setLeaveOnStart(null);
        setLeaveOnEnd(null);
      }
    } else {
      setLeaveOnStart(null);
      setLeaveOnEnd(null);
    }
    setLeaveType("");
    setReason("");
    setNotifyPersonIds([]);
    setConsiderPartialLeave(false);
    setPartialLeaveHalf("first");
  }, [open, initialLeaveDateIso]);

  const handleRangeChange = useCallback(
    (dates: [Dayjs | null, Dayjs | null]) => {
      const [start, end] = dates;
      let s = start ?? null;
      let e = end ?? null;
      const singleDayOnly =
        considerPartialLeave || leaveBalanceConstraints.halfDayOnly;
      if (singleDayOnly && s != null) {
        if (e == null || !s.startOf("day").isSame(e.startOf("day"), "day")) {
          e = s.startOf("day");
        }
      }
      setLeaveOnStart(s);
      setLeaveOnEnd(e);
    },
    [considerPartialLeave, leaveBalanceConstraints.halfDayOnly],
  );

  const handleSubmit = useCallback(async () => {
    if (!leaveOnStart || !leaveOnEnd || !leaveType) {
      showSnackbar("Please select dates and leave type.", "error");
      return;
    }
    if (resolvedEmployeeId == null) {
      showSnackbar("Employee information not available. Please try again later.", "error");
      return;
    }
    if (!reason.trim()) {
      showSnackbar("Please enter a reason for your leave.", "error");
      return;
    }
    if (!leaveBalanceConstraints.balanceAllowsSubmit) {
      if (leaveBalanceConstraints.noBalance) {
        showSnackbar("No leave balance available for this leave type.", "error");
        return;
      }
      if (leaveBalanceConstraints.halfDayOnly) {
        showSnackbar(
          isSingleDate
            ? "Only half-day leave is allowed for this balance. Enable partial leave and choose first or second half."
            : "Only half-day leave is allowed. Select a single date, enable partial leave, and choose first or second half.",
          "error",
        );
        return;
      }
      if (leaveBalanceConstraints.insufficientDays) {
        const req = leaveBalanceConstraints.requestedDayUnits;
        const avail = leaveBalanceConstraints.availableNumeric;
        showSnackbar(
          req != null && avail != null
            ? `Selected leave (${req} day(s)) exceeds available balance (${avail}).`
            : "Selected dates exceed your available leave balance for this type.",
          "error",
        );
        return;
      }
      showSnackbar("Leave balance could not be confirmed. Try again or pick another leave type.", "error");
      return;
    }

    const dates = enumerateDatesInclusive(leaveOnStart, leaveOnEnd);
    const rows = employeesResponse?.data ?? [];
    const byId = new Map(rows.map((e) => [e.id, e] as const));
    const notifyTo = notifyPersonIds
      .map((id) => byId.get(Number(id)))
      .filter((e): e is Employee => Boolean(e))
      .map(getEmployeeNotifyEmail)
      .filter((email): email is string => Boolean(email));

    const body = {
      dates,
      leaveTypeId: Number(leaveType),
      reason: reason.trim(),
      ...(notifyTo.length > 0 ? { notifyTo } : {}),
      ...(isSingleDate &&
        considerPartialLeave && {
        partial: true,
        leaveIndication: partialLeaveHalf === "first" ? "first_half" : "second_half",
      }),
    };

    try {
      const res = await applyLeave({
        employeeId: resolvedEmployeeId,
        body,
      }).unwrap();

      const topMessage = res.message ?? "Leave requested successfully";
      const result = res.data?.data;
      let message = topMessage;
      if (result && result.totalSkipped > 0) {
        message = `${topMessage} (${result.totalApplied} day(s) applied, ${result.totalSkipped} skipped).`;
      }

      showSnackbar(message, "success");
      onApplySuccess?.(message, result);

      const formPayload: ApplyLeaveFormPayload = {
        leaveOnStart,
        leaveOnEnd,
        leaveType,
        reason,
        notifyPersonIds,
        ...(isSingleDate &&
          considerPartialLeave && {
          considerPartialLeave: true,
          partialLeaveHalf,
        }),
      };
      onSubmit?.(formPayload);
      onClose();
    } catch (err) {
      showSnackbar(extractApiErrorMessage(err), "error");
    }
  }, [
    leaveOnStart,
    leaveOnEnd,
    leaveType,
    reason,
    notifyPersonIds,
    isSingleDate,
    considerPartialLeave,
    partialLeaveHalf,
    resolvedEmployeeId,
    applyLeave,
    onSubmit,
    onClose,
    onApplySuccess,
    showSnackbar,
    employeesResponse?.data,
    leaveBalanceConstraints.balanceAllowsSubmit,
    leaveBalanceConstraints.noBalance,
    leaveBalanceConstraints.halfDayOnly,
    leaveBalanceConstraints.insufficientDays,
    leaveBalanceConstraints.requestedDayUnits,
    leaveBalanceConstraints.availableNumeric,
  ]);

  const canSubmit =
    Boolean(leaveOnStart && leaveOnEnd && leaveType) &&
    reason.trim().length > 0 &&
    resolvedEmployeeId != null &&
    !isApplyPending &&
    !employeeLoading &&
    !leaveTypesLoading &&
    leaveBalanceConstraints.balanceAllowsSubmit;

  const mustUsePartialForBalance =
    leaveBalanceConstraints.halfDayOnly && isSingleDate;

  useEffect(() => {
    if (mustUsePartialForBalance && !considerPartialLeave) {
      setConsiderPartialLeave(true);
    }
    const enforceSingleDayWhenPartial =
      considerPartialLeave ||
      mustUsePartialForBalance ||
      leaveBalanceConstraints.halfDayOnly;
    if (enforceSingleDayWhenPartial && leaveOnStart && leaveOnEnd) {
      const a = leaveOnStart.startOf("day");
      const b = leaveOnEnd.startOf("day");
      if (!a.isSame(b, "day")) {
        setLeaveOnEnd(a);
      }
    }
  }, [
    mustUsePartialForBalance,
    considerPartialLeave,
    leaveBalanceConstraints.halfDayOnly,
    leaveOnStart,
    leaveOnEnd,
  ]);

  return (
    <ModalElement
      open={open}
      onClose={onClose}
      title={title ?? "Apply Leave"}
      maxWidth="sm"
    // height={"100%"}
    // contentSx={{
    //   display: "flex",
    //   flexDirection: "column",
    //   // height: "100%",
    //   p: 0,
    // }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          // height: "100%",
        }}
      >

        <Stack spacing={2.5} pb={2}>
          {employeeLoading && open ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <Stack spacing={1}>
                <Checkbox
                  label="Apply for multiple dates"
                  checked={applyForRange}
                  onChange={(e) => {
                    const checked = e.target.checked;

                    setApplyForRange(checked);

                    // when switching back to single date,
                    // keep only the start date
                    if (!checked && leaveOnStart) {
                      setLeaveOnEnd(leaveOnStart.startOf("day"));
                    }
                  }}
                />

                {applyForRange ? (
                  <DateRangePicker
                    label="Leave on"
                    startValue={leaveOnStart}
                    endValue={leaveOnEnd}
                    onChange={handleRangeChange}
                    width="100%"
                  />
                ) : (
                  <DatePickerElement
                    label="Leave on"
                    value={leaveOnStart}
                    onChange={(date) => {
                      const normalized = date?.startOf("day") ?? null;

                      setLeaveOnStart(normalized);
                      setLeaveOnEnd(normalized);
                    }}
                    width="100%"
                  />
                )}
              </Stack>

              {leaveOnStart && leaveOnEnd && (
                <Box sx={{ pl: 0.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Checkbox
                      label="Consider as partial leave"
                      checked={mustUsePartialForBalance ? true : considerPartialLeave}
                      onChange={(e) => {
                        if (mustUsePartialForBalance) return;
                        const checked = e.target.checked;
                        setConsiderPartialLeave(checked);
                        if (
                          checked &&
                          leaveOnStart &&
                          leaveOnEnd &&
                          !leaveOnStart.startOf("day").isSame(leaveOnEnd.startOf("day"), "day")
                        ) {
                          setLeaveOnEnd(leaveOnStart.startOf("day"));
                        }
                      }}
                      disabled={mustUsePartialForBalance}
                    />

                    {leaveCheckResult?.skippedDates?.length ? (
                      <Tooltip
                        title={
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
                              Skipped Dates ({leaveCheckResult.skippedDates.length})
                            </Typography>
                            <Stack spacing={0.5}>
                              {(() => {
                                const grouped = leaveCheckResult.skippedDates.reduce((acc, item) => {
                                  const reason = item.reason || "Other";
                                  if (!acc[reason]) acc[reason] = [];
                                  acc[reason].push(item.date);
                                  return acc;
                                }, {} as Record<string, string[]>);

                                return Object.entries(grouped).map(([reason, dates]) => {
                                  if (dates.length > 3) {
                                    return (
                                      <Typography key={reason} variant="caption">
                                        • {reason}: {dates.length} date{dates.length > 1 ? "s" : ""}
                                      </Typography>
                                    );
                                  }
                                  return dates.map((date) => (
                                    <Typography key={date} variant="caption">
                                      • {dayjs(date).format("MMM DD, YYYY")} — {reason}
                                    </Typography>
                                  ));
                                });
                              })()}
                            </Stack>
                          </Box>
                        }
                        arrow
                        placement="right"
                      >
                        <IconButton size="small">
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Box>

                  {considerPartialLeave && (
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Half:
                      </Typography>
                      <RadioButton
                        label="First half"
                        value="first"
                        name="partialLeaveHalf"
                        checked={partialLeaveHalf === "first"}
                        onChange={(e) => setPartialLeaveHalf(e.target.value as "first" | "second")}
                        size="small"
                      />
                      <RadioButton
                        label="Second half"
                        value="second"
                        name="partialLeaveHalf"
                        checked={partialLeaveHalf === "second"}
                        onChange={(e) => setPartialLeaveHalf(e.target.value as "first" | "second")}
                        size="small"
                      />
                    </Stack>
                  )}
                </Box>
              )}

              {leaveTypesLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : leaveTypeOptions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No leave types are assigned for your leave plan.
                </Typography>
              ) : (
                <SingleSelectElement
                  label="Leave type"
                  value={leaveType}
                  onChange={setLeaveType}
                  options={leaveTypeOptions}
                />
              )}

              <Stack direction="row" spacing={2}>
                <TextFieldElement label="Available" value={String(balances.available)} disabled fullWidth />
                <TextFieldElement label="Consumed" value={String(balances.consumed)} disabled fullWidth />
              </Stack>
              {leaveType && leaveBalanceConstraints.ready && leaveBalanceConstraints.noBalance ? (
                <Typography variant="caption" color="error">
                  No balance left for this leave type — you cannot submit a request.
                </Typography>
              ) : null}
              {leaveType && leaveBalanceConstraints.ready && leaveBalanceConstraints.halfDayOnly ? (
                <Typography variant="caption" color="text.secondary">
                  {isSingleDate
                    ? "Balance is 0.5 day: only half-day leave is allowed on this date (first or second half)."
                    : "Balance is 0.5 day: choose a single date, then apply as partial leave (first or second half)."}
                </Typography>
              ) : null}
              {leaveType &&
                leaveBalanceConstraints.ready &&
                leaveBalanceConstraints.insufficientDays &&
                !leaveBalanceConstraints.halfDayOnly &&
                leaveOnStart &&
                leaveOnEnd ? (
                <Typography variant="caption" color="error">
                  {leaveBalanceConstraints.requestedDayUnits != null &&
                    leaveBalanceConstraints.availableNumeric != null
                    ? `Selected ${leaveBalanceConstraints.requestedDayUnits} day(s); only ${leaveBalanceConstraints.availableNumeric} available — shorten the date range or use partial leave on a single day if applicable.`
                    : "Selected dates exceed your available balance for this leave type."}
                </Typography>
              ) : null}

              <TextAreaField
                label="Reason"
                value={reason}
                onChange={setReason}
                rows={2}
                width="100%"
                required
              />

              {employeesLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <MultiSelectElement
                  label="Notify"
                  value={notifyPersonIds}
                  onChange={setNotifyPersonIds}
                  options={notifyOptions}
                  width="100%"
                />
              )}
            </>
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          borderTop: leaveOnStart && leaveOnEnd && "1px solid",
          borderColor: "divider",
          px: 3,
          pt: 2,
          pb: 1,
          backgroundColor: "background.paper",
          flexShrink: 0,
        }}
      >
        {leaveOnStart && leaveOnEnd && (
          <>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1.5, color: "text.secondary" }}>
              Also on leave during this period
            </Typography>

            {employeesOnLeaveLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                <CircularProgress size={20} />
              </Box>
            ) : uniqueEmployeesOnLeave.length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                No other employees on leave during this period
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {uniqueEmployeesOnLeave.map((emp) => (
                  <Chip key={emp.id} label={emp.name} size="small" />
                ))}
              </Box>
            )}
          </>
        )}
      </Box>

      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          px: 3,
          py: 1.5,
          display: "flex",
          justifyContent: "flex-end",
          backgroundColor: "background.paper",
          flexShrink: 0,
        }}
      >
        <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
          {isApplyPending ? "Submitting…" : "Submit"}
        </PrimaryButton>
      </Box>
    </ModalElement>
  );
}