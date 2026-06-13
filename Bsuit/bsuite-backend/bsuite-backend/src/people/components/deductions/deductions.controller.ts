import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DeductionsService } from './deductions.service';
import { CompanyGuard } from 'src/common/guard/company.guard';
import { JwtAuthGuard } from 'src/common/guard/jwt.auth.guard';
import { CompanyDB } from 'src/common/decorators/get-db.decorator';
import { DataSource } from 'typeorm';
import { CreateDeductionsDto } from './dto/create-deductions.dto';
import { UpdateDeductionDto } from './dto/update-deductions.dto';
;

@Controller('deductions')
@UseGuards(JwtAuthGuard, CompanyGuard)
export class DeductionsController {
  constructor(private readonly deductionsService: DeductionsService) {}

  @Post()
  async createDeduction(
    @CompanyDB() dataSource: DataSource,
    @Body() deductionDetails: CreateDeductionsDto){
    return {
      data: await this.deductionsService.createDeduction(dataSource, deductionDetails),
      message: "New Deduction added successfully!"
    }
  }

  @Get()
  async findAll(
    @CompanyDB() dataSource: DataSource
  ) {
    const allDeductions = await this.deductionsService.findAllDeductions(dataSource);
    return {
      data: allDeductions,
      message: "Successfully fetched all deductions"
    }
  }

  @Get(':id')
  async findDeduction(
    @CompanyDB() dataSource: DataSource,
    @Param('id') deductionId: number) {
    return {
      data: await this.deductionsService.findOne(dataSource, +deductionId),
      message: `Successfully fetched deduction`
     }
  }

  @Patch(':id')
  async updateDeduction(
    @CompanyDB() dataSource: DataSource,
    @Param('id') deductionId: string,
    @Body() updatedDeductionDetails: UpdateDeductionDto) {
    return {
      data: await this.deductionsService.updateDeduction(dataSource, updatedDeductionDetails, +deductionId),
      message: `Deduction updated successfully`
    }
  }

  @Delete(':id')
  async deleteDeduction(
    @CompanyDB() dataSource: DataSource,
    @Param('id') deductionId: number) {
    await this.deductionsService.deleteDeduction(dataSource, +deductionId)
    return {
      message: "Deduction deleted successfully!"
    }
  }

}
