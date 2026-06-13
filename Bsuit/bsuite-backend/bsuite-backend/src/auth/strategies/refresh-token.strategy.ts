import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { MoreThan, Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { Request } from 'express'; 

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken'; 

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>
  ) {
    const extractJwtFromCookie = (req: Request) => {
      if (req.cookies && req.cookies[REFRESH_TOKEN_COOKIE_NAME]) {
        return req.cookies[REFRESH_TOKEN_COOKIE_NAME];
      }
      return null;
    };
    
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractJwtFromCookie]), 
      secretOrKey: process.env.JWT_REFRESH_TOKEN_SECRET!, 
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const session = await this.sessionRepo.findOne({
      where: {
        sessionId: payload.sessionId,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    return { ...payload, session };
  }
}