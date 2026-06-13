// what is the use of GitHub user id here
// - Email can change: Users can update their GitHub email, or use different emails across providers
// - Not always available: GitHub users can hide their email, especially if they use private profiles
// - Collision risk: If you allow manual signup and GitHub login, the same email could be used by different accounts unless carefully handle

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from './project.entity';
import { RefreshToken } from './refresh-token.entity';
import { GithubToken } from './github-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;

  @OneToMany(() => Project, (project) => project.user)
  projects: Project[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => GithubToken, (token) => token.user)
  githubTokens: GithubToken[];
}
