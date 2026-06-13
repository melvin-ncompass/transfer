import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { SysUser } from './sys_user.entity';
import { SysSession } from './sys_session.entity';
import { SysRefreshToken } from './sys_refresh_token.entity';

@Entity({ name: 'sys_user_session' })
export class SysUserSession {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @ManyToOne(() => SysUser, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: SysUser;

  @OneToOne(() => SysSession, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: SysSession;

  @OneToOne(() => SysRefreshToken, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'refresh_token_id' })
  refreshToken: SysRefreshToken;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
