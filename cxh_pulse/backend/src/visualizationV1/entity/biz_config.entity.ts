import { Entity, Column, CreateDateColumn, DeleteDateColumn, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'biz_config' })
export class BizConfig {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'name' })
    name: string;

    @Column({ name: 'config', type: 'jsonb' })
    config: {
        temperatureThreshold: number;
        precipitationThreshold: number;
    };

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;
}

// @Index({ unique: true })
// @Column({ name: 'parameter_name' })
// parameterName: string;

// @Column({ name: 'threshold_value' , nullable:true})
// thresholdValue: number;

// // @Column({ name: 'description', nullable:true})
// // description: string;

