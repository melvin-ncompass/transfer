import {
  Box,
  Stack,
  Typography,
  IconButton,
  Chip,
  styled,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import dayjs, { type Dayjs } from "dayjs";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { DatePickerElement } from "../../../../../components/atom/date-picker";
import { TimePickerElement } from "../../../../../components/atom/time-picker";
import { TextAreaField } from "../../../../../components/atom/text-area-field";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { PrimaryButton, PrimaryIconButton } from "../../../../../components/atom/button";
import { Tooltip } from "../../../../../components/atom/tooltip/Tooltip";
import TipTapEditor from "../../../home/ClockInOut/components/TiptapEditor";
import { useGetEmployeeInfoQuery } from "../../../api/people.api";
import type { ShowAttendanceModalSnackbar } from "./attendanceModalSnackbar.types";
import {
  attendanceApi,
  useRegularizeAttendanceMutation,
  useGetAttendanceAssignedProjectsQuery,
  useGetAttendanceTasksQuery,
  mapAttendanceAssignedProjectsToOptions,
  type RegularizeAttendanceDto,
  type RegularizeProjectTaskPayload,
  type AttendanceGetTasksData,
} from "../api/attendance.api";
import { useGetAttendanceConfigQuery } from "../../../time/settings/api/settings.api";
import { extractApiErrorMessage } from "../utils/extractApiErrorMessage";
import {
  HALF_HOUR_SELECT_OPTIONS,
  hoursStringToNumber,
  normalizeHoursWorked,
} from "../../../home/ClockInOut/utils/taskHours";

/* ─── Constants ───────────────────────────────────────────────────────────── */

const DEFAULT_CLOCK_IN = null;
const DEFAULT_CLOCK_OUT = null;

/* ─── Types ───────────────────────────────────────────────────────────────── */

/** One project row in the form — matches clock-out modal shape */
export interface RegulariseProjectTaskRow {
  projectId: string;
  hoursWorked: string;
  description: string;
}

export interface RegulariseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (payload: RegulariseFormPayload) => void;
  /** Row / log date to regularize (e.g. from attendance table). User can change in the picker. */
  initialAttendanceDate?: Dayjs | null;
  initialClockIn?: Dayjs | null;
  initialClockOut?: Dayjs | null;
  employeeId?: number | null;
  onSuccess?: (message: string) => void;
  /** Parent-owned snackbar (e.g. AttendancePage) */
  showSnackbar: ShowAttendanceModalSnackbar;
  /** Calendar row `attendanceId` — loads GET /attendance/get_tasks/:id to prefill tasks */
  attendanceId?: number | null;
}

export interface RegulariseFormPayload {
  attendanceDate: Dayjs | null;
  clockIn: Dayjs | null;
  clockOut: Dayjs | null;
  reason: string;
  /** Rich-text HTML string for the API (hours prefix + notes), or empty */
  companyTasks: string;
  projectTasks: RegulariseProjectTaskRow[];
}

/** TipTap / HTML notes: treat as empty if no visible text */
function hasMeaningfulNotes(html: string): boolean {
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();
  return text.length > 0;
}

function buildRegularizeProjectPayloads(
  rows: RegulariseProjectTaskRow[]
): RegularizeProjectTaskPayload[] {
  return rows
    .map((r) => ({
      projectId: Number(r.projectId),
      description: r.description ?? "",
      timeInHours: String(hoursStringToNumber(r.hoursWorked)),
    }))
    .filter(
      (t) =>
        Number.isFinite(t.projectId) &&
        !Number.isNaN(t.projectId) &&
        t.projectId > 0 &&
        parseFloat(t.timeInHours) > 0 &&
        hasMeaningfulNotes(t.description)
    );
}

function isCompanyTaskRowComplete(hoursStr: string, notes: string): boolean {
  return hoursStringToNumber(hoursStr) > 0 && hasMeaningfulNotes(notes);
}

function isProjectTaskRowEmpty(r: RegulariseProjectTaskRow): boolean {
  const pid = Number(r.projectId);
  return (
    (!Number.isFinite(pid) || Number.isNaN(pid) || pid <= 0) &&
    hoursStringToNumber(r.hoursWorked) <= 0 &&
    !hasMeaningfulNotes(r.description)
  );
}

