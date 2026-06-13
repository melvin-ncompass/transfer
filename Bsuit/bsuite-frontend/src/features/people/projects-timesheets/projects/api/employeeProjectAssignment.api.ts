import { baseApi } from "../../../../../api/base.api";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProjectEmployeeItem {
  assignmentId: number;
  startDate: string;
  endDate: string | null;
  isBillable: boolean;
  isArchived: boolean;
  employee: {
    id: number;
    name: string;
    middleName?: string;
    lastName?: string;
    email: string;
    phoneNumber?: string;
    profileImage?: string;
    empId: string;
  };
  techStack: { id: number; techStackName: string } | null;
  tag: { id: number; tagName: string } | null;
}

export interface ProjectEmployeesResponse {
  totalRecords: number;
  employees: ProjectEmployeeItem[];
}

export interface AssignmentHistoryRow {
  id: number;
  startDate: string;
  endDate: string | null;
  isBillable: boolean;
  techStack: string;
  tag: string;
}

export interface AssignmentBody {
  employeeId: number;
  isBillable: boolean;
  startDate: string;
  techStackId: number;
  tagId?: number;
}

export interface CreateAssignmentsParams {
  projectId: number;
  assignments: AssignmentBody[];
}

// ── API ──────────────────────────────────────────────────────────────────────

export const employeeProjectAssignmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjectEmployees: builder.query<
      ProjectEmployeesResponse,
      { projectId: number; isBasedOnTodayDate?: boolean }
    >({
      query: ({ projectId, isBasedOnTodayDate }) => ({
        url: "/employee_project_assignment/employees",
        params:
          isBasedOnTodayDate === undefined
            ? { projectId }
            : { projectId, basedOnTodayDate: isBasedOnTodayDate },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: (_result, _error, { projectId }) => [
        { type: "ProjectAssignment", id: projectId },
      ],
    }),

    getAssignmentHistory: builder.query<
      AssignmentHistoryRow[],
      { employeeId: number; projectId: number }
    >({
      query: ({ employeeId, projectId }) =>
        `/employee_project_assignment/assignment?employeeId=${employeeId}&projectId=${projectId}`,
      transformResponse: (response: any) => response.data,
      providesTags: (_result, _error, { employeeId, projectId }) => [
        { type: "AssignmentHistory", id: `${employeeId}-${projectId}` },
      ],
    }),

    createAssignments: builder.mutation<void, CreateAssignmentsParams>({
      query: (body) => ({
        url: "/employee_project_assignment",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId, assignments }) => [
        { type: "ProjectAssignment", id: projectId },
        ...assignments.map((assignment) => ({
          type: "AssignmentHistory",
          id: `${assignment.employeeId}-${projectId}`
        }))
      ],
    }),

    archiveEmployeeFromProject: builder.mutation<
      void,
      { employeeId: number; projectId: number; endDate: string }
    >({
      query: ({ employeeId, projectId, endDate }) => ({
        url: `/employee_project_assignment/archive?employeeId=${employeeId}&projectId=${projectId}`,
        method: "PATCH",
        body: { endDate },
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "ProjectAssignment", id: projectId },
      ],
    }),

    unarchiveEmployeeFromProject: builder.mutation<
      void,
      { employeeId: number; projectId: number }
    >({
      query: ({ employeeId, projectId }) => ({
        url: `/employee_project_assignment/unarchive?employeeId=${employeeId}&projectId=${projectId}`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "ProjectAssignment", id: projectId },
      ],
    }),

    deleteAssignmentRecord: builder.mutation<void, {id: number, empId: number, projectId: number}>({
      query: ({ id }) => ({
        url: `/employee_project_assignment/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, { empId, projectId})=>[
        { type: "ProjectAssignment", id: projectId },
        { type: "AssignmentHistory", id: `${empId}-${projectId}` }
      ]
    }),
  }),
});

export const {
  useGetProjectEmployeesQuery,
  useGetAssignmentHistoryQuery,
  useCreateAssignmentsMutation,
  useArchiveEmployeeFromProjectMutation,
  useUnarchiveEmployeeFromProjectMutation,
  useDeleteAssignmentRecordMutation,
} = employeeProjectAssignmentApi;
