import { Injectable, Logger } from '@nestjs/common';
import { DataSource, In } from 'typeorm';

import {
  CreatePermissionsBulkDto,
  UpdatePermissionDto,
} from './dto/permissions.dto';
import { SysPermission } from '../entity/sys_permission.entity';
import { BizPermission } from 'src/visualizationV1/entity/biz_permission.entity';
import { BizRolePermission } from 'src/visualizationV1/entity/biz_role_permission.entity';
import { SysRolePermission } from '../entity/sys_role_permission.entity';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(private dataSource: DataSource) {}

  // async createPermission(createPermissionDto: CreatePermissionDto) {
  //   this.logger.log(
  //     `createPermission called with body: ${JSON.stringify(createPermissionDto)}`,
  //   );

  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const repo = this.dataSource.getRepository(Permission);

  //     this.logger.debug(
  //       `Checking if permission exists: ${createPermissionDto.name}`,
  //     );
  //     const existing = await repo.findOne({
  //       where: { name: createPermissionDto.name },
  //     });

  //     if (existing) {
  //       this.logger.warn(
  //         `Permission already exists: ${createPermissionDto.name}`,
  //       );
  //       throw new Error(
  //         `Permission with name ${createPermissionDto.name} already exists`,
  //       );
  //     }

  //     this.logger.debug('Creating permission entity');
  //     const permission = queryRunner.manager.getRepository(Permission).create({
  //       name: createPermissionDto.name,
  //       description: createPermissionDto.description,
  //     });
  //     const savedPermission = await queryRunner.manager
  //       .getRepository(Permission)
  //       .save(permission);

  //     this.logger.log(
  //       `Permission created successfully with ID: ${savedPermission.id}`,
  //     );
  //     await queryRunner.commitTransaction();
  //     return savedPermission;
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  async createPermissions(dtos: CreatePermissionsBulkDto) {
    this.logger.log(
      `createPermissionsBulk called with ${dtos.permissions.length} items`,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = queryRunner.manager.getRepository(BizPermission);
      const created: BizPermission[] = [];
      const skipped: string[] = [];

      for (const dto of dtos.permissions) {
        const name = dto.name.trim();
        const description = dto.description?.trim() || null;
        const parentId = dto.parentId?.trim() || null;
        const isEnabled = dto.isEnabled ?? true;

        let parent: BizPermission = null;
        if (parentId) {
          parent = await repo.findOne({
            where: { id: parentId },
            withDeleted: true,
          });

          if (!parent) {
            throw new Error(`Parent permission not found for ID: ${parentId}`);
          }

          if (parent.deletedAt) {
            this.logger.log(`Restoring soft-deleted parent: ${parent.name}`);
            await repo.restore(parent.id);
            parent.deletedAt = null;
            await repo.save(parent);
          }
        }

        // :mag: Lookup by name + parent
        const existingPerm = await repo.findOne({
          where: {
            name,
            parent: parent ? { id: parent.id } : null,
          },
          withDeleted: true,
        });

        if (existingPerm) {
          if (existingPerm.deletedAt) {
            this.logger.log(`Restoring soft-deleted permission: ${name}`);
            await repo.restore(existingPerm.id);
            existingPerm.deletedAt = null;
            existingPerm.isEnabled = isEnabled;
            existingPerm.description = description;
            await repo.save(existingPerm);
            created.push(existingPerm);

            // :repeat: Restore children recursively
            const stack = [existingPerm];
            while (stack.length > 0) {
              const current = stack.pop();
              const full = await repo.findOne({
                where: { id: current.id },
                relations: ['children'],
                withDeleted: true,
              });

              for (const child of full?.children || []) {
                if (child.deletedAt) {
                  this.logger.log(`Restoring child permission: ${child.name}`);
                  await repo.restore(child.id);
                  child.deletedAt = null;
                  await repo.save(child);
                }
                stack.push(child);
              }
            }
          } else {
            skipped.push(name);
          }
          continue;
        }

        const permission = repo.create({
          name,
          description,
          isEnabled,
          parent,
        });

        const saved = await repo.save(permission);
        created.push(saved);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Created or restored ${created.length} business permissions`,
      );
      return {
        message: 'Business permissions created or restored successfully',
        created: created.map((p) => ({ id: p.id, name: p.name })),
        skipped,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error in createPermissionsBulk: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    this.logger.log('findAll permissions called');

    try {
      this.logger.debug(
        'Fetching system and business permissions from database',
      );

      const [systemPermissions, businessPermissions] = await Promise.all([
        this.dataSource.getRepository(SysPermission).find({
          relations: ['roleMappings'],
        }),
        this.dataSource.getRepository(BizPermission).find({
          relations: ['parent', 'children', 'roleMappings'],
          order: { createdAt: 'ASC' },
        }),
      ]);

      this.logger.log(`Fetched ${systemPermissions.length} system permissions`);
      this.logger.log(
        `Fetched ${businessPermissions.length} business permissions`,
      );

      const system = systemPermissions.map((perm) => ({
        id: perm.id,
        name: perm.name,
        description: perm.description,
        enabled: perm.isEnabled ?? true,
        createdAt: perm.createdAt,
        updatedAt: perm.updatedAt,
      }));

      // Build a map of all permissions by ID
      const idToNode = new Map<string, any>();
      businessPermissions.forEach((perm) => {
        idToNode.set(perm.id, {
          id: perm.id,
          name: perm.name,
          description: perm.description,
          parentId: perm.parent?.id ?? null,
          enabled: perm.isEnabled ?? true,
          createdAt: perm.createdAt,
          updatedAt: perm.updatedAt,
          children: [],
        });
      });

      // Link children to their parents
      const roots: any[] = [];
      idToNode.forEach((node) => {
        if (node.parentId && idToNode.has(node.parentId)) {
          idToNode.get(node.parentId).children.push(node);
        } else {
          roots.push(node); // root-level permission
        }
      });

      return {
        system,
        business: roots,
      };
    } catch (error) {
      this.logger.error(`Error fetching permissions: ${error.message}`);
      throw error;
    }
  }

  // async updatePermission(id: string, updatePermissionDto: UpdatePermissionDto) {
  //   this.logger.log(
  //     `updatePermission called with id: ${id}, description: ${updatePermissionDto.description}`,
  //   );

  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const repo = this.dataSource.getRepository(SysPermission);

  //     this.logger.debug(`Checking if permission exists with ID: ${id}`);
  //     const permission = await repo.findOne({ where: { id } });

  //     if (!permission) {
  //       this.logger.warn(`Permission not found with ID: ${id}`);
  //       throw new Error(`Permission with ID ${id} not found`);
  //     }

  //     this.logger.debug(`Updating permission with ID: ${id}`);
  //     const updatePayload: Partial<SysPermission> = {};

  //     if (updatePermissionDto.description) {
  //       updatePayload.description = updatePermissionDto.description;
  //     }

  //     await queryRunner.manager
  //       .getRepository(SysPermission)
  //       .update(id, updatePayload);

  //     this.logger.log(`Permission updated successfully with ID: ${id}`);
  //     await queryRunner.commitTransaction();
  //     return { message: 'Permission updated successfully' };
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  async updatePermission(id: string, dto: UpdatePermissionDto) {
    this.logger.log(`updatePermission called with id: ${id}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sysRepo = queryRunner.manager.getRepository(SysPermission);
      const bizRepo = queryRunner.manager.getRepository(BizPermission);

      let repo: typeof sysRepo | typeof bizRepo;
      let permission;

      // System permissions: no parent relation
      permission = await sysRepo.findOne({ where: { id } });
      repo = sysRepo;

      // Business permissions: include parent relation
      if (!permission) {
        permission = await bizRepo.findOne({
          where: { id },
          relations: ['parent'],
        });
        repo = bizRepo;
      }

      if (!permission) {
        this.logger.warn(`Permission not found with ID: ${id}`);
        throw new Error(`Permission with ID ${id} not found`);
      }

      const updatePayload: Partial<SysPermission | BizPermission> = {};

      // Handle name update
      if (dto.name && dto.name.trim() !== permission.name) {
        const name = dto.name.trim();

        if (repo === bizRepo) {
          // Business: check duplicates under same parent
          const parentId = permission.parent?.id ?? null;
          const duplicate = await repo.findOne({
            where: {
              name,
              parent: parentId ? { id: parentId } : null,
            },
          });

          if (duplicate && duplicate.id !== permission.id) {
            throw new Error(
              `Duplicate permission name '${name}' under the same parent`,
            );
          }
        } else {
          // System: check duplicates globally
          const duplicate = await repo.findOne({ where: { name } });
          if (duplicate && duplicate.id !== permission.id) {
            throw new Error(`Duplicate system permission name '${name}'`);
          }
        }

        updatePayload.name = name;
      }

      // Handle description update
      if (dto.description) {
        updatePayload.description = dto.description.trim();
      }

      // Apply update if needed
      if (Object.keys(updatePayload).length > 0) {
        await repo.update(id, updatePayload);
        this.logger.log(`Permission updated successfully with ID: ${id}`);
      } else {
        this.logger.log(`No changes detected for permission ID: ${id}`);
      }

      await queryRunner.commitTransaction();
      return { message: 'Permission updated successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error updating permission: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async softDeletePermission(id: string) {
    this.logger.log(`softDeletePermission called with id: ${id}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sysRepo = queryRunner.manager.getRepository(SysPermission);
      const bizRepo = queryRunner.manager.getRepository(BizPermission);
      const roleMapRepo = queryRunner.manager.getRepository(BizRolePermission);

      this.logger.debug(`Checking SysPermission with ID: ${id}`);
      const sysPerm = await sysRepo.findOne({
        where: { id },
        withDeleted: true,
      });

      if (sysPerm) {
        if (sysPerm.deletedAt) {
          this.logger.log(`SysPermission with ID ${id} is already deleted`);
          return { message: 'System permission is already deleted' };
        }

        this.logger.debug(`Soft deleting SysPermission with ID: ${id}`);
        await sysRepo.softDelete(id);

        this.logger.debug(`Removing role mappings for SysPermission ID: ${id}`);
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(SysRolePermission)
          .where('permissionId = :id', { id })
          .execute();

        await queryRunner.commitTransaction();
        return { message: 'System permission soft-deleted successfully' };
      }

      this.logger.debug(`Checking BizPermission with ID: ${id}`);
      const bizPerm = await bizRepo.findOne({
        where: { id },
        relations: ['children'],
        withDeleted: true,
      });

      if (!bizPerm) {
        this.logger.warn(`Permission not found in either table with ID: ${id}`);
        throw new Error(`Permission with ID ${id} not found`);
      }

      if (bizPerm.deletedAt) {
        this.logger.log(`BizPermission with ID ${id} is already deleted`);
        return { message: 'Business permission is already deleted' };
      }

      const toDelete: string[] = [bizPerm.id];
      const stack = [...(bizPerm.children || [])];

      while (stack.length > 0) {
        const current = stack.pop();
        if (current && !toDelete.includes(current.id)) {
          toDelete.push(current.id);
          const full = await bizRepo.findOne({
            where: { id: current.id },
            relations: ['children'],
            withDeleted: true,
          });
          if (full?.children?.length) {
            stack.push(...full.children);
          }
        }
      }

      this.logger.debug(`Soft deleting BizPermissions: ${toDelete.join(', ')}`);
      await bizRepo.softDelete(toDelete);

      this.logger.debug(`Removing role mappings for BizPermissions`);
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(BizRolePermission)
        .where('permissionId IN (:...ids)', { ids: toDelete })
        .execute();

      await queryRunner.commitTransaction();
      return {
        message:
          'Business permission and its children soft-deleted successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error during soft delete: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async restorePermission(id: string) {
    this.logger.log(`restorePermission called with id: ${id}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = this.dataSource.getRepository(SysPermission);
      const permission = await repo.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!permission) {
        this.logger.warn(`Permission not found with ID: ${id}`);
        throw new Error(`Permission not found with ID: ${id}`);
      }

      if (!permission.deletedAt) {
        this.logger.log(`Permission with ID ${id} is already active`);
        return { message: 'Permission is already active' };
      }

      await queryRunner.manager.getRepository(SysPermission).restore(id);
      this.logger.log(`Permission restored successfully with ID: ${id}`);
      await queryRunner.commitTransaction();
      return { message: 'Permission restored successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async hardDeletePermission(id: string) {
    this.logger.log(`hardDeletePermission called with id: ${id}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sysRepo = queryRunner.manager.getRepository(SysPermission);
      const bizRepo = queryRunner.manager.getRepository(BizPermission);

      this.logger.debug(`Checking SysPermission with ID: ${id}`);
      const sysPerm = await sysRepo.findOne({
        where: { id },
        withDeleted: true,
      });

      if (sysPerm) {
        this.logger.debug(`Removing role mappings for SysPermission ID: ${id}`);
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(SysRolePermission)
          .where('permissionId = :id', { id })
          .execute();

        this.logger.debug(`Hard deleting SysPermission with ID: ${id}`);
        await sysRepo.delete(id);

        await queryRunner.commitTransaction();
        return { message: 'System permission hard-deleted successfully' };
      }

      this.logger.debug(`Checking BizPermission with ID: ${id}`);
      const bizPerm = await bizRepo.findOne({
        where: { id },
        relations: ['children'],
        withDeleted: true,
      });

      if (!bizPerm) {
        this.logger.warn(`Permission not found in either table with ID: ${id}`);
        throw new Error(`Permission with ID ${id} not found`);
      }

      const toDelete: string[] = [bizPerm.id];
      const stack = [...(bizPerm.children || [])];

      while (stack.length > 0) {
        const current = stack.pop();
        if (current && !toDelete.includes(current.id)) {
          toDelete.push(current.id);
          const full = await bizRepo.findOne({
            where: { id: current.id },
            relations: ['children'],
            withDeleted: true,
          });
          if (full?.children?.length) {
            stack.push(...full.children);
          }
        }
      }

      this.logger.debug(`Removing role mappings for BizPermissions`);
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(BizRolePermission)
        .where('permissionId IN (:...ids)', { ids: toDelete })
        .execute();

      this.logger.debug(`Hard deleting BizPermissions: ${toDelete.join(', ')}`);
      await bizRepo.delete(toDelete);

      await queryRunner.commitTransaction();
      return {
        message:
          'Business permission and its children hard-deleted successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error during hard delete: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
