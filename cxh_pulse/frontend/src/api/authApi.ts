import { baseApi } from './baseApi';
import type { AuthUser } from '../store/slices/authSlice';

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login response interface
 */
export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponse {
  accessToken: string;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  name: string;
}

/**
 * RTK Query API for Authentication
 * 
 * Provides auto-generated hooks for:
 * - useLoginMutation - User login
 * - useLogoutMutation - User logout
 * - useRefreshTokenMutation - Refresh access token
 * - useGetCurrentUserQuery - Get current user details
 * - useUpdateUserMutation - Update user profile
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Login user
     * @param credentials - Email and password
     * @returns User data and tokens
     */
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: 'users/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    /**
     * Logout user
     * @returns void
     */
    logout: builder.mutation<void, void>({
      query: () => ({
        url: 'users/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    /**
     * Refresh access token
     * @returns New access token
     */
    refreshToken: builder.mutation<RefreshTokenResponse, void>({
      query: () => ({
        url: 'users/auth/refresh',
        method: 'POST',
      }),
    }),

    /**
     * Get current user details
     * @returns Current user data
     */
    getCurrentUser: builder.query<AuthUser, void>({
      query: () => 'users/me',
      transformResponse: (response: { data: AuthUser }) => response.data,
      providesTags: ['User'],
    }),

    /**
     * Update user profile
     * @param data - User update data
     * @returns Updated user data
     */
    updateUser: builder.mutation<AuthUser, UpdateUserRequest>({
      query: (data) => ({
        url: 'users',
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: { data: AuthUser }) => response.data,
      // Invalidate user cache to trigger refetch
      invalidatesTags: ['User'],
    }),
  }),
});

/**
 * Auto-generated hooks for auth operations
 */
export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useUpdateUserMutation,
} = authApi;
