/**
 * Auth Slice - Global Authentication State
 * 
 * This slice manages the global authentication state (user info, token, login status).
 * For API calls related to authentication, use RTK Query hooks from 'src/api':
 * - useLoginMutation() - User login
 * - useLogoutMutation() - User logout
 * - useRefreshTokenMutation() - Refresh access token
 * - useGetCurrentUserQuery() - Get current user details
 * - useUpdateUserMutation() - Update user profile
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getAllPermissionNames, Permission } from '../../types/permissions';
import { RoleMapping } from '../../types/role.types';

export interface NavigationItem {
  title: string;
  path: string;
  allowedPermissions: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  permissions?: Permission;
  roleMappings?: RoleMapping[]; 
  userInfo: {
    name: string;
    email: string;
    avatar?: string;
  };
  navigation?: NavigationItem[];
}

interface AuthState {
  user: AuthUser | null;
  userNavigation?: string;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  navigation: NavigationItem[];
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  userNavigation: "/settings",
  isAuthenticated: false,
  isLoading: false,
  error: null,
  navigation: [],
};

// Helper function to find the first accessible navigation item path
export const getFirstAccessibleNavPath = (
  navigation: NavigationItem[] | undefined,
  userPermissions: Permission | undefined
): string => {
  if (!navigation || navigation.length === 0) {
    return '/settings';
  }

  const firstAccessibleNavItem = navigation.find((item) => {
    const allowed = item.allowedPermissions;
    if (!allowed || allowed.length === 0) {
      return true;
    }
    const allPerms = getAllPermissionNames(userPermissions);
    return allowed.some((permission) => allPerms.includes(permission));
  });

  return firstAccessibleNavItem?.path ?? navigation[0]?.path ?? '/settings';
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    setAccessToken: (state, actionPayload: PayloadAction<string>) => {
      state.accessToken = actionPayload.payload;
      state.isAuthenticated = true;
    },
    setUser: (state, actionPayload: PayloadAction<AuthUser>) => {
      state.user = actionPayload.payload;
      state.navigation = actionPayload.payload.navigation || [];
      state.userNavigation = getFirstAccessibleNavPath(
        state.user.navigation,
        state.user.permissions
      );
    },
    loginSuccess: (state, actionPayload: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = actionPayload.payload.user;
      state.accessToken = actionPayload.payload.token;
      state.navigation = actionPayload.payload.user.navigation || [];
      state.userNavigation = getFirstAccessibleNavPath(
        state.user.navigation,
        state.user.permissions
      );
    },
    loginFailure: (state, actionPayload: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = actionPayload.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.navigation = [];
    },
    loadUser: (state, actionPayload: PayloadAction<AuthUser>) => {
      state.user = actionPayload.payload;
      state.isAuthenticated = true;
      state.navigation = actionPayload.payload.navigation || [];
      state.userNavigation = getFirstAccessibleNavPath(
        state.user.navigation,
        state.user.permissions
      );
    },
    updateUserDetails: (state, actionPayload: PayloadAction<{name: string}>) => {
      if (state.user) {
        state.user.userInfo.name = actionPayload.payload.name;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  loadUser, 
  clearError,
  setAccessToken,
  setUser,
  updateUserDetails
} = authSlice.actions;

// Export type alias for backward compatibility
export type User = AuthUser;

// Selector functions - state type will be inferred when used with useAppSelector
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.accessToken !== null;
export const selectNavigation = (state: { auth: AuthState }) => state.auth.navigation;

export default authSlice.reducer;
