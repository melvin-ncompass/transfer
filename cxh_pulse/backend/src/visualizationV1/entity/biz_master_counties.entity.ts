import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'biz_master_counties' })
export class BizMasterCounties {
    @PrimaryColumn({ name: 'county_id', type:'text' })
    countyId: string;

    @Column({ name: 'county_name', type: 'text' })
    countyName: string

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date
}