function isProjectTaskRowComplete(r: RegulariseProjectTaskRow): boolean {
  const pid = Number(r.projectId);
  return (
    Number.isFinite(pid) &&
    !Number.isNaN(pid) &&
    pid > 0 &&
    hoursStringToNumber(r.hoursWorked) > 0 &&
    hasMeaningfulNotes(r.description)
  );
}

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * API sometimes returns invalid markup: `<ol>• <p>item</p>• <p>...</p></ol>` which renders as
 * ordered-list "1." plus stray bullets. Normalize to a proper unordered list for TipTap.
 */
function normalizeMalformedListHtmlFromApi(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (!/<ol\b/i.test(t) || !/•\s*<p/i.test(t)) return null;

  const items: string[] = [];
  const re = /•\s*<p>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    const inner = m[1].replace(/<[^>]+>/g, "").trim();
    if (inner) items.push(inner);
  }
  if (items.length === 0) return null;
  return `<ul>${items.map((i) => `<li>${escapeHtmlText(i)}</li>`).join("")}</ul>`;
}

/** Prefer pending copy; convert plain text / bullets to simple HTML for TipTap */
function taskFieldsToTipTapHtml(
  description: string,
  pendingDescription: string | null | undefined,
): string {
  const raw = (pendingDescription?.trim() || description?.trim() || "").trim();
  if (!raw) return "";
  const normalizedOl = normalizeMalformedListHtmlFromApi(raw);
  if (normalizedOl !== null) return normalizedOl;
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return "";
  const bulletish = (l: string) =>
    /^[•\-\*]\s/.test(l) || l.startsWith("•");
  if (lines.every(bulletish)) {
    return `<ul>${lines
      .map((l) => `<li>${escapeHtmlText(l.replace(/^[•\-\*]\s*/, "").replace(/^•\s*/, ""))}</li>`)
      .join("")}</ul>`;
  }
  return `<p>${lines.map((l) => escapeHtmlText(l)).join("<br/>")}</p>`;
}

function applyTasksPrefillToState(
  data: AttendanceGetTasksData,
): {
  companyHoursStr: string;
  companyTasksHtml: string;
  projectRows: RegulariseProjectTaskRow[];
  extraProjectLabels: Record<string, string>;
} {
  let companyHoursStr = "";
  let companyTasksHtml = "";
  const c0 = data.companyTasks?.[0];
  if (c0) {
    const hrs = normalizeHoursWorked(String(c0.timeInHours ?? "").replace(",", "."));
    if (hrs) companyHoursStr = hrs;
    companyTasksHtml = taskFieldsToTipTapHtml(c0.description ?? "", c0.pendingDescription);
  }

  const extraProjectLabels: Record<string, string> = {};
  const projectRows: RegulariseProjectTaskRow[] = (data.projectTasks ?? [])
    .filter(
      (t) =>
        t.project != null &&
        Number.isFinite(Number(t.project.id)) &&
        Number(t.project.id) > 0,
    )
    .map((t) => {
      const id = String(t.project.id);
      if (t.project.projectName) {
        extraProjectLabels[id] = t.project.projectName;
      }
      const hrs = normalizeHoursWorked(String(t.timeInHours ?? "").replace(",", "."));
      return {
        projectId: id,
        hoursWorked: hrs || "",
        description: taskFieldsToTipTapHtml(t.description ?? "", t.pendingDescription),
      };
    });

  return { companyHoursStr, companyTasksHtml, projectRows, extraProjectLabels };
}

/** Stable signature for comparing project task rows (prefill vs submit) */
function projectRowsBaselineSignature(rows: RegulariseProjectTaskRow[]): string {
  return JSON.stringify(
    rows.map((r) => ({
      projectId: r.projectId,
      hoursWorked: normalizeHoursWorked(r.hoursWorked.trim()) || r.hoursWorked.trim(),
      description: r.description ?? "",
    })),
  );
}

/* ─── Styled primitives ───────────────────────────────────────────────────── */

