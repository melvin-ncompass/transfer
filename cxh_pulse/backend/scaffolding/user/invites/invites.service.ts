import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { CheckInviteDto } from '../signup-request/dto/signup-request.dto';
import { InviteUserDto, AcceptInviteDto } from './dto/invites.dto';
import { SysRole } from '../entity/sys_role.entity';
import { SysUserInfo } from '../entity/sys_user_info.entity';
import { SysUserInvite } from '../entity/sys_user_invite.entity';
import { SysUser } from '../entity/sys_user.entity';
import { SysPassword } from '../entity/sys_password.entity';
import { SysUserRole } from '../entity/sys_user_role.entity';
import { MailerService } from 'scaffolding/common/email-service/mail.service';
import { BrandingEnum, DefaultRoleEnum, RequestStatusEnum } from '../../common/enum/enum';
import { SysUserRequest } from '../entity/sys_user_request.entity';

@Injectable()
export class InvitesService {
  private readonly logger = new Logger(InvitesService.name);

  constructor(
    private dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) { }

  // ------------------- user invite --------------------

  // async inviteUser(dto: InviteUserDto, invitedBy: number) {
  //   this.logger.log(`inviteUser called for email: ${dto.email}`);
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const infoRepo = queryRunner.manager.getRepository(UserInfo);
  //     const inviteRepo = queryRunner.manager.getRepository(UserInvite);
  //     const roleRepo = queryRunner.manager.getRepository(Role);

  //     // Check if user info already exists
  //     const existingInfo = await infoRepo.findOne({
  //       where: { email: dto.email },
  //     });
  //     if (existingInfo) {
  //       this.logger.warn(`User already exists with email: ${dto.email}`);
  //       throw new ConflictException('User already exists');
  //     }

  //     // Validate role IDs
  //     let validRoleIds: number[] = [];
  //     if (dto.roleIds?.length) {
  //       const roles = await roleRepo.find({ where: { id: In(dto.roleIds) } });
  //       validRoleIds = roles.map((r) => r.id);
  //       const invalidRoleIds = dto.roleIds.filter(
  //         (id) => !validRoleIds.includes(id),
  //       );
  //       if (invalidRoleIds.length) {
  //         this.logger.error(`Invalid role IDs: ${invalidRoleIds.join(', ')}`);
  //         throw new BadRequestException(
  //           `Invalid role IDs: ${invalidRoleIds.join(', ')}`,
  //         );
  //       }
  //     }

  //     // Create UserInfo with role intent
  //     const info = infoRepo.create({
  //       name: dto.name,
  //       email: dto.email,
  //       phone: dto.phone || null,
  //       roleIds: validRoleIds,
  //     });
  //     await infoRepo.save(info);

  //     // Create UserInvite
  //     const inviteToken = uuidv4();
  //     const inviteTokenHash = await bcrypt.hash(inviteToken, 10);
  //     const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  //     const invite = inviteRepo.create({
  //       invite_token_hash: inviteTokenHash,
  //       invitedAt: new Date(),
  //       invitedBy: invitedBy.toString(),
  //       inviteExpiry: expiry,
  //       userInfo: info,
  //     });
  //     await inviteRepo.save(invite);

  //     // generate url
  //     const BASE_URL = this.configService.get('CALLBACK_URL');
  //     const redirctUrl = `${BASE_URL}/user/invite?hash=${inviteTokenHash}`;
  //     const html = `<p> Redirct Url : ${redirctUrl}</p>`;
  //     const subject = 'Message title';
  //     const toEmail = dto.email;

  //     // send invite link
  //     await this.mailerService.sendMail(toEmail, subject, html);

