import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Header,
  Query,
  StreamableFile,
  UseGuards,
  ParseEnumPipe,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  InternalServerErrorException,
  Res,
} from "@nestjs/common";
import { AccountService, GroupService } from "./account.service";
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import { CreateGroupDataDto } from "./dto/create-group.dto";
import { UpdateGroupDataDto } from "./dto/update-group.dto";
import { CompanyDB } from "src/common/decorators/get-db.decorator";
import { DataSource } from "typeorm";
import { CompanyGuard } from "src/common/guard/company.guard";
import { CreateAccountDataDto } from "./dto/create-account.dto";
import { UpdateAccountDataDto } from "./dto/update-account.dto";
import { AccountType } from "src/common/enum/account-type.enum";
import { CsvMappingDto } from "./dto/csv-mapping.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { IgnoreInterceptor, ignoreModuleClassInterceptor } from "src/common/decorators/ignore-interceptor.decorator";
import { ReportRepositionArray } from "./dto/report-position.dto";
import { GetCookie } from "src/common/decorators/get-cookies.decorator";
import express from "express";
import { CurrentUser } from "src/common/decorators/user.decorator";
import { ZeroBalanceToggleDto } from "./dto/zero-balance-toggle.dto";

@UseGuards(JwtAuthGuard, CompanyGuard)
@Controller("group")
export class GroupController {
  constructor(private readonly groupService: GroupService) { }

  @Get()
  async getAllGroupData(
    @CompanyDB() dataSource: DataSource,
    @Query(
      "groupType",
      new ParseEnumPipe(AccountType, {
        optional: true,
        exceptionFactory: (errors) =>
          new BadRequestException(
            `Invalid groupType. Allowed values are: ${Object.values(AccountType).join(", ")}`
          ),
      })
    )
    groupType?: AccountType
  ) {
    const groups = await this.groupService.getAllGroupData(
      dataSource,
      groupType
    );
    return {
      data: groups,
      message: groups.length
        ? "Groups fetched successfully"
        : "No groups found",
    };
  }

  @Get(":id")
  async findGroupById(
    @CompanyDB() dataSource: DataSource,
    @Param("id") id: string
  ) {
    const group = await this.groupService.findGroupById(dataSource, +id);
    return {
      data: group,
      message: "Group fetched successfully",
    };
  }

  @Post()
  async createGroup(
    @CompanyDB() dataSource: DataSource,
    @Body() createGroupDto: CreateGroupDataDto
  ) {
    const group = await this.groupService.createGroup(
      dataSource,
      createGroupDto
    );
    return {
      data: group,
      message: "Group created successfully",
    };
  }

  @Patch(":id")
  async updateGroup(
    @CompanyDB() dataSource: DataSource,
    @Param("id") id: string,
    @Body() updateGroupDto: UpdateGroupDataDto
  ) {
    const group = await this.groupService.updateGroup(
      dataSource,
      +id,
      updateGroupDto
    );
    return {
      data: group,
      message: "Group updated successfully",
    };
  }

  @Delete(":id")
  async removeGroup(
    @CompanyDB() dataSource: DataSource,
    @Param("id") id: string
  ) {
    const deletedGroup = await this.groupService.removeGroup(dataSource, +id);
    return {
      data: deletedGroup,
      message: "Group deleted successfully",
    };
  }

  @Post("export")
  async exportGroupExcel(
    @CompanyDB() dataSource: DataSource,
    @GetCookie("companyId") companyId: string,
    @Res() res: express.Response
  ) {
    const { buffer, change_of_data, fileName } = await this.groupService.generateGroup(dataSource, companyId);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}.xlsx"`
    );

    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Disposition, Content-Length"
    );
    res.setHeader("Content-Length", buffer.length);
    res.end(buffer);
    return {
      message: "Groups exported successfully", data: {
        change_of_data
      }
    }
  }
}

