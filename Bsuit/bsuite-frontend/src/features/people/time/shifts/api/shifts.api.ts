import { baseApi } from "../../../../../api/base.api";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface IEmployeeShiftVersion {
  id: number;
  shift: {
    id: number;
    shiftName: string;
    isDefault: boolean;
    shiftVersions: IShiftVersion[];
    createdAt: string;
    updatedAt: string;
  };
  effectiveFromDate: string;
  effectiveToDate: string | null;
  hasEndDate: boolean;
  assignedBy: number;
  assignedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface IEmployeeShiftVersionsResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: IEmployeeShiftVersion[];
}

export interface IShift {
  id: number;
  shiftName: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  shiftVersions?: IShiftVersion[];
}

export interface IShiftVersion {
  id: number;
  shiftType: "fixed" | "flexible" | string;
  shiftVersionName: string;
  workingDays: string[];
  shiftFromTime?: string; // HH:mm:ss format, only for FIXED
  shiftToTime?: string; // HH:mm:ss format, only for FIXED
  grossHours?: number; // only for FLEXIBLE
  breakDuration: number; // in minutes
  effectiveFromDate: string; // yyyy-mm-dd
  updatedBy: number;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ICreateFixedShiftRequest {
  shiftName: string;
  shiftType: "fixed";
  workingDays: string[];
  shiftFromTime: string; // HH:mm format
  shiftToTime: string; // HH:mm format
  breakDuration: number;
}

export interface ICreateFlexibleShiftRequest {
  shiftName: string;
  shiftType: "flexible";
  workingDays: string[];
  grossHours: number;
  breakDuration: number;
}

export type ICreateShiftRequest = ICreateFixedShiftRequest | ICreateFlexibleShiftRequest;

export interface ICreateFixedShiftVersionRequest {
  shiftVersionName: string;
  shiftType: "fixed";
  workingDays: string[];
  shiftFromTime: string; // HH:mm format
  shiftToTime: string; // HH:mm format
  breakDuration: number;
  effectiveFromDate: string; // yyyy-mm-dd
  /** When set, backend upserts this version */
  shiftVersionId?: number;
}

export interface ICreateFlexibleShiftVersionRequest {
  shiftVersionName: string;
  shiftType: "flexible";
  workingDays: string[];
  grossHours: number;
  breakDuration: number;
  effectiveFromDate: string; // yyyy-mm-dd
  /** When set, backend upserts this version */
  shiftVersionId?: number;
}

export type ICreateShiftVersionRequest =
  | ICreateFixedShiftVersionRequest
  | ICreateFlexibleShiftVersionRequest;

export interface IUpdateShiftRequest {
  shiftName?: string;
  isDefault?: boolean;
}

export interface IShiftResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: IShift | IShift[];
}

export interface IShiftVersionResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: IShiftVersion;
}

export interface ICreateShiftResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: {
    id: number;
    shiftName: string;
  };
}

export interface IUpdateShiftResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: {
    shiftId: number;
    shiftName: string;
  };
}

export interface ICreateShiftVersionResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: {
    shiftVersionId: number;
    shiftVersionName: string;
  };
}

// ============================================
// API ENDPOINTS
// ============================================

export const shiftsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /shifts - Fetch all shifts with versions
    getShifts: builder.query<IShift[], void>({
      query: () => ({
        url: "/shifts",
        method: "GET",
      }),
      providesTags: ["Shift"],
      transformResponse: (response: IShiftResponse) => {
        return Array.isArray(response.data) ? response.data : [response.data];
      },
    }),

    // POST /shifts - Create a new shift with default version
    createShift: builder.mutation<ICreateShiftResponse, ICreateShiftRequest>({
      query: (data) => ({
        url: "/shifts",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Shift"],
    }),

    // GET /shifts/version/:shiftVersionId - Fetch a single shift version
    getShiftVersion: builder.query<IShiftVersion, number>({
      query: (shiftVersionId) => ({
        url: `/shifts/version/${shiftVersionId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Shift", id: `version-${id}` }],
      transformResponse: (response: IShiftVersionResponse) => response.data,
    }),

    // PATCH /shifts/:id - Update shift master info (name, default)
    updateShift: builder.mutation<IUpdateShiftResponse, { id: number; data: IUpdateShiftRequest }>({
      query: ({ id, data }) => ({
        url: `/shifts/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Shift"],
    }),

    // DELETE /shifts/:id - Delete shift master
    deleteShift: builder.mutation<void, number>({
      query: (shiftId) => ({
        url: `/shifts/${shiftId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Shift"],
    }),

    // POST /shifts/shiftVersion/:shiftId - Create or update a shift version
    createShiftVersion: builder.mutation<
      ICreateShiftVersionResponse,
      { shiftId: number; data: ICreateShiftVersionRequest }
    >({
      query: ({ shiftId, data }) => ({
        url: `/shifts/shiftVersion/${shiftId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Shift"],
    }),

    // DELETE /shifts/shiftVersion/:shiftVersionId - Delete a future shift version
    deleteShiftVersion: builder.mutation<void, number>({
      query: (shiftVersionId) => ({
        url: `/shifts/shiftVersion/${shiftVersionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Shift"],
    }),
    getShiftEmployees: builder.query<any, string | number>({
      query: (id) => ({
        url: `/shifts/employee/${id}`,
        method: "GET",
      }),
      providesTags: ["Shift"],
    }),

    // GET /shifts/employeeShiftVersions/:employeeId - Fetch shift assignment history for an employee
    getEmployeeShiftVersions: builder.query<IEmployeeShiftVersion[], string | number>({
      query: (employeeId) => ({
        url: `/shifts/employeeShiftVersions/${employeeId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Shift", id: `employee-versions-${id}` }],
      transformResponse: (response: IEmployeeShiftVersionsResponse) =>
        Array.isArray(response.data) ? response.data : [],
    }),

    // POST /shifts/employeeShiftVersions/:employeeId - Assign a shift to an employee
    assignEmployeeShift: builder.mutation<
      { success: boolean; message: string },
      { employeeId: string | number; shiftId: number; effectiveFromDate: string }
    >({
      query: ({ employeeId, shiftId, effectiveFromDate }) => ({
        url: `/shifts/employeeShiftVersions/${employeeId}`,
        method: "POST",
        body: { shiftId, effectiveFromDate },
      }),
      invalidatesTags: (_result, _error, { employeeId }) => [
        { type: "Shift", id: `employee-versions-${employeeId}` },
      ],
    }),

    // DELETE /shifts/employeeShiftVersions/:shiftVersionId - Delete a shift assignment record
    deleteEmployeeShiftVersion: builder.mutation<
      { success: boolean; message: string },
      { shiftVersionId: number; employeeId: string | number }
    >({
      query: ({ shiftVersionId }) => ({
        url: `/shifts/employeeShiftVersions/${shiftVersionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { employeeId }) => [
        { type: "Shift", id: `employee-versions-${employeeId}` },
      ],
    }),
  }),
});

// ============================================
// EXPORT HOOKS
// ============================================

export const {
  useGetShiftsQuery,
  useCreateShiftMutation,
  useGetShiftVersionQuery,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useCreateShiftVersionMutation,
  useDeleteShiftVersionMutation,
  useGetShiftEmployeesQuery,
  useGetEmployeeShiftVersionsQuery,
  useAssignEmployeeShiftMutation,
  useDeleteEmployeeShiftVersionMutation,
} = shiftsApi;
