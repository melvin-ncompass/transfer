import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class TempJwtStrategy extends PassportStrategy(Strategy, 'jwt-temp') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_TEMP_TOKEN_SECRET!,
    }); 
  }

  async validate(payload: any) {
    return payload; 
  }
}
