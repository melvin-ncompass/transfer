import { Expose, Transform } from 'class-transformer';
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'biz_computed_khis_ward_month' })
export class BizComputedKhisWardMonth {
  // @PrimaryColumn({ name: 'raw_uid_record' })
  // rawUidRecord: string;

  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'raw_orgunit_name', type: 'text' })
  rawOrgUnitName: string;

  @Column({ name: 'raw_orgunit', type: 'text' })
  rawOrgUnit: string;

  @Column({ name: 'raw_orgunit_level', type: 'bigint' })
  rawOrgUnitLevel: number;

  @Column({ name: 'raw_dataelement_name', type: 'text' })
  rawDataElementName: string;

  @Column({ name: 'raw_dataelement_code', type: 'text', nullable: true })
  rawDataElementCode: string;

  @Column({ name: 'raw_dataelement', type: 'text' })
  rawDataElement: string;

  @Column({ name: 'raw_dx_type', type: 'text' })
  rawDxType: string;

  @Column({ name: 'com_year', type: 'int' })
  comYear: number;

  @Column({ name: 'com_month', type: 'int' })
  comMonth: number;

  @Column({ name: 'raw_value', type: 'numeric', precision: 15, scale: 4 })
  rawValue: number;

  @Column({ name: 'com_county_id', type: 'text', nullable:true })
  comCountyId: string;

  @Column({ name: 'com_subcounty_id', type: 'text', nullable:true })
  comSubcountyId: string;

  @Column({ name: 'com_ward_id', type: 'text', nullable:true })
  comWardId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' , nullable:true})
  updatedAt: Date
}
