import {  Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Session } from "./entities/session.entity";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TotpService } from "./totp.service";
import { PassportModule } from "@nestjs/passport";
import { LocalStrategy } from "./strategies/local.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { TempJwtStrategy } from "./strategies/jwt-temp.strategy";
import { OAuthStrategy } from "./strategies/oauth.strategy";
import { MailerModule } from "@nestjs-modules/mailer";
import { EmailService } from "./mail.service";
import { ResetPasswordStrategy } from "./strategies/reset-password.strategy";
import { VerifyUserStrategy } from "./strategies/verify-user.strategy";
import { JwtRefreshStrategy } from "./strategies/refresh-token.strategy";
import { GcsService } from "src/user/gcs.service";
import { GoogleSheetsStrategy } from "./strategies/google.strategy";
import { UserCompanyRelation } from 'src/company/entities/user-company-relation.entity';

@Module({
  imports: [
    PassportModule.register({}),
    TypeOrmModule.forFeature([User, Session, UserCompanyRelation]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      global: true,
      useFactory: async (configService: ConfigService) => ({
        secret: process.env.JWT_ACCESS_TOKEN_SECRET,
        signOptions: {
          expiresIn: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRATION_MS!, 10),
        },
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        logger: true,
        debug: true,
      },
      defaults: {
        from: process.env.FROM_EMAIL,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    GcsService,
    AuthService,
    TotpService,
    LocalStrategy,
    JwtStrategy,
    TempJwtStrategy,
    OAuthStrategy,
    ResetPasswordStrategy,
    EmailService,
    VerifyUserStrategy, 
    JwtRefreshStrategy,
    GoogleSheetsStrategy,
  ],
  exports: [AuthService, EmailService],
})
export class AuthModule {}
