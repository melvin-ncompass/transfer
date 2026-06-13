import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'biz_master_khis_computed_indicators' })
export class BizMasterKhisComputedIndicators {
    @PrimaryColumn( { name: 'com_dataelement', type:'text' })
    comDataelement: string;

    @Column({ name: 'raw_dataelement_name', type: 'text' })
    rawDataelementName: string

    @Column({ name: 'com_dataelement_name', type: 'text' })
    comDataelementName: string

    @Column({ name: 'primary_indicator', type: 'text' })
    primaryIndicator: string

    @Column({ name: 'com_x_axis_title', type: 'text'})
    comXAxisTitle: string

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' , nullable:true})
    updatedAt: Date
}