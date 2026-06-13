import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Invoice } from "./entities/tenant.invoice.entity";
import { InvoiceItem } from "./entities/tenant.invoice-item.entity";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  Not,
  Repository,
} from "typeorm";
import { AccountData } from "../account/entities/tenant.account.entity";
import { Transaction } from "../transact/entities/tenant.transaction.entity";
import { Tax } from "../tax/entities/tenant.tax.entity";
import { TransactService } from "../transact/transact.service";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { AccountType } from "src/common/enum/account-type.enum";
import { InvoicePaymentDto } from "./dto/invoice-payment.dto";
import {
  ApplyLevel,
  DiscountApplied,
  DiscountType,
  TdsType,
} from "src/common/enum/transact.enum";
import { Contact } from "../contact/entities/tenant.contact.entity";
import * as fs from "fs";
import * as Handlebars from "handlebars";
import wkhtmltopdf from "wkhtmltopdf";
import { InvoiceTemplate } from "src/setting/entities/tenant.invoice-template.entity";
import {
  CompanyIdentity,
  CompanyMetaData,
} from "src/setting/entities/tenant.company-identity.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Company } from "src/company/entities/company.entity";
import { SettingService } from "src/setting/setting.service";
import { Attachment } from "../transact/entities/tenant.attachment.entity";
import { BillService } from "../bill/bill.service";
import * as puppeteer from "puppeteer";
import * as hbs from "handlebars";
import ExcelJS from "exceljs";
import {
  AggregatedTds,
  AggregatedTax,
  TaxType,
} from "src/common/interface/tax-summary.interface.";
import { CURRENCY_CC_NAME } from "../../common/config/currency.configs";
import writtenNumber from "written-number";
import { Currency } from "src/common/interface/currency.interface";
import { fetchImageAsBuffer, getTemplatePath } from "src/shared/utils";

@Injectable()
export class InvoiceService {
  private readonly currencyMap = new Map<string, Currency>(
    CURRENCY_CC_NAME.map((c) => [c.cc.toUpperCase(), c]),
  );

