import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'biz_master_wards' })
export class BizMasterWards {
    @PrimaryColumn( { name: 'ward_id', type:'text' })
    wardId: string;

    @Column({ name: 'ward_name', type: 'text' })
    wardName: string

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at', nullable:true })
    updatedAt: Date
}