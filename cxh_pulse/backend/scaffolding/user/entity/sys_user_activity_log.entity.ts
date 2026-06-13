import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { SysUser } from './sys_user.entity';
import { SysSession } from './sys_session.entity';

@Entity({ name: 'sys_user_activity_log' })
export class SysUserActivityLog {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @ManyToOne(() => SysUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: SysUser;

  @ManyToOne(() => SysSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: SysSession;

  @Column({ name: 'endpoint' })
  endpoint: string;

  @Column({ name: 'method' })
  method: string;

  @Column({ name: 'request_body', type: 'text', nullable: true })
  requestBody: string;

  @Column({ name: 'response_status', type: 'text', nullable: true })
  responseStatus: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
