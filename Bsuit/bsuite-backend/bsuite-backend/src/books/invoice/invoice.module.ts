import { forwardRef, Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { DatabaseModule } from 'src/database/database.module';
import { CompanyModule } from 'src/company/company.module';
import { ActivityModule } from 'src/activity/activity.module';
import { TransactModule } from '../transact/transact.module';
import { Company } from 'src/company/entities/company.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingModule } from 'src/setting/setting.module';
import { BillModule } from '../bill/bill.module';
import { QueueModule } from 'src/rmq/queue.module';

@Module({
  imports: [
   TypeOrmModule.forFeature([Company]),
    CompanyModule,
    DatabaseModule,
    ActivityModule,
    TransactModule,
    BillModule,
    forwardRef(() => QueueModule),
    SettingModule
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
