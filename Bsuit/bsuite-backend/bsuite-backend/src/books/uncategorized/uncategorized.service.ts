import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { CreateUncategorizedDto } from "./dto/create-uncategorized.dto";
import * as Papa from "papaparse";
import * as fs from "fs";
import { CsvMappingDto } from "./dto/csv-mapping.dto";
import { Between, DataSource, EntityManager, In, Repository } from "typeorm";
import { UncategorizedData } from "./entities/tenant.uncategorized.entity";
import { AccountData } from "src/books/account/entities/tenant.account.entity";
import dayjs from "dayjs";
import { CreateTransferDto } from "./dto/create-transfer-dto";
import { TransactService } from "../transact/transact.service";
import { Transaction } from "src/books/transact/entities/tenant.transaction.entity";
import { FxService } from "src/fx/fx.service";
import { UncategorizedMatchDto } from "./dto/uncategorized-match.dto";
import { Invoice } from "../invoice/entities/tenant.invoice.entity";
import { Bill } from "../bill/entities/tenant.bill.entity";
import moment from "moment";
import { InvoiceService } from "../invoice/invoice.service";
import { BillService } from "../bill/bill.service";
import { InvoicePaymentDto } from "../invoice/dto/invoice-payment.dto";
import { BillPaymentDto } from "../bill/dto/bill-payment.dto";
import { SaveUncategorizedMatchDto } from "./dto/split-payment.dto";
import { SaveUncategorizedMultiMatchDto } from "./dto/multi-match.dto";
import { AccountType } from "src/common/enum/account-type.enum";
import { getTemplatePath } from "src/shared/utils";

@Injectable()
export class UncategorizedService {
  constructor(
    private readonly transactService: TransactService,
    private readonly invoiceService: InvoiceService,
    private readonly billService: BillService,
    private readonly fxService: FxService,
  ) {}

  private isValidDate(value: string, dateFormat: string): boolean {
    if (!value || value.length < 6) return false;
    const parsedDate = dayjs(value, dateFormat, true);
    return parsedDate.isValid();
  }

  private isNumeric(value: string): boolean {
    if (value === undefined || value === null || value.trim() === '')
      return true;
    const clean = value.replace(/,/g, '').trim();
    return !isNaN(parseFloat(clean)) && isFinite(parseFloat(clean));
  }

  private cleanNum(val: any): number {
    if (val === null || val === undefined || val === '') return 0;
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  }

  private async isCategorized(uncatIdList: number, manager: EntityManager) {
    const count = await manager.getRepository(UncategorizedData).count({
      where: {
        id: uncatIdList,
        isCategorized: true,
      },
    });
    return count > 0;
  }

