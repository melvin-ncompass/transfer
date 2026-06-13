import { baseApi } from "../../../../../api/base.api";

export interface ISlackConfigResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: string;
}

export interface MaxRegularisationAllowedDto {
  count: number;
  timePeriod: "week" | "month";
}

export interface AttendanceConfigRequestDto {
  allowRegularisation: boolean;
  reasonRequired: boolean;
  /** When `allowRegularisation` is false, these should be `null` for the API. */
  maxRegularisationAllowed: MaxRegularisationAllowedDto | null;
  lastDateToRegularise: number | null;
  maxDaysAfterIncident: number | null;
}

export interface IUpdateSlackConfigRequest {
  slackUrl: string;
}

export interface IRemoveSlackConfigResponse {
  message?: string;
  data?: unknown;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSlackConfig: builder.query<ISlackConfigResponse, void>({
      query: () => ({
        url: "/settings/slackConfig",
        method: "GET",
      }),
      providesTags: ["AttendanceSettings"],
    }),
    updateSlackConfig: builder.mutation<ISlackConfigResponse, IUpdateSlackConfigRequest>({
      query: (data) => ({
        url: "/settings/slackConfig",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AttendanceSettings"],
    }),
    removeSlackConfig: builder.mutation<IRemoveSlackConfigResponse, void>({
      query: () => ({
        url: "/settings/slackConfig",
        method: "DELETE",
      }),
      invalidatesTags: ["AttendanceSettings"],
    }),

    getAttendanceConfig: builder.query<any, void>({
      query: () => ({
        url: `/settings`,
        method: "GET",
      }),
      providesTags: ["AttendanceSettingsConfig"],
    }),

    createAttendanceConfig: builder.mutation<any, AttendanceConfigRequestDto>({
      query: (data) => ({
        url: `/settings`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AttendanceSettingsConfig"],
    }),

    updateAttendanceConfig: builder.mutation<
    any, 
    {
      data: AttendanceConfigRequestDto;
    }>({
      query: ({data}) => ({
        url: `/settings`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["AttendanceSettingsConfig"],
    }),
  }),
});

export const {
  useGetSlackConfigQuery,
  useUpdateSlackConfigMutation,
  useRemoveSlackConfigMutation,
  useGetAttendanceConfigQuery,
  useCreateAttendanceConfigMutation,
  useUpdateAttendanceConfigMutation,
} = settingsApi;
