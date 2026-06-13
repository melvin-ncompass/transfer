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
import { CreateEarningsDto } from './dto/create-earnings.dto';
import { UpdateEarningsDto } from './dto/update-earnings.dto';
import { EarningsService } from './earnings.service';
import { CompanyGuard } from 'src/common/guard/company.guard';
import { JwtAuthGuard } from 'src/common/guard/jwt.auth.guard';
import { CompanyDB } from 'src/common/decorators/get-db.decorator';
import { DataSource } from 'typeorm';
@UseGuards(JwtAuthGuard, CompanyGuard)
@Controller('earnings')
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) { }

  @Post()
  async createEarning(
    @CompanyDB() dataSource: DataSource,
    @Body() createEarningsDto: CreateEarningsDto) {
    const earning = await this.earningsService.createEarning(dataSource, createEarningsDto);
    return {
      data: earning,
      message: "Earning created successfully"
    }
  }

  @Get()
  async findAll(@CompanyDB() dataSource: DataSource) {
    const earnings = await this.earningsService.findEarnings(dataSource);
    return {
      data: earnings,
      message: "Earnings fetched successfully"
    }
  }

  @Get(':id')
  async findOne(@CompanyDB() dataSource: DataSource, @Param('id') id: string) {
    const earning = await this.earningsService.findEarningById(dataSource, +id);
    return {
      data: earning,
      message: "Earning fetched successfully"
    }
  }

  @Patch(':id')
  async updateEarning(@CompanyDB() dataSource: DataSource, @Param('id') id: string, @Body() updateEarningsDto: UpdateEarningsDto) {
    const earning = await this.earningsService.updateEarning(dataSource, +id, updateEarningsDto);
    return {
      data: earning,
      message: "Earning updated successfully"
    }
  }

  @Delete(':id')
  async remove(@CompanyDB() dataSource: DataSource, @Param('id') id: string) {
    await this.earningsService.deleteEarning(dataSource, +id);
    return {
      message: "Earning deleted successfully"
    }
  }
}
