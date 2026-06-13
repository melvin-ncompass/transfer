import { Module } from '@nestjs/common';
import { CompanyModule } from 'src/company/company.module';
import { DatabaseModule } from 'src/database/database.module';
// import { LeavePlansController } from './plans/plans.controller';
// import { LeavePlansService } from './plans/plans.service';

@Module({
  imports: [DatabaseModule, CompanyModule],
  controllers: [
    // LeavePlansController
  ],
  providers: [
    // LeavePlansService
  ],
  exports: []
})
export class LeaveModule { }