import { Expose, Transform } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'biz_computed_prompts_ward_month' })
export class BizComputedPromptsWardMonth {
  @PrimaryGeneratedColumn('uuid',{ name: 'id' })
  id: string;
  
  @Column({ name: 'com_year' })
  comYear: number;

  @Column({ name: 'com_month' })
  comMonth: number;

  @Column({ name: 'raw_intent' })
  rawIntent: string;

  @Column({ name: 'com_intent' , nullable: true })
  comIntent: string;

  @Column({ name: 'com_intent_count', type: 'int' })
  comIntentCount: number;

  @Column({ name: 'raw_broader_category'})
  rawBroaderCategory: string;

  @Column({ name: 'raw_priority_level' , nullable: true})
  rawPriorityLevel: string;

  @Column({ name: 'com_county' })
  comCounty: string;

  @Column({ name: 'com_subcounty' })
  comSubcounty: string;

  @Column({ name: 'com_ward' })
  comWard: string;

  @Column({
    name: 'com_geom',
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon', // or 'Polygon', 'Point', etc.
    srid: 4326,
    nullable: true,
  })
  comGeom: string;
}
