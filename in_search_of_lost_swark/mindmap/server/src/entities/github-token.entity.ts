import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('github_tokens')
export class GithubToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  githubUserId: string; // Store GitHub profile ID

  @Column()
  githubUserName: string;

  @Column()
  githubAccessToken: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  issuedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, (user) => user.githubTokens, { onDelete: 'CASCADE' })
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

// @Entity('github_tokens')
// export class GithubToken {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column({ nullable: true })
// deviceId: string;

// @Column({ nullable: true })
// userAgent: string;

// @Column({ nullable: true })
// ipAddress: string;

//   @Column()
//   githubUserId: string; // Store GitHub profile ID

//   @Column()
//   githubUserName: string;

//   @Column()
//   githubAccessToken: string;

//   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
//   issuedAt: Date;

//   @Column({ type: 'timestamp', nullable: true })
//   expiresAt: Date;

//   @Column({ default: true })
//   isActive: boolean;

//   @ManyToOne(() => User, (user) => user.githubTokens, { onDelete: 'CASCADE' })
//   @JoinColumn({ name: 'userId' })
//   user: User;
// }
