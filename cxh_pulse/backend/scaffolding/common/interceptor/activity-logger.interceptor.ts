import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { SysUserActivityLog } from 'scaffolding/user/entity/sys_user_activity_log.entity';
import { SysSession } from 'scaffolding/user/entity/sys_session.entity';

@Injectable()
export class ActivityLoggerInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const userId = request.user?.['userId'];
    const sessionId = request.cookies?.['session_id'];

    console.log('[ActivityLoggerInterceptor] session_id:', sessionId);

    // Skip logging if userId or sessionId is missing
    if (!userId || !sessionId) {
      return next.handle();
    }

    const logRepo = this.dataSource.getRepository(SysUserActivityLog);
    const sessionRepo = this.dataSource.getRepository(SysSession);

    return next.handle().pipe(
      tap(async () => {
        try {
          const sessionEntity = await sessionRepo.findOneBy({
            sessionId: sessionId,
          });

          if (!sessionEntity) {
            console.warn('Session not found for session_id:', sessionId);
            return;
          }

          const log = logRepo.create({
            user: { id: userId },
            session: sessionEntity, // pass full entity with valid primary key
            endpoint: request.url,
            method: request.method,
            requestBody: JSON.stringify(request.body ?? {}),
            userAgent: request.headers['user-agent'] ?? '',
            responseStatus: response.statusCode.toString(),
          });

          console.log('Saving activity log for user:', userId);
          await logRepo.save(log);
        } catch (err) {
          console.error('Failed to save activity log:', err);
        }
      }),
    );
  }
}
