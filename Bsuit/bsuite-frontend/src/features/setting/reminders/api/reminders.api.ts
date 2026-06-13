import { baseApi } from "../../../../api/base.api";

export const remindersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================================
    //  JOURNALS API ENDPOINTS
    // ============================================================================

    // Create Journal Entry
    getReminders: builder.query<any, void>({
      query: () => ({
        url: `/reminders`,
        method: "GET",
      }),
      providesTags: ["Insights"],
    }),
    createReminder: builder.mutation<any, any>({
      query: (data) => ({
        url: `/reminders`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Insights"],
    }),
    updateReminder: builder.mutation<any, any>({
      query: ({data,id}) => ({
        url: `/reminders/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Insights"],
    }),
    pauseReminder: builder.mutation<any, any>({
      query: ({id}) => ({
        url: `/reminders/${id}/pause`,
        method: "PATCH",
        
      }),
      invalidatesTags: ["Insights"],
    }),
    resumeReminder: builder.mutation<any, any>({
      query: ({id}) => ({
        url: `/reminders/${id}/resume`,
        method: "PATCH",
        
      }),
      invalidatesTags: ["Insights"],
    }),
    deleteReminder: builder.mutation<any, any>({
      query: ({id}) => ({
        url: `/reminders/${id}`,
        method: "DELETE",
        
      }),
      invalidatesTags: ["Insights"],
    }),
    getReminderById: builder.query<any, any>({
      query: ({id}) => ({
        url: `/reminders/${id}`,
        method: "GET",
      }),
      providesTags: ["Insights"],
    }),
    
    // Get Single Journal Entry by ID (for edit/view)
  }),
});

// Export Hooks
export const {
  useGetRemindersQuery,
  useUpdateReminderMutation,
  useCreateReminderMutation,
  usePauseReminderMutation,
  useResumeReminderMutation,
  useDeleteReminderMutation,
  useGetReminderByIdQuery,
} = remindersApi;
