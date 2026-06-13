import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SignupRequestController } from './signup-request.controller';
import { SignupRequestService } from './signup-request.service';
import { SysUserRequest } from '../entity/sys_user_request.entity';
import { SysUserInfo } from '../entity/sys_user_info.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { RoleModule } from '../roles/roles.module';
import { SysPassword } from '../entity/sys_password.entity';
import { SysRole } from '../entity/sys_role.entity';
import { SysUserRole } from '../entity/sys_user_role.entity';
import { SysUser } from '../entity/sys_user.entity';
import { MailerModule } from 'scaffolding/common/email-service/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SysUserRequest,
      SysUserInfo,
      SysUser,
      SysPassword,
      SysRole,
      SysUserRole,
    ]),
    AuthModule,
    MailerModule,
    RoleModule,
  ],
  controllers: [SignupRequestController],
  providers: [SignupRequestService],
})
export class SignupRequestModule {}
