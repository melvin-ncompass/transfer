import {
  Unique,
  Entity,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SalaryTemplates } from './tenant.salary-template.entity';
import { Deduction } from '../../deductions/entities/tenant.deductions.entity';
@Entity('biz_people_salary_template_deductions')
@Unique('uq_template_deductions_payslip_order', ['template', 'payslipOrder'])
export class SalaryTemplateDeductions {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ManyToOne(() => SalaryTemplates, (template) => template.deductions, {
    onDelete: 'CASCADE',
  })
  template: SalaryTemplates;

  @ManyToOne(() => Deduction, {
    onDelete: 'RESTRICT',
  })
  deduction: Deduction;

  @Column({ name: 'monthly_amount', type: "decimal", precision: 18, scale: 2,})
  monthlyAmount: string;

  @Column({ name: 'payslip_order', type: 'int'})
  payslipOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

}
