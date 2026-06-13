import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import {
  Between,
  Brackets,
  DataSource,
  EntityManager,
  In,
  Repository,
} from "typeorm";
import { Contact } from "../contact/entities/tenant.contact.entity";
import { AccountData } from "../account/entities/tenant.account.entity";
import { Tax } from "../tax/entities/tenant.tax.entity";
import { CompanySetting } from "src/setting/entities/tenant.company-setting.entity";
import { Transaction } from "./entities/tenant.transaction.entity";
import { TransactionDto } from "./dto/transaction.dto";
import { Invoice } from "../invoice/entities/tenant.invoice.entity";
import { InvoiceItem } from "../invoice/entities/tenant.invoice-item.entity";
import { BillItem } from "../bill/entities/tenant.bill-item.entity";
import { Bill } from "../bill/entities/tenant.bill.entity";
import { AttachmentsInterface } from "src/common/interface/attachment.interface";
import { StorageService } from "src/storage/storage.service";
import path from "path";
import { Attachment } from "./entities/tenant.attachment.entity";
import { capitalizeFirst } from "src/utils/string.util";
import { TransactionTypeName } from "src/common/enum/transaction-type.enum";
import * as fs from "fs";
import * as puppeteer from "puppeteer";
import * as hbs from "handlebars";
import ExcelJS from "exceljs";
import { AccountTypeTransact } from "src/common/enum/account-type.enum";
import { fetchImageAsBuffer, getTemplatePath } from "src/shared/utils";

@Injectable()
export class TransactService {
  constructor(private readonly storageService: StorageService) {}

  encodeCursor = (date: Date, createdAt: Date): string => {
    return Buffer.from(
      JSON.stringify({
        d: date.toISOString(),
        createdAt: createdAt.toISOString(),
      }),
    ).toString("base64");
  };

