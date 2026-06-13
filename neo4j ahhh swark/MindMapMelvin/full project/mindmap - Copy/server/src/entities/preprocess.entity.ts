import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from './project.entity';

@Entity('preprocess')
export class Preprocess {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project, (project) => project.preprocesses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'json' })
  metaData: string;

  @Column({ type: 'text' })
  buildprompt: string;

  @Column({ nullable: true })
  analyzedfilesLLM: string;

  @Column({ type: 'json', nullable: true })
  contentFilteration: string;

  @Column({ type: 'json', nullable: true })
  batchsummary: Record<string, any>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}
