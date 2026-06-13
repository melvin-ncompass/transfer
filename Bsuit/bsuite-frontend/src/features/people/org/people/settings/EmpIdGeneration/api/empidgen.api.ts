import { baseApi } from "../../../../../../../api/base.api";
import type { EmployeeIdPrefixPayload, EmployeeIdPrefixResponse, EmployeeIdPrefixDeleteResponse } from "../types/empidgen.types";

const EMPLOYEE_ID_PREFIX_URL = "/series_config/";

// ---------- API Slice ----------
export const empIdGenApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // -----------------------------
    // Employee ID Prefix Endpoints
    // -----------------------------
    createEmployeeIdPrefix: builder.mutation<EmployeeIdPrefixResponse, EmployeeIdPrefixPayload>({
      query: (body) => ({
        url: EMPLOYEE_ID_PREFIX_URL,
        method: "POST",
        body,
      }),
      invalidatesTags: ["OrgEmployeeIdPrefix"],
    }),

    updateEmployeeIdPrefix: builder.mutation<EmployeeIdPrefixResponse, EmployeeIdPrefixPayload>({
      query: (body) => ({
        url: EMPLOYEE_ID_PREFIX_URL,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["OrgEmployeeIdPrefix"],
    }),

    getEmployeeIdPrefix: builder.query<EmployeeIdPrefixResponse, void>({
      query: () => ({
        url: EMPLOYEE_ID_PREFIX_URL,
        method: "GET",
      }),
      providesTags: ["OrgEmployeeIdPrefix"],
    }),

    deleteEmployeeIdPrefix: builder.mutation<EmployeeIdPrefixDeleteResponse, void>({
      query: () => ({
        url: EMPLOYEE_ID_PREFIX_URL,
        method: "DELETE",
      }),
      invalidatesTags: ["OrgEmployeeIdPrefix"],
    }),
  }),
});

// ---------- Export Hooks ----------
export const {
  useCreateEmployeeIdPrefixMutation,
  useUpdateEmployeeIdPrefixMutation,
  useGetEmployeeIdPrefixQuery,
  useDeleteEmployeeIdPrefixMutation,
} = empIdGenApi;
