import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { SysRefreshToken } from './sys_refresh_token.entity';
import { SysUserSession } from './sys_user_session.entity';
import { SysUser } from './sys_user.entity';

@Entity({ name: 'sys_session' })
export class SysSession {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @CreateDateColumn({ name: 'session_initiated_at' })
  sessionInitiatedAt: Date;

  @Column({ name: 'session_logout_at', type: 'timestamp', nullable: true })
  sessionLogoutAt: Date | null;

  // @ManyToOne(() => User)
  // @JoinColumn({ name: 'user_id' })
  // user: User;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @OneToOne(() => SysRefreshToken, (token) => token.session, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'refresh_token_id' })
  refreshToken: SysRefreshToken;

  @OneToOne(() => SysUserSession, (userSession) => userSession.session)
  userSessions: SysUserSession[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
