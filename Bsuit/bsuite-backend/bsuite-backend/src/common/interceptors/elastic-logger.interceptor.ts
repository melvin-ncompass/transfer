import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap, map } from 'rxjs';
import { ActivityService } from 'src/activity/activity.service';
import { Reflector } from '@nestjs/core';
import { ActivityMetadata } from '../decorators/ignore-interceptor.decorator';

@Injectable()
export class ElasticLoggerInterceptor implements NestInterceptor {
  constructor(private readonly activityService: ActivityService, private reflector: Reflector) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ignore = this.reflector.get<boolean>(
      'ignoreInterceptor',
      context.getHandler(),
    );
    if (ignore) {
      return next.handle();
    }

    const ignoreModule = this.reflector.getAllAndOverride<boolean>(
      'ignoreModule',
      [context.getHandler(), context.getClass()],
    );

    const activityMeta = this.reflector.get<ActivityMetadata>(
      'activity_metadata',
      context.getHandler(),
    );


    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse()



   if ((request.method === 'GET' && !activityMeta) || ignoreModule) {
      return next.handle().pipe(
        map((responseData) => ({
          success: true,
          statusCode: response?.statusCode,
          timestamp: new Date().toISOString(),
          message: responseData?.message || 'Operation successful',
          data:
            responseData?.data?.data ??
            responseData?.data ??
            (responseData && !responseData.message ? responseData : null),
        })),
      );
    }

    return next.handle().pipe(
      tap(async (response) => {

        const activity = response?.data;
        let changeOfData = activity?.change_of_data;

        if (activityMeta) {
          changeOfData = activityMeta;
        }

        const activityData = {
          company_id: request.cookies['companyId'],
          username: request.user?.username,
          user_id: request.user?.id,
          change_of_data: changeOfData,
        };

        await this.activityService.logActivity(activityData);
      }),

      map((responseData) => {
        const isDelete = request.method === 'DELETE';

        return {
          success: true,
          statusCode: response?.statusCode,
          timestamp: new Date().toISOString(),
          message: responseData?.message || 'Operation successful',
          data: isDelete
            ? responseData?.data?.data ??
            (responseData && !responseData.message ? responseData : null)
            : responseData?.data?.data ??
            responseData?.data ??
            (responseData && !responseData.message ? responseData : null),
        };
      }),
    );
  }
}

