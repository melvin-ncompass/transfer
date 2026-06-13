import { baseApi } from "../../../../../api/base.api";

export const accountsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    //Get Count Info
    getCountInfo: builder.query<any, void>({
      query: () => ({
        url: "/account/get_zero_balance_status",
        method: "GET",
      }),
    }),
    // Get all accounts (optional accountType filter)
    getAccounts: builder.query<any, { type?: string; unArchivedOnly?: boolean }>({
      query: ({ type, unArchivedOnly } = {}) => {
        const params = new URLSearchParams();
        if (type) params.append("accountType", type);
        if (unArchivedOnly !== undefined) params.append("unArchivedOnly", String(unArchivedOnly));
        const queryString = params.toString();
        return `/account${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Account", "Group"],
    }),

    getAccCount: builder.query({
      query: () => ({
        url: "/account/count",
        method: "GET",
      }),
      providesTags: ["Account", "Tax", "Contact"],
    }),
    // Get single account by ID
    // getAccountById: builder.query({
    //   query: (id) => `/account/${id}`,
    //   providesTags: (result, error, id) => [{ type: "Account", id }],
    // }),

    // Add new account
    addAccount: builder.mutation({
      query: (newAccount) => ({
        url: `/account`,
        method: "POST",
        body: newAccount,
      }),
      invalidatesTags: ["Account"],
    }),

    // Update existing account
    updateAccount: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/account/${id}`,
        method: "PATCH",
        body: updateData,
      }),
      invalidatesTags: ["Account"],
    }),

    // Delete account
    deleteAccount: builder.mutation({
      query: (id) => ({
        url: `/account/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Account"],
    }),
    archiveAccount: builder.mutation({
      query: (id) => ({
        url: `/account/${id}/archive`,
        method: "PATCH",
      }),
      invalidatesTags: ["Account"],
    }),
    toggleReport: builder.mutation({
      query: (id) => ({
        url: `/account/${id}/toggle_report`,
        method: "PATCH",
      }),
      invalidatesTags: ["Account", "Insights"],
    }),
    toggle: builder.mutation<
      any,
      {
        reportZeroBalance?: boolean;
        accountZeroBalance?: boolean;
        reportDecimalPlace?: boolean;
      }
    >({
      query: (body) => ({
        url: `/account/toggle`,
        method: "PATCH",
        body, // only includes the fields provided
      }),
      invalidatesTags: ["Account"],
    }),
    exportAccount: builder.mutation<
      { blob: Blob; fileName: string },
      { includeGroup: boolean }
    >({
      query: ({ includeGroup }) => ({
        url: "/account/export",
        method: "POST",
        params: { includeGroup },
        // Return the full response so we can extract headers
        responseHandler: async (response) => {
          const blob = await response.blob();
          console.log(response);
          // Extract filename from Content-Disposition
          const contentDisposition =
            response.headers.get("content-disposition") || "";
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          const fileName = fileNameMatch ? fileNameMatch[1] : "download.xlsx";

          return { blob, fileName };
        },
      }),
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useGetAccCountQuery,
  useAddAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useArchiveAccountMutation,
  useToggleReportMutation,
  useToggleMutation,
  useExportAccountMutation,
  useGetCountInfoQuery
} = accountsApi;
