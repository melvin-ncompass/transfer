import dayjs from "dayjs";
import { baseApi } from "../../../../api/base.api";
import type { ExpenseClaimResponse } from "../../me/expense-claims/api/expenseClaim.api";

/** People leave/attendance request cards — e.g. Apr 04, 2026 */
const DISPLAY_DATE_FMT = "MMM DD, YYYY";

// Re-export for use in approval components (expense claim approval flow)
export type { ExpenseClaimResponse } from "../../me/expense-claims/api/expenseClaim.api";
export type { ExpenseClaimValidation } from "../../me/expense-claims/api/expenseClaim.api";
export { useValidateExpenseClaimQuery } from "../../me/expense-claims/api/expenseClaim.api";

export interface RejectExpenseClaimParams {
  id: number;
  reason: string;
}

export interface PayExpenseClaimParams {
  paymentAccountId: number;
  paymentDate: string;
}

/** Align with backend RejectOrCancelEmployeeRequestDto.action */
export type RejectOrCancelEmployeeAction = "reject" | "cancel";

export interface RejectOrCancelEmployeeRequestDto {
  action: RejectOrCancelEmployeeAction;
  message: string;
}

export interface RejectOrCancelEmployeeRequestParams {
  /** May be numeric string from backend (large ids) */
  groupReqId: number | string;
  body: RejectOrCancelEmployeeRequestDto;
}

/** Pending / history row for manager leave approvals */
export interface LeaveApprovalRequest {
  /** Single row id (e.g. first employee request in group); approve may use this */
  id: number;
  /** Group id for multi-day leave; required for reject/cancel API */
  groupReqId?: number | string;
  employee: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  requestType: string;
  /** Comma-separated dates for multi-day leave (same logical request) */
  datesCovered?: string;
  /** Single line: one day = `Mar 22, 2025`; range = `Mar 22, 2025 - Mar 26, 2025 (5)`; non-consecutive lists each day `(n)`. */
  datesAppliedDisplay: string;
  requestedOn: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  updatedBy: string;
  note?: string;
  durationLabel?: string;
  rejectionReason?: string;
  cancellationMsg?: string | null;
  /** Half-day leave from API (`partial` + `partialLeaveIndication`) */
  partial?: boolean;
  partialLeaveIndication?: string | null;
}

/** Short chip label + full sentence for tooltips / modals */
export function getPartialLeaveHalfDisplay(
  partial?: boolean,
  partialLeaveIndication?: string | null
): { shortLabel: string; tooltipTitle: string } | null {
  if (!partial) return null;
  const raw = String(partialLeaveIndication ?? "")
    .toLowerCase()
    .trim()
    .replace(/-/g, "_");
  if (raw === "first_half") {
    return {
      shortLabel: "1st half",
      tooltipTitle: "Applied for first half of the day",
    };
  }
  if (raw === "second_half") {
    return {
      shortLabel: "2nd half",
      tooltipTitle: "Applied for second half of the day",
    };
  }
  if (partialLeaveIndication != null && String(partialLeaveIndication).trim() !== "") {
    return {
      shortLabel: "Partial",
      tooltipTitle: `Partial leave (${String(partialLeaveIndication).replace(/_/g, " ")})`,
    };
  }
  return {
    shortLabel: "Partial",
    tooltipTitle: "Partial day leave",
  };
}

