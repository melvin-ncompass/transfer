import {
  Injectable,
  UnauthorizedException,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class  JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const authHeader =
      req.headers['authorization'] || req.headers['Authorization'];
    this.logger.log(`Authorization header: ${authHeader}`);
    if (
      authHeader &&
      typeof authHeader === 'string' &&
      authHeader.startsWith('Bearer ')
    ) {
      const token = authHeader.slice(7);
      this.logger.log(`Extracted token: ${token}`);
    } else {
      this.logger.warn('No Bearer token found in Authorization header');
    }

    const sessionId = req.cookies?.session_id;
    this.logger.log(`Session ID from cookie: ${sessionId}`);
    if (!sessionId) {
      this.logger.warn('Missing session_id cookie');
      throw new UnauthorizedException('Missing session ID');
    }
    
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      this.logger.error(
        `JWT AuthGuard error: ${err}, info: ${JSON.stringify(info)}`,
      );
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