  private async saveTransaction(
    manager: EntityManager,
    companyId: string,
    uncategorizedData: UncategorizedData,
    toAccountId: number,
    toAccountType: string,
    contactMappingData?: Record<string, string>,
    contactId?: number,
  ) {
    let selectedAccountId: number | null = null;
    let selectedContactId: number | null = null;
    let selectedTaxId: number | null = null;

    // Determine to acc type
    if (toAccountType === 'tax') {
      selectedTaxId = toAccountId;
    } else if (toAccountType === 'contact') {
      selectedContactId = toAccountId;
    } else {
      selectedAccountId = toAccountId;
    }

    const transactionTypeId =
      await this.transactService.generateTransactionTypeId();
    const transactionTypeName = 'transfer';

    const debit = uncategorizedData.debit;
    const credit = uncategorizedData.credit;
    let accountBalance = debit === 0 ? credit : debit;
    const uncategorizedDate = uncategorizedData.date;

    const companyCurrency = await this.transactService.getCompanyCurrency(
      manager,
      companyId,
    );

    let finalDebit = 0;
    let finalCredit = 0;
    let fxRate = 1;
    let originalFxRate = 1;
    let fxAmount = accountBalance;
    let fxCurrency = uncategorizedData.account.accountCurrency;
    let contactMapping: Record<string, number> | undefined;

    // FX calc func
    const calculateFx = async (
      fromCurrency: string,
      toCurrency: string,
      companyCurrency: string,
      amount: number,
      date: Date,
    ) => {
      if (fromCurrency === toCurrency && fromCurrency === companyCurrency) {
        return {
          finalAmount: amount,
          fxRate: 1,
          originalFxRate: 1,
          fxCurrency: companyCurrency,
        };
      }

      const fx = await this.fxService.conversion({
        from: fromCurrency,
        to: toCurrency,
        amount,
        date: date.toDateString(),
      });

      // Foreign -> Company
      if (fromCurrency !== companyCurrency && toCurrency === companyCurrency) {
        return {
          finalAmount: fx.convertedAmount,
          fxRate: fx.exchangeRate,
          originalFxRate: fx.exchangeRate,
          fxCurrency: fromCurrency,
        };
      }

      // Foreign -> Foreign (same)
      if (fromCurrency === toCurrency && fromCurrency !== companyCurrency) {
        return {
          finalAmount: fx.convertedAmount,
          fxRate: fx.exchangeRate,
          originalFxRate: fx.exchangeRate,
          fxCurrency: fromCurrency,
        };
      }

      // Company -> Foreign
      return {
        finalAmount: fx.convertedAmount,
        fxRate: amount / fx.convertedAmount,
        originalFxRate: amount / fx.convertedAmount,
        fxCurrency: toCurrency,
      };
    };

    // row 1 FX calc
    const fx1 = await calculateFx(
      uncategorizedData.account.accountCurrency!,
      companyCurrency,
      companyCurrency,
      accountBalance,
      uncategorizedDate,
    );

    fxRate = fx1.fxRate;
    originalFxRate = fx1.originalFxRate;
    fxAmount = fx1.finalAmount;
    fxCurrency = fx1.fxCurrency;

    if (credit === 0) {
      finalDebit = 0;
      finalCredit = fx1.finalAmount;
      accountBalance = fx1.finalAmount;
    } else {
      finalDebit = fx1.finalAmount;
      finalCredit = 0;
      accountBalance = fx1.finalAmount;
    }

    // contact mapping for row1
    if (contactId) {
      contactMapping = { [contactId]: finalDebit || finalCredit };
    } else {
      contactMapping = undefined;
    }

    // save row1
    const txn1 = manager.create(Transaction, {
      date: uncategorizedDate,
      description: uncategorizedData.description,
      debitAmount: Number(finalDebit).toFixed(2),
      creditAmount: Number(finalCredit).toFixed(2),
      account: uncategorizedData.account,
      journalBalance: Number(accountBalance).toFixed(2),
      transactionTypeName,
      transactionTypeId,
      accountExchangeRate: fxRate,
      accountOriginalExchangeRate: originalFxRate,
      accountCurrencyAmount: fxAmount.toString(),
      accountCurrency: fxCurrency,
      hasContactMapping: !!contactMapping,
      contactMapping,
      uncategorized: uncategorizedData,
    });
    await manager.save(txn1);

    await this.transactService.updateBalance(
      manager,
      companyId,
      uncategorizedData.account.accountType,
      uncategorizedData.account.id,
    );
    if (contactId) {
      await this.transactService.updateBalance(
        manager,
        companyId,
        "Contact",
        contactId,
      );
    }

    // row 2 FX calc
    let finalDebit2 = 0;
    let finalCredit2 = 0;
    let fx2Rate = 1;
    let fx2OriginalRate = 1;
    let fx2Amount = accountBalance;
    let fx2Currency = companyCurrency;

    if (selectedAccountId || selectedContactId || selectedTaxId) {
      let targetCurrency = companyCurrency;

      if (selectedAccountId) {
        const selectedAccount = await this.transactService.accountExists(
          manager,
          selectedAccountId,
        );
        targetCurrency = selectedAccount.accountCurrency!;
      }

      const fx2 = await calculateFx(
        uncategorizedData.account.accountCurrency!,
        targetCurrency,
        companyCurrency,
        accountBalance,
        uncategorizedDate,
      );

      fx2Rate = fx2.fxRate;
      fx2OriginalRate = fx2.originalFxRate;
      fx2Amount = fx2.finalAmount;
      fx2Currency = fx2.fxCurrency;

      if (credit === 0) {
        finalDebit2 = 0;
        finalCredit2 = fx2.finalAmount;
      } else {
        finalDebit2 = fx2.finalAmount;
        finalCredit2 = 0;
      }
    } else {
      finalDebit2 = finalCredit;
      finalCredit2 = finalDebit;
    }

    // save row2
    const txn2Relations: Partial<Transaction> = {};

    if (selectedAccountId) {
      txn2Relations.account = await this.transactService.accountExists(
        manager,
        selectedAccountId,
      );
    } else if (selectedContactId) {
      txn2Relations.contact = await this.transactService.contactExists(
        manager,
        selectedContactId,
      );
    } else if (selectedTaxId) {
      txn2Relations.tax = await this.transactService.taxExists(
        manager,
        selectedTaxId,
      );
    }

    let txn2ContactMapping: Record<string, number> | undefined = undefined;
    if (!contactId && contactMappingData) {
      txn2ContactMapping = {};
      for (const key in contactMappingData) {
        if (key && contactMappingData[key]) {
          txn2ContactMapping[Number(key)] = Number(contactMappingData[key]);
        }
      }
    }

    const txn2 = manager.create(Transaction, {
      date: uncategorizedDate,
      description: uncategorizedData.description,
      debitAmount: Number(finalCredit2).toFixed(2),
      creditAmount: Number(finalDebit2).toFixed(2),
      journalBalance: Number(accountBalance).toFixed(2),
      transactionTypeName,
      transactionTypeId,
      accountExchangeRate: fx2Rate,
      accountOriginalExchangeRate: fx2OriginalRate,
      accountCurrencyAmount: fx2Amount.toString(),
      accountCurrency: fx2Currency,
      hasContactMapping: !!txn2ContactMapping,
      contactMapping: txn2ContactMapping,
      ...txn2Relations,
    });
    await manager.save(txn2);

    // update balance for row2
    const balanceType = selectedContactId
      ? 'Contact'
      : selectedTaxId
        ? 'Tax'
        : selectedAccountId
          ? (
              await this.transactService.accountExists(
                manager,
                selectedAccountId,
              )
            ).accountType
          : uncategorizedData.account.accountType;

    await this.transactService.updateBalance(
      manager,
      companyId,
      balanceType,
      toAccountId,
    );

    // mark uncategorized as categorized
    uncategorizedData.isCategorized = true;
    await manager.save(uncategorizedData);

    return transactionTypeId;
  }

