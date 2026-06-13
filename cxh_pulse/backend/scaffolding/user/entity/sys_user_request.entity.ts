import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SysUserInfo } from './sys_user_info.entity';

@Entity({ name: 'sys_user_request' })
export class SysUserRequest {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'request_token_hash', nullable: true })
  requestTokenHash: string;

  @Column({ name: 'request_token_expiry', type: 'timestamp', nullable: true })
  requestTokenExpiry: Date;

  @Column({ name: 'requested_at', type: 'timestamp' })
  requestedAt: Date;

  @Column({ name: 'password', nullable: true })
  password: string;

  // @Column({ default: false })
  // isApproved: boolean;

  @Column({ name: 'processed_by', nullable: true })
  processedBy: string;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ name: 'status', default: 'pending' })
  status: 'pending' | 'approved' | 'denied';

  @Column({ name: 'is_account_setup', default: false })
  isAccountSetUp: boolean;

  @ManyToOne(() => SysUserInfo, (info) => info.requests, {
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
