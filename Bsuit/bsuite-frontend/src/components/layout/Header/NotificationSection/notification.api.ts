import { baseApi } from "../../../../api/base.api";
import {
  serializeNotificationCursorParam,
  type NotificationCursor,
} from "./notification.types";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================================
    //  JOURNALS API ENDPOINTS
    // ============================================================================

    // Create Journal Entry
    getNotifications: builder.query<
      any,
      NotificationCursor | string | undefined
    >({
      query: (cursor) => {
        const serialized = serializeNotificationCursorParam(cursor);
        return {
          url: `/notification`,
          method: "GET",
          params: serialized ? { cursor: serialized } : undefined,
        };
      },
      providesTags: ["Notifications"],
    }),
    toggleRead: builder.mutation<any, any>({
      query: ({ id, read }) => ({
        url: `/notification/mark_read/${id}`,
        method: "PATCH",
        params: { isRead: read },
      }),
      invalidatesTags: ["Notifications"],
    }),
    markAllRead: builder.mutation<any, void>({
      query: () => ({
        url: `/notification/mark_read_all/`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),
    getUnreadCount: builder.query<any, void>({
      query: () => {
        return {
          url: "/notification/unread_count",
          method: "GET",
        };
      },

      providesTags: ["Notifications"],
    }),
  }),
});

// Export Hooks
export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useToggleReadMutation,
  useMarkAllReadMutation
} = notificationApi;