  async extractColumns(csvData: string, userDateFormat: string) {
    const parsed = Papa.parse(csvData, {
      skipEmptyLines: true,
      transform: (val) => val.trim(),
    });

    const allRows = parsed.data as string[][];
    if (allRows.length === 0) throw new Error('CSV is empty');

    let headerIndex = -1;

    for (let i = 0; i < allRows.length - 1; i++) {
      const nextRow = allRows[i + 1];

      const hasDate = nextRow.some(
        (cell) => cell && this.isValidDate(cell, userDateFormat),
      );
      const potentialNumbers = nextRow.filter((cell) => {
        const clean = cell.replace(/,/g, '').trim();
        return (
          clean !== '' &&
          !isNaN(parseFloat(clean)) &&
          isFinite(parseFloat(clean))
        );
      });

      if (hasDate && potentialNumbers.length >= 2) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1)
      throw new BadRequestException(
        "Could not identify the statement table structure.",
      );

    const headers = allRows[headerIndex];

    const dataRows = allRows.slice(headerIndex + 1).filter((row) => {
      return (
        row.length >= headers.length &&
        row.some((cell) => this.isValidDate(cell, userDateFormat))
      );
    });

    let dateColumns: string[] = [];
    let numericColumns: string[] = [];
    let textColumns: string[] = [];

    headers.forEach((header, colIdx) => {
      const columnCells = dataRows.map((row) => row[colIdx]);
      if (columnCells.length === 0) return;

      const isDateCol = columnCells.every((cell) =>
        this.isValidDate(cell, userDateFormat),
      );
      if (isDateCol) {
        dateColumns.push(header);
        return;
      }

      const isNumCol = columnCells.every((cell) => this.isNumeric(cell));
      if (isNumCol) {
        numericColumns.push(header);
        return;
      }

      textColumns.push(header);
    });

    if (numericColumns.length < 2) {
      throw new BadRequestException('Could not identify numeric columns.');
    }

    return {
      dateColumns,
      numericColumns,
      textColumns,
    };
  }

  getCsvStream(): StreamableFile {
    const filePath = `${getTemplatePath("sample-bank-statement.csv")}`;

    if (!fs.existsSync(filePath)) {
      throw new Error('CSV file not found.');
    }

    const fileStream = fs.createReadStream(filePath);
    return new StreamableFile(fileStream);
  }

  async process(
    csvData: string,
    mapping: CsvMappingDto,
    userDateFormat: string,
  ) {
    const parsed = Papa.parse(csvData, {
      skipEmptyLines: true,
      transform: (val) => val.trim(),
    });

    const allRows = parsed.data as string[][];
    if (allRows.length === 0) throw new BadRequestException('CSV is empty');

    const headerIndex = allRows.findIndex((row) =>
      Object.values(mapping).every((headerName) =>
        row.includes(headerName as string),
      ),
    );

    if (headerIndex === -1) {
      throw new BadRequestException(
        "Could not find header row matching the provided mapping",
      );
    }

    const headers = allRows[headerIndex];
    const dataRows = allRows.slice(headerIndex + 1);

    const colMap = {
      date: headers.indexOf(mapping.dateKey),
      desc: headers.indexOf(mapping.descriptionKey),
      debit: headers.indexOf(mapping.debitKey),
      credit: headers.indexOf(mapping.creditKey),
    };

    const entries = dataRows
      .map((row) => {
        const dateValue = row[colMap.date];

        if (!this.isValidDate(dateValue, userDateFormat)) return null;

        const debit = this.cleanNum(row[colMap.debit]);
        const credit = this.cleanNum(row[colMap.credit]);

        const transactionDate = dayjs(dateValue, userDateFormat, true);

        return {
          transactionDate: transactionDate.toISOString(),
          description: row[colMap.desc],
          debit,
          credit,
        };
      })
      .filter((entry) => entry !== null);

    return entries;
  }

  async bulkCreate(
    accountId: number,
    transactions: CreateUncategorizedDto[],
    dataSource: DataSource,
  ) {
    if (!transactions?.length) return { count: 0 };

    return await dataSource.transaction(async (manager) => {
      const account = await manager.findOne(AccountData, {
        where: { id: accountId },
      });
      if (!account)
        throw new NotFoundException(`Account with id ${accountId} not found`);

      const entities = transactions.map((trx) => ({
        date: new Date(trx.transactionDate),
        description: trx.description,
        debit: trx.debit,
        credit: trx.credit,
        account: account,
      }));

      try {
        const result = await manager.insert(UncategorizedData, entities);

        return {
          success: true,
          count: entities.length,
          identifiers: result.identifiers,
        };
      } catch (error) {
        throw new BadRequestException(
          `Failed to save transactions: ${error.message}`,
        );
      }
    });
  }

