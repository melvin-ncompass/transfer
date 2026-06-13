import { baseApi } from "../../../../../../api/base.api";

// API Endpoints
const ACCOUNT_IMPORT = {
  GET_DEMO_CSV: "/account/demo_csv",
  VALIDATE_CSV: "/account/validate_csv",
  BULK_CREATE: "/account/bulk_create",
  UPDATE_DUPLICATES: "/account/update_duplicates",
};

// ---------------- Contact API ----------------
export const accountsImport = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // LOGOUT

    getDemoCSVforAccounts: builder.mutation<any, void>({
      query: () => ({
        url: ACCOUNT_IMPORT.GET_DEMO_CSV,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
      invalidatesTags: ["Account"],
    }),
    validateCsvforAccounts: builder.mutation<any, FormData>({
      query: (body) => ({
        url: ACCOUNT_IMPORT.VALIDATE_CSV,
        method: "POST",
        body,
        // Note: do NOT set Content-Type header; browser will set multipart boundary
        // headers: withAuthHeader(),
      }),
      invalidatesTags: ["Account"],
    }),
    bulkCreateAccounts: builder.mutation<any, any>({
      query: (body) => ({
        url: ACCOUNT_IMPORT.BULK_CREATE,
        method: "POST",
        body,
        // headers: withAuthHeader(),
      }),
      invalidatesTags: ["Account"],
    }),
    updateDuplicatesAccounts: builder.mutation<any, any>({
      query: (body) => ({
        url: ACCOUNT_IMPORT.UPDATE_DUPLICATES,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Account"],
    }),
  }),
});

export const {
  useGetDemoCSVforAccountsMutation,
  useValidateCsvforAccountsMutation,
  useBulkCreateAccountsMutation,
  useUpdateDuplicatesAccountsMutation,
  //   useChangeDisplayNameMutation,
  //   useDeleteSessionMutation,
  //   useLogoutOfAllSessionsMutation,
  //   useUploadProfilePicMutation,
  //   useRemoveProfilePicMutation,
} = accountsImport;
