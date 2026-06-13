import { baseApi } from "../../../../api/base.api";

export interface FxRateDto {
  from: string | string[]; // Currency code like "USD", "INR", etc.
  to: string; // Currency code like "USD", "INR", etc.
  date: string; // ISO date format "YYYY-MM-DD"
}

export interface FxRateResponse {
  message: string;
  data: {
    from: string | string[];
    to: string;
    date: string;
    rate: Record<string, string>;
  };
}

// FX API Endpoints
export const fxApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get FX Rate History
    getFxHistory: builder.query<FxRateResponse, FxRateDto>({
      query: ({ from, to, date }) => ({
        url: "/fx/history",
        method: "GET",
        params: { from, to, date }, // Send as query params
      }),
      providesTags: ["FxRate"],
    }),
  }),
  overrideExisting: false,
});

// Export Hooks
export const { useGetFxHistoryQuery, useLazyGetFxHistoryQuery } = fxApi;
