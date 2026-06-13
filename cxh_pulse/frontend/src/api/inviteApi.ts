import { baseApi } from './baseApi';

/**
 * Accept invite request
 */
export interface AcceptInviteRequest {
  inviteToken: string;
}

/**
 * Accept invite response
 */
export interface AcceptInviteResponse {
  userInfoId: string;
  email: string;
  name: string;
  [key: string]: any;
}

/**
 * Onboard invite request
 */
export interface OnboardInviteRequest {
  password: string;
  userInfoId: string;
}

/**
 * Check request token request
 */
export interface CheckRequestTokenRequest {
  requestToken: string;
}

/**
 * Check request token response
 */
export interface CheckRequestTokenResponse {
  userInfoId: string;
  email: string;
  name: string;
  [key: string]: any;
}

/**
 * Onboard request
 */
export interface OnboardRequestRequest {
  password: string;
  userInfoId: string;
}

/**
 * Process request (approve/deny)
 */
export interface ProcessRequestRequest {
  requestId: string;
  status: 'approved' | 'denied';
}

/**
 * Signup request
 */
export interface SignupRequest {
  email: string;
  name: string;
  phone: string;
  password: string;
}

/**
 * Check reset token request
 */
export interface CheckResetTokenRequest {
  token: string;
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * Forgot password request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * RTK Query API for Invite/Request Management
 * 
 * Provides auto-generated hooks for:
 * - useAcceptInviteMutation - Accept an invite
 * - useOnboardInviteMutation - Complete invite onboarding
 * - useCheckRequestTokenMutation - Check request token validity
 * - useOnboardRequestMutation - Complete request onboarding
 * - useProcessRequestMutation - Approve/deny a request
 * - useSignupMutation - User signup/request
 * - useCheckResetTokenMutation - Check password reset token
 * - useResetPasswordMutation - Reset password
 * - useForgotPasswordMutation - Request password reset
 */
export const inviteApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Accept an invite
     * @param data - Invite token
     * @returns User info for onboarding
     */
    acceptInvite: builder.mutation<AcceptInviteResponse, AcceptInviteRequest>({
      query: (data) => ({
        url: 'users/invite/accept',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { data: AcceptInviteResponse }) => response.data,
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    /**
     * Complete invite onboarding with password
     * @param data - Password and user info ID
     * @returns Success response
     */
    onboardInvite: builder.mutation<{ statusCode: number }, OnboardInviteRequest>({
      query: (data) => ({
        url: 'users/invite/onboard',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * Check request token validity
     * @param data - Request token
     * @returns User info for onboarding
     */
    checkRequestToken: builder.mutation<CheckRequestTokenResponse, CheckRequestTokenRequest>({
      query: (data) => ({
        url: 'users/request/check',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { data: CheckRequestTokenResponse }) => response.data,
    }),

    /**
     * Complete request onboarding with password
     * @param data - Password and user info ID
     * @returns Success response
     */
    onboardRequest: builder.mutation<{ statusCode: number }, OnboardRequestRequest>({
      query: (data) => ({
        url: 'users/request/onboard',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * Process a user request (approve/deny)
     * @param data - Request ID and status
     * @returns Success response
     */
    processRequest: builder.mutation<any, ProcessRequestRequest>({
      query: (data) => ({
        url: '/users/request/process',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    /**
     * User signup/request
     * @param data - User signup data
     * @returns Success response
     */
    signup: builder.mutation<any, SignupRequest>({
      query: (data) => ({
        url: '/users/request',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * Check password reset token validity
     * @param data - Reset token
     * @returns Token validity
     */
    checkResetToken: builder.mutation<void, CheckResetTokenRequest>({
      query: (data) => ({
        url: '/users/check-reset-token',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * Reset password with token
     * @param data - Token and new password
     * @returns Success response
     */
    resetPassword: builder.mutation<any, ResetPasswordRequest>({
      query: (data) => ({
        url: '/users/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * Request password reset email
     * @param data - User email
     * @returns Success response
     */
    forgotPassword: builder.mutation<any, ForgotPasswordRequest>({
      query: (data) => ({
        url: '/users/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

/**
 * Auto-generated hooks for invite/request operations
 */
export const {
  useAcceptInviteMutation,
  useOnboardInviteMutation,
  useCheckRequestTokenMutation,
  useOnboardRequestMutation,
  useProcessRequestMutation,
  useSignupMutation,
  useCheckResetTokenMutation,
  useResetPasswordMutation,
  useForgotPasswordMutation,
} = inviteApi;
