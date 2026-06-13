import { Module } from "@nestjs/common";
import {
  DepartmentService,
  DesignationService,
  SubDepartmentService,
} from "./employee-config.service";
import {
  DepartmentController,
  DesignationController,
  SubDepartmentController,
} from "./employee-config.controller";
import { DatabaseModule } from "src/database/database.module";
import { CompanyModule } from "src/company/company.module";

@Module({
  imports: [DatabaseModule, CompanyModule],
  controllers: [
    DesignationController,
    DepartmentController,
    SubDepartmentController,
  ],
  providers: [DesignationService, DepartmentService, SubDepartmentService],
})
export class EmployeeConfigModule {}