/** Requester / approver person on employee request rows (nested employee + contact) */
export type EmployeeRequestPersonApi = {
  id?: number;
  contact?: {
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  nameAsPerPan?: string | null;
  employeeId?: string | null;
};

/** Raw employee request row from GET .../requests/:employeeId (grouped payload or flat rows) */
export type EmployeeRequestItemApi = {
  id: number;
  groupReqId?: number | string;
  date?: string;
  status?: string;
  note?: string | null;
  message?: string | null;
  /** Some regularization rows use `reason` instead of `note` */
  reason?: string | null;
  createdAt?: string;
  requestedOn?: string;
  cancellationMsg?: string | null;
  /** Present for leave requests; `leaveName` is used by current API */
  leaveType?: {
    id?: number | null;
    name?: string | null;
    leaveName?: string | null;
    leaveType?: string | null;
  } | null;
  /** Attendance regularization / clock correction */
  clockIn?: string | null;
  clockOut?: string | null;
  requestType?: string | null;
  /** Half-day leave: which part of the day */
  partial?: boolean | null;
  partialLeaveIndication?: string | null;
  /** Employee who submitted the request */
  employee?: EmployeeRequestPersonApi | null;
  /** Manager/admin who approved or rejected (history / decided rows) */
  approvedOrRejectedBy?: EmployeeRequestPersonApi | null;
};

/** API envelope: one leave spanning multiple calendar days */
export type EmployeeRequestGroupApi = {
  groupId?: string;
  requests: EmployeeRequestItemApi[];
};

export type GetEmployeeRequestsByEmpIdQuery = {
  /** Sent as `employeeId` query param on `GET /requests` */
  employeeId?: number;
  fromDate: string;
  toDate: string;
  status: "pending" | "history";
};

/** Reporting manager queue — `GET /requests/employees` (reportees only). */
export type GetApproverEmployeesRequestsQuery = {
  fromDate: string;
  toDate: string;
  status: "pending" | "history";
};

/** Admin / global queue — `GET /requests` with optional filters. */
export type GetAdminEmployeeRequestsQueueQuery = GetApproverEmployeesRequestsQuery & {
  employeeId?: number;
  requestType: "leave" | "regularize" | "compOff";
};

export type GetApproverEmployeeRequestsResponse = {
  message?: string;
  data: unknown;
  total?: number;
};

/** Approver queue row for attendance / clock-related requests */
export interface AttendanceApprovalRequest {
  id: number;
  groupReqId?: number | string;
  date: string;
  employee: string;
  requestType: string;
  requestedOn: string;
  clockTimings: string;
  status: LeaveApprovalRequest["status"];
  updatedBy: string;
  note?: string;
  cancellationMsg?: string | null;
}

/**
 * Unwrap nested API envelopes and common list keys so `parseGroupedEmployeeRequests` can run.
 */
export function normalizeApproverEmployeeRequestsPayload(raw: unknown): unknown {
  if (raw == null) return raw;
  let cur: unknown = raw;
  for (let depth = 0; depth < 4; depth++) {
    if (typeof cur !== "object" || cur === null) break;
    const o = cur as Record<string, unknown>;
    if ("data" in o && o.data !== undefined) {
      cur = o.data;
      continue;
    }
    break;
  }
  if (typeof cur === "object" && cur !== null && !Array.isArray(cur)) {
    const o = cur as Record<string, unknown>;
    const groups = o.groups;
    if (Array.isArray(groups) && groups.length > 0 && Array.isArray(groups[0])) {
      return groups;
    }
    for (const key of ["records", "items", "rows", "list", "requests", "results"]) {
      const v = o[key];
      if (Array.isArray(v)) return v;
    }
  }
  return cur;
}

/** Parse date labels from attendance cards (current + legacy without comma / DD MMM). */
function parseCardDateLabel(s: string): dayjs.Dayjs | null {
  const cur = dayjs(s, DISPLAY_DATE_FMT, true);
  if (cur.isValid()) return cur;
  const legacyNoComma = dayjs(s, "MMM DD YYYY", true);
  if (legacyNoComma.isValid()) return legacyNoComma;
  const leg = dayjs(s, "DD MMM YYYY", true);
  return leg.isValid() ? leg : null;
}

/** Format attendance card date line for leave-shaped modals / display */
function buildDatesAppliedDisplayFromAttendanceCard(a: AttendanceApprovalRequest): string {
  const raw = String(a.date ?? "").trim();
  if (!raw) return "—";
  const arrowParts = raw.split("→").map((s) => s.trim());
  if (arrowParts.length === 2) {
    const d1 = parseCardDateLabel(arrowParts[0]);
    const d2 = parseCardDateLabel(arrowParts[1]);
    if (d1 != null && d2 != null) {
      const n = d2.diff(d1, "day") + 1;
      return `${d1.format(DISPLAY_DATE_FMT)} - ${d2.format(DISPLAY_DATE_FMT)} (${n})`;
    }
    return `${arrowParts[0]} - ${arrowParts[1]} (${arrowParts.length})`;
  }
  const d0 = parseCardDateLabel(arrowParts[0]);
  if (d0 != null) return d0.format(DISPLAY_DATE_FMT);
  return raw;
}

/** Map attendance row → leave-shaped object so approve/reject modals can reuse the same UI */
export function attendanceRequestToLeaveModalShim(
  a: AttendanceApprovalRequest
): LeaveApprovalRequest {
  const datesAppliedDisplay = buildDatesAppliedDisplayFromAttendanceCard(a);
  return {
    id: a.id,
    groupReqId: a.groupReqId,
    requestType: a.requestType,
    employee: a.employee,
    leaveType: a.requestType,
    startDate: a.date,
    endDate: a.date,
    datesCovered: a.date,
    datesAppliedDisplay,
    requestedOn: a.requestedOn,
    status: a.status,
    updatedBy: a.updatedBy,
    note: a.note,
    cancellationMsg: a.cancellationMsg,
    durationLabel: a.clockTimings,
  };
}

/** Normalize backend `groupByRequestId` payload into arrays of rows per leave group */
export function parseGroupedEmployeeRequests(raw: unknown): EmployeeRequestItemApi[][] {
  raw = normalizeApproverEmployeeRequestsPayload(raw);
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    const first = raw[0];
    /** Shape: `[{ groupId, requests: [...] }, ...]` — one card per group, multi-day leaves */
    if (
      typeof first === "object" &&
      first !== null &&
      "requests" in first &&
      Array.isArray((first as EmployeeRequestGroupApi).requests)
    ) {
      return (raw as EmployeeRequestGroupApi[]).map((g) =>
        [...(g.requests ?? [])].sort((a, b) =>
          String(a.date ?? "").localeCompare(String(b.date ?? ""))
        )
      );
    }
    if (Array.isArray(first)) {
      return raw as EmployeeRequestItemApi[][];
    }
    if (typeof first === "object" && first !== null && "id" in first) {
      const flat = raw as EmployeeRequestItemApi[];
      const map = new Map<string, EmployeeRequestItemApi[]>();
      for (const item of flat) {
        const gid = String(item.groupReqId ?? item.id);
        const arr = map.get(gid) ?? [];
        arr.push(item);
        map.set(gid, arr);
      }
      return Array.from(map.values()).map((g) =>
        [...g].sort((a, b) => String(a.date ?? "").localeCompare(String(b.date ?? "")))
      );
    }
  }
  if (typeof raw === "object") {
    const vals = Object.values(raw as Record<string, unknown>);
    const arrays = vals.filter(Array.isArray) as EmployeeRequestItemApi[][];
    if (arrays.length > 0) return arrays;
  }
  return [];
}

