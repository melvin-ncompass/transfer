import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class VerifyUserStrategy extends PassportStrategy(Strategy, 'verify-email') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_VERIFY_USER_TOKEN_SECRET!,
    });
  }

  async validate(payload: any) {
    return payload; 
  }
}
