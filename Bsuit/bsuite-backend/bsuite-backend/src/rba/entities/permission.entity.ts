import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Module } from './module.entity';
import { Role } from './role.entity';
import { Exclude } from 'class-transformer';

@Entity({ name: 'permissions' })
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'permission_name', length: 100, unique: true })
  permissionName: string;

  @Column({ name: 'permission_name_abrv', length: 100, unique: true })
  permissionNameAbrv: string;

  @ManyToOne(() => Module, (module) => module.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @ManyToMany(() => Permission, { cascade: true, nullable: true })
  @JoinTable({
    name: 'dependency',
    joinColumn: { name: 'permission_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'depends_on_permission_id', referencedColumnName: 'id' },
  })
  dependencies: Permission[];

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  @Exclude()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @Exclude()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
