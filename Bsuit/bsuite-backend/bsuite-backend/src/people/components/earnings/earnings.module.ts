import { Module } from '@nestjs/common';
import { EarningsController } from './earnings.controller';
import { EarningsService } from './earnings.service';
import { CompanyModule } from 'src/company/company.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    CompanyModule,
  ],
  controllers: [EarningsController,],
  providers: [EarningsService,],
  exports: []
})
export class EarningsModule { }
