import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user.service';
import { SysRefreshToken } from '../entity/sys_refresh_token.entity';
import { SysSession } from '../entity/sys_session.entity';
import { SysUser } from '../entity/sys_user.entity';
import { SysUserSession } from '../entity/sys_user_session.entity';
import { SysRole } from '../entity/sys_role.entity';
import { SysUserInfo } from '../entity/sys_user_info.entity';
import { SysUserRole } from '../entity/sys_user_role.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    @InjectRepository(SysRefreshToken)
    private readonly refreshRepo: Repository<SysRefreshToken>,
    @InjectRepository(SysSession)
    private readonly sessionRepo: Repository<SysSession>,
  ) {}

  async validateUser(email: string, password: string): Promise<SysUser> {
    this.logger.log(`Validating user with email: ${email}`);
    const user = await this.userService.findByEmail(email);

    console.log(user);
    if (!user || !(await bcrypt.compare(password, user.password.password))) {
      this.logger.warn(`Invalid credentials for email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(`User validated: ${user.id}`);
    return user;
  }

  async login(user: SysUser) {
    this.logger.log(`Login initiated for user ID: ${user.id}`);
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (user.isArchived === true) {
      throw new ConflictException('User deactivated. Cannot login!');
    }

    const role = user.roleMappings[0]?.role?.name;

    const refreshTokenValue = this.jwtService.sign(
      { sub: user.id, sessionId },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '7d',
      },
    );

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.userInfo.email, role: role },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      },
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.debug(`Creating refresh token`);
      const refreshTokenInsert = await queryRunner.manager
        .getRepository(SysRefreshToken)
        .save({
          refreshToken: refreshTokenValue,
          issuedAt: now,
          expiresAt: expiresAt,
        });

      this.logger.debug(`Creating session`);
      const sessionInsert = await queryRunner.manager
        .getRepository(SysSession)
        .save({
          sessionId: sessionId,
          sessionInitiatedAt: now,
          expiresAt: expiresAt,
          refreshToken: refreshTokenInsert,
        });
      console.log('log:', sessionInsert);
      this.logger.debug(`Creating user session`);
      await queryRunner.manager.getRepository(SysUserSession).save({
        user: { id: user.id },
        session: sessionInsert,
        refreshToken: refreshTokenInsert,
      });

      await queryRunner.commitTransaction();
      this.logger.log(`Login successful for user ID: ${user.id}`);
      return { accessToken, refreshToken: refreshTokenValue, sessionId };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Login transaction failed: ${error}`);
      throw new InternalServerErrorException('Login transaction failed');
    } finally {
      await queryRunner.release();
    }
  }

  async refreshTokens(userId: number, sessionId: string, refreshToken: string) {
    this.logger.log(
      `Refreshing tokens for user ${userId}, session ${sessionId}`,
    );
    try {
      const token = await this.refreshRepo
        .createQueryBuilder('rt')
        .leftJoin(SysUserSession, 'us', 'us.refresh_token_id = rt.id')
        .leftJoin(SysUser, 'u', 'u.id = us.user_id')
        .leftJoin(SysUserInfo, 'ui', 'ui.id = u.user_info_id')
        .leftJoin(SysSession, 's', 's.id = us.session_id')
        .leftJoin(SysUserRole, 'ur', 'ur.userId = u.id') // ✅ join user_role
        .leftJoin(SysRole, 'r', 'r.id = ur.roleId') // ✅ join role

        .where('rt.refresh_token = :refreshToken', { refreshToken })
        .andWhere('rt.deleted_at IS NULL')
        .andWhere('u.deleted_at IS NULL')
        .andWhere('s.deleted_at IS NULL')
        .select([
          'rt.id',
          'rt.expires_at',
          'u.id AS user_id',
          'u.is_archived AS is_archived',
          'ui.email AS user_email',
          's.session_id AS session_id',
          's.session_logout_at AS session_logout_at',
          'r.name AS user_role', // ✅ select role name
        ])
        .getRawOne();

      if (
        !token ||
        token.user_id !== userId ||
        token.session_id !== sessionId ||
        new Date(token.expires_at) < new Date() ||
        token.session_logout_at !== null||
        token.is_archived===true
      ) {
        this.logger.warn(`Invalid or expired refresh token for user ${userId}`);
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      const newAccessToken = this.jwtService.sign(
        {
          sub: token.user_id,
          email: token.user_email,
          role: token.user_role,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '15m',
        },
      );

      this.logger.log(`Access token refreshed for user ${userId}`);
      return { accessToken: newAccessToken };
    } catch (error) {
      this.logger.error(`Refresh token error: ${error.message}`);
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Failed to refresh access token');
    }
  }

  async logout(sessionId: string) {
    this.logger.log(`Logout initiated for session: ${sessionId}`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const session = await queryRunner.manager
        .getRepository(SysSession)
        .findOne({
          where: { sessionId: sessionId },
          relations: ['refreshToken'],
        });

      if (!session) {
        this.logger.warn(`Session not found: ${sessionId}`);
        throw new NotFoundException('Session not found');
      }

      if (session.sessionLogoutAt) {
        this.logger.warn(`Session already expired: ${sessionId}`);
        throw new BadRequestException('Session already expired');
      }

      const now = new Date();

      this.logger.debug(`Marking session and tokens as deleted`);
      await queryRunner.manager
        .getRepository(SysSession)
        .update(
          { sessionId: sessionId },
          { sessionLogoutAt: now, deletedAt: now },
        );

      await queryRunner.manager
        .getRepository(SysRefreshToken)
        .update({ id: session.refreshToken.id }, { deletedAt: now });

      await queryRunner.manager
        .getRepository(SysUserSession)
        .update({ session: { id: session.id } }, { deletedAt: now });

      await queryRunner.commitTransaction();
      this.logger.log(`Logout successful for session: ${sessionId}`);
      return { message: 'Logged out successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Logout failed: ${error.message}`);
      throw new BadRequestException('Logout failed');
    } finally {
      await queryRunner.release();
    }
  }

  decodeRefreshToken(token: string) {
    this.logger.log(`Decoding refresh token`);
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      this.logger.warn(`Invalid refresh token`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
