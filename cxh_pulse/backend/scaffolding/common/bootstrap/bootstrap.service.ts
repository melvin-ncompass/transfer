import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, In, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SysPermission } from 'scaffolding/user/entity/sys_permission.entity';
import { SysRole } from 'scaffolding/user/entity/sys_role.entity';
import { SysRolePermission } from 'scaffolding/user/entity/sys_role_permission.entity';
import { SysUser } from 'scaffolding/user/entity/sys_user.entity';
import { SysUserInfo } from 'scaffolding/user/entity/sys_user_info.entity';
import { SysUserRole } from 'scaffolding/user/entity/sys_user_role.entity';
import { SysPassword } from 'scaffolding/user/entity/sys_password.entity';
import { CryptoService } from '../encryption/crypto.service';
import { SysConfiguration } from 'scaffolding/settings/entity/sys_configuration.entity';
import { PermissionEnum, DefaultRoleEnum } from '../enum/enum';
import { BizPermission } from 'src/visualizationV1/entity/biz_permission.entity';
import { BizRolePermission } from 'src/visualizationV1/entity/biz_role_permission.entity';

interface PermissionNode {
  name: string;
  description?: string;
  children?: PermissionNode[];
}

@Injectable()
export class BootstrapService {
  constructor(
    @InjectRepository(SysPermission)
    private readonly permissionRepo: Repository<SysPermission>,
    @InjectRepository(BizPermission)
    private readonly bizPermissionRepo: Repository<BizPermission>,
    @InjectRepository(SysRole)
    private readonly roleRepo: Repository<SysRole>,
    @InjectRepository(SysRolePermission)
    private readonly rolePermissionRepo: Repository<SysRolePermission>,
    @InjectRepository(BizRolePermission)
    private readonly bizRolePermissionRepo: Repository<BizRolePermission>,
    @InjectRepository(SysUser)
    private readonly userRepo: Repository<SysUser>,
    @InjectRepository(SysUserInfo)
    private readonly userInfoRepo: Repository<SysUserInfo>,
    @InjectRepository(SysUserRole)
    private readonly userRoleRepo: Repository<SysUserRole>,
    @InjectRepository(SysPassword)
    private readonly passwordRepo: Repository<SysPassword>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly crypto: CryptoService,
  ) {}

  async seed() {
    await this.seedPermissions();
    await this.seedBizPermissions();
    const { superAdmin, user } = await this.seedRoles();
    await this.mapPermissionsToRole(superAdmin);
    await this.mapPermissionsToRole(user);
    await this.seedSuperAdmin(superAdmin);
    await this.seedConfigs();
  }

  private async seedPermissions() {
    const permissions: Partial<SysPermission>[] = [
      {
        name: PermissionEnum.MANAGE_USERS,
        description:
          'Allows managing all user accounts (read, create, edit, delete)',
      },
      {
        name: PermissionEnum.MANAGE_ROLES,
        description:
          'Allows full management of roles (read, create, edit, delete)',
      },
      {
        name: PermissionEnum.READ_SESSION_LOGS,
        description: 'Allows viewing of own session logs',
      },
      {
        name: PermissionEnum.MANAGE_SETTINGS,
        description: 'Allows full access to system settings (read and edit)',
      },
    ];
    for (const perm of permissions) {
      const exists = await this.permissionRepo.findOne({
        where: { name: perm.name },
      });
      if (!exists) {
        await this.permissionRepo.save(this.permissionRepo.create(perm));
      }
    }
  }

