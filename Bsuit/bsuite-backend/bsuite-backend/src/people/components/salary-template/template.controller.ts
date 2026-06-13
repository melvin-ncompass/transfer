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
import { DataSource } from 'typeorm';
import { SalaryTemplateService } from './template.service';
import { JwtAuthGuard } from 'src/common/guard/jwt.auth.guard';
import { CompanyGuard } from 'src/common/guard/company.guard';
import { CompanyDB } from 'src/common/decorators/get-db.decorator';
import { CreateSalaryTemplateDto } from './dto/create-salary-template.dto';
import { UpdateSalaryTemplateDto } from './dto/update-salary-template.dto';

@Controller('salary-templates')
@UseGuards(JwtAuthGuard, CompanyGuard)
export class SalaryTemplateController {
  constructor(private readonly salaryTemplateService: SalaryTemplateService) {}

  @Post()
  async createSalaryTemplate(
    @CompanyDB() dataSource: DataSource,
    @Body() createSalaryTemplateDto: CreateSalaryTemplateDto
  ) {
    const createdSalaryTemplate = 
      await this.salaryTemplateService.createSalaryTemplate(dataSource,createSalaryTemplateDto);
    
    return { 
      data: createdSalaryTemplate, 
      message: "Created Salary Template" 
    };
  }

  @Get()
  async getSalaryTemplates(
    @CompanyDB() dataSource: DataSource,
  ) {
    const salaryTemplates =
      await this.salaryTemplateService.getSalaryTemplates(dataSource);

    return {
      data: salaryTemplates,
      message: 'Fetched all Salary Templates',
    };
  }

  @Get(':id')
  async getSalaryTemplate(
    @CompanyDB() dataSource: DataSource,
    @Param('id') id: string,
  ) {
    const salaryTemplate =
      await this.salaryTemplateService.getSalaryTemplates(dataSource, +id);

    return {
      data: salaryTemplate,
      message: 'Fetched Salary Template',
    };
  }


  @Patch(':id')
  async updateSalaryTemplate(
    @CompanyDB() dataSource: DataSource,
    @Param('id') id: string, 
    @Body() updateSalaryTemplateDto: UpdateSalaryTemplateDto
  ) {
    const updatedSalaryTemplate = 
      await this.salaryTemplateService.updateSalaryTemplate(dataSource,+id, updateSalaryTemplateDto);
    
    return { 
      data: updatedSalaryTemplate, 
      message: "Updated Salary Template" 
    };
  }

  @Delete(':id')
  async deleteSalaryTemplate(
    @CompanyDB() dataSource: DataSource,
    @Param('id') id: string
  ) {
    const deletedSalaryTemplate = 
      await this.salaryTemplateService.deleteSalaryTemplate(dataSource,+id);
    
    return { 
      data: deletedSalaryTemplate, 
      message: "Deleted Salary Template" 
    };
  }
}
