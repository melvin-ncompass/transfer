import { baseApi } from './baseApi';

/**
 * Session interface
 */
export interface Session {
  id: string;
  userAgent: string;
  user: any;
  method: string;
  endpoint: string;
  createdAt: string;
}

/**
 * RTK Query API for Sessions/Activity Logs
 *
 * Provides auto-generated hooks for:
 * - useGetSessionsQuery - Get all user activity logs
 */
export const sessionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all user activity logs/sessions
     * @returns Array of sessions
     */
    getSessions: builder.query<Session[], void>({
      query: () => 'users/allUserActivityLogs',
      transformResponse: (response: { data: Session[] }) => response.data,
      providesTags: ['Session'],
    }),
  }),
});

/**
 * Auto-generated hooks for session operations
 */
export const { useGetSessionsQuery, useLazyGetSessionsQuery } = sessionApi;
