import { baseApi } from "../../../../api/base.api";
import type {
  ActivityResponse,
  ActivityFilterParams,
  DisplayNamesResponse,
  FeaturesModulesResponse,
} from "../types/activity.types";

// API slice
export const activityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Existing: Filtered Activities
    getActivities: builder.query<ActivityResponse, ActivityFilterParams>({
      query: ({
        page = 1,
        limit = 50,
        startTime,
        endTime,
        users,
        modules,
        features,
      }) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const params: Record<string, any> = {
          page,
          limit,
          timezone,
        };

        if (startTime) params.startTime = startTime;
        if (endTime) params.endTime = endTime;
        if (users?.length) params.users = users;
        if (modules?.length) params.modules = modules;
        if (features?.length) params.features = features;

        return {
          url: "/activity/filter",
          method: "GET",
          params,
        };
      },
      providesTags: ["Activity"],
    }),

    // New: Fetch display names
    getDisplayNames: builder.query<DisplayNamesResponse, void>({
      query: () => ({
        url: "/activity/display_names",
        method: "GET",
      }),
      providesTags: ["ActivityDisplayNames"],
    }),

    // New: Fetch modules & features
    getFeaturesModules: builder.query<FeaturesModulesResponse, void>({
      query: () => ({
        url: "/activity/get_features_modules",
        method: "GET",
      }),
      providesTags: ["ActivityFeaturesModules"],
    }),

    exportActivityReport: builder.mutation<
      { message: string },
      ActivityFilterParams & {
        type: "pdf" | "excel";
        timezone?: string;
      }
    >({
      query: (params) => {
        const { startTime, endTime, users, modules, features, type, timezone } =
          params;

        const body: Record<string, any> = {};

        if (type) body.type = type;
        if (timezone) body.timezone = timezone;
        if (startTime) body.startTime = startTime;
        if (endTime) body.endTime = endTime;
        if (users?.length) body.users = users;
        if (modules?.length) body.modules = modules;
        if (features?.length) body.features = features;

        return {
          url: "/activity/export",
          method: "POST",
          body,
        };
      },
    }),
  }),
});

// Export hooks
export const {
  useGetActivitiesQuery,
  useGetDisplayNamesQuery,
  useGetFeaturesModulesQuery,
  useExportActivityReportMutation,  
  useLazyGetDisplayNamesQuery,
} = activityApi;
