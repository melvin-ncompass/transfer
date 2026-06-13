import { baseApi } from "../../../../../api/base.api";
import type { TimesheetEmployeeGroup } from "../../../projects-timesheets/timesheets/types/timesheet.types";

export interface ProjectTimesheetReportFilters {
  techStackId?: number | null;
  isBillable?: boolean | null;
}

export interface EmployeeTimesheetReportFilters {
  departmentId?: number[];
  assignedToProjects?: boolean;
  techStackId?: number[];
  projectId?: number[];
  employeeId?: number[];
}

type TimesheetReportDateRange = {
  start: string;
  end: string;
};

/**
 * Build query string for GET /timesheet/project/:id
 * Includes start, end, and optional filter params (techStackId, isBillable).
 * GET requests cannot carry a body — all params must be in the URL.
 */
function buildProjectTimesheetQueryString(
  start: string,
  end: string,
  filters: ProjectTimesheetReportFilters,
): string {
  const params = new URLSearchParams({ start, end });
  if (filters.techStackId !== undefined && filters.techStackId !== null) {
    params.set("techStackId", String(filters.techStackId));
  }
  if (filters.isBillable !== undefined && filters.isBillable !== null) {
    params.set("isBillable", String(filters.isBillable));
  }
  return params.toString();
}

/**
 * Build query string for GET /timesheet/employee
 * Includes start, end, and optional filter params.
 * techStackId and projectId are only included when assignedToProjects is true.
 * GET requests cannot carry a body — all params must be in the URL.
 */
function buildEmployeeTimesheetQueryString(
  start: string,
  end: string,
  filters: EmployeeTimesheetReportFilters,
): string {
  const params = new URLSearchParams({ start, end });

  if (filters.assignedToProjects !== undefined) {
    params.set("assignedToProjects", String(filters.assignedToProjects));
  }

  if (filters.departmentId && filters.departmentId.length > 0) {
    filters.departmentId.forEach((id) => params.append("departmentId", String(id)));
  }

  // employeeId always sent (empty array = all employees)
  if (filters.employeeId && filters.employeeId.length > 0) {
    filters.employeeId.forEach((id) => params.append("employeeId", String(id)));
  }

  // techStackId and projectId only when assignedToProjects is enabled
  if (filters.assignedToProjects) {
    if (filters.techStackId && filters.techStackId.length > 0) {
      filters.techStackId.forEach((id) => params.append("techStackId", String(id)));
    }
    if (filters.projectId && filters.projectId.length > 0) {
      filters.projectId.forEach((id) => params.append("projectId", String(id)));
    }
  }

  return params.toString();
}

/**
 * Build POST body for /timesheet/project/:id
 * Only includes non-null filter values.
 */
export function buildProjectTimesheetReportBody(
  filters: ProjectTimesheetReportFilters,
): ProjectTimesheetReportFilters {
  const body: ProjectTimesheetReportFilters = {};
  if (filters.techStackId !== undefined && filters.techStackId !== null) {
    body.techStackId = filters.techStackId;
  }
  if (filters.isBillable !== undefined && filters.isBillable !== null) {
    body.isBillable = filters.isBillable;
  }
  return body;
}

/**
 * Build POST body for /timesheet/employee
 * techStackId and projectId are only included when assignedToProjects is true.
 */
export function buildEmployeeTimesheetReportBody(
  filters: EmployeeTimesheetReportFilters,
): EmployeeTimesheetReportFilters {
  const body: EmployeeTimesheetReportFilters = {
    employeeId: filters.employeeId ?? [],
  };

  if (filters.assignedToProjects !== undefined) {
    body.assignedToProjects = filters.assignedToProjects;
  }

  if (filters.departmentId && filters.departmentId.length > 0) {
    body.departmentId = filters.departmentId;
  }

  // Send techStackId and projectId only when assignedToProjects is enabled
  if (filters.assignedToProjects) {
    if (filters.techStackId && filters.techStackId.length > 0) {
      body.techStackId = filters.techStackId;
    }
    if (filters.projectId && filters.projectId.length > 0) {
      body.projectId = filters.projectId;
    }
  }

  return body;
}

export const projectsTimesheetsReportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /timesheet/project/:id?start=YYYY-MM-DD&end=YYYY-MM-DD&techStackId=1&isBillable=true
     * Filters are sent as query params (GET cannot have a body).
     */
    getProjectTimesheetReport: builder.query<
      { data: TimesheetEmployeeGroup[] },
      TimesheetReportDateRange & { projectId: number } & ProjectTimesheetReportFilters
    >({
      query: ({ projectId, start, end, ...filters }) => ({
        url: `/timesheet/project/${projectId}?${buildProjectTimesheetQueryString(start, end, filters)}`,
        method: "GET",
      }),
      providesTags: ["Timesheet"],
    }),

    /**
     * GET /timesheet/employee?start=YYYY-MM-DD&end=YYYY-MM-DD&departmentId=1&assignedToProjects=true&...
     * Filters are sent as query params (GET cannot have a body).
     * techStackId and projectId are only appended when assignedToProjects is true.
     */
    getEmployeeTimesheetReport: builder.query<
      { data: TimesheetEmployeeGroup[] },
      TimesheetReportDateRange & EmployeeTimesheetReportFilters
    >({
      query: ({ start, end, ...filters }) => ({
        url: `/timesheet/employee?${buildEmployeeTimesheetQueryString(start, end, filters)}`,
        method: "GET",
      }),
      providesTags: ["Timesheet"],
    }),

    /**
     * POST /timesheet/project/:id?start=YYYY-MM-DD&end=YYYY-MM-DD
     * Filters are sent in the request body (POST supports body).
     */
    exportProjectTimesheetReport: builder.mutation<
      { blob: Blob; fileName: string },
      TimesheetReportDateRange & { projectId: number } & ProjectTimesheetReportFilters
    >({
      query: ({ projectId, start, end, ...filters }) => ({
        url: `/timesheet/project/${projectId}?${new URLSearchParams({ start, end }).toString()}`,
        method: "POST",
        body: buildProjectTimesheetReportBody(filters),
        responseHandler: async (response) => {
          const blob = await response.blob();
          const contentDisposition =
            response.headers.get("content-disposition") || "";
          const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          const fileName = fileNameMatch
            ? fileNameMatch[1]
            : `project-timesheet-report-${projectId}.xlsx`;
          return { blob, fileName };
        },
      }),
    }),

    /**
     * POST /timesheet/employee?start=YYYY-MM-DD&end=YYYY-MM-DD
     * Filters are sent in the request body (POST supports body).
     * techStackId and projectId are only included when assignedToProjects is true.
     */
    exportEmployeeTimesheetReport: builder.mutation<
      { blob: Blob; fileName: string },
      TimesheetReportDateRange & EmployeeTimesheetReportFilters
    >({
      query: ({ start, end, ...filters }) => ({
        url: `/timesheet/employee?${new URLSearchParams({ start, end }).toString()}`,
        method: "POST",
        body: buildEmployeeTimesheetReportBody(filters),
        responseHandler: async (response) => {
          const blob = await response.blob();
          const contentDisposition =
            response.headers.get("content-disposition") || "";
          const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          const fileName = fileNameMatch
            ? fileNameMatch[1]
            : "employee-timesheet-report.xlsx";
          return { blob, fileName };
        },
      }),
    }),
  }),
});

export const {
  useGetProjectTimesheetReportQuery,
  useGetEmployeeTimesheetReportQuery,
  useExportProjectTimesheetReportMutation,
  useExportEmployeeTimesheetReportMutation,
} = projectsTimesheetsReportApi;
