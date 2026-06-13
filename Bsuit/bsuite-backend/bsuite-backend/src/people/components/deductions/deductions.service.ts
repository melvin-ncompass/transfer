import { Body, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, ILike } from 'typeorm';
import { Deduction } from './entities/tenant.deductions.entity';
import { UpdateDeductionDto } from './dto/update-deductions.dto';
import { CreateDeductionsDto } from './dto/create-deductions.dto';


@Injectable()
export class DeductionsService {
  
  async createDeduction(dataSource: DataSource, deductionDetails: CreateDeductionsDto) {
    const deductionRepo = dataSource.getRepository(Deduction);
    const newDeduction = deductionRepo.create(deductionDetails);
    const deductionNameExists = await deductionRepo.findOne({ where: { deductionName: ILike(deductionDetails.deductionName) } })
    if (deductionNameExists) { 
      throw new ConflictException(`Deduction with name ${deductionDetails.deductionName} already exists`);
    }
    await deductionRepo.save(newDeduction);
    return {
      data: {
        id: newDeduction.id,
        deductionName: newDeduction.deductionName,
        nameInPayslip: newDeduction.nameInPayslip,
        amount: newDeduction.amount
      },
      change_of_data: {
        id: newDeduction.id,
        deductionName: newDeduction.deductionName,
        nameInPayslip: newDeduction.nameInPayslip,
        module: "Payroll",
        feature: "Deductions",
        status: "Create",
      }
    }

  }

  async findAllDeductions(dataSource: DataSource) {
    const deductionRepo = dataSource.getRepository(Deduction)
    return await deductionRepo.find();
  }

  async findOne(dataSource: DataSource, deductionId: number) {
    const deductionRepo = dataSource.getRepository(Deduction);
    const deductionExists = await deductionRepo.findOne({ where: { id: deductionId } })
    if (!deductionExists) { 
      throw new ConflictException(`Deduction with id ${deductionId} does not exist`);
    }
    return deductionExists;
  }

  async updateDeduction(dataSource: DataSource , updatedDeductionDetails:UpdateDeductionDto, deductionId: number) {
    const deductionRepo = dataSource.getRepository(Deduction)
    const deductionToUpdate = await this.findOne(dataSource, deductionId);

    if (updatedDeductionDetails.deductionName) { 
      const deductionNameExists = await deductionRepo.findOne({ where: { deductionName: ILike(updatedDeductionDetails.deductionName) } })
      if (deductionNameExists &&deductionNameExists.id !== deductionId) {
        throw new ConflictException(`Deduction with name ${updatedDeductionDetails.deductionName} already exists`);
      }
    }
    
    if (!deductionToUpdate) {
      throw new NotFoundException(`Deduction with id ${deductionId} not found`);
    }

    Object.assign(deductionToUpdate, updatedDeductionDetails);
    const updatedDeduction = await deductionRepo.save(deductionToUpdate)

    if (!updatedDeduction) {
      throw new NotFoundException(`Deduction with id ${deductionId} not found`);
    }
    return {
      data: {
        id: updatedDeduction?.id,
        deductionName: updatedDeduction?.deductionName,
      },
      change_of_data: {
        id: updatedDeduction?.id,
        deductionName: updatedDeduction?.deductionName,
        module: "Payroll",
        feature: "Deductions",
        status: "Update",
      }
    }
  }

  async deleteDeduction(dataSource: DataSource, deductionId: number) {
    const deductionRepo = dataSource.getRepository(Deduction);
    const deductionToDelete = await this.findOne(dataSource, deductionId);
    if (!deductionToDelete) { 
      throw new NotFoundException(`Deduction with id ${deductionId} not found`);
    }
    await deductionRepo.remove(deductionToDelete);
    return {
      change_of_data: {
        id: deductionId,
        deductionName: deductionToDelete.deductionName,
        module: "Payroll",
        feature: "Deductions",
        status: "Delete",
      }
    }
  }

}
