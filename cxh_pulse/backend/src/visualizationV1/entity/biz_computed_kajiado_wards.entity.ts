import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'biz_computed_kajiado_wards' })
export class BizComputedKajiadoWards {
  @PrimaryColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'com_county_id', type: 'text', nullable:true })
  comCountyId: string;

  @Column({ name: 'com_subcounty_id', type: 'text', nullable:true })
  comSubcountyId: string;

  @Column({ name: 'com_ward_id', type: 'text' , nullable:true})
  comWardId: string;

  @Column({
    name: 'raw_geom',
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon', // or 'Polygon', 'Point', etc.
    srid: 4326,
    nullable: true,
  })
  rawGeom: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', nullable:true })
  updatedAt: Date
}
