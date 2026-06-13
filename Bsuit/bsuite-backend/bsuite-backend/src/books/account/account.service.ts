import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  StreamableFile,
} from "@nestjs/common";
import { DataSource, EntityManager, ILike, Not, Repository } from "typeorm";
import { GroupData } from "./entities/tenant.group.entity";
import { AccountData } from "./entities/tenant.account.entity";
import { CreateGroupDataDto } from "./dto/create-group.dto";
import { UpdateGroupDataDto } from "./dto/update-group.dto";
import { CreateAccountDataDto } from "./dto/create-account.dto";
import { UpdateAccountDataDto } from "./dto/update-account.dto";
import { AccountType } from "src/common/enum/account-type.enum";
import { Contact } from "../contact/entities/tenant.contact.entity";
import { Tax } from "../tax/entities/tenant.tax.entity";
import { Transaction } from "../transact/entities/tenant.transaction.entity";
import { CsvMappingDto } from "./dto/csv-mapping.dto";
import { CurrencyEnum } from "src/common/enum/currency.enum";
import * as Papa from "papaparse";
import * as fs from "fs";
import { ReportRepositionArray } from "./dto/report-position.dto";
import { UncategorizedData } from "../uncategorized/entities/tenant.uncategorized.entity";
import {
  DEFAULT_ACCOUNT_KEYS,
  DEFAULT_GROUP_KEYS,
} from "src/common/config/default-coa.set";
import { InjectRepository } from "@nestjs/typeorm";
import { Company } from "src/company/entities/company.entity";
import { generateExcel, getTemplatePath } from "src/shared/utils";
import * as ExcelJS from "exceljs";
import { ZeroBalanceToggleDto } from "./dto/zero-balance-toggle.dto";
import { ZeroBalance } from "./entities/tenant.zeroBalance.entity";

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  private async getCompanyName(companyId: string) {
    const company = await this.companyRepo.findOne({
      where: { companyId },
    });
    return company?.companyName;
  }

  async findGroupById(dataSource: DataSource, id: number) {
    const groupRepo = dataSource.getRepository(GroupData);
    const group = await groupRepo.findOneBy({ id });
    if (!group)
      throw new NotFoundException(`GroupData with id ${id} not found`);
    return group;
  }

  async getAllGroupData(dataSource: DataSource, groupType?: string) {
    const groupRepo = dataSource.getRepository(GroupData);
    const typeFilter = groupType ? { groupType: groupType as AccountType } : {};
    const groups = await groupRepo.find({
      where: typeFilter,
      order: {
        groupName: "ASC",
      },
    });
    return groups.map((group) => ({
      ...group,
      default: DEFAULT_GROUP_KEYS.has(`${group.groupName}`),
    }));
  }

  async createGroup(
    dataSource: DataSource,
    createGroupDto: CreateGroupDataDto,
  ) {
    const groupRepo = dataSource.getRepository(GroupData);
    const existingGroup = await groupRepo.findOne({
      where: {
        groupName: ILike(createGroupDto.groupName),
        groupType: createGroupDto.groupType,
      },
    });

    if (existingGroup) {
      throw new ConflictException(
        `Group name ${createGroupDto.groupName} already exists for group type ${createGroupDto.groupType}`,
      );
    }

    const group = groupRepo.create(createGroupDto);
    const saved = await groupRepo.save(group);
    return {
      data: saved,
      change_of_data: {
        id: saved.id,
        name: saved.groupName,
        type: saved.groupType,
        module: "COA",
        feature: "Group",
        status: "Create",
      },
    };
  }

  async updateGroup(
    dataSource: DataSource,
    groupId: number,
    updateGroupDto: UpdateGroupDataDto,
  ) {
    const groupRepo = dataSource.getRepository(GroupData);
    const group = await this.findGroupById(dataSource, groupId);
    if (updateGroupDto.groupName) {
      const exists = await groupRepo.findOne({
        where: {
          groupName: ILike(updateGroupDto.groupName),
          groupType: group.groupType,
          id: Not(groupId),
        },
      });
      if (exists) {
        throw new ConflictException(
          `Group with name ${updateGroupDto.groupName} for group type ${group.groupType} already exists.`,
        );
      }
      group.groupName = updateGroupDto.groupName;
    }
    const updated = await groupRepo.save(group);
    return {
      data: updated,
      change_of_data: {
        id: updated.id,
        name: updated.groupName,
        type: updated.groupType,
        module: "COA",
        feature: "Group",
        status: "Update",
      },
    };
  }

  async removeGroup(dataSource: DataSource, groupId: number) {
    const groupRepo = dataSource.getRepository(GroupData);
    const accountRepo = dataSource.getRepository(AccountData);
    const group = await this.findGroupById(dataSource, groupId);
    const accountsCount = await accountRepo.count({
      where: { group: { id: groupId } },
    });
    if (accountsCount > 0) {
      throw new ConflictException(
        `Group associated with accounts cannot be deleted.`,
      );
    }
    await groupRepo.remove(group);
    return {
      change_of_data: {
        name: group.groupName,
        type: group.groupType,
        module: "COA",
        feature: "Group",
        status: "Delete",
      },
    };
  }

  async generateGroup(dataSource: DataSource, companyId: string) {
    const repository = dataSource.getRepository(GroupData);
    const data = await repository.find();
    const workbook = new ExcelJS.Workbook();
    const companyName = await this.getCompanyName(companyId);
    const date = new Date().toISOString();
    const fileName = `Group_${companyName}_${date}`;
    const headerText = `
      Group\n
      ${companyName}`;
    const title = ["groupName", "groupType"];
    const header = ["Group Name", "Group Type"];

    await generateExcel(workbook, data, headerText, "Group", title, header);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return {
      buffer,
      fileName,
      change_of_data: {
        module: "COA",
        feature: "Group",
        status: "Export",
      },
    };
  }
}

