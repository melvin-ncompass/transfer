import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'biz_people_payschedule' })
export class PaySchedule {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'frequency', type: 'varchar' })
  frequency: string;

  @Column({ name: 'working_days', type: 'varchar' })
  workingDays: string;

  @Column({ name: 'date_of_processing', type: 'int' })
  dateOfProcessing: number;

  @Column({ name: 'first_pay_period', type: 'date' })
  firstPayPeriod: string;

  @Column({ name: 'from_pay_cycle', type: 'date' })
  fromPayCycle: string;

  @Column({ name: 'to_pay_cycle', type: 'date' })
  toPayCycle: string;

  @Column({ name: 'financial_year_start', type: 'date' })
  financialYearStart: string;

  @Column({ name: 'financial_year_end', type: 'date' })
  financialYearEnd: string;

  @Column({ name: 'consider_poi_from', type: 'int' })
  considerPoiFrom: number;

  @Column({ name: 'is_calendar_month', type: 'boolean', default: false })
  isCalendarMonth: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
