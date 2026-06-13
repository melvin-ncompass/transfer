import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { MailerService } from 'scaffolding/common/email-service/mail.service';
import {
  DefaultRoleEnum,
  RequestStatus,
  RequestStatusEnum,
} from 'scaffolding/common/enum/enum';
import { sortByStatus } from 'scaffolding/common/utils/sort-by-status.utils';
import { DataSource, In } from 'typeorm';
import { SysPassword } from '../entity/sys_password.entity';
import { SysRole } from '../entity/sys_role.entity';
import { SysUser } from '../entity/sys_user.entity';
import { SysUserInfo } from '../entity/sys_user_info.entity';
import { SysUserRequest } from '../entity/sys_user_request.entity';
import { SysUserRole } from '../entity/sys_user_role.entity';
import {
  CheckRequestDto,
  CreateUserRequestDto,
} from './dto/signup-request.dto';
import { BrandingEnum } from '../../common/enum/enum';

@Injectable()
export class SignupRequestService {
  private readonly logger = new Logger(SignupRequestService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) { }

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
        roleNames = [DefaultRoleEnum.CONTRIBUTOR],
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
        where: {
          userInfo: { id: userInfo.id },
          status: RequestStatusEnum.PENDING,
        },
        order: { requestedAt: 'DESC' },
      });

      if (existingRequest) {
        this.logger.warn(
          `Pending request already exists for email: ${requestEmail}`,
        );
        throw new ConflictException('A pending request already exists');
      }

      let rejectedRequest = await requestRepo.findOne({
        where: {
          userInfo: { id: userInfo.id },
          status: RequestStatusEnum.DENIED,
        },
        order: { requestedAt: 'DESC' },
      });
      if (
        rejectedRequest &&
        rejectedRequest.status === RequestStatusEnum.DENIED
      ) {
        rejectedRequest = requestRepo.merge(rejectedRequest, {
          password: await bcrypt.hash(password, 10),
          requestedAt: new Date(),
          status: RequestStatusEnum.PENDING,
        });
      }
      else {
        rejectedRequest = requestRepo.create({
          userInfo,
          password: await bcrypt.hash(password, 10),
          requestedAt: new Date(),
          status: RequestStatusEnum.PENDING,
        });

      }

      const savedRequest = await requestRepo.save(rejectedRequest);
      await queryRunner.commitTransaction();
      this.logger.log(`User request created with ID: ${savedRequest.id}`);

      const superAdminRole = await manager
        .getRepository(SysRole)
        .findOne({ where: { name: DefaultRoleEnum.SUPER_ADMIN } });

      if (superAdminRole) {
        const superAdmins = await this.dataSource
          .getRepository(SysUserRole)
          .find({
            where: { role: { id: superAdminRole.id } },
            relations: ['user', 'user.userInfo'],
          });

        const encodedEmail = encodeURIComponent(requestEmail);
        const BASE_URL = this.configService.get('CALLBACK_URL');
        const redirctUrl = `${BASE_URL}/users?status=request&search=${encodedEmail}`;

        const subject = `New User Registration: Action Required`;
        // const title = 'New User Registration';

        const bodyLines = [
          'A new user has submitted a registration request. Please review the details and process this registration.',
          `• Name: ${name}`,
          `• Email: ${requestEmail}`,
          phone ? `• Phone: ${phone}` : ''
        ].filter(line => line !== '');
        await Promise.all(
          superAdmins.map((admin) => {
            const email = admin.user?.userInfo?.email;
            const name =
              admin.user?.userInfo?.name || DefaultRoleEnum.SUPER_ADMIN;
            if (!email) return;
            return this.mailerService.sendMail(
              email,
              subject,
              [`Hello ${name},`, ...bodyLines],
              {
                text: 'Process Registration',
                url: redirctUrl,
                linkText: 'Review User'
              },
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

      const toEmail = request.userInfo.email;
      const userName = request.userInfo.name;
      let subject: string;
      let title: string;
      let bodyLines: string[];
      let button: { text: string; url: string; linkText: string } | undefined;

      if (status === RequestStatus.APPROVED) {
        const BASE_URL = this.configService.get('CALLBACK_URL');
        const redirectUrl = `${BASE_URL}/login`;

        subject = `Registration Approved: Access to ${BrandingEnum.COMPANY_NAME}`;
        // title = `Welcome to ${BrandingEnum.COMPANY_NAME}`;
        bodyLines = [
          `Hello ${userName},`,
          `Your registration for access to ${BrandingEnum.COMPANY_NAME} has been approved. You may use the link below to login to the platform.`
        ];
        button = {
          text: 'Sign In',
          url: redirectUrl,
          linkText: 'Sign in to your account'
        };
      } else {
        subject = `Update Regarding Your Registration`;
        // title = 'Registration Status Update';
        bodyLines = [
          `Hello ${userName},`,
          `Your registration for access to ${BrandingEnum.COMPANY_NAME} has been reviewed. At this time, it has not been approved based on current eligibility criteria or internal requirements.`
          // `Thank you for your interest in ${BrandingEnum.COMPANY_NAME}.`
        ];
        button = undefined;
      }
      await this.mailerService.sendMail(toEmail, subject, bodyLines, button);
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
