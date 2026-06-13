// interfaces for api responses

import { baseApi } from "../../../../../api/base.api";
type Holiday = {
  id: number;
  date: string;
  description: string;
};

export const homeHoliday = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHolidaysForHome: builder.query<Holiday[], string>({
      query: (id) => ({
        url: `/employee_portal/holiday_plan/${id}`,
        method: "GET",
      }),
      transformResponse: (response: any) => response.data, // 👈 IMPORTANT
      providesTags: ["Holidays"],
    }),
  }),
});

// Export Hooks
export const { useGetHolidaysForHomeQuery } = homeHoliday;
