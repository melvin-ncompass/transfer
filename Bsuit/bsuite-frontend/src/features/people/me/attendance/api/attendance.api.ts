import { baseApi } from "../../../../../api/base.api";

/**
 * Matches backend ApplyLeaveDto (POST /attendance/applyLeave/:employeeId)
 */
export type ApplyLeaveDto = {
  dates: string[];
  leaveTypeId: number;
  partial?: boolean;
  /** Backend partial leave indicator (adjust if your API uses different values) */
  leaveIndication?: string;
  reason?: string;
  /** Work / contact emails to notify (backend expects addresses, not employee ids) */
  notifyTo?: string[];
};

export type SkippedLeaveDate = {
  date: string;
  reason: string;
};

export type ApplyLeaveResult = {
  appliedDates: string[];
  skippedDates: SkippedLeaveDate[];
  totalApplied: number;
  totalSkipped: number;
};

/** Service-layer payload nested under controller `data` */
export type ApplyLeaveServicePayload = {
  message?: string;
  data: ApplyLeaveResult;
};

/** Typical Nest response: { data: serviceReturn, message: string } */
export type ApplyLeaveMutationResponse = {
  data: ApplyLeaveServicePayload;
  message: string;
};

/** GET /attendance/checkAttendance/:employeeId */
export type CheckAttendanceData = {
  employeeId: number;
  clockedIn: boolean;
  clockedOut: boolean;
  clockInTime: string;
  clockOutTime: string;
};

export type CheckAttendanceResponse = {
  data: CheckAttendanceData;
  message: string;
};

/** POST /attendance/comp_off_credit/:employeeId */
export type CreateCompOffCreditDto = {
  /** ISO date strings (YYYY-MM-DD), one per day */
  dateRange: string[];
  note: string;
  /** `request` → pending + notify manager; `award` → approved (typically admin) */
  flag: "request" | "award";
};

export type CreateCompOffCreditData = {
  employeeId: number;
  compOffDates: string[];
  status: string[];
};

export type CreateCompOffCreditServiceResponse = {
  data: CreateCompOffCreditData;
  change_of_data?: {
    employeeId: number;
    compOffDates: unknown[];
    module: string;
    feature: string;
    status: string;
  };
};

/** Controller wraps service return in `data` */
export type CreateCompOffCreditMutationResponse = {
  data: CreateCompOffCreditServiceResponse;
  message: string;
};

/** Project line — matches POST /attendance/regularize (`timeInHours` string, `description` HTML) */
export type RegularizeProjectTaskPayload = {
  projectId: number;
  description: string;
  timeInHours: string;
};

/**
 * POST /attendance/regularize/:employeeId
 */
export type RegularizeAttendanceDto = {
  date: string;
  clockIn: string;
  clockOut: string;
  note: string;
  projectTasks: RegularizeProjectTaskPayload[];
  /** Company task description only (TipTap HTML); hours belong in `timeInHours`, not here */
  companyTasks: string;
  /** Total hours (company + projects), string e.g. "8.5" */
  timeInHours: string;
  /** True if clock-in/out (or date anchoring them) changed from initial modal load */
  timeRegularized: boolean;
  /** True if company hours, company description, or any project row changed from initial / prefill */
  tasksRegularized: boolean;
};

export type RegularizeAttendanceMutationResponse = {
  data: unknown;
  message: string;
};

/** Location payload stored on clock-in / clock-out (GET attendance calendar). */
export type AttendanceLocationInfo = {
  lat: number;
  lng: number;
  ip?: string;
  device?: string;
  address?: string;
};

/** Holiday payload when API sends metadata (e.g. Good Friday) */
export type AttendanceHolidayDetail = {
  id?: number;
  date?: string;
  description?: string | null;
};

/** Single calendar day from GET /attendance/:employeeId?month=&year= (getAllAttendance) */
export type AttendanceDayEntry = {
  leave: unknown;
  /** Leave request workflow status (e.g. pending, approved) when `leave` is set */
  leaveStatus?: string | null;
  employeeId: number;
  /** Present when an attendance record exists for this day — used for GET /attendance/get_tasks/:id */
  attendanceId?: number;
  /** `false` / absent, name string, or holiday object with `description` */
  holiday: boolean | string | AttendanceHolidayDetail | null;
  /** Redundant friendly name from API — preferred for display when set */
  holidayName?: string | null;
  weekOff: boolean | string;
  clockIn: string | null;
  clockOut: string | null;
  partialLeave: boolean;
  partialIndication: unknown;
  partialLop: boolean;
  /** Backend: true when clock-in was after the allowed window */
  lateLogin?: boolean;
  pendingReg: boolean;
  approvedReg: boolean;
  birthday: boolean;
  /** When false, actions (regularise / leave / comp-off) are locked for that date */
  actions: boolean;
  clockInLocationInfo: AttendanceLocationInfo | undefined | null;
  clockOutLocationInfo: AttendanceLocationInfo | undefined | null;
};