/** Single-border table shell — one border wraps all rows */
const TaskTable = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  overflow: "hidden",
  backgroundColor: theme.palette.background.paper,
}));

/** Table header row — shown when at least one row exists */
const TableHead = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: "6px 10px 6px 12px",
  backgroundColor: theme.palette.grey[100],
  borderBottom: `1px solid ${theme.palette.divider}`,
  gap: 8,
  userSelect: "none",
}));

const HeadLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  lineHeight: 1,
}));

/** One data row — theme-based background, no custom hover */
const TaskRow = styled(Stack, {
  shouldForwardProp: (p) => p !== "isEven",
})<{ isEven?: boolean }>(({ theme, isEven }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  padding: "9px 10px 9px 12px",
  gap: 8,
  backgroundColor: isEven ? theme.palette.background.paper : theme.palette.grey[50],
  borderBottom: `1px solid ${theme.palette.divider}`,
  "&:last-child": { borderBottom: "none" },
}));

/* ── Reusable section heading (theme-based; Add row matches FormRepeater) ── */
const SectionTitle = ({
  label,
  count,
  onAdd,
}: {
  label: string;
  count: number;
  onAdd: () => void;
}) => {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ mb: 1 }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          sx={{
            width: 3,
            height: 16,
            borderRadius: 99,
            bgcolor: theme.palette.primary.main,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="subtitle2"
          sx={{ color: theme.palette.text.primary, letterSpacing: "-0.01em" }}
        >
          {label}
        </Typography>
        <Chip
          label={count}
          size="small"
          sx={{
            height: 17,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.primary.main,
            "& .MuiChip-label": { px: "6px" },
          }}
        />
      </Stack>

      <PrimaryIconButton
        icon={<AddIcon />}
        variant="outlined"
        onClick={onAdd}
        sx={{ textTransform: "none" }}
      >
        Add row
      </PrimaryIconButton>
    </Stack>
  );
};

