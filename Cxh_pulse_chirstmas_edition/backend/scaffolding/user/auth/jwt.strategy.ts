import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET') || 'supersecret';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    this.logger.log(`[JwtStrategy] Using JWT Secret: ${secret}`);
    this.logger.log('JwtStrategy Initialized');
  }

  // async validate(payload: any) {
  //   return { userId: payload.sub, email: payload.email, role: payload.role };
  // }

  async validate(payload: any) {
    this.logger.log('validate() called');
    this.logger.debug(`JWT Payload: ${JSON.stringify(payload)}`);

    try {
      const user = await this.userService.checkUserExists(payload.sub);
      if (!user) {
        this.logger.warn(`User not found for id=${payload.sub}`);
        return null;
      }

      this.logger.log(`User found: id=${user.id}`);
      return { userId: payload.sub, email: payload.email, role: payload.role };
    } catch (err) {
      this.logger.error('Error fetching user', err.stack || err.message);
      return null;
    }
  }
}
