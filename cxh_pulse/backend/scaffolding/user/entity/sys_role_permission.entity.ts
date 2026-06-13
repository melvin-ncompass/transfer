import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { SysRole } from './sys_role.entity';
import { SysPermission } from './sys_permission.entity';

@Entity({ name: 'sys_role_permission' })
@Index(['role', 'permission'], { unique: true })
export class SysRolePermission {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Index()
  @ManyToOne(() => SysRole, (role) => role.permissionMappings, {
    onDelete: 'CASCADE',
  })
  role: SysRole;

  @Index()
  @ManyToOne(() => SysPermission, (perm) => perm.roleMappings, {
    onDelete: 'CASCADE',
  })
  permission: SysPermission;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
