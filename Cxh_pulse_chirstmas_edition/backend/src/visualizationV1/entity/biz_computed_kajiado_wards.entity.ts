import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'biz_computed_kajiado_wards' })
export class BizComputedKajiadoWards {
  @PrimaryColumn({ name: 'raw_id', type: 'numeric'})
  rawId: string;

  @Column({ name: 'raw_gid', type: 'varchar', nullable: true })
  rawGid: string;

  @Column({ name: 'raw_pop_2009', type: 'numeric', nullable: true })
  rawPop2009: number;

  @Column({ name: 'raw_county', type: 'varchar', nullable: true })
  rawCounty: string;

  @Column({ name: 'raw_subcounty', type: 'varchar', nullable: true })
  rawSubcounty: string;

  @Column({ name: 'raw_ward', type: 'varchar', nullable: true })
  rawWard: string;

  @Column({ name: 'raw_uid', type: 'varchar', nullable: true })
  rawUid: string;

  @Column({ name: 'raw_scuid', type: 'varchar', nullable: true })
  rawScuid: string;

  @Column({ name: 'raw_cuid', type: 'varchar', nullable: true })
  rawCuid: string;

  @Column({
    name: 'raw_geom',
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon', // or 'Polygon', 'Point', etc.
    srid: 4326,
    nullable: true,
  })
  rawGeom: string;
}
