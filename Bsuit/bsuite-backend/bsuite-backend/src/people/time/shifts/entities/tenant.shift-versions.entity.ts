import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Shifts } from "./tenant.shifts.entity";
import { ShiftType } from '../../../../common/enum/people/shift-type.enum';
@Entity('biz_people_shift_versions')
export class ShiftVersions {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ManyToOne(() => Shifts)
  @JoinColumn({ name: 'shift_id' })
  shift: Shifts;

  @Column({ type: 'enum', enum: ShiftType, name: 'shift_type'})
  shiftType: ShiftType;

  // atlest 1 working day
  @Column('simple-array', { name: 'working_days' })
  workingDays: string[]; // ["Mon","Tue",...]

  // only for flexible
  @Column({ type: 'int', name: 'gross_hours', nullable: true })
  grossHours: number;

  //only for fixed // time format 24 hr // // stored as HH:MM:SS in DB
  @Column({ type: 'time', name: 'shift_from_time', nullable: true })
  shiftFromTime: string;

  //only for fixed // time format 24 hr // // stored as HH:MM:SS in DB
  @Column({ type: 'time', name: 'shift_to_time', nullable: true })
  shiftToTime: string;

  //only for fixed
  @Column({ type: 'int', name: 'break_duration', nullable: true })
  breakDuration: number; // in minutes

  @Column({ type: 'date', name: 'effective_from_date', nullable: true })
  effectiveFromDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}