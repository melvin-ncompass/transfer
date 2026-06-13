import { forwardRef, Module } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";
import { DatabaseModule } from "src/database/database.module";
import { CompanyModule } from "src/company/company.module";
import { ActivityModule } from "src/activity/activity.module";
import { FxModule } from "src/fx/fx.module";
import { QueueModule } from "src/rmq/queue.module";
import { TransactModule } from "../transact/transact.module";
 
@Module({
  imports: [
    DatabaseModule,
    CompanyModule,
    ActivityModule,
    forwardRef(() => QueueModule),
    FxModule,
    TransactModule
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
