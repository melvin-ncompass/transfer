import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SysConfiguration } from './entity/sys_configuration.entity';
import { SysUser } from 'scaffolding/user/entity/sys_user.entity';
import { SysUserInfo } from 'scaffolding/user/entity/sys_user_info.entity';
import { SysPassword } from 'scaffolding/user/entity/sys_password.entity';
import { SysUserRole } from 'scaffolding/user/entity/sys_user_role.entity';
import { SysRole } from 'scaffolding/user/entity/sys_role.entity';
import { SysRolePermission } from 'scaffolding/user/entity/sys_role_permission.entity';
import { SysPermission } from 'scaffolding/user/entity/sys_permission.entity';
import { EncryptionModule } from 'scaffolding/common/encryption/crypto.module';
import { MailerModule } from 'scaffolding/common/email-service/mail.module';
import { PermissionModule } from 'scaffolding/user/permissions/permissions.module';
import { RoleModule } from 'scaffolding/user/roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SysConfiguration,
      SysUser,
      SysPassword,
      SysUserInfo,
      SysUserRole,
      SysRole,
      SysRolePermission,
      SysPermission,
    ]),
    EncryptionModule,
    forwardRef(() => MailerModule),
    PermissionModule,
    RoleModule,
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
