import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysUser } from './entity/sys_user.entity';
import { PermissionModule } from './permissions/permissions.module';
import { RoleModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { SysPassword } from './entity/sys_password.entity';
import { SysUserInfo } from './entity/sys_user_info.entity';
import { SysUserRole } from './entity/sys_user_role.entity';
import { SysRolePermission } from './entity/sys_role_permission.entity';
import { SysRole } from './entity/sys_role.entity';
import { SysPermission } from './entity/sys_permission.entity';
import { InvitesModule } from './invites/invites.module';
import { ProfileModule } from './profile/profile.module';
import { SessionModule } from './sessions/sessions.module';
import { SignupRequestModule } from './signup-request/signup-request.module';
// import { VisualizationModule } from '../../src/visualization/visualization.module';
import { BizPermission } from '../../src/visualizationV1/entity/biz_permission.entity';
import { BizRolePermission } from '../../src/visualizationV1/entity/biz_role_permission.entity';
import { MailerModule } from '../common/email-service/mail.module';
import { EncryptionModule } from '../common/encryption/crypto.module';
import { BootstrapService } from '../common/bootstrap/bootstrap.service';
import { VisualizationV1Module } from '../../src/visualizationV1/visualizationV1.module';
import { SysUserActivityLog } from './entity/sys_user_activity_log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SysUser,
      SysPassword,
      SysUserInfo,
      SysUserRole,
      SysRole,
      SysRolePermission,
      SysUserActivityLog,
      SysPermission,
      BizPermission,
      BizRolePermission,
    ]),
    PermissionModule,
    InvitesModule,
    RoleModule,
    forwardRef(() => AuthModule),
    MailerModule,
    EncryptionModule,
    ProfileModule,
    SessionModule,
    SignupRequestModule,
    VisualizationV1Module,
    // VisualizationModule
  ],
  controllers: [UserController],
  providers: [UserService, BootstrapService],
  exports: [UserService, BootstrapService],
})
export class UserModule {}
