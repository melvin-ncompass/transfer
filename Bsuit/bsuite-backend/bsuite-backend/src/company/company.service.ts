import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, In, Repository } from "typeorm";
import { UserCompanyRelation } from "src/company/entities/user-company-relation.entity";
import { User } from "src/auth/entities/user.entity";
import { TenantService } from "src/database/tenants.service";
import { MigrationService } from "src/migration/migration.service";
import { Company } from "./entities/company.entity";
import { CompanySetting } from "src/setting/entities/tenant.company-setting.entity";
import type { Request, Response } from "express";
import { DataSource } from "typeorm/browser";
import { Role } from "src/rba/entities/role.entity";
import { UserRole } from "src/rba/entities/user-role.entity";
import { Session } from "src/auth/entities/session.entity";
import { GcsService } from "src/user/gcs.service";
import { RbaService } from "src/rba/rba.service";
import { GroupData } from "src/books/account/entities/tenant.group.entity";
import { ACCOUNTS_CONFIG, GROUPS_CONFIG, TAX_CONFIG } from "./default-accounts";
import { AccountData } from "src/books/account/entities/tenant.account.entity";
import { Tax } from "src/books/tax/entities/tenant.tax.entity";
import { Contact } from "src/books/contact/entities/tenant.contact.entity";
import { InvoiceTemplate } from "src/setting/entities/tenant.invoice-template.entity";

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(UserCompanyRelation)
    private relationsRepo: Repository<UserCompanyRelation>,
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
    private readonly tenantService: TenantService,
    private readonly migrationService: MigrationService,
    private gcsService: GcsService,
    private readonly roleService: RbaService,
  ) { }

  async findOne(companyId: string) {
    return await this.companyRepo.findOne({ where: { companyId } });
  }

  async getCompanyCountForUser(userId: number) {
    return await this.relationsRepo.count({
      where: { user: { id: userId } },
    });
  }

  async create(
    createCompanyDto: CreateCompanyDto,
    userId: number,
    email: string,
  ) {
    const { companyName } = createCompanyDto;

    // company name check
    const validNameRegex = /^[a-zA-Z0-9 ]+$/;
    if (!validNameRegex.test(companyName)) {
      throw new BadRequestException(
        "Company name can only contain letters, numbers, and spaces.",
      );
    }

    // product domain
    const productDomain = companyName.toLowerCase().replace(/\s+/g, "");

    const existingCompany = await this.companyRepo.findOne({
      where: [
        { companyName: ILike(companyName) },
        { productDomain: ILike(productDomain) },
      ],
    });

    if (existingCompany) {
      throw new ConflictException(
        `Company with name "${companyName}" or similar domain already exists`,
      );
    }
    const companyId = Math.random().toString(36).slice(2, 8).toUpperCase();

    try {
      await this.tenantService.onboardTenant(companyId);
      await this.tenantService.onboardTenantUser(companyId);
      await this.migrationService.runSingleCompanyMigration(companyId);
    } catch (err) {
      await this.tenantService.removeTenantUser(companyId, userId);
      await this.tenantService.removeTenant(companyId);
      throw new InternalServerErrorException(
        `Tenant setup failed and was rolled back: ${err?.message || err}`,
      );
    }

    const company = this.companyRepo.create({
      ...createCompanyDto,
      companyId,
      productDomain,
    });
    await this.companyRepo.save(company);

    const ownerCompanyRelation = this.relationsRepo.create({
      user: { id: userId },
      company: { id: company.id },
      status: "Owner",
    });

    await this.relationsRepo.save(ownerCompanyRelation);

    // company setting creation
    const tenantConnection =
      await this.tenantService.getTenantDataSource(companyId);
    const settingRepo = tenantConnection.getRepository(CompanySetting);

    const companySetting = settingRepo.create({
      companyId: company.companyId,
      reportingCurrency: createCompanyDto.reportingCurrency,
    });
    await settingRepo.save(companySetting);
    // Create the contact
    const contactRepo = tenantConnection.getRepository(Contact);
    const contact = contactRepo.create({
      name: email.split("@")[0],
      email: email,
      isArchived: false,
    });
    await contactRepo.save(contact);
    const companyCount = await this.getCompanyCountForUser(userId);
    if (companyCount === 1) {
      this.setDefaultCompany(userId, companyId);
    }
    await this.roleService.createDefaultRoles(company.id);
    await this.setRoleForOwner(userId, company.id);
    await this.createDefaultBooksData(
      createCompanyDto.reportingCurrency,
      tenantConnection,
    );

    const invoiceTemplateRepo = tenantConnection.getRepository(InvoiceTemplate);

    const template: InvoiceTemplate = invoiceTemplateRepo.create({
      templateName: "Default Invoice Template",

      header: {
        Email: false,
        Phone: false,
        Total: false,
        Due_Date: false,
        Last_Name: false,
        First_Name: false,
        Salutation: false,
        Invoice_Date: false,
        Invoice_Number: false,
        Organization_Logo: false,
        Organization_Name: false,
      },

      footer: {
        Email: false,
        Phone: false,
        Total: false,
        Due_Date: false,
        Last_Name: false,
        First_Name: false,
        Salutation: false,
        Invoice_Date: false,
        Invoice_Number: false,
        Show_Page_Number: false,
        Organization_Logo: false,
        Organization_Name: false,
      },

      transaction: {
        Balance_Due: true,
        Invoice_Date: "Invoice Date:",
        Document_Title: "TAX INVOICE",
        Invoice_Number: "INV:",
        Invoice_DueDate: "Due Date:",
        Organization_Logo: {
          size: "100",
          enabled: true,
          alignment: "left",
        },
        Organization_Address: {
          City: "2a",
          State: "2b",
          Country: "3a",
          Pincode: false,
          Address_Line_1: "1a",
          Address_Line_2: false,
        },
      },

      table: {
        QTY: "16.6667",
        Item: "16.6667",
        Price: "16.6667",
        Total: "16.6667",
        HSNSAC: "16.6667",
        AccountName: "16.6667",
        tableItem: "20",
        tablePrice: "20",
        tableQTY: "20",
        tableTotal: "20",
        tableHSNSAC: "20",
        tableAccountName: "20",
      },

      others: {
        Discount: true,
        Subtotal: "Subtotal",
        TaxDetails: true,
        ShowQuantity: false,
        ShowTotalSection: true,
        ShowAmountinWords: true,
      },

      isDefault: true,
    });
    await invoiceTemplateRepo.save(template);
    return {
      data: company
    };
  }

  async setRoleForOwner(userId: number, companyId: number) {
    const globalAdminRole = await this.roleRepo.findOne({
      where: { roleName: "Global Admin", company: { id: companyId } },
    });
    if (!globalAdminRole) {
      throw new NotFoundException("Global Admin role not found");
    }

    const userRole = this.userRoleRepo.create({
      user: { id: userId },
      role: globalAdminRole,
    });

    await this.userRoleRepo.save(userRole);
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException("Company not found");

    const { companyName } = updateCompanyDto;

    if (companyName) {
      if (companyName.trim().length < 3) {
        throw new BadRequestException(
          "Company name must be at least 3 characters long.",
        );
      }

      const validNameRegex = /^[a-zA-Z0-9 ]+$/;
      if (!validNameRegex.test(companyName)) {
        throw new BadRequestException(
          "Company name can only contain letters, numbers, and spaces.",
        );
      }

      const productDomain = companyName.toLowerCase().replace(/\s+/g, "");

      const existingCompany = await this.companyRepo.findOne({
        where: [
          { companyName: ILike(companyName) },
          { productDomain: ILike(productDomain) },
        ],
      });

      if (existingCompany && existingCompany.id !== id) {
        throw new ConflictException(
          `Company name "${companyName}" or a similar domain already exists.`,
        );
      }

      company.companyName = companyName;
      company.productDomain = productDomain;
    }

    if ("reportingCurrency" in updateCompanyDto) {
      delete updateCompanyDto.reportingCurrency;
    }
    Object.assign(company, updateCompanyDto);
    const updated = await this.companyRepo.save(company);
    return {
      data: updated
    }
  }

  async remove(id: number, userId: number, companyId: string) {
    const companyExists = await this.companyRepo.findOne({ where: { id } });
    if (!companyExists) throw new NotFoundException("Company not found");

    const userExists = await this.userRepo.findOne({
      where: { id: userId },
      relations: ["defaultCompany"],
    });
    if (!userExists) throw new NotFoundException("User not found");

    if (companyExists.companyId == companyId) {
      throw new ForbiddenException("Cannot delete current company");
    }

    if (userExists.defaultCompany?.id == companyExists.id) {
      throw new ForbiddenException("Cannot delete default company");
    }

    await this.tenantService.removeTenantUser(companyExists.companyId, userId);
    await this.tenantService.removeTenant(companyExists.companyId);

    await this.companyRepo.remove(companyExists);
    return
  }

  async findAll() {
    return await this.companyRepo.find({ select: ["companyId"] });
  }

  async validateUserCompanyRelation(userId: any, companyId: string) {
    const companyExists = await this.companyRepo.findOne({
      where: { companyId },
      select: ["id"],
    });
    if (!companyExists) {
      throw new InternalServerErrorException(
        "Company with companyId not found!",
      );
    }

    const userExists = this.userRepo.findOne({ where: { id: userId } });
    if (!userExists) {
      throw new InternalServerErrorException("User not found!");
    }

    await this.relationsRepo.findOne({
      where: {
        user: { id: userId },
        company: { id: companyExists.id },
      },
      relations: ["user", "company"],
    });
  }

  async managePeopleAccess(
    companyId: string,
    isEnabled: boolean,
    dataSource: DataSource,
  ) {
    if (!companyId) throw new NotFoundException("Invalid Company Id");

    const updateResult = await dataSource
      .getRepository(CompanySetting)
      .update({ companyId }, { isPeopleEnabled: isEnabled });

    if (updateResult.affected === 0) {
      throw new NotFoundException(`Company with id ${companyId} not found`);
    }
    return {
      message: `People access ${isEnabled ? "enabled" : "disabled"} successfully.`,
    };
  }

  //Get people access
  async getPeopleAccess(companyId: string, dataSource: DataSource) {
    return await dataSource.getRepository(CompanySetting).find({
      where: { companyId },
      select: ["isPeopleEnabled"],
    });
  }

  async setDefaultCompany(userId: number, companyId: string) {
    const userExists = await this.userRepo.findOne({
      where: { id: userId },
      relations: ["defaultCompany"],
    });
    if (!userExists) throw new NotFoundException("User not found!");

    const companyExists = await this.companyRepo.findOne({
      where: { companyId },
    });
    if (!companyExists) throw new NotFoundException("Company not found!");

    const isRelated = await this.relationsRepo.findOne({
      where: { company: { id: companyExists.id }, user: { id: userExists.id } },
      relations: ["user", "company"],
    });
    if (!isRelated)
      throw new ForbiddenException("User not a part of the company!");

    if (userExists.defaultCompany?.companyId === companyId) {
      throw new ConflictException("Company already set as default");
    }

    userExists.defaultCompany = companyExists;

    await this.userRepo.save(userExists);
    return;
  }

  async listAllCompany(userId: number) {
    const userExists = await this.userRepo.findOne({
      where: { id: userId },
      relations: ["defaultCompany"],
    });
    if (!userExists) throw new NotFoundException("User not found!");

    const defaultCompanyId = userExists.defaultCompany?.id;
    const userIdValue = userExists.id;

    const relations = await this.relationsRepo.find({
      where: { user: { id: userIdValue } },
      relations: ["company", "user"],
      select: {
        company: {
          id: true,
          companyName: true,
          companyId: true,
          companyShortName: true,
          productDomain: true,
        },
      },
    });

    const uniqueCompanies: Record<string, any> = {};
    const companyIds: string[] = [];

    relations.forEach((rel) => {
      const company = rel.company;
      if (!uniqueCompanies[company.id]) {
        uniqueCompanies[company.id] = {
          id: company.id,
          companyName: company.companyName,
          companyId: company.companyId,
          companyShortName: company.companyShortName,
          companyProductDomain: company.productDomain,
        };
        companyIds.push(company.companyId);
      }
    });

    let allRelationsForCompanies: any[] = [];
    if (companyIds.length > 0) {
      allRelationsForCompanies = await this.relationsRepo.find({
        relations: ["user", "company"],
        where: {
          company: { companyId: In(companyIds) },
        },
        select: { company: { id: true } },
      });
    }

    const userCountMap = allRelationsForCompanies.reduce(
      (map, relation) => {
        const companyId = relation.company.id;
        map[companyId] = (map[companyId] || 0) + 1;
        return map;
      },
      {} as Record<string, number>,
    );

    const companies = Object.values(uniqueCompanies).map((company) => {
      const companyId = company.id;
      return {
        id: companyId,
        companyName: company.companyName,
        companyId: company.companyId,
        companyShortName: company.companyShortName,
        isDefault: companyId === defaultCompanyId,
        noOfUsers: userCountMap[companyId] || 0,
        companyProductDomain: company.companyProductDomain,
      };
    });

    return companies;
  }

  async findByProductDomain(domain: string) {
    const company = await this.companyRepo.findOne({
      where: { productDomain: domain },
    });
    if (!company) throw new Error("Company not found");
    return company;
  }

  async checkUserAccess(userId: number, companyId: string): Promise<boolean> {
    const relation = await this.relationsRepo.findOne({
      where: {
        user: { id: userId },
        company: { companyId },
      },
    });

    return !!relation;
  }

  async setCurrentCompany(
    userId: number,
    companyId: string,
    res: Response,
    sessionId: string,
  ) {
    const session = await this.sessionRepo.findOne({ where: { sessionId } });
    if (!session) throw new ForbiddenException("Session Expired or Revoked");

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User Not Found");

    const company = await this.companyRepo.findOne({ where: { companyId } });
    if (!company) throw new NotFoundException("Company Not Found");

    const relation = await this.relationsRepo.findOne({
      where: { user: { id: userId }, company: { companyId } },
      relations: ["user", "company"],
    });

    console.log(relation);

    if (!relation)
      throw new ForbiddenException(`Cannot Select Company ${companyId}`);

    res.cookie("companyId", companyId, {
      httpOnly: true,
      secure: true,
      maxAge: session.expiresAt.getTime() - Date.now(),
      sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
    });

    return;
  }

  async headerData(userId: number, companyId?: string) {
    const userExists = await this.userRepo.findOne({
      where: { id: userId },
      relations: ["defaultCompany"],
    });
    if (!userExists) throw new NotFoundException("User not found!");

    if (!companyId) {
      companyId = userExists.defaultCompany?.companyId;
      if (!companyId) {
        const relationExists = await this.relationsRepo.findOne({
          where: { user: userExists },
          relations: ["user", "company"],
        });
        if (relationExists) {
          userExists.defaultCompany = relationExists.company;
          companyId = relationExists.company.companyId;
          await this.userRepo.save(userExists);
        }
      }
    }

    const relation = await this.relationsRepo.findOne({
      where: { user: { id: userExists.id }, company: { companyId } },
      relations: ["company", "user"],
    });

    if (!companyId || !relation) {
      let profileImage: string | undefined;
      if (userExists.profileImage) {
        profileImage = await this.gcsService.getSignedUrl(
          userExists.profileImage,
        );
      }

      return {
        userDisplayName: userExists.displayName,
        userEmail: userExists.email,
        userProfilePic: profileImage,
      };
    }

    const dataSource = await this.tenantService.getTenantDataSource(companyId);
    const settingRepo = dataSource.getRepository(CompanySetting);

    const companyExists = await this.companyRepo.findOne({
      where: { companyId },
    });
    if (!companyExists) throw new NotFoundException("Company not found!");

    const companySetting = await settingRepo.findOne({ where: { companyId } });
    if (!companySetting)
      throw new NotFoundException("Company Setting not found!");

    let url: string | undefined;
    if (companySetting.logo) {
      const logoPath = `${process.env.BUCKET_BASE_FOLDER!}/${companyExists.companyId}/Logo/${companySetting.logo}`;
      url = await this.gcsService.getSignedUrl(logoPath);
    }

    let profileImage: string | undefined;
    if (userExists.profileImage) {
      profileImage = await this.gcsService.getSignedUrl(
        userExists.profileImage,
      );
    }

    return {
      companyId: companyExists.companyId,
      companyName: companyExists.companyName,
      reportingCurrency: companySetting.reportingCurrency,
      commaSeparation: companySetting.commaSeparation,
      companyLogo: url,
      userDisplayName: userExists.displayName,
      userEmail: userExists.email,
      userProfilePic: profileImage,
    };
  }

  async findRelation(userId: number, companyId: string) {
    return await this.relationsRepo.findOne({
      where: { user: { id: userId }, company: { companyId } },
      relations: ["user", "company"],
    });
  }

  async createDefaultBooksData(
    reportingCurrency: string,
    dataSource: DataSource,
  ) {
    await dataSource.manager.transaction(async (manager) => {
      const existingGroups = await manager.find(GroupData);
      const existingGroupNames = new Set(
        existingGroups.map((g) => g.groupName),
      );
      const groupsToInsert = GROUPS_CONFIG.filter(
        (g) => !existingGroupNames.has(g.name),
      ).map((g) => ({
        groupName: g.name,
        groupType: g.type,
      }));
      if (groupsToInsert.length) {
        await manager.insert(GroupData, groupsToInsert);
      }
      const allGroups = [
        ...existingGroups,
        ...(groupsToInsert.length ? await manager.find(GroupData) : []),
      ];
      const groupMap = Object.fromEntries(
        allGroups.map((g) => [g.groupName, g]),
      );
      const existingAccounts = await manager.find(AccountData);
      const existingAccountNames = new Set(
        existingAccounts.map((a) => `${a.accountName}::${a.accountType}`),
      );
      const accountsToInsert = ACCOUNTS_CONFIG.filter(
        (a) => !existingAccountNames.has(`${a.name}::${a.type}`),
      ).map((a) => ({
        accountName: a.name,
        accountType: a.type,
        accountCurrency: reportingCurrency,
        accountBalance: "0",
        notes: a.notes ?? null,
        isArchived: false,
        group: a.group ? groupMap[a.group] : undefined,
      }));
      if (accountsToInsert.length) {
        await manager.save(AccountData, accountsToInsert);
      }
      const existingTaxes = await manager.find(Tax);
      const existingTaxNames = new Set(existingTaxes.map((t) => t.taxName));
      const taxesToInsert = TAX_CONFIG.filter(
        (t) => !existingTaxNames.has(t.name),
      ).map((t) => ({
        taxName: t.name,
        abbreviation: t.abbreviation,
        taxRate: t.rate,
        taxBalance: "0",
      }));
      if (taxesToInsert.length) {
        await manager.insert(Tax, taxesToInsert);
      }

      return {
        groupsToInsert,
        accountsToInsert,
        taxesToInsert,
      };
    });
  }

  async createDefaultDataForAllCompanies() {
    // Get all companies
    const companies = await this.companyRepo.find();

    console.log(
      `Found ${companies.length} companies. Initializing default books for each.`,
    );

    for (const company of companies) {
      try {
        console.log(
          `Creating default books for company: ${company.companyName} (ID: ${company.id})`,
        );
        const dataSource = await this.tenantService.getTenantDataSource(
          company.companyId,
        );
        const repo = dataSource.getRepository(CompanySetting);
        const companySetting = await repo.findOne({ where: {} });
        if (!companySetting)
          throw new NotFoundException(
            `Company Setting for ${company.companyName} (ID: ${company.id}) not found`,
          );
        if (!companySetting.reportingCurrency)
          throw new NotFoundException(
            `reportingCurrency for ${company.companyName} (ID: ${company.id}) not found`,
          );
        await this.createDefaultBooksData(
          companySetting.reportingCurrency,
          dataSource,
        );

        console.log(
          `Default books created for company: ${company.companyName}`,
        );
      } catch (error) {
        console.error(`Failed for company ${company.companyName}:`, error);
      }
    }

    console.log("All companies processed.");
  }
}
