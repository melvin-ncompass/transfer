import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateJournalDto } from "./dto/create-journal.dto";
import { UpdateJournalDto } from "./dto/update-journal.dto";
import { AccountData } from "../account/entities/tenant.account.entity";
import { Contact } from "../contact/entities/tenant.contact.entity";
import { Tax } from "../tax/entities/tenant.tax.entity";
import { DataSource, In, Repository } from "typeorm";
import { Company } from "src/company/entities/company.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Transaction } from "../transact/entities/tenant.transaction.entity";
import { TransactService } from "../transact/transact.service";
import { capitalizeFirst } from "src/utils/string.util";

@Injectable()
export class JournalService {
  constructor(
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
    private transactService: TransactService
  ) {}

  async findJournal(transactionTypeId: string, dataSource: DataSource) {
    const transactionRepo = dataSource.getRepository(Transaction);

    const journals = await transactionRepo.find({
      where: {
        transactionTypeId: transactionTypeId.trim(),
      },
      relations: ["account", "contact", "tax", "uncategorized"],
    });

    if (!journals.length)
      throw new NotFoundException("Journal record not found");

    const journalAccounts = journals.map((journal) => {
      const getTypeIdName = () => {
        if (journal.account) return { type: journal.account.accountType, id: journal.account.id, name: journal.account.accountName };
        if (journal.tax) return { type: "Tax", id: journal.tax.id ,name: journal.tax.taxName };
        if (journal.contact) return { type: "Contact", id: journal.contact.id ,name: journal.contact.name};
        return { type: "Unknown", id: null };
      };

      const { type, id: entityId ,name} = getTypeIdName();

      const amount =
        Number(journal.creditAmount) !== 0
          ? { credit: parseFloat(journal.creditAmount) || 0 }
          : { debit: parseFloat(journal.debitAmount) || 0 };

      return {
        id: entityId,
        type,
        ...amount,
        name: name,
        isFromAccount: Number(journal.creditAmount) !== 0 ? true : false,
        transactionTypeName: journal.transactionTypeName,
        accountExchangeRate: journal.accountExchangeRate ?? 1.0,
        accountCurrencyAmount: journal.accountCurrencyAmount ?? 0,
        accountOriginalExchangeRate: journal.accountOriginalExchangeRate ?? 1.0,
        accountCurrency: journal.accountCurrency,
      };
    });

    let tdsMapping: Record<string, number> | null = null;

    const taxJournal = journals.find(
      (j) => j.tax && j.tax.taxName === "TDS" && j.hasContactMapping === true
    );

    if (taxJournal) {
      tdsMapping =
        (taxJournal.contactMapping as Record<string, number>) ?? null;
    }

    return {
      transactionTypeId: journals[0].transactionTypeId,
      description: journals[0].description,
      date: journals[0].date,
      transactionTypeName: journals[0].transactionTypeName,
      journalBalance: parseFloat(journals[0].journalBalance) || 0,
      journalAccounts,
      tdsMapping,
    };
  }

