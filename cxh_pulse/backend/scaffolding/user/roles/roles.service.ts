import { SysUserRole } from '../entity/sys_user_role.entity';
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { SysRole } from '../entity/sys_role.entity';
import { SysPermission } from '../entity/sys_permission.entity';
import { SysRolePermission } from '../entity/sys_role_permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoleDto, UpdateRoleDto } from './dto/roles.dto';
import { BizRolePermission } from 'src/visualizationV1/entity/biz_role_permission.entity';
import { BizPermission } from 'src/visualizationV1/entity/biz_permission.entity';
import { PaginationDto } from 'scaffolding/common/pagination/dto/pagination.dto';
import { calculateOffset } from 'scaffolding/common/pagination/pagination';
import { ArchiveStatus, DefaultRoleEnum } from 'scaffolding/common/enum/enum';
import { viewAllRoles } from './roles.controller';
 const NON_EDITABLE_ROLES:string[]=[
    DefaultRoleEnum.SUPER_ADMIN
  ]
@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(SysRole) private readonly roleRepo: Repository<SysRole>,
    @InjectRepository(SysPermission)
    private readonly permissionRepo: Repository<SysPermission>,
  ) { }

 
  async createRole(createRoleDto: CreateRoleDto) {
    this.logger.log(`createRole called with role_name: ${createRoleDto.name}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = this.dataSource.getRepository(SysRole);

      this.logger.debug(`Checking if role exists: ${createRoleDto.name}`);
      const existing = await repo.findOne({
        where: { name: createRoleDto.name },
      });

      if (existing) {
        this.logger.warn(`Role already exists: ${createRoleDto.name}`);
        throw new Error(`Role ${createRoleDto.name} already exists`);
      }

      this.logger.debug('Creating role entity');
      const role = queryRunner.manager
        .getRepository(SysRole)
        .create({ name: createRoleDto.name });
      const savedRole = await queryRunner.manager
        .getRepository(SysRole)
        .save(role);

      this.logger.log(`Role created successfully with ID: ${savedRole.id}`);
      await queryRunner.commitTransaction();
      return savedRole;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllRoles(query: viewAllRoles) {
    this.logger.log('findAllRoles called');
    const { page, limit, search, isDetailed, status } = query;

    try {
      const rolesQuery = this.dataSource
        .getRepository(SysRole)
        .createQueryBuilder('role')
        .leftJoinAndSelect('role.permissionMappings', 'permissionMapping')
        .leftJoinAndSelect('permissionMapping.permission', 'permission')
        .leftJoinAndSelect('role.visualizationPermissionMappings', 'bizMapping')
        .leftJoinAndSelect('bizMapping.permission', 'bizPermission')
        .leftJoinAndSelect('bizPermission.parent', 'bizParent')
        .leftJoinAndSelect('bizPermission.children', 'bizChildren')
        .leftJoinAndSelect('role.userMappings', 'userMapping')
        .leftJoinAndSelect('userMapping.user', 'user')
        .leftJoinAndSelect('user.userInfo', 'userInfo')
        .orderBy('role.name', 'ASC');

      // if (status !== ArchiveStatus.GET_ALL) {
      //   rolesQuery.andWhere('user.is_archived = :isArchived', { isArchived: false });
      // }

      if (search) {
        rolesQuery.orWhere('role.name ILIKE :parameter', {
          parameter: `%${search}%`,
        });
      }


      const offset = page && limit ? calculateOffset(page, limit) : 0;
      const total = await rolesQuery.getCount();
      const roles = await rolesQuery.take(limit).skip(offset).getMany();

      const enrichedRoles = roles.map((role) => {
        const isEditable=!NON_EDITABLE_ROLES.includes(role.name)

        const bizPermissions =
          role.visualizationPermissionMappings
            ?.map((m) => m.permission)
            .filter((p) => p && !p.deletedAt) ?? [];

        const idToBiz = new Map(
          bizPermissions.map((p) => [
            p.id,
            {
              id: p.id,
              name: p.name,
              description: p.description,
              parentId: p.parent && !p.parent.deletedAt ? p.parent.id : null,
              enabled: p.isEnabled ?? true,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
              children: [],
            },
          ]),
        );

        const bizRoots: any[] = [];
        idToBiz.forEach((node) => {
          if (node.parentId && idToBiz.has(node.parentId)) {
            idToBiz.get(node.parentId).children.push(node);
          } else {
            bizRoots.push(node);
          }
        });

        // let users = role.userMappings?.map((m) => m.user) ?? [];

        // if (status !== ArchiveStatus.GET_ALL) {
        //   users = users.filter((u) => !u.isArchived);
        // }
        const isDetailedBool = String(isDetailed).toLowerCase() === 'true';
        if (!isDetailedBool) {
          return {
            id: role.id,
            name: role.name,
            isDefault: role.isDefault,
            isEditable,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
          }
        }
        else {
          return {
            id: role.id,
            name: role.name,
            isDefault: role.isDefault,
            isEditable,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
            systemPermissions:
              role.permissionMappings
                ?.map((m) => m.permission)
                .filter((p) => p && !p.deletedAt)
                .map((p) => ({
                  id: p.id,
                  name: p.name,
                  description: p.description,
                  enabled: p.isEnabled ?? true,
                  createdAt: p.createdAt,
                  updatedAt: p.updatedAt,
                })) ?? [],
            businessPermissions: bizRoots,
            users:
              role.userMappings
                ?.map((m) => m.user)
                .filter(
                  (u) => status === ArchiveStatus.GET_ALL || !u.isArchived,
                ) ?? [],
            // users: role.userMappings?.map((m) => m.user))?? [],
          };
        }
      });

      this.logger.log(`Successfully fetched ${roles.length} roles`);
      return { roles: enrichedRoles, total };
    } catch (error) {
      this.logger.error(`Error in findAllRoles: ${error.message}`);
      throw error;
    }
  }

  async findRoleById(id: string) {
    this.logger.log(`findRoleById called with id: ${id}`);

    try {
      this.logger.debug(`Looking up role with ID: ${id}`);

      const role = await this.dataSource.getRepository(SysRole).findOne({
        where: { id },
        relations: [
          'permissionMappings',
          'permissionMappings.permission',
          'visualizationPermissionMappings',
          'visualizationPermissionMappings.permission',
          'userMappings',
          'userMappings.user',
          'userMappings.user.userInfo',
        ],
      });

      if (!role) {
        this.logger.warn(`Role not found with ID: ${id}`);
        throw new Error(`Role with ID ${id} not found`);
      }

      this.logger.log(`Role found with ID: ${id}`);
      return role;
    } catch (error) {
      this.logger.error(`Error in findRoleById: ${error.message}`);
      throw error;
    }
  }

  // async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
  //   this.logger.log(
  //     `updateRole called with id: ${id}, role_name: ${updateRoleDto.name}`,
  //   );

  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const repo = this.dataSource.getRepository(Role);

  //     this.logger.debug(`Checking if role exists with ID: ${id}`);
  //     const role = await repo.findOne({ where: { id } });

  //     if (!role) {
  //       this.logger.warn(`Role not found with ID: ${id}`);
  //       throw new Error(`Role with ID ${id} not found`);
  //     }

  //     this.logger.debug(`Updating role with ID: ${id}`);

  //     const updatePayload: Partial<Role> = {};

  //     if (updateRoleDto.name) {
  //       const existingRole = await repo.findOne({
  //         where: {
  //           name: updateRoleDto.name
  //         }
  //       });

  //       if (existingRole) {
  //         throw new ConflictException(`Role name ${updateRoleDto.name} already exists`);
  //       }
  //       updatePayload.name = updateRoleDto.name;
  //     }

  //     await queryRunner.manager.getRepository(Role).update(id, updatePayload);

  //     this.logger.log(`Role updated successfully with ID: ${id}`);
  //     await queryRunner.commitTransaction();
  //     return { message: 'Role updated successfully' };
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  // async softDeleteRole(id: string) {
  //   this.logger.log(`softDeleteRole called with id: ${id}`);

  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const repo = this.dataSource.getRepository(Role);

  //     this.logger.debug(`Checking if role exists with ID: ${id}`);
  //     const role = await repo.findOne({ where: { id } });

  //     if (!role) {
  //       this.logger.warn(`Role not found with ID: ${id}`);
  //       throw new Error(`Role with ID ${id} not found`);
  //     }

  //     this.logger.debug(`Soft deleting role with ID: ${id}`);
  //     await queryRunner.manager.getRepository(Role).softDelete(id);

  //     this.logger.log(`Role soft-deleted successfully with ID: ${id}`);
  //     await queryRunner.commitTransaction();
  //     return { message: 'Role soft-deleted successfully' };
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  async softDeleteRole(roleId: string) {
    this.logger.log(`softDeleteRole called with id: ${roleId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const roleRepository = queryRunner.manager.getRepository(SysRole);
      const userRoleRepository = queryRunner.manager.getRepository(SysUserRole);

      this.logger.debug(`Checking if role exists with ID: ${roleId}`);
      const role = await queryRunner.manager.findOne(SysRole, {
        where: { id: roleId },
        relations: ['userMappings', 'userMappings.user'],
      });

      if (!role) {
        this.logger.warn(`Role not found with ID: ${roleId}`);
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      //Users of the role fallback to default 'user' role
      if (
        role.name === DefaultRoleEnum.CONTRIBUTOR ||
        role.name === DefaultRoleEnum.SUPER_ADMIN
      )
        throw new ForbiddenException(
          `Cannot delete the default ${role.name} role`,
        );

      const fallbackRole = await roleRepository.findOne({
        where: { name: DefaultRoleEnum.CONTRIBUTOR },
        relations: ['permissionMappings', 'permissionMappings.permission'],
      });

      if (!fallbackRole)
        throw new NotFoundException(
          `Fallback ${DefaultRoleEnum.CONTRIBUTOR} role not found`,
        );

      const userRoleMappings = role.userMappings || [];

      if (userRoleMappings.length > 0) {
        for (const map of userRoleMappings) {
          map.role = fallbackRole;
          await userRoleRepository.save(map);
        }
        this.logger.log(
          `Reassigned ${userRoleMappings.length} users from '${role.name}'`,
        );
      }

      this.logger.debug(`Soft deleting role with ID: ${roleId}`);
      await roleRepository.softDelete(roleId);

      this.logger.log(`Role soft-deleted successfully with ID: ${roleId}`);
      await queryRunner.commitTransaction();

      return {
        message: 'Role soft-deleted successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async restoreRole(id: string) {
    this.logger.log(`restoreRole called with id: ${id}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.debug(`Restoring role with ID: ${id}`);
      const repo = this.dataSource.getRepository(SysRole);
      const role = await repo.findOne({ where: { id }, withDeleted: true });

      if (!role) {
        this.logger.warn(`Role not found with ID: ${id}`);
        throw new Error(`Role not found with ID ${id}`);
      }

      if (!role.deletedAt) {
        this.logger.log(`Role with ID ${id} is already active`);
        return { message: 'Role is already active' };
      }

      await queryRunner.manager.getRepository(SysRole).restore(id);
      this.logger.log(`Role restored successfully with ID: ${id}`);
      await queryRunner.commitTransaction();
      return { message: 'Role restored successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // async mapPermissionsToRole(roleId: number, permissionIds: number[]) {
  //   this.logger.log(`Mapping permission IDs to role ${roleId}: ${permissionIds.join(', ')}`);

  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const role = await queryRunner.manager.findOne(Role, { where: { id: roleId } });
  //     if (!role) throw new Error(`Role with ID ${roleId} not found`);

  //     const permissions = await queryRunner.manager.findBy(Permission, {
  //       id: In(permissionIds),
  //     });

  //     if (permissions.length !== permissionIds.length) {
  //       throw new Error('Some permission IDs were not found in the database');
  //     }

  //     const existingMappings = await queryRunner.manager.find(RolePermission, {
  //       where: {
  //         role: { id: roleId },
  //         permission: In(permissions.map((p) => p.id)),
  //       },
  //       relations: ['permission'],
  //     });

  //     const existingIds = new Set(existingMappings.map((m) => m.permission.id));

  //     const newMappings = permissions
  //       .filter((perm) => !existingIds.has(perm.id))
  //       .map((perm) =>
  //         queryRunner.manager.create(RolePermission, { role, permission: perm })
  //       );

  //     await queryRunner.manager.save(RolePermission, newMappings);
  //     await queryRunner.commitTransaction();

  //     return {
  //       message: 'Permissions mapped successfully',
  //       added: newMappings.length,
  //       skipped: existingMappings.length,
  //     };
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  async mapPermissionsToRole(roleId: string, permissionNames: string[]) {
    this.logger.log(
      `Mapping permission names to role ${roleId}: ${permissionNames.join(', ')}`,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await queryRunner.manager.findOne(SysRole, {
        where: { id: roleId },
      });
      if (!role) throw new Error(`Role with ID ${roleId} not found`);

      // Load all system and business permissions
      const [systemPermissions, businessPermissions] = await Promise.all([
        queryRunner.manager.find(SysPermission),
        queryRunner.manager.find(BizPermission, {
          relations: ['parent', 'children'],
        }),
      ]);

      const sysNameToPerm = new Map(systemPermissions.map((p) => [p.name, p]));
      const bizNameToPerm = new Map(
        businessPermissions.map((p) => [p.name, p]),
      );
      const bizIdToPerm = new Map(businessPermissions.map((p) => [p.id, p]));

      const collectedSys = new Map<string, SysPermission>();
      const collectedBiz = new Map<string, BizPermission>();
      const missingNames: string[] = [];

      const collectAncestors = (perm: BizPermission) => {
        if (collectedBiz.has(perm.id)) return;
        collectedBiz.set(perm.id, perm);
        if (perm.parent) {
          const parent = bizIdToPerm.get(perm.parent.id);
          if (parent) collectAncestors(parent);
        }
      };

      const collectDescendants = (perm: BizPermission) => {
        if (collectedBiz.has(perm.id)) return;
        collectedBiz.set(perm.id, perm);
        for (const child of perm.children || []) {
          collectDescendants(child);
        }
      };

      for (const name of permissionNames) {
        if (sysNameToPerm.has(name)) {
          const perm = sysNameToPerm.get(name)!;
          collectedSys.set(perm.id, perm);
        } else if (bizNameToPerm.has(name)) {
          const perm = bizNameToPerm.get(name)!;
          if (!perm.children || perm.children.length === 0) {
            collectAncestors(perm);
          } else {
            collectDescendants(perm);
          }
        } else {
          missingNames.push(name);
        }
      }

      if (missingNames.length > 0) {
        throw new Error(`Permissions not found: ${missingNames.join(', ')}`);
      }

      const sysPermissionsToAssign = Array.from(collectedSys.values());

      const existingMappings = await queryRunner.manager.find(
        SysRolePermission,
        {
          where: {
            role: { id: roleId },
            permission: In(sysPermissionsToAssign.map((p) => p.id)),
          },
          relations: ['permission'],
        },
      );

      const existingIds = new Set(existingMappings.map((m) => m.permission.id));

      const newMappings = sysPermissionsToAssign
        .filter((perm) => !existingIds.has(perm.id))
        .map((perm) =>
          queryRunner.manager.create(SysRolePermission, {
            role,
            permission: perm,
          }),
        );

      await queryRunner.manager.save(SysRolePermission, newMappings);
      await queryRunner.commitTransaction();

      return {
        message:
          'System permissions mapped successfully (business hierarchy respected)',
        added: newMappings.length,
        skipped: existingMappings.length,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error mapping permissions to role: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getPermissionsForRole(roleName: string): Promise<SysPermission[]> {
    const role = await this.roleRepo.findOne({
      where: { name: roleName },
      relations: [
        'permissionMappings',
        'permissionMappings.permission',
        'visualizationPermissionMappings',
        'visualizationPermissionMappings.permission',
      ],
    });

    if (!role) {
      throw new NotFoundException(`Role not found: ${roleName}`);
    }

    return [
      ...role.permissionMappings,
      ...role.visualizationPermissionMappings,
    ].map((rp) => rp.permission.name as unknown as SysPermission);
  }

  async createRoleWithPermissions(
    roleName: string,
    nestedPermissions: { name: string; children?: any[] }[],
  ) {
    const parentMap = new Map<string, string[]>();
    const permissionNames = await this.flattenPermissionsTree(
      nestedPermissions,
      parentMap,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingRole = await queryRunner.manager.findOne(SysRole, {
        where: { name: roleName },
        withDeleted: true,
      });

      let role: SysRole;
      let wasRestored = false;

      if (existingRole) {
        if (!existingRole.deletedAt) {
          throw new ConflictException(`Role ${roleName} already exists`);
        }

        await queryRunner.manager.restore(SysRole, existingRole.id);

        role = await queryRunner.manager.findOneOrFail(SysRole, {
          where: { id: existingRole.id },
        });

        await queryRunner.manager.update(
          SysRole,
          { id: role.id },
          {
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        );

        wasRestored = true;

        await queryRunner.manager.delete(SysRolePermission, {
          role: { id: role.id },
        });
        await queryRunner.manager.delete(BizRolePermission, {
          role: { id: role.id },
        });
      } else {
        role = queryRunner.manager.create(SysRole, { name: roleName });
        await queryRunner.manager.save(role);
      }

      const [systemPermissions, businessPermissions] = await Promise.all([
        queryRunner.manager.find(SysPermission),
        queryRunner.manager.find(BizPermission, {
          relations: ['parent'],
        }),
      ]);

      const sysNameToPerm = new Map(systemPermissions.map((p) => [p.name, p]));
      const bizNameToPerms = new Map<string, BizPermission[]>();
      const bizIdToPerm = new Map(businessPermissions.map((p) => [p.id, p]));

      for (const perm of businessPermissions) {
        if (!bizNameToPerms.has(perm.name)) {
          bizNameToPerms.set(perm.name, []);
        }
        bizNameToPerms.get(perm.name)!.push(perm);
      }

      const collectedSys = new Map<string, SysPermission>();
      const collectedBiz = new Map<string, BizPermission>();
      const missingNames: string[] = [];

      const collectAncestors = (perm: BizPermission) => {
        if (collectedBiz.has(perm.id)) return;
        collectedBiz.set(perm.id, perm);
        if (perm.parent) {
          const parent = bizIdToPerm.get(perm.parent.id);
          if (parent) collectAncestors(parent);
        }
      };

      for (const name of permissionNames) {
        if (sysNameToPerm.has(name)) {
          collectedSys.set(
            sysNameToPerm.get(name)!.id,
            sysNameToPerm.get(name)!,
          );
        } else if (bizNameToPerms.has(name)) {
          const perms = bizNameToPerms.get(name)!;
          const expectedParents = parentMap.get(name) || [];

          for (const perm of perms) {
            if (
              !perm.deletedAt &&
              (!perm.parent || expectedParents.includes(perm.parent.name))
            ) {
              collectAncestors(perm);
            }
          }
        } else {
          missingNames.push(name);
        }
      }

      if (missingNames.length > 0) {
        throw new NotFoundException(
          `Permissions not found: ${missingNames.join(', ')}`,
        );
      }

      const systemMappings = Array.from(collectedSys.values()).map((perm) =>
        queryRunner.manager.create(SysRolePermission, {
          role,
          permission: perm,
        }),
      );

      const businessMappings = Array.from(collectedBiz.values()).map((perm) =>
        queryRunner.manager.create(BizRolePermission, {
          role,
          permission: perm,
        }),
      );

      await queryRunner.manager.save(SysRolePermission, systemMappings);
      await queryRunner.manager.save(BizRolePermission, businessMappings);

      await queryRunner.commitTransaction();

      return {
        message: wasRestored
          ? `Role "${roleName}" restored and permissions updated successfully`
          : `Role "${roleName}" created successfully with permissions mapped`,
        role: {
          id: role.id,
          name: role.name,
        },
        wasRestored,
        added: {
          system: systemMappings.length,
          business: businessMappings.length,
        },
        permissions: {
          system: Array.from(collectedSys.values()).map((p) => p.name),
          business: Array.from(collectedBiz.values()).map((p) => p.name),
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error creating role: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateRoleAndPermissions(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<any> {
    this.logger.log(`updateRoleAndPermissions called with id: ${id}`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const roleRepo = this.dataSource.getRepository(SysRole);
      this.logger.debug(`Checking if role exists with ID: ${id}`);

      const role = await this.roleRepo
        .createQueryBuilder('role')
        .leftJoinAndSelect('role.permissionMappings', 'permissionMappings')
        .leftJoinAndSelect('permissionMappings.permission', 'permission')
        .leftJoinAndSelect(
          'role.visualizationPermissionMappings',
          'bizMappings',
        )
        .leftJoinAndSelect('bizMappings.permission', 'bizPermission')
        .where('role.id = :id', { id })
        .getOne();

      if (!role) {
        this.logger.warn(`Role not found with ID: ${id}`);
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      if (NON_EDITABLE_ROLES.includes(role.name)) {
        this.logger.warn(`Attempted to update protected role: ${role.name}`);
        throw new ForbiddenException(`${role.name} role cannot be updated.`);
      }
      let restoredRole: SysRole | null = null;

      if (updateRoleDto.name) {
        const existingRole = await roleRepo.findOne({
          where: { name: updateRoleDto.name },
          withDeleted: true,
        });

        if (existingRole && existingRole.id !== id) {
          if (existingRole.deletedAt) {
            this.logger.log(
              `Restoring soft-deleted role: ${updateRoleDto.name} and soft-deleting current role: ${role.name}`,
            );
            await queryRunner.manager.restore(SysRole, existingRole.id);
            this.logger.debug(`Restored role with ID: ${existingRole.id}`);
            await queryRunner.manager.delete(SysRolePermission, {
              role: { id: existingRole.id },
            });
            await queryRunner.manager.delete(BizRolePermission, {
              role: { id: existingRole.id },
            });

            const currentRoleWithUsers = await queryRunner.manager.findOne(
              SysRole,
              {
                where: { id: role.id },
                relations: ['userMappings', 'userMappings.user'],
              },
            );

            if (currentRoleWithUsers?.userMappings?.length > 0) {
              for (const userMapping of currentRoleWithUsers.userMappings) {
                userMapping.role = existingRole;
                await queryRunner.manager.save(SysUserRole, userMapping);
              }
            }

            await queryRunner.manager.softDelete(SysRole, role.id);
            restoredRole = await queryRunner.manager.findOne(SysRole, {
              where: { id: existingRole.id },
            });
          } else {
            throw new ConflictException(
              `Role name ${updateRoleDto.name} already exists`,
            );
          }
        } else {
          await queryRunner.manager.update(
            SysRole,
            { id },
            { name: updateRoleDto.name },
          );
          role.name = updateRoleDto.name;
        }
      }

      const parentMap = new Map<string, string[]>();
      const flattened = await this.flattenPermissionsTree(
        updateRoleDto.permission || [],
        parentMap,
      );

      if (flattened.length === 0) {
        throw new BadRequestException(
          'A role must have at least one permission assigned',
        );
      }

      if (restoredRole) {
        await this.setRolePermissions(
          queryRunner,
          restoredRole,
          flattened,
          new Set(flattened),
          updateRoleDto.permission,
          parentMap,
        );
      } else {
        await this.updateRolePermissions(
          queryRunner,
          role,
          flattened,
          new Set(flattened),
          updateRoleDto.permission,
          parentMap,
        );
      }

      await queryRunner.commitTransaction();

      return {
        message: restoredRole
          ? `Role restored and updated successfully. Previous role soft-deleted.`
          : `Role updated successfully`,
        role: {
          id: restoredRole ? restoredRole.id : role.id,
          name: restoredRole ? restoredRole.name : role.name,
        },
        operation: restoredRole ? 'restore_and_replace' : 'normal_update',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error updating role and permissions for role ${id}: ${error.message}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async flattenPermissionsTree(
    nodes: { name: string; children?: any[] }[],
    parentMap: Map<string, string[]>,
    parentName: string | null = null,
  ): Promise<string[]> {
    const names: string[] = [];

    for (const node of nodes) {
      names.push(node.name);

      if (parentName) {
        if (!parentMap.has(node.name)) {
          parentMap.set(node.name, []);
        }
        parentMap.get(node.name)!.push(parentName);
      }

      if (node.children?.length) {
        const childNames = await this.flattenPermissionsTree(
          node.children,
          parentMap,
          node.name,
        );
        names.push(...childNames);
      }
    }

    return names;
  }

  // private async flattenPermissionsTree(
  //   nodes: { name: string; children?: any[] }[],
  // ): Promise<string[]> {
  //   const names: string[] = [];
  //   const traverse = (node: { name: string; children?: any[] }) => {
  //     names.push(node.name);
  //     for (const child of node.children || []) {
  //       traverse(child);
  //     }
  //   };
  //   for (const node of nodes || []) {
  //     traverse(node);
  //   }
  //   return names;
  // }

  private async setRolePermissions(
    queryRunner: any,
    role: SysRole,
    permissionNames: string[],
    requestedNames: Set<string>,
    inputTree: { name: string; children?: any[] }[],
    parentMap: Map<string, string[]>,
  ) {
    const [systemPermissions, allBusinessPermissions] = await Promise.all([
      queryRunner.manager.find(SysPermission, {
        where: { name: In(permissionNames) },
      }),
      queryRunner.manager.find(BizPermission, {
        where: { name: In(permissionNames) },
        relations: ['parent', 'children'],
        withDeleted: true,
      }),
    ]);

    const activeSystemPermissions = systemPermissions.filter(
      (p) => !p.deletedAt,
    );
    const activeBusinessPermissions = allBusinessPermissions.filter(
      (p) => !p.deletedAt,
    );

    const foundNames = [
      ...activeSystemPermissions.map((p) => p.name),
      ...activeBusinessPermissions.map((p) => p.name),
    ];
    const missingNames = permissionNames.filter(
      (name) => !foundNames.includes(name),
    );
    if (missingNames.length > 0) {
      throw new NotFoundException(
        `Permissions not found: ${missingNames.join(', ')}`,
      );
    }

    if (activeSystemPermissions.length > 0) {
      const newSystemMappings = activeSystemPermissions.map((perm) =>
        queryRunner.manager.create(SysRolePermission, {
          role,
          permission: perm,
        }),
      );
      await queryRunner.manager.save(SysRolePermission, newSystemMappings);
      this.logger.debug(`Added ${newSystemMappings.length} system permissions`);
    }

    const allowedChildMap = new Map<string, Set<string>>();
    const buildAllowedMap = (nodes: { name: string; children?: any[] }[]) => {
      for (const node of nodes) {
        if (node.children?.length) {
          allowedChildMap.set(
            node.name,
            new Set(node.children.map((c) => c.name)),
          );
          buildAllowedMap(node.children);
        }
      }
    };
    buildAllowedMap(inputTree);

    const bizIdToPerm = new Map<string, BizPermission>();
    const bizNameToPerms = new Map<string, BizPermission[]>();
    for (const perm of activeBusinessPermissions) {
      bizIdToPerm.set(perm.id, perm);
      if (!bizNameToPerms.has(perm.name)) {
        bizNameToPerms.set(perm.name, []);
      }
      bizNameToPerms.get(perm.name)!.push(perm);
    }

    const collectedBiz = new Map<string, BizPermission>();

    const collectAncestors = (perm: BizPermission) => {
      if (collectedBiz.has(perm.id)) return;
      collectedBiz.set(perm.id, perm);
      if (perm.parent) {
        const parent = bizIdToPerm.get(perm.parent.id);
        if (parent) collectAncestors(parent);
      }
    };

    const collectDescendants = (perm: BizPermission) => {
      if (collectedBiz.has(perm.id)) return;
      collectedBiz.set(perm.id, perm);

      const allowedChildren = allowedChildMap.get(perm.name);
      if (!allowedChildren) return;

      for (const child of perm.children || []) {
        if (allowedChildren.has(child.name)) {
          collectDescendants(child);
        }
      }
    };

    for (const name of permissionNames) {
      const perms = bizNameToPerms.get(name) || [];
      const expectedParents = parentMap.get(name) || [];

      for (const perm of perms) {
        if (
          !perm.deletedAt &&
          (!perm.parent || expectedParents.includes(perm.parent.name))
        ) {
          collectAncestors(perm);
          collectDescendants(perm);
        }
      }
    }

    const allBizToAssign = Array.from(collectedBiz.values());
    if (allBizToAssign.length > 0) {
      const newBusinessMappings = allBizToAssign.map((perm) =>
        queryRunner.manager.create(BizRolePermission, {
          role,
          permission: perm,
        }),
      );
      await queryRunner.manager.save(BizRolePermission, newBusinessMappings);
      this.logger.debug(
        `Added ${newBusinessMappings.length} business permissions`,
      );
    }
  }

  private async updateRolePermissions(
    queryRunner: any,
    role: SysRole,
    updatedPermissions: string[],
    requestedNames: Set<string>,
    inputTree: { name: string; children?: any[] }[],
    parentMap: Map<string, string[]>,
  ) {
    const [systemPermissions, allBusinessPermissions] = await Promise.all([
      queryRunner.manager.find(SysPermission, {
        where: { name: In(updatedPermissions) },
      }),
      queryRunner.manager.find(BizPermission, {
        where: { name: In(updatedPermissions) },
        relations: ['parent', 'children'],
        withDeleted: true,
      }),
    ]);

    const activeSystemPermissions = systemPermissions.filter(
      (p) => !p.deletedAt,
    );
    const activeBusinessPermissions = allBusinessPermissions.filter(
      (p) => !p.deletedAt,
    );

    const foundNames = [
      ...activeSystemPermissions.map((p) => p.name),
      ...activeBusinessPermissions.map((p) => p.name),
    ];
    const missingNames = updatedPermissions.filter(
      (name) => !foundNames.includes(name),
    );
    if (missingNames.length > 0) {
      throw new NotFoundException(
        `Permissions not found: ${missingNames.join(', ')}`,
      );
    }

    // SYSTEM PERMISSIONS
    const activeSystemMappings = role.permissionMappings.filter(
      (rp) => rp.permission && !rp.permission.deletedAt,
    );
    const currentSystemIds = new Set(
      activeSystemMappings.map((rp) => rp.permission.id),
    );
    const systemToAdd = activeSystemPermissions.filter(
      (p) => !currentSystemIds.has(p.id),
    );
    const systemToRemove = activeSystemMappings.filter(
      (rp) => !activeSystemPermissions.some((p) => p.id === rp.permission.id),
    );

    if (systemToRemove.length > 0) {
      const idsToRemove = systemToRemove.map((rp) => rp.id);
      await queryRunner.manager.delete(SysRolePermission, idsToRemove);
      this.logger.debug(`Removed ${idsToRemove.length} system permissions`);
    }

    if (systemToAdd.length > 0) {
      const newSystemMappings = systemToAdd.map((p) =>
        queryRunner.manager.create(SysRolePermission, { role, permission: p }),
      );
      await queryRunner.manager.save(SysRolePermission, newSystemMappings);
      this.logger.debug(`Added ${newSystemMappings.length} system permissions`);
    }

    // BUSINESS PERMISSIONS
    const allowedChildMap = new Map<string, Set<string>>();
    const buildAllowedMap = (nodes: { name: string; children?: any[] }[]) => {
      for (const node of nodes) {
        if (node.children?.length) {
          allowedChildMap.set(
            node.name,
            new Set(node.children.map((c) => c.name)),
          );
          buildAllowedMap(node.children);
        }
      }
    };
    buildAllowedMap(inputTree);

    const bizIdToPerm = new Map<string, BizPermission>();
    const bizNameToPerms = new Map<string, BizPermission[]>();
    for (const perm of activeBusinessPermissions) {
      bizIdToPerm.set(perm.id, perm);
      if (!bizNameToPerms.has(perm.name)) {
        bizNameToPerms.set(perm.name, []);
      }
      bizNameToPerms.get(perm.name)!.push(perm);
    }

    const collectedBiz = new Map<string, BizPermission>();

    const collectAncestors = (perm: BizPermission) => {
      if (collectedBiz.has(perm.id)) return;
      collectedBiz.set(perm.id, perm);
      if (perm.parent) {
        const parent = bizIdToPerm.get(perm.parent.id);
        if (parent) collectAncestors(parent);
      }
    };

    const collectDescendants = (perm: BizPermission) => {
      if (collectedBiz.has(perm.id)) return;
      collectedBiz.set(perm.id, perm);

      const allowedChildren = allowedChildMap.get(perm.name);
      if (!allowedChildren) return;

      for (const child of perm.children || []) {
        if (allowedChildren.has(child.name)) {
          collectDescendants(child);
        }
      }
    };

    for (const name of updatedPermissions) {
      const perms = bizNameToPerms.get(name) || [];
      const expectedParents = parentMap.get(name) || [];

      for (const perm of perms) {
        if (
          !perm.deletedAt &&
          (!perm.parent || expectedParents.includes(perm.parent.name))
        ) {
          collectAncestors(perm);
          collectDescendants(perm);
        }
      }
    }

    const allBizToAssign = Array.from(collectedBiz.values());

    const activeBusinessMappings = role.visualizationPermissionMappings.filter(
      (rp) => rp.permission && !rp.permission.deletedAt,
    );
    const currentBusinessIds = new Set(
      activeBusinessMappings.map((rp) => rp.permission.id),
    );
    const businessToAdd = allBizToAssign.filter(
      (p) => !currentBusinessIds.has(p.id),
    );
    const businessToRemove = activeBusinessMappings.filter(
      (rp) => !allBizToAssign.some((p) => p.id === rp.permission.id),
    );

    if (businessToRemove.length > 0) {
      const idsToRemove = businessToRemove.map((rp) => rp.id);
      await queryRunner.manager.delete(BizRolePermission, idsToRemove);
      this.logger.debug(`Removed ${idsToRemove.length} business permissions`);
    }

    if (businessToAdd.length > 0) {
      const newBusinessMappings = businessToAdd.map((p) =>
        queryRunner.manager.create(BizRolePermission, { role, permission: p }),
      );
      await queryRunner.manager.save(BizRolePermission, newBusinessMappings);
      this.logger.debug(
        `Added ${newBusinessMappings.length} business permissions`,
      );
    }
  }
}
