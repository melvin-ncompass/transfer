import { Module } from '@nestjs/common';
import { PayrollConfigService } from './payroll-config.service';
import { PayrollConfigController } from './payroll-config.controller';
import { DatabaseModule } from 'src/database/database.module';
import { CompanyModule } from 'src/company/company.module';

@Module({
  imports: [
        DatabaseModule,
        CompanyModule,
  ],
  controllers: [PayrollConfigController],
  providers: [PayrollConfigService],
})
export class PayrollConfigModule {}