  async createJournal(
    createJournalDto: CreateJournalDto,
    dataSource: DataSource,
    companyId: string
  ) {
    let toValue = 0;
    let fromValue = 0;
    let journalBalance = 0;

    const {
      description,
      date,
      journalAccounts,
      transactionTypeName,
      contactMappingData,
    } = createJournalDto;

    const formattedDate = new Date(date);
    let transactionTypeId =
      await this.transactService.generateTransactionTypeId();

    await dataSource.transaction(async (manager) => {
      const entityMap = {
        Account: manager.getRepository(AccountData),
        Contact: manager.getRepository(Contact),
        Tax: manager.getRepository(Tax),
      };

      const transactionRepo = manager.getRepository(Transaction);

      const { min } = await transactionRepo
        .createQueryBuilder("transaction")
        .select("MIN(transaction.date)", "min")
        .getRawOne();

      const openingBalanceExists = await transactionRepo.findOne({
        where: { transactionTypeName: "opening_balance" },
      });

      if (openingBalanceExists && transactionTypeName === "opening_balance") {
        throw new ForbiddenException("Opening Balance already exists");
      }

      if (
        transactionTypeName === "opening_balance" &&
        min &&
        formattedDate > min
      ) {
        throw new BadRequestException("Date should be less than minimum transaction date");
      } else {
        if (openingBalanceExists && formattedDate < min) {
          throw new BadRequestException(
            "Transaction Date Lesser than Opening Balance Date"
          );
        }
      }

      while (
        await transactionRepo.findOne({
          where: { transactionTypeId },
        })
      ) {
        transactionTypeId =
          await this.transactService.generateTransactionTypeId();
      }

      const fromAccount = journalAccounts.filter((a) => a.isFromAccount);
      if (!fromAccount.length)
        throw new BadRequestException("Invalid journal configuration");

      if (transactionTypeName === "transfer" && fromAccount.length > 1) {
        throw new BadRequestException("Invalid journal configuration");
      }

      journalBalance = fromAccount.reduce(
        (sum, acc) => sum + (acc.credit ?? 0),
        0
      );

      const reportingCurrency = await this.transactService.getCompanyCurrency(
        manager,
        companyId
      );

      const ordered = [
        ...fromAccount,
        ...journalAccounts.filter((a) => !a.isFromAccount),
      ];

      for (const journalAccount of ordered) {
        const { id, type, credit, debit, isFromAccount } = journalAccount;

        if (credit == null && debit == null) {
          throw new BadRequestException("Invalid journal amount");
        }

        const repo = entityMap[type];
        const journalAccountExists = await repo.findOne({ where: { id } });
        if (!journalAccountExists) {
          throw new NotFoundException("Related record not found");
        }

        if ((isFromAccount && !credit) || (!isFromAccount && !debit)) {
          throw new BadRequestException("Invalid journal amount");
        }

        if (isFromAccount) {
          fromValue += credit ?? 0;
        } else {
          toValue += debit ?? 0;
        }

        // contact mapping if tds is chosen
        let hasContactMapping = false;
        let contactMapping: object | undefined = undefined;

        if (
          type === "Tax" &&
          journalAccountExists instanceof Tax &&
          journalAccountExists.taxName === "TDS"
        ) {
          if (!contactMappingData) {
            throw new BadRequestException(
              "Contact Mapping is required for TDS transactions"
            );
          }

          const totalMapped = Object.values(contactMappingData).reduce(
            (sum, val) => sum + Number(val),
            0
          );

          const tdsAmount = isFromAccount ? (credit ?? 0) : (debit ?? 0);

          if (totalMapped !== tdsAmount) {
            throw new BadRequestException(
              `Sum of Contact Mapping amount (${totalMapped}) does not match TDS amount (${tdsAmount})`
            );
          }

          hasContactMapping = true;
          contactMapping = contactMappingData;
        }

        await transactionRepo.save({
          description: description ?? "",
          date: formattedDate,
          transactionTypeName,
          transactionTypeId,
          accountCurrency:
            journalAccountExists instanceof AccountData
              ? journalAccountExists.accountCurrency
              : reportingCurrency,
          accountExchangeRate: 1,
          accountOriginalExchangeRate: 1,
          journalBalance: String(journalBalance),
          creditAmount: String(isFromAccount ? credit : 0),
          debitAmount: String(isFromAccount ? 0 : debit),
          accountCurrencyAmount: String(journalBalance),
          hasContactMapping,
          contactMapping,
          [type === "Account"
            ? "account"
            : type === "Contact"
              ? "contact"
              : "tax"]: journalAccountExists,
        });
      }

      if (fromValue !== toValue) {
        throw new BadRequestException("Debit and credit mismatch");
      }

      const involvedEntities =
        await this.transactService.getInvolvedEntitiesPrefixed(
          manager,
          transactionTypeName,
          transactionTypeId
        );
      await this.transactService.updateBalanceAllEntities(
        involvedEntities,
        manager,
        companyId
      );
    });

    return {
      data: {
        transactionTypeId,
        journalBalance,
        date: formattedDate,
      },
      change_of_data: {
        transactionTypeId,
        journalBalance,
        date: formattedDate,
        module: "Transact",
        feature: capitalizeFirst(transactionTypeName),
        status: "Create",
      },
    };
  }

