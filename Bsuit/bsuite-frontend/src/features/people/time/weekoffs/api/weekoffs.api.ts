
// =====================
// Interfaces
// =====================

import { baseApi } from "../../../../../api/base.api";

// Week Off Version
export interface WeekOffVersion {
  id: number;
  weekOffVersionName: string;
  weekOffDays: string[];
  effectiveFromDate: string;
  /** When true, this version is the current policy (summary / track versions use it). */
  isActive?: boolean;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  updatedByName?: string;
}

// Week Off
export interface WeekOff {
  id: number;
  weekOffName: string;
  isDefault: boolean;
  weekOffVersions?: WeekOffVersion[];
  createdAt: string;
  updatedAt: string;
}

// API Responses
export interface WeekOffsResponse {
  data: WeekOff[];
  message: string;
  success: boolean;
  statusCode: number;
}

export interface WeekOffVersionResponse {
  data: WeekOffVersion;
  message: string;
  success: boolean;
  statusCode: number;
}

export interface CreatedWeekOffResponse {
  data: {
    id: number;
    weekOffName: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
  success: boolean;
  statusCode: number;
}

export interface WeekOffRequest {
  weekOffName: string;
  weekOffDays: string[];
}

export interface WeekOffVersionRequest {
  weekOffVersionName: string;
  weekOffDays: string[];
  effectiveFromDate: string;
}

export interface UpdateWeekOffRequest {
  weekOffName: string;
  isDefault: boolean;
}

// =====================
// RTK Query API
// =====================

export const weekOffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all week offs
    getAllWeekOffs: builder.query<WeekOffsResponse, void>({
      query: () => ({
        url: `/weekOffs`,
        method: "GET",
      }),
      providesTags: ["WeekOff"],
    }),

    // Create a new week off
    createWeekOff: builder.mutation<CreatedWeekOffResponse, WeekOffRequest>({
      query: (data) => ({
        url: `/weekOffs`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["WeekOff"],
    }),

    // Update a week off
    updateWeekOff: builder.mutation<any, { id: string; data: UpdateWeekOffRequest }>({
      query: ({ id, data }) => ({
        url: `/weekOffs/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["WeekOff"],
    }),

    // Create a week off version
    createWeekOffVersion: builder.mutation<
      WeekOffVersionResponse,
      { id: string; data: WeekOffVersionRequest }
    >({
      query: ({ id, data }) => ({
        url: `/weekOffs/version/${id}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["WeekOff"],
    }),

    // Get a week off version by id
    getWeekOffVersionById: builder.query<WeekOffVersionResponse, string>({
      query: (id) => ({
        url: `/weekOffs/version/${id}`,
        method: "GET",
      }),
      providesTags: ["WeekOff"],
    }),

    // Delete a week off version
    deleteWeekOffVersion: builder.mutation<any, string>({
      query: (id) => ({
        url: `/weekOffs/version/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WeekOff"],
    }),

    //Delete a week off
    deleteWeekOff: builder.mutation<any, string>({
      query: (id) => ({
        url: `/weekOffs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WeekOff"],
    }),

    // Get employees for a week off
    getWeekOffEmployees: builder.query<any, string | number>({
      query: (id) => ({
        url: `/weekOffs/employee/${id}`,
        method: "GET",
      }),
      providesTags: ["WeekOff"],
    }),
  }),
});

// =====================
// Export Hooks
// =====================

export const {
  useGetAllWeekOffsQuery,
  useCreateWeekOffMutation,
  useUpdateWeekOffMutation,
  useCreateWeekOffVersionMutation,
  useGetWeekOffVersionByIdQuery,
  useDeleteWeekOffVersionMutation,
  useGetWeekOffEmployeesQuery,
  useDeleteWeekOffMutation,
} = weekOffApi;
