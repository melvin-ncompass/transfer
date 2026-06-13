import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'biz_master_subcounties' })
export class BizMasterSubcounties {
    @PrimaryColumn( { name: 'subcounty_id', type:'text' })
    subcountyId: string;

    @Column({ name: 'subcounty_name', type: 'text' })
    subcountyName: string

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at', nullable:true })
    updatedAt: Date
}