  async updateJournal(
    transactionTypeId: string,
    updateJournalDto: UpdateJournalDto,
    dataSource: DataSource,
    companyId: string
  ) {
    let toValue = 0;
    let fromValue = 0;
    let journalBalance = 0;

    const {
      description,
      date,
      journalAccounts,
      transactionTypeName,
      contactMappingData,
    } = updateJournalDto;
    const formattedDate = new Date(date);

    await dataSource.transaction(async (manager) => {
      const entityMap = {
        Account: manager.getRepository(AccountData),
        Contact: manager.getRepository(Contact),
        Tax: manager.getRepository(Tax),
      };

      const transactionRepo = manager.getRepository(Transaction);

      const { min } = await transactionRepo
        .createQueryBuilder("transaction")
        .select("MIN(transaction.date)", "min")
        .getRawOne();

      if (transactionTypeName === "opening_balance" && formattedDate > min) {
        throw new BadRequestException("Invalid Opening Balance Date");
      } else {
        const openingBalanceExists = await transactionRepo.findOne({
          where: { transactionTypeName: "opening_balance" },
        });

        if (openingBalanceExists && formattedDate < min) {
          throw new BadRequestException(
            "Transaction Date Lesser than Opening Balance Date"
          );
        }
      }

      const fromAccount = journalAccounts.filter((a) => a.isFromAccount);
      if (!fromAccount.length)
        throw new BadRequestException("Invalid journal configuration");

      if (transactionTypeName === "transfer" && fromAccount.length > 1) {
        throw new BadRequestException("Invalid journal configuration");
      }

      const ordered = [
        ...fromAccount,
        ...journalAccounts.filter((a) => !a.isFromAccount),
      ];

      const reportingCurrency = await this.transactService.getCompanyCurrency(
        manager,
        companyId
      );

      const existingTransactions = await transactionRepo.find({
        where: { transactionTypeId: transactionTypeId.trim() },
        relations: ["account", "contact", "tax"],
      });

      const touchedIds = new Set<number>();

      journalBalance = fromAccount.reduce(
        (sum, acc) => sum + (acc.credit ?? 0),
        0
      );

      for (const journalAccount of ordered) {
        const {
          id,
          type,
          credit,
          debit,
          isFromAccount,
          transactionTypeId: dtoTransactionTypeId,
        } = journalAccount;

        if ((isFromAccount && !credit) || (!isFromAccount && !debit)) {
          throw new BadRequestException("Invalid journal amount");
        }

        const repo = entityMap[type];
        const journalAccountExists = await repo.findOne({ where: { id } });
        if (!journalAccountExists) {
          throw new NotFoundException("Related record not found");
        }

        if (isFromAccount) {
          fromValue += credit ?? 0;
        } else {
          toValue += debit ?? 0;
        }

        let transaction: Transaction | undefined;

        if (dtoTransactionTypeId) {
          transaction = existingTransactions.find((transaction) => {
            if (type === "Account" && transaction.account?.id === id)
              return true;
            if (type === "Contact" && transaction.contact?.id === id)
              return true;
            if (type === "Tax" && transaction.tax?.id === id) return true;
            return false;
          });
          if (!transaction) {
            throw new NotFoundException("Journal record not found");
          }
        }

        if (!transaction) {
          transaction = new Transaction();
        }

        // if TDS is involved
        if (
          type === "Tax" &&
          journalAccountExists instanceof Tax &&
          journalAccountExists.taxName === "TDS"
        ) {
          if (!contactMappingData) {
            throw new BadRequestException(
              "Contact Mapping is required for TDS transactions"
            );
          }

          const totalMapped = Object.values(contactMappingData).reduce(
            (sum, val) => sum + Number(val),
            0
          );

          const tdsAmount = isFromAccount ? (credit ?? 0) : (debit ?? 0);

          if (totalMapped !== tdsAmount) {
            throw new BadRequestException(
              `Sum of Contact Mapping amount (${totalMapped}) does not match TDS amount (${tdsAmount})`
            );
          }

          transaction.hasContactMapping = true;
          transaction.contactMapping = contactMappingData;
        } else {
          transaction.hasContactMapping = false;
          transaction.contactMapping = undefined;
        }

        if (isFromAccount) {
          fromValue += credit ?? 0;
        } else {
          toValue += debit ?? 0;
        }

        Object.assign(transaction, {
          description,
          date: formattedDate,
          transactionTypeName,
          transactionTypeId,
          accountCurrency:
            journalAccountExists instanceof AccountData
              ? journalAccountExists.accountCurrency
              : reportingCurrency,
          accountExchangeRate: "1",
          accountOriginalExchangeRate: "1",
          journalBalance: String(journalBalance),
          accountCurrencyAmount: String(journalBalance),
          creditAmount: credit != null ? String(credit) : String(0.0),
          debitAmount: debit != null ? String(debit) : String(0.0),
          account: null,
          contact: null,
          tax: null,
          [type === "Account"
            ? "account"
            : type === "Contact"
              ? "contact"
              : "tax"]: journalAccountExists,
        });

        const saved = await transactionRepo.save(transaction);
        touchedIds.add(saved.id);
      }

      const toDelete = existingTransactions.filter(
        (transaction) => !touchedIds.has(transaction.id)
      );
      if (toDelete.length) await transactionRepo.remove(toDelete);

      if (fromValue !== toValue) {
        throw new BadRequestException("Debit and credit mismatch");
      }

      const involvedEntities =
        await this.transactService.getInvolvedEntitiesPrefixed(
          manager,
          transactionTypeName,
          transactionTypeId
        );
      await this.transactService.updateBalanceAllEntities(
        involvedEntities,
        manager,
        companyId
      );
    });

    return {
      data: {
        transactionTypeId,
        journalBalance: String(journalBalance),
        date: formattedDate,
      },
      change_of_data: {
        transactionTypeId,
        journalBalance: String(journalBalance),
        date: formattedDate,
        module: "Transact",
        feature: capitalizeFirst(transactionTypeName),
        status: "Update",
      },
    };
  }

  async getDateRange(dataSource: DataSource) {
    const transactionRepo = dataSource.getRepository(Transaction);
    const { min, max } = await transactionRepo
      .createQueryBuilder("transaction")
      .select("MIN(transaction.date)", "min")
      .addSelect("MAX(transaction.date)", "max")
      .getRawOne();
    const openingBalanceExists = await transactionRepo.findOne({
      where: { transactionTypeName: "opening_balance" },
    });
    return {
      minDate: min,
      maxDate: max,
      openingBalanceExists: !!openingBalanceExists,
    };
  }

  async getOpeningBalance(dataSource: DataSource) {
    const transactRepo = dataSource.getRepository(Transaction);
    const openingBalanceId = await transactRepo.findOne({
      where: { transactionTypeName: "opening_balance" },
    });
    if (!openingBalanceId) return null;
    return await this.findJournal(
      openingBalanceId.transactionTypeId,
      dataSource
    );
  }
}
