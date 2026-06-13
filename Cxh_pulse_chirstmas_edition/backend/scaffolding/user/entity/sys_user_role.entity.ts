import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { SysUser } from './sys_user.entity';
import { SysRole } from './sys_role.entity';

@Entity({ name: 'sys_user_role' })
@Index(['user', 'role'], { unique: true })
export class SysUserRole {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Index()
  @ManyToOne(() => SysUser, (user) => user.roleMappings, {
    onDelete: 'CASCADE',
  })
  user: SysUser;

  @Index()
  @ManyToOne(() => SysRole, (role) => role.userMappings, {
    onDelete: 'CASCADE',
  })
  role: SysRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
