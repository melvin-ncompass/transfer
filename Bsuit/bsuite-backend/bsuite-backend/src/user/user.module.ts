import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GcsService } from "./gcs.service";
import { safeImportModule } from "src/shared/utils";
import { safeLoadEntities } from "src/shared/utils";
import { RecoveryStrategy } from "src/auth/strategies/recovery.strategy";
import { CompanyModule } from "src/company/company.module";
import { UserCompanyRelation } from "src/company/entities/user-company-relation.entity";
import { DatabaseModule } from "src/database/database.module";
import { Company } from "src/company/entities/company.entity";
const AuthModule = safeImportModule("../auth/auth.module");

@Module({
  imports: [
    TypeOrmModule.forFeature([...safeLoadEntities("../auth/entities"), UserCompanyRelation, Company]),
    ...(AuthModule ? [AuthModule] : []),
    CompanyModule,
    DatabaseModule
  ],
  controllers: [UserController],
  providers: [UserService, GcsService, RecoveryStrategy],
  exports: [GcsService]
})
export class UserModule { }
