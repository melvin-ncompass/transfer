import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { SysRolePermission } from './sys_role_permission.entity';
import { SysUserRole } from './sys_user_role.entity';
import { BizRolePermission } from 'src/visualizationV1/entity/biz_role_permission.entity';

@Entity({ name: 'sys_role' })
export class SysRole {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Index({ unique: true })
  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @OneToMany(() => SysUserRole, (map) => map.role)
  userMappings: SysUserRole[];

  @OneToMany(() => SysRolePermission, (map) => map.role)
  permissionMappings: SysRolePermission[];

  @OneToMany(() => BizRolePermission, (map) => map.role)
  visualizationPermissionMappings: BizRolePermission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
