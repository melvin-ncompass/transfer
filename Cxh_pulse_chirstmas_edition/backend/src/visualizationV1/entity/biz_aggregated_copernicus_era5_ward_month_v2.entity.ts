import { Entity, PrimaryColumn, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'biz_aggregated_copernicus_era5_ward_month_v2' })
export class BizAggregatedCopernicusEra5WardMonthV2 {
  @PrimaryGeneratedColumn('uuid',{ name: 'id' })
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

  @Column({
    name: 'com_geom',
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon', // or 'Polygon', 'Point', etc.
    srid: 4326,
    nullable: true,
  })
  comGeom: string;

  @Column({ name: 'com_county' })
  comCounty: string;

  @Column({ name: 'com_subcounty' })
  comSubcounty: string;

  @Column({ name: 'com_ward' })
  comWard: string;
}
