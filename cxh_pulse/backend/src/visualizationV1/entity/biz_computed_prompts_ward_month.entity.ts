import { Expose, Transform } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'biz_computed_prompts_ward_month' })
export class BizComputedPromptsWardMonth {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'com_year', type: 'int' })
  comYear: number;

  @Column({ name: 'com_month', type: 'int' })
  comMonth: number;

  @Column({ name: 'raw_intent', type: 'text' })
  rawIntent: string;

  @Column({ name: 'raw_broader_category', type: 'text' })
  rawBroaderCategory: string;

  @Column({ name: 'raw_priority_level', type: 'text', nullable: true })
  rawPriorityLevel: string;

  @Column({name:'com_intent', type:'text'})
  comIntent:string

  @Column({ name: 'com_intent_count', type: 'int' })
  comIntentCount: number;

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
