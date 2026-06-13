import { Expose, Transform } from 'class-transformer';
import { Entity, PrimaryColumn, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'biz_computed_kajiado_master_health_facilities' })
export class BizComputedKajiadoMasterHealthFacilities {
  @PrimaryColumn({ type: 'bigint', name: 'raw_mfl_code' })
  rawMflCode: number;

  @Column({ name: 'raw_official_health_facility_name' })
  rawOfficialHealthFacilityName: string;

  @Column({ name: 'raw_level', type: 'text' })
  rawLevel: string;

  @Column({ name: 'raw_facility_type', type: 'text' })
  rawFacilityType: string;

  @Column({ name: 'raw_latitude', type: 'float' })
  rawLatitude: number;

  @Column({ name: 'raw_longitude', type: 'float' })
  rawLongitude: number;

  @Column({ name: 'raw_owner', type: 'text' })
  rawOwner: string;

  @Column({ name: 'raw_no_of_beds', type: 'int' })
  rawNoOfBeds: number;

  @Column({ name: 'raw_no_of_cots', type: 'int' })
  rawNoOfCots: number;

  @Column({ name: 'com_county_id', type: 'text', nullable:true})
  comCountyId: string

  @Column({ name: 'raw_constituency', type: 'text' })
  rawConstituency: string

  @Column({ name: 'com_subcounty_id', type: 'text' , nullable:true})
  comSubcountyId: string

  @Column({ name: 'com_ward_id', type: 'text' , nullable:true})
  comWardId: string

  @Column({ name: 'raw_operation_status', type: 'text' })
  rawOperationStatus: string

  @Column({ name: 'raw_admission_status', type: 'text' , nullable:true})
  rawAdmissionStatus: string

  @Column({ name: 'raw_open_whole_day', type: 'text' })
  rawOpenWholeDay: string

  @Column({ name: 'raw_open_public_holidays', type: 'text' })
  rawOpenPublicHolidays: string

  @Column({ name: 'raw_open_weekends', type: 'text' })
  rawOpenWeekends: string

  @Column({ name: 'raw_open_late_night', type: 'text' })
  rawOpenLateNight: string

  @Column({ name: 'raw_approved', type: 'text' })
  rawApproved: string

  @Column({ name: 'raw_public_visible', type: 'text' })
  rawPublicVisible: string

  @Column({ name: 'raw_closed', type: 'text' })
  rawClosed: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', nullable:true })
  updatedAt: Date
}
