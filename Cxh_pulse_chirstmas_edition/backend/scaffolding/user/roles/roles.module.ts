import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './roles.controller';
import { RoleService } from './roles.service';
import { SysPermission } from '../entity/sys_permission.entity';
import { SysRolePermission } from '../entity/sys_role_permission.entity';
import { SysRole } from '../entity/sys_role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysRole, SysRolePermission, SysPermission]),
  ],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
