import { Module } from "@nestjs/common";
import { BillService } from "./bill.service";
import { BillController } from "./bill.controller";
import { DatabaseModule } from "src/database/database.module";
import { CompanyModule } from "src/company/company.module";
import { TransactModule } from "../transact/transact.module";
import { StorageModule } from "src/storage/storage.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Company } from "src/company/entities/company.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Company]),
    DatabaseModule,
    CompanyModule,
    TransactModule,
    StorageModule
  ],
  controllers: [BillController],
  providers: [BillService],
  exports: [BillService]
})
export class BillModule { }
