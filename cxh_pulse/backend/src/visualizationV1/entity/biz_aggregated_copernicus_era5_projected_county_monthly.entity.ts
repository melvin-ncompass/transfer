import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity({ name: 'biz_aggregated_copernicus_era5_projected_county_monthly' })
export class BizAggregatedCopernicusEra5ProjectedCountyMonthly {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'com_year', type: 'int' })
  comYear: number;

  @Column({ name: 'com_month', type: 'int' })
  comMonth: number;

  @Column({ name: 'com_mean_tmax', type: 'float' })
  comMeanTmax: number;

  @Column({ name: 'com_sum_tp', type: 'float', nullable: true })
  comSumTp: number;

  @Column({ name: 'com_county_id', type: 'text' })
  comCountyId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date;
}
