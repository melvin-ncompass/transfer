import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Header,
  StreamableFile,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
  UseGuards,
  Delete,
  Query,
} from "@nestjs/common";
import { UncategorizedService } from "./uncategorized.service";
import { CreateUncategorizedDto } from "./dto/create-uncategorized.dto";
import { IgnoreInterceptor, ignoreModuleClassInterceptor } from "src/common/decorators/ignore-interceptor.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { CsvMappingDto } from "./dto/csv-mapping.dto";
import { DataSource } from "typeorm";
import { CompanyDB } from "src/common/decorators/get-db.decorator";
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import { CompanyGuard } from "src/common/guard/company.guard";
import { CreateTransferDto } from "./dto/create-transfer-dto";
import { GetCookie } from "src/common/decorators/get-cookies.decorator";
import { UncategorizedMatchDto } from "./dto/uncategorized-match.dto";
import { SaveUncategorizedMatchDto } from "./dto/split-payment.dto";
import { SaveUncategorizedMultiMatchDto } from "./dto/multi-match.dto";

@Controller("uncategorized")
@UseGuards(JwtAuthGuard, CompanyGuard)
export class UncategorizedController {
  constructor(private readonly uncategorizedService: UncategorizedService) {}

  @Get("uncategorized_match")
  async uncategorizedMatch(
    @Query() uncategorizedMatch: UncategorizedMatchDto,
    @CompanyDB() dataSource: DataSource,
    @GetCookie("companyId") companyId: string
  ) {
    const data = await this.uncategorizedService.uncategorizedMatch(
      uncategorizedMatch,
      dataSource,
      companyId
    );

    return {
      data: data,
      message: "Match data fetched successfully",
    };
  }

  @ignoreModuleClassInterceptor()
  @Post("uncategorized_multi_match")
  async uncategorizedMultiMatch(
    @CompanyDB() dataSource: DataSource,
    @Body() uncategorizedData: UncategorizedMatchDto[],
    @Query() amountType: string,
    @GetCookie("companyId") companyId: string
  ) {
    const data = await this.uncategorizedService.uncategorizedMultiMatch(
      dataSource,
      uncategorizedData,
      companyId
    );

    return {
      data: data,
      message: "Match data fetched successfully",
    };
  }

  @Get()
  async getUncategorizedRows(
    @CompanyDB() dataSource: DataSource,
    @Query("page") page: string = "1",
    @Query("pageSize") pageSize: string = "20",
    @Query("accountId") accountId?: string | string[]
  ) {
    const pageNumber = parseInt(page, 10);
    const pageSizeNumber = parseInt(pageSize, 10);

    let accountIds: number[] | undefined;
    if (accountId) {
      if (Array.isArray(accountId)) {
        accountIds = accountId.map(Number);
      } else {
        accountIds = accountId.split(",").map(Number);
      }
    }

    return {
      data: await this.uncategorizedService.getUncategorizedRows(
        dataSource,
        pageNumber,
        pageSizeNumber,
        accountIds
      ),
    };
  }

  @Get("demo_csv")
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", "attachment; filename=bank_statement_demo.csv")
  @IgnoreInterceptor()
  async exportCsv() {
    try {
      const fileStream: StreamableFile =
        this.uncategorizedService.getCsvStream();
      return fileStream;
    } catch (error) {
      console.error("CSV export error:", error);
      throw new InternalServerErrorException("File not sent!");
    }
  }

  @Post("save_uncategorized_match")
  async saveUncategorizedMatch(
    @Query("uncatId") uncatId: string,
    @Body() dto: SaveUncategorizedMatchDto,
    @CompanyDB() dataSource: DataSource,
    @GetCookie("companyId") companyId: string
  ) {
    const data = await this.uncategorizedService.saveUncategorizedMatch(
      dataSource,
      dto,
      +uncatId,
      companyId
    );
    return data;
  }

  @Post("save_uncategorized_multi_match")
  async saveUncategorizedMultiMatch(
    @CompanyDB() dataSource: DataSource,
    @Body() uncategorizedDataList:SaveUncategorizedMultiMatchDto,
    @Query("amountType") amountType: string,
    @Query("transactionTypeId") transactionTypeId: string,
    @GetCookie("companyId") companyId: string
  ) {
    const data = await this.uncategorizedService.saveUncategorizedMultiMatch(
      dataSource,
      uncategorizedDataList,
      amountType,
      transactionTypeId,
      companyId
    );
    return data;
  }

  @Post("extract_columns")
  @UseInterceptors(FileInterceptor("file"))
  async extractColumns(
    @UploadedFile() file: Express.Multer.File,
    @Body("userDateFormat") userDateFormat: string
  ) {
    if (!file) throw new BadRequestException("CSV file is required.");
    const csvData = file.buffer.toString();
    return await this.uncategorizedService.extractColumns(
      csvData,
      userDateFormat
    );
  }

  @Post("process_csv")
  @UseInterceptors(FileInterceptor("file"))
  async processCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body() mapping: CsvMappingDto,
    @Body("userDateFormat") userDateFormat: string
  ) {
    if (!file) throw new BadRequestException("CSV file is required.");
    const csvData = file.buffer.toString();
    return await this.uncategorizedService.process(
      csvData,
      mapping,
      userDateFormat
    );
  }

  @Post("bulk-create/:accountId")
  async bulkCreate(
    @Param("accountId", ParseIntPipe) accountId: number,
    @Body() transactions: CreateUncategorizedDto[],
    @CompanyDB() dataSource: DataSource
  ) {
    return await this.uncategorizedService.bulkCreate(
      accountId,
      transactions,
      dataSource
    );
  }

  @Post("transfer")
  async saveTransfer(
    @Body() uncatData: CreateTransferDto,
    @CompanyDB() dataSource: DataSource,
    @GetCookie("companyId") companyId: string
  ) {
    const response = await this.uncategorizedService.saveTransfer(
      uncatData,
      dataSource,
      companyId
    );
    return {
      data: response,
      message: "Transfer saved successfully",
    };
  }

  @Delete()
  async removeUncategorized(
    @Body() uncatIdList: number[],
    @CompanyDB() dataSource: DataSource
  ) {
    const data = await this.uncategorizedService.removeUncategorized(
      dataSource,
      uncatIdList
    );
    return {
      data: data,
      message: "Transaction deleted successfully",
    };
  }

  @Get("count")
  async uncategorizedCount(
    @CompanyDB() dataSource: DataSource,
    @Query("accountId") accountId?: string | string[]
  ) {
    let accountIds: number[] | undefined;
    if (accountId) {
      if (Array.isArray(accountId)) {
        accountIds = accountId.map(Number);
      } else {
        accountIds = accountId.split(",").map(Number);
      }
    }
    const count = await this.uncategorizedService.uncategorizedCount(
      dataSource,
      accountIds
    );
    return {
      data: count,
      message: "Uncategorized Count fetched successfully",
    };
  }
}
