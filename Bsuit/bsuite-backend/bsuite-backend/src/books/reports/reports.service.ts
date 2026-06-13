import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  Between,
  DataSource,
  EntityManager,
  In,
  IsNull,
  LessThanOrEqual,
  Not,
} from "typeorm";
import { Transaction } from "../transact/entities/tenant.transaction.entity";
import { AccountData } from "../account/entities/tenant.account.entity";
import { GroupData } from "../account/entities/tenant.group.entity";
import Decimal from "decimal.js";
import { FxService } from "src/fx/fx.service";
import { AccountType } from "src/common/enum/account-type.enum";
import { CompanySetting } from "src/setting/entities/tenant.company-setting.entity";
import { subYears, startOfMonth, endOfMonth, format, subDays } from "date-fns";
import * as puppeteer from "puppeteer";
import ExcelJS from "exceljs";
import * as hbs from "handlebars";
import * as fs from "fs-extra";
import * as tmp from "tmp-promise";
import wkhtmltopdf from "wkhtmltopdf";
import { Contact } from "../contact/entities/tenant.contact.entity";
import { Tax } from "../tax/entities/tenant.tax.entity";
import { ZeroBalance } from "../account/entities/tenant.zeroBalance.entity";
import { Invoice } from "../invoice/entities/tenant.invoice.entity";
import { Bill } from "../bill/entities/tenant.bill.entity";
import { DiscountApplied, DiscountType } from "src/common/enum/transact.enum";
import { fetchImageAsBuffer, formatDate, formatDateTime, getNumberFormat, getTemplatePath } from "src/shared/utils";
import { TransactService } from "../transact/transact.service";
type TaxBucket = Record<string, number>;

hbs.registerHelper('eq', (a, b) => a === b);
hbs.registerHelper("or", (a, b) => a || b);
hbs.registerHelper("ne", (a, b) => a !== b);

interface TaxPercentData {
  [taxId: number]: TaxBucket & {
    totalTaxAmount: number;
    totalTaxableAmount: number;
  };
}

interface TaxableAmountData {
  [taxId: number]: TaxBucket;
}
@Injectable()
export class ReportsService {
  private logger = new Logger(ReportsService.name);
  constructor(
    private readonly fxService: FxService,
    private readonly transactService: TransactService
  ) { }

  dateOnly(dateStr: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException(`Invalid date format: ${dateStr}`);
    }
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (
      date.getFullYear() !== y ||
      date.getMonth() !== m - 1 ||
      date.getDate() !== d
    ) {
      throw new BadRequestException(`Invalid date value: ${dateStr}`);
    }

