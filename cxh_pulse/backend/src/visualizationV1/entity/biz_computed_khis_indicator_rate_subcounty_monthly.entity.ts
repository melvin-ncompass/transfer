import { Expose, Transform } from 'class-transformer';
import {
  Entity,
  PrimaryColumn,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'biz_computed_khis_indicator_rate_subcounty_monthly' })
export class BizComputedKhisIndicatorSubCountyRateMonthly {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'com_subcounty_id', type: 'text' })
  comSubCountyId: string;

  @Column({ name: 'com_dataelement', type: 'text' })
  comDataelementCode: string;

  @Column({ name: 'com_year', type: 'int' })
  comYear: number;

  @Column({ name: 'com_month', type: 'int' })
  comMonth: number;

  @Column({ name: 'raw_value', type: 'float', nullable: true })
  rawValue: number;

  @Column({ name: 'raw_ci_low', type: 'float', nullable: true })
  rawCiLow: number;

  @Column({ name: 'raw_ci_high', type: 'float', nullable: true })
  rawCiHigh: number;

  @Column({ name: 'raw_type', type: 'text' })
  rawType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date;
}