import { baseApi } from "../../../../../api/base.api";

// Response Types
export interface ReportCountResponse {
  data: { count: number } | number;
  message?: string;
}

export interface ReportTimeResponse {
  data: { timeString: string } | string;
  message?: string;
}

export interface CategoryAggregate {
  categoryName: string;
  totalTickets: number;
  resolved: number;
  pending: number;
  breachedSla: number;
}

export interface AssigneeAggregate {
  assigneeName: string;
  assignedTickets: number;
  resolvedTickets: number;
  avgResolutionTime: string;
  slaBreaches: number;
}

export interface MonthlyTrend {
  month: string;
  createdTickets: number;
  closedTickets?: number;
}

export interface DateFilterArgs {
  start?: string;
  end?: string;
}

export const helpdeskReportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllTicketsReport: builder.query<any, DateFilterArgs>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.start) queryParams.append("start", params.start);
        if (params.end) queryParams.append("end", params.end);
        return {
          url: `/helpdesk/reports/all-tickets?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["HelpdeskReports"],
    }),

    getClosedTicketsReport: builder.query<any, DateFilterArgs>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.start) queryParams.append("start", params.start);
        if (params.end) queryParams.append("end", params.end);
        return {
          url: `/helpdesk/reports/closed-tickets?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["HelpdeskReports"],
    }),

    getAggregatesByCategory: builder.query<{ data: CategoryAggregate[] }, void>({
      query: () => ({
        url: `/helpdesk/reports/aggregates-by-category`,
        method: "GET",
      }),
      providesTags: ["HelpdeskReports"],
    }),

    getAggregatesByAssignee: builder.query<{ data: AssigneeAggregate[] }, void>({
      query: () => ({
        url: `/helpdesk/reports/aggregates-by-assignee`,
        method: "GET",
      }),
      providesTags: ["HelpdeskReports"],
    }),

    getMonthlyTrends: builder.query<{ data: MonthlyTrend[] }, void>({
      query: () => ({
        url: `/helpdesk/reports/monthly-trends`,
        method: "GET",
      }),
      providesTags: ["HelpdeskReports"],
    }),

    getAvgFirstResponse: builder.query<any, void>({
      query: () => ({
        url: `/helpdesk/reports/avg-first-response`,
        method: "GET",
      }),
      providesTags: ["HelpdeskReports"],
    }),

    getAvgResolutionTime: builder.query<any, void>({
      query: () => ({
        url: `/helpdesk/reports/avg-resolution-time`,
        method: "GET",
      }),
      providesTags: ["HelpdeskReports"],
    }),

    getOnHoldStats: builder.query<any, void>({
      query: () => ({
        url: `/helpdesk/reports/on-hold-stats`,
        method: "GET",
      }),
      providesTags: ["HelpdeskReports"],
    }),
  }),
});

export const {
  useGetAllTicketsReportQuery,
  useGetClosedTicketsReportQuery,
  useGetAggregatesByCategoryQuery,
  useGetAggregatesByAssigneeQuery,
  useGetMonthlyTrendsQuery,
  useGetAvgFirstResponseQuery,
  useGetAvgResolutionTimeQuery,
  useGetOnHoldStatsQuery,
} = helpdeskReportsApi;
