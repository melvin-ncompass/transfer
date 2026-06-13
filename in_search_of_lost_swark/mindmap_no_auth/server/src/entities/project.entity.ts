import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Preprocess } from './preprocess.entity';
import { GeneratedOutput } from './generated-output.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  projectname: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;

  @OneToMany(() => Preprocess, (preprocess) => preprocess.project)
  preprocesses: Preprocess[];

  @OneToMany(() => GeneratedOutput, (GeneratedOutput) => GeneratedOutput.project)
  flowcharts: GeneratedOutput[];
}