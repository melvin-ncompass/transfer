import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateBillDto } from "./dto/create-bill.dto";
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  Not,
  Repository,
} from "typeorm";
import { Bill } from "./entities/tenant.bill.entity";
import { BillItem } from "./entities/tenant.bill-item.entity";
import { TransactService } from "../transact/transact.service";
import { AccountData } from "../account/entities/tenant.account.entity";
import { AccountType } from "src/common/enum/account-type.enum";
import { Transaction } from "../transact/entities/tenant.transaction.entity";
import { Tax } from "../tax/entities/tenant.tax.entity";
import { UpdateBillDto } from "./dto/update-bill.dto";
import { CalculatedAmounts } from "src/common/interface/calculate-amount.interface";
import { BillPaymentDto } from "./dto/bill-payment.dto";
import { Contact } from "../contact/entities/tenant.contact.entity";
import { Attachment } from "../transact/entities/tenant.attachment.entity";
import {
  ApplyLevel,
  DiscountApplied,
  DiscountType,
  TdsType,
} from "src/common/enum/transact.enum";
import {
  AggregatedTds,
  AggregatedTax,
  TaxType,
} from "src/common/interface/tax-summary.interface.";
import {
  CompanyIdentity,
  CompanyMetaData,
} from "src/setting/entities/tenant.company-identity.entity";
import { Company } from "src/company/entities/company.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class BillService {
  constructor(
    private readonly transactService: TransactService,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

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

  private calculateAggregatedItemTds(items: BillItem[]): AggregatedTds[] {
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

  private calculateSubTotal(items: BillItem[]): number {
    return items.reduce((sum, i) => sum + Number(i.itemTotal), 0);
  }

  private calculateAggregatedTaxes(
    items: BillItem[],
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
    bill: Bill,
    items: BillItem[],
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
    const discount = this.calculateBillDiscount(bill, subTotal, taxTotal);

    // ---------- TDS ----------
    const itemTds =
      bill.tdsLevel === ApplyLevel.ITEM
        ? this.calculateAggregatedItemTds(items)
        : [];

    const billTds =
      bill.tdsLevel === ApplyLevel.TOTAL
        ? this.calculateTotalLevelTds(
            subTotal,
            bill.tdsType,
            Number(bill.tdsValue),
          )
        : 0;

    return {
      subTotal,
      discount: discount > 0 ? discount : 0,
      itemTds,
      billTds,
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

  private calculateBillDiscount(
    bill: Bill,
    subTotal: number,
    taxTotal: number,
  ): number {
    if (!bill.discountApplied) return 0;

    let baseAmount = subTotal;

    // AFTER → subtotal + tax
    if (bill.discountApplied === DiscountApplied.AFTER) {
      baseAmount = subTotal + taxTotal;
    }

    return this.calculateDiscountAmount(
      baseAmount,
      bill.discountType,
      bill.discountValue,
    );
  }

  private normalize = (s?: string) =>
    s?.trim().toLowerCase().replace(/\s+/g, " ");

  // SAVE FX GAIN/LOSS ENTRY
  private async createFxGainOrLossEntry(
    manager: EntityManager,
    billPaymentDto: BillPaymentDto,
    companyCurrency: string,
    accPayable: AccountData,
    fxAccount: AccountData,
    fxGainLoss: number,
    journalBalance: string,
    contact: Contact,
    paymentId: string,
  ) {
    const fxGainLossAbs = Math.abs(fxGainLoss).toFixed(2);
    // FX ACC ENTRY
    await manager.save(Transaction, {
      date: new Date(billPaymentDto.paymentDate),
      description: billPaymentDto.notes ?? "",
      account: fxAccount,
      debitAmount: fxGainLoss > 0 ? fxGainLossAbs : "0",
      creditAmount: fxGainLoss < 0 ? fxGainLossAbs : "0",
      journalBalance: journalBalance,
      accountCurrency: companyCurrency,
      accountCurrencyAmount: fxGainLossAbs,
      counterCurrency: companyCurrency,
      counterCurrencyAmount: fxGainLossAbs,
      counterExchangeRate: 1,
      counterOriginalExchangeRate: 1,
      transactionTypeName: "bill_payment",
      transactionTypeId: billPaymentDto.transactionTypeId,
      paymentId: paymentId,
      accountExchangeRate: 1,
      accountOriginalExchangeRate: 1,
    });
    // ACC PAYABLE ENTRY
    await manager.save(Transaction, {
      date: new Date(billPaymentDto.paymentDate),
      description: billPaymentDto.notes ?? "",
      account: accPayable,
      contact,
      debitAmount: fxGainLoss < 0 ? fxGainLossAbs : "0",
      creditAmount: fxGainLoss > 0 ? fxGainLossAbs : "0",
      journalBalance: journalBalance,
      accountCurrency: companyCurrency,
      accountCurrencyAmount: fxGainLossAbs,
      accountExchangeRate: 1,
      accountOriginalExchangeRate: 1,
      counterCurrency: companyCurrency,
      counterCurrencyAmount: fxGainLossAbs,
      counterExchangeRate: 1,
      counterOriginalExchangeRate: 1,
      transactionTypeName: "bill_payment",
      transactionTypeId: billPaymentDto.transactionTypeId,
      paymentId: paymentId,
    });
  }

  // VALIDATE & GET BILL PAYMENT DATA
  private async validateAndFetchBillPaymentData(
    manager: EntityManager,
    billPaymentDto: BillPaymentDto,
    companyId: string,
  ) {
    // VALIDATE ACCOUNTS
    const paymentAccount = await this.transactService.accountExists(
      manager,
      billPaymentDto.paymentAccountId,
    );
    if (!paymentAccount)
      throw new BadRequestException("Payment account not found");

    if (
      paymentAccount.accountType == AccountType.INCOME ||
      paymentAccount.accountType == AccountType.EXPENSE
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
    const accPayable = await manager.findOne(AccountData, {
      where: {
        accountName: "Accounts Payable",
        accountType: AccountType.LIABILITY,
      },
    });

    if (!accPayable) {
      throw new BadRequestException("Accounts Payable missing");
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

    // FETCH COMPANY CURRENCY
    const companyCurrency = await this.transactService.getCompanyCurrency(
      manager,
      companyId,
    );

    // FETCH BILL
    const bill = await manager.findOne(Bill, {
      where: { transactionTypeId: billPaymentDto.transactionTypeId },
    });
    if (!bill) throw new BadRequestException("Bill not found");

    // FETCH BILL'S ACCOUNT PAYABLE TRANSACTION
    const billApTxn = await this.fetchBillPayabaleTxn(
      manager,
      billPaymentDto.transactionTypeId,
    );
    // FETCH CONTACT ID
    const contact = billApTxn.contact;

    return {
      companyCurrency,
      bill,
      billApTxn,
      contact,
      paymentAccount,
      accPayable,
      fxAccount,
    };
  }

  // FETCH BILL'S ACCOUNT PAYABLE TRANSACTION
  private async fetchBillPayabaleTxn(
    manager: EntityManager,
    transactionTypeId: string,
  ) {
    const billApTxn = await manager
      .createQueryBuilder(Transaction, "txn")
      .select([
        "txn.counterExchangeRate",
        "contact.id",
        "contact.name",
        "txn.counterOriginalExchangeRate",
      ])
      .innerJoin("txn.account", "acc")
      .innerJoin("txn.contact", "contact")
      .where("txn.transactionTypeId = :typeId", {
        typeId: transactionTypeId,
      })
      .andWhere("txn.transactionTypeName = :name", { name: "bill" })
      .andWhere("acc.accountType = :accType", { accType: "Liability" })
      .andWhere("acc.accountName = :accName", { accName: "Accounts Payable" })
      .getOne();
    if (!billApTxn) throw new BadRequestException("Bill transaction not found");
    return billApTxn;
  }

  // UPDATE BILL ITEM TRANSACTION IF EDITED
  private async updateItemTransaction(
    manager: EntityManager,
    txn: Transaction,
    item: BillItem,
    dto: UpdateBillDto,
    billTotalInRC: string,
    amounts: CalculatedAmounts,
  ) {
    Object.assign(txn, {
      date: new Date(dto.billDate),
      account: { id: item.itemAccount.id },
      creditAmount: "0",
      debitAmount: amounts.baseAmount,
      journalBalance: billTotalInRC,
      accountCurrency: amounts.accountCurrency,
      accountCurrencyAmount: amounts.accountAmount,
      accountExchangeRate: amounts.accountExchangeRate,
      accountOriginalExchangeRate: amounts.accountOriginalExchangeRate,
      counterCurrency: amounts.counterCurrency,
      counterCurrencyAmount: amounts.counterAmount,
      counterExchangeRate: amounts.counterExchangeRate,
      counterOriginalExchangeRate: amounts.counterOriginalExchangeRate,
    });

    await manager.save(txn);
  }

  // CREATE BILL ITEM TRANSACTION
  private async createItemTransaction(
    manager: EntityManager,
    item: BillItem,
    dto: UpdateBillDto,
    transactionTypeId: string,
    transactionTypeName: string,
    billTotalInRC: string,
    amounts: CalculatedAmounts,
  ) {
    const txn = await manager.save(
      manager.create(Transaction, {
        date: new Date(dto.billDate),
        description: "",
        account: { id: item.itemAccount.id },
        transactionTypeName: transactionTypeName,
        transactionTypeId: transactionTypeId,
        creditAmount: "0",
        debitAmount: amounts.baseAmount,
        journalBalance: billTotalInRC,
        accountCurrency: amounts.accountCurrency,
        accountCurrencyAmount: amounts.accountAmount,
        accountExchangeRate: amounts.accountExchangeRate,
        accountOriginalExchangeRate: amounts.accountOriginalExchangeRate,
        counterCurrency: amounts.counterCurrency,
        counterCurrencyAmount: amounts.counterAmount,
        counterExchangeRate: amounts.counterExchangeRate,
        counterOriginalExchangeRate: amounts.counterOriginalExchangeRate,
      }),
    );

    item.transaction = txn;
    await manager.save(item);
  }

  // UPDATE DISCOUNT TRANSACTION
  private async updateDiscountTransaction(
    manager: EntityManager,
    dto: UpdateBillDto,
    hasOldDiscount: boolean,
    transactionTypeId: string,
    transactionTypeName: string,
    billTotalInRC: string,
    companyCurrency: string,
    oldDiscountTxn?: Transaction,
  ) {
    const fxRate = dto.fxRate;
    const originalFxRate = dto.originalFxRate;
    const billCurrency = dto.billCurrency;

    const hasNewDiscount =
      dto.hasDiscount && dto.totalDiscountValue && dto.discountAccountId;
    if (!hasOldDiscount && !hasNewDiscount) return;

    if (hasOldDiscount && !hasNewDiscount) {
      //  Old bill has discount, DTO has no discount → delete old transaction
      if (oldDiscountTxn) {
        await manager.delete(Transaction, oldDiscountTxn.id);
      }
    }
    const discountAccount = await this.transactService.accountExists(
      manager,
      dto.discountAccountId!,
    );
    const discountValue = parseFloat(dto.totalDiscountValue!);
    const amounts = await this.calculateAmounts(
      discountValue,
      billCurrency,
      companyCurrency,
      discountAccount.accountCurrency,
      fxRate,
      originalFxRate,
    );

    if (!hasOldDiscount && hasNewDiscount) {
      // Old bill no discount, DTO has discount → create transaction
      await manager.save(
        manager.create(Transaction, {
          date: new Date(dto.billDate!),
          description: "",
          account: discountAccount,
          transactionTypeName: transactionTypeName,
          transactionTypeId: transactionTypeId,
          debitAmount: "0",
          creditAmount: amounts.baseAmount,
          journalBalance: billTotalInRC,
          accountCurrency: discountAccount.accountCurrency,
          accountCurrencyAmount: amounts.accountAmount,
          accountExchangeRate: amounts.accountExchangeRate,
          accountOriginalExchangeRate: amounts.accountOriginalExchangeRate,
          counterCurrency: amounts.counterCurrency,
          counterCurrencyAmount: amounts.counterAmount,
          counterExchangeRate: amounts.counterExchangeRate,
          counterOriginalExchangeRate: amounts.counterOriginalExchangeRate,
        }),
      );
    } else if (hasOldDiscount && hasNewDiscount) {
      //  Old bill has discount, DTO has discount → update transaction
      Object.assign(oldDiscountTxn!, {
        date: new Date(dto.billDate),
        account: discountAccount,
        debitAmount: "0",
        creditAmount: amounts.baseAmount,
        journalBalance: billTotalInRC,
        accountCurrency: discountAccount.accountCurrency,
        accountCurrencyAmount: amounts.accountAmount,
        accountExchangeRate: amounts.accountExchangeRate,
        accountOriginalExchangeRate: amounts.accountOriginalExchangeRate,
        counterCurrency: amounts.counterCurrency,
        counterCurrencyAmount: amounts.counterAmount,
        counterExchangeRate: amounts.counterExchangeRate,
        counterOriginalExchangeRate: amounts.counterOriginalExchangeRate,
      });

      await manager.save(oldDiscountTxn);
    }
  }

  // UPDATE TDS TRANSACTION
  private async updateTdsTransaction(
    manager: EntityManager,
    dto: UpdateBillDto,
    hasOldTds: boolean,
    transactionTypeId: string,
    transactionTypeName: string,
    billTotalInRC: string,
    companyCurrency: string,
    oldTdsTxn?: Transaction,
  ) {
    const hasNewTds = dto.hasTds && dto.totalTdsValue;

    if (!hasOldTds && !hasNewTds) return;
    if (hasOldTds && !hasNewTds) {
      //  Old bill has TDS, DTO has no TDS → delete transaction
      if (oldTdsTxn) {
        await manager.delete(Transaction, oldTdsTxn.id);
      }
    }

    const tdsData = await manager.findOne(Tax, { where: { taxName: "TDS" } });
    if (!tdsData) throw new BadRequestException("TDS Tax missing");
    let totalTdsValue = parseFloat(dto.totalTdsValue!);

    const amounts = await this.calculateAmounts(
      totalTdsValue,
      dto.billCurrency,
      companyCurrency,
      companyCurrency,
      dto.fxRate,
      dto.originalFxRate,
    );

    if (!hasOldTds && hasNewTds) {
      //  Old bill no TDS, DTO has TDS → create transaction

      await manager.save(
        manager.create(Transaction, {
          date: new Date(dto.billDate!),
          description: "",
          tax: tdsData,
          transactionTypeName: transactionTypeName,
          transactionTypeId: transactionTypeId,
          creditAmount: amounts.baseAmount,
          debitAmount: "0",
          journalBalance: billTotalInRC,
          accountCurrency: companyCurrency,
          accountCurrencyAmount: amounts.accountAmount,
          accountExchangeRate: amounts.accountExchangeRate,
          accountOriginalExchangeRate: amounts.accountOriginalExchangeRate,
          counterCurrency: amounts.counterCurrency,
          counterCurrencyAmount: amounts.counterAmount,
          counterExchangeRate: amounts.counterExchangeRate,
          counterOriginalExchangeRate: amounts.counterOriginalExchangeRate,
        }),
      );
    } else if (hasOldTds && hasNewTds) {
      //  Old bill has TDS, DTO has TDS → update transaction

      Object.assign(oldTdsTxn!, {
        date: new Date(dto.billDate!),
        tax: tdsData,
        creditAmount: amounts.baseAmount,
        debitAmount: "0",
        journalBalance: billTotalInRC,
        accountCurrency: companyCurrency,
        accountCurrencyAmount: amounts.accountAmount,
        accountExchangeRate: amounts.accountExchangeRate,
        accountOriginalExchangeRate: amounts.accountOriginalExchangeRate,
        counterCurrency: amounts.counterCurrency,
        counterCurrencyAmount: amounts.counterAmount,
        counterExchangeRate: amounts.counterExchangeRate,
        counterOriginalExchangeRate: amounts.counterOriginalExchangeRate,
      });

      await manager.save(oldTdsTxn);
    }
  }

  // UPDATE ROUNDOFF TRANSACTION
  private async updateRoundoffTransaction(
    manager: EntityManager,
    dto: UpdateBillDto,
    hasOldRoundoff: boolean,
    transactionTypeId: string,
    transactionTypeName: string,
    billTotalInRC: string,
    companyCurrency: string,
    oldRoundoffTxn?: Transaction,
  ) {
    const fxRate = dto.fxRate;
    const originalFxRate = dto.originalFxRate;
    const billCurrency = dto.billCurrency;

    const hasNewRoundoff = !!dto.isRoundOff && !!dto.roundoffTotal;

    if (!hasOldRoundoff && !hasNewRoundoff) return;

    if (hasOldRoundoff && !hasNewRoundoff) {
      //  Old exists, new missing → delete transaction
      if (oldRoundoffTxn) await manager.delete(Transaction, oldRoundoffTxn.id);
    }

    const miscExpenseAccount = await manager.findOne(AccountData, {
      where: {
        accountName: "Miscellaneous Expense",
        accountType: AccountType.EXPENSE,
      },
    });
    if (!miscExpenseAccount)
      throw new BadRequestException("Miscellaneous Expense account missing");

    let roundoffValue =
      parseFloat(dto.roundoffTotal) - parseFloat(dto.billTotal);
    const fxRoundoffValue = (Math.abs(roundoffValue) * fxRate).toFixed(2);

    let roundoffDebit = "0";
    let roundoffCredit = "0";

    roundoffDebit = roundoffValue > 0 ? fxRoundoffValue : "0";
    roundoffCredit = roundoffValue < 0 ? fxRoundoffValue : "0";
    roundoffValue = Math.abs(roundoffValue);

    const amounts = await this.calculateAmounts(
      roundoffValue,
      billCurrency,
      companyCurrency,
      companyCurrency,
      fxRate,
      originalFxRate,
    );

    if (!hasOldRoundoff && hasNewRoundoff) {
      //  No old, new → create transaction
      await manager.save(Transaction, {
        date: new Date(dto.billDate!),
        description: "",
        account: miscExpenseAccount,
        transactionTypeName,
        transactionTypeId,
        creditAmount: roundoffCredit,
        debitAmount: roundoffDebit,
        journalBalance: billTotalInRC,
        accountCurrency: companyCurrency,
        accountCurrencyAmount: amounts.accountAmount,
        accountExchangeRate: amounts.accountExchangeRate,
        accountOriginalExchangeRate: amounts.accountOriginalExchangeRate,
        counterCurrency: amounts.counterCurrency,
        counterCurrencyAmount: amounts.counterAmount,
        counterExchangeRate: amounts.counterExchangeRate,
        counterOriginalExchangeRate: amounts.counterOriginalExchangeRate,
      });
    } else if (hasOldRoundoff && hasNewRoundoff) {
      //  Old exists, new exists → update transaction
      Object.assign(oldRoundoffTxn!, {
        date: new Date(dto.billDate!),
        account: miscExpenseAccount,
        transactionTypeName,
        transactionTypeId,
        creditAmount: roundoffCredit,
        debitAmount: roundoffDebit,
        journalBalance: billTotalInRC,
        accountCurrency: companyCurrency,
        accountCurrencyAmount: amounts.accountAmount,
        accountExchangeRate: amounts.accountExchangeRate,
        accountOriginalExchangeRate: amounts.accountOriginalExchangeRate,
        counterCurrency: amounts.counterCurrency,
        counterCurrencyAmount: amounts.counterAmount,
        counterExchangeRate: amounts.counterExchangeRate,
        counterOriginalExchangeRate: amounts.counterOriginalExchangeRate,
      });

      await manager.save(oldRoundoffTxn);
    }
  }

  // GET BALANCE DUE & TOTAL PAID AMOUNT
  private async getBalanceDue(
    dataSource: DataSource,
    transactionTypeId: string,
    billTotal: number,
  ) {
    const totalPaidResult = await dataSource
      .getRepository(Transaction)
      .createQueryBuilder("transaction")
      .leftJoin("transaction.account", "account")
      .where("transaction.transactionTypeId = :id", { id: transactionTypeId })
      .andWhere("transaction.transactionTypeName = :name", {
        name: "bill_payment",
      })
      .andWhere(
        "NOT ((account.accountName = :accName AND account.accountType = :accType) OR (account.accountName = :fxName AND account.accountType = :fxType))",
        {
          accName: "Accounts Payable",
          accType: "Liability",
          fxName: "FX Gain/ Loss",
          fxType: "Expense",
        },
      )
      .select("SUM(transaction.counterCurrencyAmount)", "totalPaid")
      .getRawOne();

    const totalPaid = Number(totalPaidResult?.totalPaid ?? 0);
    const balanceDue = billTotal - totalPaid;
    return { totalPaid, balanceDue };
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
        name: "bill_payment",
      })
      .andWhere(
        "NOT ((account.accountName = :accName AND account.accountType = :accType) OR (account.accountName = :fxName AND account.accountType = :fxType))",
        {
          accName: "Accounts Payable",
          accType: "Liability",
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
        "transaction.creditAmount",
        "transaction.counterCurrencyAmount",
        "transaction.counterExchangeRate",
        "transaction.counterCurrency",
        "transaction.transactionTypeId",
        "transaction.description",
      ])
      .orderBy("transaction.date", "DESC")
      .getMany();
    return paymentHistory;
  }

  async billNumberExists(
    dataSource: DataSource,
    billNo: string,
    ignoreBillId?: number,
  ) {
    if (!billNo) return new BadRequestException("Bill No is required");
    const whereCondition: FindOptionsWhere<Bill> = { billNo };
    if (ignoreBillId) {
      whereCondition.id = Not(ignoreBillId);
    }

    const exists = await dataSource.getRepository(Bill).findOne({
      where: whereCondition,
    });

    if (exists) throw new ConflictException("Bill number already exists");
    return false;
  }

  async getAllBillData(
    dataSource: DataSource,
    fromDate?: string,
    toDate?: string,
    limit?: number,
    offset?: number,
  ) {
    const billRepo = dataSource.getRepository(Bill);
    const attachmentRepo = dataSource.getRepository(Attachment);
    const transactRepo = dataSource.getRepository(Transaction);

    const allBills = billRepo
      .createQueryBuilder("bill")
      .leftJoin("bill.items", "items")
      .leftJoin("bill.contact", "contact")
      .leftJoin("bill.discountAccount", "discountAccount")
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
      .orderBy("bill.billDate", "DESC");

    if (fromDate && toDate) {
      allBills.andWhere("bill.billDate BETWEEN :fromDate AND :toDate", {
        fromDate,
        toDate,
      });
    }
    if (limit !== undefined && offset !== undefined) {
      allBills.take(limit).skip(offset);
    }
    const bills = await allBills.getMany();
    let data: any = [];
    for (const bill of bills) {
      const { totalPaid, balanceDue } = await this.getBalanceDue(
        dataSource,
        bill.transactionTypeId,
        Number(bill.roundoffTotal),
      );
      const attachmentWhere = await this.transactService.buildTransactionWhere(
        bill.transactionTypeId,
        "bill",
      );

      const attachmentsForBill = await attachmentRepo.findOne({
        where: attachmentWhere,
      });
      const attachmentCount = attachmentsForBill?.attachments.length || 0;

      attachmentWhere.transactionTypeName = "bill_payment";

      const billPaymentExists = await transactRepo.findOne({
        where: attachmentWhere,
      });

      data.push({
        ...bill,
        totalPaid,
        balanceDue,
        noOfAttachments: attachmentCount,
        billPaymentExists: !!billPaymentExists,
        transactionTypeName: "bill",
      });
    }

    return data;
  }

  async getAllBillDataCursor(
    dataSource: DataSource,
    limit: number,
    fromDate?: string,
    toDate?: string,
    prevCursor?: string | null,
    nextCursor?: string | null,
    newBillNo?: string,
  ) {
    const billRepo = dataSource.getRepository(Bill);
    const attachmentRepo = dataSource.getRepository(Attachment);
    const transactRepo = dataSource.getRepository(Transaction);

    const isUpwards = !!prevCursor;
    const isDownwards = !!nextCursor;
    const activeCursor = isUpwards ? prevCursor : nextCursor;
    const cursorData = this.transactService.decodeCursor(activeCursor);

    let responseNextCursor = "";
    let responsePrevCursor = "";
    let bills: Bill[] = [];

    const baseQuery = billRepo
      .createQueryBuilder("bill")
      .select(["bill.id", "bill.billDate", "bill.createdAt"]);

    const dataWindow = Math.floor((limit - 1) / 2);
    const finalLimit = newBillNo ? dataWindow : limit;

    if (fromDate && toDate) {
      baseQuery.andWhere("bill.billDate BETWEEN :fromDate AND :toDate", {
        fromDate,
        toDate,
      });
    }

    const allBillCount = await baseQuery.clone().getCount();

    if (newBillNo) {
      const anchor = await billRepo.findOne({ where: { billNo: newBillNo } });
      if (!anchor) throw new BadRequestException("Bill Does Not Exist!");

      const resultPrev = await baseQuery
        .clone()
        .andWhere(
          "(bill.billDate < :d OR (bill.billDate = :d AND bill.createdAt < :c))",
          { d: anchor.billDate, c: anchor.createdAt },
        )
        .orderBy("bill.billDate", "DESC")
        .addOrderBy("bill.createdAt", "DESC")
        .take(finalLimit + 1)
        .getMany();

      const resultNext = await baseQuery
        .clone()
        .andWhere(
          "(bill.billDate > :d OR (bill.billDate = :d AND bill.createdAt > :c))",
          { d: anchor.billDate, c: anchor.createdAt },
        )
        .orderBy("bill.billDate", "ASC")
        .addOrderBy("bill.createdAt", "ASC")
        .take(finalLimit + 1)
        .getMany();

      if (resultPrev.length > dataWindow) {
        const last = resultPrev.pop();
        responsePrevCursor = this.transactService.encodeCursor(
          new Date(last!.billDate),
          last!.createdAt,
        );
      }
      if (resultNext.length > dataWindow) {
        const last = resultNext.pop();
        responseNextCursor = this.transactService.encodeCursor(
          new Date(last!.billDate),
          last!.createdAt,
        );
      }

      resultPrev.reverse();
      bills = [...resultPrev, anchor, ...resultNext];
      bills.reverse();
    } else if (cursorData) {
      const query = baseQuery.clone();
      if (isUpwards) {
        query
          .andWhere(
            "(bill.billDate < :d OR (bill.billDate = :d AND bill.createdAt < :c))",
            { d: cursorData.d, c: cursorData.createdAt },
          )
          .orderBy("bill.billDate", "DESC")
          .addOrderBy("bill.createdAt", "DESC");
      } else {
        query
          .andWhere(
            "(bill.billDate > :d OR (bill.billDate = :d AND bill.createdAt > :c))",
            { d: cursorData.d, c: cursorData.createdAt },
          )
          .orderBy("bill.billDate", "ASC")
          .addOrderBy("bill.createdAt", "ASC");
      }

      bills = await query.take(limit + 1).getMany();

      if (bills.length > limit) {
        const last = bills.pop();
        const encoded = this.transactService.encodeCursor(
          new Date(last!.billDate),
          last!.createdAt,
        );
        isUpwards
          ? (responsePrevCursor = encoded)
          : (responseNextCursor = encoded);
      }
      if (isDownwards) bills.reverse();
    } else {
      bills = await baseQuery
        .clone()
        .orderBy("bill.billDate", "DESC")
        .addOrderBy("bill.createdAt", "DESC")
        .take(limit + 1)
        .getMany();

      if (bills.length > limit) {
        const last = bills.pop();
        responsePrevCursor = this.transactService.encodeCursor(
          new Date(last!.billDate),
          last!.createdAt,
        );
      }
    }

    const billIds = bills.map((b) => b.id);
    let detailedBills: Bill[] = [];

    if (billIds.length > 0) {
      detailedBills = await billRepo
        .createQueryBuilder("bill")
        .leftJoinAndSelect("bill.items", "items")
        .leftJoinAndSelect("bill.contact", "contact")
        .leftJoinAndSelect("bill.discountAccount", "discountAccount")
        .leftJoinAndSelect("items.itemAccount", "itemAccount")
        .where("bill.id IN (:...billIds)", { billIds })
        .orderBy("bill.billDate", "DESC")
        .addOrderBy("bill.createdAt", "DESC")
        .getMany();
    }

    const data = await Promise.all(
      detailedBills.map(async (bill) => {
        const { totalPaid, balanceDue } = await this.getBalanceDue(
          dataSource,
          bill.transactionTypeId,
          Number(bill.roundoffTotal),
        );

        const attachmentWhere =
          await this.transactService.buildTransactionWhere(
            bill.transactionTypeId,
            "bill",
          );
        const attachmentsForBill = await attachmentRepo.findOne({
          where: attachmentWhere,
        });

        attachmentWhere.transactionTypeName = "bill_payment";
        const billPaymentExists = await transactRepo.findOne({
          where: attachmentWhere,
        });

        return {
          ...bill,
          totalPaid,
          balanceDue,
          noOfAttachments: attachmentsForBill?.attachments.length || 0,
          billPaymentExists: !!billPaymentExists,
          transactionTypeName: "bill",
          descNotes: null,
          descContactId: bill.contact?.id,
          descContactName: bill.contact?.name,
          descBillNumber: bill.billNo,
        };
      }),
    );

    return {
      data,
      allBillCount,
      prevCursor: responsePrevCursor === "" ? null : responsePrevCursor,
      nextCursor: responseNextCursor === "" ? null : responseNextCursor,
    };
  }

  async getBillData(dataSource: DataSource, transactionTypeId: string) {
    if (!transactionTypeId)
      throw new BadRequestException("TransactionTypeId is required");
    const billRepo = dataSource.getRepository(Bill);
    const transactRepo = dataSource.getRepository(Transaction);
    const bill = await billRepo
      .createQueryBuilder("bill")
      .leftJoinAndSelect("bill.items", "items")
      .leftJoinAndSelect("bill.contact", "contact")
      .leftJoinAndSelect("bill.discountAccount", "discountAccount")
      .leftJoinAndSelect("items.itemAccount", "itemAccount")
      .addSelect(["contact.id", "discountAccount.id", "itemAccount.id"])
      .where("bill.transactionTypeId= :transactionTypeId", {
        transactionTypeId,
      })
      .getOne();

    const billApTxn = await this.fetchBillPayabaleTxn(
      dataSource.manager,
      transactionTypeId,
    );
    const fxRate = billApTxn.counterExchangeRate;
    const originalFxRate = billApTxn.counterOriginalExchangeRate;

    const invoicePaymentTransaction = await transactRepo.findOne({
      where: { transactionTypeId, transactionTypeName: "bill_payment" },
    });
    const paymentExists = !!invoicePaymentTransaction;

    const billData = {
      billData: bill,
      payments: await this.fetchPaymentHistory(dataSource, transactionTypeId),
      attachments: [],
      fxRate: fxRate,
      originalFxRate: originalFxRate,
      paymentExists,
    };
    return billData;
  }

  async getlatestBills(dataSource: DataSource): Promise<string[]> {
    const rows = await dataSource.manager
      .getRepository(Bill)
      .createQueryBuilder("bill")
      .select("bill.billNo", "billNo")
      .orderBy("bill.billDate", "DESC")
      .limit(10)
      .getRawMany();
    return rows.map((row) => row.billNo);
  }

  async createBill(
    createBillDto: CreateBillDto,
    dataSource: DataSource,
    companyId: string,
  ) {
    return dataSource.transaction(async (manager) => {
      const transactionTypeId =
        await this.transactService.generateTransactionTypeId();
      const companyCurrency = await this.transactService.getCompanyCurrency(
        manager,
        companyId,
      );
      const transactionTypeName = "bill";
      const contactData = await this.transactService.contactExists(
        manager,
        createBillDto.contactId,
      );
      if (createBillDto.discountAccountId)
        await this.transactService.accountExists(
          manager,
          createBillDto.discountAccountId,
        );
      await this.billNumberExists(dataSource, createBillDto.billNo);

      const fxRate = createBillDto.fxRate;
      const originalFxRate = createBillDto.originalFxRate;
      const billCurrency = createBillDto.billCurrency;
      let billTotalInRC = (
        parseFloat(createBillDto.roundoffTotal) * fxRate
      ).toFixed(2);

      //   SAVE BILL DATA
      const bill = manager.create(Bill, {
        billNo: createBillDto.billNo,
        serviceStartDate: new Date(createBillDto.serviceStartDate),
        serviceEndDate: new Date(createBillDto.serviceEndDate),
        billDate: new Date(createBillDto.billDate),
        billDueDate: new Date(createBillDto.billDueDate),
        billCurrency: createBillDto.billCurrency,
        notes: createBillDto.notes,
        hasTds: createBillDto.hasTds,
        tdsLevel: createBillDto.tdsLevel,
        tdsType: createBillDto.tdsType,
        tdsValue: createBillDto.tdsValue,
        discountApplied: createBillDto.discountApplied,
        discountType: createBillDto.discountType,
        discountValue: createBillDto.discountValue,
        billTotal: createBillDto.billTotal,
        isRoundOff: createBillDto.isRoundOff,
        roundoffTotal: createBillDto.roundoffTotal,
        transactionTypeId,
        contact: { id: createBillDto.contactId },
        discountAccount: createBillDto.discountAccountId
          ? { id: createBillDto.discountAccountId }
          : undefined,

        items: [],
      });

      await manager.save(bill);

      //   SAVE BILL ITEMS AND ITEM TRANSACTIONS
      for (const item of createBillDto.items) {
        const accountData = await this.transactService.accountExists(
          manager,
          item.itemAccountId,
        );
        const itemTotal = parseFloat(item.itemTotal);
        const billItem = manager.create(BillItem, {
          bill,
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

        await manager.save(billItem);

        const amounts = await this.calculateAmounts(
          item.itemTotal,
          billCurrency,
          companyCurrency,
          accountData.accountCurrency,
          fxRate,
          originalFxRate,
        );

        //ITEM TRANSACTION ENTRY
        await this.createItemTransaction(
          manager,
          billItem,
          createBillDto,
          transactionTypeId,
          transactionTypeName,
          billTotalInRC,
          amounts,
        );

        // TAX ENTRY FOR ITEM
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

            const amounts = await this.calculateAmounts(
              taxAmount,
              billCurrency,
              companyCurrency,
              companyCurrency,
              fxRate,
              originalFxRate,
            );

            await manager.save(
              manager.create(Transaction, {
                date: new Date(createBillDto.billDate),
                description: "",
                tax: taxData,
                transactionTypeName: transactionTypeName,
                transactionTypeId: transactionTypeId,
                creditAmount: "0",
                debitAmount: amounts.baseAmount,
                journalBalance: billTotalInRC,
                accountCurrency: companyCurrency,
                accountCurrencyAmount: amounts.accountAmount,
                accountExchangeRate: amounts.accountExchangeRate,
                accountOriginalExchangeRate:
                  amounts.accountOriginalExchangeRate,
                counterCurrency: amounts.counterCurrency,
                counterCurrencyAmount: amounts.counterAmount,
                counterExchangeRate: amounts.counterExchangeRate,
                counterOriginalExchangeRate:
                  amounts.counterOriginalExchangeRate,
              }),
            );
          }
        }
      }
      //   DISCOUNT ENTRY
      if (
        createBillDto.hasDiscount &&
        createBillDto.discountValue &&
        createBillDto.discountAccountId &&
        createBillDto.totalDiscountValue
      ) {
        await this.updateDiscountTransaction(
          manager,
          createBillDto,
          false,
          transactionTypeId,
          transactionTypeName,
          billTotalInRC,
          companyCurrency,
        );
      }
      //   TDS ENTRY
      if (createBillDto.hasTds && createBillDto.totalTdsValue) {
        await this.updateTdsTransaction(
          manager,
          createBillDto,
          false,
          transactionTypeId,
          transactionTypeName,
          billTotalInRC,
          companyCurrency,
        );
      }
      //   ROUNDOFF ENTRY
      if (createBillDto.isRoundOff && createBillDto.roundoffTotal) {
        await this.updateRoundoffTransaction(
          manager,
          createBillDto,
          false,
          transactionTypeId,
          transactionTypeName,
          billTotalInRC,
          companyCurrency,
        );
      }
      //   ACCOUNTS PAYABLE ENTRY
      const accPayableAccount = await manager.findOne(AccountData, {
        where: {
          accountName: "Accounts Payable",
          accountType: AccountType.LIABILITY,
        },
      });

      if (!accPayableAccount) {
        throw new BadRequestException("Accounts Payable account missing");
      }

      const amounts = await this.calculateAmounts(
        createBillDto.roundoffTotal,
        billCurrency,
        companyCurrency,
        companyCurrency,
        fxRate,
        originalFxRate,
      );

      await manager.save(
        manager.create(Transaction, {
          date: new Date(createBillDto.billDate),
          description: "",
          account: accPayableAccount,
          contact: { id: createBillDto.contactId },
          transactionTypeName,
          transactionTypeId,
          debitAmount: "0",
          creditAmount: amounts.baseAmount,
          journalBalance: billTotalInRC,
          accountCurrency: amounts.accountCurrency,
          accountCurrencyAmount: amounts.accountAmount,
          accountExchangeRate: amounts.accountExchangeRate,
          accountOriginalExchangeRate: amounts.accountOriginalExchangeRate,
          counterCurrency: amounts.counterCurrency,
          counterCurrencyAmount: amounts.counterAmount,
          counterExchangeRate: amounts.counterExchangeRate,
          counterOriginalExchangeRate: amounts.counterOriginalExchangeRate,
        }),
      );

      //   BALANCE UPDATE FOR INVOLVED ENTITIES
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
          billNo: bill.billNo,
          transactionTypeId,
        },
        change_of_data: {
          id: bill.id,
          transactionTypeName,
          transactionTypeId,
          contactId: contactData.id,
          contactName: contactData.name,
          billNo: bill.billNo,
          module: "Transact",
          feature: "Bill",
          status: "Create",
        },
      };
    });
  }

  async calculateAmounts(
    amount: number | string,
    billCurrency: string,
    companyCurrency: string,
    accountCurrency: string,
    fxRate: number,
    originalFxRate: number,
    isPayment: boolean = false,
    accountToBillFXRate?: number,
    accountToBillOriginalFXRate?: number,
    amountInAccCurr?: string,
  ): Promise<CalculatedAmounts> {
    const amt = typeof amount === "string" ? parseFloat(amount) : amount;
    let baseAmount: string = "",
      accountAmount: string = "",
      counterAmount: string = "",
      accountExchangeRate = 1,
      accountOriginalExchangeRate = 1,
      counterCurrency: string = "",
      counterExchangeRate = 1,
      counterOriginalExchangeRate = 1;

    if (billCurrency === companyCurrency) {
      if (!isPayment && accountCurrency !== companyCurrency) {
        throw new BadRequestException(
          "Account must be of company or bill currency",
        );
      }
      if (accountCurrency == companyCurrency) {
        baseAmount = accountAmount = counterAmount = amt.toString();
        counterCurrency = accountCurrency = companyCurrency;
      } else if (isPayment && accountCurrency !== companyCurrency) {
        baseAmount = amt.toString();
        accountAmount = amountInAccCurr
          ? amountInAccCurr
          : (amt * fxRate).toFixed(2);
        accountExchangeRate = accountToBillFXRate
          ? accountToBillFXRate
          : 1 / fxRate;
        accountOriginalExchangeRate = accountToBillOriginalFXRate
          ? accountToBillOriginalFXRate
          : 1 / originalFxRate;
        counterAmount = amt.toString();
        counterCurrency = companyCurrency;
        counterExchangeRate = fxRate;
        counterOriginalExchangeRate = originalFxRate;
      }
    } else {
      baseAmount = (amt * fxRate).toFixed(2);
      counterCurrency = billCurrency;
      counterAmount = amt.toString();
      if (accountCurrency === companyCurrency) {
        baseAmount = amountInAccCurr ? amountInAccCurr : baseAmount;
        accountAmount = amountInAccCurr ? amountInAccCurr : baseAmount;
        counterExchangeRate = fxRate;
        counterOriginalExchangeRate = originalFxRate;
      } else if (accountCurrency === billCurrency) {
        accountAmount = amt.toString();
        accountExchangeRate = fxRate;
        accountOriginalExchangeRate = originalFxRate;
        counterExchangeRate = 1;
        counterOriginalExchangeRate = 1;
      } else {
        throw new BadRequestException(
          "Account must be of company or bill currency",
        );
      }
    }
    return {
      baseAmount,
      accountAmount,
      counterAmount,
      accountCurrency,
      counterCurrency,
      accountExchangeRate,
      accountOriginalExchangeRate,
      counterExchangeRate,
      counterOriginalExchangeRate,
    };
  }

  async checkPaymentExists(manager: EntityManager, transactionTypeId: string) {
    const payments = await manager.find(Transaction, {
      where: {
        transactionTypeId: transactionTypeId,
        transactionTypeName: `bill_payment`,
      },
    });

    if (payments.length != 0) {
      throw new NotFoundException("Bill with payment cannot be edited");
    }
  }

  async updateBill(
    dataSource: DataSource,
    updateBillDto: UpdateBillDto,
    companyId: string,
    transactionTypeId: string,
  ) {
    return dataSource.transaction(async (manager) => {
      if (!transactionTypeId)
        throw new BadRequestException("TransactionTypeId is required");

      const bill = await manager.findOne(Bill, {
        where: { transactionTypeId },
        relations: ["discountAccount", "contact", "items", "items.transaction"],
      });
      if (!bill) {
        throw new BadRequestException("Bill not found");
      }
      const transactionTypeName = "bill";

      await this.checkPaymentExists(manager, transactionTypeId);
      const fxRate = updateBillDto.fxRate;
      const originalFxRate = updateBillDto.originalFxRate;

      const contactData = await this.transactService.contactExists(
        manager,
        updateBillDto.contactId,
      );
      if (updateBillDto.discountAccountId) {
        await this.transactService.accountExists(
          manager,
          updateBillDto.discountAccountId,
        );
      }
      await this.billNumberExists(dataSource, updateBillDto.billNo, bill.id);

      let billTotalInRC = (
        parseFloat(updateBillDto.roundoffTotal) * fxRate
      ).toFixed(2);
      const companyCurrency = await this.transactService.getCompanyCurrency(
        manager,
        companyId,
      );

      const existingEntities =
        await this.transactService.getInvolvedEntitiesPrefixed(
          manager,
          transactionTypeName,
          transactionTypeId,
        );
      const billTxns = await manager.find(Transaction, {
        where: { transactionTypeId, transactionTypeName },
        relations: ["account", "tax"],
      });
      const oldDiscountTxn = billTxns.find(
        (txn) =>
          txn.account?.id === bill.discountAccount?.id &&
          txn.debitAmount !== "0",
      );
      const hasOldDiscount = !!bill.discountAccount && !!oldDiscountTxn;

      const oldTdsTxn = billTxns.find((txn) => txn.tax?.taxName === "TDS");
      const hasOldTds = !!bill.hasTds && !!oldTdsTxn;

      const oldRoundoffTxn = billTxns.find(
        (txn) =>
          txn.account?.accountName === "Miscellaneous Expense" &&
          txn.account?.accountType === AccountType.EXPENSE,
      );
      const hasOldRoundoff =
        !!bill.isRoundOff && !!bill.roundoffTotal && !!oldRoundoffTxn;

      /**  UPDATE BILL DATA*/
      Object.assign(bill, {
        billNo: updateBillDto.billNo,
        serviceStartDate: new Date(updateBillDto.serviceStartDate),
        serviceEndDate: new Date(updateBillDto.serviceEndDate),
        billDate: new Date(updateBillDto.billDate),
        billDueDate: new Date(updateBillDto.billDueDate),
        billCurrency: updateBillDto.billCurrency,
        notes: updateBillDto?.notes,
        hasTds: updateBillDto.hasTds,
        tdsLevel: updateBillDto.tdsLevel ? updateBillDto.tdsLevel : null,
        tdsType: updateBillDto.tdsType ? updateBillDto.tdsType : null,
        tdsValue: updateBillDto.tdsValue ? updateBillDto.tdsValue : null,
        discountApplied: updateBillDto.discountApplied
          ? updateBillDto.discountApplied
          : null,
        discountType: updateBillDto.discountType
          ? updateBillDto.discountType
          : null,
        discountValue: updateBillDto.discountValue
          ? updateBillDto.discountValue
          : null,
        billTotal: updateBillDto.billTotal,
        isRoundOff: updateBillDto.isRoundOff,
        roundoffTotal: updateBillDto.roundoffTotal,
        contact: { id: updateBillDto.contactId },
        discountAccount: updateBillDto.discountAccountId
          ? { id: updateBillDto.discountAccountId }
          : null,
      });

      await manager.save(bill);
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
      /**  UPDATE ITEMS + ITEM TRANSACTIONS */
      const existingItemsMap = new Map(
        bill.items.map((item) => [item.id, item]),
      );

      const incomingItemIds = new Set<number>();
      for (const itemDto of updateBillDto.items) {
        const accountData = await this.transactService.accountExists(
          manager,
          itemDto.itemAccountId,
        );
        const amounts = await this.calculateAmounts(
          itemDto.itemTotal,
          updateBillDto.billCurrency,
          companyCurrency,
          accountData.accountCurrency,
          fxRate,
          originalFxRate,
        );

        /**  IF EXISTING ITEM - UPDATE */
        if (itemDto.itemId) {
          const item = existingItemsMap.get(itemDto.itemId);

          if (!item) {
            throw new BadRequestException(
              `Bill item ${itemDto.itemId} not found`,
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
            updateBillDto,
            billTotalInRC,
            amounts,
          );
        } else {
          /** ELSE CREATE NEW ITEM */
          const newItem = await manager.save(
            manager.create(BillItem, {
              bill: bill,
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
            updateBillDto,
            transactionTypeId,
            transactionTypeName,
            billTotalInRC,
            amounts,
          );

          incomingItemIds.add(newItem.id);
        }

        //  TAX ENTRY FOR ITEM
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
          const amounts = await this.calculateAmounts(
            taxAmount,
            updateBillDto.billCurrency,
            companyCurrency,
            companyCurrency,
            fxRate,
            originalFxRate,
          );

          await manager.save(Transaction, {
            date: updateBillDto.billDate
              ? new Date(updateBillDto.billDate)
              : bill.billDate,
            description: "",
            tax: taxData,
            transactionTypeName,
            transactionTypeId,
            creditAmount: "0",
            debitAmount: amounts.baseAmount,
            journalBalance: billTotalInRC,
            accountCurrency: companyCurrency,
            accountCurrencyAmount: amounts.accountAmount,
            accountExchangeRate: amounts.accountExchangeRate,
            accountOriginalExchangeRate: amounts.accountOriginalExchangeRate,
            counterCurrency: amounts.counterCurrency,
            counterCurrencyAmount: amounts.counterAmount,
            counterExchangeRate: amounts.counterExchangeRate,
            counterOriginalExchangeRate: amounts.counterOriginalExchangeRate,
          });
        }
      }

      //   DELETE REMOVED ITEMS AND THEIR TRANSACTIONS
      for (const [itemId, item] of existingItemsMap.entries()) {
        if (!incomingItemIds.has(itemId)) {
          await manager.delete(BillItem, item.id);
          if (item.transaction) {
            await manager.delete(Transaction, item.transaction.id);
          }
        }
      }

      //   UPDATE DISCOUNT
      await this.updateDiscountTransaction(
        manager,
        updateBillDto,
        hasOldDiscount,
        transactionTypeId,
        transactionTypeName,
        billTotalInRC,
        companyCurrency,
        oldDiscountTxn,
      );

      //   UPDATE TDS
      await this.updateTdsTransaction(
        manager,
        updateBillDto,
        hasOldTds,
        transactionTypeId,
        transactionTypeName,
        billTotalInRC,
        companyCurrency,
        oldTdsTxn,
      );

      //   UPDATE ROUNDOFF
      await this.updateRoundoffTransaction(
        manager,
        updateBillDto,
        hasOldRoundoff,
        transactionTypeId,
        transactionTypeName,
        billTotalInRC,
        companyCurrency,
        oldRoundoffTxn,
      );

      //   UPDATE ACCOUNTS PAYABLE
      const accPayableAccount = await manager.findOne(AccountData, {
        where: {
          accountName: "Accounts Payable",
          accountType: AccountType.LIABILITY,
        },
      });

      if (!accPayableAccount) {
        throw new BadRequestException("Accounts Payable account missing");
      }
      const arTxn = billTxns.find(
        (txn) =>
          txn.account?.id === accPayableAccount.id &&
          txn.account?.accountType === AccountType.LIABILITY,
      );

      if (!arTxn) {
        throw new BadRequestException(
          "Accounts Payable transaction missing for this bill",
        );
      }

      Object.assign(arTxn, {
        date: updateBillDto.billDate,
        contact: { id: updateBillDto.contactId },
        debitAmount: "0",
        creditAmount: billTotalInRC,
        journalBalance: billTotalInRC,
        accountCurrency: companyCurrency,
        accountCurrencyAmount: billTotalInRC,
        accountExchangeRate: 1,
        accountOriginalExchangeRate: 1,
        counterCurrency: updateBillDto.billCurrency,
        counterCurrencyAmount: updateBillDto.roundoffTotal,
        counterExchangeRate: fxRate.toString(),
        counterOriginalExchangeRate: originalFxRate.toString(),
      });

      await manager.save(arTxn);

      //   BALANCE UPDATE FOR INVOLVED ENTITIES
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
          id: bill.id,
          billNo: bill.billNo,
          transactionTypeId,
        },
        change_of_data: {
          id: bill.id,
          transactionTypeName,
          transactionTypeId,
          contactId: contactData.id,
          contactName: contactData.name,
          bill_no: bill.billNo,
          module: "Transact",
          feature: "Bill",
          status: "Update",
        },
      };
    });
  }

  async makeBillPayment(
    dataSource: DataSource,
    billPaymentDto: BillPaymentDto,
    companyId: string,
  ) {
    return dataSource.transaction(async (manager) => {
      const transactionTypeName = "bill_payment";
      const {
        companyCurrency,
        bill,
        billApTxn,
        contact,
        paymentAccount,
        accPayable,
        fxAccount,
      } = await this.validateAndFetchBillPaymentData(
        manager,
        billPaymentDto,
        companyId,
      );
      const billCurrency = bill.billCurrency;

      const paymentId =
        await this.transactService.generateTransactionTypeId("payment");
      const paymentAmount = parseFloat(billPaymentDto.paymentAmount);
      let fxRate = billPaymentDto.fxRate;
      let originalFxRate = billPaymentDto.originalFxRate;

      if (paymentAccount.accountCurrency == billCurrency) {
        fxRate = billApTxn.counterExchangeRate!;
        originalFxRate = billApTxn.counterOriginalExchangeRate!;
      }
      const paymentAmounts = await this.calculateAmounts(
        paymentAmount,
        billCurrency,
        companyCurrency,
        paymentAccount.accountCurrency,
        fxRate,
        originalFxRate,
        true,
        billPaymentDto?.accountToBillFXRate,
        billPaymentDto?.accountToBillOriginalFXRate,
        billPaymentDto?.amountInAccCurr,
      );

      // SAVE PAYMENT ACC ENTRY
      await manager.save(Transaction, {
        date: new Date(billPaymentDto.paymentDate),
        description: billPaymentDto.notes ?? "",
        account: paymentAccount,
        transactionTypeName,
        transactionTypeId: billPaymentDto.transactionTypeId,
        paymentId,
        debitAmount: "0",
        creditAmount: paymentAmounts.baseAmount,
        journalBalance: paymentAmounts.baseAmount,
        accountCurrency: paymentAmounts.accountCurrency,
        accountCurrencyAmount: paymentAmounts.accountAmount,
        accountExchangeRate: paymentAmounts.accountExchangeRate,
        accountOriginalExchangeRate: paymentAmounts.accountOriginalExchangeRate,
        counterCurrency: paymentAmounts.counterCurrency,
        counterCurrencyAmount: paymentAmounts.counterAmount,
        counterExchangeRate: paymentAmounts.counterExchangeRate,
        counterOriginalExchangeRate: paymentAmounts.counterOriginalExchangeRate,
      });

      const amounts = await this.calculateAmounts(
        paymentAmount,
        billCurrency,
        companyCurrency,
        companyCurrency,
        fxRate,
        originalFxRate,
        true,
      );

      //   SAVE ACC PAYABLE ENTRY
      await manager.save(Transaction, {
        date: new Date(billPaymentDto.paymentDate),
        description: billPaymentDto.notes ?? "",
        account: accPayable,
        contact,
        transactionTypeName,
        transactionTypeId: billPaymentDto.transactionTypeId,
        paymentId,
        debitAmount: amounts.baseAmount,
        creditAmount: "0",
        journalBalance: amounts.baseAmount,

        accountCurrency: companyCurrency,
        accountCurrencyAmount: amounts.accountAmount,
        accountExchangeRate: amounts.accountExchangeRate,
        accountOriginalExchangeRate: amounts.accountOriginalExchangeRate,
        counterCurrency: amounts.counterCurrency,
        counterCurrencyAmount: amounts.counterAmount,
        counterExchangeRate: amounts.counterExchangeRate,
        counterOriginalExchangeRate: amounts.counterOriginalExchangeRate,
      });

      //   CALCULATE FX GAIN OR LOSS
      const billFxRate = Number(billApTxn.counterExchangeRate);
      const billBaseAmount = paymentAmount * billFxRate;
      const fxGainLoss = Number(
        (parseFloat(amounts.baseAmount) - billBaseAmount).toFixed(2),
      );

      console.log(billBaseAmount, "billbaseAMount,", billFxRate, fxGainLoss);

      //   SAVE FX ENTRY IF ANY
      if (fxGainLoss !== 0) {
        this.createFxGainOrLossEntry(
          manager,
          billPaymentDto,
          companyCurrency,
          accPayable,
          fxAccount,
          fxGainLoss,
          amounts.baseAmount,
          contact,
          paymentId,
        );
      }

      //   UPDATE BALANCE
      const involvedEntities =
        await this.transactService.getInvolvedEntitiesPrefixed(
          manager,
          transactionTypeName,
          billPaymentDto.transactionTypeId,
        );

      await this.transactService.updateBalanceAllEntities(
        involvedEntities,
        manager,
        companyId,
      );

      return {
        data: {
          transactionTypeName,
          transactionTypeId: billPaymentDto.transactionTypeId,
          paymentId,
        },
        change_of_data: {
          transactionTypeName,
          transactionTypeId: billPaymentDto.transactionTypeId,
          paymentId,
          contactId: contact.id,
          contactName: contact.name,
          invoice_no: bill.billNo,
          module: "Transact",
          feature: "Bill Payment",
          status: "Create",
        },
      };
    });
  }

  async editBillPayment(
    dataSource: DataSource,
    billPaymentDto: BillPaymentDto,
    companyId: string,
  ) {
    return dataSource.transaction(async (manager) => {
      const transactionTypeName = "bill_payment";
      const {
        companyCurrency,
        bill,
        billApTxn,
        contact,
        paymentAccount,
        accPayable,
        fxAccount,
      } = await this.validateAndFetchBillPaymentData(
        manager,
        billPaymentDto,
        companyId,
      );
      const billCurrency = bill.billCurrency;
      const paymentId = billPaymentDto.paymentId;
      if (!paymentId) throw new BadRequestException("Payment ID not found");

      const paymentAmount = parseFloat(billPaymentDto.paymentAmount);
      let fxRate = billPaymentDto.fxRate;
      let originalFxRate = billPaymentDto.originalFxRate;

      if (paymentAccount.accountCurrency == billCurrency) {
        fxRate = billApTxn.counterExchangeRate!;
        originalFxRate = billApTxn.counterOriginalExchangeRate!;
      }

      const paymentAmounts = await this.calculateAmounts(
        paymentAmount,
        billCurrency,
        companyCurrency,
        paymentAccount.accountCurrency,
        fxRate,
        originalFxRate,
        true,
      );

      const existingEntities =
        await this.transactService.getInvolvedEntitiesPrefixed(
          manager,
          transactionTypeName,
          billPaymentDto.transactionTypeId,
          paymentId,
        );
      // FETCH PREVIOUS TRANSACTION ENTRY
      const prevTransactions = await manager.find(Transaction, {
        where: {
          paymentId,
          transactionTypeId: billPaymentDto.transactionTypeId,
          transactionTypeName,
        },
        relations: ["account"],
      });

      const amounts = await this.calculateAmounts(
        paymentAmount,
        billCurrency,
        companyCurrency,
        companyCurrency,
        fxRate,
        originalFxRate,
        true,
      );

      // UPDATE PAYMENT ACCOUNT ENTRY
      const paymentTxn = prevTransactions.find(
        (txn) =>
          txn.account.id !== accPayable.id && txn.account.id !== fxAccount?.id,
      );
      if (paymentTxn) {
        paymentTxn.date = new Date(billPaymentDto.paymentDate);
        paymentTxn.description = billPaymentDto.notes ?? "";
        paymentTxn.debitAmount = "0";
        paymentTxn.creditAmount = paymentAmounts.baseAmount;
        paymentTxn.account = paymentAccount;
        ((paymentTxn.journalBalance = paymentAmounts.baseAmount),
          (paymentTxn.accountCurrency = paymentAmounts.accountCurrency),
          (paymentTxn.accountCurrencyAmount = paymentAmounts.accountAmount),
          (paymentTxn.accountExchangeRate = paymentAmounts.accountExchangeRate),
          (paymentTxn.accountOriginalExchangeRate =
            paymentAmounts.accountOriginalExchangeRate),
          (paymentTxn.counterCurrency = paymentAmounts.counterCurrency),
          (paymentTxn.counterCurrencyAmount = paymentAmounts.counterAmount),
          (paymentTxn.counterExchangeRate = paymentAmounts.counterExchangeRate),
          (paymentTxn.counterOriginalExchangeRate =
            paymentAmounts.counterOriginalExchangeRate),
          await manager.save(paymentTxn));
      }
      // UPDATE ACCOUNTS PAYABLE ENTRY

      const accountPayableTxns = prevTransactions.filter(
        (txn) => txn.account.id === accPayable.id,
      );
      let accountsPayableTxn: Transaction;
      let fxAccountsPayableTxn: Transaction | undefined;

      //  SPILIT FX & PAYMENT ACCOUNTS's PAYABLE
      if (accountPayableTxns.length === 1) {
        accountsPayableTxn = accountPayableTxns[0];
      } else if (accountPayableTxns.length >= 2) {
        accountsPayableTxn = accountPayableTxns[0];
        fxAccountsPayableTxn = accountPayableTxns[1];
      } else {
        throw new BadRequestException("Accounts Payable transaction missing");
      }
      //  UPDATE PAYMENT's ACCOUNTS PAYABLE ENTRY
      accountsPayableTxn.date = new Date(billPaymentDto.paymentDate);
      accountsPayableTxn.description = billPaymentDto.notes ?? "";
      accountsPayableTxn.debitAmount = amounts.baseAmount;
      accountsPayableTxn.creditAmount = "0";
      accountsPayableTxn.journalBalance = amounts.baseAmount;
      accountsPayableTxn.accountCurrency = companyCurrency;
      accountsPayableTxn.accountCurrencyAmount = amounts.accountAmount;
      accountsPayableTxn.accountExchangeRate = amounts.accountExchangeRate;
      accountsPayableTxn.accountOriginalExchangeRate =
        amounts.accountOriginalExchangeRate;
      accountsPayableTxn.counterCurrency = amounts.counterCurrency;
      accountsPayableTxn.counterCurrencyAmount = amounts.counterAmount;
      accountsPayableTxn.counterExchangeRate = amounts.counterExchangeRate;
      accountsPayableTxn.counterOriginalExchangeRate =
        amounts.counterOriginalExchangeRate;
      await manager.save(accountsPayableTxn);

      // FX GAIN/LOSS CALCULATION
      const billFxRate = Number(billApTxn.counterExchangeRate);
      const billBaseAmount = paymentAmount * billFxRate;
      const fxGainLoss = Number(
        (parseFloat(amounts.baseAmount) - billBaseAmount).toFixed(2),
      );
      const fxGainLossAmt = Math.abs(fxGainLoss).toFixed(2);
      const oldFxTxn = prevTransactions.find(
        (txn) => txn.account.id === fxAccount?.id,
      );
      if (fxGainLoss !== 0) {
        if (!oldFxTxn || !fxAccountsPayableTxn) {
          // create FX transaction if not exists
          this.createFxGainOrLossEntry(
            manager,
            billPaymentDto,
            companyCurrency,
            accPayable,
            fxAccount,
            fxGainLoss,
            amounts.baseAmount,
            contact,
            paymentId,
          );
        } else {
          // FX's ACCOUNTS PAYABLE UPDATE
          fxAccountsPayableTxn.debitAmount =
            fxGainLoss < 0 ? fxGainLossAmt : "0";
          fxAccountsPayableTxn.creditAmount =
            fxGainLoss > 0 ? fxGainLossAmt : "0";
          fxAccountsPayableTxn.journalBalance = amounts.baseAmount;
          fxAccountsPayableTxn.accountCurrency = companyCurrency;
          fxAccountsPayableTxn.accountCurrencyAmount = fxGainLossAmt;
          fxAccountsPayableTxn.accountExchangeRate = 1;
          fxAccountsPayableTxn.accountOriginalExchangeRate = 1;
          fxAccountsPayableTxn.counterCurrency = companyCurrency;
          fxAccountsPayableTxn.counterCurrencyAmount = fxGainLossAmt;
          fxAccountsPayableTxn.counterExchangeRate = 1;
          fxAccountsPayableTxn.counterOriginalExchangeRate = 1;
          await manager.save(fxAccountsPayableTxn);

          //   FX ENTRY UPDATE
          oldFxTxn.debitAmount = fxGainLoss > 0 ? fxGainLossAmt : "0";
          oldFxTxn.creditAmount = fxGainLoss < 0 ? fxGainLossAmt : "0";
          oldFxTxn.journalBalance = amounts.baseAmount;
          oldFxTxn.accountCurrencyAmount = fxGainLossAmt;
          oldFxTxn.counterCurrencyAmount = fxGainLossAmt;
          await manager.save(oldFxTxn);
        }
      } else {
        // Delete FX transaction if no gain/loss
        if (oldFxTxn) await manager.remove(oldFxTxn);
        if (fxAccountsPayableTxn) await manager.remove(fxAccountsPayableTxn);
      }
      // UPDATE BALANCE
      const updatedEntities =
        await this.transactService.getInvolvedEntitiesPrefixed(
          manager,
          transactionTypeName,
          billPaymentDto.transactionTypeId,
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
          transactionTypeId: billPaymentDto.transactionTypeId,
          paymentId,
        },
        change_of_data: {
          transactionTypeName,
          transactionTypeId: billPaymentDto.transactionTypeId,
          paymentId,
          contactId: contact.id,
          contactName: contact.name,
          billNo: bill.billNo,
          module: "Transact",
          feature: "Bill Payment",
          status: "Edit",
        },
      };
    });
  }

  async getBillPayments(transactionTypeId: string, dataSource: DataSource) {
    if (!transactionTypeId)
      throw new BadRequestException("Transaction Id is required");
    const bill = await dataSource.getRepository(Bill).findOne({
      where: { transactionTypeId: transactionTypeId },
      relations: ["contact"],
    });
    if (!bill) throw new BadRequestException("Bill not found");

    const billTotal =
      bill.roundoffTotal !== null
        ? Number(bill.roundoffTotal)
        : Number(bill.billTotal);

    const paymentHistory = await this.fetchPaymentHistory(
      dataSource,
      transactionTypeId,
    );

    const { totalPaid, balanceDue } = await this.getBalanceDue(
      dataSource,
      transactionTypeId,
      billTotal,
    );

    return {
      paymentHistory,
      contact: bill.contact,
      billNo: bill.billNo,
      balanceDue,
      totalPaid,
      currency: bill.billCurrency,
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
          accName: "Accounts Payable",
          accType: "Liability",
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
        "transaction.creditAmount",
        "transaction.counterCurrencyAmount",
        "transaction.counterExchangeRate",
        "transaction.counterOriginalExchangeRate",
        "transaction.counterCurrency",
        "transaction.description",
      ])
      .getMany();

    const bill = await dataSource
      .getRepository(Bill)
      .createQueryBuilder("bill")
      .leftJoinAndSelect("bill.contact", "contact")
      .where("bill.transactionTypeId = :transactionTypeId", {
        transactionTypeId,
      })
      .select(["bill.id", "contact.id", "contact.name"])
      .getOne();

    return {
      billNo: bill?.id,
      contact: {
        id: bill?.contact.id,
        name: bill?.contact.name,
      },
      paymentDetails,
    };
  }

  async buildBillRawData(transactionTypeId: string, dataSource: DataSource) {
    const billRepo = dataSource.getRepository(Bill);
    const taxRepo = dataSource.getRepository(Tax);

    const bill = await billRepo.findOne({
      where: { transactionTypeId },
      relations: {
        contact: true,
        items: {
          itemAccount: true,
        },
      },
    });

    if (!bill) throw new NotFoundException("Bill not found");

    const taxMap = new Map((await taxRepo.find()).map((t) => [t.id, t]));
    const aggregatedTaxes = this.calculateAggregatedTaxes(bill.items, taxMap);
    const { subTotal, discount, itemTds, billTds } =
      await this.buildTotalResolvers(bill, bill.items, dataSource);
    const actualTotal = Number(bill.billTotal);
    const roundedTotal = Number(bill.roundoffTotal);
    const balanceData = await this.getBillPayments(
      transactionTypeId,
      dataSource,
    );

    let roundedValue;

    if (!isNaN(roundedTotal) && roundedTotal !== actualTotal) {
      const diff = +(roundedTotal - actualTotal).toFixed(2);
      roundedValue = Math.abs(diff).toFixed(2);
    }

    const finalTotal = bill.isRoundOff ? roundedTotal : actualTotal;

    return {
      bill: {
        id: bill.id,
        transactionTypeId,
        billNo: bill.billNo,
        currency: bill.billCurrency,
        billDate: bill.billDate,
        dueDate: bill.billDueDate,
        serviceStart: bill.serviceStartDate,
        serviceEnd: bill.serviceEndDate,
        notes: bill.notes,
        hasTds: bill.hasTds,
        discountApplied: bill.discountApplied,
        discountValue: bill.discountValue,
        discountType: bill.discountType,
        roundoffTotal: bill.roundoffTotal,
      },

      contact: bill.contact,

      items: bill.items.map((i) => ({
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

      notes: bill.notes,

      taxes: aggregatedTaxes,

      totals: {
        subTotal,
        discount,
        itemTds,
        billTds,
        billTotal: bill.billTotal,
        roundedValue,
        finalTotal,
        balanceDue: balanceData.balanceDue,
      },
    };
  }
}
