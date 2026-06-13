import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
} from "@nestjs/common";
import { TaxService } from "./tax.service";
import { CreateTaxDto } from "./dto/create-tax.dto";
import { UpdateTaxDto } from "./dto/update-tax.dto";
import { CompanyGuard } from "src/common/guard/company.guard";
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import { CompanyDB } from "src/common/decorators/get-db.decorator";
import { DataSource } from "typeorm";
import express from "express";
import { GetCookie } from "src/common/decorators/get-cookies.decorator";
import { SwaggerEndpoint } from "src/swagger/custom-decorator";
import { taxSwagger } from "./tax.swagger";
import { CurrentUser } from "src/common/decorators/user.decorator";

@UseGuards(JwtAuthGuard, CompanyGuard)
@Controller("tax")
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get()
  @SwaggerEndpoint(taxSwagger, "GET_ALL")
  async getAll(@CompanyDB() dataSource: DataSource) {
    const taxData = await this.taxService.findAll(dataSource);
    return { message: "Tax fetched successfully", data: taxData };
  }

  @Post()
  @SwaggerEndpoint(taxSwagger, "CREATE")
  async create(
    @Body() createTaxDto: CreateTaxDto,
    @CompanyDB() dataSource: DataSource,
  ) {
    const createdData = await this.taxService.create(dataSource, createTaxDto);
    return { message: "Tax created successfully", data: createdData };
  }

  @Patch(":taxId")
  @SwaggerEndpoint(taxSwagger, "UPDATE")
  async update(
    @Param("taxId") taxId: number,
    @Body() updateTaxDto: UpdateTaxDto,
    @CompanyDB() dataSource: DataSource,
  ) {
    const updatedData = await this.taxService.update(
      dataSource,
      taxId,
      updateTaxDto,
    );
    return { message: "Tax updated successfully", data: updatedData };
  }

  @Delete(":taxId")
  @SwaggerEndpoint(taxSwagger, "DELETE")
  async remove(
    @Param("taxId") taxId: number,
    @CompanyDB() dataSource: DataSource,
  ) {
    const deleted = await this.taxService.remove(dataSource, taxId);
    return { message: "Tax deleted successfully", data: deleted };
  }

  @Get("count")
  @SwaggerEndpoint(taxSwagger, "COUNT")
  async count(@CompanyDB() dataSource: DataSource) {
    const count = await this.taxService.taxCount(dataSource);
    return { message: "Tax count fetched successfully", data: count };
  }

  @Post("export")
  @SwaggerEndpoint(taxSwagger, "EXPORT")
  async exportTaxExcel(
    @CompanyDB() dataSource: DataSource,
    @GetCookie("companyId") companyId: string,
    @Res() res: express.Response,
    @CurrentUser("id") userId: number,
  ) {
    const { buffer, change_of_data, fileName } =
      await this.taxService.generateTax(dataSource, companyId, userId);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}.xlsx"`,
    );
    res.setHeader("Content-Length", buffer.length);
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Disposition, Content-Length",
    );
    res.end(buffer);
    return {
      message: "Tax exported successfully",
      data: {
        change_of_data,
      },
    };
  }
}
