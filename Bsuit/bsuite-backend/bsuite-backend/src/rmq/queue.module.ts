import { forwardRef, Module } from "@nestjs/common";
import { ProducerService } from "./producer.service";
import { ConsumerService } from "./consumer.service";
import { ActivityModule } from "src/activity/activity.module";
import { EmailService } from "src/auth/mail.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Company } from "src/company/entities/company.entity";
import { ReportsModule } from "src/books/reports/reports.module";
import { TransactModule } from "src/books/transact/transact.module";
import { DatabaseModule } from "src/database/database.module";
import { CompanyModule } from "src/company/company.module";
import { InvoiceModule } from "src/books/invoice/invoice.module";
import { SettingModule } from "src/setting/setting.module";

@Module({
  imports: [ 
    forwardRef(() => ActivityModule),
    TypeOrmModule.forFeature([Company]),
    ActivityModule,
    ReportsModule,
    TransactModule,
    InvoiceModule,
    DatabaseModule,
    CompanyModule,
    SettingModule
  ],
  providers: [ProducerService, ConsumerService, EmailService],
  exports: [ProducerService, ConsumerService],
})
export class QueueModule {}
