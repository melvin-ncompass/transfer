import { Expose, Transform } from 'class-transformer';
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'biz_computed_kajiado_population' })
export class BizComputedKajiadoPopulation {

    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'com_county_id', type: 'text', nullable:true })
    comCountyId: string;

    @Column({ name: 'com_subcounty_id', type: 'text', nullable:true })
    comSubcountyId: string;

    @Column({ name: 'com_ward_id', type: 'text' , nullable:true})
    comWardId: string;

    @Column({ name: 'raw_year', type: 'int' })
    rawYear: number;

    @Column({ name: 'raw_month', type: 'int' })
    rawMonth: number;

    @Column({ name: 'raw_population', type: 'int' })
    rawPopulation: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' , nullable:true})
    updatedAt: Date
}