  decodeCursor = (cursor: string | null | undefined) => {
    if (!cursor) return null;
    try {
      const parsed = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
      if (!parsed.d || !parsed.createdAt) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  };

  async generateTransactionTypeId(idName?: string): Promise<string> {
    let id: string;

    if (idName === "payment") {
      // 10 digits
      const timePart = Date.now().toString().slice(-6); // last 6 digits of timestamp
      const randomPart = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits
      id = timePart + randomPart;
    } else {
      // 12 digits
      const timePart = Date.now().toString().slice(-8); // last 8 digits of timestamp
      const randomPart = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits
      id = timePart + randomPart;
    }
    return id;
  }

  async contactExists(manager: EntityManager, contactId: number) {
    const contact = await manager.findOne(Contact, {
      where: { id: contactId },
    });
    if (!contact) {
      throw new NotFoundException(
        `Contact with id ${contactId} does not exist`,
      );
    }
    return contact;
  }

  async accountExists(
    manager: EntityManager,
    accountId: number,
  ): Promise<AccountData> {
    const account = await manager.findOne(AccountData, {
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException(
        `Account with id ${accountId} does not exist`,
      );
    }
    return account;
  }

  async taxExists(manager: EntityManager, taxId: number) {
    const tax = await manager.findOne(Tax, {
      where: { id: taxId },
    });
    if (!tax) {
      throw new NotFoundException(`Tax with id ${taxId} does not exist`);
    }
    return tax;
  }

  async getCompanyCurrency(manager: EntityManager, companyId: string) {
    const companySetting = await manager.findOne(CompanySetting, {
      where: { companyId },
    });

    if (!companySetting) {
      throw new NotFoundException(
        `Company Setting for ${companyId} does not exist`,
      );
    }
    return companySetting.reportingCurrency;
  }

  private calculateBalance(
    debit: number,
    credit: number,
    accountType: string,
  ): number {
    return ["Asset", "Expense"].includes(accountType)
      ? debit - credit
      : credit - debit;
  }

  async updateBalance(
    manager: EntityManager,
    companyId: string,
    accountType: string,
    id: number,
  ) {
    const reportingCurrency = await this.getCompanyCurrency(manager, companyId);
    let debit = 0;
    let credit = 0;

    const transactionRepo = manager.getRepository(Transaction);

    let relationField: "contact" | "tax" | "account" = "account";
    if (accountType === "Contact") relationField = "contact";
    else if (accountType === "Tax") relationField = "tax";

    const totals = await transactionRepo
      .createQueryBuilder("t")
      .select(`SUM(t.debit_amount)`, "debit_amount")
      .addSelect(`SUM(t.credit_amount)`, "credit_amount")
      .where(`t.${relationField}_id = :id`, { id })
      .getRawOne<{ debit_amount: string; credit_amount: string }>();

    debit = Number(totals?.debit_amount || 0);
    credit = Number(totals?.credit_amount || 0);

    if (relationField === "account") {
      const account = await this.accountExists(manager, id);
      if (
        (account.accountCurrency as unknown as string) !== reportingCurrency
      ) {
        const fxTotals = await transactionRepo
          .createQueryBuilder("t")
          .select(
            `SUM(CASE WHEN t.credit_amount = 0 THEN t.accountCurrencyAmount ELSE 0 END)`,
            "debit_amount",
          )
          .addSelect(
            `SUM(CASE WHEN t.debit_amount = 0 THEN t.accountCurrencyAmount ELSE 0 END)`,
            "credit_amount",
          )
          .where("t.account_id = :id", { id })
          .getRawOne<{ debit_amount: string; credit_amount: string }>();

        debit = Number(fxTotals?.debit_amount || 0);
        credit = Number(fxTotals?.credit_amount || 0);
      }
    }

    // Calculate balance
    const balance =
      relationField === "account"
        ? this.calculateBalance(debit, credit, accountType)
        : debit - credit;

    // Update balance in the right table
    if (relationField === "contact") {
      await manager.update(Contact, id, { contactBalance: balance.toFixed(2) });
    } else if (relationField === "tax") {
      await manager.update(Tax, id, { taxBalance: balance.toFixed(2) });
    } else {
      await manager.update(AccountData, id, {
        accountBalance: balance.toFixed(2),
      });
    }
  }

  async renameTransactAttachment(
    manager: EntityManager,
    companyId: string,
    companyCurrency: string,
    transactionTypeId: string,
    transactionTypeName: string,
    paymentId?: string | undefined,
  ): Promise<string> {
    let updatedFileName = "";
    console.log(
      transactionTypeName,
      "transactionTypeName",
      transactionTypeName === "bill",
    );
    if (
      transactionTypeName == "bill_payment" ||
      transactionTypeName == "invoice_payment"
    ) {
      if (!paymentId)
        throw new BadRequestException("Payment Id is required for payments");
    }
    if (
      transactionTypeName == "bill" ||
      transactionTypeName == "bill_payment"
    ) {
      // Fetch bill info
      const billData = await manager
        .createQueryBuilder(Bill, "bill")
        .leftJoin("bill.contact", "contact")
        .where("bill.transactionTypeId = :transactionTypeId", {
          transactionTypeId,
        })
        .select([
          'bill.billDate AS "billDate"',
          'bill.billNo AS "billNo"',
          'bill.billCurrency AS "billCurrency"',
          'bill.roundoffTotal AS "billTotal"',
          'contact.name AS "contactName"',
        ])
        .getRawOne();

      if (!billData) throw new BadRequestException("Bill Not found");

      let billDate = billData.billDate.toISOString().split("T")[0];
      const contactName = billData.contactName;
      const billNo = billData.billNo.replace(/\//g, "_");
      const billCurrencyCode = billData.billCurrency.split(" - ")[1];
      let totalCost = billData.billTotal;
      let paymentPrefix = "";
      console.log(
        "dfgyuj",
        transactionTypeName === "bill_payment",
        paymentId,
        transactionTypeName === "bill_payment" && paymentId,
      );
      if (transactionTypeName === "bill_payment" && paymentId) {
        console.log("insideeeee");
        paymentPrefix = "Payment - ";

        const paymentData = await manager
          .createQueryBuilder(Transaction, "tx")
          .leftJoin("tx.account", "account")
          .where("tx.payment_id = :paymentId", { paymentId })
          .andWhere("account.account_name NOT IN (:...excluded)", {
            excluded: ["Accounts Payable", "FX Gain/ Loss"],
          })
          .select([
            'tx.date AS "date"',
            'tx.creditAmount AS "creditAmount"',
            'tx.counterCurrencyAmount AS "counterCurrencyAmount"',
          ])
          .getRawOne();
        console.log(paymentData, "paymentDatapaymentData");

        if (paymentData) {
          billDate = paymentData.date.toISOString().split("T")[0];
          totalCost = paymentData.counterCurrencyAmount;
        }
      }

      updatedFileName = `${paymentPrefix}${billDate} - ${contactName} - ${billNo} - ${billCurrencyCode} ${totalCost}`;
    } else if (
      transactionTypeName == "invoice" ||
      transactionTypeName == "invoice_payment"
    ) {
      // Fetch bill info
      const invoiceData = await manager
        .createQueryBuilder(Invoice, "invoice")
        .leftJoin("invoice.contact", "contact")
        .where("invoice.transactionTypeId = :transactionTypeId", {
          transactionTypeId,
        })
        .select([
          'invoice.invoiceDate AS "invoiceDate"',
          'invoice.invoiceNo AS "invoiceNo"',
          'invoice.invoiceCurrency AS "invoiceCurrency"',
          'invoice.roundoffTotal AS "invoiceTotal"',
          'contact.name AS "contactName"',
        ])

        .getRawOne();

      if (!invoiceData) throw new BadRequestException("Invoice Not found");

      let invoiceDate = invoiceData.invoiceDate.toISOString().split("T")[0];
      const contactName = invoiceData.contactName;
      const invoiceNo = invoiceData.invoiceNo.replace(/\//g, "_");
      const invoiceCurrencyCode = invoiceData.invoiceCurrency.split(" - ")[1];
      let totalCost = invoiceData.invoiceTotal;
      let paymentPrefix = "";

      if (transactionTypeName === "invoice_payment" && paymentId) {
        paymentPrefix = "Payment - ";

        const paymentData = await manager
          .createQueryBuilder(Transaction, "tx")
          .leftJoin("tx.account", "account")
          .where("tx.payment_id = :paymentId", { paymentId })
          .andWhere("account.account_name NOT IN (:...excluded)", {
            excluded: ["Accounts Receivable", "FX Gain/ Loss"],
          })
          .select([
            'tx.date AS "date"',
            'tx.creditAmount AS "creditAmount"',
            'tx.counterCurrencyAmount AS "counterCurrencyAmount"',
          ])
          .getRawOne();

        if (paymentData) {
          invoiceDate = paymentData.date.toISOString().split("T")[0];
          totalCost = paymentData.counterCurrencyAmount;
        }
      }

      updatedFileName = `${paymentPrefix}${invoiceDate} - ${contactName} - ${invoiceNo} - ${invoiceCurrencyCode} ${totalCost}`;
    } else {
      const journalData = await manager
        .createQueryBuilder(Transaction, "td")
        .leftJoin("td.account", "account")
        .leftJoin("td.contact", "contact")
        .leftJoin("td.tax", "tax")
        .select([
          'td.account AS "accountId"',
          'td.contact AS "contactId"',
          'td.tax AS "taxId"',
          'account.accountName AS "accountName"',
          'contact.name AS "contactName"',
          'tax.taxName AS "taxName"',
          "td.date AS date",
          'td.journalBalance AS "journalBalance"',
        ])
        .andWhere("td.transactionTypeId = :transactionTypeId", {
          transactionTypeId,
        })
        .andWhere("td.transactionTypeName = :transactionTypeName", {
          transactionTypeName,
        })
        .andWhere("td.debitAmount = :debit", { debit: 0 })
        .getRawOne();

      if (!journalData) throw new BadRequestException("Journal not found");

      let accName: string | undefined;

      if (journalData.accountId) {
        accName = journalData.accountName;
      } else if (journalData.contactId) {
        accName = journalData.contactName;
      } else if (journalData.taxId) {
        accName = journalData.taxName;
      }
      if (!accName) {
        throw new BadRequestException("Account name could not be resolved");
      }

      updatedFileName = `${journalData.date.toISOString().split("T")[0]} - ${accName} - ${companyCurrency.split(" - ")[1]} ${journalData.journalBalance}`;
    }

    return updatedFileName.replace(/\//g, "_");
  }

  buildTransactionWhere(
    transactionTypeId: string,
    transactionTypeName: string,
    paymentId?: string,
  ) {
    const where: any = {
      transactionTypeId,
      transactionTypeName,
    };
    if (
      transactionTypeName === "bill_payment" ||
      transactionTypeName === "invoice_payment"
    ) {
      if (!paymentId) {
        throw new BadRequestException(
          "Payment Id is required for this transaction type",
        );
      }
      where.paymentId = paymentId;
    }
    return where;
  }

  //   ATTACHEMENTS

  async getAttachments(transactionDto: TransactionDto, dataSource: DataSource) {
    const { transactionTypeName, transactionTypeId, paymentId } =
      transactionDto;
    const where = this.buildTransactionWhere(
      transactionTypeId,
      transactionTypeName,
      paymentId,
    );

    const transactions = await dataSource.getRepository(Attachment).find({
      where,
    });

    return JSON.parse(JSON.stringify(transactions));
  }

  async getAttachmentFile(path: string) {
    if (!path) throw new BadRequestException("file path is needed!");
    const signedUrl = await this.storageService.getSignedUrl(path);
    return signedUrl;
  }

  async uploadAttachments(
    files: Express.Multer.File[],
    transactionTypeId: string,
    transactionTypeName: string,
    companyId: string,
    dataSource: DataSource,
    paymentId?: string | undefined,
  ) {
    return dataSource.transaction(async (manager) => {
      const companyCurrency = await this.getCompanyCurrency(manager, companyId);
      const updatedAttachments: AttachmentsInterface[] = [];
      console.log("dfghj");
      if (!files?.length)
        throw new NotFoundException("Require alteast one file");
      for (const file of files) {
        const extension = path.extname(file.originalname);

        // Rename file according to business logic
        const updatedFileName = await this.renameTransactAttachment(
          manager,
          companyId,
          companyCurrency,
          transactionTypeId,
          transactionTypeName,
          paymentId,
        );
        console.log(`Renamed file: ${updatedFileName}`);
        const STORAGE_LOCATION = "gcp_bucket";
        // Upload to GCP
        if (STORAGE_LOCATION === "gcp_bucket") {
          const baseFolder = process.env.BUCKET_BASE_FOLDER!;
          const folderPath = `${baseFolder}/${companyId}/Transact/${transactionTypeName}/`;

          // 2a. Ensure unique filename
          const uniqueFileName =
            await this.storageService.getUniqueFilenameFromBucket(
              updatedFileName,
              extension,
              folderPath,
            );
          console.log(`Unique filename: ${uniqueFileName}`);

          const gcsFilePath = folderPath + uniqueFileName;
          console.log(`GCS filename: ${gcsFilePath}`);

          // 2b. Upload file buffer to GCS
          await this.storageService.uploadBufferToGcs(file.buffer, gcsFilePath);

          // 2c. Add to attachment array
          updatedAttachments.push({
            filename: uniqueFileName,
            path: gcsFilePath,
          });
        }
      }
      console.log("Final attachments:", updatedAttachments);
      await this.updateTransactionAttachments(
        manager,
        transactionTypeId,
        transactionTypeName,
        paymentId,
        updatedAttachments,
      );

      return {
        data: {
          updatedAttachments: updatedAttachments,
        },
        change_of_data: {
          transactionTypeName,
          transactionTypeId,
          paymentId,
          module: "Transact",
          feature: "Attachment",
          status: "Create",
        },
      };
    });
  }

  async updateTransactionAttachments(
    manager: EntityManager,
    transactionTypeId: string,
    transactionTypeName: string,
    paymentId: string | undefined,
    attachments: AttachmentsInterface[],
  ) {
    const where = this.buildTransactionWhere(
      transactionTypeId,
      transactionTypeName,
      paymentId,
    );
    let attachmentRecord = await manager.findOne(Attachment, {
      where,
    });

    if (attachmentRecord) {
      // Update existing record
      attachmentRecord.attachments = [
        ...(attachmentRecord.attachments || []),
        ...attachments,
      ];
      await manager.save(Attachment, attachmentRecord);
    } else {
      // Create new record if not exists
      attachmentRecord = manager.create(Attachment, {
        transactionTypeId,
        transactionTypeName,
        paymentId,
        attachments,
      });
      await manager.save(Attachment, attachmentRecord);
    }

    return attachmentRecord;
  }

  async deleteAttachment(
    transactionTypeId: string,
    transactionTypeName: string,
    filename: string,
    dataSource: DataSource,
    paymentId?: string,
  ) {
    return dataSource.transaction(async (manager: EntityManager) => {
      // Find attachment record
      if (!transactionTypeId || !transactionTypeName)
        throw new BadRequestException("Transaction type id & name is required");

      const where = this.buildTransactionWhere(
        transactionTypeId,
        transactionTypeName,
        paymentId,
      );
      const attachmentRecord = await manager.findOne(Attachment, {
        where,
      });

      if (!attachmentRecord) {
        return { message: "No attachments found for given transaction" };
      }

      console.log(filename, "filename", attachmentRecord.attachments);
      // Filter out the file to delete
      const updatedAttachments = attachmentRecord.attachments.filter(
        (att) => att.filename !== filename,
      );
      console.log(updatedAttachments, "updatedAttachments");

      if (updatedAttachments.length === attachmentRecord.attachments.length) {
        return { message: "File not found in attachments" };
      }

      console.log(updatedAttachments, "updatedAttachments");

      // Delete file from GCP
      const fileToDelete = attachmentRecord.attachments.find(
        (att) => att.filename === filename,
      );
      console.log(fileToDelete, "fileToDelete");
      if (fileToDelete) {
        await this.storageService.deleteFile(fileToDelete.path);

        if (updatedAttachments.length === 0) {
          await manager.remove(Attachment, attachmentRecord);
        } else {
          attachmentRecord.attachments = updatedAttachments;
          await manager.save(Attachment, attachmentRecord);
        }

        // Update the record
        await this.storageService.renameSubsequentFiles(
          process.env.BUCKET_NAME!,
          fileToDelete.path,
          transactionTypeId,
          transactionTypeName,
          paymentId,
          manager,
        );
      }
      return {
        change_of_data: {
          transactionTypeName,
          transactionTypeId,
          paymentId,
          module: "Transact",
          feature: "Attachment",
          status: "Delete",
        },
      };
    });
  }

  //   DELETE TRANSACT
  async removeTransact(
    dataSource: DataSource,
    dto: TransactionDto,
    companyId: string,
  ) {
    let journalBalance = 0;
    let formattedDate = "";

    await dataSource.transaction(async (manager) => {
      const { transactionTypeId, transactionTypeName, paymentId } = dto;

      if (transactionTypeName === "opening_balance")
        throw new BadRequestException("Cannot Delete Opening Balance");

      const transactionRepo = manager.getRepository(Transaction);

      const where = this.buildTransactionWhere(
        transactionTypeId,
        transactionTypeName,
        paymentId,
      );

      const transactions = await transactionRepo.find({
        where,
      });

      if (transactions.length === 0) {
        throw new NotFoundException(
          `No transactions found with type: ${transactionTypeName}`,
        );
      }
      if (transactionTypeName == "invoice" || transactionTypeName == "bill") {
        const payments = await transactionRepo.find({
          where: {
            transactionTypeId,
            transactionTypeName: `${transactionTypeName}_payment`,
          },
        });

        if (payments.length != 0) {
          throw new BadRequestException(
            `${transactionTypeName.toUpperCase()} with payment cannot be deleted`,
          );
        }
        if (transactionTypeName === TransactionTypeName.INVOICE) {
          const invoiceRepo = manager.getRepository(Invoice);
          const invoice = await invoiceRepo.findOne({
            where: { transactionTypeId },
          });
          if (invoice) {
            await invoiceRepo.remove(invoice);
          }
        }
        if (transactionTypeName === TransactionTypeName.BILL) {
          const billRepo = manager.getRepository(Bill);
          const bill = await billRepo.findOne({ where: { transactionTypeId } });
          if (bill) {
            await billRepo.remove(bill);
          }
        }
      }

      journalBalance = parseFloat(transactions[0].journalBalance);
      formattedDate = this.formatTransactionDate(transactions[0].date);

      //  DELETE ATTACHMENTS IF ANY
      const attachmentRepo = manager.getRepository(Attachment);

      const attachmentRecord = await attachmentRepo.findOne({
        where,
      });

      if (attachmentRecord && attachmentRecord.attachments.length > 0) {
        for (const attachment of attachmentRecord.attachments) {
          await this.storageService.deleteFile(attachment.path);
        }
        await attachmentRepo.remove(attachmentRecord);
      }

      const involvedEntities = await this.getInvolvedEntitiesPrefixed(
        manager,
        transactionTypeName,
        transactionTypeId,
      );

      await transactionRepo.remove(transactions);

      await this.updateBalanceAllEntities(involvedEntities, manager, companyId);

      return {
        change_of_data: {
          transactionTypeId,
          journalBalance,
          date: formattedDate,
          module: "Transact",
          feature: capitalizeFirst(transactionTypeName),
          status: "Delete",
        },
      };
    });
  }

  async updateBalanceAllEntities(
    involvedEntities: Set<string>,
    manager: EntityManager,
    companyId: string,
  ) {
    for (const entity of involvedEntities) {
      const parts = entity.split("_");
      const prefix = parts[0];
      const id = Number(parts[1]);

      if (prefix === "a") {
        const accountType = parts[2]; // e.g., Asset, Expense, Income
        await this.updateBalance(manager, companyId, accountType, id);
      } else if (prefix === "c") {
        await this.updateBalance(manager, companyId, "Contact", id);
      } else if (prefix === "t") {
        await this.updateBalance(manager, companyId, "Tax", id);
      }
    }
  }

  async getInvolvedEntitiesPrefixed(
    manager: EntityManager,
    transactionTypeName: string,
    transactionTypeId: string,
    paymentId?: string,
  ): Promise<Set<string>> {
    const query = manager
      .getRepository(Transaction)
      .createQueryBuilder("t")
      .leftJoinAndSelect("t.account", "account")
      .leftJoinAndSelect("t.contact", "contact")
      .leftJoinAndSelect("t.tax", "tax")
      .where("t.transactionTypeName = :transactionTypeName", {
        transactionTypeName,
      })
      .andWhere("t.transactionTypeId = :transactionTypeId", {
        transactionTypeId,
      });

    if (paymentId) {
      query.andWhere("t.paymentId = :paymentId", { paymentId });
    }

    const transactions = await query.getMany();

    const involvedEntities = new Set<string>();

    for (const txn of transactions) {
      if (txn.account) {
        involvedEntities.add(`a_${txn.account.id}_${txn.account.accountType}`);
      }
      if (txn.contact) {
        involvedEntities.add(`c_${txn.contact.id}`);
      }
      if (txn.tax) {
        involvedEntities.add(`t_${txn.tax.id}`);
      }
    }

    return involvedEntities;
  }

  formatTransactionDate(date: string | Date) {
    if (!(date instanceof Date)) {
      return new Date(date).toDateString();
    }
    return date.toDateString();
  }

  async allTransaction(
    dataSource: DataSource,
    limit: number,
    accountType: string,
    companyId: string,
    accountId: number,
    fromDate?: string,
    toDate?: string,
    filter?: string | string[],
    prevCursor?: string | null,
    nextCursor?: string | null,
    newTransactionId?: string | null,
    newTransactionName?: string | null,
    newPaymentId?: string | null,
  ) {
    const transactionRepo = dataSource.getRepository(Transaction);
    const attachmentRepo = dataSource.getRepository(Attachment);
    const invoiceRepo = dataSource.getRepository(Invoice);
    const billRepo = dataSource.getRepository(Bill);

    let result: any[] = [];
    let allTransactCount = 0;
    const finalResult: any[] = [];
    let groupedKeys: any[] = [];

    const normalizeFilter = (filter?: string | string[]) => {
      if (!filter) return null;

      const values = Array.isArray(filter) ? filter : [filter];

      return values.length > 0 ? values : null;
    };

    const transactTypeFilter = normalizeFilter(filter);

    let transactFilterQuery = "";

    if (transactTypeFilter) {
      const list = transactTypeFilter.map((t) => `'${t}'`).join(",");
      transactFilterQuery = `AND transaction_type_name IN (${list})`;
    }

    let min, max;

    if (!fromDate || !toDate) {
      const { minTransactionDate, maxTransactionDate } = await transactionRepo
        .createQueryBuilder("transaction")
        .select("MIN(transaction.date)", "minTransactionDate")
        .addSelect("MAX(transaction.date)", "maxTransactionDate")
        .getRawOne();

      min = minTransactionDate;
      max = maxTransactionDate;
    }

    const formattedFromDate = new Date(fromDate || min);
    const formattedToDate = new Date(toDate || max);

    const where: any = {
      date: Between(formattedFromDate, formattedToDate),
    };
    if (filter) {
      if (Array.isArray(filter)) {
        where.transactionTypeName = In(filter);
      } else {
        where.transactionTypeName = filter;
      }
    }

    let responseNextCursor = "";
    let responsePrevCursor = "";

    let allTransactionResult;

    if (accountType === "all") {
      const isBackwards = !!prevCursor;
      const isForward = !!nextCursor;
      const activeCursor = isBackwards
        ? prevCursor
        : isForward
          ? nextCursor
          : null;

      let descContactId
      let descContactName

      const cursorData = this.decodeCursor(activeCursor);

      const groupedKeysQuery = transactionRepo
        .createQueryBuilder("transaction")
        .select([
          "MAX(transaction.date) AS transaction_date",
          "transaction.transactionTypeId",
          "transaction.transactionTypeName",
          "transaction.paymentId",
          "MAX(transaction.created_at) AS created_at",
        ])
        .where(where)
        .groupBy("transaction.transactionTypeId")
        .addGroupBy("transaction.transactionTypeName")
        .addGroupBy("transaction.paymentId");

      if (newTransactionId && newTransactionName) {
        const qb = transactionRepo
          .createQueryBuilder("transaction")
          .select([
            "MAX(transaction.date) AS transaction_date",
            "transaction.transactionTypeId AS transaction_transaction_type_id",
            "transaction.transactionTypeName AS transaction_transaction_type_name",
            "transaction.paymentId AS transaction_payment_id",
            "MAX(transaction.created_at) AS created_at",
          ])
          .where(
            "transaction.transactionTypeId = :id AND transaction.transactionTypeName =:transactionName",
            {
              id: newTransactionId,
              transactionName: newTransactionName,
            },
          );
        if (newPaymentId) {
          qb.andWhere("transaction.paymentId = :paymentId", {
            paymentId: newPaymentId,
          });
        } else {
          qb.andWhere("transaction.paymentId IS NULL");
        }
        qb.groupBy("transaction.transactionTypeId")
          .addGroupBy("transaction.transactionTypeName")
          .addGroupBy("transaction.paymentId");

        const anchor = await qb.getRawOne();
        if (!anchor || !anchor.created_at) {
          throw new BadRequestException("Transaction Does Not Exist!");
        }
        const totalNeeded = limit - 1;
        const anchorCreateDate = new Date(anchor.created_at);
        const anchorTransactDate = new Date(anchor.transaction_date);
        const prevWindow = Math.ceil(totalNeeded / 2);
        const nextWindow = Math.floor(totalNeeded / 2);
        const [rawNext, rawPrev] = await Promise.all([
          groupedKeysQuery
            .clone()
            .andWhere(
              `(transaction.date >:anchorTransactDate 
              OR (transaction.date = :anchorTransactDate AND transaction.created_at > :anchorCreateDate))
              `,
              {
                anchorTransactDate,
                anchorCreateDate,
              },
            )
            .orderBy("MAX(transaction.date)", "ASC")
            .addOrderBy("MAX(transaction.created_at)", "ASC")
            .limit(nextWindow + 1)
            .offset(1)
            .getRawMany(),

          groupedKeysQuery
            .clone()
            .andWhere(
              `(transaction.date < :anchorTransactDate 
              OR (transaction.date = :anchorTransactDate AND transaction.created_at < :anchorCreateDate))
              `,
              {
                anchorTransactDate,
                anchorCreateDate,
              },
            )
            .orderBy("MAX(transaction.date)", "DESC")
            .addOrderBy("MAX(transaction.created_at)", "DESC")
            .limit(prevWindow + 1)
            .getRawMany(),
        ]);

        const finalPrev = rawPrev.slice(0, prevWindow);
        const finalNext = rawNext.slice(0, nextWindow);

        groupedKeys = [...[...finalPrev].reverse(), anchor, ...finalNext];

        if (groupedKeys.length > 0) {
          responseNextCursor =
            finalNext.length > 0
              ? this.encodeCursor(
                  new Date(finalNext[finalNext.length - 1].transaction_date),
                  new Date(finalNext[finalNext.length - 1].created_at),
                )
              : "";

          responsePrevCursor =
            finalPrev.length > 0
              ? this.encodeCursor(
                  new Date(finalPrev[finalPrev.length - 1].transaction_date),
                  new Date(finalPrev[finalPrev.length - 1].created_at),
                )
              : "";
        }
      } else {
        if (isForward && cursorData) {
          const cDate = new Date(cursorData.d);
          const cCreatedAt = new Date(cursorData.createdAt);
          groupedKeysQuery
            .having(
              `(
              MAX(transaction.date) > :cDate OR 
              (MAX(transaction.date) = :cDate AND MAX(transaction.created_at) > :cCreatedAt)
            )`,
              { cDate, cCreatedAt },
            )
            .orderBy("MAX(transaction.date)", "ASC")
            .addOrderBy("MAX(transaction.created_at)", "ASC");
        } else if (isBackwards && cursorData) {
          const cDate = new Date(cursorData.d);
          const cCreatedAt = new Date(cursorData.createdAt);
          groupedKeysQuery
            .having(
              `(
              MAX(transaction.date) < :cDate OR 
              (MAX(transaction.date) = :cDate AND MAX(transaction.created_at) < :cCreatedAt)
            )`,
              { cDate, cCreatedAt },
            )
            .orderBy("MAX(transaction.date)", "DESC")
            .addOrderBy("MAX(transaction.created_at)", "DESC");
        } else {
          groupedKeysQuery
            .orderBy("MAX(transaction.date)", "DESC")
            .addOrderBy("MAX(transaction.created_at)", "DESC");
        }
        groupedKeys = await groupedKeysQuery.limit(limit + 1).getRawMany();
        const hasMore = groupedKeys.length > limit;
        if (hasMore) {
          groupedKeys.pop();
        }
        if (!isForward) {
          groupedKeys.reverse();
        }
        if (groupedKeys.length > 0) {
          const lastItem = groupedKeys[0];
          const newItem = groupedKeys[groupedKeys.length - 1];
          if (isBackwards) {
            responsePrevCursor = hasMore
              ? this.encodeCursor(
                  new Date(lastItem.transaction_date),
                  new Date(lastItem.created_at),
                )
              : "";
            responseNextCursor = "";
          } else if (isForward) {
            responseNextCursor = hasMore
              ? this.encodeCursor(
                  new Date(newItem.transaction_date),
                  new Date(newItem.created_at),
                )
              : "";
            responsePrevCursor = "";
          } else {
            const lastItem = groupedKeys[0];
            responsePrevCursor = hasMore
              ? this.encodeCursor(
                  new Date(lastItem.transaction_date),
                  new Date(lastItem.created_at),
                )
              : "";
            responseNextCursor = "";
          }
        }
      }

      if (!groupedKeys || groupedKeys.length === 0) {
        return { data: [], count: 0 };
      }
      const query = transactionRepo
        .createQueryBuilder("t")
        .leftJoinAndSelect("t.account", "account")
        .leftJoinAndSelect("t.contact", "contact")
        .leftJoinAndSelect("t.tax", "tax")
        .where("t.date BETWEEN :start AND :end", {
          start: formattedFromDate,
          end: formattedToDate,
        })
        .orderBy("t.date", "DESC");
      query.andWhere(
        new Brackets((qb) => {
          groupedKeys.forEach((keys, i) => {
            const paymentCondition =
              keys.transaction_payment_id === null
                ? `t.paymentId IS NULL`
                : `t.paymentId = :pid${i}`;
            const condition = `(
                t.transactionTypeId = :tid${i} AND 
                t.transactionTypeName = :tname${i} AND 
                ${paymentCondition}
              )`;
            const params = {
              [`tid${i}`]: keys.transaction_transaction_type_id,
              [`tname${i}`]: keys.transaction_transaction_type_name,
            };
            if (keys.transaction_payment_id !== null) {
              params[`pid${i}`] = keys.transaction_payment_id;
            }
            if (i === 0) qb.where(condition, params);
            else qb.orWhere(condition, params);
          });
        }),
      );
      const transactions = await query.getMany();
      if (!transactions.length) {
        return { data: [], count: allTransactCount };
      }
      const countQuery = await transactionRepo
        .createQueryBuilder("transaction")
        .select("transaction.transactionTypeId")
        .where(where)
        .groupBy("transaction.transactionTypeId")
        .addGroupBy("transaction.transactionTypeName")
        .addGroupBy("transaction.paymentId")
        .getRawMany();
      allTransactCount = countQuery.length;
      const groupedTransactions: Record<string, any> = {};

      let i = 0;
      while (i < transactions.length) {
        const transaction = transactions[i];
        const {
          transactionTypeId,
          transactionTypeName,
          paymentId,
          description,
          date,
          journalBalance,
          creditAmount,
          debitAmount,
        } = transaction;
        const groupKey = `${transactionTypeId}_${transactionTypeName}_${paymentId}`;
        if (!groupedTransactions[groupKey]) {
          const attachmentWhere = await this.buildTransactionWhere(
            transactionTypeId,
            transactionTypeName,
            paymentId,
          );
          let paymentFieldBoolean: any;
          let invoiceOrBillNo: any;
          if (
            transactionTypeName === "invoice" ||
            transactionTypeName === "invoice_payment"
          ) {
            const invoiceExists = await invoiceRepo.findOne({
              where: { transactionTypeId },
            });
            invoiceOrBillNo = { descInvoiceNumber: invoiceExists?.invoiceNo };
            if (transactionTypeName === "invoice") {
              const invoicePaymentExists = await transactionRepo.findOne({
                where: {
                  transactionTypeId,
                  transactionTypeName: "invoice_payment",
                  paymentId,
                },
              });
              paymentFieldBoolean = {
                invoicePaymentExists: !!invoicePaymentExists,
              };
            }
          } else if (
            transactionTypeName === "bill" ||
            transactionTypeName === "bill_payment"
          ) {
            const billExists = await billRepo.findOne({
              where: { transactionTypeId },
            });
            invoiceOrBillNo = { descBillNumber: billExists?.billNo };
            if (transactionTypeName === "bill") {
              const billPaymentExists = await transactionRepo.findOne({
                where: {
                  transactionTypeId,
                  transactionTypeName: "bill_payment",
                  paymentId,
                },
              });
              paymentFieldBoolean = {
                billPaymentExists: !!billPaymentExists,
              };
            }
          }
          const attachmentCount = await attachmentRepo.findOne({
            where: attachmentWhere,
          });
          groupedTransactions[groupKey] = {
            transactionTypeId,
            transactionTypeName,
            paymentId,
            descNotes: description,
            date,
            journalBalance: journalBalance || "0.00",
            fromAccount: [],
            toAccount: [],
            noOfAttachments: attachmentCount?.attachments.length || 0,
            ...paymentFieldBoolean,
            ...invoiceOrBillNo,
          };
        }
        const baseAccounts = [
          transaction.account,
          transaction.contact,
          transaction.tax,
        ]
          .filter(Boolean)
          .map((entity) => {
            if (entity instanceof AccountData) {
              return {
                type: "Account",
                id: entity.id,
                name: entity.accountName,
              };
            }
            if (entity instanceof Contact) {
              descContactId = entity.id 
              descContactName = entity.name
              return { type: "Contact", id: entity.id, name: entity.name };
            }
            if (entity instanceof Tax) {
              return { type: "Tax", id: entity.id, name: entity.taxName };
            }
            return null;
          })
          .filter(Boolean);
        if (creditAmount && parseFloat(creditAmount) > 0) {
          groupedTransactions[groupKey].fromAccount.push(
            ...baseAccounts.map((a) => ({
              ...a,
              creditAmount: parseFloat(creditAmount).toFixed(2),
            })),
          );
        }
        if (debitAmount && parseFloat(debitAmount) > 0) {
          groupedTransactions[groupKey].toAccount.push(
            ...baseAccounts.map((a) => ({
              ...a,
              debitAmount: parseFloat(debitAmount).toFixed(2),
            })),
          );
        }
        i++;
      }
      allTransactionResult = Object.values(groupedTransactions).map(
        (group) => ({
          ...group,
          fromAccount: group.fromAccount.sort(
            (a, b) =>
              parseFloat(b.creditAmount || "0") -
              parseFloat(a.creditAmount || "0"),
          ),
          toAccount: group.toAccount.sort(
            (a, b) =>
              parseFloat(b.debitAmount || "0") -
              parseFloat(a.debitAmount || "0"),
          ),
          descContactId,
          descContactName
        }),
      );
    } else {
      {
        let whereColumn: string;

        switch (accountType) {
          case "account":
            whereColumn = "account_id";
            break;
          case "contact":
            whereColumn = "contact_id";
            break;
          case "tax":
            whereColumn = "tax_id";
            break;
          default:
            throw new BadRequestException(
              `Invalid account type: ${accountType}`,
            );
        }

        let accountData: any = null;
        let contactData: any = null;
        let taxData: any = null;
        let accountCurrency = "";

        if (accountType === "account") {
          accountData = await this.accountExists(dataSource.manager, accountId);
          accountCurrency = accountData.account_currency;
        } else if (accountType === "contact") {
          contactData = await this.contactExists(dataSource.manager, accountId);
          accountCurrency = await this.getCompanyCurrency(
            dataSource.manager,
            companyId,
          );
        } else if (accountType === "tax") {
          taxData = await this.taxExists(dataSource.manager, accountId);
          accountCurrency = await this.getCompanyCurrency(
            dataSource.manager,
            companyId,
          );
        }

        const isUpwards = !!prevCursor;
        const isDownards = !!nextCursor;
        const activeCursor = isUpwards ? prevCursor : nextCursor;
        const cursorData = this.decodeCursor(activeCursor);

        const orderByClause = isDownards
          ? `ORDER BY date ASC, created_at ASC, id ASC`
          : `ORDER BY date DESC, created_at DESC, id DESC`;

        let rawQuery = "";
        let rawQueryPrev = "";
        let rawQueryNext = "";
        let rawQueryAnchor = "";

        let downwardCursorCondition = `
                AND (
                    date > $1
                    OR (date = $1 AND created_at > $2)
                )
            `;

        let upwardCursorCondition = `
                AND (
                date < $1
                OR (date = $1 AND created_at < $2)
                )
            `;

        const dataWindow = Math.floor((limit - 1) / 2);
        const finalLimit = newTransactionId ? dataWindow : limit;

        const paymentCondition =
          newPaymentId === undefined
            ? `AND payment_id IS NULL`
            : `AND payment_id = '${newPaymentId}'`;

        if (accountType === "account" && accountData) {
          const countResult = await transactionRepo
            .createQueryBuilder("transaction")
            .select("COUNT(DISTINCT transaction.transactionTypeId)", "total")
            .where(where)
            .andWhere(`transaction.${whereColumn} = :accountId`, { accountId })
            .getRawOne();

          allTransactCount = parseInt(countResult.total);

          const isAssetOrExpense =
            accountData.accountType === "Asset" ||
            accountData.accountType === "Expense";

          const baseCTE = `
WITH base_query AS (
  SELECT 
    id,
    created_at,
    transaction_type_id,
    transaction_type_name,
    payment_id,
    credit_amount,
    debit_amount,
    date,
    account_exchange_rate,
    account_original_exchange_rate,
    round(SUM(${isAssetOrExpense ? "debit_amount - credit_amount" : "credit_amount - debit_amount"}) OVER (ORDER BY date, created_at, transaction_type_id, transaction_type_name ROWS UNBOUNDED PRECEDING)::numeric, 2) AS running_balance,
    CASE WHEN ${isAssetOrExpense ? "debit_amount" : "credit_amount"} = 0 THEN 0 ELSE account_currency_amount END AS ${isAssetOrExpense ? "fc_debit" : "fc_credit"},
    CASE WHEN ${isAssetOrExpense ? "debit_amount" : "credit_amount"} = 0 THEN account_currency_amount ELSE 0 END AS ${isAssetOrExpense ? "fc_credit" : "fc_debit"},
    round(SUM(CASE WHEN ${isAssetOrExpense ? "debit_amount" : "credit_amount"} = 0 THEN -account_currency_amount ELSE account_currency_amount END) OVER (ORDER BY date, created_at, transaction_type_id, transaction_type_name ROWS UNBOUNDED PRECEDING)::numeric, 2) AS fx_running_balance
  FROM biz_books_transaction
  WHERE ${whereColumn} = ${accountId}
    AND date <= '${toDate}'
    ${transactFilterQuery}
        )`;
          rawQuery = `
${baseCTE}
SELECT *,
       (account_original_exchange_rate * fx_running_balance) AS running_balance_latest
FROM base_query
WHERE date BETWEEN '${fromDate}' AND '${toDate}'
${orderByClause}
LIMIT ${limit + 1};
          `;

          rawQueryPrev = `
${baseCTE}
SELECT *, 
       (account_original_exchange_rate * fx_running_balance) as running_balance_latest
FROM base_query
WHERE date BETWEEN '${fromDate}' AND '${toDate}'
    ${upwardCursorCondition}
ORDER BY date DESC, created_at DESC
LIMIT ${finalLimit + 1};
          `;

          rawQueryNext = `
${baseCTE}
SELECT *,
       (account_original_exchange_rate * fx_running_balance) as running_balance_latest
FROM base_query
WHERE date BETWEEN '${fromDate}' AND '${toDate}'
    ${downwardCursorCondition}
ORDER BY date ASC, created_at ASC
LIMIT ${finalLimit + 1}
OFFSET 1;
          `;

          rawQueryAnchor = `
${baseCTE}
SELECT *,
       (account_original_exchange_rate * fx_running_balance) as running_balance_latest
FROM base_query
WHERE transaction_type_id = '${newTransactionId}' 
AND transaction_type_name = '${newTransactionName}' 
    ${paymentCondition};
          `;
        } else if (accountType === "contact" && contactData) {
          const countQuery = `
      SELECT COUNT(*) AS total
      FROM (
        SELECT DISTINCT
          transaction_type_id,
          transaction_type_name,
          payment_id
        FROM biz_books_transaction
        WHERE contact_id = $1
        AND date BETWEEN $2 AND $3
        ${transactFilterQuery}
      ) t
		      `;
          const countResult = await dataSource.query(countQuery, [
            contactData.id,
            formattedFromDate,
            formattedToDate,
          ]);
          allTransactCount = countResult[0]?.total || 0;

          const contactCTE = `
WITH base_query AS (
  SELECT 
    t2.id,
    t2.created_at,
    t2.transaction_type_id,
    t2.transaction_type_name,
    t2.payment_id,
    CASE 
      WHEN t2.has_contact_mapping THEN 
        CASE WHEN t2.debit_amount != 0 THEN 
          (t2.contact_mapping->>'${contactData.id}')::numeric *
          CASE 
            WHEN t2.transaction_type_name = 'transfer' THEN t2.account_exchange_rate
            WHEN t2.transaction_type_name = 'opening_balance' THEN 1
            ELSE t2.counter_exchange_rate
          END
        ELSE 0 END
      ELSE t2.debit_amount
    END AS debit_amount,
    CASE 
      WHEN t2.has_contact_mapping THEN 
        CASE WHEN t2.credit_amount != 0 THEN 
          (t2.contact_mapping->>'${contactData.id}')::numeric *
          CASE 
            WHEN t2.transaction_type_name = 'transfer' THEN t2.account_exchange_rate
            WHEN t2.transaction_type_name = 'opening_balance' THEN 1
            ELSE t2.counter_exchange_rate
          END
        ELSE 0 END
      ELSE t2.credit_amount
    END AS credit_amount,
    t2.date,
    t2.account_exchange_rate,
    t2.account_original_exchange_rate,
    ROUND(
      SUM(
        CASE 
          WHEN t2.has_contact_mapping THEN 
            (CASE 
              WHEN t2.debit_amount != 0 THEN 
                (t2.contact_mapping->>'${contactData.id}')::numeric *
                CASE 
                  WHEN t2.transaction_type_name = 'transfer' THEN t2.account_exchange_rate
                  WHEN t2.transaction_type_name = 'opening_balance' THEN 1
                  ELSE t2.counter_exchange_rate
                END
              ELSE 0 
            END)
            -
            (CASE 
              WHEN t2.credit_amount != 0 THEN 
                (t2.contact_mapping->>'${contactData.id}')::numeric *
                CASE 
                  WHEN t2.transaction_type_name = 'transfer' THEN t2.account_exchange_rate
                  WHEN t2.transaction_type_name = 'opening_balance' THEN 1
                  ELSE t2.counter_exchange_rate
                END
              ELSE 0 
            END)
          ELSE t2.debit_amount - t2.credit_amount
        END
      ) OVER (ORDER BY t2.date, t2.created_at, t2.id ROWS UNBOUNDED PRECEDING)::NUMERIC,
    2) AS running_balance,
    CASE 
								WHEN t2.has_contact_mapping THEN 
									CASE 
										WHEN t2.debit_amount = 0 THEN 0 
										ELSE (t2.contact_mapping->>'{}')::numeric * 
											CASE 
												WHEN t2.transaction_type_name = 'transfer' THEN t2.account_exchange_rate
												WHEN t2.transaction_type_name = 'opening_balance' THEN 1
												ELSE t2.counter_exchange_rate
											END
									END
								ELSE CASE WHEN t2.debit_amount = 0 THEN 0 ELSE t2.account_currency_amount END
							END AS fc_debit,
							CASE 
								WHEN t2.has_contact_mapping THEN 
									CASE 
										WHEN t2.debit_amount = 0 THEN 
											(t2.contact_mapping->>'{}')::numeric * 
											CASE 
												WHEN t2.transaction_type_name = 'transfer' THEN t2.account_exchange_rate
												WHEN t2.transaction_type_name = 'opening_balance' THEN 1
												ELSE t2.counter_exchange_rate
											END
										ELSE 0 
									END
								ELSE CASE WHEN t2.debit_amount = 0 THEN t2.account_currency_amount ELSE 0 END
							END AS fc_credit,
							ROUND(SUM(
								CASE 
									WHEN t2.has_contact_mapping THEN 
										CASE 
											WHEN t2.debit_amount = 0 THEN 
												-((t2.contact_mapping->>'{}')::numeric * 
												CASE 
													WHEN t2.transaction_type_name = 'transfer' THEN t2.account_exchange_rate
													WHEN t2.transaction_type_name = 'opening_balance' THEN 1
													ELSE t2.counter_exchange_rate
												END) 
											ELSE 
												(t2.contact_mapping->>'{}')::numeric * 
												CASE 
													WHEN t2.transaction_type_name = 'transfer' THEN t2.account_exchange_rate
													WHEN t2.transaction_type_name = 'opening_balance' THEN 1
													ELSE t2.counter_exchange_rate
												END
										END
									ELSE CASE WHEN t2.debit_amount = 0 THEN -t2.account_currency_amount ELSE t2.account_currency_amount END
								END
							) OVER (ORDER BY t2.date, t2.created_at, t2.transaction_type_id, t2.transaction_type_name ROWS UNBOUNDED PRECEDING)::NUMERIC, 2) AS fx_running_balance
  FROM biz_books_transaction t2
  WHERE (
    t2.contact_id = ${contactData.id}
    OR (t2.contact_mapping::jsonb ? '${contactData.id}' AND t2.tax_id IS NULL)
  )
  AND t2.date <= '${toDate}'
  ${transactFilterQuery}
          )`;

          rawQuery = `
${contactCTE}
SELECT *,
  (account_original_exchange_rate * fx_running_balance) AS running_balance_latest
FROM base_query
WHERE date BETWEEN '${fromDate}' AND '${toDate}'
${orderByClause}
LIMIT ${limit + 1};
          `;

          rawQueryPrev = `
${contactCTE}
SELECT *,
  (account_original_exchange_rate * fx_running_balance) AS running_balance_latest
FROM base_query
WHERE date BETWEEN '${fromDate}' AND '${toDate}'
${upwardCursorCondition}
ORDER BY date DESC, created_at DESC
LIMIT ${finalLimit + 1};
          `;

          rawQueryNext = `
${contactCTE}
SELECT *,
  (account_original_exchange_rate * fx_running_balance) AS running_balance_latest
FROM base_query
WHERE date BETWEEN '${fromDate}' AND '${toDate}'
${downwardCursorCondition}
ORDER BY date ASC, created_at ASC
LIMIT ${finalLimit + 1}
OFFSET 1;
          `;

          rawQueryAnchor = `
${contactCTE}
SELECT *,
(account_original_exchange_rate * fx_running_balance) AS running_balance_latest
FROM base_query
WHERE transaction_type_id = '${newTransactionId}'
AND transaction_type_name = '${newTransactionName}'
${paymentCondition};
          `;
        } else if (accountType === "tax" && taxData) {
          const countQuery = `
      SELECT COUNT(*) AS total
      FROM (
        SELECT DISTINCT
          transaction_type_id,
          transaction_type_name,
          payment_id
        FROM biz_books_transaction
			WHERE tax_id = $1
			AND date BETWEEN $2 AND $3
			${transactFilterQuery}
      ) AS sub
		      `;
          const countResult = await dataSource.query(countQuery, [
            taxData.id,
            formattedFromDate,
            formattedToDate,
          ]);
          allTransactCount = countResult[0]?.total || 0;

          const taxCTE = `
WITH base_query AS (
  SELECT 
    id,
    created_at,
    transaction_type_id,
    transaction_type_name,
    payment_id,
    credit_amount,
    debit_amount,
    date,
    account_exchange_rate,
    account_original_exchange_rate,
    round(
      SUM(debit_amount - credit_amount)
      OVER (ORDER BY date, created_at, id ROWS UNBOUNDED PRECEDING)::numeric,
    2) AS running_balance,
    CASE WHEN debit_amount = 0 THEN 0 ELSE account_currency_amount END AS fc_debit,
    CASE WHEN debit_amount = 0 THEN account_currency_amount ELSE 0 END AS fc_credit,
    round(
      SUM(
        CASE 
          WHEN debit_amount = 0 THEN -account_currency_amount 
          ELSE account_currency_amount 
        END
      ) OVER (ORDER BY date, created_at, id ROWS UNBOUNDED PRECEDING)::numeric,
    2) AS fx_running_balance
  FROM biz_books_transaction
  WHERE tax_id = ${taxData.id}
  AND date <= '${toDate}'
  ${transactFilterQuery}
          )`;

          rawQuery = `
${taxCTE}
SELECT *,
       (account_original_exchange_rate * fx_running_balance) as running_balance_latest
FROM base_query
WHERE date BETWEEN '${fromDate}' AND '${toDate}'
${orderByClause}
LIMIT ${limit + 1};
          `;

          rawQueryPrev = `
${taxCTE}
SELECT *,
       (account_original_exchange_rate * fx_running_balance) as running_balance_latest
FROM base_query
WHERE date BETWEEN '${fromDate}' AND '${toDate}'
  ${upwardCursorCondition}
ORDER BY date DESC, created_at DESC
LIMIT ${finalLimit + 1};
          `;

          rawQueryNext = `
${taxCTE}
SELECT *,
       (account_original_exchange_rate * fx_running_balance) as running_balance_latest
FROM base_query
WHERE date BETWEEN '${fromDate}' AND '${toDate}'
  ${downwardCursorCondition}
ORDER BY date ASC, created_at ASC
LIMIT ${finalLimit + 1}
OFFSET 1;
          `;

          rawQueryAnchor = `
${taxCTE}
SELECT *,
       (account_original_exchange_rate * fx_running_balance) as running_balance_latest
FROM base_query
WHERE transaction_type_id = '${newTransactionId}'
AND transaction_type_name = '${newTransactionName}'
${paymentCondition};
          `;
        } else {
          throw new NotFoundException("Account type does not exist.");
        }

        if (newTransactionId && newTransactionName) {
          let resultAnchor = await dataSource.query(rawQueryAnchor);

          let anchor = resultAnchor[0];

          if (!anchor)
            throw new BadRequestException("Transaction Does Not Exists!");

          const anchorDate = anchor.date;
          const anchorCreated = anchor.created_at;

          let resultPrev = await dataSource.query(rawQueryPrev, [
            anchorDate,
            anchorCreated,
          ]);

          let resultNext = await dataSource.query(rawQueryNext, [
            anchorDate,
            anchorCreated,
          ]);

          if (resultPrev.length > dataWindow) {
            const prevCursorData = resultPrev.pop();
            responsePrevCursor = this.encodeCursor(
              prevCursorData.date,
              prevCursorData.created_at,
            );
          } else if (resultNext.length > dataWindow) {
            resultNext.length = dataWindow + 1;
            const nextCursorData = resultNext.pop();
            responseNextCursor = this.encodeCursor(
              nextCursorData.date,
              nextCursorData.created_at,
            );
          }

          resultPrev.reverse();

          result = [...resultPrev, anchor, ...resultNext];

          result.reverse();
        } else if (cursorData) {
          if (isUpwards) {
            result = await dataSource.query(rawQueryPrev, [
              cursorData.d,
              cursorData.createdAt,
            ]);
            if (result.length > limit) {
              result.pop();
              const prevCursorData = result[result.length - 1];
              responsePrevCursor = this.encodeCursor(
                prevCursorData.date,
                prevCursorData.created_at,
              );
            }
          } else if (isDownards) {
            result = await dataSource.query(rawQueryPrev, [
              cursorData.d,
              cursorData.createdAt,
            ]);
            if (result.length > limit) {
              result.pop();
              const nextCursorData = result[result.length - 1];
              responseNextCursor = this.encodeCursor(
                nextCursorData.date,
                nextCursorData.created_at,
              );
            }
            result.reverse();
          }
        } else {
          result = await dataSource.query(rawQuery);
          if (result.length > limit) {
            result.pop();
            const prevCursorData = result[result.length - 1];
            responsePrevCursor = this.encodeCursor(
              prevCursorData.date,
              prevCursorData.created_at,
            );
          }
        }

        for (const journal of result) {
          const relatedAccountsQuery = `
                SELECT t.account_id, t.contact_id, t.tax_id, a.account_name AS account_name, c.name AS contact_name, tx.tax_name AS tax_name, credit_amount, debit_amount
                FROM biz_books_transaction t
                LEFT JOIN biz_books_account_data a ON a.id = t.account_id
                LEFT JOIN biz_books_contact_data c ON c.id = t.contact_id
                LEFT JOIN biz_books_tax_data tx ON tx.id = t.tax_id
                WHERE t.transaction_type_id = $1
                AND t.transaction_type_name = $2
                AND (($3::text IS NULL AND t.payment_id IS NULL) OR t.payment_id = $3::text)
        `;

          const relatedAccounts = await dataSource.query(relatedAccountsQuery, [
            journal.transaction_type_id,
            journal.transaction_type_name,
            journal.payment_id,
          ]);

          let paymentFieldBoolean: any;
          let invoiceOrBillNo: any;

          if (
            journal.transaction_type_name === "invoice" ||
            journal.transaction_type_name === "invoice_payment"
          ) {
            const invoiceExists = await invoiceRepo.findOne({
              where: { transactionTypeId: journal.transaction_type_id },
            });
            invoiceOrBillNo = { descInvoiceNumber: invoiceExists?.invoiceNo };
            if (journal.transaction_type_name === "invoice") {
              const invoicePaymentExists = await transactionRepo.findOne({
                where: {
                  transactionTypeId: journal.transaction_type_id,
                  transactionTypeName: "invoice_payment",
                  paymentId: journal.payment_id,
                },
              });
              paymentFieldBoolean = {
                invoicePaymentExists: !!invoicePaymentExists,
              };
            }
          } else if (
            journal.transaction_type_name === "bill" ||
            journal.transaction_type_name === "bill_payment"
          ) {
            const billExists = await billRepo.findOne({
              where: { transactionTypeId: journal.transaction_type_id },
            });
            invoiceOrBillNo = { descBillNumber: billExists?.billNo };
            if (journal.transaction_type_name === "bill") {
              const billPaymentExists = await transactionRepo.findOne({
                where: {
                  transactionTypeId: journal.transaction_type_id,
                  transactionTypeName: "bill_payment",
                  paymentId: journal.payment_id,
                },
              });
              paymentFieldBoolean = {
                billPaymentExists: !!billPaymentExists,
              };
            }
          }

          // attachment count
          const attachmentWhere = await this.buildTransactionWhere(
            journal.transaction_type_id,
            journal.transaction_type_name,
            journal.payment_id,
          );

          const attachmentCount = await attachmentRepo.findOne({
            where: attachmentWhere,
          });

          const relatedAccountsFinal: any[] = [];
          const relatedAccountsList: any[] = [];
          const relatedContactsList: any[] = [];
          const relatedTaxesList: any[] = [];

          for (const item of relatedAccounts) {
            if (item.account_id) {
              if (item.account_id == accountId && accountType == "account") {
                continue;
              }

              if (item.account_name === "In Transit" && item.transit_link) {
                // in transit to be handled
              } else {
                relatedAccountsList.push({
                  type: "Account",
                  id: item.account_id,
                  name: item.account_name,
                  amount:
                    item.debit_amount !== 0
                      ? item.debit_amount
                      : item.credit_amount,
                });
              }
            }

            if (item.contact_id) {
              if (item.contact_id == accountId && accountType == "account") {
                continue;
              }

              relatedContactsList.push({
                type: "Contact",
                id: item.contact_id,
                name: item.contact_name,
                amount:
                  item.debit_amount !== 0
                    ? item.debit_amount
                    : item.credit_amount,
              });
            }

            if (item.tax_id) {
              if (item.tax_id == accountId && accountType == "account") {
                continue;
              }
              relatedTaxesList.push({
                type: "Tax",
                id: item.tax_id,
                name: item.tax_name,
                amount:
                  item.debit_amount !== 0
                    ? item.debit_amount
                    : item.credit_amount,
              });
            }
          }
          relatedAccountsFinal.push(
            ...relatedAccountsList,
            ...relatedContactsList,
            ...relatedTaxesList,
          );

          const accountBalanceLatest =
            journal.running_balance_latest !== null
              ? parseFloat(journal.running_balance_latest).toFixed(2)
              : null;

          const resultItem: any = {
            id: journal.id,
            transactionTypeId: journal.transaction_type_id,
            transactionTypeName: journal.transaction_type_name,
            date: journal.date,
            debit: journal.debit_amount,
            credit: journal.credit_amount,
            description: journal.description,
            accountBalance: parseFloat(journal.running_balance).toFixed(2),
            accountBalanceLatest: accountBalanceLatest,
            descContactName: null,
            descContactId: null,
            descNotes: null,
            fcDebit: journal.fc_debit,
            fcCredit: journal.fc_credit,
            fxRunningBalance: journal.fx_running_balance,
            paymentId: journal.payment_id,
            accountCurrency: accountCurrency,
            noOfAttachments: attachmentCount?.attachments.length || 0,
            ...invoiceOrBillNo,
            ...paymentFieldBoolean,
            relatedAccounts: Array.from(
              new Map(
                relatedAccountsFinal.map((a) => [JSON.stringify(a), a]),
              ).values(),
            ).sort((a, b) => Number(b.amount) - Number(a.amount)),
          };

          if (
            journal.transaction_type_name === "invoice_payment" ||
            journal.transaction_type_name === "invoice"
          ) {
            const contactDetailsQuery = `
            SELECT c.name AS contact_name, c.id AS contact_id, i.invoice_no
            FROM biz_books_invoice i
            JOIN biz_books_contact_data c ON i.contact_id = c.id
            WHERE i.transaction_type_id = $1
            `;
            const contactDetails = await dataSource.query(contactDetailsQuery, [
              journal.transaction_type_id,
            ]);

            if (contactDetails.length) {
              resultItem.descContactName = contactDetails[0].contact_name;
              resultItem.descContactId = contactDetails[0].contact_id;
              resultItem.descInvoiceNumber = contactDetails[0].invoice_no;
              if (journal.transaction_type_name !== "invoice") {
                resultItem.descNotes = journal.description;
              }
            }
          } else if (
            journal.transaction_type_name === "bill_payment" ||
            journal.transaction_type_name === "bill"
          ) {
            const contactDetailsQuery = `
        SELECT c.name AS contact_name, c.id AS contact_id, b.bill_no
        FROM biz_books_bill b
        JOIN biz_books_contact_data c ON b.contact_id = c.id
        WHERE b.transaction_type_id = $1
        `;
            const contactDetails = await dataSource.query(contactDetailsQuery, [
              journal.transaction_type_id,
            ]);

            if (contactDetails.length) {
              resultItem.descContactName = contactDetails[0].contact_name;
              resultItem.descContactId = contactDetails[0].contact_id;
              resultItem.descBillNumber = contactDetails[0].bill_no;
              if (journal.transaction_type_name !== "bill") {
                resultItem.descNotes = journal.description;
              }
            }
          }

          finalResult.push(resultItem);
        }
      }
    }

    return {
      data: finalResult.length
        ? finalResult
        : allTransactionResult.length
          ? allTransactionResult
          : [],
      totalCount: allTransactCount,
      prevCursor: responsePrevCursor.length ? responsePrevCursor : null,
      nextCursor: responseNextCursor.length ? responseNextCursor : null,
    };
  }

  async transactionCount(
    dataSource: DataSource,
    fromDate: string,
    toDate: string,
    filter: string | string[],
  ) {
    const transactionRepo = dataSource.getRepository(Transaction);

    const { min, max } = await transactionRepo
      .createQueryBuilder("t")
      .select("MIN(t.date)", "min")
      .addSelect("MAX(t.date)", "max")
      .getRawOne();

    const formattedFromDate = fromDate ? new Date(fromDate) : min;
    const formattedToDate = toDate ? new Date(toDate) : max;

    const qb = transactionRepo
      .createQueryBuilder("t")
      .select(
        "COUNT(DISTINCT (t.transactionTypeId, t.transactionTypeName, t.paymentId))",
        "count",
      )
      .where("t.date BETWEEN :from AND :to", {
        from: formattedFromDate,
        to: formattedToDate,
      })
      .andWhere("t.transactionTypeName != :excludedType", {
        excludedType: "opening_balance",
      });

    if (filter) {
      if (Array.isArray(filter)) {
        qb.andWhere("t.transactionTypeName IN (:...filter)", { filter });
      } else {
        qb.andWhere("t.transactionTypeName = :filter", { filter });
      }
    }

    const { count } = await qb.getRawOne();

    return { data: { count: Number(count) } };
  }

  async transactionNames(dataSource: DataSource) {
    const transactionRepo = dataSource.getRepository(Transaction);

    const names = await transactionRepo
      .createQueryBuilder("transaction")
      .select("transaction.transactionTypeName", "transactionTypeName")
      .distinct(true)
      .getRawMany();

    return {
      names: names.map((n) => n.transactionTypeName),
    };
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

  async getAccountName(
    manager: EntityManager,
    id: number,
    type: AccountTypeTransact,
  ) {
    const repo =
      type === "Contact"
        ? manager.getRepository(Contact)
        : type === "Tax"
          ? manager.getRepository(Tax)
          : manager.getRepository(AccountData);
    const entity = await repo.findOne({ where: { id } });

    if (!entity) throw new NotFoundException("Account Does Not Exist!");

    if (type === "Contact" && "name" in entity) {
      return { name: entity.name };
    } else if ("accountName" in entity) {
      return { name: entity.accountName };
    } else if ("taxName" in entity) {
      return { name: entity.taxName };
    }

    throw new InternalServerErrorException("Name Not Found!");
  }

  async exportTransactionsToPdf(
    dataSource: DataSource,
    fromDate: string,
    toDate: string,
    filter: string | string[],
    accountId: number,
    accountType: AccountTypeTransact | "all",
    companyId: string,
    headerUrl: string,
    displayName: string,
  ) {
    let filename: string;
    const type = accountType;
    const htmlPath = getTemplatePath("transact-export-pdf-format.html");
    if (!htmlPath) {
      throw new InternalServerErrorException("File Path Missing!");
    }

    const { commaSeparation } = await this.getCommaSeperation(
      dataSource.manager,
      companyId,
    );

    const result = await this.allTransaction(
      dataSource,
      Number.MAX_SAFE_INTEGER,
      accountType,
      companyId,
      accountId,
      fromDate,
      toDate,
      filter,
    );

    const filterLabel =
      filter && (Array.isArray(filter) ? filter.length : filter)
        ? Array.isArray(filter)
          ? filter.join(", ")
          : filter
        : "All";

    const isAccountReport = accountType.toLowerCase() === "account";

    const { name } = await this.getAccountName(
      dataSource.manager,
      accountId,
      accountType as AccountTypeTransact,
    );

    if (accountType.toLowerCase() == "all") {
      filename = `Transaction_All_Accounts_${fromDate}_to_${toDate}.pdf`;
    } else {
      const { name } = await this.getAccountName(
        dataSource.manager,
        accountId,
        accountType as AccountTypeTransact,
      );

      filename = `Transaction_${name}_${fromDate}_to_${toDate}.pdf`;
    }

    const transactions = result?.data ?? [];
    const rows: any[] = [];
    const locale = commaSeparation === "IN" ? "en-IN" : "en-US";

    const formatCurr = (val: any) => {
      const num = parseFloat(val || 0);
      return num.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    if (isAccountReport) {
      for (const txn of transactions) {
        rows.push({
          date: new Date(txn.date).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          transactionTypeId: txn.transactionTypeId,
          transactionTypeName: txn.transactionTypeName,
          description: txn.description || txn.descNotes || "-",
          fromOrToAccount: name,
          debit: parseFloat(txn.debit) !== 0 ? formatCurr(txn.debit) : "",
          credit: parseFloat(txn.credit) !== 0 ? formatCurr(txn.credit) : "",
          balance: formatCurr(txn.accountBalance),
        });
      }
    } else {
      for (const txn of transactions) {
        const fromAccounts = txn.fromAccount || [];
        const toAccounts = txn.toAccount || [];
        const maxRows = Math.max(fromAccounts.length, toAccounts.length);

        for (let i = 0; i < maxRows; i++) {
          rows.push({
            transactionTypeId: i === 0 ? txn.transactionTypeId : null,
            transactionTypeName: i === 0 ? txn.transactionTypeName : null,
            date:
              i === 0
                ? new Date(txn.date).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : null,
            description: i === 0 ? txn.description : null,
            fromAccountName: fromAccounts[i]?.name || "",
            toAccountName: toAccounts[i]?.name || "",
            amount: i === 0 ? formatCurr(txn.journalBalance) : null,
            rowspan: i === 0 ? maxRows : null,
          });
        }
      }
    }

    const htmlTemplate = fs.readFileSync(htmlPath, "utf8");
    const template = hbs.compile(htmlTemplate);

    const finalHtml = template({
      headerUrl,
      rows,
      filterLabel,
      isAccountReport,
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

  async exportTransactionsToExcel(
    dataSource: DataSource,
    fromDate: string,
    toDate: string,
    filter: string | string[],
    accountId: number,
    accountType: AccountTypeTransact | "all",
    companyId: string,
    headerUrl: string,
  ) {
    let filename: string;

    const { commaSeparation } = await this.getCommaSeperation(
      dataSource.manager,
      companyId,
    );

    const numFmt = commaSeparation === "IN" ? "#,##,##0.00" : "#,##0.00";

    const result = await this.allTransaction(
      dataSource,
      Number.MAX_SAFE_INTEGER,
      accountType,
      companyId,
      accountId,
      fromDate,
      toDate,
      filter,
    );

    if (accountType.toLowerCase() == "all") {
      filename = `Transaction_All_Accounts_${fromDate}_to_${toDate}.xlsx`;
    } else {
      const { name } = await this.getAccountName(
        dataSource.manager,
        accountId,
        accountType as AccountTypeTransact,
      );
      filename = `Transaction_${name}_${fromDate}_to_${toDate}.xlsx`;
    }

    const transactions = result?.data ?? [];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Transactions");

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
      "Transaction Type ID",
      "Transaction Type",
      "Description",
      "From Account",
      "To Account",
      "Amount",
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

    for (const txn of transactions) {
      const fromAccounts = txn.fromAccount || [];
      const toAccounts = txn.toAccount || [];
      const maxRows = Math.max(fromAccounts.length, toAccounts.length);

      const startRow = sheet.rowCount + 1;

      for (let i = 0; i < maxRows; i++) {
        const row = sheet.addRow([
          i === 0 ? txn.date : "",
          i === 0 ? txn.transactionTypeId : "",
          i === 0 ? txn.transactionTypeName : "",
          i === 0 ? txn.description : "",
          fromAccounts[i]?.name || "",
          toAccounts[i]?.name || "",
          i === 0 ? Number(txn.journalBalance) : 0.0,
        ]);

        row.getCell(7).numFmt = numFmt;
        row.getCell(7).alignment = { horizontal: "right" };
      }

      const endRow = sheet.rowCount;

      for (let r = startRow; r <= endRow; r++) {
        const row = sheet.getRow(r);
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: r === startRow ? { style: "thin" } : undefined,
            bottom: r === endRow ? { style: "thin" } : undefined,
            left: colNumber === 1 ? { style: "thin" } : undefined,
            right:
              colNumber === sheet.columnCount ? { style: "thin" } : undefined,
          };
        });
      }
    }

    sheet.columns = [
      { width: 15 },
      { width: 25 },
      { width: 20 },
      { width: 30 },
      { width: 25 },
      { width: 25 },
      { width: 18, style: { numFmt } },
    ];

    const fileBuffer = await workbook.xlsx.writeBuffer();
    return { fileBuffer: Buffer.from(fileBuffer), filename };
  }

  async getAttachmentsCount(
    transactionDto: TransactionDto,
    dataSource: DataSource,
  ): Promise<number> {
    const { transactionTypeName, transactionTypeId, paymentId } =
      transactionDto;
    const where = this.buildTransactionWhere(
      transactionTypeId,
      transactionTypeName,
      paymentId,
    );

    const attachmentRecord = await dataSource
      .getRepository(Attachment)
      .findOne({
        where,
        select: ["attachments"],
      });

    if (!attachmentRecord) {
      return 0;
    }
    return attachmentRecord.attachments?.length || 0;
  }
}