    return date;
  }

  async getZeroBalance(dataSource: DataSource, userId: number) {
    let zeroBalanceRepo = dataSource.getRepository(ZeroBalance);
    let zeroBalance = await zeroBalanceRepo.findOne({ where: { userId } });
    if (!zeroBalance) {
      zeroBalance = await zeroBalanceRepo.save({ userId });
    }
    return zeroBalance;
  }

  async profitLoss(
    dataSource: DataSource,
    userId: number,
    fromDate: string,
    toDate: string,
    isCustomize: string,
    noOfMonthsOrYear?: number,
    compareWith?: string
  ) {
    const [fiscalStart, fiscalEnd] = await this.getFiscalDates(dataSource);
    const startDate = fromDate ? this.dateOnly(fromDate) : fiscalStart;
    const endDate = toDate ? this.dateOnly(toDate) : fiscalEnd;
    let dateList: any = [];
    const zeroBalance = await this.getZeroBalance(dataSource, userId);
    if (isCustomize === "true") {
      if (!noOfMonthsOrYear || !compareWith)
        throw new BadRequestException(
          "Compare with and Period is required if customize enabled"
        );
      const noOfPeriods = noOfMonthsOrYear + 1;

      if (compareWith === "year") {
        if (noOfMonthsOrYear > 12)
          throw new BadRequestException(
            "No of years cannot be greater than 12"
          );
        for (let i = 0; i < noOfPeriods; i++) {
          const currentStart = subYears(startDate, i);
          const currentEnd = subYears(endDate, i);
          dateList.push([
            format(currentStart, "yyyy-MM-dd"),
            format(currentEnd, "yyyy-MM-dd"),
          ]);
        }
        dateList.reverse();
      } else if (compareWith === "month") {
        if (noOfMonthsOrYear > 35)
          throw new BadRequestException(
            "No of months cannot be greater than 35"
          );
        let currentEnd = endOfMonth(startDate);
        for (let i = 0; i < noOfPeriods; i++) {
          const currentStart = startOfMonth(currentEnd);
          dateList.push([
            format(currentStart, "yyyy-MM-dd"),
            format(currentEnd, "yyyy-MM-dd"),
          ]);
          currentEnd = subDays(currentStart, 1);
        }
        dateList.reverse();
      } else {
        throw new BadRequestException("Invalid Compare with option");
      }
    } else {
      dateList = [
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd"),
      ];
    }
    const inputData = {
      reportType: "profitLoss",
      dateList: dateList,
    };
    const reportData = await this.calcReportsData(dataSource, inputData);
    return {
      ...reportData,
      zeroBalance: zeroBalance.reportZeroBalance,
      decimalPlace: zeroBalance.reportDecimalPlace,
    };
  }

  async balanceSheet(
    dataSource: DataSource,
    userId: number,
    toDate: string,
    splitContact: boolean
  ) {
    const endDate = toDate ? this.dateOnly(toDate) : new Date();
    const zeroBalance = await this.getZeroBalance(dataSource, userId);
    const inputData = {
      reportType: "balanceSheet",
      dateList: [null, format(endDate, "yyyy-MM-dd")],
      splitContact: splitContact,
    };
    const reportData = await this.calcReportsData(dataSource, inputData);
    return {
      ...reportData,
      zeroBalance: zeroBalance.reportZeroBalance,
      decimalPlace: zeroBalance.reportDecimalPlace,
    };
  }

  async trialBalance(dataSource: DataSource, userId: number, toDate: string) {
    const endDate = toDate ? this.dateOnly(toDate) : new Date();
    const zeroBalance = await this.getZeroBalance(dataSource, userId);
    const inputData = {
      reportType: "trialBalance",
      dateList: [null, format(endDate, "yyyy-MM-dd")],
    };
    const reportData = await this.calcReportsData(dataSource, inputData);
    return {
      ...reportData,
      zeroBalance: zeroBalance.reportZeroBalance,
      decimalPlace: zeroBalance.reportDecimalPlace,
    };
  }

  async tdsSummary(
    dataSource: DataSource,
    userId: number,
    fromDate: string,
    toDate: string,
  ) {
    const [fiscalStart, fiscalEnd] = await this.getFiscalDates(dataSource);
    const startDate = fromDate ? this.dateOnly(fromDate) : fiscalStart;
    const endDate = toDate ? this.dateOnly(toDate) : fiscalEnd;
    const zeroBalance = await this.getZeroBalance(dataSource, userId);
    const inputData = {
      dateList: [
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd"),
      ],
    };
    const reportData = await this.calcTdsSummary(dataSource, inputData);
    return {
      ...reportData,
      zeroBalance: zeroBalance.reportZeroBalance,
      decimalPlace: zeroBalance.reportDecimalPlace,
    };
  }

  async taxSummary(
    dataSource: DataSource,
    userId: number,
    fromDate: string,
    toDate: string
  ) {
    const [fiscalStart, fiscalEnd] = await this.getFiscalDates(dataSource);
    const startDate = fromDate ? this.dateOnly(fromDate) : fiscalStart;
    const endDate = toDate ? this.dateOnly(toDate) : fiscalEnd;
    const zeroBalance = await this.getZeroBalance(dataSource, userId);
    const inputData = {
      dateList: [
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd"),
      ],
    };
    const reportData = await this.calcTaxSummary(dataSource, inputData);
    return {
      ...reportData,
      zeroBalance: zeroBalance.reportZeroBalance,
      decimalPlace: zeroBalance.reportDecimalPlace,
    };
  }

  async taxDetailedSummary(
    dataSource: DataSource,
    userId: number,
    fromDate: string,
    toDate: string,
    taxId: number,
    taxPercent: string
  ) {
    const [fiscalStart, fiscalEnd] = await this.getFiscalDates(dataSource);
    const startDate = fromDate ? this.dateOnly(fromDate) : fiscalStart;
    const endDate = toDate ? this.dateOnly(toDate) : fiscalEnd;
    const zeroBalance = await this.getZeroBalance(dataSource, userId);
    const inputData = {
      dateList: [
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd"),
      ],
      taxId,
      taxPercent,
    };
    const reportData = await this.calcDetailedTaxSummary(dataSource, inputData);
    return {
      ...reportData,
      zeroBalance: zeroBalance.reportZeroBalance,
      decimalPlace: zeroBalance.reportDecimalPlace,
    };
  }

  async invoiceSummary(
    dataSource: DataSource,
    userId: number,
    fromDate: string,
    toDate: string
  ) {
    const [fiscalStart, fiscalEnd] = await this.getFiscalDates(dataSource);
    const startDate = fromDate ? this.dateOnly(fromDate) : fiscalStart;
    const endDate = toDate ? this.dateOnly(toDate) : fiscalEnd;
    const zeroBalance = await this.getZeroBalance(dataSource, userId);
    const inputData = {
      dateList: [
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd"),
      ],
    };
    const reportData = await this.calcInvoiceSummary(dataSource, inputData);
    return {
      ...reportData,
      zeroBalance: zeroBalance.reportZeroBalance,
      decimalPlace: zeroBalance.reportDecimalPlace,
    };
  }

  async contactBalanceSummary(
    dataSource: DataSource,
    userId: number,
    fromDate: string,
    toDate: string,
    isDetailedView: boolean
  ) {
    const [fiscalStart, fiscalEnd] = await this.getFiscalDates(dataSource);
    const startDate = fromDate ? this.dateOnly(fromDate) : fiscalStart;
    const endDate = toDate ? this.dateOnly(toDate) : fiscalEnd;
    const zeroBalance = await this.getZeroBalance(dataSource, userId);
    const inputData = {
      dateList: [
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd"),
      ]
    };
    let reportData;
    if (isDetailedView) {
      reportData = await this.calcDetailedContactBalanceSummary(dataSource, inputData);
    } else {
      reportData = await this.calcContactBalanceSummary(dataSource, inputData);
    }
    return {
      ...reportData,
      zeroBalance: zeroBalance.reportZeroBalance,
      decimalPlace: zeroBalance.reportDecimalPlace,
    };
  }

  async getFiscalDates(dataSource: DataSource): Promise<[Date, Date]> {
    const companyData = await dataSource
      .getRepository(CompanySetting)
      .findOne({ where: {} });

    if (!companyData) throw new NotFoundException("Company Setting not found");

    const {
      fiscalYearStartMonth,
      fiscalYearStartDate,
      fiscalYearEndMonth,
      fiscalYearEndDate,
    } = companyData;

    if (
      !fiscalYearStartMonth ||
      !fiscalYearStartDate ||
      !fiscalYearEndMonth ||
      !fiscalYearEndDate
    ) {
      throw new NotFoundException("Company Setting - Fiscal Ranges not found");
    }

    const MONTHS: Record<string, number> = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11,
    };

    const getMonthNumber = (month: string) => {
      const m = MONTHS[month];
      if (m === undefined) throw new Error(`Invalid month name: ${month}`);
      return m;
    };

    const startMonth = getMonthNumber(fiscalYearStartMonth);
    const endMonth = getMonthNumber(fiscalYearEndMonth);

    const now = new Date();
    const currentYear = now.getUTCFullYear();

    const createUTCDate = (year: number, month: number, day: number) =>
      new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

    const crossesYear =
      startMonth > endMonth ||
      (startMonth === endMonth && fiscalYearStartDate > fiscalYearEndDate);

    let fiscalStart: Date;
    let fiscalEnd: Date;

    if (!crossesYear) {
      fiscalStart = createUTCDate(currentYear, startMonth, fiscalYearStartDate);
      fiscalEnd = createUTCDate(currentYear, endMonth, fiscalYearEndDate);
    } else {
      const startThisYear = createUTCDate(
        currentYear,
        startMonth,
        fiscalYearStartDate
      );
      if (now >= startThisYear) {
        fiscalStart = startThisYear;
        fiscalEnd = createUTCDate(currentYear + 1, endMonth, fiscalYearEndDate);
      } else {
        fiscalStart = createUTCDate(
          currentYear - 1,
          startMonth,
          fiscalYearStartDate
        );
        fiscalEnd = createUTCDate(currentYear, endMonth, fiscalYearEndDate);
      }
    }

    return [fiscalStart, fiscalEnd];
  }

  async getFxRateForDate(
    dataSource: DataSource,
    reportingCurrency: string,
    fxDate: Date | string
  ) {
    const accountRepo = dataSource.getRepository(AccountData);
    const fxCurrencyMap: Record<string, number> = {};
    let targetDate = new Date(fxDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate >= today) {
      targetDate.setDate(today.getDate() - 1);
    }

    const distinctCurrencies = await accountRepo
      .createQueryBuilder("account")
      .select("DISTINCT account.account_currency", "currency")
      .andWhere("account.account_currency != :reportingCurrency", {
        reportingCurrency,
      })
      .getRawMany();

    for (const item of distinctCurrencies) {
      const currencyCode = item.currency.split(" - ")[1];
      const { rate } = await this.fxService.history({
        date: targetDate.toDateString(),
        from: currencyCode,
        to: reportingCurrency,
      });
      fxCurrencyMap[currencyCode] = rate;
    }

    return { fxCurrencyMap, fxDate: targetDate };
  }

  async calcReportsData(dataSource: DataSource, inputData: any) {
    const accountRepo = dataSource.getRepository(AccountData);
    const groupRepo = dataSource.getRepository(GroupData);
    const { reportType, dateList, splitContact } = inputData;
    const isCustomize = Array.isArray(dateList[0]);
    // const columnCount = isCustomize ? dateList.length + 1 : 1;
    const columnCount = isCustomize
      ? dateList.length + 1
      : reportType == "trialBalance"
        ? 2
        : 1;

    const companyData = await dataSource
      .getRepository(CompanySetting)
      .findOne({ where: {} });
    if (!companyData) throw new NotFoundException("Company Setting not found");
    // 1. Setup FX
    let fxCurrencyMap = {};
    let dateOfFxRate: Date[] = [];
    // Assuming company metadata is fetched here
    const enableFxCorrection = false;

    if (enableFxCorrection) {
      const fxData = await this.getFxCurrencyMap(
        dataSource,
        dateList,
        companyData.reportingCurrency
      );
      fxCurrencyMap = fxData.fxCurrencyMap;
      dateOfFxRate = fxData.fxDateArr;
    }

    // 2. Initialize Structure
    const accountTypes = this.getAccountTypes(reportType);
    let resultData: any = {};
    let totalData: any = {};
    let fxCorrection = new Array(columnCount).fill(0);

    for (const type of accountTypes) {
      resultData[type] = [];
      totalData[type] = new Array(columnCount).fill(0);
    }
    let contactReportData = {};
    if (reportType == "balanceSheet") {
      let assetContactData,
        liabilityContactData,
        contactAssetSum,
        contactLiabilitySum;
      if (splitContact) {
        [
          assetContactData,
          liabilityContactData,
          contactAssetSum,
          contactLiabilitySum,
        ] = await this.reportSplitContactDataCalc(dataSource, dateList[1], 3);
      } else {
        [
          assetContactData,
          liabilityContactData,
          contactAssetSum,
          contactLiabilitySum,
        ] = await this.reportContactDataCalc(
          dataSource,
          dateList[1],
          3,
          reportType
        );
      }
      contactReportData = {
        assetContactData,
        liabilityContactData,
        contactAssetSum,
        contactLiabilitySum,
      };
    }
    if (reportType == "trialBalance") {
      let [
        assetContactData,
        liabilityContactData,
        contactAssetSum,
        contactLiabilitySum,
      ] = await this.reportContactDataCalc(
        dataSource,
        dateList[1],
        3,
        reportType
      );
      contactReportData = {
        assetContactData,
        liabilityContactData,
        contactAssetSum,
        contactLiabilitySum,
      };
    }
    // 3. Process Groups
    const groups = await groupRepo.find({
      where: { groupType: In(accountTypes) },
      order: { groupName: "ASC" },
    });

    for (const group of groups) {
      const topLevelAccounts = await accountRepo.find({
        where: {
          group: { id: group.id },
          parentAccount: IsNull(),
          accountType: group.groupType,
        },
        relations: ["journalEntries"],
      });
      const { accountData, groupSum, updatedFx } =
        await this.processAccountsRecursive(
          dataSource,
          reportType,
          topLevelAccounts,
          dateList,
          fxCurrencyMap,
          fxCorrection,
          isCustomize,
          contactReportData
        );
      fxCorrection = updatedFx;

      if (accountData.length > 0) {
        resultData[group.groupType].push({
          groupName: group.groupName,
          groupType: group.groupType,
          groupSum: groupSum,
          accountsList: accountData,
          subLevel: 1,
        });

        totalData[group.groupType] = totalData[group.groupType].map(
          (val: number, i: number) =>
            new Decimal(val).plus(groupSum[i]).toNumber()
        );
      }
    }
    for (const type of accountTypes) {
      const accounts = await accountRepo.find({
        where: {
          group: IsNull(),
          parentAccount: IsNull(),
          accountType: type as AccountType,
        },
        relations: ["journalEntries"],
      });
      const { accountData, groupSum, updatedFx } =
        await this.processAccountsRecursive(
          dataSource,
          reportType,
          accounts,
          dateList,
          fxCurrencyMap,
          fxCorrection,
          isCustomize,
          contactReportData
        );
      fxCorrection = updatedFx;

      if (accountData.length > 0) {
        resultData[type].push({
          groupName: "Uncategorized",
          groupType: type,
          groupSum: groupSum,
          accountsList: accountData,
          subLevel: 1,
        });

        totalData[type] = totalData[type].map((val: number, i: number) =>
          new Decimal(val).plus(groupSum[i]).toNumber()
        );
      }
    }
    if (reportType == "balanceSheet" || reportType == "trialBalance") {
      const updatedData = await this.mergeTaxDataIntoResult(
        resultData,
        totalData,
        reportType,
        dataSource,
        dateList
      );
      resultData = updatedData.resultData;
      totalData = updatedData.totalData;
    }
    let finalProfit: number[] = [];
    let finalTotal: number[] = [];
    let profitCurrent: number = 0;
    let profitRetained: number = 0;
    if (reportType == "profitLoss") {
      finalProfit = this.calculateFinalProfit(totalData, reportType);
    } else if (reportType == "balanceSheet") {
      [profitCurrent, profitRetained] = await this.getProfitDataBalanceSheet(
        dataSource,
        dateList[1]
      );
      totalData["Liability"] = [
        totalData["Liability"][0] + profitCurrent + profitRetained,
      ];
    } else if (reportType == "trialBalance") {
      finalTotal = (Object.values(totalData) as number[][]).reduce(
        (acc: [number, number], values: number[]) => {
          acc[0] += values[0] ?? 0;
          acc[1] += values[1] ?? 0;
          return acc;
        },
        [0, 0]
      );
    }

    const reportData = {
      reportType,
      dateList,
      resultData: resultData,
      totalData: totalData,
      fxCorrectionData: fxCorrection,
      dateOfFxRate: dateOfFxRate,
      isCustomize: isCustomize,
      finalProfit: finalProfit,
      finalTotal: finalTotal,
      profitCurrent: profitCurrent,
      profitRetained: profitRetained,
    };

    return reportData;
  }

  private async processAccountsRecursive(
    dataSource: DataSource,
    reportType: string,
    accounts: AccountData[],
    dateList: any[],
    fxMap: any,
    fxCorrection: number[],
    isCustomize: boolean,
    contactReportData: any,
    level = 2
  ) {
    const accountRepo = dataSource.getRepository(AccountData);
    const accountResults: any[] = [];
    const columnCount = isCustomize
      ? dateList.length + 1
      : reportType == "trialBalance"
        ? 2
        : 1;
    let groupTotal = new Array(columnCount).fill(0);
    for (const account of accounts) {
      // Get Balances with Accounting Sign Logic
      let accountSelfTotal: number[] = [];
      let isTransactionFilter = false;

      if (isCustomize) {
        for (const period of dateList) {
          const balance = await this.getAccountBalanceForPeriod(
            dataSource,
            account.id,
            account.accountType,
            period,
            false
          );
          accountSelfTotal.push(balance);
        }
        const rowTotal = accountSelfTotal.reduce(
          (a, b) => new Decimal(a).plus(b).toNumber(),
          0
        );
        accountSelfTotal.push(rowTotal);
      } else {
        if (
          account.accountName == "Accounts Receivable" &&
          account.accountType == AccountType.ASSET
        )
          isTransactionFilter = true;
        else if (
          account.accountName == "Accounts Payable" &&
          account.accountType == AccountType.LIABILITY
        )
          isTransactionFilter = true;
        if (reportType == "trialBalance") {
          const balance = await this.getAccountBalanceForTrialBalance(
            dataSource,
            account.id,
            account.accountType,
            dateList,
            isTransactionFilter
          );
          accountSelfTotal = [...balance];
        } else {
          const balance = await this.getAccountBalanceForPeriod(
            dataSource,
            account.id,
            account.accountType,
            dateList,
            isTransactionFilter
          );
          accountSelfTotal.push(balance);
        }
      }

      // Handle Sub-Accounts (Recursion)
      const children = await accountRepo.find({
        where: { parentAccount: { id: account.id } },
      });
      let subAccountData: any[] = [];
      let totalBalance = [...accountSelfTotal];
      if (children.length > 0) {
        const recursiveResult = await this.processAccountsRecursive(
          dataSource,
          reportType,
          children,
          dateList,
          fxMap,
          fxCorrection,
          isCustomize,
          contactReportData,
          level + 1
        );
        subAccountData = recursiveResult.accountData;

        // Roll up child balances to parent
        for (let i = 0; i < totalBalance.length; i++) {
          totalBalance[i] = new Decimal(totalBalance[i])
            .plus(recursiveResult.groupSum[i])
            .toNumber();
        }
      }

      if (isTransactionFilter) {
        if (account.accountType == AccountType.ASSET) {
          subAccountData.push(...contactReportData["assetContactData"]);
          totalBalance[0] =
            totalBalance[0] + contactReportData["contactAssetSum"];
        }
        if (account.accountType == AccountType.LIABILITY) {
          subAccountData.push(...contactReportData["liabilityContactData"]);
          const index = reportType == "trialBalance" ? 1 : 0;
          totalBalance[index] =
            totalBalance[index] + contactReportData["contactLiabilitySum"];
        }
      }

      accountResults.push({
        accountId: account.id,
        accountName: account.accountName,
        accountType: account.accountType,
        accountSelfTotal: accountSelfTotal,
        accountTotal: totalBalance,
        subAccounts: subAccountData,
        subLevel: level,
      });
      groupTotal = groupTotal.map((sum, i) =>
        new Decimal(sum).plus(totalBalance[i]).toNumber()
      );
    }

    return {
      accountData: accountResults,
      groupSum: groupTotal,
      updatedFx: fxCorrection,
    };
  }

  private getAccountTypes(type: string): string[] {
    if (type === "profitLoss") return ["Income", "Expense"];
    if (type === "balanceSheet") return ["Asset", "Liability"];
    return ["Asset", "Liability", "Income", "Expense"];
  }

  private async getAccountBalanceForPeriod(
    dataSource: DataSource,
    accountId: number,
    accountType: AccountType,
    period: any,
    isTransactionFilter: boolean
  ): Promise<number> {
    const transactionRepo = dataSource.getRepository(Transaction);
    const [start, end] = Array.isArray(period) ? period : [null, period];
    const query = transactionRepo
      .createQueryBuilder("t")
      .where("t.account = :accountId", { accountId });

    if (start) {
      query.andWhere("t.date BETWEEN :start AND :end", { start, end });
    } else {
      query.andWhere("t.date <= :end", { end });
    }
    if (isTransactionFilter) {
      query.andWhere("t.transactionTypeName IN (:...types)", {
        types: ["journal", "transfer", "opening_balance"],
      });
    }
    const isDebitNormal = [AccountType.ASSET, AccountType.EXPENSE].includes(
      accountType
    );

    const formula = isDebitNormal
      ? "SUM(CAST(t.debit_amount AS DECIMAL) - CAST(t.credit_amount AS DECIMAL))"
      : "SUM(CAST(t.credit_amount AS DECIMAL) - CAST(t.debit_amount AS DECIMAL))";

    const result = await query.select(formula, "balance").getRawOne();

    return parseFloat(result.balance || 0);
  }

  private async getAccountBalanceForTrialBalance(
    dataSource: DataSource,
    accountId: number,
    accountType: AccountType,
    period: any,
    isTransactionFilter: boolean
  ): Promise<[number, number]> {
    const transactionRepo = dataSource.getRepository(Transaction);
    const [start, end] = period;

    const query = transactionRepo
      .createQueryBuilder("t")
      .where("t.account_id = :accountId", { accountId });

    if (start) {
      query.andWhere("t.date BETWEEN :start AND :end", { start, end });
    } else {
      query.andWhere("t.date <= :end", { end });
    }

    if (isTransactionFilter) {
      query.andWhere("t.transactionTypeName IN (:...types)", {
        types: ["journal", "transfer", "opening_balance"],
      });
    }

    const sums = await query
      .select("COALESCE(SUM(t.debit_amount),0)", "debit")
      .addSelect("COALESCE(SUM(t.credit_amount),0)", "credit")
      .getRawOne();

    const debitSum = Number(sums.debit || 0);
    const creditSum = Number(sums.credit || 0);

    let debitFlyBalance = 0;
    let creditFlyBalance = 0;

    const isDebitNormal = [AccountType.ASSET, AccountType.EXPENSE].includes(
      accountType
    );

    if (isDebitNormal) {
      const flyBalance = debitSum - creditSum;
      if (flyBalance > 0) {
        debitFlyBalance = flyBalance;
      } else {
        creditFlyBalance = Math.abs(flyBalance);
      }
    } else {
      const flyBalance = creditSum - debitSum;
      if (flyBalance > 0) {
        creditFlyBalance = flyBalance;
      } else {
        debitFlyBalance = Math.abs(flyBalance);
      }
    }

    return [
      Number(debitFlyBalance.toFixed(2)),
      Number(creditFlyBalance.toFixed(2)),
    ];
  }

  private async getFxCurrencyMap(
    dataSource: DataSource,
    dateList: any[],
    reportingCurrency: string
  ) {
    const fxCurrencyMap: Record<string, any> = {};
    const fxDateArr: Date[] = [];

    if (Array.isArray(dateList[0])) {
      for (const range of dateList) {
        const data = await this.getFxRateForDate(
          dataSource,
          reportingCurrency,
          range[1]
        );
        fxCurrencyMap[range[1]] = data.fxCurrencyMap;
        fxDateArr.push(data.fxDate);
      }
    } else {
      const data = await this.getFxRateForDate(
        dataSource,
        reportingCurrency,
        dateList[1]
      );
      return { fxCurrencyMap: data.fxCurrencyMap, fxDateArr: [data.fxDate] };
    }
    return { fxCurrencyMap, fxDateArr };
  }

  isCustomize(dateList: any[]): boolean {
    return Array.isArray(dateList[0]);
  }

  private calculateFinalProfit(totalData: any, reportType: string): number[] {
    const income = totalData[AccountType.INCOME] || [0];
    const expense = totalData[AccountType.EXPENSE] || [0];
    return income.map((inc, i) =>
      new Decimal(inc).minus(expense[i] || 0).toNumber()
    );
  }

  async getProfitDataBalanceSheet(
    dataSource: DataSource,
    dateTo: string | Date
  ): Promise<[number, number]> {
    const [fiscalStart, fiscalEnd] = await this.getFiscalDates(dataSource);

    const endDate = typeof dateTo === "string" ? new Date(dateTo) : dateTo;

    let newFiscalStart: Date;

    if (endDate.getMonth() + 1 < fiscalStart.getMonth() + 1) {
      newFiscalStart = new Date(
        endDate.getFullYear() - 1,
        fiscalStart.getMonth(),
        fiscalStart.getDate()
      );
    } else {
      newFiscalStart = new Date(
        endDate.getFullYear(),
        fiscalStart.getMonth(),
        fiscalStart.getDate()
      );
    }

    const previousDate = new Date(newFiscalStart);
    previousDate.setDate(previousDate.getDate() - 1);

    /** ---------------- CURRENT PERIOD ---------------- */

    const incomeCurrent = await this.getIncomeExpenseSum(
      dataSource,
      "Income",
      newFiscalStart,
      endDate
    );

    const expenseCurrent = await this.getIncomeExpenseSum(
      dataSource,
      "Expense",
      newFiscalStart,
      endDate
    );

    const profitCurrent = incomeCurrent - expenseCurrent;

    const incomePrevious = await this.getIncomeExpenseSum(
      dataSource,
      "Income",
      null,
      previousDate
    );

    const expensePrevious = await this.getIncomeExpenseSum(
      dataSource,
      "Expense",
      null,
      previousDate
    );

    const profitRetained = incomePrevious - expensePrevious;

    return [profitCurrent, profitRetained];
  }

  private async getIncomeExpenseSum(
    dataSource: DataSource,
    accountType: "Income" | "Expense",
    startDate: Date | null,
    endDate: Date
  ): Promise<number> {
    const transactionRepo = dataSource.getRepository(Transaction);

    const qb = transactionRepo
      .createQueryBuilder("t")
      .innerJoin("t.account", "a")
      .andWhere("a.accountType = :accountType", { accountType })
      .andWhere("t.date <= :endDate", { endDate });

    if (startDate) {
      qb.andWhere("t.date >= :startDate", { startDate });
    }

    const result = await qb
      .select([
        "COALESCE(SUM(t.debitAmount),0) as debit",
        "COALESCE(SUM(t.creditAmount),0) as credit",
      ])
      .getRawOne();

    const debit = Number(result.debit);
    const credit = Number(result.credit);

    return accountType === "Income" ? credit - debit : debit - credit;
  }

  async mergeTaxDataIntoResult(
    resultData: any,
    totalData: any,
    reportType: "balanceSheet" | "trialBalance",
    dataSource: DataSource,
    dateList: any[]
  ) {
    let assetTaxData, liabilityTaxData, taxAssetSum, taxLiabilitySum;
    [assetTaxData, liabilityTaxData, taxAssetSum, taxLiabilitySum] =
      await this.reportTaxDataCalc(dataSource, dateList[1], 3, reportType);
    if (assetTaxData.length > 0) {
      const assetGroups = resultData.Asset;
      for (const group of assetGroups) {
        for (const account of group.accountsList) {
          if (
            account.accountName === "Accounts Receivable" &&
            account.accountType == AccountType.ASSET
          ) {
            const accountTotal =
              reportType === "trialBalance" ? [taxAssetSum, 0] : [taxAssetSum];
            const accountSelfTotal =
              reportType === "trialBalance" ? [0, 0] : [0];
            const taxAssetAccount = {
              accountId: 0,
              accountName: "Tax",
              accountType: "Tax",
              accountSelfTotal: accountSelfTotal,
              accountTotal: accountTotal,
              subLevel: 2,
              subAccounts: assetTaxData,
            };

            // Insert Tax account into the same group
            group.accountsList.push(taxAssetAccount);

            if (reportType === "trialBalance") {
              group.groupSum = [
                (group.groupSum?.[0] || 0) + taxAssetSum,
                group.groupSum?.[1] || 0,
              ];

              totalData.Asset = [
                (totalData.Asset?.[0] || 0) + taxAssetSum,
                totalData.Asset?.[1] || 0,
              ];
            } else {
              group.groupSum = [(group.groupSum?.[0] || 0) + taxAssetSum];

              totalData.Asset = [(totalData.Asset?.[0] || 0) + taxAssetSum];
            }
            break; // done for assets
          }
        }
      }
    }
    if (liabilityTaxData.length > 0) {
      // Merge liabilityTaxData into Accounts Payable group
      const liabilityGroups = resultData.Liability;
      for (const group of liabilityGroups) {
        for (const account of group.accountsList) {
          if (
            account.accountName === "Accounts Payable" &&
            account.accountType == AccountType.LIABILITY
          ) {
            const accountTotal =
              reportType === "trialBalance"
                ? [0, taxLiabilitySum]
                : [taxLiabilitySum];
            const accountSelfTotal =
              reportType === "trialBalance" ? [0, 0] : [0];
            const taxLiabilityAccount = {
              accountId: 0,
              accountName: "Tax",
              accountType: "Tax",
              accountSelfTotal: accountSelfTotal,
              accountTotal: accountTotal,
              subLevel: 2,
              subAccounts: liabilityTaxData,
            };

            group.accountsList.push(taxLiabilityAccount);
            if (reportType === "trialBalance") {
              group.groupSum = [
                group.groupSum?.[0] || 0,
                (group.groupSum?.[1] || 0) + taxLiabilitySum,
              ];

              totalData.Liability = [
                totalData.Liability?.[0] || 0,
                (totalData.Liability?.[1] || 0) + taxLiabilitySum,
              ];
            } else {
              group.groupSum = [(group.groupSum?.[0] || 0) + taxLiabilitySum];

              totalData.Liability = [
                (totalData.Liability?.[0] || 0) + taxLiabilitySum,
              ];
            }
            break; // done for liabilities
          }
        }
      }
    }
    return { resultData, totalData };
  }

  async reportTaxDataCalc(
    dataSource: DataSource,
    dateTo: Date,
    level: number,
    reportType: "balanceSheet" | "trialBalance"
  ): Promise<[any[], any[], number, number]> {
    const transactionRepo = dataSource.getRepository(Transaction);
    const taxRepo = dataSource.getRepository(Tax);
    const taxList = await taxRepo.find();

    const assetTaxData: any[] = [];
    const liabilityTaxData: any[] = [];
    let taxAssetSum = 0;
    let taxLiabilitySum = 0;

    for (const taxItem of taxList) {
      const transactionCount = await transactionRepo.count({
        where: { tax: { id: taxItem.id }, date: LessThanOrEqual(dateTo) },
      });

      if (transactionCount === 0) continue;
      // Sum debit and credit for all transactions (transfer, journal, etc.)
      const debitResult = await transactionRepo
        .createQueryBuilder("t")
        .andWhere("t.tax_id = :taxId", { taxId: taxItem.id })
        .andWhere("t.date <= :dateTo", { dateTo })
        .select("COALESCE(SUM(t.debitAmount),0)", "debit")
        .getRawOne();

      const creditResult = await transactionRepo
        .createQueryBuilder("t")
        .andWhere("t.tax_id = :taxId", { taxId: taxItem.id })
        .andWhere("t.date <= :dateTo", { dateTo })
        .select("COALESCE(SUM(t.creditAmount),0)", "credit")
        .getRawOne();

      let debitSum = Number(debitResult?.debit || 0);
      let creditSum = Number(creditResult?.credit || 0);

      let flyBalance = Number((debitSum - creditSum).toFixed(2));

      if (reportType === "balanceSheet") {
        if (flyBalance >= 0) {
          // Asset
          taxAssetSum += flyBalance;
          assetTaxData.push({
            accountId: taxItem.id,
            accountName: taxItem.taxName,
            accountType: "Tax",
            accountSelfTotal: [flyBalance],
            accountTotal: [flyBalance],
            subLevel: level,
          });
        } else {
          // Liability
          flyBalance = Math.abs(flyBalance);
          taxLiabilitySum += flyBalance;
          liabilityTaxData.push({
            accountId: taxItem.id,
            accountName: taxItem.taxName,
            accountType: "Tax",
            accountSelfTotal: [flyBalance],
            accountTotal: [flyBalance],
            subLevel: level,
          });
        }
      }
      if (reportType === "trialBalance") {
        let debitFlyBalance = 0;
        let creditFlyBalance = 0;

        if (flyBalance > 0) {
          debitFlyBalance = flyBalance;
        } else if (flyBalance < 0) {
          creditFlyBalance = Math.abs(flyBalance);
        }

        if (debitFlyBalance > 0) {
          taxAssetSum += debitFlyBalance;
          assetTaxData.push({
            accountId: taxItem.id,
            accountName: taxItem.taxName,
            accountType: "Tax",
            accountSelfTotal: [debitFlyBalance, creditFlyBalance],
            accountTotal: [debitFlyBalance, creditFlyBalance],
            subLevel: level,
          });
        } else {
          taxLiabilitySum += creditFlyBalance;
          liabilityTaxData.push({
            accountId: taxItem.id,
            accountName: taxItem.taxName,
            accountType: "Tax",
            accountSelfTotal: [debitFlyBalance, creditFlyBalance],
            accountTotal: [debitFlyBalance, creditFlyBalance],
            subLevel: level,
          });
        }
      }
    }

    return [assetTaxData, liabilityTaxData, taxAssetSum, taxLiabilitySum];
  }

  async reportContactDataCalc(
    dataSource: DataSource,
    dateTo: Date,
    level: number,
    reportType: "balanceSheet" | "trialBalance"
  ): Promise<[any[], any[], number, number]> {
    const contactRepo = dataSource.getRepository(Contact);
    const transactionRepo = dataSource.getRepository(Transaction);

    const assetContactData: any[] = [];
    const liabilityContactData: any[] = [];
    let contactAssetSum = 0;
    let contactLiabilitySum = 0;
    const contactList = await contactRepo.find();

    for (const contactItem of contactList) {
      // Count total transactions up to dateTo
      const transactionCount = await transactionRepo.count({
        where: {
          contact: { id: contactItem.id },
          date: LessThanOrEqual(dateTo),
        },
      });

      if (transactionCount === 0) continue;

      // Sum debit and credit amounts up to dateTo
      const debitResult = await transactionRepo
        .createQueryBuilder("t")
        .where("t.contact_id = :contactId", { contactId: contactItem.id })
        .andWhere("t.date <= :dateTo", { dateTo })
        .select("COALESCE(SUM(t.debitAmount),0)", "debit")
        .getRawOne();

      const creditResult = await transactionRepo
        .createQueryBuilder("t")
        .where("t.contact_id = :contactId", { contactId: contactItem.id })
        .andWhere("t.date <= :dateTo", { dateTo })
        .select("COALESCE(SUM(t.creditAmount),0)", "credit")
        .getRawOne();

      const debitSum = Number(debitResult.debit || 0);
      const creditSum = Number(creditResult.credit || 0);

      let balanceAmount = Number((debitSum - creditSum).toFixed(2));
      if (reportType === "balanceSheet") {
        if (balanceAmount >= 0) {
          // Asset
          contactAssetSum += balanceAmount;
          assetContactData.push({
            accountId: contactItem.id,
            accountName: contactItem.name,
            accountType: "Contact",
            accountSelfTotal: [balanceAmount],
            accountTotal: [balanceAmount],
            subLevel: level,
          });
        } else {
          // Liability
          balanceAmount = Math.abs(balanceAmount);
          contactLiabilitySum += balanceAmount;
          liabilityContactData.push({
            accountId: contactItem.id,
            accountName: contactItem.name,
            accountType: "Contact",
            accountSelfTotal: [balanceAmount],
            accountTotal: [balanceAmount],
            subLevel: level,
          });
        }
      }
      if (reportType === "trialBalance") {
        let debitBalance = 0;
        let creditBalance = 0;

        if (balanceAmount > 0) {
          debitBalance = balanceAmount;
        } else if (balanceAmount < 0) {
          creditBalance = Math.abs(balanceAmount);
        }

        if (balanceAmount >= 0) {
          contactAssetSum += debitBalance;
          assetContactData.push({
            accountId: contactItem.id,
            accountName: contactItem.name,
            accountType: "Contact",
            accountSelfTotal: [debitBalance, creditBalance],
            accountTotal: [debitBalance, creditBalance],
            subLevel: level,
          });
        } else {
          contactLiabilitySum += creditBalance;
          liabilityContactData.push({
            accountId: contactItem.id,
            accountName: contactItem.name,
            accountType: "Contact",
            accountSelfTotal: [debitBalance, creditBalance],
            accountTotal: [debitBalance, creditBalance],
            subLevel: level,
          });
        }
      }
    }

    return [
      assetContactData,
      liabilityContactData,
      contactAssetSum,
      contactLiabilitySum,
    ];
  }

  async reportSplitContactDataCalc(
    dataSource: DataSource,
    dateTo: Date,
    level: number
  ): Promise<[any[], any[], number, number]> {
    const contactRepo = dataSource.getRepository(Contact);
    const transactionRepo = dataSource.getRepository(Transaction);

    const assetContactData: any[] = [];
    const liabilityContactData: any[] = [];
    let contactAssetSum = 0;
    let contactLiabilitySum = 0;
    const contactList = await contactRepo.find();
    for (const contactItem of contactList) {
      const contactData = await contactRepo.findOne({
        where: { id: contactItem.id },
      });
      if (!contactData) continue;
      const transactionCount = await transactionRepo.count({
        where: {
          contact: { id: contactItem.id },
          date: LessThanOrEqual(dateTo),
        },
      });

      // Non-invoice/bill transactions
      const debitNonInvoice = await transactionRepo
        .createQueryBuilder("t")
        .where("t.contact_id = :contactId", { contactId: contactItem.id })
        .andWhere("t.date <= :dateTo", { dateTo })
        .andWhere("t.transactionTypeName NOT IN (:...types)", {
          types: ["invoice", "invoice_payment", "bill", "bill_payment"],
        })
        .select("COALESCE(SUM(t.debitAmount),0)", "debit")
        .getRawOne();

      const creditNonInvoice = await transactionRepo
        .createQueryBuilder("t")
        .where("t.contact_id = :contactId", { contactId: contactItem.id })
        .andWhere("t.date <= :dateTo", { dateTo })
        .andWhere("t.transactionTypeName NOT IN (:...types)", {
          types: ["invoice", "invoice_payment", "bill", "bill_payment"],
        })
        .select("COALESCE(SUM(t.creditAmount),0)", "credit")
        .getRawOne();

      const debitSum = Number(debitNonInvoice.debit || 0);
      const creditSum = Number(creditNonInvoice.credit || 0);

      // Invoice transactions
      const invoice = await transactionRepo
        .createQueryBuilder("t")
        .where("t.contact_id = :contactId", { contactId: contactItem.id })
        .andWhere("t.date <= :dateTo", { dateTo })
        .andWhere("t.transactionTypeName IN (:...types)", {
          types: ["invoice", "invoice_payment"],
        })
        .select([
          "COALESCE(SUM(t.debitAmount),0) AS debit",
          "COALESCE(SUM(t.creditAmount),0) AS credit",
        ])
        .getRawOne();

      const invoiceSum =
        Number(invoice.debit || 0) - Number(invoice.credit || 0);

      // Bill transactions
      const bill = await transactionRepo
        .createQueryBuilder("t")
        .where("t.contact_id = :contactId", { contactId: contactItem.id })
        .andWhere("t.date <= :dateTo", { dateTo })
        .andWhere("t.transactionTypeName IN (:...types)", {
          types: ["bill", "bill_payment"],
        })
        .select([
          "COALESCE(SUM(t.debitAmount),0) AS debit",
          "COALESCE(SUM(t.creditAmount),0) AS credit",
        ])
        .getRawOne();

      const billSum = Number(bill.credit || 0) - Number(bill.debit || 0);

      const totalDebitSum = debitSum + invoiceSum;
      const totalCreditSum = creditSum + billSum;

      // Calculate asset and liability balance
      let assetBalance = 0;
      let liabilityBalance = 0;

      if (totalDebitSum < 0 && totalCreditSum >= 0) {
        assetBalance = 0;
        liabilityBalance = totalCreditSum + Math.abs(totalDebitSum);
      } else if (totalCreditSum < 0 && totalDebitSum >= 0) {
        assetBalance = totalDebitSum + Math.abs(totalCreditSum);
        liabilityBalance = 0;
      } else if (totalCreditSum < 0 && totalDebitSum < 0) {
        assetBalance = Math.abs(totalCreditSum);
        liabilityBalance = Math.abs(totalDebitSum);
      } else {
        assetBalance = totalDebitSum;
        liabilityBalance = totalCreditSum;
      }

      // Append asset data
      if (transactionCount > 0) {
        contactAssetSum += assetBalance;
        assetContactData.push({
          accountId: contactData.id,
          accountName: contactData.name,
          accountType: "Contact",
          accountSelfTotal: [parseFloat(assetBalance.toFixed(2))],
          accountTotal: [parseFloat(assetBalance.toFixed(2))],
          subLevel: level,
        });
      }

      // Append liability data
      if (transactionCount > 0) {
        ((contactLiabilitySum += liabilityBalance), 2);
        liabilityContactData.push({
          accountId: contactData.id,
          accountName: contactData.name,
          accountType: "Contact",
          accountSelfTotal: [parseFloat(liabilityBalance.toFixed(2))],
          accountTotal: [parseFloat(liabilityBalance.toFixed(2))],
          subLevel: level,
        });
      }
    }

    return [
      assetContactData,
      liabilityContactData,
      contactAssetSum,
      contactLiabilitySum,
    ];
  }

  async calcTdsSummary(dataSource: DataSource, inputData: any) {
    const contactRepo = dataSource.getRepository(Contact);
    const taxRepo = dataSource.getRepository(Tax);
    const transactionRepo = dataSource.getRepository(Transaction);
    const invoiceRepo = dataSource.getRepository(Invoice);
    const billRepo = dataSource.getRepository(Bill);

    const [dateFrom, dateTo] = inputData.dateList;

    const tdsTaxData = await taxRepo.findOne({
      where: { taxName: "TDS" },
    });
    if (!tdsTaxData) return {};
    const tdsId = tdsTaxData.id;

    const tdsReceivables: Record<number, number> = {};
    const tdsPayables: Record<number, number> = {};

    // ----- TDS Invoices -----
    const tdsInvoiceData = await transactionRepo.find({
      where: {
        transactionTypeName: "invoice",
        tax: { id: tdsId },
        creditAmount: "0",
        date: Between(dateFrom, dateTo),
        hasContactMapping: false,
      },
      select: ["transactionTypeId", "debitAmount"],
    });

    for (const invoiceTxn of tdsInvoiceData) {
      const invData = await invoiceRepo.findOne({
        where: { transactionTypeId: invoiceTxn.transactionTypeId },
        relations: ["contact"],
        select: ["contact"],
      });
      if (!invData) continue;
      const contact = invData.contact.id;
      const tdsAmount = Number(invoiceTxn.debitAmount);

      tdsReceivables[contact] = (tdsReceivables[contact] || 0) + tdsAmount;
    }

    // ----- TDS Received -----
    const tdsReceived = await transactionRepo.find({
      where: {
        transactionTypeName: In(["transfer", "journal", "opening_balance"]),
        tax: { id: tdsId },
        debitAmount: "0",
        date: Between(dateFrom, dateTo),
        hasContactMapping: true,
      },
    });

    for (const tdsTxn of tdsReceived) {
      const fxRate = Number(tdsTxn.counterOriginalExchangeRate || 1);
      for (const [contactId, tdsReceivedAmount] of Object.entries(
        tdsTxn.contactMapping || {}
      )) {
        const adjustedAmount = Number(tdsReceivedAmount) * fxRate;
        tdsReceivables[contactId] =
          (tdsReceivables[contactId] || 0) - adjustedAmount;
      }
    }

    // ----- TDS Bills -----
    const tdsBillData = await transactionRepo.find({
      where: {
        transactionTypeName: "bill",
        tax: { id: tdsId },
        debitAmount: "0",
        date: Between(dateFrom, dateTo),
        hasContactMapping: false,
      },
      relations: ["contact"],
      select: ["transactionTypeId", "creditAmount", "contact"],
    });

    for (const billTxn of tdsBillData) {
      const billData = await billRepo.findOne({
        where: { transactionTypeId: billTxn.transactionTypeId },
        relations: ["contact"],
        select: ["contact"],
      });
      if (!billData) continue;
      const contact = billData.contact.id;
      const tdsAmount = Number(billTxn.creditAmount);

      tdsPayables[contact] = (tdsPayables[contact] || 0) + tdsAmount;
    }

    const tdsPaid = await transactionRepo.find({
      where: {
        transactionTypeName: In(["transfer", "journal", "opening_balance"]),
        tax: { id: tdsId },
        creditAmount: "0",
        date: Between(dateFrom, dateTo),
        hasContactMapping: true,
      },
    });

    for (const tdsTxn of tdsPaid) {
      const fxRate = Number(tdsTxn.counterExchangeRate || 1);
      for (const [contactId, tdsPaidAmount] of Object.entries(
        tdsTxn.contactMapping || {}
      )) {
        const adjustedAmount = Number(tdsPaidAmount) * fxRate;
        tdsPayables[contactId] = (tdsPayables[contactId] || 0) - adjustedAmount;
      }
    }

    // ----- Final Calculation -----
    const finalTdsReceivables: Record<number, number> = {};
    const finalTdsPayables: Record<number, number> = {};
    let totalReceivable = 0;
    let totalPayable = 0;

    const allContacts = new Set(
      [...Object.keys(tdsReceivables), ...Object.keys(tdsPayables)].map(Number)
    );

    for (const contactId of allContacts) {
      const receivableValue = tdsReceivables[contactId] || 0;
      const payableValue = tdsPayables[contactId] || 0;

      if (receivableValue >= 0 && payableValue >= 0) {
        finalTdsReceivables[contactId] = receivableValue;
        finalTdsPayables[contactId] = payableValue;
      } else if (receivableValue >= 0 && payableValue < 0) {
        finalTdsReceivables[contactId] = receivableValue - payableValue;
        finalTdsPayables[contactId] = 0;
      } else if (receivableValue < 0 && payableValue >= 0) {
        finalTdsReceivables[contactId] = 0;
        finalTdsPayables[contactId] = payableValue - receivableValue;
      } else {
        finalTdsReceivables[contactId] = receivableValue - payableValue;
        finalTdsPayables[contactId] = payableValue - receivableValue;
      }

      totalReceivable += finalTdsReceivables[contactId];
      totalPayable += finalTdsPayables[contactId];
    }
    const contactList = await contactRepo.find();

    const contactMapping = contactList.reduce<Record<number, string>>(
      (acc, contact) => {
        acc[contact.id] = contact.name;
        return acc;
      },
      {}
    );

    const formattedTdsReceivables = Object.entries(finalTdsReceivables)
      .map(([contactId, amount]) => ({
        contactId: Number(contactId),
        contactName: contactMapping[contactId],
        tdsAmount: amount,
      }))
      .sort((a, b) => a.contactName.localeCompare(b.contactName));

    const formattedTdsPayables = Object.entries(finalTdsPayables)
      .map(([contactId, amount]) => ({
        contactId: Number(contactId),
        contactName: contactMapping[contactId],
        tdsAmount: amount,
      }))
      .sort((a, b) => a.contactName.localeCompare(b.contactName));

    return {
      dateList: inputData.dateList,
      contactMapping,
      tdsReceivables: formattedTdsReceivables,
      tdsPayables: formattedTdsPayables,
      totalReceivable,
      totalPayable,
    };
  }

  async calcTaxSummary(dataSource: DataSource, inputData: any) {
    const [dateFrom, dateTo] = inputData.dateList;
    const taxRepo = dataSource.getRepository(Tax);
    const transactionRepo = dataSource.getRepository(Transaction);
    const invoiceRepo = dataSource.getRepository(Invoice);
    const billRepo = dataSource.getRepository(Bill);
    const settingRepo = dataSource.getRepository(CompanySetting);

    const companySetting = await settingRepo.findOne({ where: {} });
    if (!companySetting)
      throw new NotFoundException("Company Setting not found!");
    const reportingCurrency = companySetting.reportingCurrency;
    /* ---------------- TAX DATA ---------------- */
    const taxPercentData: Record<number, any> = {};
    const taxableAmountData: Record<number, any> = {};

    const taxes = await taxRepo.find({
      where: { taxName: Not("TDS") },
      order: {
        taxName: "ASC",
      },
      select: ["id", "taxName", "abbreviation"],
    });

    for (const tax of taxes) {
      const debitResult = await transactionRepo
        .createQueryBuilder("t")
        .select("SUM(t.debitAmount)", "sum")
        .where("t.tax_id = :taxId", { taxId: tax.id })
        .andWhere("t.date BETWEEN :from AND :to", {
          from: dateFrom,
          to: dateTo,
        })
        .andWhere("t.transactionTypeName IN (:...types)", {
          types: ["journal", "opening_balance", "transfer"],
        })
        .getRawOne();

      const creditResult = await transactionRepo
        .createQueryBuilder("t")
        .select("SUM(t.creditAmount)", "sum")
        .where("t.tax_id = :taxId", { taxId: tax.id })
        .andWhere("t.date BETWEEN :from AND :to", {
          from: dateFrom,
          to: dateTo,
        })
        .andWhere("t.transactionTypeName IN (:...types)", {
          types: ["journal", "opening_balance", "transfer"],
        })
        .getRawOne();

      const debitSum = Number(debitResult?.sum || 0);
      const creditSum = Number(creditResult?.sum || 0);

      const taxFixedAmount = debitSum - creditSum;

      taxPercentData[tax.id] = {
        totalTaxAmount: taxFixedAmount,
        totalTaxableAmount: 0,
      };

      taxableAmountData[tax.id] = {};

      if (taxFixedAmount) {
        taxPercentData[tax.id].manualJournal = taxFixedAmount;
        taxableAmountData[tax.id].manualJournal = 0;
      }
    }

    /* ---------------- INVOICES ---------------- */
    const invoices = await invoiceRepo.find({
      where: {
        invoiceDate: Between(dateFrom, dateTo),
      },
      relations: ["contact", "items"],
    });
    this.getInvoiceTaxData(
      invoices,
      taxPercentData,
      taxableAmountData,
      reportingCurrency
    );

    /* ---------------- BILLS ---------------- */
    const bills = await billRepo.find({
      where: {
        billDate: Between(dateFrom, dateTo),
      },
      relations: ["contact", "items"],
    });

    this.getBillTaxData(
      bills,
      taxPercentData,
      taxableAmountData,
      reportingCurrency
    );

    /* ---------------- FINAL FORMAT ---------------- */
    const finalTaxData: any = [];
    let totalTax = 0;

    for (const tax of taxes) {
      const taxData = taxPercentData[tax.id];
      totalTax += taxData.totalTaxAmount;

      const taxSubRows: any = [];

      const percentValues = { ...taxData };
      delete percentValues.totalTaxAmount;
      delete percentValues.totalTaxableAmount;

      for (const key of Object.keys(percentValues)) {
        let percentUiName = `${key} %`;
        if (key === "amount") percentUiName = "Fixed Amount";
        if (key === "manualJournal") percentUiName = "Manual Transactions";

        taxSubRows.push({
          taxPercent: key,
          percentName: percentUiName,
          taxAmount: percentValues[key],
          taxableAmount: taxableAmountData[tax.id][key],
        });
      }

      if (taxSubRows.length) {
        finalTaxData.push({
          ...tax,
          totalTaxAmount: taxData.totalTaxAmount,
          totalTaxableAmount: taxData.totalTaxableAmount,
          taxSubRows: taxSubRows.sort(this.sortTaxData.bind(this)),
        });
      }
    }

    return {
      dateFrom,
      dateTo,
      taxInfoData: finalTaxData,
      totalTax: totalTax,
    };
  }

  async calcDetailedTaxSummary(dataSource: DataSource, inputData: any) {
    const [dateFrom, dateTo] = inputData.dateList;
    const { taxId, taxPercent } = inputData;

    const transactionRepo = dataSource.getRepository(Transaction);
    const invoiceRepo = dataSource.getRepository(Invoice);
    const billRepo = dataSource.getRepository(Bill);
    const settingRepo = dataSource.getRepository(CompanySetting);

    const companySetting = await settingRepo.findOne({ where: {} });
    if (!companySetting) {
      throw new NotFoundException("Company Setting not found");
    }

    const reportingCurrency = companySetting.reportingCurrency;
    const detailedTaxData: any[] = [];
    let runningBalance = 0;

    /* ================= MANUAL JOURNAL ================= */
    if (taxPercent === "manualJournal") {
      const transactions = await transactionRepo.find({
        where: {
          tax: { id: taxId },
          date: Between(dateFrom, dateTo),
          transactionTypeName: In(["journal", "opening_balance", "transfer"]),
        },
        relations: ["account", "contact", "tax"],
        order: { date: "ASC", createdAt: "ASC" },
      });

      for (const tx of transactions) {
        runningBalance += Number(tx.debitAmount || 0);
        runningBalance -= Number(tx.creditAmount || 0);

        detailedTaxData.push({
          date: tx.date,
          description: tx.description,
          debit: tx.debitAmount,
          credit: tx.creditAmount,
          runningBalance,
          transactionTypeName: tx.transactionTypeName,
        });
      }

      return {
        dateFrom,
        dateTo,
        detailedTaxData,
      };
    }

    /* ================= INVOICES ================= */
    const invoices = await invoiceRepo.find({
      where: {
        invoiceDate: Between(dateFrom, dateTo),
      },
      relations: ["contact", "items", "items.transaction"],
    });

    for (const invoice of invoices) {
      const subTotal = invoice.items.reduce(
        (s, i) => s + Number(i.itemTotal),
        0
      );

      for (const item of invoice.items) {
        if (!Array.isArray(item.itemTax)) continue;

        let itemTotal = Number(item.itemTotal);

        /* ---- HEADER DISCOUNT ---- */
        if (invoice.discountApplied === DiscountApplied.BEFORE) {
          if (invoice.discountType === DiscountType.PERCENT) {
            itemTotal -= itemTotal * (Number(invoice.discountValue) / 100);
          } else {
            itemTotal -= (itemTotal / subTotal) * Number(invoice.discountValue);
          }
        }

        /* ---- FX ---- */
        let fxRate = 1;
        if (
          invoice.invoiceCurrency !== reportingCurrency &&
          item.transaction?.counterExchangeRate
        ) {
          fxRate = Number(item.transaction.counterExchangeRate);
        }

        for (const tax of item.itemTax) {
          if (tax.taxId !== taxId) continue;

          let taxAmount = 0;
          let matched = false;

          if (tax.type === "percent") {
            if (String(tax.value) === taxPercent) {
              taxAmount = itemTotal * (Number(tax.value) / 100);
              matched = true;
            }
          } else {
            if (taxPercent === "amount") {
              taxAmount = Number(tax.value);
              matched = true;
            }
          }

          if (!matched) continue;

          taxAmount *= fxRate;
          runningBalance -= taxAmount;

          detailedTaxData.push({
            date: invoice.invoiceDate,
            description: `${invoice.contact?.name} - ${invoice.invoiceNo}`,
            transactionTypeName: "invoice",
            contactName: invoice.contact?.name,
            referenceNo: invoice.invoiceNo,
            debit: 0,
            credit: taxAmount,
            runningBalance,
          });
        }
      }
    }

    /* ================= BILLS ================= */
    const bills = await billRepo.find({
      where: {
        billDate: Between(dateFrom, dateTo),
      },
      relations: ["contact", "items", "items.transaction"],
    });

    for (const bill of bills) {
      const subTotal = bill.items.reduce((s, i) => s + Number(i.itemTotal), 0);

      for (const item of bill.items) {
        if (!Array.isArray(item.itemTax)) continue;

        let itemTotal = Number(item.itemTotal);

        if (bill.discountApplied === DiscountApplied.BEFORE) {
          if (bill.discountType === DiscountType.PERCENT) {
            itemTotal -= itemTotal * (Number(bill.discountValue) / 100);
          } else {
            itemTotal -= (itemTotal / subTotal) * Number(bill.discountValue);
          }
        }

        let fxRate = 1;
        if (
          bill.billCurrency !== reportingCurrency &&
          item.transaction?.counterExchangeRate
        ) {
          fxRate = Number(item.transaction.counterExchangeRate);
        }

        for (const tax of item.itemTax) {
          if (tax.taxId !== taxId) continue;

          let taxAmount = 0;
          let matched = false;

          if (tax.type === "percent") {
            if (String(tax.value) === taxPercent) {
              taxAmount = itemTotal * (Number(tax.value) / 100);
              matched = true;
            }
          } else {
            if (taxPercent === "amount") {
              taxAmount = Number(tax.value);
              matched = true;
            }
          }

          if (!matched) continue;

          taxAmount *= fxRate;
          runningBalance += taxAmount;

          detailedTaxData.push({
            date: bill.billDate,
            description: `${bill.contact?.name} - ${bill.billNo}`,
            transactionTypeName: "bill",
            contactName: bill.contact?.name,
            referenceNo: bill.billNo,
            debit: taxAmount,
            credit: 0,
            runningBalance,
          });
        }
      }
    }

    return {
      dateFrom,
      dateTo,
      detailedTaxData,
    };
  }

  sortTaxData(a: { taxPercent: string }, b: { taxPercent: string }): number {
    const getSortValue = (key: string): [number, number] => {
      if (key === "amount") {
        return [Number.POSITIVE_INFINITY, 1];
      }
      if (key === "manualJournal") {
        return [Number.POSITIVE_INFINITY, 2];
      }
      return [Number(key), 0];
    };

    const [aVal, aOrder] = getSortValue(a.taxPercent);
    const [bVal, bOrder] = getSortValue(b.taxPercent);

    // primary sort
    if (aVal !== bVal) {
      return aVal - bVal;
    }

    // secondary sort
    return aOrder - bOrder;
  }

  async getInvoiceTaxData(
    invoices: Invoice[],
    taxPercentData: TaxPercentData,
    taxableAmountData: TaxableAmountData,
    companyReportingCurrency: string
  ): Promise<void> {
    const invoiceSubTotals: Record<number, number> = {};

    /* ---------- CALCULATE SUBTOTAL PER INVOICE ---------- */
    for (const invoice of invoices) {
      invoiceSubTotals[`${invoice.id}_${invoice.contact.id}`] =
        invoice.items.reduce((sum, item) => sum + Number(item.itemTotal), 0);
    }

    /* ---------- PROCESS EACH INVOICE ITEM ---------- */
    for (const invoice of invoices) {
      for (const item of invoice.items) {
        /* ---------- TAX JSON ---------- */
        if (!item.itemTax || !Array.isArray(item.itemTax)) continue;

        let itemTotal = Number(item.itemTotal);
        /* ---------- DISCOUNT (HEADER LEVEL) ---------- */
        if (invoice.discountApplied === DiscountApplied.BEFORE) {
          if (invoice.discountType === DiscountType.PERCENT) {
            const discountPercent = Number(invoice.discountValue || 0) / 100;
            itemTotal -= itemTotal * discountPercent;
          } else if (invoice.discountType === DiscountType.VALUE) {
            const proportionalDiscount =
              (itemTotal / invoiceSubTotals[invoice.id]) *
              Number(invoice.discountValue || 0);
            itemTotal -= proportionalDiscount;
          }
        }

        /* ---------- FX ---------- */
        let fxRate = 1;
        let fxItemTotal = 1;
        if (
          invoice.invoiceCurrency !== companyReportingCurrency &&
          item.transaction?.counterExchangeRate
        ) {
          fxRate = Number(item.transaction.counterExchangeRate);
          fxItemTotal *= fxRate;
        } else {
          fxItemTotal = itemTotal;
        }

        for (const tax of item.itemTax) {
          const taxId = tax.taxId;
          let taxValue = 0;
          let percentKey: string;

          if (tax.type === "percent") {
            percentKey = String(tax.value);
            taxValue = itemTotal * (Number(tax.value) / 100);
          } else {
            percentKey = "amount";
            taxValue = Number(tax.value);
          }

          taxValue *= fxRate;

          /* ---------- INIT BUCKETS ---------- */
          taxPercentData[taxId][percentKey] ??= 0;
          taxableAmountData[taxId][percentKey] ??= 0;

          /* ---------- INVOICE = CREDIT (NEGATIVE) ---------- */
          taxPercentData[taxId][percentKey] -= taxValue;
          taxableAmountData[taxId][percentKey] -= fxItemTotal;

          taxPercentData[taxId].totalTaxAmount -= taxValue;
          taxPercentData[taxId].totalTaxableAmount -= fxItemTotal;
        }
      }
    }
  }

  async getBillTaxData(
    bills: any[],
    taxPercentData: TaxPercentData,
    taxableAmountData: TaxableAmountData,
    companyReportingCurrency: string
  ): Promise<void> {
    const billSubTotals: Record<number, number> = {};

    /* ---------- CALCULATE SUBTOTAL PER INVOICE ---------- */
    for (const bill of bills) {
      billSubTotals[`${bill.id}_${bill.contact.id}`] = bill.items.reduce(
        (sum, item) => sum + Number(item.itemTotal),
        0
      );
    }

    /* ---------- PROCESS EACH INVOICE ITEM ---------- */
    for (const bill of bills) {
      for (const item of bill.items) {
        /* ---------- TAX JSON ---------- */
        if (!item.itemTax || !Array.isArray(item.itemTax)) continue;

        let itemTotal = Number(item.itemTotal);
        /* ---------- DISCOUNT (HEADER LEVEL) ---------- */
        if (bill.discountApplied === DiscountApplied.BEFORE) {
          if (bill.discountType === DiscountType.PERCENT) {
            const discountPercent = Number(bill.discountValue || 0) / 100;
            itemTotal -= itemTotal * discountPercent;
          } else if (bill.discountType === DiscountType.VALUE) {
            const proportionalDiscount =
              (itemTotal / billSubTotals[bill.id]) *
              Number(bill.discountValue || 0);
            itemTotal -= proportionalDiscount;
          }
        }

        /* ---------- FX ---------- */
        let fxRate = 1;
        let fxItemTotal = 1;
        if (
          bill.invoiceCurrency !== companyReportingCurrency &&
          item.transaction?.counterExchangeRate
        ) {
          fxRate = Number(item.transaction.counterExchangeRate);
          fxItemTotal *= fxRate;
        } else {
          fxItemTotal = itemTotal;
        }

        for (const tax of item.itemTax) {
          const taxId = tax.taxId;
          let taxValue = 0;
          let percentKey: string;

          if (tax.type === "percent") {
            percentKey = String(tax.value);
            taxValue = itemTotal * (Number(tax.value) / 100);
          } else {
            percentKey = "amount";
            taxValue = Number(tax.value);
          }

          taxValue *= fxRate;

          /* ---------- INIT BUCKETS ---------- */
          taxPercentData[taxId][percentKey] ??= 0;
          taxableAmountData[taxId][percentKey] ??= 0;

          /* ---------- INVOICE = CREDIT (NEGATIVE) ---------- */
          taxPercentData[taxId][percentKey] += taxValue;
          taxableAmountData[taxId][percentKey] += fxItemTotal;

          taxPercentData[taxId].totalTaxAmount += taxValue;
          taxPercentData[taxId].totalTaxableAmount += fxItemTotal;
        }
      }
    }
  }

  async getCommaSeperation(manager: EntityManager, companyId: string) {
    const companySettingRepo = manager.getRepository(CompanySetting);

    const commaSeparation = await companySettingRepo.findOne({
      where: { companyId },
      select: ["commaSeparation"],
    });
    if (!commaSeparation) throw new NotFoundException("Company Not Found");
    return commaSeparation;
  }

  async getFromAndToDate(
    manager: EntityManager,
    fromDate: string,
    toDate: string
  ) {
    const transactionRepo = manager.getRepository(Transaction);
    const { min, max } = await transactionRepo
      .createQueryBuilder("transaction")
      .select("MIN(transaction.date)", "min")
      .addSelect("MAX(transaction.date)", "max")
      .getRawOne();

    const formattedFromDate: Date = fromDate ? new Date(fromDate) : min;
    const formattedToDate: Date = fromDate ? new Date(toDate) : max;

    return { formattedFromDate, formattedToDate };
  }

  async exportProfitLossToPdf(
    userId: number,
    dataSource: DataSource,
    fromDate: string,
    toDate: string,
    isCustomize: string,
    companyId: string,
    headerUrl: string,
    displayName: string,
    noOfMonthsOrYear?: number,
    compareWith?: string
  ) {
    const htmlPath = getTemplatePath("report-export-pdf-format.html");
    if (!htmlPath) throw new InternalServerErrorException("File Path Missing!");

    const result = await this.profitLoss(
      dataSource,
      userId,
      fromDate,
      toDate,
      isCustomize,
      noOfMonthsOrYear,
      compareWith
    );

    const { commaSeparation } = await this.getCommaSeperation(
      dataSource.manager,
      companyId
    );

    const {
      dateList,
      resultData,
      totalData,
      finalProfit,
      zeroBalance,
      decimalPlace,
    } = result;

    let formattedFromDate: Date;
    let formattedToDate: Date;

    if (Array.isArray(dateList[0])) {
      formattedFromDate = dateList[0][0];
      formattedToDate = dateList[dateList.length - 1][1];
    } else {
      formattedFromDate = dateList[0];
      formattedToDate = dateList[dateList.length - 1];
    }

    const fileName = `Profit_Loss_${formattedFromDate}_To_${formattedToDate}.pdf `;

    const formatNumber = (val: number) => {
      if (typeof val !== "number") return "";
      const num = decimalPlace ? val : Math.round(val);
      return num.toLocaleString(commaSeparation, {
        minimumFractionDigits: decimalPlace ? 2 : 0,
        maximumFractionDigits: decimalPlace ? 2 : 0,
      });
    };

    const hasNonZero = (values: number[] = []) =>
      values.some((v) => Math.round(v) !== 0);

    const headers: string[] = [];

    if (!isCustomize) {
      headers.push("Total");
    } else {
      for (const [start, end] of dateList) {
        if (compareWith === "month") {
          headers.push(
            new Date(end).toLocaleString("en-US", {
              month: "short",
              year: "numeric",
            })
          );
        } else if (compareWith === "year") {
          const startDate = new Date(start).toLocaleString("en-US", {
            month: "short",
            year: "numeric",
          });
          const endDate = new Date(end).toLocaleString("en-US", {
            month: "short",
            year: "numeric",
          });
          headers.push(`${startDate} to ${endDate}`);
        }
      }
      headers.push("Total");
    }

    const rows: any[] = [];

    const pushSection = (label: string) => {
      rows.push({
        label,
        values: headers.map(() => ""),
        rowClass: "section",
        indentClass: "",
      });
    };

    const pushRow = (
      label: string,
      values: number[],
      rowClass = "",
      indentClass = ""
    ) => {
      if (!zeroBalance && !hasNonZero(values)) return;
      const totalValue = values.length ? values[values.length - 1] : 0;
      rows.push({
        label,
        values: headers.map((_, i) =>
          i === headers.length - 1 ? formatNumber(totalValue) : ""
        ),
        rowClass,
        indentClass,
      });
    };

    pushSection("INCOME");

    for (const group of resultData.Income || []) {
      const validAccounts = (group.accountsList || []).filter(
        (acc) => zeroBalance || hasNonZero(acc.accountTotal)
      );
      if (!zeroBalance || validAccounts.length > 0) {
        pushRow(group.groupName, group.groupSum, "group");
        for (const acc of validAccounts) {
          pushRow(acc.accountName, acc.accountTotal, "", "account");
        }
      }
    }

    pushRow("Total Income", totalData.Income, "total");

    pushSection("EXPENSE");

    for (const group of resultData.Expense || []) {
      const validAccounts = (group.accountsList || []).filter(
        (acc) => zeroBalance || hasNonZero(acc.accountTotal)
      );
      if (!zeroBalance || validAccounts.length > 0) {
        pushRow(group.groupName, group.groupSum, "group");
        for (const acc of validAccounts) {
          pushRow(acc.accountName, acc.accountTotal, "", "account");
        }
      }
    }

    pushRow("Total Expense", totalData.Expense, "total");
    pushRow("FINAL PROFIT", finalProfit, "final");

    const htmlTemplate = fs.readFileSync(htmlPath, "utf8");
    const template = hbs.compile(htmlTemplate);

    const finalHtml = template({
      headerUrl,
      headers,
      rows,
      formattedFromDate: formattedFromDate.toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      formattedToDate: formattedToDate.toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: "networkidle0" });

    const fileBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", right: "20px", bottom: "60px", left: "20px" },
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `
    <div style="width:100%; font-size:12px; padding:0 20px; display:flex; justify-content:space-between;">
      <span>Generated by: ${displayName}</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `,
    });

    await browser.close();
    return { fileBuffer: Buffer.from(fileBuffer), fileName };
  }

  async exportProfitLossToExcel(
    userId: number,
    dataSource: DataSource,
    fromDate: string,
    toDate: string,
    isCustomize: string,
    companyId: string,
    headerUrl: string,
    noOfMonthsOrYear?: number,
    compareWith?: string
  ) {
    const result = await this.profitLoss(
      dataSource,
      userId,
      fromDate,
      toDate,
      isCustomize,
      noOfMonthsOrYear,
      compareWith
    );

    const { commaSeparation } = await this.getCommaSeperation(
      dataSource.manager,
      companyId
    );

    const {
      dateList,
      resultData,
      totalData,
      finalProfit,
      decimalPlace,
      zeroBalance,
    } = result;

    let formattedFromDate: Date;
    let formattedToDate: Date;

    if (Array.isArray(dateList[0])) {
      formattedFromDate = dateList[0][0];
      formattedToDate = dateList[dateList.length - 1][1];
    } else {
      formattedFromDate = dateList[0];
      formattedToDate = dateList[dateList.length - 1];
    }

    const fileName = `Profit_Loss_${formattedFromDate.toISOString().split("T")[0]}_To_${formattedToDate.toISOString().split("T")[0]}.xlsx`;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Profit & Loss");

    if (headerUrl) {
      const imageBuffer = await fetchImageAsBuffer(headerUrl);
      const imageId = workbook.addImage({
        buffer: imageBuffer as any,
        extension: "jpeg",
      });
      sheet.getRow(1).height = 50;
      sheet.getRow(2).height = 50;
      sheet.addImage(imageId, {
        tl: { col: 0, row: 0 } as any,
        br: { col: 7, row: 2 } as any,
        editAs: "oneCell",
      });
    }

    const headers: string[] = [];

    if (!isCustomize) {
      headers.push("Amount");
    } else {
      for (const [start, end] of dateList) {
        if (compareWith === "month") {
          headers.push(
            new Date(end).toLocaleString("en-US", {
              month: "short",
              year: "numeric",
            })
          );
        } else {
          const startDate = new Date(start).toLocaleString("en-US", {
            month: "short",
            year: "numeric",
          });
          const endDate = new Date(end).toLocaleString("en-US", {
            month: "short",
            year: "numeric",
          });
          headers.push(`${startDate} to ${endDate}`);
        }
      }
      headers.push("Total");
    }

    sheet.columns = [{ header: "Description", key: "label", width: 35 }].concat(
      headers.map((h) => ({
        header: h,
        key: h,
        width: 18,
        style: { numFmt: "#,##0.00" },
      }))
    );

    const headerRow = sheet.getRow(3);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEFEFEF" },
      };
    });

    let currentRowIndex = 4;

    const formatValue = (val: number) => {
      if (val === null || val === undefined) return 0;
      const rounded = decimalPlace ? Number(val.toFixed(2)) : Math.round(val);
      if (!zeroBalance && rounded === 0) return null;
      return rounded;
    };

    const addRow = (label: string, values: number[], rowType = "") => {
      const formattedValues = values.map((v) => formatValue(v));
      const row = sheet.addRow([label, ...formattedValues.map((v) => v ?? 0)]);
      row.height = 18;
      row.alignment = { vertical: "middle" };
      row.eachCell((cell, colNumber) => {
        cell.numFmt = commaSeparation === "IN" ? "#,##,##0.00" : "#,##0.00";
        if (colNumber === 1) {
          if (
            rowType === "section" ||
            rowType === "total" ||
            rowType === "final"
          )
            cell.font = { bold: true };
          if (rowType === "group") cell.font = { bold: true };
          if (rowType === "account") cell.alignment = { indent: 2 };
        } else {
          cell.alignment = { horizontal: "right" };
          if (rowType === "total" || rowType === "final")
            cell.font = { bold: true };
        }
      });
      currentRowIndex++;
      return row;
    };

    const addSectionBorder = (startRow: number, endRow: number) => {
      for (let i = 1; i <= sheet.columnCount; i++) {
        const cellTop = sheet.getRow(startRow).getCell(i);
        const cellBottom = sheet.getRow(endRow).getCell(i);
        cellTop.border = { ...cellTop.border, top: { style: "medium" } };
        cellBottom.border = {
          ...cellBottom.border,
          bottom: { style: "medium" },
        };
      }
    };

    const pushSection = (name: string) => {
      const start = currentRowIndex;
      addRow(
        name,
        headers.map(() => 0),
        "section"
      );
      return start;
    };

    let sectionStart = pushSection("INCOME");
    for (const group of resultData.Income || []) {
      addRow(group.groupName, group.groupSum, "group");
      for (const acc of group.accountsList || [])
        addRow(acc.accountName, acc.accountTotal, "account");
    }
    addRow("Total Income", totalData.Income, "total");
    addSectionBorder(sectionStart, currentRowIndex - 1);

    sectionStart = pushSection("EXPENSE");
    for (const group of resultData.Expense || []) {
      addRow(group.groupName, group.groupSum, "group");
      for (const acc of group.accountsList || [])
        addRow(acc.accountName, acc.accountTotal, "account");
    }
    addRow("Total Expense", totalData.Expense, "total");
    addSectionBorder(sectionStart, currentRowIndex - 1);

    addRow("FINAL PROFIT", finalProfit, "final");
    addSectionBorder(currentRowIndex - 1, currentRowIndex - 1);

    sheet.columns.forEach((col) => {
      col.width ? (col.width = col.width + 2) : "";
    });

    const fileBuffer = await workbook.xlsx.writeBuffer();
    return { fileBuffer: Buffer.from(fileBuffer), fileName };
  }

  async exportBalanceSheetToPdf(
    userId: number,
    dataSource: DataSource,
    toDate: string,
    companyId: string,
    headerUrl: string,
    displayName: string,
    splitContact: boolean
  ) {
    const htmlPath = getTemplatePath("balance-sheet-pdf-export-template.html")
    if (!htmlPath) throw new InternalServerErrorException("File Path Missing!");

    const result = await this.balanceSheet(
      dataSource,
      userId,
      toDate,
      splitContact
    );

    const { commaSeparation } = await this.getCommaSeperation(
      dataSource.manager,
      companyId
    );

    const {
      resultData,
      totalData,
      profitCurrent,
      profitRetained,
      decimalPlace,
      zeroBalance,
    } = result;

    const formatNumber = (val: number) => {
      if (typeof val !== "number") return "";
      const num = decimalPlace ? val : Math.round(val);
      return num.toLocaleString(commaSeparation, {
        minimumFractionDigits: decimalPlace ? 2 : 0,
        maximumFractionDigits: decimalPlace ? 2 : 0,
      });
    };

    const rows: any[] = [];

    const pushSection = (label: string) => {
      rows.push({ label, value: "", rowClass: "section", indentClass: "" });
    };

    const pushRow = (
      label: string,
      value: number,
      rowClass = "",
      indentClass = ""
    ) => {
      if (!zeroBalance && (!value || value === 0)) return;
      rows.push({
        label,
        value: formatNumber(value),
        rowClass,
        indentClass,
      });
    };

    const pushGroup = (groupList: any[]) => {
      for (const group of groupList || []) {
        const groupTotal = group.groupSum?.[0] ?? 0;
        if (!zeroBalance && groupTotal === 0) continue;
        pushRow(group.groupName, groupTotal, "group");
        for (const acc of group.accountsList || []) {
          const accTotal = acc.accountTotal?.[0] ?? 0;
          if (!zeroBalance && accTotal === 0) continue;
          pushRow(acc.accountName, accTotal, "", "account");
          if (acc.subAccounts && acc.subAccounts.length) {
            for (const sub of acc.subAccounts) {
              const subTotal = sub.accountTotal?.[0] ?? 0;
              if (!zeroBalance && subTotal === 0) continue;
              pushRow(sub.accountName, subTotal, "", "account");
            }
          }
        }
      }
    };

    pushSection("ASSETS");
    pushGroup(resultData.Asset || []);
    pushRow("Total Assets", totalData.Asset?.[0] ?? 0, "total");

    pushSection("LIABILITIES");
    pushGroup(resultData.Liability || []);
    if (profitRetained) pushRow("Profit Retained", profitRetained);
    if (profitCurrent) pushRow("Profit Current", profitCurrent);
    pushRow("Total Liabilities", totalData.Liability?.[0] ?? 0, "total");

    const htmlTemplate = fs.readFileSync(htmlPath, "utf8");
    const template = hbs.compile(htmlTemplate);

    const finalHtml = template({
      headerUrl,
      rows,
      formattedToDate: new Date(toDate).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: "networkidle0" });

    const fileBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", right: "20px", bottom: "60px", left: "20px" },
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `
      <div style="width:100%; font-size:12px; padding:0 20px; display:flex; justify-content:space-between;">
        <span>Generated by: ${displayName}</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
    });

    await browser.close();

    const fileName = `Balance_Sheet_${toDate}.pdf`;
    return { fileBuffer: Buffer.from(fileBuffer), fileName };
  }

  async exportBalanceSheetToExcel(
    userId: number,
    dataSource: DataSource,
    toDate: string,
    companyId: string,
    headerUrl: string,
    displayName: string,
    splitContact: boolean
  ) {
    const result = await this.balanceSheet(
      dataSource,
      userId,
      toDate,
      splitContact
    );

    const { commaSeparation } = await this.getCommaSeperation(
      dataSource.manager,
      companyId
    );

    const {
      resultData,
      totalData,
      profitCurrent,
      profitRetained,
      decimalPlace,
      zeroBalance,
    } = result;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Balance Sheet");

    if (headerUrl) {
      const imageBuffer = await fetchImageAsBuffer(headerUrl);
      const imageId = workbook.addImage({
        buffer: imageBuffer as any,
        extension: "jpeg",
      });
      sheet.getRow(1).height = 50;
      sheet.getRow(2).height = 50;
      sheet.addImage(imageId, {
        tl: { col: 0, row: 0 } as any,
        br: { col: 7, row: 2 } as any,
        editAs: "oneCell",
      });
    }

    const formatValue = (val: number) => {
      if (val === null || val === undefined) return 0;
      const rounded = decimalPlace ? Number(val.toFixed(2)) : Math.round(val);
      if (!zeroBalance && rounded === 0) return null;
      return rounded;
    };

    const rows: any[] = [];

    const addRow = (
      label: string,
      values: number[],
      rowType = "",
      indent = 0
    ) => {
      const formattedValues = values.map((v) => formatValue(v));
      if (!zeroBalance && formattedValues.every((v) => v === null)) return;
      const row = sheet.addRow([label, ...formattedValues.map((v) => v ?? 0)]);
      row.height = 18;
      row.alignment = { vertical: "middle" };
      row.eachCell((cell, colNumber) => {
        cell.numFmt = commaSeparation === "IN" ? "#,##,##0.00" : "#,##0.00";
        if (colNumber === 1) {
          cell.alignment = { indent };
          if (
            rowType === "section" ||
            rowType === "total" ||
            rowType === "final" ||
            rowType === "group"
          )
            cell.font = { bold: true };
        } else {
          cell.alignment = { horizontal: "right" };
          if (rowType === "total" || rowType === "final")
            cell.font = { bold: true };
        }
      });
      return row;
    };

    const pushSection = (label: string) => addRow(label, [0], "section");

    const pushGroup = (groupList: any[]) => {
      for (const group of groupList || []) {
        const groupTotal = group.groupSum?.[0] ?? 0;
        if (!zeroBalance && groupTotal === 0) continue;
        addRow(group.groupName, [groupTotal], "group");
        for (const acc of group.accountsList || []) {
          const accTotal = acc.accountTotal?.[0] ?? 0;
          if (!zeroBalance && accTotal === 0) continue;
          addRow(acc.accountName, [accTotal], "", 2);
          if (acc.subAccounts && acc.subAccounts.length) {
            for (const sub of acc.subAccounts) {
              const subTotal = sub.accountTotal?.[0] ?? 0;
              if (!zeroBalance && subTotal === 0) continue;
              addRow(sub.accountName, [subTotal], "", 2);
            }
          }
        }
      }
    };

    pushSection("ASSETS");
    pushGroup(resultData.Asset || []);
    addRow("Total Assets", [totalData.Asset?.[0] ?? 0], "total");

    pushSection("LIABILITIES");
    pushGroup(resultData.Liability || []);
    if (profitRetained) addRow("Profit Retained", [profitRetained]);
    if (profitCurrent) addRow("Profit Current", [profitCurrent]);
    addRow("Total Liabilities", [totalData.Liability?.[0] ?? 0], "total");

    sheet.columns.forEach((col) => (col.width ? (col.width += 2) : ""));

    const fileName = `Balance_Sheet_${toDate}.xlsx`;
    const fileBuffer = await workbook.xlsx.writeBuffer();
    return { fileBuffer: Buffer.from(fileBuffer), fileName };
  }

  async generateTdsExcel(
    dataSource: DataSource,
    fromDate: string,
    toDate: string,
    userId: number,
    companyId: string,
    companyName: string,
    headerUrl: string
  ) {
    const companySettingCommaSeparation = await this.transactService.getCommaSeperation(dataSource.manager, companyId)
    const commaSeparation = (companySettingCommaSeparation.commaSeparation ?? "US") as
      | "US"
      | "IN";

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("TDS Summary");
    const filename = `TDS_Summary_${companyName}_${fromDate}_${toDate}.xlsx`;

    const headerText = `TDS Summary\n${companyName}\n${formatDate(fromDate)} - ${formatDate(toDate)}`;


    const companyCurrency = await this.transactService.getCompanyCurrency(dataSource.manager, companyId);
    const currency = companyCurrency.split(" ")[0];

    if (headerUrl) {
      const imageBuffer = await fetchImageAsBuffer(headerUrl);

      const imageId = workbook.addImage({
        buffer: imageBuffer as any,
        extension: "jpeg",
      });

      sheet.getRow(1).height = 50;
      sheet.getRow(2).height = 50;

      sheet.addImage(imageId, {
        tl: { col: 0, row: 0 } as any,
        br: { col: 2, row: 2 } as any,
        editAs: "oneCell",
      });
    }

    sheet.getRow(3).height = 20;
    sheet.getRow(4).height = 20;
    sheet.mergeCells("A3:B4");

    const headerCell = sheet.getCell("A3");
    headerCell.value = headerText;
    headerCell.font = { name: "Inter", size: 14, bold: true };
    headerCell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    const headerRow = sheet.getRow(6);
    headerRow.font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 6 }];

    const reportData = await this.tdsSummary(dataSource, userId, fromDate, toDate)

    const {
      tdsReceivables,
      tdsPayables,
      totalReceivable,
      totalPayable,
      zeroBalance,
      decimalPlace,
    } = reportData;

    const amountNumFmt = getNumberFormat(commaSeparation, decimalPlace, currency);

    const formatAmount = (value: number) => {
      return decimalPlace ? value : Math.trunc(value);
    };

    const getDisplayRows = (rows: any[]) =>
      zeroBalance ? rows : rows.filter(r => Number(r.tdsAmount) !== 0);

    const normalizeValue = (value: any) => {
      if (
        typeof value === "string" &&
        value.trim() !== "" &&
        !isNaN(Number(value))
      ) {
        return Number(value);
      }
      return value;
    };

    const addRowWithAlignment = (
      values: any[],
      bold = false,
      applyAmountFormat = false
    ) => {
      const row = sheet.addRow(values.map(normalizeValue));

      if (bold) row.font = { bold: true };

      row.eachCell(cell => {
        if (typeof cell.value === "number") {
          cell.alignment = { horizontal: "right", vertical: "middle" };

          if (applyAmountFormat) {
            cell.numFmt = amountNumFmt;
          }
        } else {
          cell.alignment = {
            horizontal: "left",
            vertical: "middle",
            wrapText: true,
          };
        }
      });

      return row;
    };


    addRowWithAlignment(["TDS Receivables"], true);
    const receivableHeaderRow = addRowWithAlignment(["Contact Name", "TDS Amount"], true);
    receivableHeaderRow.getCell(2).alignment = { horizontal: "right", vertical: "middle" };

    getDisplayRows(tdsReceivables!).forEach(item => {
      addRowWithAlignment(
        [item.contactName, formatAmount(item.tdsAmount)],
        false,
        true
      );
    });

    addRowWithAlignment(
      [`Total Receivable`, formatAmount(totalReceivable!)],
      true,
      true
    );

    sheet.addRow([]);
    sheet.addRow([]);

    addRowWithAlignment(["TDS Payables"], true);
    const payableHeaderRow = addRowWithAlignment(["Contact Name", "TDS Amount"], true);
    payableHeaderRow.getCell(2).alignment = { horizontal: "right", vertical: "middle" };

    getDisplayRows(tdsPayables!).forEach(item => {
      addRowWithAlignment(
        [item.contactName, formatAmount(item.tdsAmount)],
        false,
        true
      );
    });

    addRowWithAlignment(
      [`Total Payable`, formatAmount(totalPayable!)],
      true,
      true
    );

    sheet.columns.forEach(col => (col.width = 25));

    const fileBuffer = Buffer.from(await workbook.xlsx.writeBuffer())
    return { fileBuffer, filename }
  }

  async generateTdsPdf(
    dataSource: DataSource,
    fromDate: string,
    toDate: string,
    userId: number,
    companyId: string,
    companyName: string,
    headerUrl: string
  ): Promise<{ fileBuffer: Buffer; filename: string }> {

    const companyCurrency = await this.transactService.getCompanyCurrency(dataSource.manager, companyId);
    const currency = companyCurrency.split(" ")[0];

    const commaSeparation = await this.transactService.getCommaSeperation(dataSource.manager, companyId)

    const reportData = await this.tdsSummary(dataSource, userId, fromDate, toDate);
    const {
      decimalPlace,
    } = reportData;

    const htmlPath = getTemplatePath("tds-report.html");
    const html = await fs.readFile(htmlPath, "utf8");

    const template = hbs.compile(html);

    const formatAmount = (value: number): string => {
      if (value === null || value === undefined || isNaN(value)) return "0";

      const numericValue = decimalPlace ? value : Math.trunc(value);

      const locale =
        commaSeparation?.commaSeparation === "IN" ? "en-IN" : "en-US";

      return numericValue.toLocaleString(locale, {
        minimumFractionDigits: decimalPlace ? 2 : 0,
        maximumFractionDigits: decimalPlace ? 2 : 0,
      });
    };

    const formattedReceivables = reportData.tdsReceivables!.map(r => ({
      ...r,
      formattedAmount: formatAmount(r.tdsAmount),
    }));

    const formattedPayables = reportData.tdsPayables!.map(r => ({
      ...r,
      formattedAmount: formatAmount(r.tdsAmount),
    }));

    const totalReceivable = formatAmount(reportData.totalReceivable!);
    const totalPayable = formatAmount(reportData.totalPayable!);

    const compiledHtml = template({
      companyName,
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate),
      headerUrl,
      tdsReceivables: formattedReceivables,
      tdsPayables: formattedPayables,
      totalReceivable,
      totalPayable,
      zeroBalance: reportData.zeroBalance,
      currency
    });

    const footerPath = getTemplatePath("footer.html")
    const footerHtmlContent = await fs.readFile(
      footerPath,
      "utf8"
    );
    const footerTemplate = hbs.compile(footerHtmlContent);
    const footerHtml = footerTemplate({
      timestamp: formatDateTime(new Date().toLocaleString()),
    });

    const footerTmp = await tmp.file({ postfix: ".html" });
    await fs.writeFile(footerTmp.path!, footerHtml, "utf8");

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      wkhtmltopdf(
        compiledHtml,
        {
          pageSize: "A4",
          marginTop: "15mm",
          marginBottom: "20mm",
          marginLeft: "10mm",
          marginRight: "10mm",
          footerHtml: footerTmp.path,
          footerSpacing: 5,
          encoding: "UTF-8",
        },
        (err, stream) => {
          if (err) return reject(err);

          const chunks: Buffer[] = [];
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
        }
      );
    });

    return {
      fileBuffer: pdfBuffer,
      filename: `TDS_Summary_${companyName}_${fromDate}_${toDate}.pdf`,
    };
  }

  async generateTaxExcel(
    dataSource: DataSource,
    fromDate: string,
    toDate: string,
    userId: number,
    companyId: string,
    companyName: string,
    headerUrl: string
  ) {
    const workbook = new ExcelJS.Workbook();

    const safeSheetName = (name: string) =>
      name.replace(/[\\/*?:[\]]/g, "").substring(0, 31);

    const applyTableBorder = (row: ExcelJS.Row, fromCol: number, toCol: number) => {
      for (let col = fromCol; col <= toCol; col++) {
        row.getCell(col).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
    };

    const companyCurrency =
      await this.transactService.getCompanyCurrency(
        dataSource.manager,
        companyId
      );
    const currency = companyCurrency.split(" ")[0];

    const {
      taxInfoData,
      totalTax,
      decimalPlace,
      zeroBalance
    } = await this.taxSummary(dataSource, userId, fromDate, toDate);

    const formatAmount = (value: number | string) => {
      const num = Number(value);
      return decimalPlace ? num : Math.trunc(num);
    };

    const companySettingCommaSeparation =
      await this.transactService.getCommaSeperation(
        dataSource.manager,
        companyId
      );

    const commaSeparation = (companySettingCommaSeparation.commaSeparation ??
      "US") as "US" | "IN";

    const amountNumFmt = getNumberFormat(commaSeparation, decimalPlace, currency);

    const normalizeValue = (value: any) => {
      if (
        typeof value === "string" &&
        value.trim() !== "" &&
        !isNaN(Number(value))
      ) {
        return Number(value);
      }
      return value;
    };

    const capitalizeFirstLetter = (value: string): string => {
      if (!value || typeof value !== "string") return "";
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    };

    const addRow = (
      sheet: ExcelJS.Worksheet,
      values: any[],
      bold = false,
      alignRightCols: number[] = [],
      applyAmountFormatCols: number[] = []
    ) => {
      const row = sheet.addRow(values.map(normalizeValue));
      if (bold) row.font = { bold: true };

      row.eachCell((cell, colNumber) => {
        cell.alignment = alignRightCols.includes(colNumber)
          ? { horizontal: "right", vertical: "middle" }
          : { horizontal: "left", vertical: "middle", wrapText: true };

        if (
          applyAmountFormatCols.includes(colNumber) &&
          typeof cell.value === "number"
        ) {
          cell.numFmt = amountNumFmt;
        }
      });

      return row;
    };

    const applySheetHeader = async (sheet: ExcelJS.Worksheet, cellText: string) => {
      const headerText = `Detailed Tax Summary\n${cellText}\n${formatDate(
        fromDate
      )} - ${formatDate(toDate)}`;

      if (headerUrl) {
        const imageBuffer = await fetchImageAsBuffer(headerUrl);
        const imageId = workbook.addImage({
          buffer: imageBuffer as any,
          extension: "jpeg",
        });

        sheet.getRow(1).height = 50;
        sheet.getRow(2).height = 50;

        sheet.addImage(imageId, {
          tl: { col: 0, row: 0 } as any,
          br: { col: 6, row: 2 } as any,
          editAs: "oneCell",
        });
      }

      sheet.mergeCells("A3:F6");
      const headerCell = sheet.getCell("A3");
      headerCell.value = headerText;
      headerCell.font = { name: "Inter", size: 14, bold: true };
      headerCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      sheet.getRow(3).height = 20;
      sheet.getRow(4).height = 20;
    };

    const indentText = (text: string) =>
      " ".repeat(5) + text;

    const summarySheet = workbook.addWorksheet("Tax Summary");
    const headerText = `Tax Summary\n${companyName}\n${formatDate(
      fromDate
    )} - ${formatDate(toDate)}`;

    if (headerUrl) {
      const imageBuffer = await fetchImageAsBuffer(headerUrl);
      const imageId = workbook.addImage({
        buffer: imageBuffer as any,
        extension: "jpeg",
      });

      summarySheet.getRow(1).height = 50;
      summarySheet.getRow(2).height = 50;

      summarySheet.addImage(imageId, {
        tl: { col: 0, row: 0 } as any,
        br: { col: 3, row: 2 } as any,
        editAs: "oneCell",
      });
    }

    summarySheet.mergeCells("A3:C6");
    const headerCell = summarySheet.getCell("A3");
    headerCell.value = headerText;
    headerCell.font = { name: "Inter", size: 14, bold: true };
    headerCell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    summarySheet.getRow(3).height = 20;
    summarySheet.getRow(4).height = 20;
    summarySheet.views = [{ state: "frozen", ySplit: 6 }];

    const summaryHeader = addRow(
      summarySheet,
      ["Tax Name", "Taxable Amount", "Tax Amount"],
      true,
      [2, 3]
    );
    applyTableBorder(summaryHeader, 1, 3);


    for (const tax of taxInfoData) {
      const parentHasAmount =
        Number(tax.totalTaxableAmount) !== 0 ||
        Number(tax.totalTaxAmount) !== 0 ||
        zeroBalance;

      if (!parentHasAmount) continue;

      const parentRow = addRow(
        summarySheet,
        [tax.taxName, tax.totalTaxableAmount, tax.totalTaxAmount],
        true,
        [2, 3],
        [2, 3]
      );
      applyTableBorder(parentRow, 1, 3);

      for (const subRow of tax.taxSubRows) {
        if (
          Number(subRow.taxableAmount) !== 0 ||
          Number(subRow.taxAmount) !== 0 ||
          zeroBalance
        ) {
          const childRow = addRow(
            summarySheet,
            [
              `${indentText(subRow.percentName)}`,
              formatAmount(subRow.taxableAmount),
              formatAmount(subRow.taxAmount),
            ],
            false,
            [2, 3],
            [2, 3]
          );

          applyTableBorder(childRow, 1, 3);
        }
      }
    }


    const totalRow = addRow(
      summarySheet,
      ["Total", "", formatAmount(totalTax)],
      true,
      [3],
      [3]
    );
    applyTableBorder(totalRow, 1, 3);

    summarySheet.columns.forEach(col => (col.width = 22));

    for (const tax of taxInfoData) {
      for (const subRow of tax.taxSubRows) {
        const parentHasAmount =
          Number(tax.totalTaxableAmount) !== 0 ||
          Number(tax.totalTaxAmount) !== 0
          || tax.zeroBalance;

        if (!parentHasAmount) continue;

        const detailedResponse = await this.taxDetailedSummary(
          dataSource,
          userId,
          fromDate,
          toDate,
          tax.id,
          subRow.taxPercent
        );

        const { detailedTaxData, zeroBalance } = detailedResponse;

        const detailRows = zeroBalance
          ? detailedTaxData
          : detailedTaxData?.filter(
            r => Number(r.runningBalance) !== 0
          );

        if (!detailRows || !detailRows.length) continue;

        const sheetName = safeSheetName(
          `${tax.abbreviation}_${subRow.percentName}`
        );
        const mergedCellName = `${tax.taxName} ${subRow.percentName}`
        const detailSheet = workbook.addWorksheet(sheetName);
        await applySheetHeader(detailSheet, mergedCellName);
        detailSheet.views = [{ state: "frozen", ySplit: 6 }];

        const header = addRow(
          detailSheet,
          ["Date", "Type", "Description", "Debit", "Credit", "Balance"],
          true,
          [4, 5, 6]
        );
        applyTableBorder(header, 1, 6);

        for (const detail of detailRows) {

          const row = addRow(
            detailSheet,
            [
              formatDate(detail.date),
              capitalizeFirstLetter(detail.transactionTypeName),
              String(detail.referenceNo),
              formatAmount(detail.debit),
              formatAmount(detail.credit),
              formatAmount(detail.runningBalance),
            ],
            false,
            [4, 5, 6],
            [4, 5, 6]
          );
          applyTableBorder(row, 1, 6);
        }

        detailSheet.columns.forEach(col => (col.width = 22));
        detailSheet.getColumn(3).numFmt = '@';
      }
    }

    const fileBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const filename = `Tax_Summary_${companyName}_${fromDate.replace(/-/g, "_")}_${toDate.replace(/-/g, "_")}.xlsx`;

    return { fileBuffer, filename };
  }

  async generateTaxPdf(
    dataSource: DataSource,
    fromDate: string,
    toDate: string,
    userId: number,
    companyId: string,
    companyName: string,
    headerUrl: string
  ): Promise<{ fileBuffer: Buffer; filename: string }> {

    console.log(headerUrl)
    const companyCurrency = await this.transactService.getCompanyCurrency(dataSource.manager, companyId);
    const currency = companyCurrency.split(" ")[0];

    const companySettingCommaSeparation = await this.transactService.getCommaSeperation(dataSource.manager, companyId);
    const commaSeparation = companySettingCommaSeparation.commaSeparation ?? "US";
    const locale = commaSeparation === "IN" ? "en-IN" : "en-US";


    const data = await this.taxSummary(dataSource, userId, fromDate, toDate);


    const normalizeValue = (v: any) =>
      typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)) ? Number(v) : v;

    const formatAmount = (value: number | string | null | undefined) => {
      if (value === null || value === undefined || isNaN(Number(value))) return `${currency} 0.00`;
      const num = normalizeValue(value);
      const decimals = data.decimalPlace ? 2 : 0;

      if (commaSeparation === "IN") {
        const parts = num.toFixed(decimals).split(".");
        const lastThree = parts[0].slice(-3);
        const other = parts[0].slice(0, -3);
        const formatted = other.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + (other ? "," : "") + lastThree;
        return `${currency}${formatted}${parts[1] ? "." + parts[1] : ""}`;
      }

      return `${currency}${num.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    };

    const capitalizeFirstLetter = (value: string): string => {
      if (!value || typeof value !== "string") return "";
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    };

    type TaxPdfRow =
      | { type: "tax-name"; name: string; totalTaxableAmount: string; totalTaxAmount: string; indent: number; bold: true }
      | { type: "tax-percent"; name: string; taxableAmount: string; taxAmount: string; indent: number; details?: any[] };

    const rows: TaxPdfRow[] = [];


    for (const tax of data.taxInfoData) {
      const taxStartIndex = rows.length;


      rows.push({ type: "tax-name", name: tax.taxName, totalTaxableAmount: formatAmount(tax.totalTaxableAmount), totalTaxAmount: formatAmount(tax.totalTaxAmount), indent: 0, bold: true });

      let hasVisiblePercent = false;

      for (const sub of tax.taxSubRows) {
        const detailedResponse = await this.taxDetailedSummary(
          dataSource,
          userId,
          fromDate,
          toDate,
          tax.id,
          sub.taxPercent
        );

        const { detailedTaxData } = detailedResponse;

        const filteredDetails =
          Array.isArray(detailedTaxData)
            ? detailedTaxData.filter(d =>
              data.zeroBalance ? true : Number(d.runningBalance) !== 0
            )
            : [];

        const nestedRows = filteredDetails.map(d => ({
          date: formatDate(d.date),
          transactionType: capitalizeFirstLetter(d.transactionTypeName),
          reference: d.referenceNo ?? "",
          debit: formatAmount(d.debit),
          credit: formatAmount(d.credit),
          balance: formatAmount(d.runningBalance),
        }));

        const hasNonZeroAmounts =
          Number(sub.taxAmount) !== 0 || Number(sub.taxableAmount) !== 0;

        const shouldShow =
          hasNonZeroAmounts ||
          nestedRows.length > 0 ||
          data.zeroBalance;

        if (!shouldShow) continue;

        rows.push({
          type: "tax-percent",
          name: sub.percentName,
          taxableAmount: formatAmount(sub.taxableAmount),
          taxAmount: formatAmount(sub.taxAmount),
          indent: 1,
          details: nestedRows.length > 0 ? nestedRows : undefined,
        });

        hasVisiblePercent = true;
      }


      // Remove Tax Name if no visible child
      if (!hasVisiblePercent) {
        rows.splice(taxStartIndex);
      }
    }

    const htmlPath = getTemplatePath("tax-report.html");
    const html = await fs.readFile(htmlPath, "utf8");
    const template = hbs.compile(html);

    const compiledHtml = template({
      companyName,
      headerUrl,
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate),
      currency,
      rows,
      totalTax: formatAmount(data.totalTax),
    });

    const footerPath = getTemplatePath("footer.html")
    const footerHtmlContent = await fs.readFile(footerPath, "utf8");
    const footerTemplate = hbs.compile(footerHtmlContent);
    const footerHtml = footerTemplate({ timestamp: formatDateTime(new Date().toLocaleString()) });

    const footerTmp = await tmp.file({ postfix: ".html" });
    await fs.writeFile(footerTmp.path!, footerHtml, "utf8");


    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      wkhtmltopdf(
        compiledHtml,
        {
          pageSize: "A4",
          marginTop: "15mm",
          marginBottom: "20mm",
          marginLeft: "10mm",
          marginRight: "10mm",
          footerHtml: footerTmp.path,
          footerSpacing: 5,
          encoding: "UTF-8",
        },
        (err, stream) => {
          if (err) return reject(err);
          const chunks: Buffer[] = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
        }
      );
    });

    return {
      fileBuffer: pdfBuffer,
      filename: `Tax_Summary_${companyName}_${fromDate.replace(/-/g, "_")}_${toDate.replace(/-/g, "_")}.pdf`,
    };
  }

  async generateTrialBalanceExcel(
    dataSource: DataSource,
    toDate: string,
    userId: number,
    companyId: string,
    companyName: string,
    headerUrl: string
  ) {
    const data = await this.trialBalance(dataSource, userId, toDate);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Trial Balance");
    const hasVisibleAccounts = (accounts: any[]): boolean => {
      return accounts.some(acc => {
        const debit = Number(acc.accountTotal?.[0] ?? 0);
        const credit = Number(acc.accountTotal?.[1] ?? 0);

        if (shouldShowRow(debit, credit, data.zeroBalance)) {
          return true;
        }

        if (Array.isArray(acc.subAccounts)) {
          return hasVisibleAccounts(acc.subAccounts);
        }

        return false;
      });
    };

    const indentText = (level: number, text: string) =>
      " ".repeat(level * 4) + text;

    const formatAmount = (value: number | string) => {
      const num = Number(value);
      return data.decimalPlace ? num : Math.trunc(num);
    };

    const shouldShowRow = (
      debit: number,
      credit: number,
      zeroBalance: boolean
    ) => {
      if (zeroBalance) return true;
      return Number(debit) !== 0 || Number(credit) !== 0;
    };

    const normalizeValue = (value: any) => {
      if (typeof value === "string" && value.trim() !== "" && !isNaN(Number(value))) {
        return Number(value);
      }
      return value;
    };


    const addRow = (
      values: any[],
      bold = false,
      alignRightCols: number[] = [],
      amountCols: number[] = [],
      italic = false
    ) => {
      const row = sheet.addRow(values.map(normalizeValue));

      if (bold || italic) {
        row.font = {
          bold,
          italic,
        };
      }

      row.eachCell((cell, col) => {
        cell.alignment = alignRightCols.includes(col)
          ? { horizontal: "right", vertical: "middle" }
          : { horizontal: "left", vertical: "middle", wrapText: true };

        if (amountCols.includes(col) && typeof cell.value === "number") {
          cell.numFmt = amountNumFmt;
        }
      });

      return row;
    };

    const applyTableBorder = (row: ExcelJS.Row, fromCol: number, toCol: number) => {
      for (let col = fromCol; col <= toCol; col++) {
        row.getCell(col).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
    };

    const companyCurrency =
      await this.transactService.getCompanyCurrency(
        dataSource.manager,
        companyId
      );
    const currency = companyCurrency.split(" ")[0];

    const companySettingCommaSeparation =
      await this.transactService.getCommaSeperation(
        dataSource.manager,
        companyId
      );

    const commaSeparation =
      (companySettingCommaSeparation.commaSeparation ?? "US") as "US" | "IN";

    const amountNumFmt = getNumberFormat(
      commaSeparation,
      data.decimalPlace,
      currency
    );

    if (headerUrl) {
      const imageBuffer = await fetchImageAsBuffer(headerUrl);
      const imageId = workbook.addImage({
        buffer: imageBuffer as any,
        extension: "jpeg",
      });

      sheet.getRow(1).height = 50;
      sheet.getRow(2).height = 50;

      sheet.addImage(imageId, {
        tl: { col: 0, row: 0 } as any,
        br: { col: 3, row: 2 } as any,
        editAs: "oneCell",
      });
    }

    sheet.mergeCells("A3:C4");
    const headerCell = sheet.getCell("A3");
    sheet.getRow(3).height = 30;
    sheet.getRow(4).height = 30;
    headerCell.value = `Trial Balance\n${companyName}\nAs of : ${formatDate(toDate)}`;
    headerCell.font = { size: 14, bold: true };
    headerCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };


    const headerRow = addRow(
      ["Account", "Debit", "Credit"],
      true,
      [2, 3]
    );
    applyTableBorder(headerRow, 1, 3);
    sheet.views = [{ state: "frozen", ySplit: 5 }];

    const renderAccountTree = (node: any) => {
      const selfDebit = formatAmount(node.accountSelfTotal?.[0] ?? 0);
      const selfCredit = formatAmount(node.accountSelfTotal?.[1] ?? 0);

      const totalDebit = formatAmount(node.accountTotal?.[0] ?? 0);
      const totalCredit = formatAmount(node.accountTotal?.[1] ?? 0);

      const hasChildren =
        Array.isArray(node.subAccounts) && node.subAccounts.length > 0;

      const selfVisible =
        shouldShowRow(selfDebit, selfCredit, data.zeroBalance);


      if (selfVisible || hasChildren) {
        const row = addRow(
          [
            indentText(node.subLevel, node.accountName),
            selfDebit,
            selfCredit,
          ],
          false,
          [2, 3],
          [2, 3]
        );
        applyTableBorder(row, 1, 3);
      }


      if (hasChildren) {
        for (const child of node.subAccounts) {
          renderAccountTree(child);
        }
      }


      const showTotal =
        selfDebit !== totalDebit || selfCredit !== totalCredit;

      if (showTotal) {
        const totalRow = addRow(
          [
            indentText(node.subLevel, `Total for ${node.accountName}`),
            totalDebit,
            totalCredit,
          ],
          true,
          [2, 3],
          [2, 3],
          true
        );
        applyTableBorder(totalRow, 1, 3);
      }
    };


    const renderGroup = (group: any) => {
      const groupDebit = formatAmount(group.groupSum[0]);
      const groupCredit = formatAmount(group.groupSum[1]);

      const showGroup =
        data.zeroBalance ||
        shouldShowRow(groupDebit, groupCredit, data.zeroBalance) ||
        hasVisibleAccounts(group.accountsList);

      if (!showGroup) return;
      if (shouldShowRow(groupDebit, groupCredit, data.zeroBalance)) {
        const groupRow = addRow(
          [indentText(1, group.groupName), groupDebit, groupCredit],
          true,
          [2, 3],
          [2, 3]
        );
        applyTableBorder(groupRow, 1, 3);
      }

      for (const account of group.accountsList) {
        renderAccountTree(account);
      }
    };

    for (const section of ["Asset", "Liability", "Income", "Expense"]) {
      if (!data.resultData?.[section]) continue;
      const totals = data.totalData?.[section]
      const sectionRow = addRow(
        [section, totals[0], totals[1]],
        true,
        [2, 3],
        [2, 3]
      );
      applyTableBorder(sectionRow, 1, 3);

      for (const group of data.resultData[section]) {
        renderGroup(group);
      }
    }


    const finalRow = addRow(
      [
        "Total",
        formatAmount(data.finalTotal[0]),
        formatAmount(data.finalTotal[1]),
      ],
      true,
      [2, 3],
      [2, 3]
    );
    applyTableBorder(finalRow, 1, 3);

    sheet.columns.forEach(col => (col.width = 22));
    const firstCol = sheet.getColumn(1);

    let maxLength = 0;

    firstCol.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.value) {
        const cellText =
          typeof cell.value === "string"
            ? cell.value
            : cell.value.toString();

        maxLength = Math.max(maxLength, cellText.length);
      }
    });


    firstCol.width = maxLength + 4;

    const fileBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const filename = `Trial_Balance_${companyName}_${toDate.replace(/-/g, "_")}.xlsx`;

    return { fileBuffer, filename };
  }

  async generateTrialBalancePdf(
    dataSource: any,
    toDate: string,
    userId: number,
    companyId: string,
    companyName: string,
    headerUrl: string
  ): Promise<{ fileBuffer: Buffer; filename: string }> {
    try {

      const companyCurrency =
        await this.transactService.getCompanyCurrency(dataSource.manager, companyId);
      const currency = companyCurrency.split(" ")[0];

      const companySettingCommaSeparation =
        await this.transactService.getCommaSeperation(dataSource.manager, companyId);
      const commaSeparation = companySettingCommaSeparation.commaSeparation ?? "US";
      const locale = commaSeparation === "IN" ? "en-IN" : "en-US";

      const data = await this.trialBalance(dataSource, userId, toDate);

      const normalizeValue = (value: any) => {
        if (typeof value === "string" && value.trim() !== "" && !isNaN(Number(value))) {
          return Number(value);
        }
        return value;
      };

      const formatAmountWithCurrency = (
        value: number | string | null | undefined
      ): string => {
        if (value === null || value === undefined || isNaN(Number(value))) return `${currency} 0.00`;

        const num = normalizeValue(value);
        const decimals = data.decimalPlace ? 2 : 0;

        if (commaSeparation === "IN") {
          const parts = num.toFixed(decimals).split(".");
          let integerPart = parts[0];
          const lastThree = integerPart.slice(-3);
          const other = integerPart.slice(0, -3);
          const formattedInteger =
            other.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + (other ? "," : "") + lastThree;
          return `${currency}${formattedInteger}${parts[1] ? "." + parts[1] : ""} `;
        } else {
          return `${currency}${num.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })} `;
        }
      };

      const shouldShowRow = (debit: number, credit: number, zeroBalance: boolean) => {
        if (zeroBalance) return true;
        return Number(debit) !== 0 || Number(credit) !== 0;
      };

      type PdfRow = {
        name: string;
        debit: string;
        credit: string;
        indent: number;
        bold?: boolean;
        italics?: boolean;
      };

      const buildAccountRows = (node: any, zeroBalance: boolean, rows: PdfRow[]): boolean => {
        const selfDebit = Number(node.accountSelfTotal?.[0] ?? 0);
        const selfCredit = Number(node.accountSelfTotal?.[1] ?? 0);

        const totalDebit = Number(node.accountTotal?.[0] ?? 0);
        const totalCredit = Number(node.accountTotal?.[1] ?? 0);

        const hasChildren = Array.isArray(node.subAccounts) && node.subAccounts.length > 0;
        const selfVisible = shouldShowRow(selfDebit, selfCredit, zeroBalance);
        const startIndex = rows.length;
        let hasVisibleChild = false;

        if (selfVisible || hasChildren) {
          rows.push({
            name: node.accountName,
            debit: formatAmountWithCurrency(selfDebit),
            credit: formatAmountWithCurrency(selfCredit),
            indent: node.subLevel ?? 1,
          });
        }

        if (hasChildren) {
          for (const child of node.subAccounts) {
            const childVisible = buildAccountRows(child, zeroBalance, rows);
            if (childVisible) hasVisibleChild = true;
          }
        }

        const showTotal = selfDebit !== totalDebit || selfCredit !== totalCredit;

        if (showTotal) {
          rows.push({
            name: `Total for ${node.accountName}`,
            debit: formatAmountWithCurrency(totalDebit),
            credit: formatAmountWithCurrency(totalCredit),
            indent: node.subLevel ?? 1,
            bold: true,
            italics: true,
          });
        }

        if (!selfVisible && !hasVisibleChild && !showTotal) {
          rows.splice(startIndex);
          return false;
        }

        return true;
      };

      const sections: any[] = [];

      for (const sectionName of ["Asset", "Liability", "Income", "Expense"]) {
        const groups = data.resultData?.[sectionName];
        if (!groups) continue;

        const sectionGroups: any[] = [];
        const sectionTotal = data.totalData?.[sectionName] ?? [0, 0];

        for (const group of groups) {
          const rows: PdfRow[] = [];
          for (const account of group.accountsList) {
            buildAccountRows(account, data.zeroBalance, rows);
          }

          const groupDebit = Number(group.groupSum?.[0] ?? 0);
          const groupCredit = Number(group.groupSum?.[1] ?? 0);

          if (rows.length === 0 && !shouldShowRow(groupDebit, groupCredit, data.zeroBalance)) {
            continue;
          }

          sectionGroups.push({
            groupName: group.groupName,
            rows,
            totalDebit: formatAmountWithCurrency(groupDebit),
            totalCredit: formatAmountWithCurrency(groupCredit),
            showTotal: shouldShowRow(groupDebit, groupCredit, data.zeroBalance),
          });
        }

        if (sectionGroups.length > 0) {
          sections.push({
            sectionName,
            totalDebit: formatAmountWithCurrency(sectionTotal[0]),
            totalCredit: formatAmountWithCurrency(sectionTotal[1]),
            groups: sectionGroups,
          });
        }
      }

      const htmlPath = getTemplatePath("trial-balance.html");
      const html = await fs.readFile(htmlPath, "utf8");
      const template = hbs.compile(html);

      const compiledHtml = template({
        companyName,
        headerUrl,
        toDate: formatDate(toDate),
        currency,
        sections,
        grandDebit: formatAmountWithCurrency(data.finalTotal?.[0] ?? 0),
        grandCredit: formatAmountWithCurrency(data.finalTotal?.[1] ?? 0),
      });

      const timestamp = formatDateTime(new Date().toISOString());

      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      await page.setContent(compiledHtml, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', bottom: '20mm', left: '10mm', right: '10mm' },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `<div style="width:100%; border-top:1px solid #333; font-size:10px; padding-top:4px; font-family:Arial, sans-serif; display:flex; justify-content:flex-end; margin:0; box-sizing:border-box;">
    <!-- Right timestamp -->
    <div style="margin-left:auto; text-align:right; flex:none; margin-right:10mm">
        ${timestamp}
    </div>

    <!-- Center page numbers -->
    <div style="position:absolute; left:0; right:0; text-align:center; font-size:10px;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
</div>
`  ,
      });

      await browser.close();

      return {
        fileBuffer: Buffer.from(pdfBuffer),
        filename: `Trial_Balance_${companyName}_${toDate.replace(/-/g, "_")}.pdf`,
      };

    } catch (error) {
      throw error;
    }
  }

  async calcInvoiceSummary(dataSource: DataSource, inputData: any) {
    const [dateFrom, dateTo] = inputData.dateList;
    const transactionRepo = dataSource.getRepository(Transaction);
    const invoiceRepo = dataSource.getRepository(Invoice);

    const transactions = await transactionRepo.find({
      where: {
        transactionTypeName: 'invoice',
        date: Between(dateFrom, dateTo),
      },
      order: { date: 'ASC', createdAt: 'ASC' },
      select: ['transactionTypeId'],
    });
    const transactionTypeIds = [
      ...new Set(transactions.map(t => t.transactionTypeId)),
    ];

    const invoiceList: any[] = [];
    let totalInvoiceAmountWithTds = 0;
    let totalInvoiceAmount = 0;

    for (const transactionTypeId of transactionTypeIds) {
      const invoiceAmountRow =
        await transactionRepo.findOne({
          where: {
            transactionTypeName: 'invoice',
            transactionTypeId: transactionTypeId,
            paymentId: IsNull(),
            creditAmount: "0",
            account: {
              accountName: 'Accounts Receivable',
              accountType: AccountType.ASSET,
            },
          },
          select: ['id', 'debitAmount'],
          relations: ['account'],
        });

      let invoiceAmount = Number(invoiceAmountRow?.debitAmount) || 0;
      const tdsRow = await transactionRepo.findOne({
        where: {
          transactionTypeName: 'invoice',
          transactionTypeId: transactionTypeId,
          paymentId: IsNull(),
          tax: { taxName: 'TDS' },
        },
        select: ['id', 'debitAmount'],
        relations: ['tax'],
      });

      const tdsAmount = Number(tdsRow?.debitAmount) || 0;
      let invoiceAmountWithTds = invoiceAmount + tdsAmount
      const invoiceData = await invoiceRepo.findOne({
        where: {
          transactionTypeId: transactionTypeId,
        },
        relations: ['contact'],
        select: [
          'id',
          'contact',
          'invoiceDate',
          'invoiceNo'
        ],
      });

      if (invoiceData) {
        totalInvoiceAmountWithTds += invoiceAmountWithTds;
        totalInvoiceAmount += invoiceAmount;

        invoiceList.push({
          invoiceDate: invoiceData.invoiceDate,
          invoiceNo: invoiceData.invoiceNo,
          contactName: invoiceData.contact?.name,
          contactId: invoiceData.contact?.id,
          invoiceAmountWithTds: invoiceAmountWithTds,
          invoiceAmount: invoiceAmount,
        });
      }
    }
    return {
      dateFrom,
      dateTo,
      invoiceList,
      totalInvoiceAmountWithTds,
      totalInvoiceAmount,
    };
  }

  // Helper to sum debit and credit
  private async sumTransaction(dataSource: DataSource, contactId: number, dateFrom: string, dateTo: string, types: string[] = []) {
    const transactionRepo = dataSource.getRepository(Transaction);
    const qb = transactionRepo.createQueryBuilder('t')
      .select('SUM(t.debitAmount)', 'debit')
      .addSelect('SUM(t.creditAmount)', 'credit')
      .where('t.contact_id = :contactId', { contactId })
      .andWhere('t.date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

    if (types.length > 0) qb.andWhere('t.transactionTypeName IN (:...types)', { types });

    const result = await qb.getRawOne();
    return {
      debit: Number(result.debit) || 0,
      credit: Number(result.credit) || 0,
    };
  }

  // Total contact balance summary
  async calcContactBalanceSummary(dataSource: DataSource, inputData: any) {
    const transactionRepo = dataSource.getRepository(Transaction);
    const contactRepo = dataSource.getRepository(Contact);
    const [dateFrom, dateTo] = inputData.dateList;

    const contacts = await contactRepo.find({ order: { name: 'ASC' }, select: ["id", "name"] });

    const contactData: any = [];
    let totalContactBalance = 0;

    for (const contact of contacts) {
      const { debit, credit } = await this.sumTransaction(dataSource, contact.id, dateFrom, dateTo);
      const balanceAmount = +(debit - credit).toFixed(2);
      totalContactBalance += balanceAmount;
      const transactionCount = await transactionRepo.count({
        where: [
          { contact: { id: contact.id }, date: Between(dateFrom, dateTo) },
        ],
      });
      if (transactionCount === 0) continue;

      contactData.push({ ...contact, balanceAmount });
    }

    return {
      contactData,
      dateFrom,
      dateTo,
      totalContactBalance,
    };
  }

  // Separate contact balance summary
  async calcDetailedContactBalanceSummary(dataSource: DataSource, inputData: any) {
    const transactionRepo = dataSource.getRepository(Transaction);
    const contactRepo = dataSource.getRepository(Contact);
    const [dateFrom, dateTo] = inputData.dateList;

    const contacts = await contactRepo.find({ order: { name: 'ASC' }, select: ["id", "name"] });

    const contactJournalData: any = [];
    const contactInvData: any = [];
    const contactBillData: any = [];

    let totalJournalDebit = 0,
      totalJournalCredit = 0,
      totalInvoicedAmount = 0,
      totalAmountReceived = 0,
      totalBilledAmount = 0,
      totalAmountPaid = 0;

    for (const contact of contacts) {

      const journalCount = await transactionRepo.count({
        where: [
          { contact: { id: contact.id }, date: Between(dateFrom, dateTo), transactionTypeName: In(['journal', 'transfer', 'opening_balance']) },
        ],
      });

      // Invoice transactions
      const invoiceCount = await transactionRepo.count({
        where: [
          { contact: { id: contact.id }, date: Between(dateFrom, dateTo), transactionTypeName: In(['invoice', 'invoice_payment']) },
        ],
      });

      // Bill transactions
      const billCount = await transactionRepo.count({
        where: [
          { contact: { id: contact.id }, date: Between(dateFrom, dateTo), transactionTypeName: In(['bill', 'bill_payment']) },
        ],
      });
      const total = await this.sumTransaction(dataSource, contact.id, dateFrom, dateTo, ['journal', 'transfer', 'income', 'expense', 'opening_balance']);
      const invoiced = await this.sumTransaction(dataSource, contact.id, dateFrom, dateTo, ['invoice']);
      const invoicePayment = await this.sumTransaction(dataSource, contact.id, dateFrom, dateTo, ['invoice_payment']);
      const billed = await this.sumTransaction(dataSource, contact.id, dateFrom, dateTo, ['bill']);
      const billPayment = await this.sumTransaction(dataSource, contact.id, dateFrom, dateTo, ['bill_payment']);

      // Compute totals
      const totalDebit = total.debit;
      const totalCredit = total.credit;

      const invoicedAmount = invoiced.debit - invoiced.credit;
      const amountReceived = invoicePayment.credit - invoicePayment.debit;

      let billedAmount = billed.credit - billed.debit
      let amountPaid = billPayment.debit - billPayment.credit

      totalJournalDebit += totalDebit;
      totalJournalCredit += totalCredit;
      totalInvoicedAmount += invoicedAmount;
      totalAmountReceived += amountReceived;
      totalBilledAmount += billedAmount;
      totalAmountPaid += amountPaid;

      if (journalCount > 0) contactJournalData.push({ ...contact, totalDebit, totalCredit });
      if (invoiceCount > 0) contactInvData.push({ ...contact, invoicedAmount, amountReceived });
      if (billCount > 0) contactBillData.push({ ...contact, billedAmount, amountPaid });
    }

    return {
      contactJournalData,
      contactInvData,
      contactBillData,
      dateFrom,
      dateTo,
      totalJournalDebit,
      totalJournalCredit,
      totalInvoicedAmount,
      totalAmountReceived,
      totalBilledAmount,
      totalAmountPaid,
    };
  }
}
