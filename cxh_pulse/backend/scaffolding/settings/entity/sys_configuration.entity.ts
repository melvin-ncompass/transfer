import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'sys_configuration' })
export class SysConfiguration {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'config', type: 'jsonb' })
  config: Record<string, any>;
}