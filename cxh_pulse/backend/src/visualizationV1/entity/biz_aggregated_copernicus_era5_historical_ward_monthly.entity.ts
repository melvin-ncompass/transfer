import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'biz_aggregated_copernicus_era5_historical_ward_monthly' })
export class BizAggregatedCopernicusEra5HistoricalWardMonthly {
    @PrimaryColumn({ name: 'id' , type:'text'})
    id: string;

    @Column({ name: 'com_year', type: 'int' })
    comYear: number

    @Column({ name: 'com_month', type: 'int' })
    comMonth: number

    @Column({ name: 'com_max_zonal_stat_mean_t2m', type: 'float' })
    comMaxZonalStatMeanT2m: number

    @Column({ name: 'com_sum_zonal_stat_sum_tp', type: 'float' })
    comSumZonalStatSumTp: number

    @Column({ name: 'com_county_id', type: 'text' , nullable:true})
    comCountyId: string

    @Column({ name: 'com_subcounty_id', type: 'text' , nullable:true})
    comSubcountyId: string

    @Column({ name: 'com_ward_id', type: 'text' , nullable:true})
    comWardId: string

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at', nullable:true })
    updatedAt: Date
}