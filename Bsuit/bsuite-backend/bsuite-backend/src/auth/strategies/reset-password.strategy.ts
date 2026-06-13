import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class ResetPasswordStrategy extends PassportStrategy(Strategy, 'jwt-reset-password') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_RESET_PASSWORD_TOKEN_SECRET!,
    });
  }

  async validate(payload: any) {
    return payload; 
  }
}
