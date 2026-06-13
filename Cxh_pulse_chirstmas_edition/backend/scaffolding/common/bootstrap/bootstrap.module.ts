import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { CryptoService } from '../encryption/crypto.service';
import { BootstrapService } from './bootstrap.service';
import { SysPermission } from 'scaffolding/user/entity/sys_permission.entity';
import { SysRole } from 'scaffolding/user/entity/sys_role.entity';
import { SysRolePermission } from 'scaffolding/user/entity/sys_role_permission.entity';
import { SysUser } from 'scaffolding/user/entity/sys_user.entity';
import { SysUserInfo } from 'scaffolding/user/entity/sys_user_info.entity';
import { SysPassword } from 'scaffolding/user/entity/sys_password.entity';
import { SysUserRole } from 'scaffolding/user/entity/sys_user_role.entity';
import { SysConfiguration } from 'scaffolding/settings/entity/sys_configuration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SysPermission,
      SysRole,
      SysRolePermission,
      SysUser,
      SysUserInfo,
      SysUserRole,
      SysPassword,
      SysConfiguration,
    ]),
    ConfigModule,
  ],
  providers: [BootstrapService, CryptoService],
  exports: [BootstrapService],
})
export class BootstrapModule {}
