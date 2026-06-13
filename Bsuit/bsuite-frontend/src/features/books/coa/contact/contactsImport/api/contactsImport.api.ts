import { baseApi } from "../../../../../../api/base.api";

// API Endpoints
const CONTACT_IMPORT = {
  GET_DEMO_CSV: "/contact/demo_csv",
  VALIDATE_CSV: "/contact/validate_csv",
  BULK_CREATE: "/contact/bulk_create",
  UPDATE_DUPLICATES: "/contact/update_duplicates",
};

// ---------------- Contact API ----------------
export const contactsImport = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // LOGOUT

    getDemoCSV: builder.mutation<any, void>({
      query: () => ({
        url: CONTACT_IMPORT.GET_DEMO_CSV,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
      invalidatesTags: ["Contact"],
    }),
    validateCsv: builder.mutation<any, FormData>({
      query: (body) => ({
        url: CONTACT_IMPORT.VALIDATE_CSV,
        method: "POST",
        body,
        // Note: do NOT set Content-Type header; browser will set multipart boundary
        // headers: withAuthHeader(),
      }),
      invalidatesTags: ["Contact"],
    }),
    bulkCreate: builder.mutation<any, any>({
      query: (body) => ({
        url: CONTACT_IMPORT.BULK_CREATE,
        method: "POST",
        body,
        // headers: withAuthHeader(),
      }),
      invalidatesTags: ["Contact"],
    }),
    updateDuplicates: builder.mutation<any, any>({
      query: (body) => ({
        url: CONTACT_IMPORT.UPDATE_DUPLICATES,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Contact"],
    }),
  }),
});

export const {
  useGetDemoCSVMutation,
  useValidateCsvMutation,
  useBulkCreateMutation,
  useUpdateDuplicatesMutation,
  //   useChangeDisplayNameMutation,
  //   useDeleteSessionMutation,
  //   useLogoutOfAllSessionsMutation,
  //   useUploadProfilePicMutation,
  //   useRemoveProfilePicMutation,
} = contactsImport;
