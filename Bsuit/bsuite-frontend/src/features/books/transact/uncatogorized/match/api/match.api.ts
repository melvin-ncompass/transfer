import { baseApi } from "../../../../../../api/base.api";

interface MatchRequest {
  amount: string;
  amountType: "credit" | "debit";
  uncategorizedId: number;
}

interface MatchResponse {
  data: {
    relevantMatches: any[];
    otherMatches: any[];
    aiMatches: any[];
    accountCurrency: string;
    uncategorizedData: any;
  };
  message: string;
}

interface UncategorizedDataItem {
  convertedAmount: string;
  amountInAccCurr: string;
  fxRate: number;
  originalFxRate: number;
  uncategorizedId: number;
}

interface SaveUncategorizedMultiMatchRequest {
  transactionTypeId: number | string;
  amountType: "credit" | "debit";
  uncategorizedData: UncategorizedDataItem[];
}

interface JournalMatchRequest {
  amount: string;
  amountType: "credit" | "debit";
  uncategorizedId: number;
}

interface JournalMatchResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    accountCurrency: string;
    uncategorizedData: any;
    journalMatches: Array<{
      date: string;
      description: string;
      transactionTypeId: string;
      transactionTypeName: string;
      fromAccounts: Array<{ name: string; type: string }>;
      toAccounts: Array<{ name: string; type: string }>;
    }>;
  };
}

interface SaveJournalMatchRequest {
  uncatId: number | string;
  transactionTypeId: string;
  transactionTypeName: string;
}

export const matchApi = baseApi.injectEndpoints({
  endpoints: (builder) => {
    return {
      getUncategorizedMatch: builder.query<MatchResponse, MatchRequest>({
        query: ({ amount, amountType, uncategorizedId }) => ({
          url: "uncategorized/uncategorized_match",
          method: "GET",
          params: { amount, amountType, uncategorizedId },
        }),
      }),

      saveUncategorizedMatch: builder.mutation<any, { uncategorizedId: any; splitData: any; description?: string | undefined }>({
        query: ({ uncategorizedId, splitData, description }) => {
          const splitArray = Object.values(splitData);
          return {
            url: `/uncategorized/save_uncategorized_match?uncatId=${uncategorizedId}`,
            method: "POST",
            body: { splitData: splitArray, description: description },
          };
        },
        invalidatesTags: ["Uncategorized", "AttachmentsTransact", "AttachmentsTransactCount"],
      }),

      getMultiMatch: builder.mutation<any, { data: any }>({
        query: ({ data }) => ({
          url: `/uncategorized/uncategorized_multi_match`,
          method: "POST",
          body: data,
        }),
        invalidatesTags: ["Uncategorized", "AttachmentsTransact", "AttachmentsTransactCount"],
      }),

      saveUncategorizedMultiMatch: builder.mutation<any, SaveUncategorizedMultiMatchRequest>({
        query: ({ transactionTypeId, amountType, uncategorizedData }) => ({
          url: `/uncategorized/save_uncategorized_multi_match?transactionTypeId=${transactionTypeId}&amountType=${amountType}`,
          method: "POST",
          body: { uncategorizedData },
        }),
        invalidatesTags: ["Uncategorized", "AttachmentsTransact", "AttachmentsTransactCount"],
      }),

      getJournalMatch: builder.query<JournalMatchResponse, JournalMatchRequest>({
        query: ({ amount, amountType, uncategorizedId }) => ({
          url: `/uncategorized/uncategorized_journal_match`,
          method: "GET",
          params: { amount, amountType, uncategorizedId },
        }),
      }),

      saveUncategorizedJournalMatch: builder.mutation<any, SaveJournalMatchRequest>({
        query: ({ uncatId, transactionTypeId, transactionTypeName }) => ({
          url: `/uncategorized/save_uncategorized_journal_match/`,
          method: "POST",
          params: { uncatId },
          body: { transactionTypeId, transactionTypeName },
        }),
        invalidatesTags: ["Uncategorized", "AttachmentsTransact", "AttachmentsTransactCount"],
      }),
    };
  },
});

export const {
  useGetUncategorizedMatchQuery,
  useSaveUncategorizedMatchMutation,
  useGetMultiMatchMutation,
  useSaveUncategorizedMultiMatchMutation,
  useGetJournalMatchQuery,
  useLazyGetJournalMatchQuery,
  useSaveUncategorizedJournalMatchMutation,
} = matchApi;