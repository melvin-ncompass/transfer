import {
  Entity,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SalaryTemplateEarnings } from './tenant.salary-template-earnings.entity';
import { SalaryTemplateDeductions } from './tenant.salary-template-deduction.entity';

@Entity('biz_people_salary_templates')
export class SalaryTemplates {
  @PrimaryGeneratedColumn({ name: 'id' } )
  id: number;

  @Column({ name: 'template_name', length: 256, unique: true })
  templateName: string;

  @Column({ name: 'description', length: 256, nullable: true })
  description?: string;

  @Column({ name: 'annual_gross', type: 'decimal', precision: 18, scale: 2})
  annualGross: string;

  @Column({ name: 'monthly_gross', type: 'decimal', precision: 18, scale: 2})
  monthlyGross: string;

  @OneToMany(
    () => SalaryTemplateEarnings,
    (templateEarning) => templateEarning.template,
  )
  earnings: SalaryTemplateEarnings[];

  @OneToMany(
    () => SalaryTemplateDeductions,
    (templateDeduction) => templateDeduction.template,
  )
  deductions: SalaryTemplateDeductions[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

}

