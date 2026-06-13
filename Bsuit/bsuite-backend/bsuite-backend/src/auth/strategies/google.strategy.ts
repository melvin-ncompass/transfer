import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-http-bearer"; 
import { OAuth2Client } from "google-auth-library";
import { AuthService } from "../auth.service";
import type { Request } from "express";

@Injectable()
export class GoogleSheetsStrategy extends PassportStrategy(
  Strategy,
  "google-auth"
) {
  private client: OAuth2Client;

  constructor(private readonly authService: AuthService) {
    super({ passReqToCallback: true });
    this.client = new OAuth2Client(process.env.OAUTH_CLIENT_ID);
  }

  async validate(req: Request, token: string): Promise<any> {
    try {
      const companyId = req.headers["x-company-id"] as string;
      req.cookies.companyId = companyId

      const res = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`
      );
      const payload = await res.json();

      if (!res.ok || payload.error_description) {
        throw new UnauthorizedException(
          "Invalid Google Access Token: " +
            (payload.error_description || "Unknown error")
        );
      }

      const googleId = payload.sub;

      if (!googleId) {
        throw new UnauthorizedException(
          "Token does not contain a Google Subject ID"
        );
      }

      const user = await this.authService.findByGoogleId(googleId);

      if (!user) {
        throw new UnauthorizedException(
          `User with Google ID ${googleId} is not registered in this system.`
        );
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException(
        "Authentication failed: " + error.message
      );
    }
  }
}