  async getUncategorizedRows(
    dataSource: DataSource,
    page: number = 1,
    pageSize: number = 20,
    accountIds?: number[],
  ) {
    const uncatRepo = dataSource.getRepository(UncategorizedData);
    const skip = (page - 1) * pageSize;

    const where: any = {
      isCategorized: false,
    };
    if (accountIds && accountIds.length > 0) {
      where.account = { id: In(accountIds) };
    }

    const [data, total] = await uncatRepo.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { id: 'DESC' },
      relations: ['account'],
    });

    const hasMore = skip + data.length < total;

    return { data, hasMore };
  }

  // save single transfer
  async saveTransfer(
    transferDto: CreateTransferDto,
    dataSource: DataSource,
    companyId: string,
  ) {
    return dataSource.transaction(async (manager) => {
      const {
        uncatId,
        toAccountId,
        contactId,
        toAccountType,
        hasTdsMapping,
        contactMappingData,
      } = transferDto;

      const uncategorizedRepo = manager.getRepository(UncategorizedData);
      const result: any = {};

      try {
        const uncategorizedData = await uncategorizedRepo.findOne({
          where: { id: uncatId },
          relations: ['account'],
        });
        if (!uncategorizedData)
          throw new Error('Uncategorized transaction not found');

        // Check if already categorized
        const isCategorized = await this.isCategorized(uncatId, manager);
        if (isCategorized) return { data: { isCategorized: true } };

        // if tds mapping
        if (hasTdsMapping && contactMappingData) {
          const transactionTypeId = await this.saveTransaction(
            manager,
            companyId,
            uncategorizedData,
            toAccountId,
            toAccountType,
            contactMappingData,
          );

          result.status = 'success';
          result.formIsValid = 'true';
          result.uncategorized_count = await uncategorizedRepo.count({
            where: { isCategorized: false },
          });
          result.transaction_type_name = 'transfer';
          result.transaction_type_id = transactionTypeId;
          result.payment_id = 'null';
          return {
            data: {
              ...result,
              change_of_data: {
                id: transactionTypeId,
                module: 'Uncategorized',
                feature: 'Transfer',
                status: 'Create',
              },
            },
          };
        }

        // Regular transaction save
        const transactionTypeId = await this.saveTransaction(
          manager,
          companyId,
          uncategorizedData,
          toAccountId,
          toAccountType,
          contactMappingData,
          contactId,
        );

        result.status = 'success';
        result.formIsValid = 'true';
        result.uncategorizedCount = await uncategorizedRepo.count({
          where: { isCategorized: false },
        });
        result.transactionTypeName = 'transfer';
        result.transactionTypeId = transactionTypeId;
        result.paymentId = 'null';

        return {
          data: {
            ...result,
            change_of_data: {
              id: transactionTypeId,
              module: 'Uncategorized',
              feature: 'Transfer',
              status: 'Create',
            },
          },
        };
      } catch (err) {
        console.error(err);
        throw err;
      }
    });
  }

  //  delete single/ multiple uncategorized rows
  async removeUncategorized(dataSource: DataSource, uncatIdList: number[]) {
    await dataSource.transaction(async (manager) => {
      const uncatRepo = manager.getRepository(UncategorizedData);

      const transactions = await uncatRepo.find({
        where: { id: In(uncatIdList) },
      });

      if (transactions.length === 0) {
        throw new NotFoundException(
          `No transactions found with id: ${uncatIdList}`,
        );
      }

      await uncatRepo.remove(transactions);
      return {
        change_of_data: {
          module: 'Uncategorized',
          feature: 'Uncategorized',
          status: 'Delete',
        },
      };
    });
  }

  async uncategorizedCount(dataSource: DataSource, accountIds?: number[]) {
    const uncatRepo = dataSource.getRepository(UncategorizedData);
    const where: any = {
      isCategorized: false,
    };
    if (accountIds && accountIds.length > 0) {
      where.account = { id: In(accountIds) };
    }
    const count = await uncatRepo.count({
      where,
    });

    return count;
  }

  //   SINGLE MATCH & SPLIT
  async uncategorizedMatch(
    uncategorizedMatchDto: UncategorizedMatchDto,
    dataSource: DataSource,
    companyId: string,
  ) {
    const startTime = Date.now();
    const { amount, amountType, uncategorizedId } = uncategorizedMatchDto;

    // FETCH UNCAT DATA
    const uncategorizedData = await dataSource
      .getRepository(UncategorizedData)
      .findOne({
        where: { id: uncategorizedId },
        relations: ['account'],
      });

    if (!uncategorizedData)
      throw new BadRequestException('No uncategorized data found');

    // CHECK IF ALREADY CATEGORIZED
    const categorized = await this.isCategorized(
      uncategorizedId,
      dataSource.manager,
    );

    if (categorized)
      throw new BadRequestException('This transaction is already categorized');

    const accountCurrency = uncategorizedData.account.accountCurrency;
    const uncatDate = moment(uncategorizedData.date);

    const reportingCurrency = await this.transactService.getCompanyCurrency(
      dataSource.manager,
      companyId,
    );

    let resultData = {
      otherMatches: [],
      relevantMatches: [],
      accountCurrency,
      uncategorizedData,
    };

    const sixMonthsBefore = uncatDate
      .clone()
      .subtract(6, 'months')
      .format('YYYY-MM-DD');

    const sixMonthsAfter = uncatDate
      .clone()
      .add(6, "months")
      .format("YYYY-MM-DD");

    const toDateString = (d: string | Date) =>
      d instanceof Date ? d.toISOString().slice(0, 10) : d;

    if (amountType === 'credit') {
      // FETCH INVOICES (±6 months)
      const invoicesData = await this.invoiceService.getAllInvoiceData(
        dataSource,
        sixMonthsBefore,
        sixMonthsAfter,
      );
      if (!invoicesData.length) return { data: resultData };
      // FETCH PAYMENTS FOR ALL INVOICES
      const transactionTypeIds = invoicesData.map(
        (invoice) => invoice.transactionTypeId,
      );
      const allPayments = await this.invoiceService.fetchPaymentHistory(
        dataSource,
        transactionTypeIds,
      );

      // GROUP PAYMENTS BY TRANSACTION TYPE
      const paymentsByInvoice = allPayments.reduce(
        (map, p) => {
          (map[p.transactionTypeId] ||= []).push(p);
          return map;
        },
        {} as Record<string, Transaction[]>,
      );

      // COMMON HELPERS
      const hasBalanceDue = (invoice) =>
        Math.round(invoice.balanceDue * 100) / 100 > 0;

      // ATTACH PAYMENTS & SPLIT MATCHES
      const otherMatches: typeof invoicesData = [];
      const relevantMatches: typeof invoicesData = [];

      for (const invoice of invoicesData) {
        invoice.payments = paymentsByInvoice[invoice.transactionTypeId] ?? [];

        if (!hasBalanceDue(invoice)) continue;

        // Other matches: all invoices with balanceDue > 0
        otherMatches.push(invoice);

        // Relevant matches: invoices before uncategorized date

        if (
          toDateString(invoice.invoiceDate) <=
          toDateString(uncategorizedData.date)
        ) {
          relevantMatches.push(invoice);
        }
      }

      // 6. SORT OTHER MATCHES (by invoice date)
      otherMatches.sort((invoiceA, invoiceB) =>
        toDateString(invoiceA.invoiceDate).localeCompare(
          toDateString(invoiceB.invoiceDate),
        ),
      );

      // 7. CALCULATE AMOUNT IN INVOICE CURRENCY (parallel)
      await Promise.all(
        relevantMatches.map(async (invoice) => {
          invoice.amountInInvoiceCurr = await this.getAmountInTransact(
            invoice.invoiceCurrency,
            accountCurrency,
            Number(amount),
            invoice.invoiceDate.toString(),
          );
        }),
      );

      // 8. SORT RELEVANT MATCHES
      relevantMatches.sort((invoiceA, invoiceB) => {
        // prioritize account currency
        if (
          invoiceA.invoiceCurrency === accountCurrency &&
          invoiceB.invoiceCurrency !== accountCurrency
        )
          return -1;
        if (
          invoiceA.invoiceCurrency !== accountCurrency &&
          invoiceB.invoiceCurrency === accountCurrency
        )
          return 1;

        // Closest to round-off total
        const roundOffDiff =
          Math.abs(invoiceA.amountInInvoiceCurr - invoiceA.roundoffTotal) -
          Math.abs(invoiceB.amountInInvoiceCurr - invoiceB.roundoffTotal);
        if (roundOffDiff !== 0) return roundOffDiff;

        // Closest to balance due
        return (
          Math.abs(invoiceA.amountInInvoiceCurr - invoiceA.balanceDue) -
          Math.abs(invoiceB.amountInInvoiceCurr - invoiceB.balanceDue)
        );
      });
      resultData.otherMatches = otherMatches;
      resultData.relevantMatches = relevantMatches;

      return { data: resultData };
    } else {
      // FETCH BILLS (±6 months)
      const billsData = await this.billService.getAllBillData(
        dataSource,
        sixMonthsBefore,
        sixMonthsAfter,
      );
      if (!billsData.length) return { data: resultData };
      // FETCH PAYMENTS FOR ALL BILLS
      const transactionTypeIds = billsData.map(
        (bill) => bill.transactionTypeId,
      );
      const allPayments = await this.billService.fetchPaymentHistory(
        dataSource,
        transactionTypeIds,
      );

      // GROUP PAYMENTS BY TRANSACTION TYPE
      const paymentsByBill = allPayments.reduce(
        (map, payment) => {
          (map[payment.transactionTypeId] ||= []).push(payment);
          return map;
        },
        {} as Record<string, Transaction[]>,
      );

      // COMMON HELPERS
      const hasBalanceDue = (bill) =>
        Math.round(bill.balanceDue * 100) / 100 > 0;
      const toDateString = (date: string | Date) =>
        date instanceof Date ? date.toISOString().slice(0, 10) : date;

      // ATTACH PAYMENTS & SPLIT MATCHES
      const otherMatches: typeof billsData = [];
      const relevantMatches: typeof billsData = [];

      for (const bill of billsData) {
        if (!hasBalanceDue(bill)) continue;

        bill.payments = paymentsByBill[bill.transactionTypeId] ?? [];

        // Other matches: all bills with balanceDue > 0
        otherMatches.push(bill);

        // Relevant matches: bills before uncategorized date

        if (
          toDateString(bill.billDate) <= toDateString(uncategorizedData.date)
        ) {
          relevantMatches.push(bill);
        }
      }

      //  SORT OTHER MATCHES (by bill date)
      otherMatches.sort((billA, billB) =>
        toDateString(billA.billDate).localeCompare(
          toDateString(billB.billDate),
        ),
      );

      // CALCULATE AMOUNT IN BILL CURRENCY

      await Promise.all(
        relevantMatches.map(async (bill) => {
          bill.amountInBillCurr = await this.getAmountInTransact(
            bill.billCurrency,
            accountCurrency,
            Number(amount),
            bill.billDate.toString(),
          );
        }),
      );

      // SORT RELEVANT MATCHES
      relevantMatches.sort((billA, billB) => {
        // prioritize account currency
        if (
          billA.billCurrency === accountCurrency &&
          billB.billCurrency !== accountCurrency
        )
          return -1;
        if (
          billA.billCurrency !== accountCurrency &&
          billB.billCurrency === accountCurrency
        )
          return 1;

        // Closest to round-off total
        const roundOffDiff =
          Math.abs(billA.amountInBillCurr - billA.roundoffTotal) -
          Math.abs(billB.amountInBillCurr - billB.roundoffTotal);
        if (roundOffDiff !== 0) return roundOffDiff;

        // Closest to balance due
        return (
          Math.abs(billA.amountInBillCurr - billA.balanceDue) -
          Math.abs(billB.amountInBillCurr - billB.balanceDue)
        );
      });

      resultData.otherMatches = otherMatches;
      resultData.relevantMatches = relevantMatches;

      return {
        data: resultData,
      };
    }
  }

  async getAmountInTransact(
    transactCurrency: string,
    accountCurrency: string,
    amount: number,
    uncatDate: string,
  ): Promise<number> {
    if (transactCurrency === accountCurrency) {
      return amount;
    } else {
      const accountCurrencyCode = accountCurrency.split(" - ")[1];
      const billCurrencyCode = transactCurrency.split(" - ")[1];

      const { rate } = await this.fxService.history({
        date: uncatDate,
        from: accountCurrencyCode,
        to: billCurrencyCode,
      });

      return Number((amount * rate).toFixed(2));
    }
  }

  async saveUncategorizedMatch(
    dataSource: DataSource,
    dto: SaveUncategorizedMatchDto,
    uncategorizedId: number,
    companyId: string,
  ) {
    return dataSource.transaction(async (manager) => {
      // FETCH UNCATEGORIZED ENTRY
      const uncategorized = await manager.findOne(UncategorizedData, {
        where: { id: uncategorizedId },
        relations: ['account'],
      });
      if (!uncategorized)
        throw new NotFoundException('Uncategorized entry not found');

      const categorized = await this.isCategorized(
        uncategorizedId,
        dataSource.manager,
      );

      if (categorized)
        throw new BadRequestException(
          "This transaction is already categorized",
        );
      const { accReceivableId, accPayableId, fxAccountId } =
        await this.getSystemAccountIds(manager);
      if (!dto || !dto.splitData || dto.splitData.length === 0) {
        throw new BadRequestException('splitData cannot be empty');
      }
      let result;
      for (const value of dto.splitData) {
        const transactionTypeId = value.transactionTypeId;
        //   INV/BILL to ACC FX rate
        const fxRate = 1 / value.fxRate;
        const originalFXRate = 1 / value.originalFxRate;

        //  INVOICE PAYMENT
        if (uncategorized.credit > 0) {
          const invoiceCurrAmount = value.convertedAmount;

          // BUILD DTO
          const invoiceDto: InvoicePaymentDto = {
            transactionTypeId,
            paymentAccountId: uncategorized.account.id,
            paymentDate: new Date(uncategorized.date).toISOString(),
            paymentAmount: invoiceCurrAmount,
            fxRate: fxRate ?? 1,
            originalFxRate: originalFXRate ?? 1,
            notes: uncategorized.description,
            accountToInvoiceOriginalFXRate: value.originalFxRate,
            accountToInvoiceFXRate: value.fxRate,
            amountInAccCurr: value.amountInAccCurr,
          };


          result = await this.invoiceService.receiveInvoicePayment(
            dataSource,
            invoiceDto,
            companyId,
          );
        } else {
          // BUILD DTO
          const billCurrAmount = value.convertedAmount;

          const billDto: BillPaymentDto = {
            transactionTypeId,
            paymentAccountId: uncategorized.account.id,
            paymentDate: uncategorized.date.toISOString(),
            paymentAmount: billCurrAmount,
            fxRate: fxRate ?? 1,
            originalFxRate: originalFXRate ?? 1,
            notes: uncategorized.description,
            accountToBillOriginalFXRate: value.originalFxRate,
            accountToBillFXRate: value.fxRate,
            amountInAccCurr: value.amountInAccCurr,
          };

          result = await this.billService.makeBillPayment(
            dataSource,
            billDto,
            companyId,
          );
        }
        if (result) {
          await dataSource
            .getRepository(Transaction)
            .createQueryBuilder()
            .update(Transaction)
            .set({
              uncategorized: { id: uncategorizedId },
            })
            .where("transactionTypeId = :transactionTypeId", {
              transactionTypeId: result.data.transactionTypeId,
            })
            .andWhere("transactionTypeName = :transactionTypeName", {
              transactionTypeName: result.data.transactionTypeName,
            })
            .andWhere("paymentId = :paymentId", {
              paymentId: result.data.paymentId,
            })
            .andWhere("account_id != :accRecId", { accRecId: accReceivableId })
            .andWhere("account_id != :accPayId", { accPayId: accPayableId })
            .andWhere("account_id != :fxAccountId", {
              fxAccountId: fxAccountId,
            })
            .execute();
        }
      }

      // UPDATE TO CATEGORIZED
      await manager.update(
        UncategorizedData,
        { id: uncategorizedId },
        { isCategorized: true },
      );
      return {
        data: result?.data,
      };
    });
  }

  async checkValidUncategorizedData(
    uncategorizedRepo: Repository<UncategorizedData>,
    uncategorizedIdsList: number[],
  ) {
    const uncategorizedRowData = await uncategorizedRepo
      .createQueryBuilder("ud")
      .leftJoinAndSelect("ud.account", "account")
      .where("ud.id IN (:...ids)", { ids: uncategorizedIdsList })
      .getMany();

    // 4️⃣ Ensure all IDs exist
    if (uncategorizedRowData.length !== uncategorizedIdsList.length) {
      const foundIds = uncategorizedRowData.map((e) => e.id);
      const missingIds = uncategorizedIdsList.filter(
        (id) => !foundIds.includes(id),
      );
      throw new BadRequestException(
        `No uncategorized data found for ids: ${missingIds.join(", ")}`,
      );
    }

    const alreadyCategorizedIds = uncategorizedRowData
      .filter((e) => e.isCategorized)
      .map((e) => e.id);

    if (alreadyCategorizedIds.length) {
      throw new BadRequestException(
        `These transactions are already categorized: ${alreadyCategorizedIds.join(", ")}`,
      );
    }
    return uncategorizedRowData;
  }

  async uncategorizedMultiMatch(
    dataSource: DataSource,
    uncategorizedData: UncategorizedMatchDto[],
    companyId: string,
  ) {
    const uncategorizedRepo = dataSource.getRepository(UncategorizedData);
    if (uncategorizedData.length === 0) {
      throw new BadRequestException("No uncategorized data provided");
    }
    const amountType = uncategorizedData[0].amountType;
    const allSame = uncategorizedData.every(
      (item) => item.amountType === amountType,
    );
    if (!allSame) {
      throw new BadRequestException(
        "All uncategorized rows must be either Debit or Credit",
      );
    }
    const uncategorizedIdsList = uncategorizedData.map(
      (item) => item.uncategorizedId,
    );
    const uncategorizedRowData = await this.checkValidUncategorizedData(
      uncategorizedRepo,
      uncategorizedIdsList,
    );

    const reportingCurrency = await this.transactService.getCompanyCurrency(
      dataSource.manager,
      companyId,
    );

    const dateRange = await uncategorizedRepo
      .createQueryBuilder("ud")
      .where("ud.id IN (:...ids)", { ids: uncategorizedIdsList })
      .select(['MIN(ud.date) AS "minDate"', 'MAX(ud.date) AS "maxDate"'])
      .getRawOne<{ minDate: string; maxDate: string }>();
    if (!dateRange)
      throw new NotFoundException("Not able to fetch min and max dates");
    const minDate = dateRange?.minDate;
    const maxDate = dateRange?.maxDate;
    const sixMonthsBefore = moment(minDate)
      .clone()
      .subtract(6, 'months')
      .format('YYYY-MM-DD');

    const sixMonthsAfter = moment(maxDate)
      .clone()
      .add(6, 'months')
      .format('YYYY-MM-DD');

    const accountCurrencies = [
      ...new Set(
        uncategorizedRowData
          .map((e) => e.account?.accountCurrency)
          .filter(Boolean),
      ),
    ];
    const finalCurrencies: string[] = [reportingCurrency];

    if (accountCurrencies.length === 1) {
      if (accountCurrencies[0] === reportingCurrency) {
      } else {
        finalCurrencies.push(accountCurrencies[0]);
      }
    } else {
      const currenciesExceptBase = accountCurrencies.filter(
        (c) => c !== reportingCurrency,
      );

      if (currenciesExceptBase.length === 1) {
        finalCurrencies.push(currenciesExceptBase[0]);
      }
    }
    let resultData = {
      otherMatches: [],
      relevantMatches: [],
    };

    const toDateString = (d: string | Date) =>
      d instanceof Date ? d.toISOString().slice(0, 10) : d;

    if (amountType === 'credit') {
      // FETCH INVOICES (±6 months)
      const invoicesData = await this.invoiceService.getAllInvoiceData(
        dataSource,
        sixMonthsBefore,
        sixMonthsAfter,
      );
      if (!invoicesData.length) return { data: resultData };
      // FETCH PAYMENTS FOR ALL INVOICES
      const transactionTypeIds = invoicesData.map(
        (invoice) => invoice.transactionTypeId,
      );
      const allPayments = await this.invoiceService.fetchPaymentHistory(
        dataSource,
        transactionTypeIds,
      );

      // GROUP PAYMENTS BY TRANSACTION TYPE
      const paymentsByInvoice = allPayments.reduce(
        (map, p) => {
          (map[p.transactionTypeId] ||= []).push(p);
          return map;
        },
        {} as Record<string, Transaction[]>,
      );

      // COMMON HELPERS
      const hasBalanceDue = (invoice) =>
        Math.round(invoice.balanceDue * 100) / 100 > 0;

      // ATTACH PAYMENTS & SPLIT MATCHES
      const otherMatches: typeof invoicesData = [];
      const relevantMatches: typeof invoicesData = [];

      for (const invoice of invoicesData) {
        if (!hasBalanceDue(invoice)) continue;

        invoice.payments = paymentsByInvoice[invoice.transactionTypeId] ?? [];

        // Other matches: all invoices with balanceDue > 0
        otherMatches.push(invoice);

        // Relevant matches: invoices before uncategorized date
        if (toDateString(invoice.invoiceDate) <= toDateString(sixMonthsAfter)) {
          relevantMatches.push(invoice);
        }
      }

      // 6. SORT OTHER MATCHES (by invoice date)
      otherMatches.sort((invoiceA, invoiceB) =>
        toDateString(invoiceA.invoiceDate).localeCompare(
          toDateString(invoiceB.invoiceDate),
        ),
      );

      // 8. SORT RELEVANT MATCHES
      relevantMatches.sort((invoiceA, invoiceB) => {
        const aIndex = finalCurrencies.indexOf(invoiceA.invoiceCurrency);
        const bIndex = finalCurrencies.indexOf(invoiceB.invoiceCurrency);

        // currencies in finalCurrencies come first
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;

        // lower index = higher priority
        return aIndex - bIndex;
      });

      resultData.otherMatches = otherMatches;
      resultData.relevantMatches = relevantMatches;

      return { data: resultData };
    } else {
      // FETCH BILLS (±6 months)
      const billsData = await this.billService.getAllBillData(
        dataSource,
        sixMonthsBefore,
        sixMonthsAfter,
      );
      if (!billsData.length) return { data: resultData };
      // FETCH PAYMENTS FOR ALL BILLS
      const transactionTypeIds = billsData.map(
        (bill) => bill.transactionTypeId,
      );
      const allPayments = await this.billService.fetchPaymentHistory(
        dataSource,
        transactionTypeIds,
      );

      // GROUP PAYMENTS BY TRANSACTION TYPE
      const paymentsByBill = allPayments.reduce(
        (map, payment) => {
          (map[payment.transactionTypeId] ||= []).push(payment);
          return map;
        },
        {} as Record<string, Transaction[]>,
      );

      // COMMON HELPERS
      const hasBalanceDue = (bill) =>
        Math.round(bill.balanceDue * 100) / 100 > 0;

      // ATTACH PAYMENTS & SPLIT MATCHES
      const otherMatches: typeof billsData = [];
      const relevantMatches: typeof billsData = [];

      for (const bill of billsData) {
        if (!hasBalanceDue(bill)) continue;

        bill.payments = paymentsByBill[bill.transactionTypeId] ?? [];

        // Other matches: all bills with balanceDue > 0
        otherMatches.push(bill);

        // Relevant matches: bills before uncategorized date
        if (toDateString(bill.billDate) <= toDateString(sixMonthsAfter)) {
          relevantMatches.push(bill);
        }
      }

      //  SORT OTHER MATCHES (by bill date)
      otherMatches.sort((billA, billB) =>
        toDateString(billA.billDate).localeCompare(
          toDateString(billB.billDate),
        ),
      );

      // SORT RELEVANT MATCHES
      relevantMatches.sort((billA, billB) => {
        const aIndex = finalCurrencies.indexOf(billA.invoiceCurrency);
        const bIndex = finalCurrencies.indexOf(billB.invoiceCurrency);

        // currencies in finalCurrencies come first
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;

        // lower index = higher priority
        return aIndex - bIndex;
      });

      resultData.otherMatches = otherMatches;
      resultData.relevantMatches = relevantMatches;

      return {
        data: resultData,
      };
    }
  }

  async saveUncategorizedMultiMatch(
    dataSource: DataSource,
    uncategorizedDataList: SaveUncategorizedMultiMatchDto,
    amountType: string,
    transactionTypeId: string,
    companyId: string,
  ) {
    return dataSource.transaction(async (manager) => {
      if (!transactionTypeId)
        throw new NotFoundException("Transaction Type Id is missing");
      if (!amountType) throw new NotFoundException("Amount Type is missing");
      const uncategorizedRepo = manager.getRepository(UncategorizedData);
      if (
        !uncategorizedDataList ||
        !uncategorizedDataList.uncategorizedData ||
        uncategorizedDataList.uncategorizedData.length === 0
      ) {
        throw new BadRequestException("No uncategorized data provided");
      }
      const uncategorizedData = uncategorizedDataList.uncategorizedData;
      const uncategorizedIdsList = uncategorizedData.map(
        (item) => item.uncategorizedId,
      );
      const uncategorizedRowData = await this.checkValidUncategorizedData(
        uncategorizedRepo,
        uncategorizedIdsList,
      );
      const uncategorizedMap = new Map<number, UncategorizedData>();

      uncategorizedRowData.forEach((item) => {
        uncategorizedMap.set(item.id, item);
      });
      let transactionTypeName: "invoice" | "bill" = "invoice";
      const accReceivableAccount = await manager.findOne(AccountData, {
        where: {
          accountName: 'Accounts Receivable',
          accountType: AccountType.ASSET,
        },
      });
      const { accReceivableId, accPayableId, fxAccountId } =
        await this.getSystemAccountIds(manager);
      for (const value of uncategorizedData) {
        const uncategorizedId = value.uncategorizedId;
        const uncatData = uncategorizedMap.get(uncategorizedId);
        if (!uncatData)
          throw new BadRequestException(
            `No uncategorized data found for id: ${uncategorizedId}`,
          );
        //   INV/BILL to ACC FX rate
        const fxRate = 1 / value.fxRate;
        const originalFXRate = 1 / value.originalFxRate;
        let result;
        //  INVOICE PAYMENT
        if (amountType == "credit") {
          transactionTypeName = "invoice";
          const invoiceCurrAmount = value.convertedAmount;

          // BUILD DTO
          const invoiceDto: InvoicePaymentDto = {
            transactionTypeId,
            paymentAccountId: uncatData.account.id,
            paymentDate: new Date(uncatData.date).toISOString(),
            paymentAmount: invoiceCurrAmount,
            fxRate: fxRate ?? 1,
            originalFxRate: originalFXRate ?? 1,
            notes: uncatData.description,
            accountToInvoiceOriginalFXRate: value.originalFxRate,
            accountToInvoiceFXRate: value.fxRate,
            amountInAccCurr: value.amountInAccCurr,
          };

          result = await this.invoiceService.receiveInvoicePayment(
            dataSource,
            invoiceDto,
            companyId,
          );
        } else {
          transactionTypeName = "bill";
          // BUILD DTO
          const billCurrAmount = value.convertedAmount;

          const billDto: BillPaymentDto = {
            transactionTypeId,
            paymentAccountId: uncatData.account.id,
            paymentDate: uncatData.date.toISOString(),
            paymentAmount: billCurrAmount,
            fxRate: fxRate ?? 1,
            originalFxRate: originalFXRate ?? 1,
            notes: uncatData.description,
            accountToBillOriginalFXRate: value.originalFxRate,
            accountToBillFXRate: value.fxRate,
            amountInAccCurr: value.amountInAccCurr,
          };

          result = await this.billService.makeBillPayment(
            dataSource,
            billDto,
            companyId,
          );
        }

        await manager.update(
          UncategorizedData,
          { id: uncategorizedId },
          { isCategorized: true },
        );
        if (result) {
          await dataSource
            .getRepository(Transaction)
            .createQueryBuilder()
            .update(Transaction)
            .set({
              uncategorized: { id: uncategorizedId },
            })
            .where("transactionTypeId = :transactionTypeId", {
              transactionTypeId: result.data.transactionTypeId,
            })
            .andWhere("transactionTypeName = :transactionTypeName", {
              transactionTypeName: result.data.transactionTypeName,
            })
            .andWhere("paymentId = :paymentId", {
              paymentId: result.data.paymentId,
            })
            .andWhere("account_id != :accRecId", { accRecId: accReceivableId })
            .andWhere("account_id != :accPayId", { accPayId: accPayableId })
            .andWhere("account_id != :fxAccountId", {
              fxAccountId: fxAccountId,
            })
            .execute();
        }
      }
      return {
        data: {
          transactionTypeName,
          transactionTypeId: transactionTypeId,
          paymentId: null,
        },
      };
    });
  }

  async getSystemAccountIds(manager: EntityManager) {
    const accReceivableAccount = await manager.findOne(AccountData, {
      where: {
        accountName: "Accounts Receivable",
        accountType: AccountType.ASSET,
      },
    });

    if (!accReceivableAccount) {
      throw new BadRequestException("Accounts Receivable account missing");
    }

    const accPayableAccount = await manager.findOne(AccountData, {
      where: {
        accountName: "Accounts Payable",
        accountType: AccountType.LIABILITY,
      },
    });

    if (!accPayableAccount) {
      throw new BadRequestException("Accounts Payable account missing");
    }

    const fxAccount = await manager.findOne(AccountData, {
      where: {
        accountName: "FX Gain/ Loss",
        accountType: AccountType.EXPENSE,
      },
    });

    if (!fxAccount) {
      throw new BadRequestException("FX Gain/Loss account missing");
    }

    return {
      accReceivableId: accReceivableAccount.id,
      accPayableId: accPayableAccount.id,
      fxAccountId: fxAccount.id,
    };
  }
}
