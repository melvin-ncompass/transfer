import { baseApi } from "../../../../../api/base.api";
import { buildTimesheetQueryString } from "../utils/timesheet.utils";
import type {
  AttendanceGroupedTasksData,
  AttendanceTasksActionArgs,
  TimesheetDateRangeParams,
  TimesheetEmployeeGroup,
  TimesheetEmployeeQueryArgs,
  TimesheetProjectQueryArgs,
} from "../types/timesheet.types";

const parseGroupedTasks = (response: unknown): AttendanceGroupedTasksData => {
  const data = (response as { data?: AttendanceGroupedTasksData })?.data;
  return {
    groupedByEmployee: data?.groupedByEmployee ?? {},
    groupedByDate: data?.groupedByDate ?? {},
  };
};

const dateRangeParams = (start: string, end: string) =>
  start && end ? { fromDate: start, toDate: end } : undefined;

export const timesheetApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPendingAttendanceTasks: builder.query<
      AttendanceGroupedTasksData,
      TimesheetDateRangeParams | void
    >({
      query: (args) => ({
        url: "/attendance/pending_tasks",
        params: args ? dateRangeParams(args.start, args.end) : undefined,
      }),
      transformResponse: parseGroupedTasks,
      providesTags: ["Timesheet"],
    }),

    getVerificationPendingTasks: builder.query<
      AttendanceGroupedTasksData,
      TimesheetDateRangeParams | void
    >({
      query: (args) => ({
        url: "/attendance/verification_pending",
        params: args ? dateRangeParams(args.start, args.end) : undefined,
      }),
      transformResponse: parseGroupedTasks,
      providesTags: ["Timesheet"],
    }),

    getVerifiedAttendanceTasks: builder.query<
      AttendanceGroupedTasksData,
      TimesheetDateRangeParams | void
    >({
      query: (args) => ({
        url: "/attendance/verified",
        params: args ? dateRangeParams(args.start, args.end) : undefined,
      }),
      transformResponse: parseGroupedTasks,
      providesTags: ["Timesheet"],
    }),

    approveAttendanceTasks: builder.mutation<unknown, AttendanceTasksActionArgs>({
      query: (body) => ({
        url: "/attendance/tasks/approve",
        method: "POST",
        body: { attendanceIds: body.attendanceIds },
      }),
      invalidatesTags: ["Timesheet", "Attendance"],
    }),

    requestAttendanceTaskChanges: builder.mutation<
      unknown,
      AttendanceTasksActionArgs
    >({
      query: (body) => ({
        url: "/attendance/tasks/request_changes",
        method: "POST",
        body: {
          attendanceIds: body.attendanceIds,
          reason: body.reason ?? "",
        },
      }),
      invalidatesTags: ["Timesheet", "Attendance"],
    }),

    /** Project-scoped timesheet grid — GET /timesheet/project/:id */
    getProjectTimesheets: builder.query<
      TimesheetEmployeeGroup[],
      TimesheetProjectQueryArgs
    >({
      query: ({ projectId, start, end, ...filters }) => ({
        url: `/timesheet/project/${projectId}?${buildTimesheetQueryString(start, end, filters)}`,
        method: "GET",
      }),
      transformResponse: (response: { data?: TimesheetEmployeeGroup[] }) =>
        response?.data ?? [],
      providesTags: ["Timesheet"],
    }),

    /** Org-wide timesheet — GET /timesheet/employee */
    getEmployeeTimesheets: builder.query<
      TimesheetEmployeeGroup[],
      TimesheetEmployeeQueryArgs
    >({
      query: ({ start, end, ...filters }) => ({
        url: `/timesheet/employee?${buildTimesheetQueryString(start, end, filters)}`,
        method: "GET",
      }),
      transformResponse: (response: { data?: TimesheetEmployeeGroup[] }) =>
        response?.data ?? [],
      providesTags: ["Timesheet"],
    }),
  }),
});

export const {
  useGetPendingAttendanceTasksQuery,
  useGetVerificationPendingTasksQuery,
  useGetVerifiedAttendanceTasksQuery,
  useApproveAttendanceTasksMutation,
  useRequestAttendanceTaskChangesMutation,
  useGetProjectTimesheetsQuery,
  useGetEmployeeTimesheetsQuery,
} = timesheetApi;
