import { baseApi } from "../../../../api/base.api";
import type { ContactBalanceSummaryDetailedResponse, ContactBalanceSummarySimpleResponse } from "../../coa/types/coa.types";

export const insightsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================================
    //  JOURNALS API ENDPOINTS
    // ============================================================================

    // Create Journal Entry
    getDashboard: builder.query<any, void>({
      query: () => ({
        url: `/account/get_report`,
        method: "GET",
      }),
      providesTags: ["Insights"],
    }),
    updateOrder: builder.mutation<any, any>({
      query: (data) => ({
        url: `/account/reposition_report`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Insights"],
    }),
    getProfitAndLoss: builder.query<
      any,
      {
        fromDate?: string;
        toDate?: string;
        isCustomize?: boolean;
        noOfMonthsOrYear?: number;
        compareWith?: "year" | "month";
      }
    >({
      query: ({
        fromDate,
        toDate,
        isCustomize,
        noOfMonthsOrYear,
        compareWith,
      }) => {
        const params: Record<string, any> = {};

        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;

        if (isCustomize === true) {
          params.isCustomize = true;
          params.noOfMonthsOrYear = noOfMonthsOrYear;
          params.compareWith = compareWith;
        }

        return {
          url: "/reports/profit_loss",
          method: "GET",
          params,
        };
      },

      providesTags: ["Insights"],
    }),
    exportProfitAndLoss: builder.query<
      any,
      {
        fromDate?: string;
        toDate?: string;
        isCustomize?: boolean;
        noOfMonthsOrYear?: number;
        compareWith?: "year" | "month";
        exportType?: string;
      }
    >({
      query: ({
        fromDate,
        toDate,
        isCustomize,
        noOfMonthsOrYear,
        compareWith,
        exportType,
      }) => {
        const params: Record<string, any> = {};

        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;

        if (isCustomize === true) {
          params.isCustomize = true;
          params.noOfMonthsOrYear = noOfMonthsOrYear;
          params.compareWith = compareWith;
        }
        if (exportType) params.exportType = exportType;
        return {
          url: "/reports/profit_loss/export",
          method: "GET",
          params,
        };
      },

      providesTags: ["Insights"],
    }),
    getBalanceSheet: builder.query<
      any,
      {
        toDate?: string;
        splitContact?: boolean;
      }
    >({
      query: ({ toDate, splitContact }) => {
        const params: Record<string, any> = {};

        if (toDate) {
          params.toDate = toDate;
        }

        params.splitContact = splitContact; // always send the boolean

        return {
          url: "/reports/balance_sheet",
          method: "GET",
          params,
        };
      },

      providesTags: ["Insights"],
    }),
    getTrialBalance: builder.query<
      any,
      {
        toDate?: string;
      }
    >({
      query: ({ toDate }) => {
        const params: Record<string, any> = {};

        if (toDate) params.toDate = toDate;

        return {
          url: "/reports/trial_balance",
          method: "GET",
          params,
        };
      },

      providesTags: ["Insights"],
    }),
    getTDSSummary: builder.query<
      any,
      {
        fromDate?: string;
        toDate?: string;
      }
    >({
      query: ({ toDate, fromDate }) => {
        const params: Record<string, any> = {};

        if (toDate) params.toDate = toDate;
        if (fromDate) params.fromDate = fromDate;

        return {
          url: "/reports/tds_summary",
          method: "GET",
          params,
        };
      },

      providesTags: ["Insights"],
    }),
    getTaxSummary: builder.query<
      any,
      {
        fromDate?: string;
        toDate?: string;
      }
    >({
      query: ({ toDate, fromDate }) => {
        const params: Record<string, any> = {};

        if (toDate) params.toDate = toDate;
        if (fromDate) params.fromDate = fromDate;

        return {
          url: "/reports/tax_summary",
          method: "GET",
          params,
        };
      },

      providesTags: ["Insights"],
    }),
    getDetailedTaxSummary: builder.query<
      any,
      {
        fromDate?: string;
        toDate?: string;
        taxPercent?: string;
        taxId?: number;
      }
    >({
      query: ({ toDate, fromDate, taxId, taxPercent }) => {
        const params: Record<string, any> = {};

        if (toDate) params.toDate = toDate;
        if (fromDate) params.fromDate = fromDate;
        if (taxId) params.taxId = taxId;
        if (taxPercent) params.taxPercent = taxPercent;
        return {
          url: "/reports/tax_detailed_summary",
          method: "GET",
          params,
        };
      },

      providesTags: ["Insights"],
    }),
    exportTDS: builder.query<
      any,
      {
        fromDate?: string;
        toDate?: string;
        exportType: string;
      }
    >({
      query: ({ toDate, fromDate, exportType }) => {
        const params: Record<string, any> = {};

        if (toDate) params.toDate = toDate;
        if (fromDate) params.fromDate = fromDate;
        params.exportType = exportType;

        return {
          url: "/reports/tds_summary/export",
          method: "GET",
          params,
        };
      },

      providesTags: ["Insights"],
    }),
    exportTaxSummary: builder.query<
      any,
      {
        fromDate?: string;
        toDate?: string;
        exportType: string;
      }
    >({
      query: ({ toDate, fromDate, exportType }) => {
        const params: Record<string, any> = {};

        if (toDate) params.toDate = toDate;
        if (fromDate) params.fromDate = fromDate;
        params.exportType = exportType;
        return {
          url: "/reports/tax_summary/export",
          method: "GET",
          params,
        };
      },

      providesTags: ["Insights"],
    }),
    exportBalanceSheet: builder.query<
      any,
      {
        toDate?: string;
        splitContact?: boolean;
        exportType: string;
      }
    >({
      query: ({ toDate, splitContact, exportType }) => {
        const params: Record<string, any> = {};

        if (toDate) {
          params.toDate = toDate;
        }

        params.splitContact = splitContact; // always send the boolean
        params.exportType = exportType;
        return {
          url: "/reports/balance_sheet/export",
          method: "GET",
          params,
        };
      },
    }),
    exportTrialBalance: builder.query<
      any,
      {
        toDate?: string;
        exportType: string;
      }
    >({
      query: ({ toDate, exportType }) => {
        const params: Record<string, any> = {};

        if (toDate) {
          params.toDate = toDate;
        }

        params.exportType = exportType;
        return {
          url: "/reports/trial_balance/export",
          method: "GET",
          params,
        };
      },
    }),
    getInvoiceSummary: builder.query<
      any,
      {
        fromDate?: string;
        toDate?: string;
        isCustomize?: boolean;
        noOfMonthsOrYear?: number;
        compareWith?: "year" | "month";
      }
    >({
      query: ({
        fromDate,
        toDate,
        isCustomize,
        noOfMonthsOrYear,
        compareWith,
      }) => {
        const params: Record<string, any> = {};

        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;

        if (isCustomize === true) {
          params.isCustomize = true;
          params.noOfMonthsOrYear = noOfMonthsOrYear;
          params.compareWith = compareWith;
        }

        return {
          url: "/reports/invoice_summary",
          method: "GET",
          params,
        };
      },

      providesTags: ["Insights"],
    }),
    exportInvoiceSummary: builder.query<
      any,
      {
        fromDate?: string;
        toDate?: string;
        isCustomize?: boolean;
        noOfMonthsOrYear?: number;
        compareWith?: "year" | "month";
        exportType?: string;
      }
    >({
      query: ({
        fromDate,
        toDate,
        isCustomize,
        noOfMonthsOrYear,
        compareWith,
        exportType,
      }) => {
        const params: Record<string, any> = {};

        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;

        if (isCustomize === true) {
          params.isCustomize = true;
          params.noOfMonthsOrYear = noOfMonthsOrYear;
          params.compareWith = compareWith;
        }
        if (exportType) params.exportType = exportType;
        return {
          url: "/reports/invoice_summary/export",
          method: "GET",
          params,
        };
      },

      providesTags: ["Insights"],
    }),
    getContactBalanceSummary: builder.query<
      ContactBalanceSummarySimpleResponse,
      {
        fromDate?: string;
        toDate?: string;
      }
    >({
      query: ({
        fromDate,
        toDate,
      }) => {
        const params: Record<string, string | boolean> = {};

        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;

        return {
          url: "/reports/contact_balance_summary",
          method: "GET",
          params,
        };
      },

      providesTags: ["Insights"],
    }),

    getContactBalanceSummaryDetailed: builder.query<
      ContactBalanceSummaryDetailedResponse,
      {
        fromDate?: string;
        toDate?: string;
        isDetailedView?: boolean;
      }
    >({
      query: ({
        fromDate,
        toDate,
        isDetailedView,
      }) => {
        const params: Record<string, string | boolean> = {};

        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        if (isDetailedView) params.isDetailedView = isDetailedView;

        return {
          url: "/reports/contact_balance_summary",
          method: "GET",
          params,
        };
      },

      providesTags: ["Insights"],
    }),
    exportContactBalanceSummary: builder.query<
      any,
      {
        fromDate?: string;
        toDate?: string;
        isCustomize?: boolean;
        noOfMonthsOrYear?: number;
        compareWith?: "year" | "month";
        exportType?: string;
      }
    >({
      query: ({
        fromDate,
        toDate,
        isCustomize,
        noOfMonthsOrYear,
        compareWith,
        exportType,
      }) => {
        const params: Record<string, any> = {};

        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;

        if (isCustomize === true) {
          params.isCustomize = true;
          params.noOfMonthsOrYear = noOfMonthsOrYear;
          params.compareWith = compareWith;
        }
        if (exportType) params.exportType = exportType;
        return {
          url: "/reports/contact_balance_summary/export",
          method: "GET",
          params,
        };
      },

      providesTags: ["Insights"],
    }),
  }),
});

