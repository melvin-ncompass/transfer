import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseBoolPipe,
  Res,
  Req,
} from "@nestjs/common";
import { CompanyService } from "./company.service";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import { CurrentUser } from "src/common/decorators/user.decorator";
import { ParseStringPipe } from "src/common/pipes/parse-string.pipe";
import type { Request, Response } from "express";
import { CompanyDB } from 'src/common/decorators/get-db.decorator';
import { DataSource } from "typeorm";
import { CompanyGuard } from "src/common/guard/company.guard";
import { GetCookie } from "src/common/decorators/get-cookies.decorator";
import { IgnoreInterceptor, ignoreModuleClassInterceptor } from "src/common/decorators/ignore-interceptor.decorator";

@Controller("company")
export class CompanyController {
  constructor(private readonly companyService: CompanyService) { }

  @ignoreModuleClassInterceptor()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser("id") userId: number,
    @CurrentUser("email") email: string,
  ) {
    const createdCompany = await this.companyService.create(createCompanyDto, userId, email);

    return { message: "Company created successfully", data: createdCompany }
  }

  @ignoreModuleClassInterceptor()
  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  async update(@Param("id") id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    const updatedCompany = await this.companyService.update(+id, updateCompanyDto);
    return { message: "Company updated successfully", data: updatedCompany }
  }

  @ignoreModuleClassInterceptor()
  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @CurrentUser("id") userId: number,
    @GetCookie("companyId") companyId: string
  ) {
    const deletedCompany = await this.companyService.remove(+id, userId, companyId);
    return { message: "Company deleted successfully", data: deletedCompany }
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Post("manage_people_access")
  managePeopleAccess(
    @GetCookie("companyId") companyId: string,
    @Body("enable", ParseBoolPipe) enable: boolean,
    @CompanyDB() dataSource: DataSource
  ) {
    return this.companyService.managePeopleAccess(companyId, enable, dataSource);
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Get("get_people_access")
  getPeopleAccess(@GetCookie("companyId") companyId: string, @CompanyDB() dataSource: DataSource) {
    return this.companyService.getPeopleAccess(companyId, dataSource);
  }

  @ignoreModuleClassInterceptor()
  @Post("set_default_company")
  @UseGuards(JwtAuthGuard)
  async setDefaultCompany(
    @Body("companyId", new ParseStringPipe("companyId")) companyId: string,
    @CurrentUser("id") userId: number
  ) {
    await this.companyService.setDefaultCompany(userId, companyId);
    return {
      message: `Default company set with companyId ${companyId}`,
    };
  }

  @Get("list_all_company")
  @UseGuards(JwtAuthGuard)
  async listAllCompany(@CurrentUser("id") userId: number) {
    return {
      message: `All companies fetched`,
      data: await this.companyService.listAllCompany(userId),
    };
  }

  @ignoreModuleClassInterceptor()
  @Post("set_current_company")
  @UseGuards(JwtAuthGuard)
  async setCurrentCompany(
    @Body('companyId', new ParseStringPipe('companyId')) companyId: string,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('sessionId') sessionId: string,
    @CurrentUser('userId') userId: number
  ) {
    await this.companyService.setCurrentCompany(userId, companyId, res, sessionId)
  }

  @Get("headers")
  @UseGuards(JwtAuthGuard)
  async headerData(
    @CurrentUser('id') userId: number,
    @Req() req: Request
  ) {
    const companyId = req.cookies['companyId'];
    return await this.companyService.headerData(userId, companyId)
  }

  @ignoreModuleClassInterceptor()
  @Post("create_default_accounts_all")
  @UseGuards(JwtAuthGuard)
  async createDefaultDataForAllCompanies(
  ) {
    await this.companyService.createDefaultDataForAllCompanies()
  }

}