  private async seedBizPermissions() {
    const permissions: PermissionNode[] = [
        {
          name: PermissionEnum.MANAGE_DASHBOARD,
          description: 'Access dashboard',
          children: [
            {
              name: PermissionEnum.MANAGE_OVERVIEW,
              description: 'View overview data',
              children: [
              // {
              //   name: PermissionEnum.MANAGE_KHIS,
              //   description: 'Access khis data'
              // },
              // {
              //   name: PermissionEnum.MANAGE_FACILITY,
              //   description: 'View facility data'
              // }
            ],
          },
          {
            name: PermissionEnum.MANAGE_PROMPTS,
            description: 'View prompts data',
          },
          {
            name: PermissionEnum.MANAGE_CLIMATE,
            description: 'View climate data',
          },
          {
            name: PermissionEnum.MANAGE_FORECAST,
            description: 'View forecast data',
          },
        ],
      },
      {
        name: PermissionEnum.MANAGE_DATA,
        description: 'Access data table',
      },
      {
        name: PermissionEnum.MANAGE_CONFIG,
        description: 'Manage config settings',
      },
      {
        name: PermissionEnum.MANAGE_HELP,
        description: 'Manage help',
      },
      {
        name: PermissionEnum.MANAGE_REPORTS,
        description: 'Allow exporting data',
      }
    ];

    for (const perm of permissions) {
      await this.upsertBizPermission(perm);
    }
  }

  private async upsertBizPermission(
    node: PermissionNode,
    parent: BizPermission = null,
  ) {
    let permission = await this.bizPermissionRepo.findOne({
      where: {
        name: node.name,
        parent: parent ? { id: parent.id } : null,
      },
    });

    if (!permission) {
      permission = await this.bizPermissionRepo.save(
        this.bizPermissionRepo.create({
          name: node.name,
          description: node.description,
          parent: parent,
        }),
      );
    }

    if (node.children?.length) {
      for (const child of node.children) {
        await this.upsertBizPermission(child, permission);
      }
    }
  }

  private async seedRoles(): Promise<{ superAdmin: SysRole; user: SysRole }> {
    const roleNames = [
      DefaultRoleEnum.SUPER_ADMIN,
      DefaultRoleEnum.CONTRIBUTOR,
    ];
    const roles: Record<string, SysRole> = {};

    for (const name of roleNames) {
      let role = await this.roleRepo.findOne({ where: { name } });

      if (!role) {
        role = this.roleRepo.create({ name, isDefault: true });
        role = await this.roleRepo.save(role);
      } else if (!role.isDefault) {
        role.isDefault = true;
        await this.roleRepo.save(role);
      }

      roles[name] = role;
    }

    return {
      superAdmin: roles[DefaultRoleEnum.SUPER_ADMIN],
      user: roles[DefaultRoleEnum.CONTRIBUTOR],
    };
  }

