import { Module } from "@nestjs/common";
import { FxService } from "./fx.service";
import { FxController } from "./fx.controller";
import { CacheModule } from "@nestjs/cache-manager";
import { CompanyModule } from "src/company/company.module";
import { DatabaseModule } from "src/database/database.module";

@Module({
  imports: [CacheModule.register(), DatabaseModule, CompanyModule],
  controllers: [FxController],
  providers: [FxService],
  exports: [FxService],
})
export class FxModule {}
