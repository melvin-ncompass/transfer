import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SysUserActivityLog } from '../entity/sys_user_activity_log.entity';
import { PaginationDto } from 'scaffolding/common/pagination/dto/pagination.dto';
import { calculateOffset } from 'scaffolding/common/pagination/pagination';
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly dataSource: DataSource) {}

  async getCurrentSessionLogs(
    userId: string,
    sessionId: string,
    query: PaginationDto,
  ) {
    const { page = 1, limit = 10 } = query;
    this.logger.log(
      `getSessionLogs called for user ${userId}, session ${sessionId}`,
    );
    try {
      const logsQuery = this.dataSource
        .getRepository(SysUserActivityLog)
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.user', 'user')
        .leftJoinAndSelect('log.session', 'session')
        .where('user.id = :userId', { userId: userId })
        .andWhere('session.session_id = :sessionId', { sessionId: sessionId })
        .orderBy('log.created_at', 'DESC');
      let logs;
      if (page && limit) {
        const offset = calculateOffset(page, limit);
        const total = await logsQuery.getCount();
        logs = await logsQuery.take(limit).skip(offset).getMany();
        if (!logs) {
          throw new NotFoundException('Logs not found');
        }
        this.logger.log(`Fetched ${logs.length} activity logs`);
        return { logs, total };
      }
      logs = await logsQuery.limit(100).getMany();
      this.logger.log(`Fetched ${logs.length} session logs`);
      return logs;
    } catch (error) {
      this.logger.error(`Error in getSessionLogs: ${error.message}`);
      throw error;
    }
  }

  async getAllUserActivityLogs(query: PaginationDto) {
    const { page, limit } = query;
    try {
      let logs;
      const logsQuery = this.dataSource
        .getRepository(SysUserActivityLog)
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.user', 'user')
        .leftJoinAndSelect('user.userInfo', 'userInfo')
        .leftJoinAndSelect('log.session', 'session')
        .orderBy('log.created_at', 'DESC');
      if (limit && page) {
        const offset = calculateOffset(page, limit);
        const total = await logsQuery.getCount(); // added
        logs = await logsQuery.take(limit).skip(offset).getMany();
        if (!logs) {
          throw new NotFoundException('Logs not found');
        }
        this.logger.log(`Fetched ${logs.length} activity logs`);
        return { logs, total };
      }
      logs = await logsQuery.limit(100).getMany();
      this.logger.log(`Fetched ${logs.length} activity logs`);
      return logs;
    } catch (error) {
      this.logger.error(`Error in getAllUserActivityLogs: ${error.message}`);
      throw error;
    }
  }
}
