import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Module } from "./entities/module.entity";
import { DataSource, ILike, In, IsNull, Repository } from "typeorm";
import { Permission } from "./entities/permission.entity";
import * as fs from "fs";
import * as path from "path";
import { Role } from "./entities/role.entity";
import { CreateRoleDto } from "./dto/create-role.dto";
import { Company } from "src/company/entities/company.entity";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UserRole } from "./entities/user-role.entity";
import { UserRoleDto } from "./dto/user-role.dto";
import { User } from "src/auth/entities/user.entity";
import { UserCompanyRelation } from "src/company/entities/user-company-relation.entity";
import { SyncRoleUsersDto } from "./dto/sync-user-role.sto";
import permissionDescriptions from 'src/common/constants/permission-descriptions.json';
import {
  APP_ORDER,
  MODULE_ORDER,
  SUBMODULE_ORDER,
  PERMISSION_ORDER,
  IMMUTABLE_ROLES,
  PROTECTED_ROLES,
  ROLE_PRIORITY_ORDER,
} from 'src/common/constants/rba.constants';

@Injectable()
export class RbaService {
  constructor(
    @InjectRepository(Module)
    private readonly moduleRepo: Repository<Module>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserCompanyRelation)
    private userRelationsRepo: Repository<UserCompanyRelation>,
    private readonly dataSource: DataSource
  ) {}

  async seedModulesAndPermissions() {
    const filePath = path.join(process.cwd(), "rba-structure.json"); // Adjust the path to your JSON file
    const fileContent = fs.readFileSync(filePath, "utf8");
    const structure = JSON.parse(fileContent);

    return await this.dataSource.transaction(async (manager) => {
      const moduleRepo = manager.getRepository(Module);
      const permissionRepo = manager.getRepository(Permission);

      // Store created permissions to later update dependencies
      const permissionMap = new Map<string, Permission>();

      // STEP 1: recursively create/update modules & permissions
      const processModule = async (mod, parent: Module | null = null) => {
        // ---- CREATE OR UPDATE MODULE -------------------------------------
        let moduleEntity = await moduleRepo.findOne({
          where: { moduleName: mod.moduleName, app: mod.app },
        });

        if (!moduleEntity) {
          moduleEntity = moduleRepo.create({
            moduleName: mod.moduleName,
            app: mod.app,
            parentModule: parent,
          });
        } else {
          // Update existing
          moduleEntity.parentModule = parent;
        }

        moduleEntity = await moduleRepo.save(moduleEntity);

        // ---- CREATE OR UPDATE PERMISSIONS --------------------------------
        if (mod.permissions?.length) {
          for (const p of mod.permissions) {
            let permission = await permissionRepo.findOne({
              where: { permissionNameAbrv: p.permissionNameAbrv },
            });

            if (!permission) {
              permission = permissionRepo.create({
                permissionName: p.permissionName,
                permissionNameAbrv: p.permissionNameAbrv,
                module: moduleEntity,
              });
            } else {
              // Update
              permission.permissionName = p.permissionName;
              permission.module = moduleEntity;
            }

            permission = await permissionRepo.save(permission);

            // Save for dependency linking later
            permissionMap.set(p.permissionNameAbrv, permission);

            // TEMP STORE dependency abrv list in entity so we can link later
            (permission as any)._dependencyAbrvs = p.dependencies ?? [];
          }
        }

        // ---- RECURSE FOR CHILDREN ---------------------------------------
        if (mod.children?.length) {
          for (const child of mod.children) {
            await processModule(child, moduleEntity);
          }
        }
      };

      // Run for each top-level module
      for (const mod of structure) {
        await processModule(mod, null);
      }

      // STEP 2: Resolve dependencies AFTER all permissions created.
      for (const [abrv, permission] of permissionMap.entries()) {
        const dependencyAbrvs = (permission as any)._dependencyAbrvs;

        if (!dependencyAbrvs.length) continue;

        const dependencies: Permission[] = [];

        for (const depAbrv of dependencyAbrvs) {
          const depPermission = permissionMap.get(depAbrv);

          if (!depPermission) {
            throw new Error(
              `Dependency "${depAbrv}" not found for permission "${abrv}"`
            );
          }

          dependencies.push(depPermission);
        }

        permission.dependencies = dependencies;
        await permissionRepo.save(permission);
      }

      return { success: true };
    });
  }

  async getModulesWithPermissions(){
    // Fetch all top-level modules
    const modules = await this.moduleRepo.find({
      where: { parentModule: IsNull() },
      relations: [
        "children",
        "permissions",
        "permissions.dependencies", // <-- include dependencies here
        "children.permissions",
        "children.permissions.dependencies", // <-- include children's permissions dependencies
      ],
      order: { id: "ASC" },
    });

    const sortByOrder =
      (orderMap: Record<string, number>, key: string) =>
      (a: any, b: any) =>
        (orderMap[a[key]] ?? 999) - (orderMap[b[key]] ?? 999);

    // Recursive formatter
    const formatModule = (mod: any): any => ({
      moduleName: mod.moduleName,
      app: mod.app,

      permissions:
        mod.permissions
          ?.sort(sortByOrder(PERMISSION_ORDER, "permissionNameAbrv"))
          .map((p) => ({
            permissionName: p.permissionName,
            permissionNameAbrv: p.permissionNameAbrv,
            tooltipDesc: permissionDescriptions[p.permissionNameAbrv] ?? "",
            dependencies: p.dependencies ?? [],
          })) ?? [],

      children:
        mod.children
          ?.sort(sortByOrder(SUBMODULE_ORDER, "moduleName"))
          .map((child) => formatModule(child)) ?? [],
    });

    return modules
      .sort(sortByOrder(MODULE_ORDER, "moduleName"))
      .sort(sortByOrder(APP_ORDER, "app"))
      .map(formatModule);  
  }

  private async validatePermissions(permissionAbrvs: string[]) {
    if (!permissionAbrvs || !permissionAbrvs.length) return [];

    // Remove duplicates
    const uniqueAbrvs = Array.from(new Set(permissionAbrvs));

    // Fetch permissions with dependencies
    const permissions = await this.permissionRepo.find({
      where: { permissionNameAbrv: In(uniqueAbrvs) },
      relations: ["dependencies"],
    });

    if (permissions.length !== uniqueAbrvs.length) {
      const foundAbrvs = permissions.map((p) => p.permissionNameAbrv);
      const missing = uniqueAbrvs.filter((p) => !foundAbrvs.includes(p));
      throw new BadRequestException(
        `Permissions not found: ${missing.join(", ")}`
      );
    }

    // Validate dependencies
    const allAbrvs = new Set(uniqueAbrvs);
    for (const perm of permissions) {
      if (perm.dependencies?.length) {
        for (const dep of perm.dependencies) {
          if (!allAbrvs.has(dep.permissionNameAbrv)) {
            throw new BadRequestException(
              `Permission '${perm.permissionName}' depends on '${dep.permissionName}', which is missing`
            );
          }
        }
      }
    }

    return permissions;
  }

  async getRoleById(roleId: number) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
      relations: ["company", "permissions"],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const userRoles = await this.userRoleRepo.find({
      where: { role: { id: roleId } },
      relations: ["user"],
    });

    const users = userRoles?.map((ur) => ({
      id: ur.user.id,
      username: ur.user.username,
      email: ur.user.email,
    }));

    return {
      id: role.id,
      roleName: role.roleName,
      description: role.description,
      company: role.company,
      permissions: role.permissions,
      users,
    };
  }

  async getAllRoles(companyId: string) {
    const roles = await this.roleRepo.find({
      where: { company: { companyId } },
      relations: ["permissions"],
      order: { roleName: "ASC" },
    });

    const rolesWithUsers = await Promise.all(
      roles.map(async (role) => {
        const userRoles = await this.userRoleRepo.find({
          where: { role: { id: role.id } },
          relations: ["user"],
        });

        const users = userRoles.map((ur) => ({
          id: ur.user.id,
          username: ur.user.username,
          email: ur.user.email,
        }));

        return {
          id: role.id,
          roleName: role.roleName,
          description: role.description,
          company: role.company,
          permissions: role.permissions,
          users,
        };
      }),
    );

    rolesWithUsers.sort((a, b) => {
      const aIdx = ROLE_PRIORITY_ORDER.indexOf(a.roleName);
      const bIdx = ROLE_PRIORITY_ORDER.indexOf(b.roleName);

      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;

      return a.roleName.localeCompare(b.roleName);
    });  
    return rolesWithUsers;
  }

  async getRolesList(companyId: string) {
    const roles = await this.roleRepo.find({
      where: { company: { companyId } },
      order: { roleName: "ASC" },
      select: ["id", "roleName"],
    });
    roles.sort((a, b) => {
      const aIdx = ROLE_PRIORITY_ORDER.indexOf(a.roleName);
      const bIdx = ROLE_PRIORITY_ORDER.indexOf(b.roleName);

      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;

      return a.roleName.localeCompare(b.roleName);
    });  
    return roles;
  }

  async createRole(createRoleDto: CreateRoleDto, companyId: string) {
    const { roleName, description, permissionAbrvs } = createRoleDto;
    const company = await this.companyRepo.findOne({
      where: { companyId: companyId },
    });

    if (!company) {
      throw new NotFoundException("Company not found");
    }
    const existingRole = await this.roleRepo.findOne({
      where: {
        roleName: ILike(roleName),
        company: { companyId: companyId },
      },
    });
    if (existingRole) {
      throw new ConflictException(
        `Role '${roleName}' already exists for this company`
      );
    }

    const permissions = await this.validatePermissions(permissionAbrvs);

    const role = this.roleRepo.create({
      roleName,
      description,
      company,
      permissions,
    });

    const saved = await this.roleRepo.save(role);
    return {
        data: saved,
        change_of_data: {
            id: saved.id,
            role_name: saved.roleName,
            module: 'RBA',
            feature: 'Role',
            status: 'Create'
        },
    };
  }

  async update(roleId: number, updateRoleDto: UpdateRoleDto){
    const { roleName, description, permissionAbrvs } = updateRoleDto;
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
      relations: ["permissions", "company"],
    });
    if (!role) throw new NotFoundException("Role not found");

    if (IMMUTABLE_ROLES.includes(role.roleName)) {
      throw new BadRequestException(
        `Role '${role.roleName}' cannot be modified.`,
      );
    }

    if (roleName && roleName !== role.roleName) {
      if(PROTECTED_ROLES.includes(role.roleName)){
        throw new BadRequestException(
          `Role name cannot be updated for system role '${role.roleName}'.`,
        );
      }
      const existingRole = await this.roleRepo.findOne({
        where: {
          roleName: ILike(roleName),
          company: { id: role.company.id },
        },
      });
      if (existingRole)
        throw new ConflictException(
          `Role '${roleName}' already exists for this company.`
        );
      role.roleName = roleName;
    }

    if (permissionAbrvs) {
      if (permissionAbrvs.length) {
        const permissions = await this.validatePermissions(permissionAbrvs);
        role.permissions = permissions;
      } else {
        role.permissions = [];
      }
    }
    if (description) {
      role.description = description;
    }
    const saved = await this.roleRepo.save(role);
    return {
        data: saved,
        change_of_data: {
            id: saved.id,
            role_name: saved.roleName,
            module: 'RBA',
            feature: 'Role',
            status: 'Update'
        },
    };
  }

  async deleteRole(roleId: number) {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }
    const roleName = role?.roleName
    
    if (PROTECTED_ROLES.includes(role.roleName)) {
      throw new BadRequestException(
        `Role '${role.roleName}' is a system role and cannot be deleted.`,
      );
    }
    const userRoleCount = await this.userRoleRepo.count({
      where: { role: { id: roleId } },
    });

    if (userRoleCount > 0) {
      throw new BadRequestException(
        `Role '${role.roleName}' cannot be deleted because it is assigned to ${userRoleCount} user(s)`,
      );
    }
    await this.roleRepo.remove(role);
    return {
        change_of_data: {
            role_name: roleName,
            module: 'RBA',
            feature: 'Role',
            status: 'Delete'
        },
    };
  }

  async assignRole(dto: UserRoleDto, companyId: string) {
    const { userId, roleId } = dto;
    let user:User|null;
    try {
      user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    } catch (err) {
      throw new BadRequestException(`User ID ${userId} is invalid`);
    }

    const role = await this.roleRepo.findOne({ where: { id: roleId, company : {companyId : companyId} } });
    if (!role) throw new NotFoundException(`Role with ID ${roleId} not found for this company ${companyId}`);
    
    const userInCompany = await this.userRelationsRepo.findOne({ where: { company : {companyId : companyId}, user : {id : userId} } });
    if (!userInCompany) throw new NotFoundException(`User ${user.displayName} is not member of this company ${companyId}`);

    const existing = await this.userRoleRepo.findOne({
      where: { user: { id: userId }, role: { id: roleId } },
    });
    if (existing)
      throw new ConflictException(
        `Role '${role.roleName}' is already assigned to user '${user.displayName}'`,
      );

    const userRole = this.userRoleRepo.create({ user, role });
    const saved = await this.userRoleRepo.save(userRole);
    return {
      data: saved,
      change_of_data: {
          role_name: role.roleName,
          user_displayname: user.displayName,
          user_email: user.email,
          module: 'RBA',
          feature: 'Manage Users',
          status: 'Assign'
      },
    };
  }

  async revokeRole(dto: UserRoleDto, companyId: string){
    const { userId, roleId } = dto;

    let user:User|null;
    try {
      user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    } catch (err) {
      throw new BadRequestException(`User ID ${userId} is invalid`);
    }

    const role = await this.roleRepo.findOne({
      where: { id: roleId, company:{ companyId: companyId } },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }
    const userRole = await this.userRoleRepo.findOne({
      where: { user: { id: userId }, role: { id: roleId } },
    });

    if (!userRole) {
      throw new NotFoundException(
        `Role with ID ${roleId} is not assigned to user with ID ${userId}`,
      );
    }

    const isGlobalAdminRole = role.roleName === 'Global Admin';
    if (isGlobalAdminRole) {
      // 3️⃣ Check if user is Owner of this company
      const ownerRelation = await this.userRelationsRepo.findOne({
        where: {
          user: { id: userId },
          company: { companyId: companyId },
          status: 'Owner',
        },
      });

      if (ownerRelation) {
        throw new BadRequestException(
          'Global Admin role cannot be revoked from the company owner',
        );
      }
    }

    const userRoleCount = await this.userRoleRepo.count({
      where: {
        user: { id: userId },
        role: {
          company: { companyId },
        },
      },
    });

    if (userRoleCount === 1) {
      throw new BadRequestException(
        'User must have at least one role. You cannot remove the last assigned role.',
      );
    }

    await this.userRoleRepo.remove(userRole);
    return {
      change_of_data: {
          role_name: role.roleName,
          user_displayname: user.displayName,
          user_email: user.email,
          module: 'RBA',
          feature: 'Manage Users',
          status: 'Revoke'
      },
    };
  }

  async syncRoleUsers(dto: SyncRoleUsersDto, companyId: string) {
    const { roleId, userIds } = dto;

    const role = await this.roleRepo.findOne({
      where: { id: roleId, company: {companyId:companyId} },
      relations: ['company'],
    });
    if (!role) throw new NotFoundException(`Role with ID ${roleId} not found`);

    const existingUserRoles = await this.userRoleRepo.find({
      where: { role: { id: roleId } },
      relations: ['user'],
    });

    const existingUserIds = existingUserRoles.map((ur) => ur.user.id);

    // 🔹 Determine userIds to add and remove
    const toAddIds = userIds.filter((id) => !existingUserIds.includes(id));
    const toRemoveIds = existingUserIds.filter((id) => !userIds.includes(id));
    let addedUserNames: string[] = [];
    let removedUserNames: string[] = [];

    if (toRemoveIds.length) {
      const roleCounts = await this.userRoleRepo
        .createQueryBuilder('ur')
        .select('ur.user_id', 'userId')
        .addSelect('COUNT(*)', 'count')
        .innerJoin('ur.role', 'role')
        .innerJoin('role.company', 'company')
        .where('ur.user_id IN (:...userIds)', { userIds: toRemoveIds })
        .andWhere('company.company_id = :companyId', { companyId })
        .groupBy('ur.user_id')
        .getRawMany();
  
      const invalidUserIds  = roleCounts
        .filter(r => Number(r.count) === 1)
        .map(r => r.userId);
  
      if (invalidUserIds .length) {
        const invalidUsers = await this.userRepo.find({
          where: { id: In(invalidUserIds) },
          select: ['displayName'],
        });
  
        const displayNames = invalidUsers.map(u => u.displayName);
        throw new BadRequestException(
          `User must have at least one role. Cannot remove last role for users: ${displayNames.join(', ')}`,
        );
      }
    }
    
    if (toAddIds.length) {
      const users = await this.userRepo.find({
        where: { id: In(toAddIds) },
      });

      if (users.length !== toAddIds.length) {
        const foundIds = users.map((u) => u.id);
        const missing = toAddIds.filter((id) => !foundIds.includes(id));
        throw new BadRequestException(`Users not found: ${missing.join(', ')}`);
      }

      // Check user-company relation
      const invalidUsers: number[] = [];
      for (const user of users) {
        const userCompany = await this.userRelationsRepo.findOne({
          where: { user: { id: user.id }, company: { id: role.company.id } },
        });
        if (!userCompany) invalidUsers.push(user.id);
      }
      if (invalidUsers.length) {
        throw new BadRequestException(
          `Users is not member of company: ${invalidUsers.join(', ')}`,
        );
      }

      addedUserNames = users.map((u) => u.displayName);

      const newUserRoles = users.map((user) =>
        this.userRoleRepo.create({ user, role }),
      );
      await this.userRoleRepo.save(newUserRoles);
    }

    if (toRemoveIds.length) {
      const removedUsers = await this.userRepo.find({
        where: { id: In(toRemoveIds) },
        select: ['displayName'],
      });
      removedUserNames = removedUsers.map((u) => u.displayName);

      const toRemove = existingUserRoles.filter((ur) =>
        toRemoveIds.includes(ur.user.id),
      );
      await this.userRoleRepo.remove(toRemove);
    }
    return {
      change_of_data: {
          role_name: role.roleName,
          removed_users:removedUserNames,
          added_users:addedUserNames,
          module: 'RBA',
          feature: 'Manage Users',
          status: 'Update'
      },
    };
  }

  async createDefaultRoles(companyId: number) {
    const allPermissions = await this.permissionRepo.find({
      relations: ['module'], 
    });
    await this.createOrUpdateRole(companyId, 'Global Admin', 'User has full access to all modules and permissions across all apps. Can view, manage, and export all data without restrictions.', allPermissions);
    const booksPerms = allPermissions.filter(p => p.module.app === 'Books');
    await this.createOrUpdateRole(companyId, 'Books Admin', 'User has full administrative access to the Books app. Can view, manage, and export all modules and permissions within Books, but does not have access to other apps.', booksPerms);

    const booksManagerPerms = allPermissions.filter(
      p =>
        p.permissionNameAbrv === 'view_business_settings' ||
        ['Insights', 'Chart of Accounts', 'Transactions'].includes(p.module.moduleName)
    );
    await this.createOrUpdateRole(companyId, 'Books Manager', 'User can view organization settings and has access to manage Insights, Chart of Accounts, and Transactions modules in the Books app.', booksManagerPerms);
    const guestPerms = allPermissions.filter(p =>
      [
        'view_business_settings',
        'view_insights',
        'view_coa',
        'view_transactions',
        'view_opening_balance',
      ].includes(p.permissionNameAbrv)
    );
    await this.createOrUpdateRole(companyId, 'Books Guest', 'User has read-only access to selected modules. User cannot create, update, or manage any data.', guestPerms);

    console.log('Default roles created/updated successfully.');
  }

  private async createOrUpdateRole(
    companyId: number,
    roleName: string,
    description: string,
    permissions: Permission[]
  ) {
    let role = await this.roleRepo.findOne({ where: { roleName, company : {id : companyId} }, relations: ['permissions'] });
    if (!role) {
      role = this.roleRepo.create({ roleName, description, company: {id : companyId} });
    } else {
      role.description = description; 
    }
    role.permissions = permissions;
    await this.roleRepo.save(role);
  }
  
  async getUserPermissions(userId: string, companyId: string) {
    const userRoles = await this.dataSource
      .getRepository(UserRole)
      .createQueryBuilder('userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .leftJoinAndSelect('permission.module', 'module')
      .leftJoin('role.company', 'company')
      .where('userRole.user_id = :userId', { userId })
      .andWhere('company.company_id = :companyId', { companyId }) // using companyId column
      .getMany();

    if (!userRoles || userRoles.length === 0) {
      throw new NotFoundException('No roles found for this user in the company');
    }

    const permissionAbbrSet = new Set<string>();
    userRoles.forEach((userRole) => {
      userRole.role.permissions.forEach((perm) => {
        permissionAbbrSet.add(perm.permissionNameAbrv);
      });
    });

    return Array.from(permissionAbbrSet);
  }

}
