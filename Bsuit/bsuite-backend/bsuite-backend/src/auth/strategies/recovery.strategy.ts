import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class RecoveryStrategy extends PassportStrategy(Strategy, 'recovery') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),  
      secretOrKey: process.env.JWT_RECOVERY_SECRET!,
    });
  }

  async validate(payload: any) {
    if (!payload.email) {
      throw new UnauthorizedException('Invalid recovery token!.');
    }

    if (!payload.exp) {
      throw new UnauthorizedException('Token missing!');
    }

    return {
      email: payload.email,
      issuedAt: payload.iat,
    };
  }
}
