import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { SysPassword } from './sys_password.entity';
import { SysRefreshToken } from './sys_refresh_token.entity';
import { SysUserRole } from './sys_user_role.entity';
import { SysUserSession } from './sys_user_session.entity';
import { SysUserInvite } from './sys_user_invite.entity';
import { SysUserRequest } from './sys_user_request.entity';
import { SysUserInfo } from './sys_user_info.entity';

@Entity({ name: 'sys_user' })
export class SysUser {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @OneToOne(() => SysUserInfo, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_info_id' })
  userInfo: SysUserInfo;

  @OneToOne(() => SysPassword, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'password_id' })
  password: SysPassword;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @OneToMany(() => SysUserSession, (session) => session.user)
  userSessions: SysUserSession[];

  @OneToMany(() => SysUserRole, (map) => map.user)
  roleMappings: SysUserRole[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
