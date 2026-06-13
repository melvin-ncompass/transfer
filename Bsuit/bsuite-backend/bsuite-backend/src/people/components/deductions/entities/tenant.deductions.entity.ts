import { Exclude } from "class-transformer";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum DeductionType {
    POST_TAX = 'Post-Tax Deduction',
    PRE_TAX = 'Pre-Tax Deduction'
}
export enum DeductionFrequency { 
    RECURRING = 'Recurring',
    NON_RECURRING = 'Non-Recurring'
} 

@Entity({ name: "biz_people_deductions" })
export class Deduction {
    @PrimaryGeneratedColumn()
    id: number
    
    @Column({ name: 'deduction_type', type: 'enum', enum: DeductionType, default: DeductionType.POST_TAX })
    deductionType: DeductionType

    @Column({ name: 'deduction_name',unique: true, length: 100 })
    deductionName: string

    @Column({ name: 'deduction_frequency', type: 'enum', enum: DeductionFrequency })
    deductionFrequency: DeductionFrequency

    @Column({ name: 'name_in_payslip', length: 100 })
    nameInPayslip: string

    @Column({name: 'calculation_type'})
    calculationType: string
    
    @Column({
    name: "amount",
    type: "decimal",
    precision: 18,
    scale: 2,
    })
    amount: string

    @Column({ name: 'is_active' })
    isActive: boolean

    @Column({ name: 'is_editable', default: true })
    isEditable: boolean

    @Exclude()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @Exclude()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date
}
