import { baseApi } from "./base.api"; // adjust path if your base api file is elsewhere

// Define the response type - matches actual API response
// API returns: { success: true, statusCode: 200, data: ["view_business_settings", ...] }
export type UserPermission = string;

export interface PermissionsApiResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: any;
}

// Extend the base API slice
export const permissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET user permissions
    getUserPermissions: builder.query<PermissionsApiResponse, void>({
      query: () => ({
        url: "rba/user_permissions",
        method: "GET",
      }),
      providesTags: ["Permissions"], // optional — useful for cache invalidation
    }),
  }),
  overrideExisting: false,
});

// Export the auto-generated hook
export const { useGetUserPermissionsQuery,useLazyGetUserPermissionsQuery } = permissionApi;
