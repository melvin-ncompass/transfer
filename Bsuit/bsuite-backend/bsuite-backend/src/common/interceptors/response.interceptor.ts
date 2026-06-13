import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map } from 'rxjs/operators';


@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    const ignore = this.reflector.get<boolean>(
      'ignoreInterceptor',
      context.getHandler(),
    );
    if (ignore) {
      return next.handle(); // skip interceptor
    }
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode: response.statusCode,
        timestamp: new Date().toISOString(),
        message: data?.message || "Operation successful",
        data: data?.data ?? (data && !data.message ? data : null),
      }))
    );
  }
}
