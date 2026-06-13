import { baseApi } from "../../../../../api/base.api";
import type {
  TimelineApiResponse,
  TimelineDataItem,
  GetTimelineParams,
} from "../types/timeline.types";

export const timelineApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployeeTimeline: builder.query<TimelineDataItem[], GetTimelineParams>({
      query: ({ employeeId, page = 1, limit = 5 }) => ({
        url: `/employee/timeline/${employeeId}`,
        params: { page, limit },
      }),
      transformResponse: (response: TimelineApiResponse) => response.data,
      providesTags: (_result, _error, { employeeId }) => [
        { type: "EmployeeTimeline", id: String(employeeId) },
        "EmployeeTimeline",
      ],
    }),
  }),
});

export const { useGetEmployeeTimelineQuery } = timelineApi;
