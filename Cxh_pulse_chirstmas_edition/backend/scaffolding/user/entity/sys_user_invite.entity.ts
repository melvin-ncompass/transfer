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
import { SysUserInfo } from './sys_user_info.entity';

@Entity({ name: 'sys_user_invite' })
export class SysUserInvite {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'invite_token_hash' })
  inviteTokenHash: string;

  @Column({ name: 'invited_at', type: 'timestamp' })
  invitedAt: Date;

  @Column({ name: 'invited_by' })
  invitedBy: string;

  @Column({ name: 'invite_expiry', type: 'timestamp' })
  inviteExpiry: Date;

  @Column({ name: 'is_accepted', default: false })
  isAccepted: boolean;

  @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
  acceptedAt: Date;

  // @Column({ default: 'invited' })
  // status: 'invited' | 'account not set' | 'account setup completed';

  @Column({ name: 'is_account_setup', default: false })
  isAccountSetUp: boolean;

  @OneToOne(() => SysUserInfo, (info) => info.invite, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_info_id' })
  userInfo: SysUserInfo;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
