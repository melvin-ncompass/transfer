import { baseApi } from "../../../../../../../api/base.api";
import type {
  PaySchedulePayload,
  PayScheduleResponse,
  PayScheduleGetResponse,
} from "../types/payschedule.types";

const PAY_SCHEDULE_URL = "/payschedule";

export const payScheduleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaySchedule: builder.query<PayScheduleGetResponse, void>({
      query: () => ({ url: PAY_SCHEDULE_URL, method: "GET" }),
      providesTags: ["PaySchedule"],
    }),
    createPaySchedule: builder.mutation<PayScheduleResponse, PaySchedulePayload>({
      query: (body) => ({
        url: PAY_SCHEDULE_URL,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PaySchedule"],
    }),
    updatePaySchedule: builder.mutation<PayScheduleResponse, PaySchedulePayload>({
      query: (body) => ({
        url: PAY_SCHEDULE_URL,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["PaySchedule"],
    }),
  }),
});

export const {
  useGetPayScheduleQuery,
  useCreatePayScheduleMutation,
  useUpdatePayScheduleMutation,
} = payScheduleApi;
