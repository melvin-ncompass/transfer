import { baseApi } from "../../../../../../api/base.api";

interface AccountData {
  id: number;
  accountName: string;
  accountCode?: string;
  accountType?: string;
  accountCurrency?: string;
  accountBalance?: string;
  notes?: string;
  isArchived?: boolean;
}

interface UncategorizedRow {
  id: number;
  account: AccountData;
  date: string;
  description: string;
  credit: number;
  debit: number;
  isCategorized?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface GetUncategorizedRowsParams {
  page?: number;
  pageSize?: number;
  accountId?: number[];
}

interface GetUncategorizedRowsResponse {
  data: UncategorizedRow[];
}

interface DeleteUncategorizedResponse {
  data: any;
  message: string;
}

interface UncategorizedCountResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: number;
}

export const uncategorizedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get Uncategorized Rows with Pagination
    getUncategorizedRows: builder.query<
      GetUncategorizedRowsResponse,
      GetUncategorizedRowsParams
    >({
      query: (args) => {
        const { page = 1, pageSize = 20, accountId } = args;

        const params: Record<string, any> = { page, pageSize };

        if (accountId && Array.isArray(accountId) && accountId.length > 0) {
          params.accountId = accountId.join(",");
        } else {
          console.log("accountId not added - value:", accountId);
        }

        return {
          url: "/uncategorized",
          method: "GET",
          params,
        };
      },
      providesTags: ["Uncategorized"],
    }),

    // Delete Uncategorized Rows
    deleteUncategorized: builder.mutation<
      DeleteUncategorizedResponse,
      number[]
    >({
      query: (uncatIdList) => ({
        url: "/uncategorized",
        method: "DELETE",
        body: uncatIdList,
      }),
      invalidatesTags: ["Uncategorized"],
    }),

    getUncategorizedCount: builder.query<
      UncategorizedCountResponse,
      string[] | undefined
    >({
      query: (accountId) => {
        let queryString = "";
        if (accountId?.length) {
          queryString = `?accountId=${accountId.join(",")}`;
        }
        return `uncategorized/count${queryString}`;
      },
      providesTags: ["Uncategorized"],
      keepUnusedDataFor: 60,
    }),
  }),
});

export const {
  useGetUncategorizedRowsQuery,
  useDeleteUncategorizedMutation,
  useGetUncategorizedCountQuery,
} = uncategorizedApi;
