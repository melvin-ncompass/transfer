import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  refreshToken: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  issuedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

// import {
//   Column,
//   Entity,
//   JoinColumn,
//   ManyToOne,
//   PrimaryGeneratedColumn,
// } from 'typeorm';
// import { User } from './user.entity';

// @Entity('refresh_tokens')
// export class RefreshToken {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column({ nullable: true })
// deviceId: string;

// @Column({ nullable: true })
// userAgent: string;

// @Column({ nullable: true })
// ipAddress: string;

//   @Column()
//   refreshToken: string;

//   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
//   issuedAt: Date;

//   @Column({ type: 'timestamp', nullable: true })
//   expiresAt: Date;

//   @Column({ default: true })
//   isActive: boolean;

//   @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
//   @JoinColumn({ name: 'userId' })
//   user: User;
// }