// Export Hooks
export const {
  useGetDashboardQuery,
  useLazyGetDashboardQuery,
  useUpdateOrderMutation,
  useGetProfitAndLossQuery,
  useLazyGetProfitAndLossQuery,
  useGetBalanceSheetQuery,
  useLazyGetBalanceSheetQuery,
  useGetTrialBalanceQuery,
  useLazyGetTrialBalanceQuery,
  useLazyGetTDSSummaryQuery,
  useGetTDSSummaryQuery,
  useGetTaxSummaryQuery,
  useLazyGetTaxSummaryQuery,
  useGetDetailedTaxSummaryQuery,
  useLazyGetDetailedTaxSummaryQuery,
  useLazyExportProfitAndLossQuery,
  useExportProfitAndLossQuery,
  useExportTDSQuery,
  useLazyExportTDSQuery,
  useLazyExportTaxSummaryQuery,
  useLazyExportBalanceSheetQuery,
  useLazyExportTrialBalanceQuery,
  useGetInvoiceSummaryQuery,
  useLazyGetInvoiceSummaryQuery,
  useLazyExportInvoiceSummaryQuery,
  useLazyGetContactBalanceSummaryQuery,
  useLazyGetContactBalanceSummaryDetailedQuery,
  useLazyExportContactBalanceSummaryQuery,
} = insightsApi;