@Controller("account")
@UseGuards(JwtAuthGuard, CompanyGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  @Get()
  async getAllAccountData(
    @CompanyDB() dataSource: DataSource,
    @CurrentUser("id") userId: number,
    @Query(
      "accountType",
      new ParseEnumPipe(AccountType, {
        optional: true,
        exceptionFactory: (errors) =>
          new BadRequestException(
            `Invalid accountType. Allowed values are: ${Object.values(AccountType).join(", ")}`
          ),
      })
    )
    accountType?: AccountType,
    @Query("unArchivedOnly") unArchivedOnly?: string
  ) {
    const accounts = await this.accountService.getAllAccountData(
      dataSource,
      userId,
      accountType,
      unArchivedOnly
    );
    return {
      message: accounts.length
        ? "Accounts fetched successfully"
        : "No accounts found",
      data: accounts,
    };
  }

  @Get("get_report")
  async getReport(@CompanyDB() dataSource: DataSource) {
    const result  = await this.accountService.getReports(dataSource)
    return {
      message: "Reports fetched successfully",
      data: result.length ? result : [],
    };
  }

  
  @Patch("reposition_report")
  async repositionReport(
    @CompanyDB() dataSource: DataSource,
    @Body() repositionData: ReportRepositionArray
  ) {
    return {
      message: "Reports repositioned successfully",
      data: await this.accountService.repositionReports(
        repositionData,
        dataSource
      ),
    };
  }

  @Get("count")
  async getCoaCount(@CompanyDB() dataSource: DataSource) {
    const coaCount = await this.accountService.getCoaCount(dataSource);
    return {
      data: coaCount,
      message: "Count fetched successfully",
    };
  }

  @Post()
  async createAccount(
    @CompanyDB() dataSource: DataSource,
    @Body() createAccountDto: CreateAccountDataDto
  ) {
    const account = await this.accountService.createAccount(
      dataSource,
      createAccountDto
    );
    return {
      data: account,
      message: "Account created successfully",
    };
  }

  @ignoreModuleClassInterceptor()
  @Patch("toggle")
  async toggle(
    @CompanyDB() dataSource: DataSource,
    @Body() zeroBalanceToggleDto: ZeroBalanceToggleDto,
    @CurrentUser("id") userId: number
  ) {
    await this.accountService.toggleZeroBalanceSettings(
      dataSource,
      userId,
      zeroBalanceToggleDto
    );
  }

  @Patch(":id")
  async updateAccount(
    @CompanyDB() dataSource: DataSource,
    @Param("id") id: string,
    @Body() updateAccountDto: UpdateAccountDataDto
  ) {
    const account = await this.accountService.updateAccount(
      dataSource,
      +id,
      updateAccountDto
    );
    return {
      data: account,
      message: "Account updated successfully",
    };
  }

  @Delete(":id")
  async removeAccount(
    @CompanyDB() dataSource: DataSource,
    @Param("id") id: string
  ) {
    const deletedAccount = await this.accountService.removeAccount(
      dataSource,
      +id
    );
    return {
      data: deletedAccount,
      message: "Account deleted successfully",
    };
  }

  @Get("demo_csv")
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", "attachment; filename=accounts_demo.csv")
  @IgnoreInterceptor()
  async exportCsv() {
    try {
      const fileStream: StreamableFile = this.accountService.getCsvStream();

      return fileStream;
    } catch (error) {
      console.error("CSV export error:", error);
      throw new InternalServerErrorException("File not sent!");
    }
  }

  @Post("validate_csv")
  @UseInterceptors(FileInterceptor("file"))
  async validateCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body() mapping: CsvMappingDto
  ) {
    if (!file) {
      throw new BadRequestException("CSV file is required.");
    }

    return this.accountService.processCsvFile(file.buffer, mapping);
  }

  @Post("bulk_create")
  @IgnoreInterceptor()
  async bulkCreate(@CompanyDB() ds: DataSource, @Body() rows: CsvMappingDto[]) {
    const result = await this.accountService.createAccounts(rows, ds);
    return result;
  }

  @Post("update_duplicates")
  async updateDuplicates(
    @Body() rows: CsvMappingDto[],
    @CompanyDB() ds: DataSource
  ) {
    const result = await this.accountService.updateDuplicateAccounts(rows, ds);
    return result;
  }

  @Get(":id")
  async findAccountById(
    @CompanyDB() dataSource: DataSource,
    @Param("id") id: string
  ) {
    const account = await this.accountService.findAccountById(dataSource, +id);
    return {
      data: account,
      message: "Account fetched successfully",
    };
  }

  @Patch(":id/archive")
  async archiveAccount(
    @CompanyDB() dataSource: DataSource,
    @Param("id") id: string
  ) {
    return {
      data: await this.accountService.archive(dataSource, +id),
    };
  }

  @ignoreModuleClassInterceptor()
  @Patch(":id/toggle_report")
  async toggleReport(
    @CompanyDB() dataSource: DataSource,
    @Param("id") id: string
  ) {
    await this.accountService.toggleReports(dataSource, +id)
  }

  @Post("export")
  async exportAccountExcel(
    @CompanyDB() dataSource: DataSource,
    @CurrentUser('id') userId: number,
    @GetCookie("companyId") companyId: string,
    @Res() res: express.Response,
    @Query("includeGroup") includeGroup?: string,

  ) {
    const { buffer, change_of_data, fileName } =
      await this.accountService.generateAccountandGroup(
        dataSource,
        companyId,
        userId,
        includeGroup === "true"
      );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}.xlsx"`
    );
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Disposition, Content-Length"
    );
    res.setHeader("Content-Length", buffer.length);
    res.end(buffer);

    return {
      message: "Accounts exported successfully",
      data: { change_of_data },
    };
  }

}
