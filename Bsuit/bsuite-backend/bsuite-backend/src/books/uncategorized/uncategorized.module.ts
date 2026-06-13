import { Module } from "@nestjs/common";
import { UncategorizedService } from "./uncategorized.service";
import { UncategorizedController } from "./uncategorized.controller";
import { DatabaseModule } from "src/database/database.module";
import { CompanyModule } from "src/company/company.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Company } from "src/company/entities/company.entity";
import { TransactModule } from "../transact/transact.module";
import { FxModule } from "src/fx/fx.module";
import { InvoiceModule } from "../invoice/invoice.module";
import { BillModule } from "../bill/bill.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Company]),
    DatabaseModule,
    CompanyModule,
    TransactModule,
    FxModule,
    InvoiceModule,
    BillModule,
    FxModule
  ],
  controllers: [UncategorizedController],
  providers: [UncategorizedService],
})
export class UncategorizedModule {}
