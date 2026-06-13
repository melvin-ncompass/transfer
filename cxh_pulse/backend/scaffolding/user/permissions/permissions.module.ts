import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysPermission } from '../entity/sys_permission.entity';
import { PermissionController } from './permissions.controller';
import { PermissionService } from './permissions.service';
import { RoleModule } from '../roles/roles.module';

@Module({
  imports: [TypeOrmModule.forFeature([SysPermission]), RoleModule],
  controllers: [PermissionController],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
