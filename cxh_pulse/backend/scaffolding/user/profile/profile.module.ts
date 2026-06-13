import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SysUserInfo } from '../entity/sys_user_info.entity';
import { SysUser } from '../entity/sys_user.entity';
import { SysPassword } from '../entity/sys_password.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { AuthModule } from '../auth/auth.module';
import { RoleModule } from '../roles/roles.module';
import { SettingsModule } from 'scaffolding/settings/settings.module';
import { MailerModule } from 'scaffolding/common/email-service/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysUserInfo, SysUser, SysPassword]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') || 'supersecret';
        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
      inject: [ConfigService],
    }),
    MailerModule,
    AuthModule,
    RoleModule,
    SettingsModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
