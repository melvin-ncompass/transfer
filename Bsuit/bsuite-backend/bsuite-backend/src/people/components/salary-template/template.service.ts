import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from 'src/company/entities/company.entity';
import { DataSource, Repository, In, ILike, Not, EntityManager } from 'typeorm';
import { SalaryTemplates } from './entities/tenant.salary-template.entity';
import { CreateSalaryTemplateDto } from './dto/create-salary-template.dto';
import { UpdateSalaryTemplateDto } from './dto/update-salary-template.dto';
import { SalaryTemplateEarnings } from './entities/tenant.salary-template-earnings.entity';
import { SalaryTemplateDeductions } from './entities/tenant.salary-template-deduction.entity';
import { Earnings } from '../earnings/entities/tenant-earnings.entity';
import { Deduction } from '../deductions/entities/tenant.deductions.entity';

@Injectable()
export class SalaryTemplateService {

  private async validateTemplateNameUniqueness(
    manager: EntityManager,
    templateName: string,
    excludeId?: number,
  ) {
    const where: any = {
      templateName: ILike(templateName),
    };

    if (excludeId) {
      where.id = Not(excludeId);
    }

    const existing = await manager.findOne(SalaryTemplates, { where });

    if (existing) {
      throw new BadRequestException(
        'Salary template name already exists',
      );
    }
  }

  private async validateEarningsAndDeductions(
    manager: EntityManager,
    earnings: { earningId: number }[],
    deductions?: { deductionId: number }[],
  ) {
    if (!earnings?.length) {
      throw new BadRequestException(
        'At least one earning must be present in a salary template',
      );
    }

    const earningRepo = manager.getRepository(Earnings);
    const deductionRepo = manager.getRepository(Deduction);

    const earningIds = earnings.map(e => e.earningId);
    const validEarnings = await earningRepo.find({
      where: { id: In(earningIds) },
    });

    if (validEarnings.length !== earningIds.length) {
      throw new BadRequestException('Invalid earning ID provided');
    }

    if (deductions?.length) {
      const deductionIds = deductions.map(d => d.deductionId);
      const validDeductions = await deductionRepo.find({
        where: { id: In(deductionIds) },
      });

      if (validDeductions.length !== deductionIds.length) {
        throw new BadRequestException('Invalid deduction ID provided');
      }
    }
  }

  async createSalaryTemplate(
    dataSource: DataSource,
    createSalaryTemplateDto: CreateSalaryTemplateDto,
  ) {
    return dataSource.transaction(async manager => {
      const templateRepo = manager.getRepository(SalaryTemplates);
      const templateEarningsRepo = manager.getRepository(SalaryTemplateEarnings);
      const templateDeductionsRepo = manager.getRepository(SalaryTemplateDeductions);

      await this.validateTemplateNameUniqueness(
        manager,
        createSalaryTemplateDto.templateName,
      );

      await this.validateEarningsAndDeductions(
        manager,
        createSalaryTemplateDto.earnings,
        createSalaryTemplateDto.deductions,
      );

      const template = templateRepo.create({
        templateName: createSalaryTemplateDto.templateName,
        description: createSalaryTemplateDto.description,
        annualGross: createSalaryTemplateDto.annualGross,
        monthlyGross: createSalaryTemplateDto.monthlyGross,
      });

      await templateRepo.save(template);

      await templateEarningsRepo.save(
        createSalaryTemplateDto.earnings.map(e =>
          templateEarningsRepo.create({
            template,
            earning: { id: e.earningId },
            monthlyAmount: e.monthlyAmount,
            payslipOrder: e.payslipOrder,
          }),
        ),
      );

      if (createSalaryTemplateDto.deductions?.length) {
        await templateDeductionsRepo.save(
          createSalaryTemplateDto.deductions.map(d =>
            templateDeductionsRepo.create({
              template,
              deduction: { id: d.deductionId },
              monthlyAmount: d.monthlyAmount,
              payslipOrder: d.payslipOrder,
            }),
          ),
        );
      }

      return {
        data: {
          id: template.id,
          templateName: template.templateName,
        },
        change_of_data: {
          templateId: template.id,
          templateName: template.templateName,
          module: 'Payroll',
          feature: 'Salary Template',
          status: 'Create',
        },
      };
    });
  }

  async getSalaryTemplates(
    dataSource: DataSource,
    id?: number,
  ) {
    const templateRepo = dataSource.getRepository(SalaryTemplates);

    // ---- FETCH SINGLE TEMPLATE ----
    if (id) {
      const template = await templateRepo.findOne({
        where: { id },
        relations: {
          earnings: { earning: true },
          deductions: { deduction: true },
        },
        order: {
          earnings: {
            payslipOrder: 'ASC',
          },
          deductions: {
            payslipOrder: 'ASC',
          },
        },
      });

      if (!template) {
        throw new NotFoundException('Salary template not found');
      }

      return template;
    }

    // ---- FETCH ALL TEMPLATES ----
    return templateRepo.find({
      relations: {
        earnings: { earning: true },
        deductions: { deduction: true },
      },
      order: {
        templateName: 'ASC',
        earnings: {
          payslipOrder: 'ASC',
        },
        deductions: {
          payslipOrder: 'ASC',
        },
      },
    });
  }