@Injectable()
export class AccountService {
  constructor(
    private readonly groupService: GroupService,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  private async getZeroBalance(dataSource: DataSource, userId: number) {
    let zeroBalanceRepo = dataSource.getRepository(ZeroBalance);
    let zeroBalance = await zeroBalanceRepo.findOne({ where: { userId } });
    return zeroBalance?.accountZeroBalance;
  }

  private async getCompanyName(companyId: string) {
    const company = await this.companyRepo.findOne({
      where: { companyId },
    });
    return company?.companyName;
  }

  private async recalculatePositions(dataSource: DataSource) {
    const accountRepo = dataSource.getRepository(AccountData);
    const contactRepo = dataSource.getRepository(Contact);

    const accounts = await accountRepo.find({
      where: { showInReports: true },
      order: { position: "ASC" },
    });
    const contacts = await contactRepo.find({
      where: { showInReports: true },
      order: { position: "ASC" },
    });

    const allReports = [...accounts, ...contacts];

    allReports.sort((a, b) => a.position! - b.position!);

    let newPosition = 1;
    for (const entity of allReports) {
      if (entity.position !== newPosition) {
        entity.position = newPosition;
        if (entity instanceof AccountData) {
          await accountRepo.save(entity);
        } else if (entity instanceof Contact) {
          await contactRepo.save(entity);
        }
      }
      newPosition++;
    }
  }

  async findAccountById(dataSource: DataSource, id: number) {
    const accountRepo = dataSource.getRepository(AccountData);
    const account = await accountRepo.findOne({
      where: { id },
      relations: ["group", "parentAccount"],
    });
    if (!account)
      throw new NotFoundException(`AccountData with id ${id} not found`);
    return account;
  }

  async getAllAccountData(
    dataSource: DataSource,
    userId: number,
    accountType?: string,
    unArchivedOnly?: string,
  ) {
    const accountRepo = dataSource.getRepository(AccountData);
    let zeroBalanceRepo = dataSource.getRepository(ZeroBalance);
    const transactionRepo = dataSource.getRepository(Transaction);

    const where: any = {};

    let zeroBalance = await zeroBalanceRepo.findOne({ where: { userId } });
    if (!zeroBalance) {
      zeroBalance = await zeroBalanceRepo.save({ userId });
    }

    if (accountType) {
      where.accountType = accountType as AccountType;
    }
    if (unArchivedOnly) {
      where.isArchived = false;
    }
    const accounts = await accountRepo.find({
      where: where,
      relations: ["parentAccount", "group"],
      order: {
        accountName: "ASC",
      },
    });
    const transactionCountQuery = await transactionRepo
      .createQueryBuilder("transaction")
      .select("transaction.account_id", "accountId")
      .addSelect("COUNT(transaction.id)", "transactionCount")
      .groupBy("transaction.account_id")
      .getRawMany();

    const transactionCounts = transactionCountQuery.map((row) => ({
      accountId: row.accountId,
      transactionCount: parseInt(row.transactionCount, 10),
    }));

    return accounts.map((acc) => {
      const countObj = transactionCounts.find((tc) => tc.accountId === acc.id);
      return {
        ...acc,
        default: DEFAULT_ACCOUNT_KEYS.has(
          `${acc.accountName}::${acc.accountType}`,
        ),
        zeroBalance: zeroBalance.accountZeroBalance,
        transactionCount: countObj ? countObj.transactionCount : 0,
      };
    });

    // return accounts.map((acc) => ({
    //   ...acc,
    //   default: DEFAULT_ACCOUNT_KEYS.has(
    //     `${acc.accountName}::${acc.accountType}`
    //   ),
    //   zeroBalance: zeroBalance.accountZeroBalance,
    //   transactionCounts.transactionCount
    // }));
  }

  async getCoaCount(dataSource: DataSource) {
    const accountRepo = dataSource.getRepository(AccountData);
    const contactRepo = dataSource.getRepository(Contact);
    const taxRepo = dataSource.getRepository(Tax);
    const contactCount = await contactRepo.count();
    const taxCount = await taxRepo.count();
    const accountCountData = await accountRepo
      .createQueryBuilder("a")
      .select("a.accountType", "accountType")
      .addSelect("COUNT(*)", "count")
      .groupBy("a.accountType")
      .getRawMany();
    const accountCountDict = accountCountData.reduce((acc, row) => {
      acc[row.accountType] = Number(row.count);
      return acc;
    }, {});
    const coaCount = Object.values(AccountType).reduce((acc, type) => {
      acc[type] = accountCountDict[type] ?? 0;
      return acc;
    }, {});
    coaCount["Contact"] = contactCount;
    coaCount["Tax"] = taxCount;
    return coaCount;
  }

  async validateNoCircularRelation(
    dataSource: DataSource,
    accountId: number,
    newParentId: number,
  ) {
    const repo = dataSource.getRepository(AccountData);

    let current = await repo.findOne({
      where: { id: newParentId },
      relations: ["parentAccount"],
    });

    while (current) {
      if (current.id === accountId) {
        throw new BadRequestException(
          "Cannot set parent account due to circular relationship",
        );
      }
      current = current.parentAccount
        ? await repo.findOne({
            where: { id: current.parentAccount.id },
            relations: ["parentAccount"],
          })
        : null;
    }
  }

  async createAccount(
    dataSource: DataSource,
    createAccountDto: CreateAccountDataDto,
  ) {
    const accountRepo = dataSource.getRepository(AccountData);
    const existingAccount = await accountRepo.findOne({
      where: {
        accountName: ILike(createAccountDto.accountName),
        accountType: createAccountDto.accountType,
      },
    });
    if (existingAccount) {
      throw new ConflictException(
        `Account name ${createAccountDto.accountName} already exists for type ${createAccountDto.accountType}`,
      );
    }

    if (createAccountDto.parentAccountId) {
      const parent = await this.findAccountById(
        dataSource,
        createAccountDto.parentAccountId,
      );
      if (parent.accountType !== createAccountDto.accountType) {
        throw new BadRequestException(
          `Parent Account type '${parent.accountType}' does not match account type '${createAccountDto.accountType}'`,
        );
      }
      if (parent.group?.id) {
        createAccountDto.groupId = parent.group.id;
      }
    } else {
      if (createAccountDto.groupId) {
        const group = await this.groupService.findGroupById(
          dataSource,
          createAccountDto.groupId,
        );
        if (group.groupType !== createAccountDto.accountType) {
          throw new BadRequestException(
            `Group type '${group.groupType}' does not match account type '${createAccountDto.accountType}'`,
          );
        }
      }
    }

    const account = accountRepo.create({
      ...createAccountDto,
      group: createAccountDto.groupId
        ? { id: createAccountDto.groupId }
        : undefined,
      parentAccount: createAccountDto.parentAccountId
        ? { id: createAccountDto.parentAccountId }
        : undefined,
    });
    const saved = await accountRepo.save(account);
    return {
      data: saved,
      change_of_data: {
        id: saved.id,
        name: saved.accountName,
        type: saved.accountType,
        group: saved.group,
        module: "COA",
        feature: "Account",
        status: "Create",
      },
    };
  }

  async updateAccount(
    dataSource: DataSource,
    accountId: number,
    updateAccDto: UpdateAccountDataDto,
  ) {
    const { accountType, accountCurrency, ...updateAccountDto } = updateAccDto;
    const accountRepo = dataSource.getRepository(AccountData);
    const account = await this.findAccountById(dataSource, accountId);
    const existingGroupId = account.group?.id;
    if (updateAccountDto.accountName) {
      const exists = await accountRepo.findOne({
        where: {
          accountName: ILike(updateAccountDto.accountName),
          accountType: account.accountType,
          id: Not(accountId),
        },
      });
      if (exists) {
        throw new ConflictException(
          `Group with name ${updateAccountDto.accountName} for group type ${account.accountType} already exists.`,
        );
      }
    }

    if (updateAccountDto.parentAccountId) {
      const parent = await this.findAccountById(
        dataSource,
        updateAccountDto.parentAccountId,
      );
      if (parent.accountType !== account.accountType) {
        throw new BadRequestException(
          `Parent Account type '${parent.accountType}' does not match account type '${account.accountType}'`,
        );
      }
      if (parent.id == account.id) {
        throw new BadRequestException(`Cannot set self Parent Account`);
      }
      await this.validateNoCircularRelation(dataSource, account.id, parent.id);
      if (parent.group?.id) {
        updateAccountDto.groupId = parent.group.id;
      }
    } else {
      if (updateAccountDto.groupId) {
        const group = await this.groupService.findGroupById(
          dataSource,
          updateAccountDto.groupId,
        );
        if (group.groupType !== account.accountType) {
          throw new BadRequestException(
            `Group type '${group.groupType}' does not match account type '${account.accountType}'`,
          );
        }
      }
    }

    const { groupId, parentAccountId, ...rest } = updateAccountDto;
    Object.assign(account, rest);
    if ("groupId" in updateAccountDto) {
      account.group = groupId ? ({ id: groupId } as any) : null;
    }

    if ("parentAccountId" in updateAccountDto) {
      account.parentAccount = parentAccountId
        ? ({ id: parentAccountId } as any)
        : null;
    }
    await accountRepo.save(account);
    if (existingGroupId != groupId) {
      await this.updateChildrenGroupIds(accountRepo, accountId, groupId);
    }
    const foundAccount = await this.findAccountById(dataSource, accountId); //return this.findAccountById(dataSource, accountId);
    if (!foundAccount) {
      throw new NotFoundException("Account not found!");
    }
    return {
      data: foundAccount,
      change_of_data: {
        id: foundAccount.id,
        name: foundAccount.accountName,
        type: foundAccount.accountType,
        group: foundAccount.group,
        module: "COA",
        feature: "Account",
        status: "Update",
      },
    };
  }

  async updateChildrenGroupIds(
    accountRepo: Repository<AccountData>,
    parentId: number,
    newGroupId: number | undefined,
  ) {
    const allChildIds = await this.getRecursiveChildIds(accountRepo, parentId);
    if (allChildIds.length === 0) return;
    await accountRepo
      .createQueryBuilder()
      .relation(AccountData, "group")
      .of(allChildIds)
      .set(newGroupId);
  }

  async getRecursiveChildIds(
    accountRepo: Repository<AccountData>,
    parentId: number,
  ) {
    const result: number[] = [];

    const queue = [parentId];

    while (queue.length) {
      const id = queue.shift();

      const children = await accountRepo.find({
        where: { parentAccount: { id } },
        select: ["id"],
      });

      for (const child of children) {
        result.push(child.id);
        queue.push(child.id);
      }
    }

    return result;
  }

  async removeAccount(dataSource: DataSource, accountId: number) {
    const accountRepo = dataSource.getRepository(AccountData);
    const account = await this.findAccountById(dataSource, accountId);
    const transaction = await dataSource.getRepository(Transaction).findOne({
      where: { account: account },
      select: ["id"],
    });
    if (transaction) {
      throw new ConflictException(
        "Accounts with transactions cannot be deleted",
      );
    }
    const uncatTransaction = await dataSource
      .getRepository(UncategorizedData)
      .findOne({
        where: { account: account },
        select: ["id"],
      });
    if (uncatTransaction) {
      throw new ConflictException(
        "Accounts with uncategorized transactions cannot be deleted",
      );
    }
    await accountRepo.remove(account);
    await this.recalculatePositions(dataSource);
    return {
      change_of_data: {
        id: account.id,
        name: account.accountName,
        type: account.accountType,
        module: "COA",
        feature: "Account",
        status: "Delete",
      },
    };
  }

  getCsvStream(): StreamableFile {
    const filePath = `${getTemplatePath("accounts_demo.csv")}`;

    if (!fs.existsSync(filePath)) {
      throw new Error("CSV file not found.");
    }

    const fileStream = fs.createReadStream(filePath);
    return new StreamableFile(fileStream);
  }

  async processCsvFile(buffer: Buffer, mapping: CsvMappingDto) {
    const csv = buffer.toString("utf-8");

    const { data: rows, errors: parseErrors } = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
    });

