import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterUserDto } from "./dto/register-user.dto";
import type { Request, Response } from "express";
import { Setup2FactorDto } from "./dto/setup-2Factor.dto";
import { Verify2FactorDto } from "./dto/verify-2Factor.dto";
import { Login2FADto } from "./dto/login-user-2FA.dto";
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import { AuthGuard } from "@nestjs/passport";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ConfirmResetPasswordDto } from "./dto/confirm-reset-password.dto";
import { CurrentUser } from "src/common/decorators/user.decorator";
import { User } from "./entities/user.entity";
import {
  IgnoreInterceptor,
  ignoreModuleClassInterceptor,
} from "src/common/decorators/ignore-interceptor.decorator";
import { SwaggerEndpoint } from "src/swagger/custom-decorator";
import { authSwagger } from "./swagger/auth.swagger";

@ignoreModuleClassInterceptor()
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @SwaggerEndpoint(authSwagger, "SIGN_UP")
  async signUp(@Body() registerUserDto: RegisterUserDto, @Req() req: Request) {
    return {
      message: "Verification Link sent.",
      data: await this.authService.register(registerUserDto, req),
    };
  }

  @UseGuards(AuthGuard("verify-email"))
  @Post("verify_email")
  @SwaggerEndpoint(authSwagger, "VERIFY_EMAIL")
  async verifyEmail(@CurrentUser("id") userId: number) {
    return {
      message: "User verified sucessfully!",
      data: await this.authService.verifyEmail(userId),
    };
  }

  @UseGuards(AuthGuard("local"))
  @Post("login")
  @SwaggerEndpoint(authSwagger, "LOGIN")
  async login(
    @Req() req: Request,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response
  ) {
    return {
      message: "Credentials verified successfully",
      data: await this.authService.login(req, user, res),
    };
  }

  @UseGuards(AuthGuard("jwt-temp"))
  @Post("2fa/login")
  @SwaggerEndpoint(authSwagger, "LOGIN_2FA")
  async login2FA(
    @CurrentUser("id") userId: number,
    @Body() login2FADto: Login2FADto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    return {
      message: "Sucessfully 2FA log In",
      data: await this.authService.login2FA(userId, req, login2FADto, res),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/setup")
  @SwaggerEndpoint(authSwagger, "SETUP_2FA")
  async setup2FA(
    @CurrentUser() user: UserPayload,
    @Body() setup2FactorDto: Setup2FactorDto
  ) {
    const qrCode = await this.authService.setup2FA(user, setup2FactorDto);
    return {
      message: "QR fetched successfully",
      data: { qrCode },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/verify")
  @SwaggerEndpoint(authSwagger, "VERIFY_2FA_SETUP")
  async verify2FA(
    @CurrentUser("id") userId: number,
    @Body() verify2FactorDto: Verify2FactorDto
  ) {
    const { methods } = await this.authService.verify2FA(
      userId,
      verify2FactorDto
    );
    return {
      message: "2FA setup successfull",
      data: methods,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/disable")
  @SwaggerEndpoint(authSwagger, "DISABLE_2FA")
  async disable2FA(
    @CurrentUser("id") userId: number,
    @Body() verify2FactorDto: Verify2FactorDto
  ) {
    await this.authService.disable2FA(userId, verify2FactorDto);
    return {
      message: "2FA disabled successfully",
    };
  }

  @Get("oauth")
  @UseGuards(AuthGuard("oauth"))
  @SwaggerEndpoint(authSwagger, "GOOGLE_OAUTH")
  async oauthLogin() {}

  @Get("oauth/callback")
  @UseGuards(AuthGuard("oauth"))
  @SwaggerEndpoint(authSwagger, "GOOGLE_OAUTH_CALLBACK")
  async oauthCallback(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res() res: Response
  ) {
    await this.authService.googleLogin(user, req, res);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @SwaggerEndpoint(authSwagger, "LOGOUT")
  async logout(
    @CurrentUser("sessionId") sessionId: string,
    @Res({ passthrough: true }) res: Response
  ) {
    console.log(sessionId, "vdd");
    await this.authService.logout(sessionId, res);
    return { message: "Logout successful" };
  }

  @Post("change_password")
  @UseGuards(JwtAuthGuard)
  @SwaggerEndpoint(authSwagger, "SIGN_UP")
  async changePassword(
    @CurrentUser("id") userId: number,
    @Body() changePasswordDto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return {
      message: "Successfully changed password",
      data: await this.authService.changePassword(
        userId,
        changePasswordDto,
        res
      ),
    };
  }

  @Post("reset_password")
  @SwaggerEndpoint(authSwagger, "RESET_PASSWORD")
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: Request
  ) {
    await this.authService.resetPassword(resetPasswordDto, req);
    return {
      message: "Successfully sent mail",
    };
  }

  @Post("confirm_reset_password")
  @UseGuards(AuthGuard("jwt-reset-password"))
  @SwaggerEndpoint(authSwagger, "CONFIRM_RESET_PASSWORD")
  async confirmResetPassword(
    @CurrentUser("id") userId: number,
    @Body() confirmResetPasswordDto: ConfirmResetPasswordDto
  ) {
    return {
      message: "Password reset successfull",
      data: await this.authService.confirmResetPassword(
        userId,
        confirmResetPasswordDto
      ),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("sessions")
  async getUserSessions(@CurrentUser("id") userId: number) {
    return {
      data: await this.authService.getSessionsForUser(userId),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete("session")
  async deleteSessionById(@Body() body: { sessionId: string }) {
    return { data: await this.authService.deleteSessionById(body.sessionId) };
  }

  @UseGuards(JwtAuthGuard)
  @Delete("allSessions")
  async logoutAllExceptCurrent(
    @CurrentUser("sessionId") sessionId: string,
    @CurrentUser("id") userId: number
  ) {
    return {
      message: "Logged out from all other sessions successfully",
      data: await this.authService.logoutAllExceptCurrent(sessionId, userId),
    };
  }

  @IgnoreInterceptor()
  @Post("refresh_token")
  @UseGuards(AuthGuard("jwt-refresh"))
  @SwaggerEndpoint(authSwagger, "REFRESH_TOKEN")
  async refreshTokens(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response
  ) {
    const userPayload: UserPayload = req.user;
    const companyId = req.cookies["companyId"];
    const { accessToken, newRefreshToken, sessionId } =
      await this.authService.rotateRefreshToken(userPayload, res, companyId);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      sessionId,
    };
  }

  @Post("resend_verification_email")
  @SwaggerEndpoint(authSwagger, "RESEND_VERIFICATION_EMAIL")
  async resendVerificationEmail(@Req() req: Request) {
    await this.authService.resendVerificationEmail(req);

    return {
      message: "Mail sent successfully",
    };
  }
 
  @Post("set_password")
  @UseGuards(JwtAuthGuard)
  @SwaggerEndpoint(authSwagger, "SET_PASSWORD")
  async setPassword(
    @CurrentUser("id") userId: number,
    @Body() confirmResetPasswordDto: ConfirmResetPasswordDto
  ) {
    return {
      message: "Password Set Successfull",
      data: await this.authService.setPassword(userId, confirmResetPasswordDto),
    };
  }

  @Post("verify_google_user")
  @UseGuards(AuthGuard("google-auth"))
  async verifyGoogleUser() {
    return {
      message: "Verified Successfully",
    };
  }
}
