

import { baseApi } from "../../../../../api/base.api";

export interface IHolidayPlan {
  id: number;
  planName: string;
  country: string;
  default: boolean;
}

export interface ICreateHolidayPlanRequest {
  planName: string;
  country: string;
  holidayList: {
    name: string;
    description: string;
    date: string;
  }[];
}

export interface IHoliday {
  id?: number;
  name?: string;
  description: string;
  date: string;
  canModify?: boolean;
}

export interface IHolidayPlanResponse {
  holidays: IHoliday[];
  years: number[];
}

export interface IHolidayPlanUploadItem {
  planName: string;
  country: string;
  date: string;
  description: string;
}

export interface IHolidayPlanValidateRequest {
  data: IHolidayPlanUploadItem[];
}

export interface IHolidayPlanValidateError {
  rowNumber: number;
  data: Record<
    string,
    {
      value: any;
      error: string | null;
    }
  >;
}

export interface IHolidayPlanValidateResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: IHolidayPlanValidateError[];
}

export interface IHolidayPlanBulkCreateResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: IHolidayPlan[];
}

export const holidayPlanApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHolidayPlans: builder.query<IHolidayPlan[], void>({
      query: () => ({
        url: "/holiday/holiday_plan",
        method: "GET",
      }),
      providesTags: ["HolidayPlan"],
      transformResponse: (response: any) => response.data,
    }),

    createHolidayPlan: builder.mutation<void, ICreateHolidayPlanRequest>({
      query: (data) => ({
        url: "/holiday/holiday_plan",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["HolidayPlan"],
    }),

    updateHolidayPlan: builder.mutation<IHolidayPlan, { id: number; planName: string }>({
      query: ({ id, planName }) => ({
        url: `/holiday/holiday_plan/${id}`,
        method: "PATCH",
        body: { newName: planName },
      }),
      invalidatesTags: ["HolidayPlan"],
    }),

    deleteHolidayPlan: builder.mutation<void, number>({
      query: (id) => ({
        url: `/holiday/holiday_plan/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["HolidayPlan"],
    }),

    // Fetch generic list of holidays for a country (for modal)
    getListHolidays: builder.query<IHoliday[], { country: string; year: number }>({
      query: ({ country, year }) => ({
        url: "/holiday/list_holidays",
        method: "GET",
        params: { country, year },
      }),
      transformResponse: (response: any) => response.data,
    }),

    // Fetch holidays for a specific plan
    getPlanHolidays: builder.query<IHolidayPlanResponse, { id: number; year: string }>({
      query: ({ id, year }) => ({
        url: `/holiday/holiday_list/${id}`,
        method: "GET",
        params: { year },
      }),
      providesTags: (_result, _error, { id }) => [{ type: "HolidayPlan", id: `UseList-${id}` }],
      transformResponse: (response: any) => response.data,
    }),

    addHoliday: builder.mutation<void, { id: number; date: string; description: string }>({
      query: ({ id, ...data }) => ({
        url: `/holiday/holiday_list/${id}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "HolidayPlan", id: `UseList-${id}` }],
    }),

    updateHoliday: builder.mutation<void, { id: number; holidayId: number; description: string; date?: string }>({
      query: ({ id, holidayId, description, date }) => ({
        url: `/holiday/holiday_list/${id}/${holidayId}`,
        method: "PATCH",
        body: { description, date },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "HolidayPlan", id: `UseList-${id}` }],
    }),

    deleteHoliday: builder.mutation<void, { id: number; holidayId: number }>({
      query: ({ id, holidayId }) => ({
        url: `/holiday/holiday/${id}/${holidayId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "HolidayPlan", id: `UseList-${id}` }],
    }),

    setAsDefaultPlan: builder.mutation<void, number>({
      query: (id) => ({
        url: `/holiday/change_default_plan/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["HolidayPlan"],
    }),

    getHolidayPlanEmployees: builder.query<any, string | number>({
      query: (id) => ({
        url: `/holiday/employee/${id}`,
        method: "GET",
      }),
      providesTags: ["HolidayPlan"],
    }),

    // Download template
    downloadHolidayPlanTemplate: builder.query<Blob, void>({
      query: () => ({
        url: "/holiday/holiday_plan/download_template",
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Upload file
    uploadHolidayPlan: builder.mutation<IHolidayPlanUploadItem[], FormData>({
      query: (formData) => ({
        url: "/holiday/holiday_plan/upload",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: any) => response.data,
    }),

    // Validate uploaded data
    validateHolidayPlan: builder.mutation<IHolidayPlanValidateError[], IHolidayPlanValidateRequest>({
      query: (body) => ({
        url: "/holiday/holiday_plan/validate",
        method: "POST",
        body,
      }),
      transformResponse: (response: IHolidayPlanValidateResponse) => response.data,
    }),

    // Bulk create
    bulkCreateHolidayPlan: builder.mutation<IHolidayPlan[], IHolidayPlanValidateRequest>({
      query: (body) => ({
        url: "/holiday/holiday_plan/bulk_create",
        method: "POST",
        body,
      }),
      transformResponse: (response: IHolidayPlanBulkCreateResponse) => response.data,
      invalidatesTags: ["HolidayPlan"],
    }),
  }),
});

export const {
  useGetHolidayPlansQuery,
  useCreateHolidayPlanMutation,
  useUpdateHolidayPlanMutation,
  useDeleteHolidayPlanMutation,
  useGetListHolidaysQuery,
  useGetPlanHolidaysQuery,
  useAddHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
  useSetAsDefaultPlanMutation,
  useLazyGetListHolidaysQuery,
  useGetHolidayPlanEmployeesQuery,
  useDownloadHolidayPlanTemplateQuery,
  useLazyDownloadHolidayPlanTemplateQuery,
  useUploadHolidayPlanMutation,
  useValidateHolidayPlanMutation,
  useBulkCreateHolidayPlanMutation,
} = holidayPlanApi;