/** Display name for requester or approver from nested employee / contact */
function requestPersonDisplayName(emp: EmployeeRequestPersonApi | null | undefined): string {
  if (!emp || typeof emp !== "object") return "—";
  const c = emp.contact;
  if (c?.name != null && String(c.name).trim() !== "") return String(c.name);
  const contactParts = [c?.firstName, c?.lastName].filter((x) => x != null && String(x).trim() !== "");
  if (contactParts.length) return contactParts.map(String).join(" ").trim();
  if (emp.name != null && String(emp.name).trim() !== "") return String(emp.name);
  if (emp.nameAsPerPan != null && String(emp.nameAsPerPan).trim() !== "") return String(emp.nameAsPerPan);
  const fn = emp.firstName ?? "";
  const ln = emp.lastName ?? "";
  const full = `${fn} ${ln}`.trim();
  if (full) return full;
  if (emp.employeeId != null && String(emp.employeeId).trim() !== "") return String(emp.employeeId);
  return "—";
}

function employeeDisplayName(row: EmployeeRequestItemApi): string {
  return requestPersonDisplayName(row.employee);
}

/** Employee-submitted note/reason on a request row (API field names vary). */
export function employeeRequestNoteText(row: EmployeeRequestItemApi): string | undefined {
  const ext = row as EmployeeRequestItemApi & { employee_note?: string | null };
  const candidates = [row.note, row.reason, ext.employee_note, row.message];
  for (const c of candidates) {
    if (c != null && String(c).trim() !== "") return String(c).trim();
  }
  return undefined;
}

