import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('biz_computed_kajiado_climate_projections')
export class BizComputedKajiadoClimateProjections {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'com_year' })
  comYear: number;

  @Column({ name: 'com_month' })
  comMonth: number;

  @Column('float')
  @Column({ name: 'com_mean_t2m', type: 'float' })
  comMeanT2m: number;

  @Column('float')
  @Column({ name: 'com_sum_tp', type: 'float' })
  comSumTp: number;

  @Column({ type: 'text', name: 'raw_type' })
  rawType: string;
}
