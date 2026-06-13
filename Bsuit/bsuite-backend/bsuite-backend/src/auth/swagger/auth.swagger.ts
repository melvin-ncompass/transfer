import { ConfirmResetPasswordDto } from "../dto/confirm-reset-password.dto";
import { Login2FADto } from "../dto/login-user-2FA.dto";
import { LoginUserDto } from "../dto/login-user.dto";
import { RegisterUserDto } from "../dto/register-user.dto";
import { ResetPasswordDto } from "../dto/reset-password.dto";
import { Setup2FactorDto } from "../dto/setup-2Factor.dto";
import { Verify2FactorDto } from "../dto/verify-2Factor.dto";
import { EnabledMethodsDto } from "./response-dto/enabled-methods.dto";
import { Login2FARequiredDto } from "./response-dto/login-2fa-required.dto";
import { LoginSuccessDto } from "./response-dto/login-success.dto";
import { QrCodeDto } from "./response-dto/qr-code-response.dto";
import { TokenRotationDto } from "./response-dto/token-rotation.dto";
import { UserProfileDto } from "./response-dto/user-profile.dto";

export const authSwagger = {
  SIGN_UP: {
    summary: "Create Account",
    description: "Create user account and send verification email",
    tags: ["Auth"],
    body: [{ type: RegisterUserDto }],
    responses: [
      { status: 201, description: "Verification Link sent." },
      { status: 409, description: "Conflict - Email already registered" },
    ],
  },

  VERIFY_EMAIL: {
    summary: "Verify Email",
    description: "Verify user email account using verification token",
    tags: ["Auth"],
    bearerAuth: true,
    responses: [
      { status: 200, description: "User verified successfully!", dataType: UserProfileDto },
      { status: 401, description: "Unauthorized - Invalid token" },
    ],
  },

  LOGIN: {
    summary: "Login User",
    description: "Authenticates credentials. Returns tokens OR requires 2FA.",
    tags: ["Auth"],
    body: [{ type: LoginUserDto }],
    responses: [
      { 
        status: 201, 
        description: "Authentication successful", 
        dataTypes: [LoginSuccessDto, Login2FARequiredDto] 
      },
      { status: 401, description: "Unauthorized - Incorrect Credentials!" },
      { status: 403, description: "Forbidden - Email not verified!" },
    ],
  },

  LOGIN_2FA: {
    summary: "Login with 2FA",
    description: "Complete login using TOTP or security questions",
    tags: ["Auth"],
    bearerAuth: true,
    body: [{ type: Login2FADto }],
    responses: [
      { status: 201, description: "Successfully 2FA log In", dataType: LoginSuccessDto },
      { status: 401, description: "Unauthorized - Invalid 2FA verification" },
    ],
  },

  SETUP_2FA: {
    summary: "Setup 2FA",
    description: "Initialize 2FA and get TOTP QR code",
    tags: ["Auth"],
    bearerAuth: true,
    body: [{ type: Setup2FactorDto }],
    responses: [
      { status: 201, description: "QR fetched successfully", dataType: QrCodeDto },
    ],
  },

  VERIFY_2FA_SETUP: {
    summary: "Verify 2FA Setup",
    description: "Verify TOTP code to enable 2FA",
    tags: ["Auth"],
    bearerAuth: true,
    body: [{ type: Verify2FactorDto }],
    responses: [
      { status: 201, description: "2FA setup successful", dataType: EnabledMethodsDto },
    ],
  },

  DISABLE_2FA: {
    summary: "Disable 2FA",
    description: "Disable 2FA settings for the account",
    tags: ["Auth"],
    bearerAuth: true,
    body: [{ type: Verify2FactorDto }],
    responses: [
      { status: 201, description: "2FA disabled successfully" },
    ],
  },

  LOGOUT: {
    summary: "Logout User",
    description: "Invalidate session and clear cookies",
    tags: ["Auth"],
    bearerAuth: true,
    responses: [
      { status: 201, description: "Logout successful" },
    ],
  },

  REFRESH_TOKEN: {
    summary: "Refresh Access Token",
    description: "Rotate tokens using refreshToken cookie",
    tags: ["Auth"],
    cookies: [
      { name: "refreshToken", description: "Rotational JWT", required: true },
      { name: "companyId", description: "Active company", required: false },
    ],
    responses: [
      { status: 201, description: "Tokens rotated successfully", dataType: TokenRotationDto },
      { status: 401, description: "Unauthorized - Session expired" },
    ],
  },

  RESET_PASSWORD: {
    summary: "Request Password Reset",
    description: "Send reset link to user's email",
    tags: ["Auth"],
    body: [{ type: ResetPasswordDto }],
    responses: [
      { status: 201, description: "Successfully sent mail" },
      { status: 400, description: "Bad Request - Email Not Registered" },
    ],
  },

  CONFIRM_RESET_PASSWORD: {
    summary: "Confirm Password Reset",
    description: "Update password using reset token",
    tags: ["Auth"],
    bearerAuth: true,
    body: [{ type: ConfirmResetPasswordDto }],
    responses: [
      { status: 201, description: "Password reset successful", dataType: UserProfileDto },
    ],
  },

  SET_PASSWORD: {
    summary: "Set Initial Password",
    description: "Set password for social login accounts",
    tags: ["Auth"],
    bearerAuth: true,
    body: [{ type: ConfirmResetPasswordDto }],
    responses: [
      { status: 201, description: "Password Set Successful", dataType: UserProfileDto },
    ],
  },

  RESEND_VERIFICATION_EMAIL: {
    summary: "Resend Verification Email",
    tags: ["Auth"],
    bearerAuth: true,
    responses: [
      { status: 201, description: "Mail sent successfully" },
    ],
  },

  GOOGLE_OAUTH: {
    summary: "Google OAuth Login",
    tags: ["Auth"],
    responses: [{ status: 302, description: "Redirect to Google" }],
  },

  GOOGLE_OAUTH_CALLBACK: {
    summary: "Google OAuth Callback",
    tags: ["Auth"],
    responses: [
      { status: 302, description: "Redirect to Frontend" },
      { status: 401, description: "Unauthorized" },
    ],
  },
};