  constructor(
    private readonly transactService: TransactService,
    private readonly billService: BillService,
    private readonly settingService: SettingService,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  private amountToWords(amount: number, currencyCode: string): string {
    const rounded = Math.round(amount);
    const currency = this.currencyMap.get(currencyCode.trim());
    const rawCurrencyName = currency?.name;
    const wordsRaw = writtenNumber(rounded, { lang: "en" });

    const words = wordsRaw
      .split(" ")
      .map((word) =>
        word.length > 0
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : word,
      )
      .join(" ");

    const currencyName = String(rawCurrencyName)
      .split(" ")
      .map((word) =>
        word.length > 0
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : word,
      )
      .join(" ");

    return `${currencyName} ${words} Only`;
  }

  private buildFileName(
    invoiceDate: Date | string,
    billToName: string,
    invoiceNo: string | number,
    currency: string,
    balanceDue: number,
  ): string {
    const date = new Date(invoiceDate).toISOString().split("T")[0];
    const currencyCode = currency.split(" ")[2];
    const safe = (value: string | number) =>
      String(value)
        .trim()
        .replace(/[\/\\?%*:|"<>]/g, ""); // remove invalid filename chars

    return `${safe(date)} - ${safe(billToName)} - ${safe(
      invoiceNo,
    )} - ${safe(currencyCode)} ${balanceDue}`;
  }

  private formatDate(timestamp: Date) {
    const date = new Date(timestamp);

    const datePart = date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
    return datePart;
  }

  private normalize = (s?: string) =>
    s?.trim().toLowerCase().replace(/\s+/g, " ");

  private async fetchInvoiceReceivableTxn(
    manager: EntityManager,
    transactionTypeId: string,
  ) {
    const invoiceArTxn = await manager
      .createQueryBuilder(Transaction, "txn")
      .select([
        "txn.counterExchangeRate",
        "txn.counterOriginalExchangeRate",
        "contact.id",
        "contact.name",
      ])
      .innerJoin("txn.account", "acc")
      .innerJoin("txn.contact", "contact")
      .where("txn.transactionTypeId = :typeId", {
        typeId: transactionTypeId,
      })
      .andWhere("txn.transactionTypeName = :name", { name: "invoice" })
      .andWhere("acc.accountType = :accType", { accType: "Asset" })
      .andWhere("acc.accountName = :accName", {
        accName: "Accounts Receivable",
      })
      .getOne();

    if (!invoiceArTxn) {
      throw new BadRequestException("Invoice Transactions not found");
    }
    return invoiceArTxn;
  }

  async getInvoiceData(dataSource: DataSource, transactionTypeId: string) {
    if (!transactionTypeId)
      throw new BadRequestException("TransactionTypeId is required");
    const inv_repo = dataSource.getRepository(Invoice);
    const transact_repo = dataSource.getRepository(Transaction);

    const invoice = await inv_repo.findOne({
      where: { transactionTypeId },
      relations: ["discountAccount", "contact", "items", "items.itemAccount"],
    });
    if (!invoice) {
      throw new BadRequestException("Invoice not found");
    }
    const invoicePaymentTransaction = await transact_repo.findOne({
      where: { transactionTypeId, transactionTypeName: "invoice_payment" },
    });
    const paymentExists = !!invoicePaymentTransaction;

    const invoiceArTxn = await this.fetchInvoiceReceivableTxn(
      dataSource.manager,
      transactionTypeId,
    );
    const fxRate = invoiceArTxn.counterExchangeRate;
    const originalFxRate = invoiceArTxn.counterOriginalExchangeRate;
    const invoiceData = {
      invoiceData: invoice,
      payments: await this.fetchPaymentHistory(dataSource, transactionTypeId),
      attachments: [],
      fxRate,
      originalFxRate,
      paymentExists,
    };
    return invoiceData;
  }

  private calculateTotalLevelTds(
    subTotal: number,
    tdsType?: TdsType,
    tdsValue?: number,
  ): number {
    if (!tdsType || tdsValue == null) return 0;

    if (tdsType === TdsType.PERCENT) {
      return this.percentOf(subTotal, tdsValue);
    }

    if (tdsType === TdsType.VALUE) {
      return +tdsValue.toFixed(2);
    }

    return 0;
  }

  private calculateAggregatedItemTds(items: InvoiceItem[]): AggregatedTds[] {
    const accumulator = new Map<string, AggregatedTds>();

    for (const item of items) {
      if (!item.itemTdsType || item.itemTdsValue == null) continue;

      const baseAmount = Number(item.itemTotal);
      const key = `${item.itemTdsType}_${item.itemTdsValue}`;

      let tdsAmount = 0;

      if (item.itemTdsType === TdsType.PERCENT) {
        tdsAmount = this.percentOf(baseAmount, Number(item.itemTdsValue));
      }

      if (item.itemTdsType === TdsType.VALUE) {
        tdsAmount = Number(item.itemTdsValue);
      }

      if (!accumulator.has(key)) {
        accumulator.set(key, {
          type: item.itemTdsType,
          rateOrValue: Number(item.itemTdsValue),
          totalAmount: 0,
        });
      }

      accumulator.get(key)!.totalAmount += tdsAmount;
    }

    return [...accumulator.values()].map((t) => ({
      ...t,
      totalAmount: +t.totalAmount.toFixed(2),
    }));
  }

  private percentOf(base: number, percent: number): number {
    return +((base * percent) / 100).toFixed(2);
  }

  private calculateSubTotal(items: InvoiceItem[]): number {
    return items.reduce((sum, i) => sum + Number(i.itemTotal), 0);
  }

  private calculateAggregatedTaxes(
    items: InvoiceItem[],
    taxMap: Map<number, Tax>,
  ): AggregatedTax[] {
    const accumulator = new Map<string, AggregatedTax>();

    for (const item of items) {
      const baseAmount = Number(item.itemTotal); // dictionary value

      if (!Array.isArray(item.itemTax)) continue;

      for (const tax of item.itemTax) {
        const taxEntity = taxMap.get(tax.taxId);
        if (!taxEntity) continue; // only abbreviation lookup

        const key = `${tax.taxId}_${tax.type}_${tax.value}`;

        const taxAmount =
          tax.type === "value"
            ? Number(tax.value)
            : this.percentOf(baseAmount, Number(tax.value));

        if (!accumulator.has(key)) {
          accumulator.set(key, {
            taxId: tax.taxId,
            taxName: taxEntity.taxName,
            abbreviation: taxEntity.abbreviation,
            type: tax.type as TaxType,
            rateOrValue: Number(tax.value),
            totalAmount: 0,
          });
        }

        accumulator.get(key)!.totalAmount += taxAmount;
      }
    }

    return [...accumulator.values()].map((t) => ({
      ...t,
      totalAmount: +t.totalAmount.toFixed(2),
    }));
  }

  private async buildTotalResolvers(
    invoice: Invoice,
    items: InvoiceItem[],
    dataSource: DataSource,
  ) {
    // ---------- SUBTOTAL ----------
    const subTotal = this.calculateSubTotal(items);

    // ---------- TAX ----------
    const taxRepo = dataSource.getRepository(Tax);
    const taxMap = new Map((await taxRepo.find()).map((t) => [t.id, t]));

    const aggregatedTaxes = this.calculateAggregatedTaxes(items, taxMap);

    const taxTotal = aggregatedTaxes.reduce((sum, t) => sum + t.totalAmount, 0);

    // ---------- DISCOUNT ----------
    const discount = this.calculateInvoiceDiscount(invoice, subTotal, taxTotal);

    // ---------- TDS ----------
    const itemTds =
      invoice.tdsLevel === ApplyLevel.ITEM
        ? this.calculateAggregatedItemTds(items)
        : [];

    const invoiceTds =
      invoice.tdsLevel === ApplyLevel.TOTAL
        ? this.calculateTotalLevelTds(
            subTotal,
            invoice.tdsType,
            Number(invoice.tdsValue),
          )
        : 0;

    return {
      subTotal,
      discount: discount > 0 ? discount : 0,
      itemTds,
      invoiceTds,
    };
  }

  private calculateDiscountAmount(
    baseAmount: number,
    discountType?: DiscountType,
    discountValue?: string,
  ): number {
    if (!discountType || discountValue == null) return 0;

    const value = Number(discountValue);

    if (discountType === DiscountType.VALUE) {
      return +value.toFixed(2);
    }

    if (discountType === DiscountType.PERCENT) {
      return +((baseAmount * value) / 100).toFixed(2);
    }

    return 0;
  }

  private calculateInvoiceDiscount(
    invoice: Invoice,
    subTotal: number,
    taxTotal: number,
  ): number {
    if (!invoice.discountApplied) return 0;

    let baseAmount = subTotal;

    // AFTER → subtotal + tax
    if (invoice.discountApplied === DiscountApplied.AFTER) {
      baseAmount = subTotal + taxTotal;
    }

    return this.calculateDiscountAmount(
      baseAmount,
      invoice.discountType,
      invoice.discountValue,
    );
  }

  private async getBalanceDue(
    dataSource: DataSource,
    transactionTypeId: string,
    invoiceTotal: number,
  ) {
    const totalReceivedResult = await dataSource
      .getRepository(Transaction)
      .createQueryBuilder("transaction")
      .leftJoin("transaction.account", "account")
      .where("transaction.transactionTypeId = :id", { id: transactionTypeId })
      .andWhere("transaction.transactionTypeName = :name", {
        name: "invoice_payment",
      })
      .andWhere(
        "NOT ((account.accountName = :accName AND account.accountType = :accType) OR (account.accountName = :fxName AND account.accountType = :fxType))",
        {
          accName: "Accounts Receivable",
          accType: "Asset",
          fxName: "FX Gain/ Loss",
          fxType: "Expense",
        },
      )
      .select("SUM(transaction.counterCurrencyAmount)", "totalReceived")
      .getRawOne();

    const totalReceived = Number(totalReceivedResult?.totalReceived ?? 0);
    const balanceDue = invoiceTotal - totalReceived;
    return { totalReceived, balanceDue };
  }

  async fetchPaymentHistory(
    dataSource: DataSource,
    transactionTypeIds: string | string[],
  ) {
    const ids = Array.isArray(transactionTypeIds)
      ? transactionTypeIds
      : [transactionTypeIds];
    if (!ids.length) return [];
    const paymentHistory = await dataSource
      .getRepository(Transaction)
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.account", "account")
      .where("transaction.transactionTypeId IN (:...ids)", { ids })
      .andWhere("transaction.transactionTypeName = :name", {
        name: "invoice_payment",
      })
      .andWhere(
        "NOT ((account.accountName = :accName AND account.accountType = :accType) OR (account.accountName = :fxName AND account.accountType = :fxType))",
        {
          accName: "Accounts Receivable",
          accType: "Asset",
          fxName: "FX Gain/ Loss",
          fxType: "Expense",
        },
      )
      .select([
        "transaction.date",
        "transaction.paymentId",
        "account.id",
        "account.accountName",
        "account.accountCurrency",
        "transaction.debitAmount",
        "transaction.counterCurrencyAmount",
        "transaction.counterExchangeRate",
        "transaction.counterCurrency",
        "transaction.description",
      ])
      .orderBy("transaction.date", "DESC")
      .getMany();
    return paymentHistory;
  }

  async getAllInvoiceDataCursor(
    dataSource: DataSource,
    limit: number,
    fromDate?: string,
    toDate?: string,
    prevCursor?: string | null,
    nextCursor?: string | null,
    newInvoiceNo?: string,
  ) {
    const invRepo = dataSource.getRepository(Invoice);
    const attachmentRepo = dataSource.getRepository(Attachment);
    const transactRepo = dataSource.getRepository(Transaction);

    const isUpwards = !!prevCursor;
    const isDownwards = !!nextCursor;
    const activeCursor = isUpwards ? prevCursor : nextCursor;
    const cursorData = this.transactService.decodeCursor(activeCursor);

    let responseNextCursor = "";
    let responsePrevCursor = "";
    let invoices: Invoice[] = [];

    const baseQuery = invRepo
      .createQueryBuilder("invoice")
      .select(["invoice.id", "invoice.invoiceDate", "invoice.createdAt"]);

    const dataWindow = Math.floor((limit - 1) / 2);
    const finalLimit = newInvoiceNo ? dataWindow : limit;

    if (fromDate && toDate) {
      baseQuery.andWhere("invoice.invoiceDate BETWEEN :fromDate AND :toDate", {
        fromDate,
        toDate,
      });
    }

    const allInvCount = await baseQuery.clone().getCount();

    if (newInvoiceNo) {
      const anchor = await invRepo.findOne({
        where: { invoiceNo: newInvoiceNo },
      });
      if (!anchor) throw new BadRequestException("Invoice Does Not Exist!");

      const resultPrev = await baseQuery
        .clone()
        .andWhere(
          "(invoice.invoiceDate < :d OR (invoice.invoiceDate = :d AND invoice.createdAt < :c))",
          { d: anchor.invoiceDate, c: anchor.createdAt },
        )
        .orderBy("invoice.invoiceDate", "DESC")
        .addOrderBy("invoice.createdAt", "DESC")
        .take(finalLimit + 1)
        .getMany();

      const resultNext = await baseQuery
        .clone()
        .andWhere(
          "(invoice.invoiceDate > :d OR (invoice.invoiceDate = :d AND invoice.createdAt > :c))",
          { d: anchor.invoiceDate, c: anchor.createdAt },
        )
        .orderBy("invoice.invoiceDate", "ASC")
        .addOrderBy("invoice.createdAt", "ASC")
        .take(finalLimit + 1)
        .getMany();

      if (resultPrev.length > dataWindow) {
        const last = resultPrev.pop();
        responsePrevCursor = this.transactService.encodeCursor(
          new Date(last!.invoiceDate),
          last!.createdAt,
        );
      }
      if (resultNext.length > dataWindow) {
        const last = resultNext.pop();
        responseNextCursor = this.transactService.encodeCursor(
          new Date(last!.invoiceDate),
          last!.createdAt,
        );
      }

      resultPrev.reverse();
      invoices = [...resultPrev, anchor, ...resultNext];
      invoices.reverse();
    } else if (cursorData) {
      const query = baseQuery.clone();
      if (isUpwards) {
        query
          .andWhere(
            "(invoice.invoiceDate < :d OR (invoice.invoiceDate = :d AND invoice.createdAt < :c))",
            { d: cursorData.d, c: cursorData.createdAt },
          )
          .orderBy("invoice.invoiceDate", "DESC")
          .addOrderBy("invoice.createdAt", "DESC");
      } else {
        query
          .andWhere(
            "(invoice.invoiceDate > :d OR (invoice.invoiceDate = :d AND invoice.createdAt > :c))",
            { d: cursorData.d, c: cursorData.createdAt },
          )
          .orderBy("invoice.invoiceDate", "ASC")
          .addOrderBy("invoice.createdAt", "ASC");
      }

      invoices = await query.take(limit + 1).getMany();

      if (invoices.length > limit) {
        const last = invoices.pop();
        const encoded = this.transactService.encodeCursor(
          new Date(last!.invoiceDate),
          last!.createdAt,
        );
        isUpwards
          ? (responsePrevCursor = encoded)
          : (responseNextCursor = encoded);
      }
      if (isDownwards) invoices.reverse();
    } else {
      invoices = await baseQuery
        .clone()
        .orderBy("invoice.invoiceDate", "DESC")
        .addOrderBy("invoice.createdAt", "DESC")
        .take(limit + 1)
        .getMany();

      if (invoices.length > limit) {
        const last = invoices.pop();
        responsePrevCursor = this.transactService.encodeCursor(
          new Date(last!.invoiceDate),
          last!.createdAt,
        );
      }
    }

    const invoiceIds = invoices.map((i) => i.id);
    let detailedInvoices: Invoice[] = [];

    if (invoiceIds.length > 0) {
      detailedInvoices = await invRepo
        .createQueryBuilder("invoice")
        .leftJoinAndSelect("invoice.items", "items")
        .leftJoinAndSelect("invoice.contact", "contact")
        .leftJoinAndSelect("invoice.discountAccount", "discountAccount")
        .leftJoinAndSelect("items.itemAccount", "itemAccount")
        .where("invoice.id IN (:...invoiceIds)", { invoiceIds })
        .orderBy("invoice.invoiceDate", "DESC")
        .addOrderBy("invoice.createdAt", "DESC")
        .getMany();
    }

    const data = await Promise.all(
      detailedInvoices.map(async (invoice) => {
        const { totalReceived, balanceDue } = await this.getBalanceDue(
          dataSource,
          invoice.transactionTypeId,
          Number(invoice.roundoffTotal),
        );

        const attachmentWhere =
          await this.transactService.buildTransactionWhere(
            invoice.transactionTypeId,
            "invoice",
          );
        const attachmentsForInvoice = await attachmentRepo.findOne({
          where: attachmentWhere,
        });

        attachmentWhere.transactionTypeName = "invoice_payment";
        const invoicePaymentExists = await transactRepo.findOne({
          where: attachmentWhere,
        });

        return {
          ...invoice,
          totalReceived,
          balanceDue,
          noOfAttachments: attachmentsForInvoice?.attachments.length || 0,
          invoicePaymentExists: !!invoicePaymentExists,
          transactionTypeName: "invoice",
          descNotes: null,
          descContactId: invoice.contact?.id,
          descContactName: invoice.contact?.name,
          descInvoiceNumber: invoice.invoiceNo,
        };
      }),
    );

    return {
      data,
      allInvCount,
      prevCursor: responsePrevCursor === "" ? null : responsePrevCursor,
      nextCursor: responseNextCursor === "" ? null : responseNextCursor,
    };
  }

  async getAllInvoiceData(
    dataSource: DataSource,
    fromDate?: string,
    toDate?: string,
    limit?: number,
    offset?: number,
  ) {
    const invRepo = dataSource.getRepository(Invoice);
    const attachmentRepo = dataSource.getRepository(Attachment);
    const transactRepo = dataSource.getRepository(Transaction);
    const allInvoices = invRepo
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.items", "items")
      .leftJoin("invoice.contact", "contact")
      .leftJoin("invoice.discountAccount", "discountAccount")
      .leftJoin("items.itemAccount", "itemAccount")
      .addSelect([
        "contact.id",
        "contact.name",
        "discountAccount.id",
        "discountAccount.accountName",
        "itemAccount.id",
        "itemAccount.accountName",
        "items",
      ])
      .orderBy("invoice.invoiceDate", "DESC");

    if (fromDate && toDate) {
      allInvoices.andWhere(
        "invoice.invoiceDate BETWEEN :fromDate AND :toDate",
        { fromDate, toDate },
      );
    }
    if (limit !== undefined && offset !== undefined) {
      allInvoices.take(limit).skip(offset);
    }
    const invoices = await allInvoices.getMany();

    console.log(invoices);
    let data: any = [];
    for (const invoice of invoices) {
      const { totalReceived, balanceDue } = await this.getBalanceDue(
        dataSource,
        invoice.transactionTypeId,
        Number(invoice.roundoffTotal),
      );
      const attachmentWhere = await this.transactService.buildTransactionWhere(
        invoice.transactionTypeId,
        "invoice",
      );

      const attachmentsForInvoice = await attachmentRepo.findOne({
        where: attachmentWhere,
      });
      const attachmentCount = attachmentsForInvoice?.attachments.length || 0;

      attachmentWhere.transactionTypeName = "invoice_payment";

      const invoicePaymentExists = await transactRepo.findOne({
        where: attachmentWhere,
      });

      data.push({
        ...invoice,
        totalReceived,
        balanceDue,
        noOfAttachments: attachmentCount,
        invoicePaymentExists: !!invoicePaymentExists,
        transactionTypeName: "invoice",
      });
    }

    return data;
  }

  async invoiceNumberExists(
    dataSource: DataSource,
    contactId: number,
    invoiceNo: string,
    ignoreInvoiceId?: number,
  ) {
    if (!contactId) throw new BadRequestException("Contact ID is required");
    if (!invoiceNo) throw new BadRequestException("Invoice No is required");
    const whereCondition: FindOptionsWhere<Invoice> = {
      invoiceNo: invoiceNo,
      contact: { id: contactId },
    };
    if (ignoreInvoiceId) {
      whereCondition.id = Not(ignoreInvoiceId);
    }
    const existingInvoice = await dataSource.getRepository(Invoice).findOne({
      where: whereCondition,
      select: { id: true },
    });
    if (existingInvoice) {
      throw new ConflictException(
        `Invoice number ${invoiceNo} already exists for this contact`,
      );
    }
    return false;
  }

  async getlatestInvoices(dataSource: DataSource, contactId: number) {
    const rows = await dataSource.manager
      .getRepository(Invoice)
      .createQueryBuilder("invoice")
      .select("invoice.invoiceNo", "billNo")
      .orderBy("invoice.invoiceDate", "DESC")
      .where("invoice.contact.id = :contactId", { contactId })
      .limit(10)
      .getRawMany();
    return rows.map((row) => row.billNo);
  }

  async createInvoice(
    dataSource: DataSource,
    dto: CreateInvoiceDto,
    companyId: string,
  ) {
    return dataSource.transaction(async (manager) => {
      const transactionTypeId =
        await this.transactService.generateTransactionTypeId();
      const companyCurrency = await this.transactService.getCompanyCurrency(
        manager,
        companyId,
      );
      const transactionTypeName = "invoice";
      const contactData = await this.transactService.contactExists(
        manager,
        dto.contactId,
      );
      if (dto.discountAccountId)
        await this.transactService.accountExists(
          manager,
          dto.discountAccountId,
        );
      await this.invoiceNumberExists(dataSource, dto.contactId, dto.invoiceNo);
      const fxRate = dto.fxRate;
      const originalFxRate = dto.originalFxRate;
      const invoiceCurrency = dto.invoiceCurrency;
      let invoiceTotalInRC = "0";
      if (dto.isRoundOff && dto.roundoffTotal) {
        invoiceTotalInRC = (parseFloat(dto.roundoffTotal) * fxRate).toFixed(2);
      } else {
        invoiceTotalInRC = (parseFloat(dto.invoiceTotal) * fxRate).toFixed(2);
      }
      const invoice = manager.create(Invoice, {
        invoiceNo: dto.invoiceNo,
        serviceStartDate: new Date(dto.serviceStartDate),
        serviceEndDate: new Date(dto.serviceEndDate),
        invoiceDate: new Date(dto.invoiceDate),
        invoiceDueDate: new Date(dto.invoiceDueDate),
        invoiceCurrency: dto.invoiceCurrency,
        notes: dto.notes,
        hasTds: dto.hasTds,
        tdsLevel: dto.tdsLevel,
        tdsType: dto.tdsType,
        tdsValue: dto.tdsValue,
        discountApplied: dto.discountApplied,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        invoiceTotal: dto.invoiceTotal,
        isRoundOff: dto.isRoundOff,
        roundoffTotal: dto.roundoffTotal,
        transactionTypeId,
        contact: { id: dto.contactId },
        discountAccount: dto.discountAccountId
          ? { id: dto.discountAccountId }
          : undefined,

        items: [],
      });

      await manager.save(invoice);
      for (const item of dto.items) {
        const accountData = await this.transactService.accountExists(
          manager,
          item.itemAccountId,
        );
        const itemTotal = parseFloat(item.itemTotal);
        const fxItemTotal = (itemTotal * fxRate).toFixed(2);
        const invoiceItem = manager.create(InvoiceItem, {
          invoice,
          itemName: item.itemName,
          itemAccount: { id: item.itemAccountId },
          hsnSac: item.hsnSac,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          itemTotal: item.itemTotal,
          itemTdsValue: item.itemTdsValue,
          itemTdsType: item.itemTdsType,
          itemTax: item.itemTax,
        });

        await manager.save(invoiceItem);

        let baseAmount, accountAmount, counterAmount;
        let counterFxRate = 1,
          counteroriginalFxRate = 1,
          accountExchangeRate = 1,
          accountOriginalExchangeRate = 1;
        let accountCurrency, counterCurrency;

        if (invoiceCurrency == companyCurrency) {
          if (accountData.accountCurrency == companyCurrency) {
            baseAmount = accountAmount = counterAmount = item.itemTotal;
            accountCurrency = counterCurrency = companyCurrency;
          } else {
            throw new BadRequestException(
              "Account must be of company or invoice currency",
            );
          }
        } else {
          if (accountData.accountCurrency == companyCurrency) {
            baseAmount = fxItemTotal;
            accountAmount = fxItemTotal;
            accountCurrency = accountData.accountCurrency;
            accountExchangeRate = 1;
            accountOriginalExchangeRate = 1;
            counterAmount = item.itemTotal;
            counterCurrency = invoiceCurrency;
            counterFxRate = fxRate;
            counteroriginalFxRate = originalFxRate;
          } else if (accountData.accountCurrency == invoiceCurrency) {
            baseAmount = fxItemTotal;
            accountAmount = item.itemTotal;
            accountCurrency = accountData.accountCurrency;
            accountExchangeRate = fxRate;
            accountOriginalExchangeRate = originalFxRate;
            counterAmount = item.itemTotal;
            counterCurrency = invoiceCurrency;
            counterFxRate = 1;
            counteroriginalFxRate = 1;
          } else {
            throw new BadRequestException(
              "Account must be of company or invoice currency",
            );
          }
        }
        // Item transaction (credit income)
        const itemTxn = await manager.save(Transaction, {
          date: new Date(dto.invoiceDate),
          description: "",
          account: { id: item.itemAccountId },
          transactionTypeName,
          transactionTypeId,
          creditAmount: baseAmount,
          debitAmount: "0",
          journalBalance: invoiceTotalInRC,
          accountCurrency: accountCurrency,
          accountCurrencyAmount: accountAmount,
          accountExchangeRate: accountExchangeRate,
          accountOriginalExchangeRate: accountOriginalExchangeRate,
          counterCurrency: counterCurrency,
          counterCurrencyAmount: counterAmount,
          counterExchangeRate: counterFxRate,
          counterOriginalExchangeRate: counteroriginalFxRate,
        });
        invoiceItem.transaction = itemTxn;
        await manager.save(invoiceItem);
        // Tax transactions
        if (item.itemTax?.length) {
          for (const tax of item.itemTax) {
            const taxData = await this.transactService.taxExists(
              manager,
              tax.taxId,
            );

            let taxAmount = 0;
            if (tax.type === "percent") {
              taxAmount = (itemTotal * tax.value) / 100;
            } else {
              taxAmount = tax.value;
            }
            let taxFxAmount = (taxAmount * fxRate).toFixed(2);
            let baseAmount, accountAmount, counterAmount;
            let counterFxRate = 1,
              counteroriginalFxRate = 1,
              accountExchangeRate = 1,
              accountOriginalExchangeRate = 1;
            let accountCurrency, counterCurrency;
            if (invoiceCurrency == companyCurrency) {
              baseAmount = accountAmount = counterAmount = taxAmount;
              accountCurrency = counterCurrency = companyCurrency;
            } else {
              baseAmount = taxFxAmount;
              accountAmount = taxFxAmount;
              accountCurrency = companyCurrency;
              accountExchangeRate = 1;
              accountOriginalExchangeRate = 1;
              counterAmount = taxAmount;
              counterCurrency = invoiceCurrency;
              counterFxRate = fxRate;
              counteroriginalFxRate = originalFxRate;
            }

            await manager.save(
              manager.create(Transaction, {
                date: new Date(dto.invoiceDate),
                description: "",
                tax: taxData,
                transactionTypeName,
                transactionTypeId,
                creditAmount: baseAmount,
                debitAmount: "0",
                journalBalance: invoiceTotalInRC,
                accountCurrency: accountCurrency,
                accountCurrencyAmount: accountAmount,
                accountExchangeRate: accountExchangeRate,
                accountOriginalExchangeRate: accountOriginalExchangeRate,
                counterCurrency: counterCurrency,
                counterCurrencyAmount: counterAmount,
                counterExchangeRate: counterFxRate,
                counterOriginalExchangeRate: counteroriginalFxRate,
              }),
            );
          }
        }
      }

      if (
        dto.hasDiscount &&
        dto.discountValue &&
        dto.discountAccountId &&
        dto.totalDiscountValue
      ) {
        const discountAccount = await this.transactService.accountExists(
          manager,
          dto.discountAccountId,
        );
        let discountValue = parseFloat(dto.totalDiscountValue);
        let discountFxValue = (discountValue * fxRate).toFixed(2);

        let baseAmount, accountAmount, counterAmount;
        let counterFxRate = 1,
          counteroriginalFxRate = 1,
          accountExchangeRate = 1,
          accountOriginalExchangeRate = 1;
        let accountCurrency, counterCurrency;
        if (invoiceCurrency == companyCurrency) {
          if (discountAccount.accountCurrency == companyCurrency) {
            baseAmount = accountAmount = counterAmount = discountValue;
            accountCurrency = counterCurrency = companyCurrency;
          } else {
            throw new BadRequestException(
              "Account must be of company or invoice currency",
            );
          }
        } else {
          if (discountAccount.accountCurrency == companyCurrency) {
            baseAmount = discountFxValue;
            accountAmount = discountFxValue;
            accountCurrency = discountAccount.accountCurrency;
            accountExchangeRate = 1;
            accountOriginalExchangeRate = 1;
            counterAmount = discountValue;
            counterCurrency = invoiceCurrency;
            counterFxRate = fxRate;
            counteroriginalFxRate = originalFxRate;
          } else if (discountAccount.accountCurrency == invoiceCurrency) {
            baseAmount = discountFxValue;
            accountAmount = discountValue;
            accountCurrency = discountAccount.accountCurrency;
            accountExchangeRate = fxRate;
            accountOriginalExchangeRate = originalFxRate;
            counterAmount = discountValue;
            counterCurrency = invoiceCurrency;
            counterFxRate = 1;
            counteroriginalFxRate = 1;
          } else {
            throw new BadRequestException(
              "Account must be of company or invoice currency",
            );
          }
        }

        await manager.save(Transaction, {
          date: new Date(dto.invoiceDate),
          description: "",
          account: discountAccount,
          transactionTypeName,
          transactionTypeId,
          debitAmount: baseAmount,
          creditAmount: "0",
          journalBalance: invoiceTotalInRC,
          accountCurrency: accountCurrency,
          accountCurrencyAmount: accountAmount,
          accountExchangeRate: accountExchangeRate,
          accountOriginalExchangeRate: accountOriginalExchangeRate,
          counterCurrency: counterCurrency,
          counterCurrencyAmount: counterAmount,
          counterExchangeRate: counterFxRate,
          counterOriginalExchangeRate: counteroriginalFxRate,
        });
      }

      if (dto.hasTds && dto.totalTdsValue) {
        const tdsData = await manager.findOne(Tax, {
          where: { taxName: "TDS" },
        });

        if (!tdsData) {
          throw new BadRequestException("TDS missing");
        }
        let totalTdsValue = parseFloat(dto.totalTdsValue);
        let totalTdsFxValue = (parseFloat(dto.totalTdsValue) * fxRate).toFixed(
          2,
        );

        let baseAmount, accountAmount, counterAmount;
        let counterFxRate = 1,
          counteroriginalFxRate = 1,
          accountExchangeRate = 1,
          accountOriginalExchangeRate = 1;
        let accountCurrency, counterCurrency;
        if (invoiceCurrency == companyCurrency) {
          baseAmount = accountAmount = counterAmount = totalTdsValue;
          accountCurrency = counterCurrency = companyCurrency;
        } else {
          baseAmount = totalTdsFxValue;
          accountAmount = totalTdsFxValue;
          accountCurrency = companyCurrency;
          accountExchangeRate = 1;
          accountOriginalExchangeRate = 1;
          counterAmount = totalTdsValue;
          counterCurrency = invoiceCurrency;
          counterFxRate = fxRate;
          counteroriginalFxRate = originalFxRate;
        }
        await manager.save(
          manager.create(Transaction, {
            date: new Date(dto.invoiceDate),
            description: "",
            tax: tdsData,
            transactionTypeName,
            transactionTypeId,
            creditAmount: "0",
            debitAmount: baseAmount,
            journalBalance: invoiceTotalInRC,
            accountCurrency: accountCurrency,
            accountCurrencyAmount: accountAmount,
            accountExchangeRate: accountExchangeRate,
            accountOriginalExchangeRate: accountOriginalExchangeRate,
            counterCurrency: counterCurrency,
            counterCurrencyAmount: counterAmount,
            counterExchangeRate: counterFxRate,
            counterOriginalExchangeRate: counteroriginalFxRate,
          }),
        );
      }

      if (dto.isRoundOff && dto.roundoffTotal) {
        const miscIncAccount = await manager.findOne(AccountData, {
          where: {
            accountName: "Miscellaneous Income",
            accountType: AccountType.INCOME,
          },
        });

        if (!miscIncAccount) {
          throw new BadRequestException("Miscellaneous Income account missing");
        }
        let roundoffDebit = "0";
        let roundoffCredit = "0";
        let roundoffValue =
          parseFloat(dto.roundoffTotal) - parseFloat(dto.invoiceTotal);
        let fxRoundoffValue = (Math.abs(roundoffValue) * fxRate).toFixed(2);
        if (roundoffValue > 0) {
          roundoffCredit = fxRoundoffValue;
        } else {
          roundoffDebit = fxRoundoffValue;
          roundoffValue = Math.abs(roundoffValue);
        }

        let accountAmount, counterAmount;
        let counterFxRate = 1,
          counteroriginalFxRate = 1,
          accountExchangeRate = 1,
          accountOriginalExchangeRate = 1;
        let accountCurrency, counterCurrency;
        if (invoiceCurrency == companyCurrency) {
          accountAmount = counterAmount = fxRoundoffValue;
          accountCurrency = counterCurrency = companyCurrency;
        } else {
          accountAmount = fxRoundoffValue;
          accountCurrency = companyCurrency;
          accountExchangeRate = 1;
          accountOriginalExchangeRate = 1;
          counterAmount = roundoffValue;
          counterCurrency = invoiceCurrency;
          counterFxRate = fxRate;
          counteroriginalFxRate = originalFxRate;
        }
        await manager.save(Transaction, {
          date: new Date(dto.invoiceDate),
          description: "",
          account: miscIncAccount,
          transactionTypeName,
          transactionTypeId,
          creditAmount: roundoffCredit,
          debitAmount: roundoffDebit,
          journalBalance: invoiceTotalInRC,
          accountCurrency: accountCurrency,
          accountCurrencyAmount: accountAmount,
          accountExchangeRate: accountExchangeRate,
          accountOriginalExchangeRate: accountOriginalExchangeRate,
          counterCurrency: counterCurrency,
          counterCurrencyAmount: counterAmount,
          counterExchangeRate: counterFxRate,
          counterOriginalExchangeRate: counteroriginalFxRate,
        });
      }

      const accRecAccount = await manager.findOne(AccountData, {
        where: {
          accountName: "Accounts Receivable",
          accountType: AccountType.ASSET,
        },
      });

      if (!accRecAccount) {
        throw new BadRequestException("Accounts Receivable account missing");
      }
      let baseAmount, accountAmount, counterAmount;
      let counterFxRate = 1,
        counteroriginalFxRate = 1,
        accountExchangeRate = 1,
        accountOriginalExchangeRate = 1;
      let accountCurrency, counterCurrency;
      if (invoiceCurrency == companyCurrency) {
        baseAmount = accountAmount = counterAmount = invoiceTotalInRC;
        accountCurrency = counterCurrency = companyCurrency;
      } else {
        baseAmount = invoiceTotalInRC;
        accountAmount = invoiceTotalInRC;
        accountCurrency = companyCurrency;
        accountExchangeRate = 1;
        accountOriginalExchangeRate = 1;
        counterAmount = dto.roundoffTotal;
        counterCurrency = invoiceCurrency;
        counterFxRate = fxRate;
        counteroriginalFxRate = originalFxRate;
      }
      await manager.save(Transaction, {
        date: new Date(dto.invoiceDate),
        description: "",
        account: accRecAccount,
        contact: { id: dto.contactId },
        transactionTypeName,
        transactionTypeId,
        debitAmount: baseAmount,
        creditAmount: "0",
        journalBalance: invoiceTotalInRC,
        accountCurrency: accountCurrency,
        accountCurrencyAmount: accountAmount,
        accountExchangeRate: accountExchangeRate,
        accountOriginalExchangeRate: accountOriginalExchangeRate,
        counterCurrency: counterCurrency,
        counterCurrencyAmount: counterAmount,
        counterExchangeRate: counterFxRate,
        counterOriginalExchangeRate: counteroriginalFxRate,
      });
      const involvedEntities =
        await this.transactService.getInvolvedEntitiesPrefixed(
          manager,
          transactionTypeName,
          transactionTypeId,
        );
      await this.transactService.updateBalanceAllEntities(
        involvedEntities,
        manager,
        companyId,
      );
      return {
        data: {
          id: invoice.id,
          invoiceNo: invoice.invoiceNo,
          transactionTypeId,
        },
        change_of_data: {
          id: invoice.id,
          transactionTypeName,
          transactionTypeId,
          contactId: contactData.id,
          contactName: contactData.name,
          invoice_no: invoice.invoiceNo,
          module: "Transact",
          feature: "Invoice",
          status: "Create",
        },
      };
    });
  }

  async checkPaymentExists(manager: EntityManager, transactionTypeId: string) {
    const payments = await manager.find(Transaction, {
      where: { transactionTypeId, transactionTypeName: `invoice_payment` },
    });

    if (payments.length != 0) {
      throw new NotFoundException(`Invoice with payment cannot be updated`);
    }
  }

  async updateInvoice(
    dataSource: DataSource,
    dto: UpdateInvoiceDto,
    companyId: string,
    transactionTypeId: string,
  ) {
    return dataSource.transaction(async (manager) => {
      if (!transactionTypeId)
        throw new BadRequestException("TransactionTypeId is required");

      const invoice = await manager.findOne(Invoice, {
        where: { transactionTypeId },
        relations: ["discountAccount", "contact", "items", "items.transaction"],
      });
      if (!invoice) {
        throw new BadRequestException("Invoice not found");
      }
      const transactionTypeName = "invoice";
      await this.checkPaymentExists(manager, transactionTypeId);
      const fxRate = dto.fxRate;
      const originalFxRate = dto.originalFxRate;
      if (!fxRate) throw new BadRequestException(`Fx Rate is required`);
      if (!originalFxRate)
        throw new BadRequestException(`Original Fx Rate is required`);

      if (!dto.contactId) throw new BadRequestException("Contact is required");
      const contactData = await this.transactService.contactExists(
        manager,
        dto.contactId,
      );
      if (dto.discountAccountId) {
        await this.transactService.accountExists(
          manager,
          dto.discountAccountId,
        );
      }
      if (
        invoice.invoiceNo != dto.invoiceNo ||
        invoice.contact.id != dto.contactId
      ) {
        await this.invoiceNumberExists(
          dataSource,
          dto.contactId,
          dto.invoiceNo,
          invoice.id,
        );
      }

      let invoiceTotalInRC = "0";
      const companyCurrency = await this.transactService.getCompanyCurrency(
        manager,
        companyId,
      );
      if (dto.isRoundOff && dto.roundoffTotal) {
        invoiceTotalInRC = (parseFloat(dto.roundoffTotal) * fxRate).toFixed(2);
      } else {
        invoiceTotalInRC = (parseFloat(dto.invoiceTotal!) * fxRate).toFixed(2);
      }
      const existingEntities =
        await this.transactService.getInvolvedEntitiesPrefixed(
          manager,
          transactionTypeName,
          transactionTypeId,
        );
      const invoiceTxns = await manager.find(Transaction, {
        where: { transactionTypeId, transactionTypeName },
        relations: ["account", "tax"],
      });
      const oldDiscountTxn = invoiceTxns.find(
        (txn) =>
          txn.account?.id === invoice.discountAccount?.id &&
          txn.debitAmount !== "0",
      );
      const hasOldDiscount = !!invoice.discountAccount && !!oldDiscountTxn;

      const oldTdsTxn = invoiceTxns.find((txn) => txn.tax?.taxName === "TDS");
      const hasOldTds = !!invoice.hasTds && !!oldTdsTxn;

      const oldRoundoffTxn = invoiceTxns.find(
        (txn) =>
          txn.account?.accountName === "Miscellaneous Income" &&
          txn.account?.accountType === AccountType.INCOME,
      );
      const hasOldRoundoff =
        !!invoice.isRoundOff && !!invoice.roundoffTotal && !!oldRoundoffTxn;

      /** 1️⃣ UPDATE INVOICE */
      Object.assign(invoice, {
        invoiceNo: dto.invoiceNo,
        serviceStartDate: dto.serviceStartDate
          ? new Date(dto.serviceStartDate)
          : invoice.serviceStartDate,
        serviceEndDate: dto.serviceEndDate
          ? new Date(dto.serviceEndDate)
          : invoice.serviceEndDate,
        invoiceDate: dto.invoiceDate
          ? new Date(dto.invoiceDate)
          : invoice.invoiceDate,
        invoiceDueDate: dto.invoiceDueDate
          ? new Date(dto.invoiceDueDate)
          : invoice.invoiceDueDate,
        invoiceCurrency: dto.invoiceCurrency,
        notes: dto.notes,
        hasTds: dto.hasTds,
        tdsLevel: dto.tdsLevel ? dto.tdsLevel : null,
        tdsType: dto.tdsType ? dto.tdsType : null,
        tdsValue: dto.tdsValue ? dto.tdsValue : null,
        discountApplied: dto.discountApplied ? dto.discountApplied : null,
        discountType: dto.discountType ? dto.discountType : null,
        discountValue: dto.discountValue ? dto.discountValue : null,
        invoiceTotal: dto.invoiceTotal,
        isRoundOff: dto.isRoundOff,
        roundoffTotal: dto.roundoffTotal,
        contact: { id: dto.contactId },
        discountAccount: dto.discountAccountId
          ? { id: dto.discountAccountId }
          : null,
      });

      await manager.save(invoice);
      await manager
        .createQueryBuilder()
        .delete()
        .from(Transaction)
        .where("transaction_type_id = :transactionTypeId", {
          transactionTypeId,
        })
        .andWhere("transaction_type_name = :transactionTypeName", {
          transactionTypeName,
        })
        .andWhere("tax_id IS NOT NULL")
        .andWhere(
          "tax_id != (SELECT id FROM biz_books_tax_data WHERE tax_name = 'TDS')",
        )
        .execute();
      /** 2️⃣ UPDATE ITEMS + ITEM TRANSACTIONS */
      const existingItemsMap = new Map(
        invoice.items.map((item) => [item.id, item]),
      );

      const incomingItemIds = new Set<number>();
      for (const itemDto of dto.items) {
        /** 🔹 UPDATE */
        if (itemDto.itemId) {
          const item = existingItemsMap.get(itemDto.itemId);

          if (!item) {
            throw new BadRequestException(
              `Invoice item ${itemDto.itemId} not found`,
            );
          }

          incomingItemIds.add(item.id);

          Object.assign(item, {
            itemName: itemDto.itemName,
            hsnSac: itemDto.hsnSac,
            quantity: itemDto.quantity,
            unitPrice: itemDto.unitPrice,
            itemTotal: itemDto.itemTotal,
            itemTdsValue: itemDto.itemTdsValue ? itemDto.itemTdsValue : null,
            itemTdsType: itemDto.itemTdsType ? itemDto.itemTdsType : null,
            itemTax: itemDto.itemTax ? itemDto.itemTax : null,
            itemAccount: { id: itemDto.itemAccountId },
          });

          await manager.save(item);

          await this.updateItemTransaction(
            manager,
            item.transaction,
            item,
            dto,
            companyId,
            invoiceTotalInRC,
          );
        } else {
          /** 🔹 CREATE */
          const newItem = await manager.save(
            manager.create(InvoiceItem, {
              invoice,
              itemName: itemDto.itemName,
              hsnSac: itemDto.hsnSac,
              quantity: itemDto.quantity,
              unitPrice: itemDto.unitPrice,
              itemTotal: itemDto.itemTotal,
              itemTdsValue: itemDto.itemTdsValue,
              itemTdsType: itemDto.itemTdsType,
              itemTax: itemDto.itemTax,
              itemAccount: { id: itemDto.itemAccountId },
            }),
          );

          await this.createItemTransaction(
            manager,
            newItem,
            dto,
            companyId,
            transactionTypeId,
            transactionTypeName,
            invoiceTotalInRC,
          );

          incomingItemIds.add(newItem.id);
        }

        if (!itemDto.itemTax?.length) continue;

        for (const tax of itemDto.itemTax) {
          const taxData = await this.transactService.taxExists(
            manager,
            tax.taxId,
          );

          const itemTotal = parseFloat(itemDto.itemTotal);
          let taxAmount = 0;
          if (tax.type === "percent") {
            taxAmount = (itemTotal * tax.value) / 100;
          } else {
            taxAmount = tax.value;
          }
          let taxFxAmount = (taxAmount * fxRate).toFixed(2);
          let baseAmount, accountAmount, counterAmount;
          let counterFxRate = 1,
            counteroriginalFxRate = 1,
            accountExchangeRate = 1,
            accountOriginalExchangeRate = 1;
          let accountCurrency, counterCurrency;
          if (dto.invoiceCurrency == companyCurrency) {
            baseAmount = accountAmount = counterAmount = taxAmount;
            accountCurrency = counterCurrency = companyCurrency;
          } else {
            baseAmount = taxFxAmount;
            accountAmount = taxFxAmount;
            accountCurrency = companyCurrency;
            accountExchangeRate = 1;
            accountOriginalExchangeRate = 1;
            counterAmount = taxAmount;
            counterCurrency = dto.invoiceCurrency;
            counterFxRate = fxRate;
            counteroriginalFxRate = originalFxRate;
          }

          await manager.save(Transaction, {
            date: dto.invoiceDate
              ? new Date(dto.invoiceDate)
              : invoice.invoiceDate,
            description: "",
            tax: taxData,
            transactionTypeName,
            transactionTypeId,
            creditAmount: baseAmount,
            debitAmount: "0",
            journalBalance: invoiceTotalInRC,
            accountCurrency: accountCurrency,
            accountCurrencyAmount: accountAmount,
            accountExchangeRate: accountExchangeRate,
            accountOriginalExchangeRate: accountOriginalExchangeRate,
            counterCurrency: counterCurrency,
            counterCurrencyAmount: counterAmount,
            counterExchangeRate: counterFxRate,
            counterOriginalExchangeRate: counteroriginalFxRate,
          });
        }
      }

      for (const [itemId, item] of existingItemsMap.entries()) {
        if (!incomingItemIds.has(itemId)) {
          await manager.delete(InvoiceItem, item.id);
          if (item.transaction) {
            await manager.delete(Transaction, item.transaction.id);
          }
        }
      }

      await this.updateDiscountTransaction(
        manager,
        dto,
        companyId,
        hasOldDiscount,
        oldDiscountTxn!,
        transactionTypeId,
        transactionTypeName,
        invoiceTotalInRC,
      );
      await this.updateTdsTransaction(
        manager,
        dto,
        companyId,
        hasOldTds,
        oldTdsTxn!,
        transactionTypeId,
        transactionTypeName,
        invoiceTotalInRC,
      );
      await this.updateRoundoffTransaction(
        manager,
        dto,
        companyId,
        hasOldRoundoff,
        oldRoundoffTxn!,
        transactionTypeId,
        transactionTypeName,
        invoiceTotalInRC,
      );

      const accRecAccount = await manager.findOne(AccountData, {
        where: {
          accountName: "Accounts Receivable",
          accountType: AccountType.ASSET,
        },
      });

      if (!accRecAccount) {
        throw new BadRequestException("Accounts Receivable account missing");
      }
      const arTxn = invoiceTxns.find(
        (txn) => txn.account?.id === accRecAccount.id,
      );

      if (!arTxn) {
        throw new BadRequestException(
          "Accounts Receivable transaction missing for this invoice",
        );
      }

      const invoiceDate = dto.invoiceDate
        ? new Date(dto.invoiceDate)
        : invoice.invoiceDate;

      Object.assign(arTxn, {
        date: invoiceDate,
        contact: { id: dto.contactId },
        debitAmount: invoiceTotalInRC,
        creditAmount: "0",
        journalBalance: invoiceTotalInRC,
        accountCurrency: companyCurrency,
        accountCurrencyAmount: invoiceTotalInRC,
        accountExchangeRate: 1,
        accountOriginalExchangeRate: 1,
        counterCurrency: dto.invoiceCurrency,
        counterCurrencyAmount: dto.roundoffTotal,
        counterExchangeRate: fxRate.toString(),
        counterOriginalExchangeRate: originalFxRate.toString(),
      });

      await manager.save(arTxn);

      const updatedEntities =
        await this.transactService.getInvolvedEntitiesPrefixed(
          manager,
          transactionTypeName,
          transactionTypeId,
        );
      const involvedEntities = new Set<string>([
        ...existingEntities,
        ...updatedEntities,
      ]);
      await this.transactService.updateBalanceAllEntities(
        involvedEntities,
        manager,
        companyId,
      );
      return {
        data: {
          id: invoice.id,
          invoiceNo: invoice.invoiceNo,
          transactionTypeId,
        },
        change_of_data: {
          id: invoice.id,
          transactionTypeName,
          transactionTypeId,
          contactId: contactData.id,
          contactName: contactData.name,
          invoice_no: invoice.invoiceNo,
          module: "Transact",
          feature: "Invoice",
          status: "Update",
        },
      };
    });
  }

  private async updateItemTransaction(
    manager: EntityManager,
    txn: Transaction,
    item: InvoiceItem,
    dto: UpdateInvoiceDto,
    companyId: string,
    invoiceTotalInRC: string,
  ) {
    const companyCurrency = await this.transactService.getCompanyCurrency(
      manager,
      companyId,
    );
    const fxRate = dto.fxRate;
    const originalFxRate = dto.originalFxRate;
    if (!fxRate) throw new BadRequestException(`Fx Rate is required`);
    if (!originalFxRate)
      throw new BadRequestException(`Original Fx Rate is required`);
    if (!dto.invoiceDate)
      throw new BadRequestException(`Invoice date is required`);

    const accountData = await this.transactService.accountExists(
      manager,
      item.itemAccount.id,
    );

    const itemTotal = parseFloat(item.itemTotal);
    const fxItemTotal = (itemTotal * fxRate).toFixed(2);

    let baseAmount, accountAmount, counterAmount;
    let counterFxRate = 1,
      counteroriginalFxRate = 1,
      accountExchangeRate = 1,
      accountOriginalExchangeRate = 1;
    let accountCurrency, counterCurrency;

    if (dto.invoiceCurrency == companyCurrency) {
      if (accountData.accountCurrency == companyCurrency) {
        baseAmount = accountAmount = counterAmount = item.itemTotal;
        accountCurrency = counterCurrency = companyCurrency;
      } else {
        throw new BadRequestException(
          "Account must be of company or invoice currency",
        );
      }
    } else {
      if (accountData.accountCurrency == companyCurrency) {
        baseAmount = fxItemTotal;
        accountAmount = fxItemTotal;
        accountCurrency = accountData.accountCurrency;
        accountExchangeRate = 1;
        accountOriginalExchangeRate = 1;
        counterAmount = item.itemTotal;
        counterCurrency = dto.invoiceCurrency;
        counterFxRate = fxRate;
        counteroriginalFxRate = originalFxRate;
      } else if (accountData.accountCurrency == dto.invoiceCurrency) {
        baseAmount = fxItemTotal;
        accountAmount = item.itemTotal;
        accountCurrency = accountData.accountCurrency;
        accountExchangeRate = fxRate;
        accountOriginalExchangeRate = originalFxRate;
        counterAmount = item.itemTotal;
        counterCurrency = dto.invoiceCurrency;
        counterFxRate = 1;
        counteroriginalFxRate = 1;
      } else {
        throw new BadRequestException(
          "Account must be of company or invoice currency",
        );
      }
    }

    Object.assign(txn, {
      date: new Date(dto.invoiceDate),
      account: { id: item.itemAccount.id },
      creditAmount: baseAmount,
      debitAmount: "0",
      journalBalance: invoiceTotalInRC,
      accountCurrency: accountCurrency,
      accountCurrencyAmount: accountAmount,
      accountExchangeRate: accountExchangeRate,
      accountOriginalExchangeRate: accountOriginalExchangeRate,
      counterCurrency: counterCurrency,
      counterCurrencyAmount: counterAmount,
      counterExchangeRate: counterFxRate,
      counterOriginalExchangeRate: counteroriginalFxRate,
    });

    await manager.save(txn);
  }

  private async createItemTransaction(
    manager: EntityManager,
    item: InvoiceItem,
    dto: UpdateInvoiceDto,
    companyId: string,
    transactionTypeId: string,
    transactionTypeName: string,
    invoiceTotalInRC: string,
  ) {
    const companyCurrency = await this.transactService.getCompanyCurrency(
      manager,
      companyId,
    );
    const accountData = await this.transactService.accountExists(
      manager,
      item.itemAccount.id,
    );

    const fxRate = dto.fxRate;
    const originalFxRate = dto.originalFxRate;
    if (!fxRate) throw new BadRequestException(`Fx Rate is required`);
    if (!originalFxRate)
      throw new BadRequestException(`Original Fx Rate is required`);
    if (!dto.invoiceDate)
      throw new BadRequestException(`Invoice date is required`);

    const itemTotal = parseFloat(item.itemTotal);
    const fxItemTotal = (itemTotal * fxRate).toFixed(2);

    let baseAmount, accountAmount, counterAmount;
    let counterFxRate = 1,
      counteroriginalFxRate = 1,
      accountExchangeRate = 1,
      accountOriginalExchangeRate = 1;
    let accountCurrency, counterCurrency;

    if (dto.invoiceCurrency == companyCurrency) {
      if (accountData.accountCurrency == companyCurrency) {
        baseAmount = accountAmount = counterAmount = item.itemTotal;
        accountCurrency = counterCurrency = companyCurrency;
      } else {
        throw new BadRequestException(
          "Account must be of company or invoice currency",
        );
      }
    } else {
      if (accountData.accountCurrency == companyCurrency) {
        baseAmount = fxItemTotal;
        accountAmount = fxItemTotal;
        accountCurrency = accountData.accountCurrency;
        accountExchangeRate = 1;
        accountOriginalExchangeRate = 1;
        counterAmount = item.itemTotal;
        counterCurrency = dto.invoiceCurrency;
        counterFxRate = fxRate;
        counteroriginalFxRate = originalFxRate;
      } else if (accountData.accountCurrency == dto.invoiceCurrency) {
        baseAmount = fxItemTotal;
        accountAmount = item.itemTotal;
        accountCurrency = accountData.accountCurrency;
        accountExchangeRate = fxRate;
        accountOriginalExchangeRate = originalFxRate;
        counterAmount = item.itemTotal;
        counterCurrency = dto.invoiceCurrency;
        counterFxRate = 1;
        counteroriginalFxRate = 1;
      } else {
        throw new BadRequestException(
          "Account must be of company or invoice currency",
        );
      }
    }

    const txn = await manager.save(
      manager.create(Transaction, {
        date: new Date(dto.invoiceDate),
        description: "",
        account: { id: item.itemAccount.id },
        transactionTypeName,
        transactionTypeId,
        creditAmount: baseAmount,
        debitAmount: "0",
        journalBalance: invoiceTotalInRC,
        accountCurrency: accountCurrency,
        accountCurrencyAmount: accountAmount,
        accountExchangeRate: accountExchangeRate,
        accountOriginalExchangeRate: accountOriginalExchangeRate,
        counterCurrency: counterCurrency,
        counterCurrencyAmount: counterAmount,
        counterExchangeRate: counterFxRate,
        counterOriginalExchangeRate: counteroriginalFxRate,
      }),
    );

    item.transaction = txn;
    await manager.save(item);
  }

  private async updateDiscountTransaction(
    manager: EntityManager,
    dto: UpdateInvoiceDto,
    companyId: string,
    hasOldDiscount: boolean,
    oldDiscountTxn: Transaction,
    transactionTypeId: string,
    transactionTypeName: string,
    invoiceTotalInRC: string,
  ) {
    const fxRate = dto.fxRate;
    const originalFxRate = dto.originalFxRate;
    const invoiceCurrency = dto.invoiceCurrency;
    if (!fxRate) throw new BadRequestException(`Fx Rate is required`);
    if (!originalFxRate)
      throw new BadRequestException(`Original Fx Rate is required`);
    const hasNewDiscount =
      dto.hasDiscount && dto.totalDiscountValue && dto.discountAccountId;
    if (!hasOldDiscount && !hasNewDiscount) {
      return;
    } else if (!hasOldDiscount && hasNewDiscount) {
      // 2️⃣ Old invoice no discount, DTO has discount → create transaction
      const discountAccount = await this.transactService.accountExists(
        manager,
        dto.discountAccountId!,
      );
      const discountValue = parseFloat(dto.totalDiscountValue!);
      const companyCurrency = await this.transactService.getCompanyCurrency(
        manager,
        companyId,
      );

      let discountFxValue = (discountValue * fxRate).toFixed(2);

      let baseAmount, accountAmount, counterAmount;
      let counterFxRate = 1,
        counteroriginalFxRate = 1,
        accountExchangeRate = 1,
        accountOriginalExchangeRate = 1;
      let accountCurrency, counterCurrency;
      if (invoiceCurrency == companyCurrency) {
        if (discountAccount.accountCurrency == companyCurrency) {
          baseAmount = accountAmount = counterAmount = discountValue;
          accountCurrency = counterCurrency = companyCurrency;
        } else {
          throw new BadRequestException(
            "Account must be of company or invoice currency",
          );
        }
      } else {
        if (discountAccount.accountCurrency == companyCurrency) {
          baseAmount = discountFxValue;
          accountAmount = discountFxValue;
          accountCurrency = discountAccount.accountCurrency;
          accountExchangeRate = 1;
          accountOriginalExchangeRate = 1;
          counterAmount = discountValue;
          counterCurrency = invoiceCurrency;
          counterFxRate = fxRate;
          counteroriginalFxRate = originalFxRate;
        } else if (discountAccount.accountCurrency == invoiceCurrency) {
          baseAmount = discountFxValue;
          accountAmount = discountValue;
          accountCurrency = discountAccount.accountCurrency;
          accountExchangeRate = fxRate;
          accountOriginalExchangeRate = originalFxRate;
          counterAmount = discountValue;
          counterCurrency = invoiceCurrency;
          counterFxRate = 1;
          counteroriginalFxRate = 1;
        } else {
          throw new BadRequestException(
            "Account must be of company or invoice currency",
          );
        }
      }

      await manager.save(
        manager.create(Transaction, {
          date: new Date(dto.invoiceDate!),
          description: "",
          account: discountAccount,
          transactionTypeName: transactionTypeName,
          transactionTypeId: transactionTypeId,
          debitAmount: baseAmount,
          creditAmount: "0",
          journalBalance: invoiceTotalInRC,
          accountCurrency: accountCurrency,
          accountCurrencyAmount: accountAmount,
          accountExchangeRate: accountExchangeRate,
          accountOriginalExchangeRate: accountOriginalExchangeRate,
          counterCurrency: counterCurrency,
          counterCurrencyAmount: counterAmount,
          counterExchangeRate: counterFxRate,
          counterOriginalExchangeRate: counteroriginalFxRate,
        }),
      );
    } else if (hasOldDiscount && !hasNewDiscount) {
      // 3️⃣ Old invoice has discount, DTO has no discount → delete old transaction
      if (oldDiscountTxn) {
        await manager.delete(Transaction, oldDiscountTxn.id);
      }
    } else if (hasOldDiscount && hasNewDiscount) {
      // 4️⃣ Old invoice has discount, DTO has discount → update transaction
      const discountAccount = await this.transactService.accountExists(
        manager,
        dto.discountAccountId!,
      );
      const discountValue = parseFloat(dto.totalDiscountValue!);
      const companyCurrency = await this.transactService.getCompanyCurrency(
        manager,
        companyId,
      );
      let discountFxValue = (discountValue * fxRate).toFixed(2);

      let baseAmount, accountAmount, counterAmount;
      let counterFxRate = 1,
        counteroriginalFxRate = 1,
        accountExchangeRate = 1,
        accountOriginalExchangeRate = 1;
      let accountCurrency, counterCurrency;
      if (invoiceCurrency == companyCurrency) {
        if (discountAccount.accountCurrency == companyCurrency) {
          baseAmount = accountAmount = counterAmount = discountValue;
          accountCurrency = counterCurrency = companyCurrency;
        } else {
          throw new BadRequestException(
            "Account must be of company or invoice currency",
          );
        }
      } else {
        if (discountAccount.accountCurrency == companyCurrency) {
          baseAmount = discountFxValue;
          accountAmount = discountFxValue;
          accountCurrency = discountAccount.accountCurrency;
          accountExchangeRate = 1;
          accountOriginalExchangeRate = 1;
          counterAmount = discountValue;
          counterCurrency = invoiceCurrency;
          counterFxRate = fxRate;
          counteroriginalFxRate = originalFxRate;
        } else if (discountAccount.accountCurrency == invoiceCurrency) {
          baseAmount = discountFxValue;
          accountAmount = discountValue;
          accountCurrency = discountAccount.accountCurrency;
          accountExchangeRate = fxRate;
          accountOriginalExchangeRate = originalFxRate;
          counterAmount = discountValue;
          counterCurrency = invoiceCurrency;
          counterFxRate = 1;
          counteroriginalFxRate = 1;
        } else {
          throw new BadRequestException(
            "Account must be of company or invoice currency",
          );
        }
      }

      Object.assign(oldDiscountTxn, {
        date: new Date(dto.invoiceDate!),
        account: discountAccount,
        debitAmount: baseAmount,
        creditAmount: "0",
        journalBalance: invoiceTotalInRC,
        accountCurrency: accountCurrency,
        accountCurrencyAmount: accountAmount,
        accountExchangeRate: accountExchangeRate,
        accountOriginalExchangeRate: accountOriginalExchangeRate,
        counterCurrency: counterCurrency,
        counterCurrencyAmount: counterAmount,
        counterExchangeRate: counterFxRate,
        counterOriginalExchangeRate: counteroriginalFxRate,
      });

      await manager.save(oldDiscountTxn);
    }
  }

  private async updateTdsTransaction(
    manager: EntityManager,
    dto: UpdateInvoiceDto,
    companyId: string,
    hasOldTds: boolean,
    oldTdsTxn: Transaction,
    transactionTypeId: string,
    transactionTypeName: string,
    invoiceTotalInRC: string,
  ) {
    const fxRate = dto.fxRate;
    const originalFxRate = dto.originalFxRate;
    const invoiceCurrency = dto.invoiceCurrency;
    if (!fxRate) throw new BadRequestException(`Fx Rate is required`);
    if (!originalFxRate)
      throw new BadRequestException(`Original Fx Rate is required`);
    const hasNewTds = dto.hasTds && dto.totalTdsValue;

    if (!hasOldTds && !hasNewTds) {
      return;
    } else if (!hasOldTds && hasNewTds) {
      // 2️⃣ Old invoice no TDS, DTO has TDS → create transaction
      const tdsData = await manager.findOne(Tax, { where: { taxName: "TDS" } });
      if (!tdsData) throw new BadRequestException("TDS Tax missing");

      const companyCurrency = await this.transactService.getCompanyCurrency(
        manager,
        companyId,
      );
      let totalTdsValue = parseFloat(dto.totalTdsValue!);
      let totalTdsFxValue = (parseFloat(dto.totalTdsValue!) * fxRate).toFixed(
        2,
      );

      let baseAmount, accountAmount, counterAmount;
      let counterFxRate = 1,
        counteroriginalFxRate = 1,
        accountExchangeRate = 1,
        accountOriginalExchangeRate = 1;
      let accountCurrency, counterCurrency;
      if (invoiceCurrency == companyCurrency) {
        baseAmount = accountAmount = counterAmount = totalTdsValue;
        accountCurrency = counterCurrency = companyCurrency;
      } else {
        baseAmount = totalTdsFxValue;
        accountAmount = totalTdsFxValue;
        accountCurrency = companyCurrency;
        accountExchangeRate = 1;
        accountOriginalExchangeRate = 1;
        counterAmount = totalTdsValue;
        counterCurrency = invoiceCurrency;
        counterFxRate = fxRate;
        counteroriginalFxRate = originalFxRate;
      }
      await manager.save(
        manager.create(Transaction, {
          date: new Date(dto.invoiceDate!),
          description: "",
          tax: tdsData,
          transactionTypeName: transactionTypeName,
          transactionTypeId: transactionTypeId,
          debitAmount: baseAmount,
          creditAmount: "0",
          journalBalance: invoiceTotalInRC,
          accountCurrency: accountCurrency,
          accountCurrencyAmount: accountAmount,
          accountExchangeRate: accountExchangeRate,
          accountOriginalExchangeRate: accountOriginalExchangeRate,
          counterCurrency: counterCurrency,
          counterCurrencyAmount: counterAmount,
          counterExchangeRate: counterFxRate,
          counterOriginalExchangeRate: counteroriginalFxRate,
        }),
      );
    } else if (hasOldTds && !hasNewTds) {
      // 3️⃣ Old invoice has TDS, DTO has no TDS → delete transaction
      if (oldTdsTxn) {
        await manager.delete(Transaction, oldTdsTxn.id);
      }
    } else if (hasOldTds && hasNewTds) {
      // 4️⃣ Old invoice has TDS, DTO has TDS → update transaction
      const tdsData = await manager.findOne(Tax, { where: { taxName: "TDS" } });
      if (!tdsData) throw new BadRequestException("TDS Tax missing");

      const companyCurrency = await this.transactService.getCompanyCurrency(
        manager,
        companyId,
      );
      let totalTdsValue = parseFloat(dto.totalTdsValue!);
      let totalTdsFxValue = (parseFloat(dto.totalTdsValue!) * fxRate).toFixed(
        2,
      );

      let baseAmount, accountAmount, counterAmount;
      let counterFxRate = 1,
        counteroriginalFxRate = 1,
        accountExchangeRate = 1,
        accountOriginalExchangeRate = 1;
      let accountCurrency, counterCurrency;
      if (invoiceCurrency == companyCurrency) {
        baseAmount = accountAmount = counterAmount = totalTdsValue;
        accountCurrency = counterCurrency = companyCurrency;
      } else {
        baseAmount = totalTdsFxValue;
        accountAmount = totalTdsFxValue;
        accountCurrency = companyCurrency;
        accountExchangeRate = 1;
        accountOriginalExchangeRate = 1;
        counterAmount = totalTdsValue;
        counterCurrency = invoiceCurrency;
        counterFxRate = fxRate;
        counteroriginalFxRate = originalFxRate;
      }
      Object.assign(oldTdsTxn, {
        date: new Date(dto.invoiceDate!),
        tax: tdsData,
        debitAmount: baseAmount,
        creditAmount: "0",
        journalBalance: invoiceTotalInRC,
        accountCurrency: accountCurrency,
        accountCurrencyAmount: accountAmount,
        accountExchangeRate: accountExchangeRate,
        accountOriginalExchangeRate: accountOriginalExchangeRate,
        counterCurrency: counterCurrency,
        counterCurrencyAmount: counterAmount,
        counterExchangeRate: counterFxRate,
        counterOriginalExchangeRate: counteroriginalFxRate,
      });

      await manager.save(oldTdsTxn);
    }
  }

  private async updateRoundoffTransaction(
    manager: EntityManager,
    dto: UpdateInvoiceDto,
    companyId: string,
    hasOldRoundoff: boolean,
    oldRoundoffTxn: Transaction,
    transactionTypeId: string,
    transactionTypeName: string,
    invoiceTotalInRC: string,
  ) {
    const fxRate = dto.fxRate;
    const originalFxRate = dto.originalFxRate;
    const invoiceCurrency = dto.invoiceCurrency;
    if (!fxRate) throw new BadRequestException(`Fx Rate is required`);
    if (!originalFxRate)
      throw new BadRequestException(`Original Fx Rate is required`);

    const hasNewRoundoff = !!dto.isRoundOff && !!dto.roundoffTotal;

    if (!hasOldRoundoff && !hasNewRoundoff) {
      return;
    } else if (!hasOldRoundoff && hasNewRoundoff) {
      // 2️⃣ No old, new → create transaction
      const miscIncAccount = await manager.findOne(AccountData, {
        where: {
          accountName: "Miscellaneous Income",
          accountType: AccountType.INCOME,
        },
      });
      if (!miscIncAccount)
        throw new BadRequestException("Miscellaneous Income account missing");

      let roundoffValue =
        parseFloat(dto.roundoffTotal!) - parseFloat(dto.invoiceTotal!);
      const fxRoundoffValue = (Math.abs(roundoffValue) * fxRate).toFixed(2);

      const creditAmount = roundoffValue > 0 ? fxRoundoffValue : "0";
      const debitAmount = roundoffValue < 0 ? fxRoundoffValue : "0";
      roundoffValue = Math.abs(roundoffValue);
      const companyCurrency = await this.transactService.getCompanyCurrency(
        manager,
        companyId,
      );
      let accountAmount, counterAmount;
      let counterFxRate = 1,
        counteroriginalFxRate = 1,
        accountExchangeRate = 1,
        accountOriginalExchangeRate = 1;
      let accountCurrency, counterCurrency;
      if (invoiceCurrency == companyCurrency) {
        accountAmount = counterAmount = fxRoundoffValue;
        accountCurrency = counterCurrency = companyCurrency;
      } else {
        accountAmount = fxRoundoffValue;
        accountCurrency = companyCurrency;
        accountExchangeRate = 1;
        accountOriginalExchangeRate = 1;
        counterAmount = roundoffValue;
        counterCurrency = invoiceCurrency;
        counterFxRate = fxRate;
        counteroriginalFxRate = originalFxRate;
      }
      await manager.save(Transaction, {
        date: new Date(dto.invoiceDate!),
        description: "",
        account: miscIncAccount,
        contact: { id: dto.contactId },
        transactionTypeName: transactionTypeName,
        transactionTypeId: transactionTypeId,
        creditAmount,
        debitAmount,
        journalBalance: invoiceTotalInRC,
        accountCurrency: accountCurrency,
        accountCurrencyAmount: accountAmount,
        accountExchangeRate: accountExchangeRate,
        accountOriginalExchangeRate: accountOriginalExchangeRate,
        counterCurrency: counterCurrency,
        counterCurrencyAmount: counterAmount,
        counterExchangeRate: counterFxRate,
        counterOriginalExchangeRate: counteroriginalFxRate,
      });
    } else if (hasOldRoundoff && !hasNewRoundoff) {
      // 3️⃣ Old exists, new missing → delete transaction
      if (oldRoundoffTxn) await manager.delete(Transaction, oldRoundoffTxn.id);
    } else if (hasOldRoundoff && hasNewRoundoff) {
      // 4️⃣ Old exists, new exists → update transaction
      const miscIncAccount = await manager.findOne(AccountData, {
        where: {
          accountName: "Miscellaneous Income",
          accountType: AccountType.INCOME,
        },
      });
      if (!miscIncAccount)
        throw new BadRequestException("Miscellaneous Income account missing");

      let roundoffValue =
        parseFloat(dto.roundoffTotal!) - parseFloat(dto.invoiceTotal!);
      const fxRoundoffValue = (Math.abs(roundoffValue) * fxRate).toFixed(2);
      const creditAmount = roundoffValue > 0 ? fxRoundoffValue : "0";
      const debitAmount = roundoffValue < 0 ? fxRoundoffValue : "0";
      roundoffValue = Math.abs(roundoffValue);
      const companyCurrency = await this.transactService.getCompanyCurrency(
        manager,
        companyId,
      );
      let accountAmount, counterAmount;
      let counterFxRate = 1,
        counteroriginalFxRate = 1,
        accountExchangeRate = 1,
        accountOriginalExchangeRate = 1;
      let accountCurrency, counterCurrency;
      if (invoiceCurrency == companyCurrency) {
        accountAmount = counterAmount = fxRoundoffValue;
        accountCurrency = counterCurrency = companyCurrency;
      } else {
        accountAmount = fxRoundoffValue;
        accountCurrency = companyCurrency;
        accountExchangeRate = 1;
        accountOriginalExchangeRate = 1;
        counterAmount = roundoffValue;
        counterCurrency = invoiceCurrency;
        counterFxRate = fxRate;
        counteroriginalFxRate = originalFxRate;
      }
      Object.assign(oldRoundoffTxn, {
        date: new Date(dto.invoiceDate!),
        account: miscIncAccount,
        creditAmount,
        debitAmount,
        journalBalance: invoiceTotalInRC,
        accountCurrency: accountCurrency,
        accountCurrencyAmount: accountAmount,
        accountExchangeRate: accountExchangeRate,
        accountOriginalExchangeRate: accountOriginalExchangeRate,
        counterCurrency: counterCurrency,
        counterCurrencyAmount: counterAmount,
        counterExchangeRate: counterFxRate,
        counterOriginalExchangeRate: counteroriginalFxRate,
      });

      await manager.save(oldRoundoffTxn);
    }
  }

  async receiveInvoicePayment(
    dataSource: DataSource,
    dto: InvoicePaymentDto,
    companyId: string,
  ) {
    return dataSource.transaction(async (manager) => {
      const transactionTypeName = "invoice_payment";
      const companyCurrency = await this.transactService.getCompanyCurrency(
        manager,
        companyId,
      );

      const invoice = await manager.findOne(Invoice, {
        where: { transactionTypeId: dto.transactionTypeId },
      });
      if (!invoice) {
        throw new BadRequestException("Invoice not found");
      }
      const invoiceCurrency = invoice.invoiceCurrency;

      const invoiceArTxn = await this.fetchInvoiceReceivableTxn(
        manager,
        dto.transactionTypeId,
      );

      const contact = invoiceArTxn.contact;
      const paymentAccount = await this.transactService.accountExists(
        manager,
        dto.paymentAccountId,
      );
      if (
        paymentAccount.accountType == AccountType.INCOME ||
        paymentAccount.accountType == AccountType.EXPENSE
      ) {
        throw new BadRequestException(
          "Payment Account must be of type Asset or Liability",
        );
      }
      if (
        (paymentAccount.accountName == "Accounts Receivable" &&
          paymentAccount.accountType == AccountType.ASSET) ||
        (paymentAccount.accountName == "Accounts Payable" &&
          paymentAccount.accountType == AccountType.LIABILITY)
      ) {
        throw new BadRequestException(
          "Payment Account cannot be Accounts Receivable or Accounts Payable",
        );
      }
      const paymentId = await this.transactService.generateTransactionTypeId();
      const paymentAmount = parseFloat(dto.paymentAmount);
      let fxRate = dto.fxRate;
      let originalFxRate = dto.originalFxRate;

      if (paymentAccount.accountCurrency == invoiceCurrency) {
        fxRate = invoiceArTxn.counterExchangeRate!;
        originalFxRate = invoiceArTxn.counterOriginalExchangeRate!;
      }
      const fxAmount = paymentAmount * fxRate;
      let baseAmount, accountAmount, counterAmount;
      let counterFxRate = 1,
        counteroriginalFxRate = 1,
        accountExchangeRate = 1,
        accountOriginalExchangeRate = 1;
      let accountCurrency, counterCurrency;

      if (invoiceCurrency == companyCurrency) {
        if (paymentAccount.accountCurrency == companyCurrency) {
          baseAmount = accountAmount = counterAmount = paymentAmount;
          accountCurrency = counterCurrency = companyCurrency;
        } else {
          baseAmount = paymentAmount;
          accountAmount = dto.amountInAccCurr ? dto.amountInAccCurr : fxAmount;
          accountCurrency = paymentAccount.accountCurrency;
          accountExchangeRate = dto.accountToInvoiceFXRate
            ? dto.accountToInvoiceFXRate
            : 1 / fxRate;
          accountOriginalExchangeRate = dto.accountToInvoiceOriginalFXRate
            ? dto.accountToInvoiceOriginalFXRate
            : 1 / originalFxRate;
          counterAmount = paymentAmount;
          counterCurrency = companyCurrency;
          counterFxRate = fxRate;
          counteroriginalFxRate = originalFxRate;
        }
      } else {
        if (paymentAccount.accountCurrency == companyCurrency) {
          baseAmount = dto.amountInAccCurr ? dto.amountInAccCurr : fxAmount;
          accountAmount = dto.amountInAccCurr ? dto.amountInAccCurr : fxAmount;
          accountCurrency = paymentAccount.accountCurrency;
          accountExchangeRate = 1;
          accountOriginalExchangeRate = 1;
          counterAmount = paymentAmount;
          counterCurrency = invoiceCurrency;
          counterFxRate = fxRate;
          counteroriginalFxRate = originalFxRate;
        } else if (paymentAccount.accountCurrency == invoiceCurrency) {
          baseAmount = fxAmount;
          accountAmount = paymentAmount;
          accountCurrency = paymentAccount.accountCurrency;
          accountExchangeRate = invoiceArTxn.counterExchangeRate!; // invoice raised fxrate
          accountOriginalExchangeRate =
            invoiceArTxn.counterOriginalExchangeRate!;
          counterAmount = paymentAmount;
          counterCurrency = invoiceCurrency;
          counterFxRate = 1;
          counteroriginalFxRate = 1;
        } else {
          throw new BadRequestException(
            "Account must be of company or invoice currency",
          );
        }
      }

      await manager.save(Transaction, {
        date: new Date(dto.paymentDate),
        description: dto.notes ?? "",
        account: paymentAccount,
        transactionTypeName,
        transactionTypeId: dto.transactionTypeId,
        paymentId,
        debitAmount: baseAmount,
        creditAmount: "0",
        journalBalance: baseAmount,
        accountCurrency: accountCurrency,
        accountCurrencyAmount: accountAmount,
        accountExchangeRate: accountExchangeRate,
        accountOriginalExchangeRate: accountOriginalExchangeRate,
        counterCurrency: counterCurrency,
        counterCurrencyAmount: counterAmount,
        counterExchangeRate: counterFxRate,
        counterOriginalExchangeRate: counteroriginalFxRate,
      });

      const accReceivable = await manager.findOne(AccountData, {
        where: {
          accountName: "Accounts Receivable",
          accountType: AccountType.ASSET,
        },
      });

      if (!accReceivable) {
        throw new BadRequestException("Accounts Receivable missing");
      }
      ((counterFxRate = 1),
        (counteroriginalFxRate = 1),
        (accountExchangeRate = 1),
        (accountOriginalExchangeRate = 1));
      if (invoiceCurrency == companyCurrency) {
        baseAmount = accountAmount = counterAmount = paymentAmount;
        accountCurrency = counterCurrency = companyCurrency;
      } else {
        baseAmount = fxAmount;
        accountAmount = fxAmount;
        accountCurrency = companyCurrency;
        accountExchangeRate = 1;
        accountOriginalExchangeRate = 1;
        counterAmount = paymentAmount;
        counterCurrency = invoiceCurrency;
        counterFxRate = fxRate;
        counteroriginalFxRate = originalFxRate;
      }
      await manager.save(Transaction, {
        date: new Date(dto.paymentDate),
        description: dto.notes ?? "",
        account: accReceivable,
        contact,
        transactionTypeName,
        transactionTypeId: dto.transactionTypeId,
        paymentId,
        debitAmount: "0",
        creditAmount: baseAmount,
        journalBalance: baseAmount,
        accountCurrency: accountCurrency,
        accountCurrencyAmount: accountAmount,
        accountExchangeRate: accountExchangeRate,
        accountOriginalExchangeRate: accountOriginalExchangeRate,
        counterCurrency: counterCurrency,
        counterCurrencyAmount: counterAmount,
        counterExchangeRate: counterFxRate,
        counterOriginalExchangeRate: counteroriginalFxRate,
      });

      const invoiceFxRate = Number(invoiceArTxn.counterExchangeRate);
      const invoiceBaseAmount = paymentAmount * invoiceFxRate;
      const fxGainLoss = Number(
        (parseFloat(baseAmount) - invoiceBaseAmount).toFixed(2),
      );

      if (fxGainLoss !== 0) {
        const fxAccount = await manager.findOne(AccountData, {
          where: {
            accountName: "FX Gain/ Loss",
            accountType: AccountType.EXPENSE,
          },
        });

        if (!fxAccount) {
          throw new BadRequestException("FX Gain/Loss account missing");
        }

        if (fxGainLoss < 0) {
          await manager.save(Transaction, {
            date: new Date(dto.paymentDate),
            description: dto.notes ?? "",
            account: accReceivable,
            contact,
            transactionTypeName,
            transactionTypeId: dto.transactionTypeId,
            paymentId,
            debitAmount: "0",
            creditAmount: Math.abs(fxGainLoss).toFixed(2),
            journalBalance: baseAmount,
            accountCurrency: companyCurrency,
            accountCurrencyAmount: Math.abs(fxGainLoss).toFixed(2),
            accountExchangeRate: 1,
            accountOriginalExchangeRate: 1,
            counterCurrency: companyCurrency,
            counterCurrencyAmount: Math.abs(fxGainLoss).toFixed(2),
            counterExchangeRate: 1,
            counterOriginalExchangeRate: 1,
          });

          await manager.save(Transaction, {
            date: new Date(dto.paymentDate),
            description: dto.notes ?? "",
            account: fxAccount,
            transactionTypeName,
            transactionTypeId: dto.transactionTypeId,
            paymentId,
            debitAmount: Math.abs(fxGainLoss).toFixed(2),
            creditAmount: "0",
            journalBalance: baseAmount,
            accountCurrency: companyCurrency,
            accountCurrencyAmount: Math.abs(fxGainLoss).toFixed(2),
            accountExchangeRate: 1,
            accountOriginalExchangeRate: 1,
            counterCurrency: companyCurrency,
            counterCurrencyAmount: Math.abs(fxGainLoss).toFixed(2),
            counterExchangeRate: 1,
            counterOriginalExchangeRate: 1,
          });
        }

        if (fxGainLoss > 0) {
          await manager.save(Transaction, {
            date: new Date(dto.paymentDate),
            description: dto.notes ?? "",
            account: accReceivable,
            contact,
            transactionTypeName,
            transactionTypeId: dto.transactionTypeId,
            paymentId,
            debitAmount: Math.abs(fxGainLoss).toFixed(2),
            creditAmount: "0",
            journalBalance: baseAmount,
            accountCurrency: companyCurrency,
            accountCurrencyAmount: Math.abs(fxGainLoss).toFixed(2),
            accountExchangeRate: 1,
            accountOriginalExchangeRate: 1,
            counterCurrency: companyCurrency,
            counterCurrencyAmount: Math.abs(fxGainLoss).toFixed(2),
            counterExchangeRate: 1,
            counterOriginalExchangeRate: 1,
          });

          await manager.save(Transaction, {
            date: new Date(dto.paymentDate),
            description: dto.notes ?? "",
            account: fxAccount,
            transactionTypeName,
            transactionTypeId: dto.transactionTypeId,
            paymentId,
            debitAmount: "0",
            creditAmount: Math.abs(fxGainLoss).toFixed(2),
            journalBalance: baseAmount,
            accountCurrency: companyCurrency,
            accountCurrencyAmount: Math.abs(fxGainLoss).toFixed(2),
            accountExchangeRate: 1,
            accountOriginalExchangeRate: 1,
            counterCurrency: companyCurrency,
            counterCurrencyAmount: Math.abs(fxGainLoss).toFixed(2),
            counterExchangeRate: 1,
            counterOriginalExchangeRate: 1,
          });
        }
      }

      const involvedEntities =
        await this.transactService.getInvolvedEntitiesPrefixed(
          manager,
          transactionTypeName,
          dto.transactionTypeId,
        );

      await this.transactService.updateBalanceAllEntities(
        involvedEntities,
        manager,
        companyId,
      );

      return {
        data: {
          transactionTypeName,
          transactionTypeId: dto.transactionTypeId,
          paymentId,
        },
        change_of_data: {
          transactionTypeName,
          transactionTypeId: dto.transactionTypeId,
          paymentId,
          contactId: contact.id,
          contactName: contact.name,
          invoice_no: invoice.invoiceNo,
          module: "Transact",
          feature: "Invoice Payment",
          status: "Create",
        },
      };
    });
  }

  async editInvoicePayment(
    dataSource: DataSource,
    dto: InvoicePaymentDto,
    companyId: string,
  ) {
    return dataSource.transaction(async (manager) => {
      const transactionTypeName = "invoice_payment";
      const paymentId = dto.paymentId;
      if (!paymentId) throw new BadRequestException("Payment ID not found");
      const companyCurrency = await this.transactService.getCompanyCurrency(
        manager,
        companyId,
      );

      const invoice = await manager.findOne(Invoice, {
        where: { transactionTypeId: dto.transactionTypeId },
      });
      if (!invoice) throw new BadRequestException("Invoice not found");

      const invoiceCurrency = invoice.invoiceCurrency;

      const invoiceArTxn = await manager
        .createQueryBuilder(Transaction, "txn")
        .select([
          "txn.counterExchangeRate",
          "txn.counterOriginalExchangeRate",
          "contact.id",
          "contact.name",
        ])
        .innerJoin("txn.account", "acc")
        .innerJoin("txn.contact", "contact")
        .where("txn.transactionTypeId = :typeId", {
          typeId: dto.transactionTypeId,
        })
        .andWhere("txn.transactionTypeName = :name", { name: "invoice" })
        .andWhere("acc.accountType = :accType", { accType: "Asset" })
        .andWhere("acc.accountName = :accName", {
          accName: "Accounts Receivable",
        })
        .getOne();
      if (!invoiceArTxn)
        throw new BadRequestException("Invoice transaction not found");

      const contact = invoiceArTxn.contact;

      const paymentAccount = await this.transactService.accountExists(
        manager,
        dto.paymentAccountId,
      );
      if (!paymentAccount)
        throw new BadRequestException("Payment account not found");
      if (
        [AccountType.INCOME, AccountType.EXPENSE].includes(
          paymentAccount.accountType,
        )
      ) {
        throw new BadRequestException(
          "Payment account must be Asset or Liability",
        );
      }
      if (
        (paymentAccount.accountName == "Accounts Receivable" &&
          paymentAccount.accountType == AccountType.ASSET) ||
        (paymentAccount.accountName == "Accounts Payable" &&
          paymentAccount.accountType == AccountType.LIABILITY)
      ) {
        throw new BadRequestException(
          "Payment Account cannot be Accounts Receivable or Accounts Payable",
        );
      }
      const paymentAmount = parseFloat(dto.paymentAmount);
      const fxRate = dto.fxRate;
      const originalFxRate = dto.originalFxRate;
      const fxAmount = paymentAmount * fxRate;

      let baseAmount, accountAmount, counterAmount;
      let counterFxRate = 1,
        counterOriginalFxRate = 1,
        accountExchangeRate = 1,
        accountOriginalExchangeRate = 1;
      let accountCurrency, counterCurrency;

      if (invoiceCurrency == companyCurrency) {
        if (paymentAccount.accountCurrency == companyCurrency) {
          baseAmount = accountAmount = counterAmount = paymentAmount;
          accountCurrency = counterCurrency = companyCurrency;
        } else {
          baseAmount = paymentAmount;
          accountAmount = fxAmount;
          accountCurrency = paymentAccount.accountCurrency;
          accountExchangeRate = 1 / fxRate;
          accountOriginalExchangeRate = 1 / originalFxRate;
          counterAmount = paymentAmount;
          counterCurrency = companyCurrency;
          counterFxRate = fxRate;
          counterOriginalFxRate = originalFxRate;
        }
      } else {
        if (paymentAccount.accountCurrency == companyCurrency) {
          baseAmount = fxAmount;
          accountAmount = fxAmount;
          accountCurrency = paymentAccount.accountCurrency;
          accountExchangeRate = 1;
          accountOriginalExchangeRate = 1;
          counterAmount = paymentAmount;
          counterCurrency = invoiceCurrency;
          counterFxRate = fxRate;
          counterOriginalFxRate = originalFxRate;
        } else if (paymentAccount.accountCurrency == invoiceCurrency) {
          baseAmount = fxAmount;
          accountAmount = paymentAmount;
          accountCurrency = paymentAccount.accountCurrency;
          accountExchangeRate = invoiceArTxn.counterExchangeRate!; // invoice raised fxrate
          accountOriginalExchangeRate =
            invoiceArTxn.counterOriginalExchangeRate!;
          counterAmount = paymentAmount;
          counterCurrency = invoiceCurrency;
          counterFxRate = 1;
          counterOriginalFxRate = 1;
        } else {
          throw new BadRequestException(
            "Account must be of company or invoice currency",
          );
        }
      }
      const existingEntities =
        await this.transactService.getInvolvedEntitiesPrefixed(
          manager,
          transactionTypeName,
          dto.transactionTypeId,
          paymentId,
        );
      // Fetch existing transactions for this payment
      const prevTransactions = await manager.find(Transaction, {
        where: {
          paymentId,
          transactionTypeId: dto.transactionTypeId,
          transactionTypeName,
        },
        relations: ["account", "contact", "tax"],
      });

      // Accounts IDs
      const accReceivable = await manager.findOne(AccountData, {
        where: {
          accountName: "Accounts Receivable",
          accountType: AccountType.ASSET,
        },
      });
      if (!accReceivable)
        throw new BadRequestException("Accounts Receivable missing");

      const fxAccount = await manager.findOne(AccountData, {
        where: {
          accountName: "FX Gain/ Loss",
          accountType: AccountType.EXPENSE,
        },
      });

      // === Update Payment Account Entry ===
      const paymentTxn = prevTransactions.find(
        (t) =>
          t.account.id !== accReceivable.id && t.account.id !== fxAccount?.id,
      );
      if (paymentTxn) {
        paymentTxn.date = new Date(dto.paymentDate);
        paymentTxn.description = dto.notes ?? "";
        paymentTxn.debitAmount = baseAmount;
        paymentTxn.creditAmount = "0";
        paymentTxn.account = paymentAccount;
        paymentTxn.accountCurrency = accountCurrency;
        paymentTxn.accountCurrencyAmount = accountAmount;
        paymentTxn.accountExchangeRate = accountExchangeRate;
        paymentTxn.accountOriginalExchangeRate = accountOriginalExchangeRate;
        paymentTxn.counterCurrency = counterCurrency;
        paymentTxn.counterCurrencyAmount = counterAmount;
        paymentTxn.counterExchangeRate = counterFxRate;
        paymentTxn.counterOriginalExchangeRate = counterOriginalFxRate;

        await manager.save(paymentTxn);
      }

      // === Update Accounts Receivable Entry ===
      ((counterFxRate = 1),
        (counterOriginalFxRate = 1),
        (accountExchangeRate = 1),
        (accountOriginalExchangeRate = 1));

      if (invoiceCurrency === companyCurrency) {
        baseAmount = accountAmount = counterAmount = paymentAmount;
        accountCurrency = counterCurrency = companyCurrency;
      } else {
        baseAmount = fxAmount;
        accountAmount = fxAmount;
        accountCurrency = companyCurrency;
        counterAmount = paymentAmount;
        counterCurrency = invoiceCurrency;
        counterFxRate = fxRate;
        counterOriginalFxRate = originalFxRate;
      }

      const arTxns = prevTransactions.filter(
        (t) => t.account.id === accReceivable.id,
      );

      let arTxn: Transaction;
      let fxArTxn: Transaction | undefined;

      if (arTxns.length === 1) {
        arTxn = arTxns[0];
      } else if (arTxns.length >= 2) {
        // Choose the first one as main AR transaction
        arTxn = arTxns[0];
        fxArTxn = arTxns[1];
      } else {
        // If no AR exists (unlikely), throw error
        throw new BadRequestException(
          "Accounts Receivable transaction missing",
        );
      }

      arTxn.date = new Date(dto.paymentDate);
      arTxn.description = dto.notes ?? "";
      arTxn.debitAmount = "0";
      arTxn.creditAmount = baseAmount;
      arTxn.journalBalance = baseAmount;
      arTxn.accountCurrency = accountCurrency;
      arTxn.accountCurrencyAmount = accountAmount;
      arTxn.accountExchangeRate = accountExchangeRate;
      arTxn.accountOriginalExchangeRate = accountOriginalExchangeRate;
      arTxn.counterCurrency = counterCurrency;
      arTxn.counterCurrencyAmount = counterAmount;
      arTxn.counterExchangeRate = counterFxRate;
      arTxn.counterOriginalExchangeRate = counterOriginalFxRate;

      await manager.save(arTxn);

      // === FX Gain/Loss calculation and update ===
      const invoiceFxRate = Number(invoiceArTxn.counterExchangeRate);
      const invoiceBaseAmount = paymentAmount * invoiceFxRate;
      const fxGainLoss = Number(
        (parseFloat(baseAmount) - invoiceBaseAmount).toFixed(2),
      );
      const fxGainLossAmt = Math.abs(fxGainLoss).toFixed(2);
      const fxTxn = prevTransactions.find(
        (t) => t.account.id === fxAccount?.id,
      );

      if (fxGainLoss !== 0) {
        if (!fxAccount) {
          throw new BadRequestException("FX Gain/Loss account missing");
        }
        if (!fxTxn || !fxArTxn) {
          // create FX transaction if not exists
          await manager.save(Transaction, {
            date: new Date(dto.paymentDate),
            description: dto.notes ?? "",
            account: fxAccount,
            debitAmount: fxGainLoss < 0 ? fxGainLossAmt : "0",
            creditAmount: fxGainLoss > 0 ? fxGainLossAmt : "0",
            journalBalance: baseAmount,
            accountCurrency: companyCurrency,
            accountCurrencyAmount: fxGainLossAmt,
            counterCurrency: companyCurrency,
            counterCurrencyAmount: fxGainLossAmt,
            counterExchangeRate: 1,
            counterOriginalExchangeRate: 1,
            transactionTypeName,
            transactionTypeId: dto.transactionTypeId,
            paymentId,
          });

          await manager.save(Transaction, {
            date: new Date(dto.paymentDate),
            description: dto.notes ?? "",
            account: accReceivable,
            contact,
            debitAmount: fxGainLoss > 0 ? fxGainLossAmt : "0",
            creditAmount: fxGainLoss < 0 ? fxGainLossAmt : "0",
            journalBalance: baseAmount,
            accountCurrency: companyCurrency,
            accountCurrencyAmount: fxGainLossAmt,
            counterCurrency: companyCurrency,
            counterCurrencyAmount: fxGainLossAmt,
            transactionTypeName,
            transactionTypeId: dto.transactionTypeId,
            paymentId,
          });
        } else {
          fxArTxn.debitAmount = fxGainLoss > 0 ? baseAmount : "0";
          fxArTxn.creditAmount = fxGainLoss < 0 ? fxGainLossAmt : "0";
          fxArTxn.journalBalance = baseAmount;
          fxArTxn.accountCurrency = companyCurrency;
          fxArTxn.accountCurrencyAmount = fxGainLossAmt;
          fxArTxn.accountExchangeRate = accountExchangeRate;
          fxArTxn.accountOriginalExchangeRate = accountOriginalExchangeRate;
          fxArTxn.counterCurrency = companyCurrency;
          fxArTxn.counterCurrencyAmount = fxGainLossAmt;
          fxArTxn.counterExchangeRate = counterFxRate;
          fxArTxn.counterOriginalExchangeRate = counterOriginalFxRate;
          await manager.save(fxArTxn);

          fxTxn.debitAmount = fxGainLoss < 0 ? fxGainLossAmt : "0";
          fxTxn.creditAmount = fxGainLoss > 0 ? fxGainLossAmt : "0";
          fxTxn.journalBalance = baseAmount;
          fxTxn.accountCurrencyAmount = fxGainLossAmt;
          fxTxn.counterCurrencyAmount = fxGainLossAmt;
          await manager.save(fxTxn);
        }
      } else {
        // delete FX transaction if no gain/loss
        if (fxTxn) await manager.remove(fxTxn);
        if (fxArTxn) await manager.remove(fxArTxn);
      }

      // === Update all involved entities balances ===
      const updatedEntities =
        await this.transactService.getInvolvedEntitiesPrefixed(
          manager,
          transactionTypeName,
          dto.transactionTypeId,
        );
      const involvedEntities = new Set<string>([
        ...existingEntities,
        ...updatedEntities,
      ]);
      await this.transactService.updateBalanceAllEntities(
        involvedEntities,
        manager,
        companyId,
      );
      await this.transactService.updateBalanceAllEntities(
        involvedEntities,
        manager,
        companyId,
      );

      return {
        data: {
          transactionTypeName,
          transactionTypeId: dto.transactionTypeId,
          paymentId,
        },
        change_of_data: {
          transactionTypeName,
          transactionTypeId: dto.transactionTypeId,
          paymentId,
          contactId: contact.id,
          contactName: contact.name,
          invoice_no: invoice.invoiceNo,
          module: "Transact",
          feature: "Invoice Payment",
          status: "Edit",
        },
      };
    });
  }

  async getInvoicePayments(dataSource: DataSource, transactionTypeId: string) {
    if (!transactionTypeId)
      throw new BadRequestException("Transaction Id is required");
    const invoice = await dataSource.getRepository(Invoice).findOne({
      where: { transactionTypeId: transactionTypeId },
      relations: ["contact"],
    });
    if (!invoice) throw new BadRequestException("Invoice not found");
    const invoiceTotal =
      invoice.roundoffTotal !== null
        ? Number(invoice.roundoffTotal)
        : Number(invoice.invoiceTotal);

    const paymentHistory = await this.fetchPaymentHistory(
      dataSource,
      transactionTypeId,
    );

    const { totalReceived, balanceDue } = await this.getBalanceDue(
      dataSource,
      transactionTypeId,
      invoiceTotal,
    );

    return {
      payments: paymentHistory,
      contact: invoice.contact,
      invoiceNo: invoice.invoiceNo,
      balanceDue,
      totalReceived,
      invoiceTotal,
      currency: invoice.invoiceCurrency,
    };
  }

  async getPaymentDetails(
    paymentId: string,
    transactionTypeId: string,
    dataSource: DataSource,
  ) {
    if (!transactionTypeId || !paymentId)
      throw new BadRequestException(
        "Transaction Id and Payment ID is required",
      );
    const paymentDetails = await dataSource
      .getRepository(Transaction)
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.account", "account")
      .where("transaction.transactionTypeId = :transactionTypeId", {
        transactionTypeId: transactionTypeId,
      })
      .andWhere("transaction.paymentId = :paymentId", {
        paymentId: paymentId,
      })
      .andWhere(
        "NOT ((account.accountName = :accName AND account.accountType = :accType) OR (account.accountName = :fxName AND account.accountType = :fxType))",
        {
          accName: "Accounts Receivable",
          accType: "Asset",
          fxName: "FX Gain/ Loss",
          fxType: "Expense",
        },
      )
      .select([
        "transaction.date",
        "transaction.paymentId",
        "account.accountName",
        "account.id",
        "account.accountCurrency",
        "transaction.debitAmount",
        "transaction.counterCurrencyAmount",
        "transaction.counterExchangeRate",
        "transaction.counterOriginalExchangeRate",
        "transaction.counterCurrency",
        "transaction.description",
      ])
      .getMany();

    const invoice = await dataSource
      .getRepository(Invoice)
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.contact", "contact")
      .where("invoice.transactionTypeId = :transactionTypeId", {
        transactionTypeId,
      })
      .select(["invoice.id", "contact.id", "contact.name"])
      .getOne();

    return {
      invoiceNo: invoice?.id,
      contact: {
        id: invoice?.contact.id,
        name: invoice?.contact.name,
      },
      paymentDetails,
    };
  }

  async validateInvoiceBulk(
    dataSource: DataSource,
    dtos: CreateInvoiceDto[],
    companyId: string,
  ) {
    const allErrors: { row: number; col: number; message: string }[] = [];
    const manager = dataSource.createEntityManager();
    const validLevels = Object.values(ApplyLevel);
    const validTdsTypes = Object.values(TdsType);

    for (const dto of dtos) {
      const row = dto.invoiceId;

      try {
        const contact = await manager.getRepository(Contact).findOne({
          where: { id: dto.contactId },
        });
        if (!contact) {
          allErrors.push({ row, col: 2, message: "Contact not found." });
        }
      } catch {
        allErrors.push({ row, col: 2, message: "DB Error" });
      }

      const rawLevel = dto.tdsLevel;

      if (rawLevel) {
        if (!validLevels.includes(rawLevel)) {
          allErrors.push({ row, col: 11, message: "Invalid Level" });
          continue;
        }

        if (rawLevel === ApplyLevel.TOTAL) {
          const tType = dto.tdsType;
          if (!tType || !validTdsTypes.includes(tType)) {
            allErrors.push({ row, col: 10, message: "Invalid Type" });
          }
        }

        if (rawLevel === ApplyLevel.ITEM && Array.isArray(dto.items)) {
          for (const item of dto.items) {
            const iType = item.itemTdsType;
            if (!iType || !validTdsTypes.includes(iType)) {
              allErrors.push({ row, col: 20, message: "Invalid Item Type" });
            }
          }
        }
      }
    }

    return { errors: allErrors };
  }

  async bulkCreateInvoices(
    dataSource: DataSource,
    dtos: CreateInvoiceDto[],
    companyId: string,
  ) {
    const results: any[] = [];
    const bulkErrors: any[] = [];

    return await dataSource.transaction(async (manager) => {
      for (const dto of dtos) {
        try {
          const result = await this.createInvoice(dataSource, dto, companyId);
          results.push(result);
        } catch (e) {
          bulkErrors.push({ invoiceNo: dto.invoiceNo, error: e.message });
        }
      }

      if (bulkErrors.length > 0) {
        console.log(bulkErrors);
        throw new BadRequestException({
          message: "Bulk failed",
          details: bulkErrors,
        });
      }

      console.log(results);

      return { success: true, count: results.length };
    });
  }

  async exportInvoiceOrBillToPdf(
    dataSource: DataSource,
    fromDate: string,
    toDate: string,
    entityType: "INVOICE" | "BILL",
    companyId: string,
    displayName: string,
    headerUrl: string,
  ) {
    let filename: string;
    const htmlPath =
      entityType === "INVOICE"
        ? getTemplatePath("invoice-pdf-export-template.html")
        : getTemplatePath("bill-pdf-export-template.html");

    if (!htmlPath) {
      throw new InternalServerErrorException("File Path Missing!");
    }

    const { commaSeparation } = await this.transactService.getCommaSeperation(
      dataSource.manager,
      companyId,
    );

    let result: any[] = [];
    if (entityType === "INVOICE") {
      result = await this.getAllInvoiceData(dataSource, fromDate, toDate);
    } else {
      result = await this.billService.getAllBillData(
        dataSource,
        fromDate,
        toDate,
      );
    }

    const locale = commaSeparation === "IN" ? "en-IN" : "en-US";

    const formatCurr = (val: any) => {
      const num = parseFloat(val || 0);
      return num.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const rows: any[] = [];

    for (const doc of result) {
      const total = doc.roundoffTotal ?? doc.invoiceTotal;
      const isPastDue = new Date(doc.invoiceDueDate).getTime() < Date.now();

      const status =
        doc.balanceDue === 0
          ? "Received"
          : isPastDue && doc.balanceDue === total
            ? "Unpaid"
            : isPastDue && doc.balanceDue < total
              ? "Partial"
              : "Overdue";

      rows.push({
        date: new Date(
          entityType === "INVOICE" ? doc.invoiceDate : doc.billDate,
        ).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        number: entityType === "INVOICE" ? doc.invoiceNo : doc.billNo,
        contact: doc.contact?.name,
        status,
        dueIn: Math.max(
          0,
          Math.ceil(
            (new Date(
              entityType === "INVOICE" ? doc.invoiceDueDate : doc.billDueDate,
            ).getTime() -
              new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        ),
        total: formatCurr(
          entityType === "INVOICE" ? doc.invoiceTotal : doc.billTotal,
        ),
        balanceDue: formatCurr(doc.balanceDue),
      });
    }

    const filenameDate = `${fromDate}_to_${toDate}`;
    const docName = result?.[0]?.contact?.name || "Unknown";
    filename = `${entityType === "INVOICE" ? "Invoice" : "Bill"}_${docName}_${filenameDate}.pdf`;

    const htmlTemplate = fs.readFileSync(htmlPath, "utf8");
    const template = hbs.compile(htmlTemplate);

    const finalHtml = template({
      headerUrl,
      rows,
      formattedFromDate: new Date(fromDate).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      formattedToDate: new Date(toDate).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      entityType,
      username: displayName,
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
    return { fileBuffer: Buffer.from(fileBuffer), filename };
  }

  async exportInvoiceOrBillToExcel(
    dataSource: DataSource,
    fromDate: string,
    toDate: string,
    entityType: "INVOICE" | "BILL",
    companyId: string,
    headerUrl: string,
  ) {
    let filename: string;

    const { commaSeparation } = await this.transactService.getCommaSeperation(
      dataSource.manager,
      companyId,
    );

    const numFmt = commaSeparation === "IN" ? "#,##,##0.00" : "#,##0.00";

    let result: any[] = [];
    if (entityType === "INVOICE") {
      result = await this.getAllInvoiceData(dataSource, fromDate, toDate);
    } else {
      result = await this.billService.getAllBillData(
        dataSource,
        fromDate,
        toDate,
      );
    }

    const filenameDate = `${fromDate}_to_${toDate}`;
    const docName = result?.[0]?.contact?.name || "Unknown";

    filename = `${
      entityType === "INVOICE" ? "Invoice" : "Bill"
    }_${docName}_${filenameDate}.xlsx`;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      entityType === "INVOICE" ? "Invoices" : "Bills",
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
        br: { col: 7, row: 2 } as any,
        editAs: "oneCell",
      });
    }

    sheet.insertRow(3, [
      "Date",
      entityType === "INVOICE" ? "Invoice No" : "Bill No",
      "Contact Name",
      "Status",
      "Due in",
      "Total",
      "Balance Due",
    ]);

    const headerRow = sheet.getRow(3);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 20;

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEFEFEF" },
      };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    const formatCurr = (val: any) => parseFloat(val || 0);

    result.forEach((doc) => {
      const total = doc.roundoffTotal ?? doc.invoiceTotal;
      const isPastDue = new Date(doc.invoiceDueDate).getTime() < Date.now();

      const status =
        doc.balanceDue === 0
          ? "Received"
          : isPastDue && doc.balanceDue === total
            ? "Unpaid"
            : isPastDue && doc.balanceDue < total
              ? "Partial"
              : "Overdue";
      sheet.addRow([
        new Date(
          entityType === "INVOICE" ? doc.invoiceDate : doc.billDate,
        ).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        entityType === "INVOICE" ? doc.invoiceNo : doc.billNo,
        doc.contact?.name || "",
        status,
        Math.max(
          0,
          Math.ceil(
            (new Date(
              entityType === "INVOICE" ? doc.invoiceDueDate : doc.billDueDate,
            ).getTime() -
              new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        ),
        formatCurr(entityType === "INVOICE" ? doc.invoiceTotal : doc.billTotal),
        formatCurr(doc.balanceDue),
      ]);
    });

    sheet.columns = [
      { width: 15 },
      { width: 20 },
      { width: 25 },
      { width: 12 },
      { width: 10 },
      { width: 15, style: { numFmt } },
      { width: 18, style: { numFmt } },
    ];

    const fileBuffer = await workbook.xlsx.writeBuffer();
    return { fileBuffer: Buffer.from(fileBuffer), filename };
  }

  async buildInvoiceRawData(
    transactionTypeId: string,
    companyId: string,
    dataSource: DataSource,
  ) {
    const invoiceRepo = dataSource.getRepository(Invoice);
    const taxRepo = dataSource.getRepository(Tax);

    const invoice = await invoiceRepo.findOne({
      where: { transactionTypeId },
      relations: {
        contact: true,
        items: {
          itemAccount: true,
        },
      },
    });

    if (!invoice) throw new NotFoundException("Invoice not found");

    const taxMap = new Map((await taxRepo.find()).map((t) => [t.id, t]));
    const aggregatedTaxes = this.calculateAggregatedTaxes(
      invoice.items,
      taxMap,
    );

    const { subTotal, discount, itemTds, invoiceTds } =
      await this.buildTotalResolvers(invoice, invoice.items, dataSource);

    const actualTotal = Number(invoice.invoiceTotal);
    const roundedTotal = Number(invoice.roundoffTotal);
    const balanceData = await this.getInvoicePayments(
      dataSource,
      transactionTypeId,
    );

    let roundedValue;

    if (!isNaN(roundedTotal) && roundedTotal !== actualTotal) {
      const diff = +(roundedTotal - actualTotal).toFixed(2);
      roundedValue = Math.abs(diff).toFixed(2);
    }

    const finalTotal = invoice.isRoundOff ? roundedTotal : actualTotal;

    return {
      invoice: {
        id: invoice.id,
        transactionTypeId,
        invoiceNo: invoice.invoiceNo,
        currency: invoice.invoiceCurrency,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.invoiceDueDate,
        serviceStart: invoice.serviceStartDate,
        serviceEnd: invoice.serviceEndDate,
        notes: invoice.notes,
        hasTds: invoice.hasTds,
        discountApplied: invoice.discountApplied,
        discountValue: invoice.discountValue,
        discountType: invoice.discountType,
        isRoundOff: invoice.isRoundOff,
        roundoffTotal: invoice.roundoffTotal,
      },

      contact: invoice.contact,

      items: invoice.items.map((i) => ({
        id: i.id,
        name: i.itemName,
        hsnSac: i.hsnSac,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.itemTotal,
        account: i.itemAccount.accountName,
        tax: i.itemTax,
        tdsType: i.itemTdsType,
        tdsValue: i.itemTdsValue,
      })),

      notes: invoice.notes,

      taxes: aggregatedTaxes,

      totals: {
        subTotal,
        discount,
        itemTds,
        invoiceTds,
        invoiceTotal: invoice.invoiceTotal,
        roundedValue,
        finalTotal,
        balanceDue: balanceData.balanceDue,
      },
    };
  }

  private async buildInvoiceViewModel(
    raw: any,
    template: InvoiceTemplate,
    transactionTypeId: string,
    companyId: string,
    dataSource: DataSource,
  ) {
    const viewModel: any = {};

    const companyLogo = await this.settingService.getCompanyImages(
      dataSource,
      companyId,
    );
    const balanceData = await this.getInvoicePayments(
      dataSource,
      transactionTypeId,
    );
    const companyIdentityRepo = dataSource.getRepository(CompanyIdentity);
    const companyIdentity = await companyIdentityRepo.find();
    const company = await this.companyRepo.findOne({ where: { companyId } });

    const primaryAddress = companyIdentity[0];
    const companyAddress = primaryAddress
      ? [
          primaryAddress.addressLine1,
          primaryAddress.addressLine2,
          [primaryAddress.city, primaryAddress.state]
            .filter(Boolean)
            .join(", "),
          primaryAddress.pincode,
          primaryAddress.country,
        ].filter(Boolean)
      : [];
    const currency = raw.invoice.currency.split(" ")[0];
    const currencyCode = raw.invoice.currency.split(" ")[2];

    // ================= COMPANY =================
    viewModel.company = {
      name: company?.companyName || "Company Name",
      companyAddress,
    };

    if (template.header?.companyLogo) {
      viewModel.company.companyLogoUrl = companyLogo.logoUrl;
    }

    // ================= TRANSACTION =================
    if (template.transaction) {
      const td = template.transaction;

      if (td.balanceDue) {
        viewModel.invoice = {
          number: raw.invoice.invoiceNo,
          currency: currency,
          balanceDue: balanceData.balanceDue,
        };
      }

      if (td.billTo) {
        viewModel.billTo = {
          name: raw.contact?.name,
          address: [
            raw.contact?.addressLine1,
            raw.contact?.addressLine2,
            [raw.contact?.city, raw.contact?.state].filter(Boolean).join(", "),
            raw.contact?.pincode,
            raw.contact?.country,
          ].filter(Boolean),
        };
      }

      viewModel.invoiceDetails = {};
      if (td.dateField)
        viewModel.invoiceDetails.invoiceDate = this.formatDate(
          raw.invoice.invoiceDate,
        );
      if (td.invoiceDue)
        viewModel.invoiceDetails.dueDate = this.formatDate(
          raw.invoice.invoiceDueDate,
        );
      if (td.serviceStartDate)
        viewModel.invoiceDetails.serviceStart = this.formatDate(
          raw.invoice.serviceStartDate,
        );
      if (td.serviceEndDate)
        viewModel.invoiceDetails.serviceEnd = this.formatDate(
          raw.invoice.serviceEndDate,
        );
    }

    // ================= ITEMS =================
    viewModel.items = [];

    if (template.table && raw.items?.length) {
      viewModel.items = raw.items.map((i, idx) => {
        const item: any = { lineNo: idx + 1 };

        for (const field of Object.keys(template.table)) {
          if (template.table[field]) {
            switch (field) {
              case "item":
                item.item = i.name;
                break;
              case "account":
                item.account = i.account;
                break;
              case "hsnSac":
                item.hsnSac = i.hsnSac;
                break;
              case "quantity":
                item.quantity = i.quantity;
                break;
              case "rate":
                item.rate = i.unitPrice;
                break;
              case "amount":
                item.amount = i.total;
                break;
            }
          }
        }
        return item;
      });
    }

    if (
      template.table?.description &&
      typeof raw.notes === "string" &&
      raw.notes.trim().length > 0
    ) {
      viewModel.description = {
        label: template.others.descriptionLabel || "Description",
        value: raw.notes,
      };
    }

    // ================= TOTALS =================
    viewModel.total = [];

    viewModel.total.push({
      key: "subTotal",
      label: "Sub Total",
      value: `${currency}${raw.totals.subTotal}`,
    });

    if (
      raw.invoice.discountApplied === DiscountApplied.BEFORE &&
      raw.totals.discount !== 0
    ) {
      viewModel.total.push({
        key: "discount",
        label: "Discount",
        value: `${currency}${raw.totals.discount}`,
      });
    }

    for (const tax of raw.taxes) {
      viewModel.total.push({
        key: `tax_${tax.taxId}`,
        label:
          tax.type === "percent"
            ? `${tax.abbreviation} ${tax.rateOrValue}%`
            : `${tax.abbreviation} ${tax.rateOrValue}`,
        value: `${currency}${tax.totalAmount}`,
      });
    }

    if (
      raw.invoice.discountApplied === DiscountApplied.AFTER &&
      raw.totals.discount !== 0
    ) {
      viewModel.total.push({
        key: "discount",
        label: "Discount",
        value: `${currency}${raw.totals.discount}`,
      });
    }

    if (Array.isArray(raw.totals.itemTds)) {
      for (const tds of raw.totals.itemTds) {
        viewModel.total.push({
          key: `tds_${tds.rateOrValue}`,
          label:
            tds.type === TdsType.PERCENT
              ? `TDS ${tds.rateOrValue}%`
              : `TDS ${tds.rateOrValue}`,
          value: `${currency}${tds.totalAmount}`,
        });
      }
    }

    if (raw.invoice.hasTds && raw.totals.invoiceTds > 0) {
      viewModel.total.push({
        key: "tds_total",
        label:
          raw.invoice.tdsType === TdsType.PERCENT
            ? `TDS ${raw.invoice.tdsValue}%`
            : `TDS ${raw.invoice.tdsValue}`,
        value: `${currency}${raw.totals.invoiceTds}`,
      });
    }

    const actualTotal = Number(raw.totals.invoiceTotal);
    const roundedTotal = Number(raw.invoice.roundoffTotal);

    if (
      raw.invoice.isRoundOff === true &&
      !isNaN(roundedTotal) &&
      roundedTotal !== actualTotal
    ) {
      const diff = +(roundedTotal - actualTotal).toFixed(2);
      const sign = diff > 0 ? "(+)" : "(-)";

      viewModel.total.push({
        key: "roundOff",
        label: "Round Off",
        value: `${sign} ${currency}${Math.abs(diff).toFixed(2)}`,
        round: true,
      });
    }

    const finalTotal = raw.invoice.roundOff ? roundedTotal : actualTotal;

    viewModel.total.push(
      {
        key: "grandTotal",
        label: "Total",
        value: `${currency}${finalTotal.toFixed(2)}`,
        highlight: true,
      },
      {
        key: "paymentReceived",
        label: "Payment Received",
        value: `${currency}${balanceData.totalReceived}`,
        negative: true,
      },
      {
        key: "balanceDue",
        label: "Balance Due",
        value: `${currency}${balanceData.balanceDue}`,
      },
    );

    if (template.others?.amountInWords) {
      viewModel.amountInWords = this.amountToWords(
        balanceData.balanceDue,
        currencyCode,
      );
    }

    if (template.others.showBankDetails && template.bankDetails) {
      viewModel.bankDetails = [];

      for (const key in template.bankDetails) {
        const field = template.bankDetails[key];
        if (field.checked) {
          viewModel.bankDetails.push({
            label: field.label,
            value: field.value ?? "",
          });
        }
      }
    }

    const metaRepo = dataSource.getRepository(CompanyMetaData);
    const meta = await metaRepo.find();

    const metaMap = new Map(
      meta
        .filter((m) => m.label)
        .map((m) => [this.normalize(m.label), m.value]),
    );

    viewModel.identityFields = [];

    if (
      template.others.showIdentity &&
      Array.isArray(template.identityDetails)
    ) {
      viewModel.identityFields = template.identityDetails
        .filter((f) => f.checked)
        .map((f) => ({
          label: f.label,
          value: metaMap.get(this.normalize(f.label)) || "",
        }))
        .filter((f) => f.value); // remove empty rows
    }

    return viewModel;
  }

  async generateInvoicePdf(
    transactionTypeId: string,
    companyId: string,
    dataSource: DataSource,
  ) {
    try {
      const templateRepo = dataSource.getRepository(InvoiceTemplate);

      const template = await templateRepo.findOne({
        where: { isDefault: true },
      });
      if (!template)
        throw new NotFoundException("Default invoice template not found");

      const raw: any = await this.buildInvoiceRawData(
        transactionTypeId,
        companyId,
        dataSource,
      );

      const viewModel = await this.buildInvoiceViewModel(
        raw,
        template,
        transactionTypeId,
        companyId,
        dataSource,
      );

      const fileName = this.buildFileName(
        raw.invoice.invoiceDate,
        raw.contact?.name ?? "Customer",
        raw.invoice.invoiceNo,
        raw.invoice.currency,
        raw.totals.balanceDue,
      );

      const templatePath = getTemplatePath("invoice.html");
      const htmlSource = fs.readFileSync(templatePath, "utf8");

      const compile = Handlebars.compile(htmlSource);
      const html = compile(viewModel);

      const buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];

        wkhtmltopdf(html, {
          pageSize: "A4",
          marginTop: "10mm",
          marginBottom: "15mm",
          marginLeft: "10mm",
          marginRight: "10mm",
          encoding: "UTF-8",
        })
          .on("data", (chunk) => chunks.push(chunk))
          .on("end", () => resolve(Buffer.concat(chunks)))
          .on("error", reject);
      });
      return { buffer, fileName };
    } catch (err) {
      throw new InternalServerErrorException("Failed to generate invoice PDF");
    }
  }
}