    if (parseErrors.length > 0) {
      throw new BadRequestException("Error parsing CSV.");
    }

    const results: any[] = [];
    const uniquenessTracker = new Set();

    const checkCircular = (
      childName: string,
      parentName: string,
      allRows: any[],
      path: string[] = [],
    ): boolean => {
      if (!parentName) return false;
      if (path.includes(parentName)) return true;
      const parentRow = allRows.find((r) => r.accountName === parentName);
      if (!parentRow || !parentRow.parentAccount) return false;
      return checkCircular(parentName, parentRow.parentAccount, allRows, [
        ...path,
        parentName,
      ]);
    };

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const rowResult: any = { rowNumber, hasError: false, data: {} };

      const getCell = (field: string, required = false) => {
        const column = mapping[field];
        const raw = column ? row[column] : "";
        const value = typeof raw === "string" ? raw.trim() : "";

        let error = "";
        if (required && !value) {
          error = `${field} is required.`;
          rowResult.hasError = true;
        }

        const cell: any = { value };
        if (error) cell.error = error;
        rowResult.data[field] = cell;
        return value;
      };

      const accountName = getCell("accountName", true);
      const accountType = getCell("accountType", true);
      const accountCurrency = getCell("accountCurrency", true);
      const accountCode = getCell("accountCode");

