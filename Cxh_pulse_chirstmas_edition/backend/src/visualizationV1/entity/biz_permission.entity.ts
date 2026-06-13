import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { BizRolePermission } from './biz_role_permission.entity';

@Entity({ name: 'biz_permission' })
@Index(['name', 'parent'], { unique: true })
export class BizPermission {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'description', nullable: true })
  description: string;

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @ManyToOne(() => BizPermission, (perm) => perm.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  parent: BizPermission;

  @OneToMany(() => BizPermission, (perm) => perm.parent)
  children: BizPermission[];

  @OneToMany(() => BizRolePermission, (map) => map.permission)
  roleMappings: BizRolePermission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