  async updateSalaryTemplate(
    dataSource: DataSource,
    id: number,
    updateSalaryTemplateDto: UpdateSalaryTemplateDto,
  ) {
    return dataSource.transaction(async manager => {
      const templateRepo = manager.getRepository(SalaryTemplates);
      const templateEarningsRepo = manager.getRepository(SalaryTemplateEarnings);
      const templateDeductionsRepo = manager.getRepository(SalaryTemplateDeductions);

      const template = await templateRepo.findOne({
        where: { id },
        relations: {
          earnings: { earning: true },
          deductions: { deduction: true },
        },
      });

      if (!template) {
        throw new NotFoundException('Salary template not found');
      }

      /* ---------- template name uniqueness ---------- */
      if (updateSalaryTemplateDto.templateName) {
        await this.validateTemplateNameUniqueness(
          manager,
          updateSalaryTemplateDto.templateName,
          id,
        );
      }

      const incomingEarnings = updateSalaryTemplateDto.earnings;
      const incomingDeductions = updateSalaryTemplateDto.deductions;

      /* ---------- explicit empty earnings NOT allowed ---------- */
      if (
        Array.isArray(incomingEarnings) &&
        incomingEarnings.length === 0
      ) {
        throw new BadRequestException(
          'At least one earning must be present in a salary template',
        );
      }

      /* ---------- final earnings for validation ---------- */
      const finalEarnings =
        incomingEarnings !== undefined
          ? incomingEarnings
          : template.earnings.map(e => ({ earningId: e.earning.id }));

      await this.validateEarningsAndDeductions(
        manager,
        finalEarnings,
        incomingDeductions,
      );

      /* ---------- template update ---------- */
      Object.assign(template, {
        templateName:
          updateSalaryTemplateDto.templateName ?? template.templateName,
        description:
          updateSalaryTemplateDto.description ?? template.description,
        annualGross:
          updateSalaryTemplateDto.annualGross ?? template.annualGross,
        monthlyGross:
          updateSalaryTemplateDto.monthlyGross ?? template.monthlyGross,
      });

      await templateRepo.save(template);
      

      /* ---------- earnings upsert + delete ---------- */
      if (Array.isArray(incomingEarnings)) {
        const existingEarningsMap = new Map(
          template.earnings.map(e => [e.earning.id, e]),
        );

        const earningsToSave: SalaryTemplateEarnings[] = [];

        for (const e of incomingEarnings) {
          const existing = existingEarningsMap.get(e.earningId);

          if (existing) {
            const hasChanges =
              existing.monthlyAmount !== e.monthlyAmount ||
              existing.payslipOrder !== e.payslipOrder;

            if (hasChanges) {
              existing.monthlyAmount = e.monthlyAmount;
              existing.payslipOrder = e.payslipOrder;
              earningsToSave.push(existing);
            }
          } else {
            earningsToSave.push(
              templateEarningsRepo.create({
                template,
                earning: { id: e.earningId },
                monthlyAmount: e.monthlyAmount,
                payslipOrder: e.payslipOrder,
              }),
            );
          }
        }

        if (earningsToSave.length) {
          await templateEarningsRepo.save(earningsToSave);
        }

        const earningsToDelete = template.earnings
          .filter(e => !incomingEarnings.some(i => i.earningId === e.earning.id))
          .map(e => e.id);

        if (earningsToDelete.length) {
          await templateEarningsRepo.delete(earningsToDelete);
        }
      }

      /* ---------- deductions upsert + delete ---------- */
      if (Array.isArray(incomingDeductions)) {
        const existingDeductionsMap = new Map(
          template.deductions.map(d => [d.deduction.id, d]),
        );

        const deductionsToSave: SalaryTemplateDeductions[] = [];

        for (const d of incomingDeductions) {
          const existing = existingDeductionsMap.get(d.deductionId);

          if (existing) {
            const hasChanges =
              existing.monthlyAmount !== d.monthlyAmount ||
              existing.payslipOrder !== d.payslipOrder;

            if (hasChanges) {
              existing.monthlyAmount = d.monthlyAmount;
              existing.payslipOrder = d.payslipOrder;
              deductionsToSave.push(existing);
            }
          } else {
            deductionsToSave.push(
              templateDeductionsRepo.create({
                template,
                deduction: { id: d.deductionId },
                monthlyAmount: d.monthlyAmount,
                payslipOrder: d.payslipOrder,
              }),
            );
          }
        }

        if (deductionsToSave.length) {
          await templateDeductionsRepo.save(deductionsToSave);
        }

        const deductionsToDelete = template.deductions
          .filter(d => !incomingDeductions.some(i => i.deductionId === d.deduction.id))
          .map(d => d.id);

        if (deductionsToDelete.length) {
          await templateDeductionsRepo.delete(deductionsToDelete);
        }
      }

      return {
        data: {
          id: template.id,
          templateName: template.templateName,
        },
        change_of_data: {
          templateId: template.id,
          templateName: template.templateName,
          module: 'Payroll',
          feature: 'Salary Template',
          status: 'Update',
        },
      };
    });
  }

  async deleteSalaryTemplate(
    dataSource: DataSource,
    id: number,
  ) {
    return dataSource.transaction(async manager => {
      const templateRepo = manager.getRepository(SalaryTemplates);

      const template = await templateRepo.findOne({
        where: { id },
      });

      if (!template) {
        throw new NotFoundException('Salary template not found');
      }

      await templateRepo.delete(id);

      return {
        data: {
          id,
        },
        message: 'Salary template deleted successfully',
        change_of_data: {
          templateId: id,
          templateName: template.templateName,
          module: 'Payroll',
          feature: 'Salary Template',
          status: 'Delete',
        },
      };
    });
  }
}
