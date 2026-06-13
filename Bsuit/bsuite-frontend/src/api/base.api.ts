import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { Mutex } from "async-mutex";
import { logout, setAccessToken } from "../features/auth/authSlice";
import type { RootState } from "../store/store";
import { resetProfileState, setSessionId } from "../features/auth/profilePage/profileSlice";
import { TAGS } from "./tagTypes";

// Create a mutex to prevent multiple refresh requests
const mutex = new Mutex();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getUrlFromArgs = (args: string | FetchArgs): string => {
  if (typeof args === "string") return args;
  return args.url;
};


/**
 * Base query with automatic token refresh on 401 errors
 */
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include", // Send cookies with requests
  prepareHeaders: (headers, { getState }: { getState:any }) => {
    // Get token from Redux state
    const token = (getState() as RootState).auth.accessToken;
    
    // Add authorization header if token exists
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const SKIP_REFRESH_URLS = [
  "/auth/login",
  "/auth/refresh_token",
];


/**
 * Custom base query with token refresh logic
 * Automatically refreshes access token on 401 errors
 * Handles 403 Forbidden errors by logging out the user
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Wait until the mutex is available without locking it
  await mutex.waitForUnlock();
 
  let result = await baseQuery(args, api, extraOptions);
  let url = getUrlFromArgs(args);

   // NEVER refresh for auth endpoints
  if (SKIP_REFRESH_URLS.includes(url)) {
    return result;
  }

  // Handle 403 Forbidden - user doesn't have permission or token is invalid
  if (result.error && result.error.status === 403) {
    console.error("403 Forbidden - Logging out user");
    api.dispatch(logout());
    // Redirect will be handled by AuthGuard
    return result;
  }

  if (result.error && result.error.status === 401) {
    // Check if the mutex is locked
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        // Try to refresh the token
        const refreshResult:any = await baseQuery(
          {
            url: "/auth/refresh_token",
            method: "POST",
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          // Store the new token
          const { accessToken } = refreshResult.data as { accessToken: string };
          api.dispatch(setAccessToken(accessToken));
          api.dispatch(setSessionId(refreshResult.data.sessionId));
          // Retry the original query with new token
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh failed, logout user
          api.dispatch(logout());
          api.dispatch(resetProfileState())
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

  // If still 401 after refresh, force logout and redirect
  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
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
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  // Define tag types for cache invalidation
  tagTypes: TAGS,
  // Endpoints will be injected by individual API slices
  endpoints: () => ({}),
});
