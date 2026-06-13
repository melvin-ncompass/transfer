import { Expose, Transform } from 'class-transformer';
import { Entity, PrimaryColumn,PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'biz_computed_kajiado_master_health_facilities' })
export class BizComputedKajiadoMasterHealthFacilities {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'raw_facility_code', type: 'int', nullable: true })
  rawFacilityCode: number;

  @Column({ name: 'raw_facility_name' })
  rawFacilityName: string;

  @Column({ name: 'raw_county' })
  rawCounty: string;

  @Column({ name: 'raw_subcounty' })
  rawSubcounty: string;

  @Column({ name: 'com_ward' , nullable:true})
  comWard: string;

  @Column({ name: 'raw_latitude', type: 'float', nullable:true })
  rawLatitude: number;

  @Column({ name: 'raw_longitude', type: 'float', nullable:true })
  rawLongitude: number;

  @Column({
    name: 'com_coordinate_geom',
    type: 'geometry',
    spatialFeatureType: 'Point' ,//'MultiPolygon', // or 'Polygon', 'Point', etc.
    srid: 4326,
    nullable: true,
  })
  comCoordinateGeom: string;

  @Column({
    name: 'com_ward_geom',
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon', // or 'Polygon', 'Point', etc.
    srid: 4326,
    nullable: true,
  })
  comWardGeom: string;
}
