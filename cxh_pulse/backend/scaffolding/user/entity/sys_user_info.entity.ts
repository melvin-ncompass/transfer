import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { SysUserInvite } from './sys_user_invite.entity';
import { SysUserRequest } from './sys_user_request.entity';

@Entity({ name: 'sys_user_info' })
export class SysUserInfo {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Index()
  @Column({ name: 'name' })
  name: string;

  @Index({ unique: true })
  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'phone', nullable: true })
  phone: string;

  @Column({ name: 'profile_pic_id', nullable: true })
  profilePicId?: string;

  @Column('simple-array', { name: 'role_ids', nullable: true })
  roleIds?: string[];

  @OneToOne(() => SysUserInvite, (invite) => invite.userInfo)
  invite: SysUserInvite;

  @OneToMany(() => SysUserRequest, (request) => request.userInfo)
  requests: SysUserRequest[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
