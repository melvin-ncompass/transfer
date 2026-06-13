import { baseApi } from "../../../api/base.api";

// =====================
// Types
// =====================

export interface EmployeeInfoData {
  isEmployee: boolean;
  isManager: boolean;
  isAdmin: boolean;
  employeeId: number | null;
  isEmployeePortalEnabled: boolean;
}

// =====================
// RTK Query API
// =====================

export type EmployeeInfo = {
  isEmployee: boolean;
  employeeId: number;
  isEmployeePortalEnabled: boolean;
};

export type EmployeeInfoResponse = {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: EmployeeInfo;
};

export const peopleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // User – Employee check (isEmployee, isManager, isAdmin, etc.)
    getEmployeeInfo: builder.query<{ data: EmployeeInfoData }, void>({
      query: () => ({
        url: `/employee/info`,
        method: "GET",
      }),
      transformResponse: (response: unknown): { data: EmployeeInfoData } => {
        if (!response || typeof response !== "object" || !("data" in response)) {
          throw new Error("Invalid employee info response");
        }
        const { data } = response as { data?: unknown };
        if (!data || typeof data !== "object") {
          throw new Error("Missing employee info payload");
        }
        const d = data as Record<string, unknown>;
        if (
          typeof d.isEmployee !== "boolean" ||
          typeof d.isManager !== "boolean" ||
          typeof d.isAdmin !== "boolean" ||
          typeof d.isEmployeePortalEnabled !== "boolean"
        ) {
          throw new Error("Incomplete employee info payload");
        }
        if (
          d.employeeId !== null &&
          typeof d.employeeId !== "number"
        ) {
          throw new Error("Invalid employee id in info payload");
        }
        return { data: data as EmployeeInfoData };
      },
      providesTags: ["People", "Header"],
    }),
  }),
});

// =====================
// Export Hooks
// =====================

export const { useGetEmployeeInfoQuery, useLazyGetEmployeeInfoQuery } = peopleApi;
