import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('biz_raw_kajiado_projections')
export class BizRawKajiadoProjections {
    @PrimaryGeneratedColumn('uuid' , { name: 'id' })
    id: string;

    @Column({ type: 'text' , name: 'raw_indicator_rate_name' })
    rawIndicatorRateName: string;

    @Column({ name: 'raw_date' })
    comYear: Date;

    // @Column({ type: 'integer' , name: 'com_year' })
    // comYear: number;

    // @Column({ type: 'integer' , name: 'com_month' })
    // comMonth: number;

    @Column({ type: 'double precision' , name: 'raw_value' , nullable: true })
    rawValue: number;

    @Column({ type: 'double precision' , name: 'raw_ci_low' , nullable: true })
    rawCiLow: number;

    @Column({ type: 'double precision' , name: 'raw_ci_high' , nullable: true })
    rawCiHigh: number;

    @Column({ type: 'text' , name: 'raw_type' })
    rawType: string;
}