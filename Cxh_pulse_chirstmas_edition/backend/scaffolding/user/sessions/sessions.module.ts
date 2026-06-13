import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionController } from './sessions.controller';
import { SessionService } from './sessions.service';
import { AuthModule } from '../auth/auth.module';
import { RoleModule } from '../roles/roles.module';
import { SysUserActivityLog } from '../entity/sys_user_activity_log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysUserActivityLog]),
    AuthModule,
    RoleModule,
  ],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}
