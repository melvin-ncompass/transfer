import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from '../store/store';
import { setAccessToken, logout } from '../store/slices/authSlice';
import { Mutex } from 'async-mutex';
import { AuthTab } from '@/sections/landing/types';
import { getAuthUrl } from '@/routes/utils/auth-urls';

// Create a mutex to prevent multiple refresh requests
const mutex = new Mutex();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Base query with automatic token refresh on 401 errors
 */
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include', // Send cookies with requests
  prepareHeaders: (headers, { getState }) => {
    // Get token from Redux state
    const token = (getState() as RootState).auth.accessToken;

    // Add authorization header if token exists
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  },
});

/**
 * Custom base query with token refresh logic
 * Automatically refreshes access token on 401 errors
 * Handles 403 Forbidden errors by logging out the user
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  // Wait until the mutex is available without locking it
  await mutex.waitForUnlock();

  let result = await baseQuery(args, api, extraOptions);

  // Handle 403 Forbidden - user doesn't have permission or token is invalid
  if (result.error && result.error.status === 403) {
    console.error('403 Forbidden - Logging out user');
    api.dispatch(logout());
    // Trigger cross-tab logout sync
    localStorage.setItem('logout', Date.now().toString());
    // Redirect to home if not already there
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/';
    }
    return result;
  }

  if (result.error && result.error.status === 401) {
    // Check if the mutex is locked
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();

      try {
        // Try to refresh the token
        const refreshResult = await baseQuery(
          {
            url: 'users/auth/refresh',
            method: 'POST',
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          // Store the new token
          const { accessToken } = refreshResult.data as { accessToken: string };
          api.dispatch(setAccessToken(accessToken));

          // Retry the original query with new token (mark as retry to prevent infinite loop)
          result = await baseQuery(args, api, { ...extraOptions, _retryAfterRefresh: true } as any);

          // If retry still fails with 401, logout user
          if (result.error && result.error.status === 401) {
            api.dispatch(logout());
            // Trigger cross-tab logout sync
            localStorage.setItem('logout', Date.now().toString());
            // Redirect to home if not already there
            if (typeof window !== 'undefined' && window.location.pathname !== '/') {
              window.location.href = getAuthUrl(AuthTab.SIGN_IN);
            }
          }
        } else {
          // Refresh failed, logout user
          api.dispatch(logout());
          // Trigger cross-tab logout sync
          localStorage.setItem('logout', Date.now().toString());
          // Redirect to home if not already there
          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            window.location.href = getAuthUrl(AuthTab.SIGN_IN);
          }
        }
      } finally {
        // Release the mutex
        release();
      }
    } else {
      // Wait for the mutex to be available
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

/**
 * Base API configuration for RTK Query
 *
 * This serves as the foundation for all API endpoints in the application.
 * It handles:
 * - Base URL configuration
 * - Authentication token injection
 * - Credential management
 * - Automatic token refresh on 401 errors
 * - Request/response interceptors
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  // Define tag types for cache invalidation
  tagTypes: ['Role', 'User', 'Session', 'Session', 'Permission', 'Settings'],
  // Endpoints will be injected by individual API slices
  endpoints: () => ({}),
});
