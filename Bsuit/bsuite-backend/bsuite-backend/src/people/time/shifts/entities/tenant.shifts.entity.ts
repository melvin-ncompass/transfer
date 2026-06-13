import {
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { ShiftVersions } from './tenant.shift-versions.entity';

@Entity('biz_people_shifts')
export class Shifts {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ length: 50, name: 'shift_name', unique: true})
  shiftName: string;

  // is defult can be true only once
  @Column({ default: false , name : 'is_default' })
  isDefault: boolean;

  @OneToMany(() => ShiftVersions, version => version.shift)
  shiftVersions: ShiftVersions[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}