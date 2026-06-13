import { SysRole } from 'scaffolding/user/entity/sys_role.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { BizPermission } from './biz_permission.entity';
@Entity({ name: 'biz_role_permission' })
@Index(['role', 'permission'], { unique: true })
export class BizRolePermission {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Index()
  @ManyToOne(() => SysRole, (role) => role.visualizationPermissionMappings, {
    onDelete: 'CASCADE',
  })
  role: SysRole;

  @Index()
  @ManyToOne(() => BizPermission, (perm) => perm.roleMappings, {
    onDelete: 'CASCADE',
  })
  permission: BizPermission;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
