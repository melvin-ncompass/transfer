import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, In, Not, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { SysPassword } from '../entity/sys_password.entity';
import { SysUser } from '../entity/sys_user.entity';
import { SysUserInfo } from '../entity/sys_user_info.entity';
import { SysUserRequest } from '../entity/sys_user_request.entity';
import { SysRole } from '../entity/sys_role.entity';
import { SysUserRole } from '../entity/sys_user_role.entity';
import {
  CreateUserRequestDto,
  CheckRequestDto,
} from './dto/signup-request.dto';
import { MailerService } from 'scaffolding/common/email-service/mail.service';
import { sortByStatus } from 'scaffolding/common/utils/sort-by-status.utils';
import { DefaultRoleEnum, RequestStatus, RequestStatusEnum} from 'scaffolding/common/enum/enum';

@Injectable()
export class SignupRequestService {
  private readonly logger = new Logger(SignupRequestService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async createUserRequest(userRequest: CreateUserRequestDto) {
    this.logger.log(`createUserRequest called for email: ${userRequest.email}`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const {
        email: requestEmail,
        name,
        phone,
        password,
        roleNames = [DefaultRoleEnum.USER],
      } = userRequest;

      const manager = queryRunner.manager;

      const [existingUser, roles] = await Promise.all([
        manager.getRepository(SysUser).findOne({
          where: { userInfo: { email: requestEmail } },
          relations: ['userInfo'],
        }),
        manager.getRepository(SysRole).find({
          where: { name: In(roleNames) },
        }),
      ]);
      
      if (existingUser) {
        this.logger.warn(`User already exists with email: ${requestEmail}`);
        throw new ConflictException('User already exists');
      }
      const validRoleIds = roles.map((r) => r.id);
      const foundNames = roles.map((r) => r.name);
      const invalidNames = roleNames.filter(
        (name) => !foundNames.includes(name),
      );
      if (invalidNames.length) {
        this.logger.error(`Invalid role names: ${invalidNames.join(', ')}`);
        throw new BadRequestException(
          `Invalid role names: ${invalidNames.join(', ')}`,
        );
      }
      const infoRepo = manager.getRepository(SysUserInfo);
      let userInfo = await infoRepo.findOne({ where: { email: requestEmail } });
      if (userInfo) {
        infoRepo.merge(userInfo, {
          name,
          phone: phone || null,
          roleIds: validRoleIds,
        });
      } else {
        userInfo = infoRepo.create({
          name,
          email: requestEmail,
          phone: phone || null,
          roleIds: validRoleIds,
        });
      }
      await infoRepo.save(userInfo);
      const requestRepo = manager.getRepository(SysUserRequest);
      const existingRequest = await requestRepo.findOne({
        where: { userInfo: { id: userInfo.id }, status: RequestStatusEnum.PENDING },
        order: { requestedAt: 'DESC' },
      });
      if (existingRequest) {
        this.logger.warn(
          `Pending request already exists for email: ${requestEmail}`,
        );
        throw new ConflictException('A pending request already exists');
      }
      const request = requestRepo.create({
        userInfo,
        password: await bcrypt.hash(password, 10),
        requestedAt: new Date(),
        status: RequestStatusEnum.PENDING,
      });
      const savedRequest = await requestRepo.save(request);
      await queryRunner.commitTransaction();
      this.logger.log(`User request created with ID: ${savedRequest.id}`);
      const superAdminRole = roles.find(
        (r) => r.name.toLowerCase() === DefaultRoleEnum.SUPER_ADMIN.toLowerCase(),
      );
      if (superAdminRole) {
        const superAdmins = await this.dataSource
          .getRepository(SysUserRole)
          .find({
            where: { role: { id: superAdminRole.id } },
            relations: ['user', 'user.userInfo'],
          });
        const subject = 'New Signup Request on CxH Pulse';
        const html = `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
          <h2 style="margin: 0 0 12px; font-weight: 600;">New User Signup Request</h2>
          <p>A new user has submitted a signup request:</p>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${requestEmail}</li>
            ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ''}
            ${roleNames.length ? `<li><strong>Requested Roles:</strong> ${roleNames.join(', ')}</li>` : ''}
          </ul>
          <p>Please review and process this request in the admin dashboard.</p>
        </div>
      `;
        await Promise.all(
          superAdmins.map((admin) => {
            const email = admin.user?.userInfo?.email;
            const name = admin.user?.userInfo?.name || DefaultRoleEnum.SUPER_ADMIN;
            if (!email) return;
            return this.mailerService.sendMail(
              email,
              subject,
              html.replace('${name}', name),
            );
          }),
        );
      }
      return savedRequest;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error in createUserRequest: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAllRequests() {
    this.logger.log('getAllRequests called');

    try {
      const requestRepo = this.dataSource.getRepository(SysUserRequest);
      const userRepo = this.dataSource.getRepository(SysUser);

      const rawRequests = await requestRepo.find({
        where: [
          { status: RequestStatusEnum.PENDING },
          { status: RequestStatusEnum.DENIED },
          { status: RequestStatusEnum.APPROVED, isAccountSetUp: false },
        ],
        relations: ['userInfo'],
        order: { requestedAt: 'DESC' },
      });

      const sortedRequests = sortByStatus(rawRequests, [
        RequestStatusEnum.PENDING,
        RequestStatusEnum.APPROVED,
        RequestStatusEnum.DENIED,
      ]);

      const enrichedRequests = await Promise.all(
        sortedRequests.map(async (request) => {
          const processedBy = await userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.userInfo', 'info')
            .select([
              'user.id',
              'info.name',
              'info.email',
              'info.phone',
              'info.created_at',
              'info.updated_at',
              'info.deleted_at',
            ])
            .where('user.id = :id', { id: request.processedBy })
            .getOne();

          return {
            ...request,
            processedBy,
          };
        }),
      );

      this.logger.log(`Enriched ${enrichedRequests.length} user requests`);
      return enrichedRequests;
    } catch (error) {
      this.logger.error(`Error in getAllRequests: ${error.message}`);
      throw error;
    }
  }

  async processUserRequest(
    requestId: string,
    processedBy: string,
    status: RequestStatus.APPROVED | RequestStatus.DENIED,
  ) {
    this.logger.log(
      `processUserRequest called for ID: ${requestId}, status: ${status}`,
    );
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const requestRepo = queryRunner.manager.getRepository(SysUserRequest);
      const infoRepo = queryRunner.manager.getRepository(SysUserInfo);
      const userRepo = queryRunner.manager.getRepository(SysUser);
      const passwordRepo = queryRunner.manager.getRepository(SysPassword);
      const roleRepo = queryRunner.manager.getRepository(SysRole);
      const userRoleRepo = queryRunner.manager.getRepository(SysUserRole);
      const request = await requestRepo.findOne({
        where: { id: requestId },
        relations: ['userInfo'],
      });
      if (!request) {
        this.logger.warn(`UserRequest not found for ID: ${requestId}`);
        throw new NotFoundException('UserRequest not found');
      }
      if (request.status !== RequestStatusEnum.PENDING) {
        this.logger.warn(`Request already processed: ${request.status}`);
        throw new BadRequestException('Request is not pending');
      }
      request.status = status;
      request.processedBy = processedBy;
      request.processedAt = new Date();
      if (status === RequestStatus.APPROVED) {
        const userInfo = request.userInfo;
        const existingUser = await userRepo.findOne({
          where: { userInfo: { id: userInfo.id } },
        });
        if (existingUser) {
          this.logger.warn(
            `User already exists for userInfoId: ${userInfo.id}`,
          );
          throw new ConflictException('User already onboarded');
        }
        const passwordEntity = passwordRepo.create({
          password: request.password,
        });
        await passwordRepo.save(passwordEntity);
        const user = userRepo.create({
          userInfo,
          password: passwordEntity,
        });
        const savedUser = await userRepo.save(user);
        for (const roleId of userInfo.roleIds || []) {
          const role = await roleRepo.findOne({ where: { id: roleId } });
          if (role) {
            const mapping = userRoleRepo.create({ user: savedUser, role });
            await userRoleRepo.save(mapping);
          }
        }
        request.isAccountSetUp = true;
      }
      await requestRepo.save(request);
      // Send email
      const toEmail = request.userInfo.email;
      let subject: string;
      let html: string;
      if (status === RequestStatus.APPROVED) {
        const BASE_URL = this.configService.get('CALLBACK_URL');
        const redirectUrl = `${BASE_URL}/?showAuth=true&authTab=sign-in`;
        subject = 'Your user request has been approved by CxH Pulse';
        html = `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
          <h2 style="margin: 0 0 12px; font-weight: 600;">Welcome to CxH Pulse</h2>
          <p style="margin: 0 0 12px;">Hello ${request.userInfo.name},</p>
          <p style="margin: 0 0 16px;">
            We're pleased to inform you that your request has been approved. You can now sign in to your account using the credentials you provided.
          </p>
          <p style="margin: 0 0 16px;">
            <a href="${redirectUrl}" style="display: inline-block; padding: 10px 16px; background-color: #2563EB; color: #FFFFFF; text-decoration: none; border-radius: 6px;">
              Sign In
            </a>
          </p>
          <p style="margin: 0 0 8px; font-size: 12px; color: #6B7280;">
            If the button doesn't work, you can also use the link below:
          </p>
          <p style="margin: 0; font-size: 12px;">
            <a href="${redirectUrl}" style="color: #2563EB; text-decoration: underline;">Sign in to your account</a>
          </p>
        </div>
      `;
      } else {
        subject = 'Your user request has been denied by CxH Pulse';
        html = `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
          <h2 style="margin: 0 0 12px; font-weight: 600;">Request Status Update</h2>
          <p style="margin: 0 0 12px;">Hello ${request.userInfo.name},</p>
          <p style="margin: 0 0 16px;">
            We regret to inform you that your request could not be approved at this time. This decision may be based on eligibility criteria or other internal review factors.
          </p>
          <p style="margin: 0; font-size: 12px; color: #6B7280;">
            Thank you for your interest in CxH Pulse.
          </p>
        </div>
      `;
      }
      await this.mailerService.sendMail(toEmail, subject, html);
      await queryRunner.commitTransaction();
      this.logger.log(`Request ${status} for ID: ${requestId}`);
      return {
        msg: `Request ${status} successfully`,
        ...(status === RequestStatus.APPROVED && {
          email: request.userInfo.email,
          name: request.userInfo.name,
          userInfoId: request.userInfo.id,
          roleIds: request.userInfo.roleIds || [],
        }),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error in processUserRequest: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async checkRequest(dto: CheckRequestDto) {
    this.logger.log(`Checking request token`);

    const requestRepo = this.dataSource.getRepository(SysUserRequest);
    const userRepo = this.dataSource.getRepository(SysUser);

    // Direct DB lookup using raw token hash
    const matchingRequest = await requestRepo.findOne({
      relations: ['userInfo'],
      where: {
        requestTokenHash: dto.requestToken,
      },
    });

    if (!matchingRequest) {
      this.logger.warn('Request token not found');
      throw new BadRequestException('Invalid request token');
    }

    if (
      matchingRequest.requestTokenExpiry &&
      matchingRequest.requestTokenExpiry < new Date()
    ) {
      this.logger.warn(
        `Request token expired for email: ${matchingRequest.userInfo.email}`,
      );
      throw new BadRequestException('Request token has expired');
    }

    // if (matchingRequest.status !== 'pending') {
    //   this.logger.warn(`Request already processed: ${matchingRequest.status}`);
    //   throw new BadRequestException(
    //     `Request has already been ${matchingRequest.status}`,
    //   );
    // }

    if (matchingRequest.status === RequestStatusEnum.PENDING) {
      this.logger.warn(`Request is ${matchingRequest.status}`);
      throw new BadRequestException(`Request is ${matchingRequest.status}`);
    }

    const existingUser = await userRepo.findOne({
      where: { userInfo: { id: matchingRequest.userInfo.id } },
    });

    if (existingUser) {
      this.logger.warn(
        `User already exists for request: ${matchingRequest.userInfo.email}`,
      );
      throw new ConflictException('User already onboarded');
    }

    this.logger.log(
      `Request is valid and pending for: ${matchingRequest.userInfo.email}`,
    );
    return {
      email: matchingRequest.userInfo.email,
      name: matchingRequest.userInfo.name,
      userInfoId: matchingRequest.userInfo.id,
      roleIds: matchingRequest.userInfo.roleIds || [],
    };
  }

  async createUserFromRequest(userInfoId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const infoRepo = queryRunner.manager.getRepository(SysUserInfo);
      const requestRepo = queryRunner.manager.getRepository(SysUserRequest);
      const userRepo = queryRunner.manager.getRepository(SysUser);
      const passwordRepo = queryRunner.manager.getRepository(SysPassword);
      const roleRepo = queryRunner.manager.getRepository(SysRole);
      const userRoleRepo = queryRunner.manager.getRepository(SysUserRole);

      const userInfo = await infoRepo.findOne({ where: { id: userInfoId } });
      if (!userInfo) throw new NotFoundException('UserInfo not found');

      const request = await requestRepo.findOne({
        where: { userInfo: { id: userInfoId } },
      });

      if (!request || request.status !== RequestStatusEnum.APPROVED) {
        this.logger.warn(`Request not approved for userInfoId: ${userInfoId}`);
        throw new BadRequestException('Request is not approved');
      }

      const existingUser = await userRepo.findOne({
        where: { userInfo: { id: userInfoId } },
      });

      if (existingUser) {
        this.logger.warn(`User already exists for userInfoId: ${userInfoId}`);
        throw new ConflictException('User already onboarded');
      }

      const passwordEntity = passwordRepo.create({
        password: request.password,
      });
      await passwordRepo.save(passwordEntity);

      const user = userRepo.create({
        userInfo: userInfo,
        password: passwordEntity,
      });
      const savedUser = await userRepo.save(user);

      for (const roleId of userInfo.roleIds || []) {
        const role = await roleRepo.findOne({ where: { id: roleId } });
        if (role) {
          const mapping = userRoleRepo.create({ user: savedUser, role });
          await userRoleRepo.save(mapping);
        }
      }

      request.isAccountSetUp = true;
      await requestRepo.save(request);

      await queryRunner.commitTransaction();
      this.logger.log(`User created from request for email: ${userInfo.email}`);
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error creating user from request: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
