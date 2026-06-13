import { Expose, Transform } from 'class-transformer';
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'biz_computed_khis_ward_month' })
export class BizComputedKhisWardMonth {
  // @PrimaryColumn({ name: 'raw_uid_record' })
  // rawUidRecord: string;

  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'raw_orgunit' })
  rawOrgUnit: string;

  @Column({ name: 'raw_orgunit_level', type: 'int' })
  rawOrgUnitLevel: number;

  @Column({ name: 'raw_dataelement_name' })
  rawDataElementName: string;

  @Column({ name: 'raw_dataelement_code', nullable: true })
  rawDataElementCode: string;

  @Column({ name: 'raw_dataelement' })
  rawDataElement: string;

  @Column({ name: 'raw_dx_type' })
  rawDxType: string;

  @Column({ name: 'com_year' })
  comYear: number;

  @Column({ name: 'com_month' })
  comMonth: number;

  @Column({ name: 'com_total_value', type: 'int' })
  comTotalValue: number;

  @Column({ name: 'raw_county' })
  rawCounty: string;

  @Column({ name: 'raw_subcounty' })
  rawSubcounty: string;

  @Column({ name: 'raw_ward' })
  rawWard: string;

  @Column({
    name: 'com_geom',
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon', // or 'Polygon', 'Point', etc.
    srid: 4326,
    nullable: true,
  })
  comGeom: string;
}
