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
import { Earnings } from '../../earnings/entities/tenant-earnings.entity';
@Entity('biz_people_salary_template_earnings')
@Unique('uq_template_earnings_payslip_order', ['template', 'payslipOrder'])
export class SalaryTemplateEarnings {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ManyToOne(() => SalaryTemplates, (template) => template.earnings, {
    onDelete: 'CASCADE',
  })
  template: SalaryTemplates;

  @ManyToOne(() => Earnings, {
    onDelete: 'RESTRICT',
  })
  earning: Earnings;

  @Column({ name: 'monthly_amount', type: "decimal", precision: 18, scale: 2,})
  monthlyAmount: string;

  @Column({ name: 'payslip_order', type: 'int'})
  payslipOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

}
