import { Module } from '@nestjs/common';
import { SalaryTemplateService } from './template.service';
import { SalaryTemplateController } from './template.controller';
import { DatabaseModule } from 'src/database/database.module';
import { CompanyModule } from 'src/company/company.module';

@Module({
  imports: [DatabaseModule, CompanyModule],
  controllers: [SalaryTemplateController,],
  providers: [SalaryTemplateService,],
  exports: []
})
export class SalaryTemplateModule { }