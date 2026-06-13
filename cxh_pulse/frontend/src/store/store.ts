import type { ThunkAction, Action } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';

import authReducer, { logout } from './slices/authSlice';
import { baseApi } from '../api';

/**
 * Redux Store Configuration
 *
 * Central state management for the application
 *
 * State structure:
 * - auth: User authentication state (token, user info, login status)
 * - api: RTK Query API cache and state (handles all data fetching)
 *
 * RTK Query middleware is included for:
 * - Automatic caching
 * - Request deduplication
 * - Background refetching
 * - Cache invalidation
 *
 * DevTools are enabled in development for debugging
 *
 * Note: userList, roleList, and sessionList slices have been removed
 * in favor of RTK Query. Use the following hooks instead:
 * - useGetAllUsersQuery, useGetPendingApprovalsQuery, useInviteUserMutation
 * - useGetRolesQuery, useCreateRoleMutation, useUpdateRoleMutation
 * - useGetSessionsQuery
 */
export const store = configureStore({
  reducer: {
    auth: authReducer, // Authentication state (still uses Redux for global auth state)
    [baseApi.reducerPath]: baseApi.reducer, // RTK Query API cache (includes brandingApi)
  },
  // Add RTK Query middleware for caching, invalidation, polling, etc.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable serializable check to improve performance
    }).concat(baseApi.middleware),
  // Enable Redux DevTools in development only
  devTools: process.env.NODE_ENV !== 'production',
});

// Cross-tab logout synchronization
// Listen for logout events from other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'logout' && e.newValue) {
      // Logout was triggered in another tab
      store.dispatch(logout());
      // Redirect to home if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      // Clear the logout flag
      localStorage.removeItem('logout');
    }
  });
}

/**
 * Root state type - inferred from all reducers
 * Use this type when accessing state with useAppSelector
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * Dispatch type - includes types for thunk actions
 * Use this type when dispatching actions with useAppDispatch
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Type for async thunk actions
 *
 * @example
 * ```ts
 * export const fetchUser = (): AppThunk => async (dispatch) => {
 *   const response = await api.getUser();
 *   dispatch(setUser(response.data));
 * };
 * ```
 */
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
