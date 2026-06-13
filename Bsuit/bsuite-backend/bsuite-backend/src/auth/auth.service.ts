import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { RegisterUserDto } from "./dto/register-user.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { DataSource, Not, Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { Setup2FactorDto } from "./dto/setup-2Factor.dto";
import { TotpService } from "./totp.service";
import { Verify2FactorDto } from "./dto/verify-2Factor.dto";
import { Login2FADto } from "./dto/login-user-2FA.dto";
import { Session } from "./entities/session.entity";
import { UAParser } from "ua-parser-js";
import { v4 as uuidv4 } from "uuid";
import { ChangePasswordDto } from "./dto/change-password.dto";
import * as fs from "fs/promises";
import { EmailService } from "./mail.service";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ConfirmResetPasswordDto } from "./dto/confirm-reset-password.dto";
import type { Request, Response } from "express";
import { GcsService } from "src/user/gcs.service";
import { UserCompanyRelation } from "src/company/entities/user-company-relation.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(UserCompanyRelation)
    private readonly relationRepo: Repository<UserCompanyRelation>,
    private readonly totpService: TotpService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private dataSource: DataSource,
    private gcsService: GcsService
  ) {}

  private getBrowserName(userAgent) {
    const parser = new UAParser(userAgent);
    const ua = parser.getResult();
    const browserName = ua.browser.name || "Unknown";
    return browserName;
  }

  private getClientSessionInfo(req): Record<string, any> {
    const userAgent = req.headers["user-agent"];
    const parser = new UAParser(userAgent);
    const ua = parser.getResult();

    // Extract IP
    let ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";

    ip = ip.replace("::ffff:", "");

    return {
      browser: ua.browser.name || "Unknown",
      os: ua.os.name || "Unknown",
      ip,
    };
  }

  private generateUsername(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let username = "";

    for (let i = 0; i < 6; i++) {
      username += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return username;
  }

  async register(registerUserDto: RegisterUserDto, req: Request) {
    const { displayName, password, email } = registerUserDto;

    const userAlreadyExists = await this.usersRepository.findOneBy({ email });
    if (userAlreadyExists) {
      throw new ConflictException("Email already registered!");
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transactionalUsersRepository = queryRunner.manager.getRepository(
        this.usersRepository.target
      );

      let username = this.generateUsername();
      let userNameExists = await transactionalUsersRepository.findOne({
        where: { username },
      });
      while (userNameExists) {
        username = this.generateUsername();
        userNameExists = await transactionalUsersRepository.findOne({
          where: { username },
        });
      }
      const hashedPassword = await argon2.hash(password);

      const user = await transactionalUsersRepository.save({
        displayName,
        username,
        email,
        password: hashedPassword,
      });

      const payload = { id: user.id };
      const verifyUserToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_VERIFY_USER_TOKEN_SECRET,
        expiresIn: parseInt(
          process.env.JWT_VERIFY_USER_TOKEN_EXPIRATION_MS!,
          10
        ),
      });

      const externalTemplatePath = `${process.env.VERIFY_USER_EMAIL_FORMAT_PATH}`;
      const htmlContent = await fs.readFile(externalTemplatePath, "utf8");

      const verificationLink = `${req.headers["origin"]}/${process.env.VERIFY_USER_EMAIL_LINK}/${verifyUserToken}`;
      const personalizedHtml = htmlContent
        .replace("{{name}}", user.displayName)
        .replace(/{{verificationLink}}/g, verificationLink)
        .replace("{{year}}", new Date().getFullYear().toString());

      const mailOptions = {
        to: user.email,
        subject: "Welcome to Bsuite! Please Verify Your Email",
        html: personalizedHtml,
        attachments: null,
      };

      await this.emailService.sendEmail(mailOptions);

      await queryRunner.commitTransaction();

      return;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.error(error);

      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Registration failed or error sending mail!"
      );
    } finally {
      await queryRunner.release();
    }
  }

  async resendVerificationEmail(req: Request) {
    const authHeader = req.headers["authorization"];

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;
    if (!token) throw new BadRequestException("Token not sent");

    const payload = this.jwtService.decode(token);

    const user = await this.usersRepository.findOne({
      where: { id: payload.id },
    });
    if (!user) throw new NotFoundException("User not found!");

    try {
      const payload = { id: user.id };
      const verifyUserToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_VERIFY_USER_TOKEN_SECRET,
        expiresIn: parseInt(
          process.env.JWT_VERIFY_USER_TOKEN_EXPIRATION_MS!,
          10
        ),
      });

      const externalTemplatePath = `${process.env.VERIFY_USER_EMAIL_FORMAT_PATH}`;
      const htmlContent = await fs.readFile(externalTemplatePath, "utf8");

      const verificationLink = `${req.headers["origin"]}/${process.env.VERIFY_USER_EMAIL_LINK}/${verifyUserToken}`;
      const personalizedHtml = htmlContent
        .replace("{{name}}", user.displayName)
        .replace(/{{verificationLink}}/g, verificationLink)
        .replace("{{year}}", new Date().getFullYear().toString());

      const mailOptions = {
        to: user.email,
        subject: "Welcome to Bsuite! Please Verify Your Email",
        html: personalizedHtml,
        attachments: null,
      };

      await this.emailService.sendEmail(mailOptions);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("Error sending mail!");
    }
  }

  async verifyEmail(userId: number) {
    const userExists = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!userExists) throw new InternalServerErrorException("User not found!");

    userExists.verified = true;

    return await this.usersRepository.save(userExists);
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ["defaultCompany"],
    });
    if (!user) return null;

    if (!user.password && user.googleID)
      throw new UnauthorizedException("Google account: password not set");

    if (!user.verified)
      throw new ForbiddenException(`Verify your account before login.`);

    const isPasswordValid = await argon2.verify(user.password!, password);
    if (!isPasswordValid) return null;

    return user;
  }

  async login(req: Request, user: User, res: Response, flag = true) {
    const sessionId = uuidv4();
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      sessionId,
    };

    if (user.twoFAEnabled && flag) {
      const tempToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_TEMP_TOKEN_SECRET,
        expiresIn: parseInt(process.env.JWT_TEMP_TOKEN_EXPIRATION_MS!, 10),
      });

      res.cookie("email", user.email, {
        httpOnly: true,
        secure: true,
        maxAge: Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS!),
        sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
        path: "/user/send_recovery_email",
      });

      return {
        twoFARequired: true,
        methods: ["questions", "google"],
        tempToken,
      };
    }

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      expiresIn: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS!, 10),
    });

    const expiryTime = Date.now() + parseInt(process.env.MAX_AGE!, 10);
    const expiry = new Date(expiryTime);
    const userAgent = req.headers["user-agent"];
    const clientInfo = this.getClientSessionInfo(req);
    const browserName = this.getBrowserName(userAgent);

    const sess = await this.sessionRepo.save({
      user: { id: user.id },
      expiresAt: expiry,
      sessionId: sessionId,
      browserName: browserName,
      clientInfo: clientInfo,
    });

    res.cookie("companyId", user.defaultCompany?.companyId, {
      httpOnly: true,
      secure: true,
      maxAge: Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS!),
      sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS!),
      sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
      path: "/auth/refresh_token",
    });

    if (!user.defaultCompany) {
      const relationExists = await this.relationRepo.findOne({
        where: { user },
        relations: ["user", "company"],
      });
      if (relationExists) {
        user.defaultCompany = relationExists.company;
      }
    }

    return {
      accessToken,
      refreshToken,
      sessionId,
      username: user.username,
      twoFAEnabled: user.twoFAEnabled,
      defaultCompany: user.defaultCompany?.companyId,
      defaultCompanyName: user.defaultCompany?.companyName,
    };
  }

  async login2FA(
    userId: number,
    req: Request,
    login2FADto: Login2FADto,
    res: Response
  ) {
    const { code, method, nickName, color, schoolName } = login2FADto;
    const sessionId = uuidv4();
    const userExists = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ["defaultCompany"],
    });
    if (!userExists || !userExists.twoFAEnabled || !userExists.twoFASecret) {
      throw new UnauthorizedException("2FA Not Enabled");
    }

    let verified = false;

    if (method == "google") {
      if (!code) {
        throw new UnauthorizedException("TOTP code required");
      }
      verified = this.totpService.verifyCode(
        String(code),
        userExists.twoFASecret!
      );
    } else if (method === "questions") {
      if (!nickName && !color && !schoolName) {
        throw new UnauthorizedException("Please fill atleast one answer");
      }

      if (
        nickName !== userExists.favQuestion?.nickName &&
        schoolName !== userExists.favQuestion?.schoolName &&
        color !== userExists.favQuestion?.color
      ) {
        throw new UnauthorizedException("Incorrect answer");
      }
      verified = true;
    }

    if (!verified) throw new UnauthorizedException("Invalid 2FA Verification");

    const payload = {
      id: userExists.id,
      email: userExists.email,
      username: userExists.username,
      sessionId,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      expiresIn: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS!, 10),
    });

    const expiryTime = Date.now() + parseInt(process.env.MAX_AGE!, 10);
    const expiry = new Date(expiryTime);
    const userAgent = req.headers["user-agent"];
    const browserName = this.getBrowserName(userAgent);
    const clientInfo = this.getClientSessionInfo(req);

    await this.sessionRepo.save({
      user: { id: userId },
      expiresAt: expiry,
      sessionId: sessionId,
      browserName: browserName,
      clientInfo: clientInfo,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS!),
      sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
      path: "/auth/refresh_token",
    });

    res.cookie("companyId", userExists.defaultCompany?.companyId, {
      httpOnly: true,
      secure: true,
      maxAge: Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS!),
      sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
      path: "/",
    });

    return {
      accessToken,
      refreshToken,
      sessionId,
      username: userExists.username,
      defaultCompany: userExists.defaultCompany?.companyId,
      defaultCompanyName: userExists.defaultCompany?.companyName,
    };
  }

  async setup2FA(user: UserPayload, setup2FactorDto: Setup2FactorDto) {
    const { nickName, color, schoolName } = setup2FactorDto;

    const userExists = await this.usersRepository.findOne({
      where: { id: user.id },
    });
    if (!userExists) {
      throw new BadRequestException("User not found!");
    }

    const secret = this.totpService.generateSecret();
    const otpAuthUrl = this.totpService.generateOtpAuthUrl(user.email, secret);
    const qrCode = await this.totpService.generateQrCode(otpAuthUrl);

    userExists.twoFASecret = secret;
    userExists.favQuestion = {
      nickName,
      color,
      schoolName,
    };

    await this.usersRepository.save(userExists);
    return qrCode;
  }

  async verify2FA(userId: number, verify2FactorDto: Verify2FactorDto) {
    const { code } = verify2FactorDto;

    const userExists = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!userExists || !userExists.twoFASecret) {
      throw new BadRequestException("2FA setup not found");
    }

    const isValid = this.totpService.verifyCode(
      String(code),
      userExists.twoFASecret
    );
    if (!isValid) {
      throw new UnauthorizedException("Invalid 2FA code");
    }

    userExists.twoFAEnabled = true;
    await this.usersRepository.save(userExists);

    return {
      methods: ["questions", "google"],
    };
  }

  async disable2FA(userId: number, verify2FactorDto: Verify2FactorDto) {
    const { code } = verify2FactorDto;

    const userExists = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!userExists || !userExists.twoFAEnabled || !userExists.twoFASecret) {
      throw new BadRequestException("2FA not enabled");
    }

    const isValid = this.totpService.verifyCode(
      String(code),
      userExists.twoFASecret
    );
    if (!isValid) {
      throw new UnauthorizedException("Invalid 2FA code");
    }

    ((userExists.twoFAEnabled = false), (userExists.favQuestion = null));
    userExists.twoFASecret = "";

    await this.usersRepository.save(userExists);

    return;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto, req: Request) {
    const { email } = resetPasswordDto;
    const userExists = await this.usersRepository.findOne({
      where: { email: email },
    });

    if (!userExists) throw new BadRequestException("Email Not Registered");

    if (!userExists.password)
      throw new ConflictException("Password Change Unavailable");

    try {
      const payload = { id: userExists.id };
      const resetPasswordToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_RESET_PASSWORD_TOKEN_SECRET,
        expiresIn: parseInt(
          process.env.JWT_RESET_PASSWORD_TOKEN_EXPIRATION_MS!,
          10
        ),
      });

      const externalTemplatePath = `${process.env.RESET_PASSWORD_EMAIL_FORMAT_PATH}`;
      const htmlContent = await fs.readFile(externalTemplatePath, "utf8");

      const resetLink = `${req.headers["origin"]}/${process.env.RESET_PASSWORD_EMAIL_LINK}/${resetPasswordToken}`;
      const personalizedHtml = htmlContent
        .replace("{{name}}", userExists.displayName)
        .replace(/{{resetLink}}/g, resetLink)
        .replace("{{year}}", new Date().getFullYear().toString());

      const mailOptions = {
        to: userExists.email,
        subject: "Password Reset Request",
        html: personalizedHtml,
        attachments: null,
      };

      const info = await this.emailService.sendEmail(mailOptions);
      return;
    } catch (error) {
      throw new InternalServerErrorException("Error sending mail!");
    }
  }

  async confirmResetPassword(
    userId: number,
    confirmResetPassword: ConfirmResetPasswordDto
  ) {
    const { password } = confirmResetPassword;
    const userExists = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!userExists) {
      throw new InternalServerErrorException("User not found!");
    }

    const hashedPassword = await argon2.hash(password);
    userExists.password = hashedPassword;
    return await this.usersRepository.save(userExists);
  }

  async validateOAuth(profile: any) {
    const { id, name, email, picture } = profile;
    const userExists = await this.usersRepository.findOne({
      where: { email },
    });

    if (userExists) {
      if (!userExists.googleID) {
        userExists.googleID = id;
        await this.usersRepository.save(userExists);

        if (!userExists.profileImage && picture) {
          const imageUrl = await this.gcsService.uploadImageFromUrl(
            picture,
            process.env.PROFILE_PIC_BUCKET!,
            `${id}.jpg`
          );
          userExists.profileImage = imageUrl;
          await this.usersRepository.save(userExists);
        }
      }

      if (!userExists.verified) {
        userExists.verified = true;
        await this.usersRepository.save(userExists);
      }

      return userExists;
    } else {
      let username = this.generateUsername();
      let userNameExists = await this.usersRepository.findOne({
        where: { username },
        relations: ["sessions"],
      });

      while (userNameExists) {
        username = this.generateUsername();
        userNameExists = await this.usersRepository.findOne({
          where: { username },
        });
      }

      let imageUrl;
      if (picture) {
        imageUrl = await this.gcsService.uploadImageFromUrl(
          picture,
          process.env.PROFILE_PIC_BUCKET!,
          `${id}.jpg`
        );
      }

      const newUser = this.usersRepository.create({
        username,
        email,
        googleID: id,
        verified: true,
        profileImage: imageUrl || undefined,
        displayName: name,
      });

      await this.usersRepository.save(newUser);
      return newUser;
    }
  }

  async googleLogin(user: User, req: Request, res: Response) {
    const sessionId = uuidv4();
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      sessionId,
    };

    const userExists = await this.usersRepository.findOne({
      where: { id: user.id },
      relations: ["defaultCompany"],
    });
    if (!userExists) throw new NotFoundException("User Not Found");

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      expiresIn: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS!, 10),
    });

    console.log(await this.jwtService.signAsync(payload));

    const expiryTime = Date.now() + parseInt(process.env.MAX_AGE!, 10);
    const expiry = new Date(expiryTime);
    const userAgent = req.headers["user-agent"];
    const browserName = this.getBrowserName(userAgent);
    const clientInfo = this.getClientSessionInfo(req);

    await this.sessionRepo.save({
      user: { id: user.id },
      expiresAt: expiry,
      sessionId: sessionId,
      browserName: browserName,
      clientInfo: clientInfo,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS!),
      sameSite: "strict",
      path: "/auth/refresh_token",
    });

    res.cookie("companyId", userExists.defaultCompany?.companyId, {
      httpOnly: true,
      secure: true,
      maxAge: Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS!),
      sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
      path: "/",
    });

    const redirectUrl = `${process.env.FRONTEND_BASE_URL}/profile`;

    await this.relationRepo
      .createQueryBuilder()
      .update(UserCompanyRelation)
      .set({ status: "Active" })
      .where("user_id = :userId", { userId: user.id }) 
      .andWhere("status = :status", { status: "Invitation Sent" })
      .execute();

    res.redirect(redirectUrl);

    return;
  }

  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
    res: Response
  ) {
    const userExists = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!userExists) {
      throw new BadRequestException("User not found!");
    }

    const { oldPassword, newPassword } = changePasswordDto;

    if (!userExists.password)
      throw new ForbiddenException(
        "Cannot Change Password. User Registered Using Google."
      );

    const isPasswordValid = await argon2.verify(
      userExists.password!,
      oldPassword
    );

    if (!isPasswordValid) {
      throw new BadRequestException("Incorrect current Password!");
    }

    const hashedPassword = await argon2.hash(newPassword);

    userExists.password = hashedPassword;

    const result = await this.sessionRepo.delete({
      user: { id: userExists.id },
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
      path: "/auth/refresh_token",
    });

    res.clearCookie("companyId", {
      httpOnly: true,
      secure: true,
      sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
      path: "/",
    });

    res.clearCookie("email", {
      httpOnly: true,
      secure: true,
      sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
      path: "/",
    });

    return await this.usersRepository.save(userExists);
  }

  async getSessionsForUser(userId: number) {
    return this.sessionRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
      select: {
        sessionId: true,
        expiresAt: true,
        createdAt: true,
        browserName: true,
        clientInfo: true,
      },
    });
  }

  async deleteSessionById(sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException("Session ID missing");
    }

    const result = await this.sessionRepo.delete({ sessionId });

    if (result.affected === 0) {
      throw new NotFoundException("Session not found");
    }
    return;
  }

  async logoutAllExceptCurrent(currentSessionId: string, userId: number) {
    if (!currentSessionId) {
      throw new BadRequestException("Session ID missing");
    }

    const result = await this.sessionRepo.delete({
      user: { id: userId },
      sessionId: Not(currentSessionId),
    });

    return result.affected;
  }

  async logout(sessionId: string, res: Response) {
    await this.deleteSessionById(sessionId);
    console.log("logging out");

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
      path: "/auth/refresh_token",
    });

    res.clearCookie("companyId", {
      httpOnly: true,
      secure: true,
      sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
      path: "/",
    });

    res.clearCookie("email", {
      httpOnly: true,
      secure: true,
      sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
      path: "/",
    });

    return;
  }

  async rotateRefreshToken(
    userPayload: UserPayload,
    res: Response,
    companyId?: string
  ) {
    const { id, email, sessionId, username } = userPayload;

    const userExists = await this.usersRepository.findOne({
      where: { id },
      relations: ["defaultCompany"],
    });

    if (!userExists) throw new NotFoundException("User not found!");

    const payload = { id, email, sessionId, username };
    const refreshTokenExpiryMs = Number(
      process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS
    );
    const expiryTime = Date.now() + refreshTokenExpiryMs;
    const expiry = new Date(expiryTime);

    const newAccessToken = await this.jwtService.signAsync(payload);
    const newRefreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      expiresIn: refreshTokenExpiryMs,
    });

    const userAgent = res.req.headers["user-agent"];
    const browserName = this.getBrowserName(userAgent);
    const clientInfo = this.getClientSessionInfo(res.req);

    await this.sessionRepo.update(
      { sessionId: sessionId },
      {
        expiresAt: expiry,
        browserName: browserName,
        clientInfo: clientInfo,
      }
    );

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: refreshTokenExpiryMs,
      sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
      path: "/auth/refresh_token",
    });

    const resolvedCompanyId = companyId ?? userExists.defaultCompany?.companyId;

    if (resolvedCompanyId) {
      res.cookie("companyId", resolvedCompanyId, {
        httpOnly: true,
        secure: true,
        maxAge: Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS),
        sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
        path: "/",
      });
    }

    return {
      accessToken: newAccessToken,
      newRefreshToken: newRefreshToken,
      sessionId: sessionId,
      username,
      defaultCompany: userExists.defaultCompany?.companyId,
    };
  }

  async setPassword(
    userId: number,
    confirmResetPassword: ConfirmResetPasswordDto
  ) {
    const { password } = confirmResetPassword;
    const userExists = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!userExists) {
      throw new InternalServerErrorException("User Not Found");
    }
    if (userExists.password) {
      throw new ForbiddenException("Password Already Exists");
    }

    const hashedPassword = await argon2.hash(password);
    userExists.password = hashedPassword;
    return await this.usersRepository.save(userExists);
  }

  async findByGoogleId(googleID: string) {
    const userExists = await this.usersRepository.findOne({
      where: { googleID },
    });

    if (!userExists) return null;

    if (!userExists.verified)
      throw new ForbiddenException(`Verify your account before login.`);

    return userExists;
  }
}
