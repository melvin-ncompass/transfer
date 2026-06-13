import { baseApi } from "../../../../../../../api/base.api";

// API Endpoints
const ACCOUNT_IMPORT = {
  GET_DEMO_CSV: "/uncategorized/demo_csv",
  EXTRACT_COLUMNS: "/uncategorized/extract_columns",
  PROCESS_CSV: "/uncategorized/process_csv",
  BULK_CREATE: "/uncategorized/bulk-create",
};

// ---------------- Contact API ----------------
export const accountsImport = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // LOGOUT

    getDemoCsvForStatements: builder.mutation<any, void>({
      query: () => ({
        url: ACCOUNT_IMPORT.GET_DEMO_CSV,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
      invalidatesTags: ["Account"],
    }),
    extractColumns: builder.mutation<any, FormData>({
      query: (body) => ({
        url: ACCOUNT_IMPORT.EXTRACT_COLUMNS,
        method: "POST",
        body,
        // Note: do NOT set Content-Type header; browser will set multipart boundary
        // headers: withAuthHeader(),
      }),
      invalidatesTags: ["Account"],
    }),
    bulkCreateStatements: builder.mutation({
      query: ({ id, data }) => ({
        url: `/uncategorized/bulk-create/${id}`,
        method: "POST",
        body: data,
        // headers: withAuthHeader(),
      }),
      invalidatesTags: ["Account", "Uncategorized"],
    }),

    processCsv: builder.mutation<any, any>({
      query: (body) => ({
        url: ACCOUNT_IMPORT.PROCESS_CSV,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Account"],
    }),
  }),
});

export const {
  useGetDemoCsvForStatementsMutation,
  useExtractColumnsMutation,
  useBulkCreateStatementsMutation,
  useProcessCsvMutation,
  //   useChangeDisplayNameMutation,
  //   useDeleteSessionMutation,
  //   useLogoutOfAllSessionsMutation,
  //   useUploadProfilePicMutation,
  //   useRemoveProfilePicMutation,
} = accountsImport;