  private async mapPermissionsToRole(role: SysRole) {
    const permissionMap: Record<string, string[]> = {
      [DefaultRoleEnum.SUPER_ADMIN]: [
        PermissionEnum.MANAGE_USERS,
        PermissionEnum.MANAGE_ROLES,
        PermissionEnum.MANAGE_SETTINGS,
        PermissionEnum.READ_SESSION_LOGS,
      ],
      [DefaultRoleEnum.CONTRIBUTOR]: [],
    };
    const permissionNames = permissionMap[role.name] || [];
    const permissions = await this.permissionRepo.find({
      where: { name: In(permissionNames) },
    });
    const existingMappings = await this.rolePermissionRepo.find({
      where: { role: { id: role.id } },
      relations: ['permission'],
    });
    const existingPermissionIds = new Set(
      existingMappings.map((m) => m.permission.id),
    );
    const newMappings = permissions
      .filter((perm) => !existingPermissionIds.has(perm.id))
      .map((perm) =>
        this.rolePermissionRepo.create({ role, permission: perm }),
      );
    if (newMappings.length) {
      await this.rolePermissionRepo.save(newMappings);
    }

    const bizPermissionMap: Record<string, string[]> = {
      [DefaultRoleEnum.SUPER_ADMIN]: [
        PermissionEnum.MANAGE_DASHBOARD,
        PermissionEnum.MANAGE_DATA,
        PermissionEnum.MANAGE_CONFIG,
        PermissionEnum.MANAGE_HELP,
        PermissionEnum.MANAGE_REPORTS,
        //.MANAGE_FACILITY,
        //PermissionEnum.MANAGE_KHIS,
        // PermissionEnum.OTHERS,
      ],
      [DefaultRoleEnum.CONTRIBUTOR]: [
        PermissionEnum.MANAGE_DASHBOARD,
        PermissionEnum.MANAGE_DATA,
        PermissionEnum.MANAGE_CONFIG,
        PermissionEnum.MANAGE_HELP,
        PermissionEnum.MANAGE_REPORTS,
        // PermissionEnum.OTHERS,
      ],
    };

    const bizParentNames = bizPermissionMap[role.name] || [];

    if (bizParentNames.length) {
      const bizPermissions = await this.bizPermissionRepo.find({
        where: { name: In(bizParentNames) },
        relations: ['children'],
      });

      const collectChildren = (
        perm: BizPermission,
        collected: BizPermission[] = [],
      ): BizPermission[] => {
        collected.push(perm);
        if (perm.children?.length) {
          perm.children.forEach((child) => collectChildren(child, collected));
        }
        return collected;
      };

      const allBizPermissions: BizPermission[] = [];
      bizPermissions.forEach((perm) =>
        collectChildren(perm, allBizPermissions),
      );

      const existingBizMappings = await this.bizRolePermissionRepo.find({
        where: { role: { id: role.id } },
        relations: ['permission'],
      });

      const existingBizPermissionIds = new Set(
        existingBizMappings.map((m) => m.permission.id),
      );

      const newBizMappings = allBizPermissions
        .filter((p) => !existingBizPermissionIds.has(p.id))
        .map((permission) =>
          this.bizRolePermissionRepo.create({ role, permission }),
        );

      if (newBizMappings.length) {
        await this.bizRolePermissionRepo.save(newBizMappings);
      }
    }
  }

  private async seedSuperAdmin(role: SysRole) {
    const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const name = this.configService.get<string>('SUPER_ADMIN_NAME');
    const phone = this.configService.get<string>('SUPER_ADMIN_PHONE');
    const rawPassword = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
    if (!email || !rawPassword) {
      throw new Error(
        'Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in .env',
      );
    }
    const existing = await this.userRepo.findOne({
      where: { userInfo: { email } },
      relations: ['userInfo'],
    });
    if (existing) return;
    const info = this.userInfoRepo.create({
      name,
      email,
      phone,
      roleIds: [role.id],
    });
    await this.userInfoRepo.save(info);
    const password = this.passwordRepo.create({
      password: await bcrypt.hash(rawPassword, 10),
    });
    await this.passwordRepo.save(password);
    const user = this.userRepo.create({ userInfo: info, password });
    await this.userRepo.save(user);
    const userRole = this.userRoleRepo.create({ user, role });
    await this.userRoleRepo.save(userRole);
  }

  private async seedConfigs() {
    const configRepo = this.dataSource.getRepository(SysConfiguration);
    const configs = [
      {
        name: 'path',
        config: {
          storagePath: this.configService.get<string>('STORAGE_PATH'),
        },
      },
      {
        name: 'email',
        config: {
          smtpHost: this.configService.get<string>('SMTP_HOST'),
          smtpPort: this.configService.get<string>('SMTP_PORT'),
          username: this.configService.get<string>('SMTP_USERNAME'),
          password: this.configService.get<string>('SMTP_PASSWORD'),
          fromEmail: this.configService.get<string>('SMTP_FROM_EMAIL'),
          secure:
            this.configService.get<string>('SMTP_PORT') == '465'
              ? 'true'
              : 'false',
        },
      },
    ];
    for (const entry of configs) {
      const exists = await configRepo.findOne({ where: { name: entry.name } });
      if (exists) continue;
      const encryptedConfig: Record<string, any> = {};
      for (const [key, value] of Object.entries(entry.config)) {
        encryptedConfig[key] = this.crypto.encrypt(String(value));
      }
      await configRepo.insert({
        name: entry.name,
        config: encryptedConfig,
      });
    }
  }
}
