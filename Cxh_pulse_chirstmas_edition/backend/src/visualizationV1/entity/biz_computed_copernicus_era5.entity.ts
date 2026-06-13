import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'biz_computed_copernicus_era5' })
export class BizComputedCopernicusEra5 {
  @PrimaryGeneratedColumn('uuid',{ name: 'id' })
  id: number;

  @Column({ name: 'raw_valid_time', type: 'timestamp', nullable: true })
  rawValidTime: Date;

  @Column({ name: 'raw_latitude', type: 'double precision', nullable: true })
  rawLatitude: number;

  @Column({ name: 'raw_longitude', type: 'double precision', nullable: true })
  rawLongitude: number;

  @Column({ name: 'raw_d2m', type: 'double precision', nullable: true })
  rawD2m: number;

  @Column({ name: 'raw_t2m', type: 'double precision', nullable: true })
  rawT2m: number;

  @Column({ name: 'raw_tp', type: 'double precision', nullable: true })
  rawTp: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'com_geom', type: 'text', nullable: true })
  comGeom: string;

  @Column({ name: 'com_county', type: 'varchar', nullable: true })
  county: string;

  @Column({ name: 'com_subcounty', type: 'varchar', nullable: true })
  subcounty: string;

  @Column({ name: 'com_ward', type: 'varchar', nullable: true })
  ward: string;
}
