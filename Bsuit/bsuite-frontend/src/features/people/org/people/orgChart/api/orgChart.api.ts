
import { baseApi } from "../../../../../../api/base.api";
// =====================
// RTK Query API
// =====================


export const orgchartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 
    getOrgChart: builder.query<any, void>({
      query: () => ({
        url: `/employee/org_chart`,
        method: "GET",
      }),
      providesTags: ["People", "Header"],
    }),
  }),
});

// =====================
// Export Hooks
// =====================

export const { useGetOrgChartQuery } = orgchartApi;
