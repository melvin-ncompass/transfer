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

export interface SessionApiResponse {
  data: Session[];
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  message: string;
  statusCode: number;
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

    getSession: builder.query<
        SessionApiResponse,
        {
          page?: number;
          limit?: number;
          search?: string;
          userFilter?: string;
          startDate?: string;
          endDate?: string;
        }
      >({
        query: (params) => {
          const queryParams = new URLSearchParams();
          
          if (params?.page) queryParams.append('page', params.page.toString());
          if (params?.limit) queryParams.append('limit', params.limit.toString());
          if (params?.search) queryParams.append('search', params.search);
          if (params?.userFilter) queryParams.append('userFilter', params.userFilter);
          if (params?.startDate) queryParams.append('startDate', params.startDate);
          if (params?.endDate) queryParams.append('endDate', params.endDate);
          
          return {
            url: `/users/allUserActivityLogs?${queryParams.toString()}`,
          };
        },

      }),

    }),

  });

/**
 * Auto-generated hooks for session operations
 */
export const {
  useLazyGetSessionQuery,
 } = sessionApi;
