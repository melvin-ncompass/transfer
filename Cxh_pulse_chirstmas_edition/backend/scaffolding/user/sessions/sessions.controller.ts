import { Controller, Get, UseGuards, Logger, Req, Query } from '@nestjs/common';
import { ApiResponse } from 'scaffolding/common/api-response/api-response.utils';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionService } from './sessions.service';
import { pagination } from 'scaffolding/common/pagination/pagination';
import { PermissionEnum } from 'scaffolding/common/enum/enum';
import { PaginationDto } from 'scaffolding/common/pagination/dto/pagination.dto';

@Controller('users')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private readonly sessionService: SessionService) {}

  @Get('sessionActivityLogs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.READ_SESSION_LOGS)
  async getSessionLogs(@Req() req, @Query() query: PaginationDto) {
    const userId = req.user['userId'];
    const sessionId = req.cookies?.['session_id'];
    if (!userId || !sessionId) {
      return new ApiResponse(null, 'Missing user or session context', 400);
    }
    if (query.limit && query.page) {
      const { logs, total } = await this.sessionService.getCurrentSessionLogs(
        userId,
        sessionId,
        query,
      );
      return pagination(
        logs,
        total,
        query,
        'All session activity logs fetched',
      );
    }
    const { logs } = await this.sessionService.getCurrentSessionLogs(
      userId,
      sessionId,
      query,
    );
    return new ApiResponse(logs, 'Session logs fetched', 200);
  }

  @Get('allUserActivityLogs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.READ_SESSION_LOGS)
  async getAllLogs(@Query() query: PaginationDto) {
    if (query.limit && query.page) {
      const { logs, total } =
        await this.sessionService.getAllUserActivityLogs(query);
      return pagination(logs, total, query, 'All activity logs fetched');
    }
    const result = await this.sessionService.getAllUserActivityLogs(query);
    return new ApiResponse(result, 'All activity logs fetched', 200);
  }
}
