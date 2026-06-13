import {
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { CompanyDB } from "src/common/decorators/get-db.decorator";
import { DataSource } from "typeorm";
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import { CompanyGuard } from "src/common/guard/company.guard";
import { ActivityMeta } from "src/common/decorators/ignore-interceptor.decorator";
import { GetCookie } from "src/common/decorators/get-cookies.decorator";
import { ProducerService } from "src/rmq/producer.service";
import { CurrentUser } from "src/common/decorators/user.decorator";
import { ExportTdsDto } from "./dto/export-summary.dto";
import { ExportTrialBalanceDto } from "./dto/export-trial-balance.dto";

@UseGuards(JwtAuthGuard, CompanyGuard)
@Controller("reports")
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly producerService: ProducerService
  ) { }

  @Get("profit_loss")
  async profitLoss(
    @CompanyDB() dataSource: DataSource,
    @CurrentUser("id") userId: number,
    @Query("fromDate") fromDate: string,
    @Query("toDate") toDate: string,
    @Query("isCustomize") isCustomize: string,
    @Query("noOfMonthsOrYear") noOfMonthsOrYear?: number,
    @Query("compareWith") compareWith?: string
  ) {
    const reportData = await this.reportsService.profitLoss(
      dataSource,
      userId,
      fromDate,
      toDate,
      isCustomize,
      noOfMonthsOrYear,
      compareWith
    );
    return {
      data: reportData,
      message: "Report fetched successfully",
    };
  }

  @ActivityMeta({
    module: 'Reports',
    feature: 'Profit & Loss',
    status: 'Export',
  })
  @Get("profit_loss/export")
  async getPdf(
    @CurrentUser("id") userId: string,
    @Query("fromDate") fromDate: string,
    @Query("toDate") toDate: string,
    @Query("isCustomize") isCustomize: string,
    @GetCookie("companyId") companyId: string,
    @CurrentUser("email") email: string,
    @Query("exportType") exportType: "pdf" | "excel",
    @CurrentUser("displayName") displayName: string,
    @Query("noOfMonthsOrYear") noOfMonthsOrYear?: number,
    @Query("compareWith") compareWith?: string
  ) {
    await this.producerService.emailAttachemtnQueue({
      userId,
      fromDate,
      toDate,
      isCustomize,
      companyId,
      noOfMonthsOrYear,
      compareWith,
      email,
      displayName,
      entityType: "PROFIT_LOSS",
      exportType,
    });
    return {
      message: "Email Sent Successfully",
    };
  }

  @Get("balance_sheet")
  async balanceSheet(
    @CompanyDB() dataSource: DataSource,
    @CurrentUser("id") userId: number,
    @Query("toDate") toDate: string,
    @Query("splitContact") splitContact: boolean
  ) {
    if (splitContact == undefined) splitContact = false;
    const reportData = await this.reportsService.balanceSheet(
      dataSource,
      userId,
      toDate,
      splitContact
    );
    return {
      data: reportData,
      message: "Report fetched successfully",
    };
  }

  @Get("trial_balance")
  async trialBalance(
    @CompanyDB() dataSource: DataSource,
    @CurrentUser("id") userId: number,
    @Query("toDate") toDate: string
  ) {
    const reportData = await this.reportsService.trialBalance(
      dataSource,
      userId,
      toDate
    );
    return {
      data: reportData,
      message: "Report fetched successfully",
    };
  }

  @Get("tds_summary")
  async tdsSummary(
    @CompanyDB() dataSource: DataSource,
    @CurrentUser("id") userId: number,
    @Query("fromDate") fromDate: string,
    @Query("toDate") toDate: string,
  ) {
    const reportData = await this.reportsService.tdsSummary(
      dataSource,
      userId,
      fromDate,
      toDate
    );
    return {
      data: reportData,
      message: "Report fetched successfully",
    };
  }

  @Get("tax_summary")
  async taxSummary(
    @CompanyDB() dataSource: DataSource,
    @CurrentUser("id") userId: number,
    @Query("fromDate") fromDate: string,
    @Query("toDate") toDate: string
  ) {
    const reportData = await this.reportsService.taxSummary(dataSource, userId, fromDate, toDate);
    return {
      data: reportData,
      message: "Report fetched successfully",
    };
  }

  @Get("tax_detailed_summary")
  async taxDetailedSummary(
    @CompanyDB() dataSource: DataSource,
    @CurrentUser("id") userId: number,
    @Query("fromDate") fromDate: string,
    @Query("toDate") toDate: string,
    @Query("taxId") taxId: string,
    @Query("taxPercent") taxPercent: string
  ) {
    const reportData = await this.reportsService.taxDetailedSummary(
      dataSource,
      userId,
      fromDate,
      toDate,
      +taxId,
      taxPercent
    );
    return {
      data: reportData,
      message: "Report fetched successfully",
    };
  }

  @Get("invoice_summary")
  async invoiceSummary(
    @CompanyDB() dataSource: DataSource,
    @CurrentUser("id") userId: number,
    @Query("fromDate") fromDate: string,
    @Query("toDate") toDate: string
  ) {
    const reportData = await this.reportsService.invoiceSummary(dataSource, userId, fromDate, toDate);
    return {
      data: reportData,
      message: "Report fetched successfully",
    };
  }

  @Get("contact_balance_summary")
  async contactBalanceSummary(
    @CompanyDB() dataSource: DataSource,
    @CurrentUser("id") userId: number,
    @Query("fromDate") fromDate: string,
    @Query("toDate") toDate: string,
    @Query("isDetailedView") isDetailedView: boolean
  ) {
    const reportData = await this.reportsService.contactBalanceSummary(dataSource, userId, fromDate, toDate, isDetailedView);
    return {
      data: reportData,
      message: "Report fetched successfully",
    };
  }

  @ActivityMeta({
    module: 'Reports',
    feature: 'TDS Summary',
    status: 'Export',
  })
  @Get("/tds/export")
  async downloadTdsExcel(
    @Query() exportTdsDto: ExportTdsDto,
    @CurrentUser("email") email: string,
    @GetCookie("companyId") companyId: string,
    @CurrentUser("id") userId: number,
  ) {
    const { fromDate, toDate, exportType } = exportTdsDto;
    await this.producerService.emailAttachemtnQueue({
      fromDate,
      toDate,
      userId,
      companyId,
      email,
      entityType: "TDS",
      exportType
    });
    return {
      message: "TDS Summary emailed successfully",
    };
  }

  @ActivityMeta({
    module: 'Reports',
    feature: 'Tax Summary',
    status: 'Export',
  })
  @Get("/tax/export")
  async downloadTax(

    @Query() exportTdsDto: ExportTdsDto,
    @CurrentUser("email") email: string,
    @GetCookie("companyId") companyId: string,
    @CurrentUser("id") userId: number,
  ) {
    const { fromDate, toDate, exportType } = exportTdsDto;
    await this.producerService.emailAttachemtnQueue({
      fromDate,
      toDate,
      userId,
      companyId,
      email,
      entityType: "TAX",
      exportType
    });
    return {
      message: "Tax Summary emailed successfully",
    };
  }

  @ActivityMeta({
    module: 'Reports',
    feature: 'Trial Balance',
    status: 'Export',
  })
  @Get("/trial_balance/export")
  async downloadTrialBalance(

    @Query() exportTrialBalanceDto: ExportTrialBalanceDto,
    @CurrentUser("email") email: string,
    @GetCookie("companyId") companyId: string,
    @CurrentUser("id") userId: number,
  ) {
    const { toDate, exportType } = exportTrialBalanceDto;
    await this.producerService.emailAttachemtnQueue({
      toDate,
      userId,
      companyId,
      email,
      entityType: "TRIAL_BALANCE",
      exportType
    });
    return {
      message: "Trial Balance Summary emailed successfully",
    };
  }

  @ActivityMeta({
    module: 'Reports',
    feature: 'Balance Sheet',
    status: 'Export',
  })
  @Get("balance_sheet/export")
  async balanceSheetExport(
    @CompanyDB() dataSource: DataSource,
    @CurrentUser("id") userId: number,
    @Query("toDate") toDate: string,
    @Query("splitContact") splitContact: boolean,
    @GetCookie("companyId") companyId: string,
    @CurrentUser("displayName") displayName: string,
    @CurrentUser("email") email: string,
    @Query("exportType") exportType: "pdf" | "excel"
  ) {
    await this.producerService.emailAttachemtnQueue({
      userId,
      toDate,
      companyId,
      email,
      displayName,
      entityType: "BALANCE_SHEET",
      exportType,
      splitContact,
    });
    return {
      message: "Email Sent Successfully",
    };
  }
}
