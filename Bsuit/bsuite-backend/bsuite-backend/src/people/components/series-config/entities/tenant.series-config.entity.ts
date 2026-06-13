import { Exclude } from "class-transformer";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
export enum SeriesName { 
    PERMANENT = 'Permanent',
    INTERN = 'Intern'
}
@Entity({ name: "biz_people_series_config" })
export class SeriesConfig { 
    @PrimaryGeneratedColumn()
    id: number

    @Column({ name: 'series_prefix' })
    seriesPrefix: string

    @Column({ name: 'series_name', type: 'enum', enum: SeriesName, unique: true })
    seriesName: SeriesName

    @CreateDateColumn({name: 'created_at'})
    @Exclude()
    createdAt: Date

    @UpdateDateColumn({name: 'updated_at'})
    @Exclude()
    updatedAt: Date
}