      const notes = mapping.notes ? (row[mapping.notes]?.trim() ?? "") : "";
      rowResult.data["notes"] = { value: notes, error: "" };

      const groupName = mapping.groupName
        ? (row[mapping.groupName]?.trim() ?? "")
        : "";
      rowResult.data["groupName"] = { value: groupName, error: "" };

      const parentAccount = mapping.parentAccount
        ? (row[mapping.parentAccount]?.trim() ?? "")
        : "";
      rowResult.data["parentAccount"] = { value: parentAccount, error: "" };

      if (accountName && accountName.length > 255) {
        rowResult.data["accountName"].error =
          "Account Name cannot exceed 255 characters.";
        rowResult.hasError = true;
      }

      if (accountCode) {
        if (accountCode.length > 100) {
          rowResult.data["accountCode"].error =
            "Account Code cannot exceed 100 characters.";
          rowResult.hasError = true;
        }
      }

      if (accountCurrency) {
        if (
          !Object.values(CurrencyEnum).map(String).includes(accountCurrency)
        ) {
          rowResult.data["accountCurrency"].error =
            `Invalid currency "${accountCurrency}".`;
          rowResult.hasError = true;
        }
      }

      if (accountType) {
        if (!Object.values(AccountType).map(String).includes(accountType)) {
          rowResult.data["accountType"].error =
            `Invalid account type "${accountType}". Must be one of: ${Object.values(AccountType).join(", ")}`;
          rowResult.hasError = true;
        }
      }

