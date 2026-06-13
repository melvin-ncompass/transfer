import { Module } from '@nestjs/common';
import { DeductionsController } from './deductions.controller';
import { DeductionsService } from './deductions.service';
import { CompanyModule } from 'src/company/company.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule, CompanyModule],
  controllers: [DeductionsController, ],
  providers: [DeductionsService, ],
  exports: []
})
export class DeductionsModule {}
