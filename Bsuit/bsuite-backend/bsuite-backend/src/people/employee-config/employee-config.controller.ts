import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import {
  DepartmentService,
  DesignationService,
  SubDepartmentService,
} from "./employee-config.service";
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import { CompanyDB } from "src/common/decorators/get-db.decorator";
import { DataSource } from "typeorm";
import { ParseStringPipe } from "src/common/pipes/parse-string.pipe";
import { CompanyGuard } from "src/common/guard/company.guard";
import { CreateDesignationDto } from "./dto/create-designation.dto";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { SwaggerEndpoint } from "src/swagger/custom-decorator";
import { employeeConfigSwagger } from "./swagger/employee-config.swagger";
import { CreateSubDepartmentDto } from "./dto/create-sub-department.dto";
import { UpdateSubDepartmentDto } from "./dto/update-sub-department.dto";

@Controller("designation")
@UseGuards(JwtAuthGuard, CompanyGuard)
export class DesignationController {
  constructor(private readonly designationService: DesignationService) {}

  @Post()
  @SwaggerEndpoint(employeeConfigSwagger, "CREATE_DESIGNATION")
  async create(
    @Body() createDesignationDto: CreateDesignationDto,
    @CompanyDB() dataSource: DataSource,
  ) {
    return {
      message: "Designation Created Successfully",
      data: await this.designationService.create(
        dataSource,
        createDesignationDto.designationName,
      ),
    };
  }

  @Get()
  @SwaggerEndpoint(employeeConfigSwagger, "GET_ALL_DESIGNATIONS")
  async findAll(@CompanyDB() dataSource: DataSource) {
    return await this.designationService.findAll(dataSource);
  }

  @Get(":designationId")
  @SwaggerEndpoint(employeeConfigSwagger, "GET_ONE_DESIGNATION")
  async findOne(
    @Param("designationId") designationId: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    return await this.designationService.findOne(dataSource, +designationId);
  }

  @Patch(":designationId")
  @SwaggerEndpoint(employeeConfigSwagger, "UPDATE_DESIGNATION")
  async update(
    @Param("designationId") designationId: string,
    @Body() createDesignationDto: CreateDesignationDto,
    @CompanyDB() dataSource: DataSource,
  ) {
    return {
      message: "Designation Updated Successfully",
      data: await this.designationService.update(
        dataSource,
        +designationId,
        createDesignationDto.designationName,
      ),
    };
  }

  @Delete(":designationId")
  @SwaggerEndpoint(employeeConfigSwagger, "DELETE_DESIGNATION")
  async remove(
    @Param("designationId") designationId: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    return {
      message: "Designation Deleted Successfully",
      data: await this.designationService.remove(dataSource, +designationId),
    };
  }
}

@Controller("department")
@UseGuards(JwtAuthGuard, CompanyGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @SwaggerEndpoint(employeeConfigSwagger, "CREATE_DEPARTMENT")
  async create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CompanyDB() dataSource: DataSource,
  ) {
    return {
      message: "Department Created Successfully",
      data: await this.departmentService.create(
        dataSource,
        createDepartmentDto.departmentName,
      ),
    };
  }

  @Get()
  @SwaggerEndpoint(employeeConfigSwagger, "GET_ALL_DEPARTMENTS")
  async findAll(@CompanyDB() dataSource: DataSource) {
    return await this.departmentService.findAll(dataSource);
  }

  @Get(":departmentId")
  @SwaggerEndpoint(employeeConfigSwagger, "GET_ONE_DEPARTMENT")
  async findOne(
    @Param("departmentId") departmentId: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    return await this.departmentService.findOne(dataSource, +departmentId);
  }

  @Patch(":departmentId")
  @SwaggerEndpoint(employeeConfigSwagger, "UPDATE_DEPARTMENT")
  async update(
    @Param("departmentId") departmentId: string,
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CompanyDB() dataSource: DataSource,
  ) {
    return {
      message: "Department Updated Successfully",
      data: await this.departmentService.update(
        dataSource,
        +departmentId,
        createDepartmentDto.departmentName,
      ),
    };
  }

  @Delete(":departmentId")
  @SwaggerEndpoint(employeeConfigSwagger, "DELETE_DEPARTMENT")
  async remove(
    @Param("departmentId") departmentId: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    return {
      message: "Department Deleted Successfully",
      data: await this.departmentService.remove(dataSource, +departmentId),
    };
  }
}

@Controller("sub_department")
@UseGuards(JwtAuthGuard, CompanyGuard)
export class SubDepartmentController {
  constructor(private readonly subDepartmentService: SubDepartmentService) {}

  @Post()
  @SwaggerEndpoint(employeeConfigSwagger, "CREATE_SUB_DEPARTMENT")
  async create(
    @Body() createSubDepartmentDto: CreateSubDepartmentDto,
    @CompanyDB() dataSource: DataSource,
  ) {
    return {
      message: "SubDepartment Created Successfully",
      data: await this.subDepartmentService.create(
        dataSource,
        createSubDepartmentDto.subDepartmentName,
        createSubDepartmentDto.departmentId,
      ),
    };
  }

  @Get("all/:departmentId")
  @SwaggerEndpoint(employeeConfigSwagger, "GET_ALL_SUB_DEPARTMENTS")
  async findAll(
    @Param("departmentId") departmentId: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    return await this.subDepartmentService.findAll(dataSource, +departmentId);
  }

  @Get(":subDepartmentId")
  @SwaggerEndpoint(employeeConfigSwagger, "GET_ONE_SUB_DEPARTMENT")
  async findOne(
    @Param("subDepartmentId") subDepartmentId: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    return await this.subDepartmentService.findOne(
      dataSource,
      +subDepartmentId,
    );
  }

  @Patch(":subDepartmentId")
  @SwaggerEndpoint(employeeConfigSwagger, "UPDATE_SUB_DEPARTMENT")
  async update(
    @Param("subDepartmentId") subDepartmentId: string,
    @Body() updateSubDepartmentDto: UpdateSubDepartmentDto,
    @CompanyDB() dataSource: DataSource,
  ) {
    return {
      message: "SubDepartment Updated Successfully",
      data: await this.subDepartmentService.update(
        dataSource,
        +subDepartmentId,
        updateSubDepartmentDto.subDepartmentName,
      ),
    };
  }

  @Delete(":subDepartmentId")
  @SwaggerEndpoint(employeeConfigSwagger, "DELETE_SUB_DEPARTMENT")
  async remove(
    @Param("subDepartmentId") subDepartmentId: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    return {
      message: "SubDepartment Deleted Successfully",
      data: await this.subDepartmentService.remove(
        dataSource,
        +subDepartmentId,
      ),
    };
  }
}
