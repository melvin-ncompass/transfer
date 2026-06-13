import { SysSession } from './sys_session.entity';
import { SysUser } from './sys_user.entity';
import {
  ManyToOne,
  JoinColumn,
  OneToOne,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  Entity,
} from 'typeorm';

@Entity({ name: 'sys_refresh_token' })
export class SysRefreshToken {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Index()
  @Column({ name: 'refresh_token' })
  refreshToken: string;

  @Column({ type: 'timestamp', name: 'issued_at' })
  issuedAt: Date;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  // @ManyToOne(() => User, (user) => user.refreshToken, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'user_id' })
  // user: User;
  @OneToOne(() => SysSession, (session) => session.refreshToken)
  session: SysSession;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