/** `data` keyed by ISO date `YYYY-MM-DD` */
export type GetAllAttendanceData = Record<string, AttendanceDayEntry>;

export type GetAllAttendanceResponse = {
  message?: string;
  data: GetAllAttendanceData;
};

export type GetAllAttendanceQueryArgs = {
  employeeId: number;
  /** 1–12 */
  month: number;
  year: number;
};

/** GET leave/leaveStats/:employeeId?leaveTypeId= — one row per leave type when filtered */
export type LeaveStatRow = {
  leaveTypeId: number;
  leaveTypeName: string;
  consumed: number;
  /** Numeric balance or `"Unlimited"` when allocation is unlimited */
  available: number | string;
};

export type GetLeaveStatsData = {
  employeeId: number;
  yearRanges?: unknown;
  cycleStart?: string;
  cycleEnd?: string;
  leaveStats: LeaveStatRow[];
};

export type GetLeaveStatsQueryArgs = {
  employeeId: number;
  leaveTypeId: number;
};

/** Nested project from GET /attendance/get_tasks (and legacy assigned-projects shape) */
export type AttendanceAssignedProjectNested = {
  id: number;
  projectName: string;
  billableHoursPerDay?: number;
  isArchived?: boolean;
};

/** Legacy assignment row (nested `project`) — still parsed if API sends it */
export type AttendanceAssignedProjectRow = {
  id: number;
  project: AttendanceAssignedProjectNested;
  isBillable?: boolean;
  startDate?: string;
  endDate?: string | null;
  isArchived?: boolean;
};

/** Normalized item from GET /attendance/projects/:employeeId (`data` is `{ id, projectName }[]`) */
export type AttendanceAssignedProjectListItem = {
  id: number;
  projectName: string;
};

function parseAttendanceAssignedProjectsResponse(
  response: unknown,
): AttendanceAssignedProjectListItem[] {
  const r = response as { data?: unknown };
  const raw = r?.data;
  if (!Array.isArray(raw)) return [];

  const out: AttendanceAssignedProjectListItem[] = [];
  const seen = new Set<number>();

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;

    if ("projectName" in o && !("project" in o)) {
      const id = Number(o.id);
      if (!Number.isFinite(id) || id <= 0) continue;
      if (seen.has(id)) continue;
      const projectName = String(o.projectName ?? "").trim();
      if (!projectName) continue;
      seen.add(id);
      out.push({ id, projectName });
      continue;
    }

    if (o.project && typeof o.project === "object") {
      const row = o as unknown as AttendanceAssignedProjectRow;
      if (row.project?.isArchived === true || row.isArchived === true) continue;
      const id = Number(row.project.id);
      if (!Number.isFinite(id) || id <= 0) continue;
      if (seen.has(id)) continue;
      const projectName = String(row.project.projectName ?? "").trim();
      if (!projectName) continue;
      seen.add(id);
      out.push({ id, projectName });
    }
  }

  return out;
}

/**
 * Map assigned-project rows to select options (`value` = project id string).
 * De-duplicates by project id.
 */
/** GET /attendance/get_tasks/:attendanceId — prefill regularise modal */
export type AttendanceTaskComment = {
  date: string;
  user: string;
  message: string;
};

export type AttendanceGetTasksCompanyTask = {
  description: string;
  timeInHours: string;
  pendingDescription?: string | null;
  status: string;
  comments: unknown;
};

export type AttendanceGetTasksProjectTask = {
  project: AttendanceAssignedProjectNested;
  description: string;
  timeInHours: string;
  pendingDescription?: string | null;
  status: string;
  comments: AttendanceTaskComment[] | null;
};

export type AttendanceGetTasksData = {
  companyTasks: AttendanceGetTasksCompanyTask[];
  projectTasks: AttendanceGetTasksProjectTask[];
};

