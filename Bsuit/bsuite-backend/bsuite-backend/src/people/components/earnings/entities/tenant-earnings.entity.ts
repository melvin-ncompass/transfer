import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
export enum EarningFrequency {
    RECURRING = 'Recurring',
    NON_RECURRING = 'NonRecurring'
}

export enum CalculationType {
    AMOUNT = 'Amount',
    PERCENTAGE = 'Percentage'
}

@Entity({ name: 'biz_people_earnings' })
export class Earnings {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ name: 'earning_name', unique: true, length: 100 })
    earningName: string

    @Column({ name: 'name_in_payslip', length: 100 })
    nameInPayslip: string

    @Column({
        name: 'calculation_type',
        type: 'enum',
        enum: CalculationType,
    })
    calculationType: CalculationType;

    @Column({
        name: 'amount',
        type: "decimal",
        precision: 18,
        scale: 2,
        default: 0
    })
    amount: number

    @ManyToOne(() => Earnings, { cascade: true, onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'percentage_of' })
    percentageOf: Earnings

    @Column({
        name: 'earning_frequency',
        type: 'enum',
        enum: EarningFrequency,
    })
    earningFrequency: EarningFrequency;


    @Column({ name: 'is_editable', default: true })
    isEditable: boolean

    @Column({ name: 'is_active', default: false })
    isActive: boolean

    @Column({ name: 'tax_exempt', default: false })
    taxExempt: boolean

    @Column({ name: 'is_pro_rata_basis', default: true })
    isProRataBasis: boolean

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date
}