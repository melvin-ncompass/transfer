import { baseApi } from "../../../../../../../api/base.api";
import type { NoticePeriodApiResponse, NoticePeriodConfig, CreateNoticePeriodConfigDto, UpdateNoticePeriodConfigDto } from "../types/notice.types";

const NOTICE_PERIOD_CONFIG_URL = "/notice_period_config";

// ---------- API Slice ----------
export const noticePeriodApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createNoticePeriod: builder.mutation<
      NoticePeriodApiResponse<{ id: number }>,
      CreateNoticePeriodConfigDto
    >({
      query: (body) => ({
        url: NOTICE_PERIOD_CONFIG_URL,
        method: "POST",
        body,
      }),
      invalidatesTags: ["NoticePeriodConfig"],
    }),

    getNoticePeriod: builder.query<
      NoticePeriodApiResponse<NoticePeriodConfig>,
      number
    >({
      query: (id) => ({
        url: `${NOTICE_PERIOD_CONFIG_URL}/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _err, id) => [
        { type: "NoticePeriodConfig", id: String(id) },
      ],
    }),

    updateNoticePeriod: builder.mutation<
      NoticePeriodApiResponse<{ id: number }>,
      { id: number; body: UpdateNoticePeriodConfigDto }
    >({
      query: ({ id, body }) => ({
        url: `${NOTICE_PERIOD_CONFIG_URL}/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "NoticePeriodConfig", id: String(id) },
      ],
    }),
  }),
});

// ---------- Export Hooks ----------
export const {
  useCreateNoticePeriodMutation,
  useGetNoticePeriodQuery,
  useUpdateNoticePeriodMutation,
} = noticePeriodApi;
