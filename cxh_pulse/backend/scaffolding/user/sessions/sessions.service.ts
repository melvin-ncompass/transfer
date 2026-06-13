import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Brackets, DataSource } from 'typeorm';
import { SysUserActivityLog } from '../entity/sys_user_activity_log.entity';
import { PaginationDto } from 'scaffolding/common/pagination/dto/pagination.dto';
import { calculateOffset } from 'scaffolding/common/pagination/pagination';
import { PaginatedSessionFilterDto } from './dto/sessions.dto';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly dataSource: DataSource) {}

  async getCurrentSessionLogs(
    userId: string,
    sessionId: string,
    query: PaginationDto,
  ) {
    const { page = 1, limit = 10, search } = query;
    this.logger.log(
      `getSessionLogs called for user ${userId}, session ${sessionId}`,
    );
    try {
      const logsQuery = this.dataSource
        .getRepository(SysUserActivityLog)
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.user', 'user')
        .leftJoinAndSelect('user.userInfo', 'userInfo')
        .leftJoinAndSelect('log.session', 'session')
        .where('user.id = :userId', { userId: userId })
        .andWhere('session.session_id = :sessionId', { sessionId: sessionId })
        .orderBy('log.createdAt', 'DESC');

      if (search) {
        logsQuery.andWhere('log.endpoint ILIKE :parameter', {
          parameter: `%${search}%`,
        });
      }
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
      logs = await logsQuery.getMany();
      this.logger.log(`Fetched ${logs.length} session logs`);
      return logs;
    } catch (error) {
      this.logger.error(`Error in getSessionLogs: ${error.message}`);
      throw error;
    }
  }

  async getAllUserActivityLogs(query: PaginatedSessionFilterDto) {
    const { page, limit, search, userFilter, startDate, endDate } = query;
    try {
      let logs;
      const logsQuery = this.dataSource
        .getRepository(SysUserActivityLog)
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.user', 'user')
        .leftJoinAndSelect('user.userInfo', 'userInfo')
        .leftJoinAndSelect('log.session', 'session')
        .orderBy('log.createdAt', 'DESC');

      if (search) { 
        logsQuery.andWhere(
          new Brackets((qb) => {
            qb.where('log.endpoint ILIKE :parameter', {
              parameter: `%${search}%`,
            })
            .orWhere('log.method ILIKE :parameter', {
              parameter: `%${search}%`,
            })
            .orWhere('log.userAgent ILIKE :parameter', {
              parameter: `%${search}%`,
            })
            .orWhere('userInfo.email ILIKE :parameter', {
              parameter: `%${search}%`,
            });
          })
        );
      }

      if (userFilter) {
        logsQuery.andWhere('user.id = :userFilter', { userFilter: userFilter });
      }

      try { 
        if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        logsQuery.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        });
      } else if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const now = new Date();

        logsQuery.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
          startDate: start.toISOString(),
          endDate: now.toISOString(),
        });
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        logsQuery.andWhere('log.createdAt <= :endDate', {
          endDate: end.toISOString(),
        });
        }
      } catch (error) {
        this.logger.error(`Date parsing error: ${error.message}`);
        throw new Error('Invalid date format provided.');
      }

      if (limit && page) {
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
      this.logger.log(`Fetched ${logs.length} activity logs`);
      return logs;
    } catch (error) {
      this.logger.error(`Error in getAllUserActivityLogs: ${error.message}`);
      throw new BadRequestException('Invalid date format provided.');
    }
  }
}