/* ── Reusable delete button (theme error color, DeleteIcon per FormRepeater) ── */
const DelBtn = ({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) => (
  <Tooltip title="Remove row" placement="top">
    <IconButton
      size="small"
      color="error"
      onClick={onClick}
      disabled={disabled}
      sx={{ mt: "1px", flexShrink: 0, alignSelf: "flex-start" }}
    >
      <DeleteIcon fontSize="small" />
    </IconButton>
  </Tooltip>
);

/* ─── Main component ──────────────────────────────────────────────────────── */

export function RegulariseModal({
  open,
  onClose,
  onSubmit,
  initialAttendanceDate = null,
  initialClockIn = null,
  initialClockOut = null,
  employeeId: employeeIdProp,
  onSuccess,
  showSnackbar,
  attendanceId: attendanceIdProp = null,
}: RegulariseModalProps) {
  const [attendanceDate, setAttendanceDate] = useState<Dayjs | null>(null);
  const [clockIn, setClockIn] = useState<Dayjs | null>(initialClockIn);
  const [clockOut, setClockOut] = useState<Dayjs | null>(initialClockOut);
  const [reason, setReason] = useState("");
  const [companyHoursStr, setCompanyHoursStr] = useState("");
  const [companyTasksHtml, setCompanyTasksHtml] = useState("");
  const [projectRows, setProjectRows] = useState<RegulariseProjectTaskRow[]>([]);
  /** Project names from GET get_tasks — merged into dropdown when not in assigned-projects list */
  const [extraProjectLabels, setExtraProjectLabels] = useState<Record<string, string>>({});
  const [regulariseEditorKey, setRegulariseEditorKey] = useState(0);

  const { data: employeeInfo, isLoading: employeeLoading } = useGetEmployeeInfoQuery(undefined, {
    skip: !open,
  });
  const resolvedEmployeeId = employeeIdProp ?? employeeInfo?.data?.employeeId ?? null;

  const { data: assignedProjectRows = [], isLoading: isProjectsLoading } =
    useGetAttendanceAssignedProjectsQuery(resolvedEmployeeId ?? 0, {
      skip: !open || resolvedEmployeeId == null,
    });

  /** `data` can briefly keep the previous subscription's payload when `attendanceId` changes; `currentData` is always for the active args */
  const { currentData: attendanceTasksCurrentData } = useGetAttendanceTasksQuery(
    attendanceIdProp ?? 0,
    {
      skip: !open || attendanceIdProp == null || attendanceIdProp <= 0,
    },
  );

  const projectOptions = useMemo(() => {
    const base = mapAttendanceAssignedProjectsToOptions(assignedProjectRows);
    const m = new Map(base.map((o) => [o.value, o]));
    for (const [id, label] of Object.entries(extraProjectLabels)) {
      if (!m.has(id)) m.set(id, { label, value: id });
    }
    return Array.from(m.values());
  }, [assignedProjectRows, extraProjectLabels]);

  /** Hide entirely when there are no assigned/prefill projects to choose from */
  const showProjectTasksSection = projectOptions.length > 0;

  /** Each project at most one row — options exclude projects picked on other rows (current row keeps its value). */
  const projectOptionsByRow = useMemo(
    () =>
      projectRows.map((row, rowIndex) => {
        const takenElsewhere = new Set(
          projectRows
            .map((r, i) => (i !== rowIndex && r.projectId ? r.projectId : null))
            .filter((id): id is string => id != null && id !== "")
        );
        return projectOptions.filter(
          (opt) => !takenElsewhere.has(opt.value) || opt.value === row.projectId
        );
      }),
    [projectRows, projectOptions]
  );

  const dispatch = useDispatch();
  const [regularizeAttendance, { isLoading: isSubmitting }] = useRegularizeAttendanceMutation();
  const { data: attendanceConfig } = useGetAttendanceConfigQuery(undefined, {
    skip: !open,
  });

  const isReasonRequired = attendanceConfig?.data?.reasonRequired ?? false;

  /**
   * Stable identity for the calendar row being regularised (not referential Dayjs).
   * Resets form + baselines when switching rows or reopening; avoids wiping user edits on same session.
   */
  const sessionDayKey =
    initialAttendanceDate != null && initialAttendanceDate.isValid()
      ? initialAttendanceDate.format("YYYY-MM-DD")
      : "invalid";
  const regulariseSessionKey = `${attendanceIdProp ?? "none"}_${sessionDayKey}`;

  const lastResetSessionKeyRef = useRef<string | null>(null);
  const tasksPrefillAppliedForIdRef = useRef<number | null>(null);
  /** Snapshot after modal open (and before user edits) — clock datetimes for timeRegularized */
  const regulariseBaselineTimeRef = useRef<{ in: string | null; out: string | null } | null>(null);

  /** Snapshot of tasks after open reset + optional get_tasks prefill — for tasksRegularized */
  const regulariseBaselineTasksRef = useRef<{
    companyHoursStr: string;
    companyTasksHtml: string;
    projectSignature: string;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      lastResetSessionKeyRef.current = null;
      tasksPrefillAppliedForIdRef.current = null;
      regulariseBaselineTimeRef.current = null;
      regulariseBaselineTasksRef.current = null;
      return;
    }
    if (lastResetSessionKeyRef.current === regulariseSessionKey) {
      return;
    }
    lastResetSessionKeyRef.current = regulariseSessionKey;
    tasksPrefillAppliedForIdRef.current = null;

    const today = dayjs().startOf("day");
    const fromInitial =
      initialAttendanceDate && initialAttendanceDate.isValid()
        ? initialAttendanceDate.startOf("day")
        : today;
    const baseDate = fromInitial.isAfter(today) ? today : fromInitial;
    setAttendanceDate(baseDate);
    const cin = initialClockIn ?? DEFAULT_CLOCK_IN;
    const cout = initialClockOut ?? DEFAULT_CLOCK_OUT;
    // AFTER
    const cinDayjs = cin ? baseDate.hour(cin.hour()).minute(cin.minute()).second(0) : null;
    const coutDayjs = cout ? baseDate.hour(cout.hour()).minute(cout.minute()).second(0) : null;
    setClockIn(cinDayjs);
    setClockOut(coutDayjs);
    setReason("");
    setCompanyHoursStr("");
    setCompanyTasksHtml("");
    setProjectRows([]);
    setExtraProjectLabels({});
    setRegulariseEditorKey((k) => k + 1);

    regulariseBaselineTimeRef.current = {
      in: cinDayjs?.format("YYYY-MM-DD HH:mm") ?? null,
      out: coutDayjs?.format("YYYY-MM-DD HH:mm") ?? null,
    };
    regulariseBaselineTasksRef.current = {
      companyHoursStr: "",
      companyTasksHtml: "",
      projectSignature: "[]",
    };
  }, [open, regulariseSessionKey, initialAttendanceDate, initialClockIn, initialClockOut]);

  /** After session reset, sync company + project tasks from GET /attendance/get_tasks/:attendanceId (empty arrays → clear fields) */
  useEffect(() => {
    if (!open || attendanceIdProp == null || attendanceIdProp <= 0) return;
    if (attendanceTasksCurrentData == null) return;
    if (tasksPrefillAppliedForIdRef.current === attendanceIdProp) return;

    const applied = applyTasksPrefillToState(attendanceTasksCurrentData);
    setCompanyHoursStr(applied.companyHoursStr);
    setCompanyTasksHtml(applied.companyTasksHtml);
    setProjectRows(applied.projectRows);
    setExtraProjectLabels(applied.extraProjectLabels);
    setRegulariseEditorKey((k) => k + 1);
    tasksPrefillAppliedForIdRef.current = attendanceIdProp;

    regulariseBaselineTasksRef.current = {
      companyHoursStr: applied.companyHoursStr,
      companyTasksHtml: applied.companyTasksHtml,
      projectSignature: projectRowsBaselineSignature(applied.projectRows),
    };
  }, [open, attendanceIdProp, attendanceTasksCurrentData]);

  const addProjectRow = useCallback(
    () =>
      setProjectRows((rows) => [
        ...rows,
        { projectId: "", hoursWorked: "", description: "" },
      ]),
    []
  );
  const removeProjectRow = useCallback(
    (index: number) => setProjectRows((rows) => rows.filter((_, i) => i !== index)),
    []
  );
  const updateProjectRow = useCallback(
    (index: number, field: keyof RegulariseProjectTaskRow, val: string) =>
      setProjectRows((rows) =>
        rows.map((r, i) => (i === index ? { ...r, [field]: val } : r))
      ),
    []
  );

  const totalRegulariseHours = useMemo(() => {
    let sum = 0;
    if (isCompanyTaskRowComplete(companyHoursStr, companyTasksHtml)) {
      sum += hoursStringToNumber(companyHoursStr);
    }
    for (const r of projectRows) {
      if (isProjectTaskRowComplete(r)) {
        sum += hoursStringToNumber(r.hoursWorked);
      }
    }
    return sum;
  }, [companyHoursStr, companyTasksHtml, projectRows]);

  const hasAtLeastOneTask =
    isCompanyTaskRowComplete(companyHoursStr, companyTasksHtml) ||
    buildRegularizeProjectPayloads(projectRows).length > 0;

  const hasCompleteProjectTask = useMemo(
    () =>
      showProjectTasksSection &&
      projectRows.some((r) => isProjectTaskRowComplete(r)),
    [showProjectTasksSection, projectRows],
  );

  const isCompanyTaskPartial = useMemo(() => {
    const h = hoursStringToNumber(companyHoursStr);
    const notes = companyTasksHtml;
    return (
      (h > 0 && !hasMeaningfulNotes(notes)) ||
      (hasMeaningfulNotes(notes) && h <= 0)
    );
  }, [companyHoursStr, companyTasksHtml]);

  const hasIncompleteTaskRows = useMemo(() => {
    if (!showProjectTasksSection) {
      return isCompanyTaskPartial;
    }
    const projectIncomplete = projectRows.some(
      (r) => !isProjectTaskRowEmpty(r) && !isProjectTaskRowComplete(r),
    );
    const companyIncompleteBlocking =
      isCompanyTaskPartial && !hasCompleteProjectTask;
    return projectIncomplete || companyIncompleteBlocking;
  }, [
    showProjectTasksSection,
    projectRows,
    isCompanyTaskPartial,
    hasCompleteProjectTask,
  ]);

  const handleSubmit = useCallback(async () => {
    if (
      !attendanceDate ||
      !clockIn ||
      !clockOut ||
      (isReasonRequired && !reason.trim())
    )
      return;

    if (resolvedEmployeeId == null) {
      showSnackbar("Employee information not available. Please try again later.", "error");
      return;
    }

    if (hasIncompleteTaskRows) {
      showSnackbar(
        showProjectTasksSection
          ? "Complete every project row you started (hours + explanation). Company work is optional when at least one project row is complete; otherwise finish or clear the company row."
          : "Complete the company task: hours worked and task explanation are both required.",
        "error",
      );
      return;
    }

    const companyTasksForApi = companyTasksHtml.trim();
    const projectTasksPayload = buildRegularizeProjectPayloads(projectRows);

    if (
      !isCompanyTaskRowComplete(companyHoursStr, companyTasksHtml) &&
      projectTasksPayload.length === 0
    ) {
      showSnackbar(
        showProjectTasksSection
          ? "Add at least one company or project task with hours worked and a task explanation."
          : "Add a company task with hours worked and a task explanation.",
        "error",
      );
      return;
    }

    if (totalRegulariseHours <= 0) {
      showSnackbar("Enter a valid time in hours (greater than zero).", "error");
      return;
    }

    const baselineTime = regulariseBaselineTimeRef.current;
    const baselineTasks = regulariseBaselineTasksRef.current;
    const clockInKey = clockIn.format("YYYY-MM-DD HH:mm");
    const clockOutKey = clockOut.format("YYYY-MM-DD HH:mm");
    // AFTER
    const timeRegularized =
      baselineTime != null &&
      (
        (baselineTime.in != null && clockInKey !== baselineTime.in) ||
        (baselineTime.out != null && clockOutKey !== baselineTime.out) ||
        (baselineTime.in == null && clockIn != null) ||
        (baselineTime.out == null && clockOut != null)
      );
    const tasksRegularized =
      baselineTasks != null &&
      (companyHoursStr !== baselineTasks.companyHoursStr ||
        companyTasksHtml !== baselineTasks.companyTasksHtml ||
        projectRowsBaselineSignature(projectRows) !== baselineTasks.projectSignature);

    try {
      const body: RegularizeAttendanceDto = {
        date: attendanceDate.format("YYYY-MM-DD"),
        clockIn: clockIn.format("HH:mm"),
        clockOut: clockOut.format("HH:mm"),
        note: reason.trim(),
        projectTasks: projectTasksPayload,
        companyTasks: companyTasksForApi,
        timeInHours:
          normalizeHoursWorked(String(totalRegulariseHours)) ||
          String(totalRegulariseHours),
        timeRegularized,
        tasksRegularized,
      };

      const res = await regularizeAttendance({
        employeeId: resolvedEmployeeId,
        body,
      }).unwrap();

      const message = res.message ?? "Attendance regularization request submitted successfully.";
      showSnackbar(message, "success");
      onSuccess?.(message);

      const month = attendanceDate.month() + 1;
      const year = attendanceDate.year();
      dispatch(
        attendanceApi.util.invalidateTags([
          { type: "Attendance", id: `calendar-${resolvedEmployeeId}-${year}-${month}` },
          ...(attendanceIdProp != null && attendanceIdProp > 0
            ? [{ type: "Attendance" as const, id: `tasks-${attendanceIdProp}` }]
            : []),
        ]),
      );

      onSubmit?.({
        attendanceDate,
        clockIn,
        clockOut,
        reason: reason.trim(),
        companyTasks: companyTasksForApi,
        projectTasks: projectRows,
      });
      onClose();
    } catch (err) {
      showSnackbar(extractApiErrorMessage(err), "error");
    }
  }, [
    attendanceDate,
    clockIn,
    clockOut,
    reason,
    companyHoursStr,
    companyTasksHtml,
    projectRows,
    totalRegulariseHours,
    resolvedEmployeeId,
    attendanceIdProp,
    dispatch,
    regularizeAttendance,
    onSubmit,
    onClose,
    onSuccess,
    showSnackbar,
    isReasonRequired,
    hasIncompleteTaskRows,
    showProjectTasksSection,
  ]);

  const submitDisabledReason = useMemo((): string | null => {
    if (employeeLoading) return "Loading employee information…";
    if (isSubmitting) return null;
    if (!attendanceDate || !clockIn || !clockOut) {
      return "Enter attendance date, clock in, and clock out.";
    }
    if (resolvedEmployeeId == null) {
      return "Employee information is unavailable.";
    }
    if (isReasonRequired && !reason.trim()) {
      return "Reason for regularisation is required.";
    }
    if (hasIncompleteTaskRows) {
      return showProjectTasksSection
        ? "Complete every task row you started (hours and task explanation are both required)."
        : "Complete the company task (hours and task explanation are both required).";
    }
    if (!hasAtLeastOneTask) {
      return showProjectTasksSection
        ? "At least one company task or project task is required."
        : "At least one company task is required.";
    }
    if (totalRegulariseHours <= 0) {
      return "Enter a valid time in hours (greater than zero).";
    }
    return null;
  }, [
    employeeLoading,
    isSubmitting,
    attendanceDate,
    clockIn,
    clockOut,
    resolvedEmployeeId,
    isReasonRequired,
    reason,
    hasIncompleteTaskRows,
    showProjectTasksSection,
    hasAtLeastOneTask,
    totalRegulariseHours,
  ]);

  const canSubmit = submitDisabledReason === null && !isSubmitting && !employeeLoading;

  return (
    <ModalElement open={open} onClose={onClose} title="Regularise" maxWidth="md">
      <Stack spacing={2.5} sx={{ pt: 0 }}>
        {employeeLoading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <>
            {/* ── Attendance (clock in / out + reason) ───────────────── */}
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.5 }}>
                <AccessTimeIcon sx={{ color: "text.secondary" }} />
                <Typography
                  variant="overline"
                  sx={{ color: "text.secondary", letterSpacing: "0.05em" }}
                >
                  Attendance
                </Typography>
              </Stack>

              <Stack spacing={2}>
                <DatePickerElement
                  label="Attendance date"
                  value={attendanceDate}
                  onChange={(d) => {
                    const todayStart = dayjs().startOf("day");
                    const next =
                      d == null || !d.isValid()
                        ? d
                        : d.startOf("day").isAfter(todayStart)
                          ? todayStart
                          : d;
                    setAttendanceDate(next ?? null);
                    if (next && next.isValid() && clockIn) {
                      setClockIn(next.hour(clockIn.hour()).minute(clockIn.minute()).second(0));
                    }
                    if (next && next.isValid() && clockOut) {
                      setClockOut(next.hour(clockOut.hour()).minute(clockOut.minute()).second(0));
                    }
                  }}
                  max={dayjs().startOf("day")}
                  width="100%"
                  required
                />
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ "& .MuiFormControl-root": { flex: 1, minWidth: 0 } }}
                >
                  <TimePickerElement
                    label="Clock in"
                    value={clockIn}
                    onChange={setClockIn}
                    format="hh:mm A"
                    width="100%"
                  />
                  <TimePickerElement
                    label="Clock out"
                    value={clockOut}
                    onChange={setClockOut}
                    format="hh:mm A"
                    width="100%"
                  />
                </Stack>

                <Box>
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mb: 0.75, color: "text.primary" }}
                  >
                    Reason for regularisation {isReasonRequired && "*"}
                  </Typography>
                  <TextAreaField
                    required={isReasonRequired}
                    label=""
                    value={reason}
                    onChange={setReason}
                    rows={1}
                    sx={{
                      width: "100%",
                      "& .MuiInputLabel-root": { display: "none" },
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "background.paper",
                      },
                      "& .MuiOutlinedInput-notchedOutline": { borderRadius: "8px" },
                      "& textarea": { resize: "vertical", minHeight: 52 },
                    }}
                  />
                </Box>
              </Stack>
            </Box>

            {/* ══ COMPANY TASK (single string on API — same UX as clock-out) ══ */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Box
                  sx={{
                    width: 3,
                    height: 16,
                    borderRadius: 99,
                    bgcolor: "primary.main",
                    flexShrink: 0,
                  }}
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Company task
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Non-project work for this day — hours and task explanation (same pattern as clock-out).
              </Typography>
              <TaskTable>
                <TableHead>
                  <Box sx={{ width: 158, flexShrink: 0 }}>
                    <HeadLabel variant="overline" display="block">
                      Hours worked
                    </HeadLabel>
                  </Box>
                  <HeadLabel variant="overline" sx={{ flex: 1 }}>
                    Task explanation
                  </HeadLabel>
                </TableHead>
                <TaskRow isEven>
                  <Box sx={{ width: 168, flexShrink: 0 }}>
                    <SingleSelectElement
                      label=""
                      value={companyHoursStr}
                      onChange={setCompanyHoursStr}
                      options={HALF_HOUR_SELECT_OPTIONS.map((o) => ({
                        label: o.value,
                        value: o.value,
                      }))}
                      placeholder="Hours"
                      fullWidth
                      clearable
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <TipTapEditor
                      key={`company-${regulariseEditorKey}`}
                      content={companyTasksHtml}
                      onChange={setCompanyTasksHtml}
                      compact
                    />
                  </Box>
                </TaskRow>
              </TaskTable>
            </Box>

            {/* ══ PROJECT TASKS (only when employee has assigned projects) ══ */}
            {showProjectTasksSection && (
              <Box>
                <SectionTitle
                  label="Project task"
                  count={projectRows.length}
                  onAdd={addProjectRow}
                />

                {projectRows.length > 0 ? (
                  <TaskTable>
                    <TableHead>
                      <HeadLabel variant="overline" sx={{ width: 150, flexShrink: 0 }}>
                        Project
                      </HeadLabel>
                      <Box sx={{ width: 138, flexShrink: 0 }}>
                        <HeadLabel variant="overline" display="block">
                          Hours worked
                        </HeadLabel>
                      </Box>
                      <HeadLabel variant="overline" sx={{ flex: 1 }}>
                        Task explanation
                      </HeadLabel>
                      <Box sx={{ width: 40, flexShrink: 0 }} />
                    </TableHead>
                    {projectRows.map((row, index) => (
                      <TaskRow key={index} isEven={index % 2 === 0}>
                        <Box sx={{ width: 150, flexShrink: 0 }}>
                          <SingleSelectElement
                            label=""
                            value={row.projectId}
                            onChange={(v) => updateProjectRow(index, "projectId", v)}
                            options={projectOptionsByRow[index] ?? []}
                            disabled={isProjectsLoading}
                            placeholder={isProjectsLoading ? "Loading…" : "Project"}
                          />
                        </Box>
                        <Box sx={{ width: 148, flexShrink: 0 }}>
                          <SingleSelectElement
                            label=""
                            value={row.hoursWorked}
                            onChange={(v) => updateProjectRow(index, "hoursWorked", v)}
                            options={HALF_HOUR_SELECT_OPTIONS}
                            placeholder="Hours"
                            fullWidth
                            clearable
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <TipTapEditor
                            key={`proj-${regulariseEditorKey}-${index}-${row.projectId}`}
                            content={row.description}
                            onChange={(html) => updateProjectRow(index, "description", html)}
                            compact
                          />
                        </Box>
                        <DelBtn onClick={() => removeProjectRow(index)} />
                      </TaskRow>
                    ))}
                  </TaskTable>
                ) : null}
              </Box>
            )}

            {/* ── Footer actions ──────────────────────────────────────── */}
            <Box sx={{ pt: 1, borderTop: "1px solid #f0f2f5" }}>
              <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
                {submitDisabledReason ? (
                  <Tooltip title={submitDisabledReason} maxWidth={360} placement="top">
                    <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
                      {isSubmitting ? "Submitting…" : "Submit"}
                    </PrimaryButton>
                  </Tooltip>
                ) : (
                  <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
                    {isSubmitting ? "Submitting…" : "Submit"}
                  </PrimaryButton>
                )}
              </Stack>
            </Box>
          </>
        )}
      </Stack>
    </ModalElement>
  );
}