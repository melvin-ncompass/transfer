import { ArchiveStatus, DefaultRoleEnum, UserTypeEnum } from './../common/enum/enum';
import { SysUserInfo } from './entity/sys_user_info.entity';
import { SysUser } from './entity/sys_user.entity';
import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import * as bcrypt from 'bcrypt';

import {
  CreateUserDto,
  UpdateUserRoleDto,
  DeactivateUserDto,
} from './dto/user.dto';
import { SysPassword } from './entity/sys_password.entity';
import { SysRole } from './entity/sys_role.entity';
import { SysUserRole } from './entity/sys_user_role.entity';
import { SysUserInvite } from './entity/sys_user_invite.entity';
import { SysUserRequest } from './entity/sys_user_request.entity';
import { SysUserSession } from './entity/sys_user_session.entity';
import { PaginationDto } from 'scaffolding/common/pagination/dto/pagination.dto';
import { calculateOffset } from 'scaffolding/common/pagination/pagination';
import { UserStatus } from 'scaffolding/common/enum/enum';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly dataSource: DataSource) {}

  async createUser(dto: CreateUserDto) {
    this.logger.log(`createUser called`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(SysUser);
      const infoRepo = queryRunner.manager.getRepository(SysUserInfo);
      const passwordRepo = queryRunner.manager.getRepository(SysPassword);
      const roleRepo = queryRunner.manager.getRepository(SysRole);
      const userRoleRepo = queryRunner.manager.getRepository(SysUserRole);

      this.logger.debug(`Checking for existing user with email: ${dto.email}`);
      const existing = await infoRepo.findOne({ where: { email: dto.email } });
      if (existing) {
        this.logger.warn(`User already exists with email: ${dto.email}`);
        throw new ConflictException('User already exists');
      }

      this.logger.debug(`Validating role IDs: ${dto.roleIds}`);
      const roles = await roleRepo.find({
        where: { id: In(dto.roleIds || []) },
      });
      const validRoleIds = roles.map((r) => r.id);
      const invalidRoleIds = (dto.roleIds || []).filter(
        (id) => !validRoleIds.includes(id),
      );
      if (invalidRoleIds.length) {
        this.logger.error(`Invalid role IDs: ${invalidRoleIds.join(', ')}`);
        throw new BadRequestException(
          `Invalid role IDs: ${invalidRoleIds.join(', ')}`,
        );
      }

      this.logger.debug(`Hashing password`);
      const hashed = await bcrypt.hash(dto.password, 10);
      const hashedPasswordEntity = passwordRepo.create({ password: hashed });
      await passwordRepo.save(hashedPasswordEntity);

      this.logger.debug(`Creating UserInfo`);
      const info = infoRepo.create({
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        roleIds: validRoleIds,
      });
      await infoRepo.save(info);

      this.logger.debug(`Creating User entity`);
      const user = userRepo.create({
        userInfo: info,
        password: hashedPasswordEntity,
      });
      const savedUser = await userRepo.save(user);

      this.logger.debug(`Mapping roles to user`);
      for (const roleId of validRoleIds) {
        const mapping = userRoleRepo.create({
          user: savedUser,
          role: { id: roleId },
        });
        await userRoleRepo.save(mapping);
      }

      const roleMappings = await userRoleRepo.find({
        where: { user: { id: savedUser.id } },
        relations: ['role'],
      });

      const roleDetails = roleMappings.map((m) => ({
        id: m.role.id,
        name: m.role.name,
        created_at: m.role.createdAt,
        updated_at: m.role.updatedAt,
        deleted_at: m.role.deletedAt,
      }));

      await queryRunner.commitTransaction();
      this.logger.log(`User created successfully with ID: ${savedUser.id}`);

      const { password, ...safeUser } = savedUser;

      return {
        ...safeUser,
        userInfo: {
          ...safeUser.userInfo,
          roleDetails,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error in createUser: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async checkUserExists(id: string) {
    const user = this.dataSource.getRepository(SysUser).findOne({
      where: { id: id, isArchived: false },
    });
    return user;
  }

  async getAllUsers(status: ArchiveStatus, query: PaginationDto) {
    this.logger.log(`getAllUsers called`);
    const { page, limit } = query;
    try {
      let usersQuery = this.dataSource
        .getRepository(SysUser)
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.userInfo', 'userInfo')
        .leftJoinAndSelect('user.roleMappings', 'roleMappings')
        .leftJoinAndSelect('roleMappings.role', 'role');

      if (status !== ArchiveStatus.GET_ALL) {
        usersQuery.andWhere('user.is_archived = :isArchived', {
          isArchived: false,
        });
      }

      let users;
      if (page && limit) {
        const offset = calculateOffset(page, limit);
        const total = await usersQuery.getCount();
        users = await usersQuery.take(limit).skip(offset).getMany();
        this.logger.log(`Fetched ${users.length} users`);
        //return pagination(users, users.length, query);
        return { users, total };
      }
      users = await usersQuery.getMany();
      this.logger.log(`Fetched ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error(`Error in getAllUsers: ${error.message}`);
      throw error;
    }
  }

  async findByEmail(email: string) {
    const user = await this.dataSource.getRepository(SysUser).findOne({
      where: {
        userInfo: { email },
      },
      relations: ['userInfo', 'roleMappings', 'roleMappings.role', 'password'],
    });

    // if (!user) {
    //   throw new NotFoundException(`User not found with email: ${email}`);
    // }

    return user;
  }

  async softDeleteUser(id: string) {
    this.logger.log(`softDeleteUser called with ID: ${id}`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = queryRunner.manager.getRepository(SysUser);
      const user = await repo.findOne({ where: { id }, withDeleted: true });
      if (!user) {
        this.logger.warn(`User not found with ID: ${id}`);
        throw new NotFoundException('User not found');
      }
      if (user.deletedAt) {
        this.logger.log(`User already deleted with ID: ${id}`);
        return { message: 'User already deleted' };
      }

      await repo.softDelete(id);
      await queryRunner.commitTransaction();
      this.logger.log(`User soft-deleted successfully with ID: ${id}`);
      return { message: 'User soft-deleted successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error in softDeleteUser: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async restoreUser(id: string) {
    this.logger.log(`restoreUser called with ID: ${id}`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = queryRunner.manager.getRepository(SysUser);
      const user = await repo.findOne({ where: { id }, withDeleted: true });
      if (!user) {
        this.logger.warn(`User not found with ID: ${id}`);
        throw new NotFoundException('User not found');
      }
      if (!user.deletedAt) {
        this.logger.log(`User already active with ID: ${id}`);
        return { message: 'User already active' };
      }

      await repo.restore(id);
      await queryRunner.commitTransaction();
      this.logger.log(`User restored successfully with ID: ${id}`);
      return { message: 'User restored successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error in restoreUser: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAllUsersV2(status: ArchiveStatus, query: PaginationDto) {
    this.logger.log(`getAllUsersV2 called`);
    const { page, limit } = query;

    try {
      const userRepo = this.dataSource.getRepository(SysUser);
      const inviteRepo = this.dataSource.getRepository(SysUserInvite);
      const requestRepo = this.dataSource.getRepository(SysUserRequest);
      const roleRepo = this.dataSource.getRepository(SysRole);

      const usersQuery = userRepo
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.userInfo', 'userInfo')
        .leftJoinAndSelect('user.roleMappings', 'roleMappings')
        .leftJoinAndSelect('roleMappings.role', 'role');

      if (status !== ArchiveStatus.GET_ALL) {
        usersQuery.andWhere('user.is_archived = :isArchived', {
          isArchived: false,
        });
      }

      const [users, invites, requests] = await Promise.all([
        usersQuery.getMany(),
        inviteRepo.find({ relations: ['userInfo'] }),
        requestRepo.find({ relations: ['userInfo'] }),
      ]);

      this.logger.log(
        `Fetched ${users.length} users, ${invites.length} invites, ${requests.length} requests`,
      );

      const existingUserInfoIds = new Set(
        users.map((u) => u.userInfo?.id).filter(Boolean),
      );

      const filteredInvites = invites.filter(
        (invite) => !existingUserInfoIds.has(invite.userInfo?.id),
      );

      const filteredRequests = requests.filter(
        (request) => !existingUserInfoIds.has(request.userInfo?.id),
      );

      this.logger.log(
        `After filtering duplicates: ${filteredInvites.length} invites, ${filteredRequests.length} requests remain`,
      );

      // Collect all roleIds from invites and requests
      const allRoleIds = [
        ...filteredInvites.flatMap((i) => i.userInfo?.roleIds ?? []),
        ...filteredRequests.flatMap((r) => r.userInfo?.roleIds ?? []),
      ];
      const uniqueRoleIds = Array.from(new Set(allRoleIds));
      const roles = await roleRepo.findBy({ id: In(uniqueRoleIds) });
      const roleMap = new Map(roles.map((r) => [r.id, r]));

      // Enrich invites
      const enrichedInvites = await Promise.all(
        filteredInvites.map(async (invite) => {
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

          const enrichedRoles =
            invite.userInfo?.roleIds
              ?.map((id) => roleMap.get(id))
              .filter(Boolean) ?? [];

          return {
            ...invite,
            invitedBy: inviter,
            userInfo: {
              ...invite.userInfo,
              roles: enrichedRoles,
            },
            type: UserTypeEnum.INVITE,
          };
        }),
      );

      // Enrich requests
      const enrichedRequests = await Promise.all(
        filteredRequests.map(async (request) => {
          const processor = await userRepo
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

          const enrichedRoles =
            request.userInfo?.roleIds
              ?.map((id) => roleMap.get(id))
              .filter(Boolean) ?? [];

          return {
            ...request,
            processedBy: processor,
            userInfo: {
              ...request.userInfo,
              roles: enrichedRoles,
            },
            type: UserTypeEnum.REQUEST,
          };
        }),
      );

      // Enrich users with roles
      const enrichedUsers = users.map((user) => {
        const roles =
          user.roleMappings?.map((rm) => ({
            id: rm.role?.id,
            name: rm.role?.name,
            createdAt: rm.role?.createdAt,
            updatedAt: rm.role?.updatedAt,
            deletedAt: rm.role?.deletedAt,
          })) ?? [];

        return {
          ...user,
          userInfo: {
            ...user.userInfo,
            roles,
          },
          type: UserTypeEnum.USER,
        };
      });

      const flattened = [
        ...enrichedUsers,
        ...enrichedInvites,
        ...enrichedRequests,
      ];

      this.logger.log(
        `Final combined result count: ${flattened.length} (after deduplication)`,
      );
      if (page && limit) {
        const offset = calculateOffset(page, limit);
        const total = flattened.length;
        const flattened_users = flattened.slice(offset, offset + limit);
        //return pagination(flattened_paginated, flattened.length, query);
        return { flattened_users, total };
      }
      return flattened;
    } catch (error) {
      this.logger.error(`Error in getAllUsersV2: ${error.message}`);
      throw error;
    }
  }

  async updateUserRoleByEmail(dto: UpdateUserRoleDto) {
    const { email, roleName } = dto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await queryRunner.manager
        .getRepository(SysRole)
        .createQueryBuilder('role')
        .where('role.name = :roleName', { roleName })
        .getOne();

      if (!role) {
        this.logger.warn(`Role not found: ${roleName}`);
        throw new NotFoundException(`Role '${roleName}' not found`);
      }

      // Try to find user via User entity
      const user = await queryRunner.manager
        .getRepository(SysUser)
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.userInfo', 'info')
        .leftJoinAndSelect('user.roleMappings', 'mapping')
        .leftJoinAndSelect('mapping.role', 'role')
        .where('info.email = :email', { email })
        .getOne();

      if (user) {
        if (user.isArchived) {
          this.logger.warn(`Cannot update role of deactivated user ${email}`);
          throw new BadRequestException(
            `Cannot update role of deactivated user`,
          );
        }
        const existingMapping = user.roleMappings?.[0];

        if (!existingMapping) {
          this.logger.warn(`No role mapping found for user: ${email}`);
          throw new BadRequestException(`User has no role assigned`);
        }

        if (existingMapping.role.id === role.id) {
          this.logger.warn(`User already has role '${roleName}'`);
          throw new ConflictException(
            `User already has the role '${roleName}'`,
          );
        }

        await queryRunner.manager
          .getRepository(SysUserRole)
          .createQueryBuilder()
          .update(SysUserRole)
          .set({ role })
          .where('id = :id', { id: existingMapping.id })
          .execute();

        await queryRunner.commitTransaction();
        this.logger.log(`Role '${roleName}' replaced for ${email}`);
        return { message: `Role '${roleName}' replaced for ${email}` };
      }

      // Fallback: check UserInfo directly
      const userInfo = await queryRunner.manager
        .getRepository(SysUserInfo)
        .createQueryBuilder('info')
        .where('info.email = :email', { email })
        .getOne();

      if (!userInfo) {
        this.logger.warn(`UserInfo not found for email: ${email}`);
        throw new NotFoundException(`User with email ${email} not found`);
      }

      // Replace roleIds with the new role
      await queryRunner.manager
        .getRepository(SysUserInfo)
        .createQueryBuilder()
        .update(SysUserInfo)
        .set({ roleIds: [role.id] })
        .where('id = :id', { id: userInfo.id })
        .execute();

      await queryRunner.commitTransaction();
      this.logger.log(
        `Role '${roleName}' replaced for ${email} (UserInfo only)`,
      );

      return {
        message: `Role '${roleName}' replaced for ${email} (UserInfo only)`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error updating role: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deactivateUser(email: string) {
    this.logger.log(`Deactivation of User called with Email: ${email}`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = queryRunner.manager.getRepository(SysUser);
      const userQuery = repo
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.userInfo', 'info')
        .leftJoinAndSelect('user.roleMappings', 'userRole')
        .leftJoinAndSelect('userRole.role', 'role')
        .where('info.email = :email', { email });

      const user = await userQuery.getOne();
      if (!user) {
        this.logger.warn(`User not found with Email: ${email}`);
        throw new NotFoundException('User not found');
      }

      const deactivatedUser = await userQuery
        .andWhere('user.is_archived = :status', { status: true })
        .getOne();
      if (deactivatedUser) {
        this.logger.log(
          `User already deactivated with ID: ${deactivatedUser.id}`,
        );
        throw new ConflictException('User already deactivated');
      }

      const isSuperAdmin = user.roleMappings.some(
        (rm) => rm.role.name == DefaultRoleEnum.SUPER_ADMIN,
      );

      if (isSuperAdmin) {
        const countSuperAdmin = await queryRunner.manager
          .getRepository(SysUser)
          .createQueryBuilder('user')
          .leftJoin('user.roleMappings', 'roleMap')
          .leftJoin('roleMap.role', 'role')
          .where('user.is_archived = false')
          .andWhere('role.name = :roleName', {
            roleName: DefaultRoleEnum.SUPER_ADMIN,
          })
          .getCount();

        if (countSuperAdmin <= 1) {
          this.logger.log(`User cannot be deactivated`);
          throw new ConflictException(
            'Cannot deactivate this user. At least one superadmin must remain active.',
          );
        }
      }

      await queryRunner.manager.update(
        SysUser,
        { id: user.id },
        { isArchived: true },
      );
      await queryRunner.commitTransaction();
      this.logger.log(`User deactivation successful with ID: ${user.id}`);
      return { message: `User deactivation  successful` };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error in deactivateUser: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async activateUser(email: string) {
    this.logger.log(`Activation of User called with Email: ${email}`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = queryRunner.manager.getRepository(SysUser);
      const userQuery = repo
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.userInfo', 'info')
        .where('info.email = :email', { email });

      const user = await userQuery.getOne();
      if (!user) {
        this.logger.warn(`User not found with Email: ${email}`);
        throw new NotFoundException('User not found');
      }

      const activatedUser = await userQuery
        .andWhere('user.isArchived = :status', { status: false })
        .getOne();
      if (activatedUser) {
        this.logger.log(`User already activated with ID: ${activatedUser.id}`);
        throw new ConflictException('User already activated');
      }

      await repo.update(user.id, { isArchived: false });
      await queryRunner.commitTransaction();
      this.logger.log(`User activation successful with ID: ${user.id}`);
      return { message: `User activation  successful` };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error in activateUser: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async hardDeleteUser(emails: string[]) {
    this.logger.log(`hardDeleteUser called with emails: ${emails.join(', ')}`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const userRepo = queryRunner.manager.getRepository(SysUser);
      const userRoleRepo = queryRunner.manager.getRepository(SysUserRole);
      const userInfoRepo = queryRunner.manager.getRepository(SysUserInfo);
      const passwordRepo = queryRunner.manager.getRepository(SysPassword);
      const userInviteRepo = queryRunner.manager.getRepository(SysUserInvite);
      const userRequestRepo = queryRunner.manager.getRepository(SysUserRequest);
      // Find all users by email
      const users = await userRepo.find({
        where: {
          userInfo: { email: In(emails) },
        },
        withDeleted: true,
        relations: ['userInfo', 'password', 'roleMappings', 'userSessions'],
      });
      // Find all invites and requests with matching emails
      const invites = await userInviteRepo.find({
        where: {
          userInfo: { email: In(emails) },
        },
        relations: ['userInfo'],
      });
      const requests = await userRequestRepo.find({
        where: {
          userInfo: { email: In(emails) },
        },
        relations: ['userInfo'],
      });
      this.logger.debug(
        `Found ${users.length} users, ${invites.length} invites, ${requests.length} requests to delete`,
      );
      const foundEmails = [
        ...users.map((user) => user.userInfo.email),
        ...invites.map((invite) => invite.userInfo.email),
        ...requests.map((request) => request.userInfo.email),
      ];
      const uniqueFoundEmails = Array.from(new Set(foundEmails));
      const notFoundEmails = emails.filter(
        (email) => !uniqueFoundEmails.includes(email),
      );
      if (notFoundEmails.length > 0) {
        this.logger.warn(
          `Some emails not found in any records: ${notFoundEmails.join(', ')}`,
        );
      }
      // Collect all IDs for deletion
      const userIds = users.map((user) => user.id);
      const userInfoIds = [
        ...users.map((user) => user.userInfo.id),
        ...invites.map((invite) => invite.userInfo.id),
        ...requests.map((request) => request.userInfo.id),
      ];
      const uniqueUserInfoIds = Array.from(new Set(userInfoIds));
      const passwordIds = users
        .map((user) => user.password?.id)
        .filter(Boolean);
      const inviteIds = invites.map((invite) => invite.id);
      const requestIds = requests.map((request) => request.id);
      // Delete user role mappings first
      if (userIds.length > 0) {
        const deleteResult = await userRoleRepo.delete({
          user: { id: In(userIds) },
        });
        this.logger.debug(`Deleted ${deleteResult.affected} role mappings`);
      }
      // Delete user sessions if any exist
      const userSessionRepo = queryRunner.manager.getRepository(SysUserSession);
      if (userIds.length > 0) {
        const sessionDeleteResult = await userSessionRepo.delete({
          user: { id: In(userIds) },
        });
        this.logger.debug(
          `Deleted ${sessionDeleteResult.affected || 0} user sessions`,
        );
      }
      // Delete user invites
      if (inviteIds.length > 0) {
        const inviteDeleteResult = await userInviteRepo.delete(inviteIds);
        this.logger.debug(
          `Deleted ${inviteDeleteResult.affected} user invites`,
        );
      }
      // Delete user requests
      if (requestIds.length > 0) {
        const requestDeleteResult = await userRequestRepo.delete(requestIds);
        this.logger.debug(
          `Deleted ${requestDeleteResult.affected} user requests`,
        );
      }
      // Delete the users
      if (userIds.length > 0) {
        const userDeleteResult = await userRepo.delete(userIds);
        this.logger.debug(`Deleted ${userDeleteResult.affected} users`);
      }
      // Explicitly delete UserInfo records (from users, invites, and requests)
      if (uniqueUserInfoIds.length > 0) {
        const userInfoDeleteResult =
          await userInfoRepo.delete(uniqueUserInfoIds);
        this.logger.debug(
          `Deleted ${userInfoDeleteResult.affected} user info records`,
        );
      }
      // Explicitly delete Password records
      if (passwordIds.length > 0) {
        const passwordDeleteResult = await passwordRepo.delete(passwordIds);
        this.logger.debug(
          `Deleted ${passwordDeleteResult.affected} password records`,
        );
      }
      await queryRunner.commitTransaction();
      const totalItemsDeleted = users.length + invites.length + requests.length;
      const successMessage = `Successfully hard-deleted ${users.length} users, ${invites.length} invites, and ${requests.length} requests`;
      if (notFoundEmails.length > 0) {
        const warningMessage = `, but ${notFoundEmails.length} emails were not found: ${notFoundEmails.join(', ')}`;
        this.logger.log(successMessage + warningMessage);
        return {
          message: successMessage + warningMessage,
          deletedCount: {
            users: users.length,
            invites: invites.length,
            requests: requests.length,
            total: totalItemsDeleted,
          },
          deletedEmails: uniqueFoundEmails,
          notFoundEmails: notFoundEmails,
        };
      }
      this.logger.log(successMessage);
      return {
        message: successMessage,
        deletedCount: {
          users: users.length,
          invites: invites.length,
          requests: requests.length,
          total: totalItemsDeleted,
        },
        deletedEmails: uniqueFoundEmails,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error in hardDeleteUser: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