function employeeRequestNoteFromGroup(
  sorted: EmployeeRequestItemApi[],
): string | undefined {
  for (const r of sorted) {
    const n = employeeRequestNoteText(r);
    if (n) return n;
  }
  return undefined;
}

function mapApiStatusToUi(
  status: string | undefined
): LeaveApprovalRequest["status"] {
  const s = String(status ?? "").toUpperCase();
  if (s === "PENDING") return "Pending";
  if (s === "APPROVED") return "Approved";
  if (s === "CANCELLED") return "Cancelled";
  return "Rejected";
}

function leaveTypeDisplayName(lt: EmployeeRequestItemApi["leaveType"]): string | null {
  if (!lt || typeof lt !== "object") return null;
  const o = lt as { name?: string | null; leaveName?: string | null };
  if (o.leaveName != null && String(o.leaveName).trim() !== "") return String(o.leaveName);
  if (o.name != null && String(o.name).trim() !== "") return String(o.name);
  return null;
}

/**
 * API `requestType` for non-leave rows is often snake_case (e.g. compoff_credit).
 * Used for attendance cards and leave-shaped modals built from attendance rows.
 */
export function attendanceRequestTypeDisplayName(
  raw: string | null | undefined
): string {
  if (raw == null || String(raw).trim() === "") return "Attendance";
  const key = String(raw).trim().toLowerCase().replace(/-/g, "_");
  const known: Record<string, string> = {
    compoff_credit: "Comp off (credit)",
    attendance: "Attendance",
    attendance_regularization: "Attendance regularization",
    regularization: "Regularization",
  };
  if (known[key]) return known[key];
  const words = key.split("_").filter(Boolean);
  return words
    .map((w) => {
      if (w === "compoff") return "Comp off";
      if (w === "comp") return "Comp";
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

function formatLeaveDayForDisplay(d: dayjs.Dayjs): string {
  return d.format(DISPLAY_DATE_FMT);
}

/** Unique calendar days, sorted — from API rows (ISO or parseable dates). */
function buildDatesAppliedDisplay(sorted: EmployeeRequestItemApi[]): string {
  const seen = new Map<string, dayjs.Dayjs>();
  for (const r of sorted) {
    if (r.date == null || String(r.date).trim() === "") continue;
    const d = dayjs(r.date).startOf("day");
    if (!d.isValid()) continue;
    seen.set(d.format("YYYY-MM-DD"), d);
  }
  const days = [...seen.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, d]) => d);
  const n = days.length;
  if (n === 0) return "—";
  if (n === 1) return formatLeaveDayForDisplay(days[0]);

  let consecutive = true;
  for (let i = 1; i < n; i++) {
    if (!days[i - 1].add(1, "day").isSame(days[i], "day")) {
      consecutive = false;
      break;
    }
  }
  if (consecutive) {
    return `${formatLeaveDayForDisplay(days[0])} - ${formatLeaveDayForDisplay(days[n - 1])} (${n})`;
  }
  return `${days.map(formatLeaveDayForDisplay).join(", ")} (${n})`;
}

/** Map one grouped leave (multi-day = multiple rows) to a single approval card row */
export function mapEmployeeRequestGroupToLeaveRow(
  group: EmployeeRequestItemApi[]
): LeaveApprovalRequest | null {
  if (!group.length) return null;
  const sorted = [...group].sort((a, b) =>
    String(a.date ?? "").localeCompare(String(b.date ?? ""))
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const groupReqId = first.groupReqId ?? first.id;

  const start = first.date != null ? dayjs(first.date).format(DISPLAY_DATE_FMT) : "—";
  const end = last.date != null ? dayjs(last.date).format(DISPLAY_DATE_FMT) : "—";

  const days = sorted.length;
  const datesCovered = sorted
    .map((r) => (r.date != null ? dayjs(r.date).format(DISPLAY_DATE_FMT) : null))
    .filter((x): x is string => x != null)
    .join(", ");

  const datesAppliedDisplay = buildDatesAppliedDisplay(sorted);

  const durationLabel =
    days > 1 ? `${days} days` : days === 1 ? "1 day" : "—";

  const status = mapApiStatusToUi(first.status);
  const requestedOnRaw = first.requestedOn ?? first.createdAt;
  const requestedOn =
    requestedOnRaw != null ? dayjs(requestedOnRaw).format(DISPLAY_DATE_FMT) : start;

  const rejectionReason =
    status === "Rejected" || status === "Cancelled"
      ? [...sorted]
          .reverse()
          .map((r) => {
            const cm = (r as EmployeeRequestItemApi).cancellationMsg ?? r.message;
            return cm != null && String(cm).trim() !== "" ? String(cm) : undefined;
          })
          .find((m) => m != null) ?? undefined
      : undefined;

  const cancellationMsg =
    status === "Rejected" || status === "Cancelled" ? rejectionReason : undefined;

  const updatedBy =
    sorted.map((r) => requestPersonDisplayName(r.approvedOrRejectedBy)).find((n) => n !== "—") ?? "—";

  const partialSource = sorted.find((r) => r.partial === true);
  const partial = partialSource != null;
  const partialLeaveIndication =
    partial &&
    partialSource?.partialLeaveIndication != null &&
    String(partialSource.partialLeaveIndication).trim() !== ""
      ? String(partialSource.partialLeaveIndication)
      : null;

  const requestType = first.requestType ?? "";

  return {
    id: first.id,
    groupReqId,
    requestType,
    employee: employeeDisplayName(first),
    leaveType: leaveTypeDisplayName(first.leaveType) ?? "Leave",
    startDate: start,
    endDate: end,
    datesCovered: datesCovered || undefined,
    datesAppliedDisplay,
    requestedOn,
    status,
    updatedBy,
    note: employeeRequestNoteFromGroup(sorted),
    durationLabel,
    rejectionReason,
    cancellationMsg,
    partial,
    partialLeaveIndication: partial ? partialLeaveIndication : undefined,
  };
}

/**
 * Backend often attaches `leaveType` (e.g. comp-off leave type id) to non–calendar-leave rows.
 * Without this check, `isLeaveRequestGroup` treats them as leave → wrong card and approve flow.
 */
function isAttendanceWorkflowRequestType(requestType: string | null | undefined): boolean {
  if (requestType == null || String(requestType).trim() === "") return false;
  const t = String(requestType).trim().toLowerCase().replace(/-/g, "_");
  if (t === "leave") return false;
  if (t.startsWith("compoff")) return true;
  if (t.includes("comp_off")) return true;
  if (t.includes("regularis") || t.includes("regulariz")) return true;
  if (t.includes("overtime")) return true;
  if (t === "attendance" || t.startsWith("attendance_")) return true;
  return false;
}

function isLeaveRequestGroup(group: EmployeeRequestItemApi[]): boolean {
  const first = group[0];
  if (!first) return false;
  const rawRt = first.requestType ?? (first as { request_type?: string | null }).request_type;
  if (isAttendanceWorkflowRequestType(rawRt)) return false;
  if (String(first.requestType ?? "").toLowerCase() === "leave") return true;
  const lt = first.leaveType;
  if (leaveTypeDisplayName(lt)) return true;
  if (lt != null && typeof lt === "object" && (lt as { id?: number }).id != null && (lt as { id?: number }).id !== 0) {
    return true;
  }
  return false;
}

function formatClockSegment(t: string | null | undefined): string {
  if (t == null || String(t).trim() === "") return "";
  const s = String(t).trim();
  const parsed = dayjs(s, ["HH:mm:ss", "HH:mm", "H:mm"], true);
  if (parsed.isValid()) return parsed.format("hh:mm A");
  const fallback = dayjs(s);
  return fallback.isValid() ? fallback.format("hh:mm A") : s;
}

function buildClockTimingsForRow(row: EmployeeRequestItemApi): string {
  const ext = row as EmployeeRequestItemApi & { clock_in?: string | null; clock_out?: string | null };
  const cin = row.clockIn ?? ext.clock_in;
  const cout = row.clockOut ?? ext.clock_out;
  const a = formatClockSegment(cin);
  const b = formatClockSegment(cout);
  if (!a && !b) return "—";
  if (!a) return b;
  if (!b) return a;
  return `${a} – ${b}`;
}

/** Map one grouped non-leave request (e.g. attendance regularization) to a card row */
export function mapEmployeeRequestGroupToAttendanceRow(
  group: EmployeeRequestItemApi[]
): AttendanceApprovalRequest | null {
  if (!group.length) return null;
  const sorted = [...group].sort((a, b) =>
    String(a.date ?? "").localeCompare(String(b.date ?? ""))
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const groupReqId = first.groupReqId ?? first.id;

  const dateStr =
    first.date != null && last.date != null && first.date !== last.date
      ? `${dayjs(first.date).format(DISPLAY_DATE_FMT)} → ${dayjs(last.date).format(DISPLAY_DATE_FMT)}`
      : first.date != null
        ? dayjs(first.date).format(DISPLAY_DATE_FMT)
        : "—";

  const clockParts = sorted.map((r) => buildClockTimingsForRow(r)).filter((c) => c !== "—");
  const clockTimings =
    clockParts.length > 0 ? clockParts.join("; ") : "—";

  const rawType = first.requestType ?? (first as { request_type?: string | null }).request_type;
  const requestType = attendanceRequestTypeDisplayName(rawType);

  const status = mapApiStatusToUi(first.status);
  const requestedOnRaw = first.requestedOn ?? first.createdAt;
  const requestedOn =
    requestedOnRaw != null ? dayjs(requestedOnRaw).format(DISPLAY_DATE_FMT) : dateStr;

  const updatedBy =
    sorted.map((r) => requestPersonDisplayName(r.approvedOrRejectedBy)).find((n) => n !== "—") ?? "—";

  const cancellationMsg = status === "Rejected" || status === "Cancelled"
    ? first.cancellationMsg
    : undefined;
  return {
    id: first.id,
    groupReqId,
    date: dateStr,
    employee: employeeDisplayName(first),
    requestType,
    requestedOn,
    clockTimings,
    status,
    updatedBy,
    cancellationMsg,
    note: employeeRequestNoteFromGroup(sorted),
  };
}

/** Client-side employee filter for manager `/requests/employees` (no `employeeId` query param). */
export function filterApproverEmployeeRequestsPayload(
  rawData: unknown,
  employeeId?: number,
): unknown {
  if (employeeId == null || Number.isNaN(employeeId)) return rawData;
  const groups = parseGroupedEmployeeRequests(rawData);
  const filtered = groups
    .map((group) =>
      group.filter((row) => {
        const emp = row.employee;
        if (!emp) return false;
        return (
          emp.id === employeeId || String(emp.employeeId ?? "") === String(employeeId)
        );
      }),
    )
    .filter((group) => group.length > 0);
  return filtered;
}

export function isRegularizationAttendanceRequestType(
  requestType: string | null | undefined,
): boolean {
  const t = String(requestType ?? "").toLowerCase();
  return t.includes("regularis") || t.includes("regulariz");
}

export function filterCompOffAttendanceRequests(
  rows: AttendanceApprovalRequest[],
): AttendanceApprovalRequest[] {
  return rows.filter(
    (r) => !isRegularizationAttendanceRequestType(r.requestType),
  );
}

export function filterRegularizeAttendanceRequests(
  rows: AttendanceApprovalRequest[],
): AttendanceApprovalRequest[] {
  return rows.filter((r) =>
    isRegularizationAttendanceRequestType(r.requestType),
  );
}

export function splitGroupedEmployeeRequestsToLeaveAndAttendance(rawData: unknown): {
  leave: LeaveApprovalRequest[];
  attendance: AttendanceApprovalRequest[];
} {
  const groups = parseGroupedEmployeeRequests(rawData);
  const leave: LeaveApprovalRequest[] = [];
  const attendance: AttendanceApprovalRequest[] = [];
  for (const g of groups) {
    if (!g.length) continue;
    if (isLeaveRequestGroup(g)) {
      const row = mapEmployeeRequestGroupToLeaveRow(g);
      if (row) leave.push(row);
    } else {
      const row = mapEmployeeRequestGroupToAttendanceRow(g);
      if (row) attendance.push(row);
    }
  }
  return { leave, attendance };
}

/** Leave rows only (excludes attendance / non-leave groups) */
export function mapGroupedLeavesToApprovalRows(rawData: unknown): LeaveApprovalRequest[] {
  return splitGroupedEmployeeRequestsToLeaveAndAttendance(rawData).leave;
}

/** Status filter for listExpenseClaimsByApprover: 'pending' | 'approved' | 'history' | etc. */
export type ExpenseApprovalsStatusFilter =
  | "pending"
  | "approved"
  | "rejected"
  | "paid"
  | "draft"
  | "history";

/**
 * Args for `getExpenseClaimsByApprover`.
 * `isAdmin` widens the queue from "claims I approve" to "all company claims" on the backend.
 * Source it from `useGetEmployeeInfoQuery().data.data.isAdmin` so the UI never guesses.
 */
export interface ExpenseClaimsByApproverArgs {
  status?: ExpenseApprovalsStatusFilter;
  isAdmin?: boolean;
}

export const approvalsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Expense claims for current user as approver.
     * status: 'pending' | 'approved' | 'history' (paid+rejected) | etc.
     * isAdmin: when true, backend returns the company-wide queue instead of approver-scoped.
     */
    getExpenseClaimsByApprover: builder.query<
      ExpenseClaimResponse[],
      ExpenseClaimsByApproverArgs | void
    >({
      query: (args) => {
        const params: Record<string, string | boolean> = {};
        if (args?.status != null) params.status = args.status;
        if (args?.isAdmin === true) params.isAdmin = true;
        return {
          url: "/expense-claim/approvals",
          params: Object.keys(params).length > 0 ? params : undefined,
        };
      },
      transformResponse: (response: any) => response.data ?? [],
      providesTags: ["ExpenseClaim"],
    }),

    approveExpenseClaim: builder.mutation<ExpenseClaimResponse, number>({
      query: (id) => ({
        url: `/expense-claim/${id}/approve`,
        method: "PATCH",
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (_result, _error, id) => [
        { type: "ExpenseClaim", id },
        "ExpenseClaim",
      ],
    }),

    rejectExpenseClaim: builder.mutation<
      ExpenseClaimResponse,
      RejectExpenseClaimParams
    >({
      query: ({ id, reason }) => ({
        url: `/expense-claim/${id}/reject`,
        method: "PATCH",
        body: { reason },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ExpenseClaim", id },
        "ExpenseClaim",
      ],
    }),

    payExpenseClaim: builder.mutation<
      ExpenseClaimResponse,
      { id: number; body: PayExpenseClaimParams }
    >({
      query: ({ id, body }) => ({
        url: `/expense-claim/${id}/paid`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ExpenseClaim", id },
        "ExpenseClaim",
      ],
    }),

    /**
     * Employee requests for one employee id (leave, attendance regularization, etc.).
     * `GET /requests?employeeId=&fromDate=&toDate=&status=`
     */
    getEmployeeRequestsByEmpId: builder.query<
      GetApproverEmployeeRequestsResponse,
      GetEmployeeRequestsByEmpIdQuery
    >({
      query: ({ employeeId, fromDate, toDate, status }) => ({
        url: `/requests`,
        params: {
          fromDate,
          toDate,
          status,
          ...(employeeId != null ? { employeeId } : {}),
        },
      }),
      transformResponse: (response: any): GetApproverEmployeeRequestsResponse => ({
        message: response?.message,
        data: response?.data,
        total: response?.total,
      }),
      providesTags: (_result, _error, arg) => [
        {
          type: "EmployeeRequest",
          id: `by-emp-${arg.employeeId ?? "all"}-${arg.status}-${arg.fromDate}-${arg.toDate}`,
        },
        "EmployeeRequest",
        "LeaveRequest",
      ],
    }),

    /**
     * Global employee-requests queue for admin-as-employee: `GET /requests` with only date range + status
     * (no `employeeId`). Takes precedence over reportee queue when both admin+employee and manager.
     */
    getAdminEmployeeRequestsQueue: builder.query<
      GetApproverEmployeeRequestsResponse,
      GetAdminEmployeeRequestsQueueQuery
    >({
      query: ({ employeeId, fromDate, toDate, status, requestType }) => ({
        url: `/requests`,
        params: {
          fromDate,
          toDate,
          status,
          requestType,
          ...(employeeId != null ? { employeeId } : {}),
        },
      }),
      transformResponse: (response: any): GetApproverEmployeeRequestsResponse => ({
        message: response?.message,
        data: response?.data,
        total: response?.total,
      }),
      providesTags: (_result, _error, arg) => [
        {
          type: "EmployeeRequest",
          id: `requests-queue-${arg.status}-${arg.fromDate}-${arg.toDate}`,
        },
        "EmployeeRequest",
        "LeaveRequest",
      ],
    }),

    /**
     * Employee requests for everyone the current user can approve (reportees).
     * Same date/status query params as `getEmployeeRequestsByEmpId` but no `employeeId` (reportees list).
     */
    getApproverEmployeesRequests: builder.query<
      GetApproverEmployeeRequestsResponse,
      GetApproverEmployeesRequestsQuery
    >({
      query: ({ fromDate, toDate, status }) => ({
        url: `/requests/employees`,
        params: { fromDate, toDate, status },
      }),
      transformResponse: (response: any): GetApproverEmployeeRequestsResponse => ({
        message: response?.message,
        data: response?.data,
        total: response?.total,
      }),
      providesTags: (_result, _error, arg) => [
        {
          type: "EmployeeRequest",
          id: `approver-employees-${arg.status}-${arg.fromDate}-${arg.toDate}`,
        },
        "EmployeeRequest",
        "LeaveRequest",
      ],
    }),

    /**
     * Approve any pending employee request (leave, comp off group, etc.) by request id.
     * Backend: @Post("approveEmployeeRequest/:requestId") — adjust base path to match your controller prefix.
     */
    approveEmployeeRequest: builder.mutation<
      { message?: string; data?: unknown },
      number
    >({
      query: (requestId) => ({
        url: `/attendance/approveEmployeeRequest/${requestId}`,
        method: "POST",
      }),
      transformResponse: (response: any) => ({
        message: response?.message,
        data: response?.data,
      }),
      invalidatesTags: (_result, _error, requestId) => [
        { type: "LeaveRequest", id: requestId },
        { type: "EmployeeRequest", id: requestId },
        "LeaveRequest",
        "EmployeeRequest",
        "People",
        "Attendance",
        "Dashboard",
      ],
    }),

    /**
     * Reject or cancel pending employee request(s) by group id (e.g. leave spanning multiple days).
     * Backend: @Post("rejectOrCancelEmployeeRequest/:groupReqId")
     */
    rejectOrCancelEmployeeRequest: builder.mutation<
      { message?: string; data?: unknown },
      RejectOrCancelEmployeeRequestParams
    >({
      query: ({ groupReqId, body }) => ({
        url: `/attendance/rejectOrCancelEmployeeRequest/${groupReqId}`,
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => ({
        message: response?.message,
        data: response?.data,
      }),
      invalidatesTags: (_result, _error, { groupReqId }) => [
        { type: "LeaveRequest", id: groupReqId },
        { type: "EmployeeRequest", id: groupReqId },
        "LeaveRequest",
        "EmployeeRequest",
        "People",
        "Attendance",
        "Dashboard",
      ],
    }),
  }),
});

export const {
  useGetExpenseClaimsByApproverQuery,
  useGetEmployeeRequestsByEmpIdQuery,
  useGetAdminEmployeeRequestsQueueQuery,
  useGetApproverEmployeesRequestsQuery,
  useApproveExpenseClaimMutation,
  useRejectExpenseClaimMutation,
  usePayExpenseClaimMutation,
  useApproveEmployeeRequestMutation,
  useRejectOrCancelEmployeeRequestMutation,
} = approvalsApi;
