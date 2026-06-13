import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { MoreThan, Repository } from 'typeorm';
import { Session } from '../entities/session.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET!,
    });
  }

  async validate(payload: any) {
    const session = await this.sessionRepo.findOne({
      where: {
        sessionId: payload.sessionId,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    return payload;
  }
}
