import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysPermission } from '../entity/sys_permission.entity';
import { RoleModule } from '../roles/roles.module';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { MailerModule } from 'scaffolding/common/email-service/mail.module';

@Module({
  imports: [MailerModule, RoleModule],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