      if (accountName && accountType) {
        const key = `${accountName.toLowerCase()}|${accountType.toLowerCase()}`;
        if (uniquenessTracker.has(key)) {
          rowResult.data["accountName"].error =
            "Duplicate (Account Name + Account Type) not allowed.";
          rowResult.data["accountType"].error =
            "Duplicate (Account Name + Account Type) not allowed.";
          rowResult.hasError = true;
        } else {
          uniquenessTracker.add(key);
        }
      }

      if (parentAccount && checkCircular(accountName, parentAccount, rows)) {
        rowResult.data["parentAccount"].error =
          "Circular parent dependency detected.";
        rowResult.hasError = true;
      }

      results.push(rowResult);
    });

    return results;
  }

  async createAccounts(rows: CsvMappingDto[], dataSource: DataSource) {
    return dataSource.transaction(async (manager) => {
      const accountRepo = manager.getRepository(AccountData);
      const groupRepo = manager.getRepository(GroupData);

      const duplicates: any[] = [];
      const createdAccounts: AccountData[] = [];
      const errors: any[] = [];

      const checkCircular = async (
        childId: number | undefined,
        parentId: number | undefined,
      ): Promise<boolean> => {
        if (!parentId) return false;
        if (childId === parentId) return true;

        const parentAccount = await accountRepo.findOne({
          where: { id: parentId },
          relations: ["parentAccount"],
        });

        if (!parentAccount || !parentAccount.parentAccount) return false;
        return checkCircular(childId, parentAccount.parentAccount.id);
      };

      for (const row of rows) {
        let group: GroupData | null = null;

        if (
          row.accountCurrency &&
          !Object.values(CurrencyEnum).includes(row.accountCurrency)
        ) {
          errors.push({
            row,
            error: `Invalid currency "${row.accountCurrency}". Must be one of: ${Object.values(CurrencyEnum).join(", ")}`,
          });
          continue;
        }

        if (
          row.accountType &&
          !Object.values(AccountType).includes(row.accountType as AccountType)
        ) {
          errors.push({
            row,
            error: `Invalid account type "${row.accountType}". Must be one of: ${Object.values(AccountType).join(", ")}`,
          });
          continue;
        }

        if (row.groupName) {
          group = await groupRepo.findOne({
            where: {
              groupName: row.groupName,
              groupType: row.accountType as AccountType,
            },
          });

          if (!group) {
            try {
              const result = await this.groupService.createGroup(dataSource, {
                groupName: row.groupName,
                groupType: row.accountType as AccountType,
              });
              group = result.data;
            } catch (e) {
              errors.push({ row, error: e.message });
              continue;
            }
          }
        }

        let parentAccount: AccountData | null = null;
        if (row.parentAccount) {
          parentAccount = await accountRepo.findOne({
            where: {
              accountName: row.parentAccount,
              accountType: row.accountType as AccountType,
            },
          });

          if (!parentAccount) {
            try {
              const result = await this.createAccount(dataSource, {
                accountName: row.parentAccount,
                accountType: row.accountType as AccountType,
                accountCode: "",
                accountCurrency: row.accountCurrency,
                groupId: group ? group.id : undefined,
                parentAccountId: undefined,
              });
              parentAccount = result.data;
            } catch (e) {
              errors.push({ row, error: e.message });
              continue;
            }
          }
        }

        const willBeCircular = await checkCircular(
          undefined,
          parentAccount?.id,
        );
        if (willBeCircular) {
          errors.push({
            row,
            error: `Circular dependency detected for parent "${row.parentAccount}"`,
          });
          continue;
        }

        const exists = await accountRepo.findOne({
          where: {
            accountName: row.accountName,
            accountType: row.accountType as AccountType,
          },
        });

        if (exists) {
          duplicates.push({
            accountName: row.accountName,
            accountType: row.accountType,
            accountCode: row.accountCode ?? "",
            accountCurrency: row.accountCurrency as unknown as CurrencyEnum,
            notes: row.notes ?? undefined,
            groupName: row.groupName ?? undefined,
            parentAccount: row.parentAccount ?? undefined,
          });
          continue;
        }

        const accountData: CreateAccountDataDto = {
          accountName: row.accountName,
          accountType: row.accountType as AccountType,
          accountCode: row.accountCode ?? "",
          accountCurrency: row.accountCurrency,
          notes: row.notes ?? undefined,
          groupId: group ? group.id : undefined,
          parentAccountId: parentAccount ? parentAccount.id : undefined,
        };

        try {
          const result = await this.createAccount(dataSource, accountData);
          createdAccounts.push(result.data);
        } catch (e) {
          errors.push({ row, error: e.message });
        }
      }

      return {
        message: "Accounts created successfully",
        createdAccounts: createdAccounts.length,
        duplicates,
        errors,
      };
    });
  }

  async updateDuplicateAccounts(rows: CsvMappingDto[], dataSource: DataSource) {
    return dataSource.transaction(async (manager) => {
      const accountRepo = manager.getRepository(AccountData);
      const groupRepo = manager.getRepository(GroupData);

      const updatedAccounts: AccountData[] = [];
      const updatedDuplicates: any[] = [];
      const uniquenessTracker = new Set<string>();

      const checkCircular = async (
        childId: number | undefined,
        parentId: number | undefined,
      ): Promise<boolean> => {
        if (!parentId) return false;
        if (childId === parentId) return true;

        const parent = await accountRepo.findOne({
          where: { id: parentId },
          relations: ["parentAccount"],
        });

        if (!parent || !parent.parentAccount) return false;
        return checkCircular(childId, parent.parentAccount.id);
      };

      for (const row of rows) {
        // Validate enums
        if (
          row.accountCurrency &&
          !Object.values(CurrencyEnum).includes(row.accountCurrency)
        ) {
          continue;
        }

        if (
          row.accountType &&
          !Object.values(AccountType).includes(row.accountType as AccountType)
        ) {
          continue;
        }

        // Prevent duplicate processing
        const uniqueKey = `${row.accountName.toLowerCase()}|${row.accountType.toLowerCase()}`;
        if (uniquenessTracker.has(uniqueKey)) continue;
        uniquenessTracker.add(uniqueKey);

        /* -------------------- GROUP -------------------- */
        let group: GroupData | null = null;
        if (row.groupName) {
          group = await groupRepo.findOne({
            where: {
              groupName: row.groupName,
              groupType: row.accountType as AccountType,
            },
          });

          if (!group) {
            const result = await this.groupService.createGroup(dataSource, {
              groupName: row.groupName,
              groupType: row.accountType as AccountType,
            });
            group = result.data;
          }
        }

        /* -------------------- PARENT ACCOUNT -------------------- */
        let parentAccount: AccountData | null = null;
        if (row.parentAccount) {
          parentAccount = await accountRepo.findOne({
            where: {
              accountName: row.parentAccount,
              accountType: row.accountType as AccountType,
            },
          });

          if (!parentAccount) {
            const result = await this.createAccount(dataSource, {
              accountName: row.parentAccount,
              accountType: row.accountType as AccountType,
              accountCode: "",
              accountCurrency: row.accountCurrency,
              notes: undefined,
              groupId: group?.id,
              parentAccountId: undefined,
            });
            parentAccount = result.data;
          }
        }

        /* -------------------- EXISTING ACCOUNT -------------------- */
        const existingAccount = await accountRepo.findOne({
          where: {
            accountName: row.accountName,
            accountType: row.accountType as AccountType,
          },
          relations: ["parentAccount", "group"],
        });

        const willBeCircular = await checkCircular(
          existingAccount?.id,
          parentAccount?.id,
        );

        if (willBeCircular) continue;

        if (existingAccount) {
          updatedDuplicates.push({
            accountName: existingAccount.accountName,
            accountType: existingAccount.accountType,
            accountCode: existingAccount.accountCode ?? "",
            accountCurrency: existingAccount.accountCurrency ?? "",
            notes: existingAccount.notes ?? "",
            groupName: existingAccount.group?.groupName ?? "",
            parentAccount: existingAccount.parentAccount?.accountName ?? "",
            parentAccountId: existingAccount.parentAccount?.id ?? null,
          });

          existingAccount.accountCode =
            row.accountCode ?? existingAccount.accountCode;
          existingAccount.notes = row.notes ?? existingAccount.notes;
          existingAccount.group = group ?? existingAccount.group;
          existingAccount.parentAccount =
            parentAccount ?? existingAccount.parentAccount;

          updatedAccounts.push(await accountRepo.save(existingAccount));
          continue;
        }

        /* -------------------- CREATE ACCOUNT -------------------- */
        const newAccount = accountRepo.create({
          accountName: row.accountName,
          accountType: row.accountType as AccountType,
          accountCode: row.accountCode ?? "",
          accountCurrency: row.accountCurrency,
          notes: row.notes ?? null,
          group: group ?? undefined,
          parentAccount: parentAccount ?? undefined,
        });

        updatedAccounts.push(await accountRepo.save(newAccount));
      }

      return {
        updatedAccounts,
        updatedDuplicates,
      };
    });
  }

  async archive(dataSource: DataSource, accountId: number) {
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const accountRepo = dataSource.getRepository(AccountData);

      const account = await accountRepo.findOne({ where: { id: accountId } });
      if (!account) throw new NotFoundException("Account Does Not Exist");

      account.isArchived = !account.isArchived;
      const result = await accountRepo.save(account);

      await queryRunner.commitTransaction();
      return {
        data: result,
        change_of_data: {
          id: result.id,
          archived: result.isArchived,
          module: "COA",
          feature: "Account",
          status: "Archive",
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async toggleReports(dataSource: DataSource, accountId: number) {
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const accountRepo = dataSource.getRepository(AccountData);
      let account = await accountRepo.findOne({ where: { id: accountId } });

      if (!account) throw new NotFoundException("Account Does Not Exist");

      account.showInReports = !account.showInReports;

      if (account.showInReports) {
        const contactRepo = dataSource.getRepository(Contact);
        const activeAccounts = await accountRepo.find({
          where: { showInReports: true },
        });
        const activeContacts = await contactRepo.find({
          where: { showInReports: true },
        });

        account.position = activeAccounts.length + activeContacts.length + 1;
        await accountRepo.save(account);

        return;
      } else {
        await accountRepo.save(account);
        await this.recalculatePositions(dataSource);
      }

      await queryRunner.commitTransaction();
      return account;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log(error);
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async getReports(dataSource: DataSource) {
    const accountRepo = dataSource.getRepository(AccountData);
    const contactRepo = dataSource.getRepository(Contact);

    const activeAccounts = await accountRepo.find({
      where: { showInReports: true },
      order: { position: "ASC" },
    });
    const activeContacts = await contactRepo.find({
      where: { showInReports: true },
      order: { position: "ASC" },
    });

    const reports = [
      ...activeAccounts.map((account) => ({
        id: account.id,
        name: account.accountName,
        type: account.accountType,
        position: account.position,
        balance: account.accountBalance,
      })),
      ...activeContacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        type: "Contact",
        position: contact.position,
        balance: contact.contactBalance,
      })),
    ];

    return reports;
  }

  async repositionReports(data: ReportRepositionArray, dataSource: DataSource) {
    const accountRepo = dataSource.getRepository(AccountData);
    const contactRepo = dataSource.getRepository(Contact);
    const incomingCompositeKeys = new Set(
      data.reportRepositionArray.map((r) => `${r.id}-${r.accountType}`),
    );
    const dbAccounts = await accountRepo.find({
      where: { showInReports: true },
      select: ["id", "accountType"],
    });
    const dbContacts = await contactRepo.find({
      where: { showInReports: true },
      select: ["id"],
    });
    const dbCompositeKeys: string[] = [
      ...dbAccounts.map((a) => `${a.id}-${a.accountType}`),
      ...dbContacts.map((c) => `${c.id}-Contact`),
    ];
    const missingEntries = dbCompositeKeys.filter(
      (key) => !incomingCompositeKeys.has(key),
    );
    if (missingEntries.length > 0) {
      throw new BadRequestException(`Missing mandatory reports in request`);
    }
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const txAccountRepo = queryRunner.manager.getRepository(AccountData);
      const txContactRepo = queryRunner.manager.getRepository(Contact);
      for (const report of data.reportRepositionArray) {
        let entity: AccountData | Contact | null = null;
        if (report.accountType === "Contact") {
          entity = await txContactRepo.findOne({ where: { id: report.id } });
          if (entity) {
            entity.position = report.position;
            await txContactRepo.save(entity);
          }
        } else {
          entity = await txAccountRepo.findOne({
            where: { id: report.id, accountType: report.accountType as any },
          });
          if (entity) {
            entity.position = report.position;
            await txAccountRepo.save(entity);
          }
        }
        if (!entity) {
          throw new BadRequestException(`Entity not found`);
        }
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async generateAccountandGroup(
    dataSource: DataSource,
    companyId: string,
    userId: number,
    includeGroup = false,
  ) {
    const repository = dataSource.getRepository(AccountData);
    const data = await repository.find({
      relations: ["group", "parentAccount"],
    });
    const workbook = new ExcelJS.Workbook();
    const companyName = await this.getCompanyName(companyId);
    const date = new Date().toISOString();
    const fileName = `Account_${companyName}_${date}`;
    const headerText = `
      Account\n
      ${companyName}`;
    const title = [
      "accountName",
      "accountCode",
      "accountType",
      "accountCurrency",
      "accountBalance",
      "notes",
      "parentAccount",
      "isArchived",
      "group",
      "reports",
    ];
    const header = [
      "Name",
      "Code",
      "Type",
      "Currency",
      "Balance",
      "Notes",
      "Parent Account",
      "Is Archived",
      "Group",
      "Reports",
    ];

    const showZeroBalance = await this.getZeroBalance(dataSource, userId);
    await generateExcel(
      workbook,
      data,
      headerText,
      "Account",
      title,
      header,
      showZeroBalance!,
    );

    if (includeGroup) {
      const repository = dataSource.getRepository(GroupData);
      const headerText = `
      Group\n
      ${companyName}`;
      const data = await repository.find();
      const title = ["groupName", "groupType"];
      const header = ["Group Name", "Group Type"];
      await generateExcel(workbook, data, headerText, "Group", title, header);
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return {
      buffer,
      fileName,
      change_of_data: {
        module: "COA",
        feature: "Account",
        status: "Export",
      },
    };
  }
  async toggleZeroBalanceSettings(
    dataSource: DataSource,
    userId: number,
    dto: ZeroBalanceToggleDto,
  ) {
    return await dataSource.transaction(async (manager: EntityManager) => {
      const zeroBalanceRepo = manager.getRepository(ZeroBalance);

      let zeroBalance = await zeroBalanceRepo.findOne({ where: { userId } });

      if (!zeroBalance) {
        zeroBalance = zeroBalanceRepo.create({ userId });
      }

      Object.assign(zeroBalance, dto);

      return await zeroBalanceRepo.save(zeroBalance);
    });
  }
}