  //     await queryRunner.commitTransaction();
  //     this.logger.log(`Invite created successfully for email: ${dto.email}`);
  //     // return { inviteToken, email: dto.email };
  //     return { msg: 'invite mail send successfully' };
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     this.logger.error(`Error in inviteUser: ${error.message}`);
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  async inviteUser(dto: InviteUserDto, invitedBy: number) {
    this.logger.log(`inviteUser called for email: ${dto.email}`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(SysUser);
      const infoRepo = queryRunner.manager.getRepository(SysUserInfo);
      const inviteRepo = queryRunner.manager.getRepository(SysUserInvite);
      const roleRepo = queryRunner.manager.getRepository(SysRole);

      // Check if user already exists (not just info)
      const existingUser = await userRepo.findOne({
        where: { userInfo: { email: dto.email } },
        relations: ['userInfo'],
      });
      if (existingUser) {
        this.logger.warn(`User already exists with email: ${dto.email}`);
        throw new ConflictException('User already exists');
      }

      // Check if invite already exists and is still valid
      const existingInvite = await inviteRepo.findOne({
        where: {
          userInfo: { email: dto.email },
          deletedAt: IsNull(),
        },
        relations: ['userInfo'],
        order: { invitedAt: 'DESC' },
      });

      if (existingInvite && existingInvite.inviteExpiry > new Date()) {
        this.logger.warn(
          `Active invite already exists for email: ${dto.email}`,
        );
        throw new ConflictException('User already invited');
      }

      // Validate role IDs
      let validRoleIds: string[] = [];
      if (dto.roleNames?.length) {
        const roles = await roleRepo.find({
          where: { name: In(dto.roleNames) },
        });
        validRoleIds = roles.map((r) => r.id);

        const foundNames = roles.map((r) => r.name);
        const invalidNames = dto.roleNames.filter(
          (name) => !foundNames.includes(name),
        );

        if (invalidNames.length) {
          this.logger.error(`Invalid role names: ${invalidNames.join(', ')}`);
          throw new BadRequestException(
            `Invalid role names: ${invalidNames.join(', ')}`,
          );
        }
      }
      else {
        const fallbackRole = await roleRepo.findOne({
          where: { name: DefaultRoleEnum.CONTRIBUTOR }
        })
        validRoleIds = [fallbackRole.id]
      }

      // Upsert UserInfo
      let userInfo = await infoRepo.findOne({
        where: {
          email: dto.email
        },
        relations: ['requests']
      })
      if (userInfo) {
        const pendingRequest = userInfo.requests?.find(
          (req) => req.status === RequestStatusEnum.PENDING
        );

        if (pendingRequest) {
          this.logger.warn(
            `Cannot invite: User ${dto.email} has a pending signup request.`,
          );
          throw new ConflictException(
            'This user has a pending signup request. Please approve or reject it.',
          );
        }

        const rejectedRequests = userInfo.requests?.filter(
          (req) => req.status === RequestStatusEnum.DENIED
        );

        // Delete rejected requests before inviting again
        if (rejectedRequests?.length) {
          this.logger.log(
            `Deleting rejected requests for email: ${dto.email}`,
          );

          await queryRunner.manager
            .getRepository(SysUserRequest)
            .remove(rejectedRequests);
          // OR use softDelete if your entity supports it
        }

        userInfo.name = dto.name;
        userInfo.phone = dto.phone || null;
        userInfo.roleIds = validRoleIds;
        await infoRepo.save(userInfo);
      } else {
        userInfo = infoRepo.create({
          name: dto.name,
          email: dto.email,
          phone: dto.phone || null,
          roleIds: validRoleIds,
        });
        await infoRepo.save(userInfo);
      }

      // Create new invite
      const inviteToken = uuidv4();
      const inviteTokenHash = await bcrypt.hash(inviteToken, 10);
      const expiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      const invite = inviteRepo.create({
        inviteTokenHash: inviteTokenHash,
        invitedAt: new Date(),
        invitedBy: invitedBy.toString(),
        inviteExpiry: expiry,
        userInfo,
      });
      await inviteRepo.save(invite);

      // Send invite email
      const BASE_URL = this.configService.get('CALLBACK_URL');
      const redirctUrl = `${BASE_URL}/user/invite?hash=${inviteTokenHash}`;
      const subject = `Invitation to Register for ${BrandingEnum.COMPANY_NAME}`;
      // const title = `You're invited to register for ${BrandingEnum.COMPANY_NAME}`;
      const bodyLines = [
        `Hello ${dto.name || 'User'},`,
        `You have been invited to ${BrandingEnum.COMPANY_NAME}. You may use the link below to complete your account setup.`
      ];
      const footerLines = [
        `<strong>Please note:</strong> This invitation link is valid for 72 hours. If the link expires before you can complete your setup, please contact your administrator for a new invitation.`
      ];

      await this.mailerService.sendMail(dto.email, subject, bodyLines, { text: 'Accept Invitation', url: redirctUrl, linkText: 'Open Invitation Link' }, footerLines);

      await queryRunner.commitTransaction();
      this.logger.log(`Invite created successfully for email: ${dto.email}`);
      return { msg: 'invite mail send successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error in inviteUser: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAllInvites() {
    this.logger.log('getAllInvites called');

    try {
      const inviteRepo = this.dataSource.getRepository(SysUserInvite);
      const userRepo = this.dataSource.getRepository(SysUser);

      const rawInvites = await inviteRepo.find({
        where: { isAccountSetUp: false },
        relations: ['userInfo'],
        order: { invitedAt: 'DESC' },
      });

      const enrichedInvites = await Promise.all(
        rawInvites.map(async (invite) => {
          const inviter = await userRepo
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
            .where('user.id = :id', { id: invite.invitedBy })
            .getOne();

          return {
            ...invite,
            invitedBy: inviter,
          };
        }),
      );

      this.logger.log(`Enriched ${enrichedInvites.length} invites`);
      return enrichedInvites;
    } catch (error) {
      this.logger.error(`Error in getAllInvites: ${error.message}`);
      throw error;
    }
  }

  async acceptInvite(dto: AcceptInviteDto) {
    this.logger.log(`acceptInvite called with token`);

    const inviteRepo = this.dataSource.getRepository(SysUserInvite);

    const matchingInvite = await inviteRepo.findOne({
      relations: ['userInfo'],
      where: { inviteTokenHash: dto.inviteToken },
    });

    if (!matchingInvite) {
      this.logger.warn('Invalid invite token');
      throw new BadRequestException('Invalid invite token');
    }

    if (matchingInvite.inviteExpiry < new Date()) {
      this.logger.warn('Invite token expired');
      throw new BadRequestException('Invite token has expired');
    }

    if (matchingInvite.isAccepted && matchingInvite.isAccountSetUp) {
      throw new BadRequestException('Invite already used');
    }

    if (!matchingInvite.isAccepted) {
      matchingInvite.isAccepted = true;
      matchingInvite.acceptedAt = new Date();
      await inviteRepo.save(matchingInvite);
      this.logger.log(
        `Invite accepted for email: ${matchingInvite.userInfo.email}`,
      );
    } else {
      this.logger.log(
        `Invite already accepted for email: ${matchingInvite.userInfo.email}`,
      );
    }

    return {
      email: matchingInvite.userInfo.email,
      name: matchingInvite.userInfo.name,
      userInfoId: matchingInvite.userInfo.id,
      roleIds: matchingInvite.userInfo.roleIds || [],
    };
  }

  async createUserFromInvite(userInfoId: string, password: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const infoRepo = queryRunner.manager.getRepository(SysUserInfo);
      const inviteRepo = queryRunner.manager.getRepository(SysUserInvite);
      const userRepo = queryRunner.manager.getRepository(SysUser);
      const passwordRepo = queryRunner.manager.getRepository(SysPassword);
      const roleRepo = queryRunner.manager.getRepository(SysRole);
      const userRoleRepo = queryRunner.manager.getRepository(SysUserRole);

      const userInfo = await infoRepo.findOne({ where: { id: userInfoId } });
      if (!userInfo) throw new NotFoundException('UserInfo not found');

      const invite = await inviteRepo.findOne({
        where: { userInfo: { id: userInfoId } },
      });
      if (!invite || !invite.isAccepted)
        throw new BadRequestException('Invite not accepted');

      const hashedPassword = await bcrypt.hash(password, 10);
      const passwordEntity = passwordRepo.create({ password: hashedPassword });
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

      invite.isAccountSetUp = true;
      await inviteRepo.save(invite);

      await queryRunner.commitTransaction();
      this.logger.log(`User created from invite for email: ${userInfo.email}`);
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error creating user from invite: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async checkInvite(dto: CheckInviteDto) {
    this.logger.log(`Checking invite token`);

    const inviteRepo = this.dataSource.getRepository(SysUserInvite);
    const userRepo = this.dataSource.getRepository(SysUser);

    // Direct DB lookup using raw token
    const matchingInvite = await inviteRepo.findOne({
      relations: ['userInfo'],
      where: {
        inviteTokenHash: dto.inviteToken,
      },
    });

    if (!matchingInvite) {
      this.logger.warn('Invite token not found');
      throw new BadRequestException('Invalid invite token');
    }

    if (matchingInvite.inviteExpiry < new Date()) {
      this.logger.warn(
        `Invite expired for email: ${matchingInvite.userInfo.email}`,
      );
      throw new BadRequestException('Invite token has expired');
    }

    if (matchingInvite.isAccepted) {
      this.logger.warn(
        `Invite already accepted for email: ${matchingInvite.userInfo.email}`,
      );
      throw new BadRequestException('Invite has already been accepted');
    }

    const existingUser = await userRepo.findOne({
      where: { userInfo: { id: matchingInvite.userInfo.id } },
    });

    if (existingUser) {
      this.logger.warn(
        `User already exists for invite: ${matchingInvite.userInfo.email}`,
      );
      throw new ConflictException('User already onboarded');
    }

    this.logger.log(
      `Invite is valid and pending for: ${matchingInvite.userInfo.email}`,
    );
    return {
      email: matchingInvite.userInfo.email,
      name: matchingInvite.userInfo.name,
      userInfoId: matchingInvite.userInfo.id,
      roleIds: matchingInvite.userInfo.roleIds || [],
    };
  }

  async resendInvite(email: string, invitedBy: number) {
    this.logger.log(`resendInvite called for email: ${email}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(SysUser);
      const inviteRepo = queryRunner.manager.getRepository(SysUserInvite);

      const existingUser = await userRepo.findOne({
        where: { userInfo: { email } },
        relations: ['userInfo'],
      });

      if (existingUser) {
        this.logger.warn(`User already exists with email: ${email}`);
        throw new ConflictException('User already exists');
      }

      const existingInvite = await inviteRepo.findOne({
        where: {
          userInfo: { email },
          deletedAt: IsNull(),
        },
        relations: ['userInfo'],
        order: { invitedAt: 'DESC' },
      });

      if (!existingInvite) {
        this.logger.warn(`No invite found for email: ${email}`);
        throw new NotFoundException('No previous invite found');
      }

      // if (existingInvite.inviteExpiry > new Date()) {
      //   this.logger.warn(`Active invite still valid for email: ${email}`);
      //   throw new ConflictException('Invite is still active');
      // }

      const inviteToken = uuidv4();
      const inviteTokenHash = await bcrypt.hash(inviteToken, 10);
      const expiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      existingInvite.inviteTokenHash = inviteTokenHash;
      existingInvite.invitedAt = new Date();
      existingInvite.inviteExpiry = expiry;
      existingInvite.invitedBy = invitedBy.toString();

      await inviteRepo.save(existingInvite);

      // Send reinvite email
      const BASE_URL = this.configService.get('CALLBACK_URL');
      const redirctUrl = `${BASE_URL}/user/invite?hash=${inviteTokenHash}`;
      const userInfo = existingInvite.userInfo;

      const subject = `Follow-up: Complete Your ${BrandingEnum.COMPANY_NAME} Registration`;
      // const title = `You're reinvited to join ${BrandingEnum.COMPANY_NAME}`;

      const bodyLines = [
        `Hello${userInfo.name ? ` ${userInfo.name}` : ''},`,
        `This is a follow-up invitation to complete your registration for access to ${BrandingEnum.COMPANY_NAME}. You may use the link below to finalize your account setup.`
      ];
      const footerLines = [
        `<strong>Please note:</strong> This invitation link is valid for 72 hours. Please ensure you complete your registration before it expires.`
      ];
      await this.mailerService.sendMail(
        email,
        subject,
        bodyLines,
        {
          text: 'Accept Invitation',
          url: redirctUrl,
          linkText: 'Open Invitation Link'
        },
        footerLines
      );

      await queryRunner.commitTransaction();
      this.logger.log(`Re-invite sent successfully for email: ${email}`);

      return { msg: 'Re-invite mail sent successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error in resendInvite: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
