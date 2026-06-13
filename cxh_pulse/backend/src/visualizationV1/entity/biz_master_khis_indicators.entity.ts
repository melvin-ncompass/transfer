import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'biz_master_khis_indicators' })
export class BizMasterKhisIndicators {
    @PrimaryColumn( { name: 'raw_dataelement', type:'text' })
    rawDataElement: string;

    @Column({ name: 'raw_dataelement_name', type: 'text' })
    rawDataElementName: string

    @Column({ name: 'com_dataelement_name', type: 'text' })
    comDataElementName: string

    @Column({ name: 'com_category', type: 'text', nullable:true })
    category: string

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' , nullable:true})
    updatedAt: Date
}