export function mapAttendanceAssignedProjectsToOptions(
  rows: AttendanceAssignedProjectListItem[],
): { label: string; value: string }[] {
  const seen = new Set<string>();
  const out: { label: string; value: string }[] = [];
  for (const row of rows) {
    const pid = row.id;
    if (pid == null || !Number.isFinite(Number(pid)) || Number(pid) <= 0) continue;
    const key = String(pid);
    if (seen.has(key)) continue;
    seen.add(key);
    const name = row.projectName?.trim();
    if (!name) continue;
    out.push({ label: name, value: key });
  }
  return out;
}

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Monthly attendance calendar for an employee.
     * Backend: @Get(":employeeId") with @Query month, year (controller prefix e.g. attendance).
     */
    getAllAttendance: builder.query<GetAllAttendanceResponse, GetAllAttendanceQueryArgs>({
      query: ({ employeeId, month, year }) => ({
        url: `/attendance/${employeeId}`,
        params: { month, year },
      }),
      transformResponse: (response: unknown): GetAllAttendanceResponse => {
        const r = response as { message?: string; data?: GetAllAttendanceData };
        return {
          message: r?.message,
          data: r?.data ?? {},
        };
      },
      providesTags: (_result, _error, { employeeId, month, year }) => [
        { type: "Attendance", id: `calendar-${employeeId}-${year}-${month}` },
        "Attendance",
      ],
    }),

    checkAttendance: builder.query<CheckAttendanceResponse, number>({
      query: (employeeId) => ({
        url: `/attendance/checkAttendance/${employeeId}`,
        method: "GET",
      }),
      providesTags: ["Attendance"],
    }),

    /** Projects assigned to the employee for clock-out / regularise task lines */
    getAttendanceAssignedProjects: builder.query<AttendanceAssignedProjectListItem[], number>({
      query: (employeeId) => ({
        url: `/attendance/projects/${employeeId}`,
        method: "GET",
      }),
      transformResponse: (response: unknown): AttendanceAssignedProjectListItem[] =>
        parseAttendanceAssignedProjectsResponse(response),
      providesTags: (_result, _error, employeeId) => [
        { type: "Attendance", id: `assigned-projects-${employeeId}` },
        "Attendance",
      ],
    }),

    /**
     * Leave balance for an employee, optionally scoped to one leave type.
     * Backend: @Get("leave/leaveStats/:employeeId") @Query("leaveTypeId")
     */
    getLeaveStats: builder.query<GetLeaveStatsData, GetLeaveStatsQueryArgs>({
      query: ({ employeeId, leaveTypeId }) => ({
        url: `/leave/leaveStats/${employeeId}`,
        params: { leaveTypeId },
      }),
      transformResponse: (response: unknown, _meta, arg: GetLeaveStatsQueryArgs): GetLeaveStatsData => {
        const r = response as { data?: GetLeaveStatsData };
        const d = r?.data;
        return {
          employeeId: d?.employeeId ?? arg.employeeId,
          yearRanges: d?.yearRanges,
          cycleStart: d?.cycleStart,
          cycleEnd: d?.cycleEnd,
          leaveStats: Array.isArray(d?.leaveStats) ? d!.leaveStats : [],
        };
      },
      providesTags: ["LeavePlans", "People"],
    }),

    applyLeave: builder.mutation<
      ApplyLeaveMutationResponse,
      { employeeId: number; body: ApplyLeaveDto }
    >({
      query: ({ employeeId, body }) => ({
        url: `/leave/applyLeave/${employeeId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attendance", "AttendanceSettings", "People", "Dashboard", "LeavePlans","Leave"],
    }),

    createCompOffCredit: builder.mutation<
      CreateCompOffCreditMutationResponse,
      { employeeId: number; body: CreateCompOffCreditDto }
    >({
      query: ({ employeeId, body }) => ({
        url: `/leave/comp_off_credit/${employeeId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attendance", "AttendanceSettings", "People", "Dashboard", "LeavePlans"],
    }),

    /** Existing clock-out / regularise task lines for an attendance record */
    getAttendanceTasks: builder.query<AttendanceGetTasksData, number>({
      query: (attendanceId) => ({
        url: `/attendance/get_tasks/${attendanceId}`,
        method: "GET",
      }),
      transformResponse: (response: unknown): AttendanceGetTasksData => {
        const r = response as { data?: AttendanceGetTasksData };
        const d = r?.data;
        return {
          companyTasks: Array.isArray(d?.companyTasks) ? d!.companyTasks : [],
          projectTasks: Array.isArray(d?.projectTasks) ? d!.projectTasks : [],
        };
      },
      providesTags: (_result, _error, attendanceId) => [
        { type: "Attendance", id: `tasks-${attendanceId}` },
      ],
    }),

    regularizeAttendance: builder.mutation<
      RegularizeAttendanceMutationResponse,
      { employeeId: number; body: RegularizeAttendanceDto }
    >({
      query: ({ employeeId, body }) => ({
        url: `/attendance/regularize/${employeeId}`,
        method: "POST",
        body,
      }),
      /** Refetch calendar/check-in only after success — see RegulariseModal (avoids refetch on error). */
      invalidatesTags: [],
    }),
  }),
});

export const {
  useGetAllAttendanceQuery,
  useGetLeaveStatsQuery,
  useCheckAttendanceQuery,
  useLazyCheckAttendanceQuery,
  useGetAttendanceAssignedProjectsQuery,
  useGetAttendanceTasksQuery,
  useApplyLeaveMutation,
  useCreateCompOffCreditMutation,
  useRegularizeAttendanceMutation,
} = attendanceApi;
