import { baseApi } from "../../../api/base.api";
import type {
  LoginPayload,
  SignUpPayload,
  ConfirmResetPasswordPayload,
} from "../types/auth.types";

const AUTH = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/reset_password",
  RESET_PASSWORD: "/auth/confirm_reset_password",
  TWO_FACTOR_SETUP: "/auth/2fa/setup",
  TWO_FACTOR_VERIFY: "/auth/2fa/verify",
  TWO_FACTOR_DISABLE: "/auth/2fa/disable",
  CHANGE_PASSWORD: "/auth/change_password",
  SET_PASSWORD:"/auth/set_password",
  LOGOUT: "/auth/logout",
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // refreshSession: builder.query<any, void>({
    //   query: () => ({
    //     url: "/auth/refresh_token",
    //     method: "POST",
    //   }),
    // }),
    /* ---------------------------------------------
       LOGIN
    ---------------------------------------------- */
    login: builder.mutation({
      query: (body: LoginPayload) => ({
        url: AUTH.LOGIN,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    /* ---------------------------------------------
       REGISTER
    ---------------------------------------------- */
    register: builder.mutation({
      query: (body: SignUpPayload) => ({
        url: AUTH.REGISTER,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    /* ---------------------------------------------
       FORGOT PASSWORD (SEND RESET EMAIL)
    ---------------------------------------------- */
    sendResetEmail: builder.mutation({
      query: (body: { email: string }) => ({
        url: AUTH.FORGOT_PASSWORD,
        method: "POST",
        body,
      }),
    }),

    /* ---------------------------------------------
       CONFIRM RESET PASSWORD
       (requires token in Authorization header)
    ---------------------------------------------- */
    confirmResetPassword: builder.mutation({
      query: (body: ConfirmResetPasswordPayload) => ({
        url: AUTH.RESET_PASSWORD,
        method: "POST",
        body: { password: body.password },
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
      }),
    }),

    verifyTwoFA: builder.mutation({
      query: (body: {
        tempToken: string;
        method?: string;
        code?: Number;
        nickName?: string;
        color?: string;
        schoolName?: string;
      }) => {
        const { tempToken, ...bodyWithoutToken } = body;
        return {
          url: "/auth/2fa/login",
          method: "POST",
          body: bodyWithoutToken,
          headers: {
            Authorization: `Bearer ${tempToken}`,
          },
        };
      },
    }),

    getSecurityQuestions: builder.query({
      query: (email: string) => ({
        url: `/auth/security-questions?email=${email}`,
        method: "GET",
      }),
    }),

    verifySecurityAnswer: builder.mutation({
      query: (body: { email: string; questionId: string; answer: string }) => ({
        url: "/auth/verify-security-answer",
        method: "POST",
        body,
      }),
    }),
    twoFactorSetup: builder.mutation<
      any,
      { nickName: string; color: string; schoolName: string }
    >({
      query: (body) => ({
        url: AUTH.TWO_FACTOR_SETUP,
        method: "POST",
        body,
        // headers: withAuthHeader(),
      }),
    }),

    // 2FA VERIFY
    twoFactorVerify: builder.mutation<any, { code: number }>({
      query: (body) => ({
        url: AUTH.TWO_FACTOR_VERIFY,
        method: "POST",
        body,
        // headers: withAuthHeader(),
      }),
    }),

    // 2FA DISABLE
    twoFactorDisable: builder.mutation<any, { code: number }>({
      query: (body) => ({
        url: AUTH.TWO_FACTOR_DISABLE,
        method: "POST",
        body,
        // headers: withAuthHeader(),
      }),
    }),

    // CHANGE PASSWORD
    changePassword: builder.mutation<
      any,
      { oldPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: AUTH.CHANGE_PASSWORD,
        method: "POST",
        body,
        // headers: withAuthHeader(),
      }),
      invalidatesTags: ["Profile"],
    }),
    setNewPassword: builder.mutation<
      any,
      { password: string;  }
    >({
      query: (body) => ({
        url: AUTH.SET_PASSWORD,
        method: "POST",
        body,
        // headers: withAuthHeader(),
      }),
      invalidatesTags: ["Profile"],
    }),
    verifyEmail: builder.mutation<any, string>({
      query: (token) => ({
        url: `/auth/verify_email`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }),
    }),
    resendEmail : builder.mutation<any, string>({
      query: (token)=>({
        url: `/auth/resend_verification_email`,
        method:"POST",
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }),    
    }),

    // LOGOUT
    logout: builder.mutation<any, void>({
      query: () => ({
        url: AUTH.LOGOUT,
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),

    verifyMagicLink: builder.mutation<any, { token: string }>({
      query: ({ token }) => ({
        url: `/setting/users/verify_magic_link?token=${encodeURIComponent(token)}`,
        method: "POST",
      }), 
    }),

    
    setPassword: builder.mutation<any, { token: string; password: string, confirmPassword: string }>({
      query: ({ token, password, confirmPassword }) => ({
        url: `/setting/users/set_password?token=${encodeURIComponent(token)}`,
        method: "POST",
        body: { password, confirmPassword },
      }),
    }),

    sendRecoveryEmail: builder.mutation<any, void>({
      query: () => ({
        url: `/user/send_recovery_email`,
        method: "POST",
        // body: { email },
      }),
    }),

    verifyTwoFaRecoveryLink: builder.query<any, { token: string }>({
      query: ({ token }) => ({
        url: `/user/recovery/validate`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    }),

    TwoFaRecoverySetPassword: builder.mutation<any, { token: string; password: string }>({
      query: ({ token, password }) => ({
        url: `/user/recovery_2fa`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { password },
      }),
    }),

  }),
});

export const {
  useResendEmailMutation,
  useLoginMutation,
  useRegisterMutation,
  useSendResetEmailMutation,
  useConfirmResetPasswordMutation,
  useVerifyTwoFAMutation,
  useGetSecurityQuestionsQuery,
  useVerifySecurityAnswerMutation,
  useTwoFactorSetupMutation,
  useTwoFactorVerifyMutation,
  useTwoFactorDisableMutation,
  useChangePasswordMutation,
  useVerifyEmailMutation,
  useLogoutMutation,
  useSetPasswordMutation,
  useVerifyMagicLinkMutation,
  useTwoFaRecoverySetPasswordMutation,
  useSendRecoveryEmailMutation,
  useVerifyTwoFaRecoveryLinkQuery,
  useSetNewPasswordMutation
} = authApi;
