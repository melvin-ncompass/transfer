import { forwardRef, Module } from "@nestjs/common";
import { TransactService } from "./transact.service";
import { TransactController } from "./transact.controller";
import { StorageModule } from "src/storage/storage.module";
import { DatabaseModule } from "src/database/database.module";
import { CompanyModule } from "src/company/company.module";
import { InvoiceModule } from "../invoice/invoice.module";
import { BillModule } from "../bill/bill.module";
import { QueueModule } from "src/rmq/queue.module";
import { safeImportModule, safeLoadEntities } from "src/shared/utils";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    DatabaseModule,
    CompanyModule,
    StorageModule,
    forwardRef(() => QueueModule),
  ],
  controllers: [TransactController],
  providers: [TransactService],
  exports: [TransactService],
})
export class TransactModule {}
 