import { Module } from "@nestjs/common";
import { JournalService } from "./journal.service";
import { JournalController } from "./journal.controller";
import { DatabaseModule } from "src/database/database.module";
import { CompanyModule } from "src/company/company.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Company } from "src/company/entities/company.entity";
import { TransactModule } from "../transact/transact.module";

@Module({
  imports: [DatabaseModule, CompanyModule, TypeOrmModule.forFeature([Company]), TransactModule],
  controllers: [JournalController],
  providers: [JournalService],
})
export class JournalModule {}
