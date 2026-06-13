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

@Entity({ name: 'sys_permission' })
export class SysPermission {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Index({ unique: true })
  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'description', nullable: true })
  description: string;

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @OneToMany(() => SysRolePermission, (map) => map.permission)
  roleMappings: SysRolePermission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
