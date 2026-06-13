import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { CompanySetting } from "./entities/tenant.company-setting.entity";
import { UpdateCompanyImageDto } from "./dto/update-company-image.dto";
import { DataSource, ILike, In, Repository } from "typeorm";
import sharp from "sharp";
import { GcsService } from "src/user/gcs.service";
import {
  CompanyIdentity,
  CompanyMetaData,
} from "./entities/tenant.company-identity.entity";
import {
  CompanyIdentityDto,
  CompanyMetaDataDto,
} from "./dto/update-company-identity.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { UserCompanyRelation } from "src/company/entities/user-company-relation.entity";
import { Company, DomainStatus } from "src/company/entities/company.entity";
import { UpdateReportStructureDto } from "./dto/update-company-settings.dto";
import { UserRole } from "src/rba/entities/user-role.entity";
import { MagicToken } from "src/company/entities/magic-token.entity";
import { EmailService } from "src/auth/mail.service";
import { User } from "src/auth/entities/user.entity";
import { Role } from "src/rba/entities/role.entity";
import * as fs from "fs";
import * as crypto from "crypto";
import * as Handlebars from "handlebars";
import * as argon2 from "argon2";
import type { Request } from "express";
import * as dns from "dns/promises";
import { InvoiceTemplate } from "./entities/tenant.invoice-template.entity";
import { CreateInvoiceTemplateDto } from "./dto/create-invoice-template.dto";
import { UpdateInvoiceTemplateDto } from "./dto/update-invoice-template-dto";
import { getTemplatePath } from "src/shared/utils";

@Injectable()
export class SettingService {
  private baseFolder = process.env.BUCKET_BASE_FOLDER!;

  constructor(
    private readonly gcsService: GcsService,
    @InjectRepository(UserCompanyRelation)
    private userCompanyRelation: Repository<UserCompanyRelation>,
    @InjectRepository(UserCompanyRelation)
    private relationsRepo: Repository<UserCompanyRelation>,
    @InjectRepository(MagicToken)
    private magicTokenRepo: Repository<MagicToken>,
    private readonly mailerService: EmailService,
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>
  ) { }

  private loadEmailTemplate(
    username: string,
    companyName: string,
    options?: {
      magicLink?: string;
      loginLink?: string;
    }
  ) {
    const filePath = getTemplatePath("invite-user-email.html");
    const templateSource = fs.readFileSync(filePath, "utf8");
    console.log("options", options);
    const template = Handlebars.compile(templateSource);
    if (options?.magicLink) {
      return template({
        username,
        companyName,
        magicLink: options.magicLink,
      });
    } else {
      return template({
        username,
        companyName,
        loginLink: options?.loginLink,
      });
    }
  }

  private async updateUserDefaultCompany(userId: number, removedCompanyId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ["defaultCompany"],
    });

    if (!user) return;
    if (user.defaultCompany?.id !== removedCompanyId) {
      return;
    }

    const relations = await this.relationsRepo.find({
      where: { user: { id: userId } },
      relations: ["company"],
      order: { id: "ASC" },
    });

    if (relations.length === 0) {
      user.defaultCompany = undefined;
    } else {
      user.defaultCompany = relations[0].company;
    }

    await this.userRepo.save(user);
  }


  private generateMagicToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  private generateUsername(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let username = "";

    for (let i = 0; i < 6; i++) {
      username += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return username;
  }

  private async sendInvitationEmail(
    userId: number,
    email: string,
    companyName: string,
    req: Request
  ) {
    const token = this.generateMagicToken();
    const expiresIn = new Date();
    expiresIn.setHours(expiresIn.getHours() + 24);

    await this.magicTokenRepo.save({
      userId,
      token,
      expiresAt: expiresIn,
    });
    const username = email.split("@")[0];
    const magicLink = `${req.headers["origin"]}/${process.env.VERIFY_MAGIC_LINK}/${token}`;
    const userEmailTemplate = this.loadEmailTemplate(username, companyName, {
      magicLink: magicLink,
    });

    await this.mailerService.sendEmail({
      to: email,
      subject: "Welcome to BSuite",
      html: userEmailTemplate,
      attachments: null,
    });
  }

  private async userAbsent(email: string, companyId: number) {
    const randomName = this.generateUsername();
    const displayName = email.split("@")[0];
    const companyExists = await this.companyRepo.findOne({
      where: { id: companyId },
    });

    if (!companyExists) {
      throw new NotFoundException("Company not found!");
    }

    const userData = this.userRepo.create({
      email,
      username: randomName,
      displayName,
      defaultCompany: companyExists,
    });
    const user = await this.userRepo.save(userData);

    const ownerCompanyRelation = this.relationsRepo.create({
      user: { id: user?.id },
      company: { id: companyId },
      status: "Invitation Sent",
    });

    await this.relationsRepo.insert(ownerCompanyRelation);
  }

  private async getCompanySetting(dataSource: DataSource) {
    const repo = dataSource.getRepository(CompanySetting);
    const company = await repo.findOne({ where: {} });
    return company!;
  }

  private async generateCnameTarget(companyId: string) {
    return `company-${companyId}${process.env.SUBDOMAIN}`;
  }

  private async validateTemplateName(
    dataSource: DataSource,
    templateName: string,
    excludeId?: number
  ) {
    const invoiceTemplateRepo = dataSource.getRepository(InvoiceTemplate);

    const query = invoiceTemplateRepo
      .createQueryBuilder("template")
      .where("LOWER(template.templateName) = LOWER(:name)", {
        name: templateName.trim(),
      });

    if (excludeId) {
      query.andWhere("template.id != :id", { id: excludeId });
    }

    const existing = await query.getOne();

    if (existing) {
      throw new ConflictException("Invoice template name already exists");
    }
  }

  async updateCompanyImage(
    editCompanyDto: UpdateCompanyImageDto,
    dataSource: DataSource,
    companyId: string,
    files?: { logo?: Express.Multer.File; headerImage?: Express.Multer.File }
  ) {
    const company = await this.getCompanySetting(dataSource);
    const companyData = await this.companyRepo.findOne({
      where: { companyId },
    });
    if (!companyData) {
      throw new NotFoundException("Company not found");
    }

    const {
      companyName,
      companyShortName,
      x,
      y,
      width,
      height,
      x1,
      y1,
      width1,
      height1,
    } = editCompanyDto;

    // begin company name validation
    if (!companyName || companyName.trim().length < 3) {
      throw new BadRequestException(
        "Company name must be at least 3 characters long."
      );
    }

    if (!companyShortName || companyShortName.trim().length < 2) {
      throw new BadRequestException(
        "Company short name must be at least 2 characters long."
      );
    }

    const validNameRegex = /^[a-zA-Z0-9 ]+$/;
    if (!validNameRegex.test(companyName)) {
      throw new BadRequestException(
        "Company name can only contain letters, numbers, and spaces."
      );
    }

    const productDomain = companyName.toLowerCase().replace(/\s+/g, "");

    const existingCompany = await this.companyRepo.findOne({
      where: [
        { companyName: ILike(companyName) },
        { productDomain: ILike(productDomain) },
      ],
    });

    if (existingCompany && existingCompany.companyId !== company.companyId) {
      throw new ConflictException(
        `Company name "${companyName}" or a similar domain already exists.`
      );
    }
    // end company name validation

    // logo
    const logoFolder = `${this.baseFolder}/${company.companyId}/Logo`;
    if (files?.logo) {
      let buffer = files.logo.buffer;

      // Crop if coordinates provided
      if (
        (x ?? -1) >= 0 &&
        (y ?? -1) >= 0 &&
        (width ?? 0) > 0 &&
        (height ?? 0) > 0
      ) {
        buffer = await sharp(buffer)
          .extract({ left: x!, top: y!, width: width!, height: height! })
          .toBuffer();
      }
      console.log(company.companyId, "company.companyId", this.baseFolder);
      if (company.logo) {
        await this.gcsService.deleteFile(`${logoFolder}/${company.logo}`);
      }
      const uniqueName = `${Date.now()}_${files.logo.originalname}`;
      await this.gcsService.uploadImage(
        { ...files.logo, buffer },
        logoFolder,
        uniqueName
      );
      company.logo = uniqueName;
    } else if (editCompanyDto.removeLogo == "true" && company.logo) {
      await this.gcsService.deleteFile(`${logoFolder}/${company.logo}`);
      company.logo = "";
    }

    // header image
    const headerFolder = `${this.baseFolder}/${company.companyId}/Header Image`;
    if (files?.headerImage) {
      let buffer = files.headerImage.buffer;

      if (
        (x1 ?? -1) >= 0 &&
        (y1 ?? -1) >= 0 &&
        (width1 ?? 0) > 0 &&
        (height1 ?? 0) > 0
      ) {
        buffer = await sharp(buffer)
          .extract({ left: x1!, top: y1!, width: width1!, height: height1! })
          .toBuffer();
      }

      if (company.headerImage) {
        await this.gcsService.deleteFile(
          `${headerFolder}/${company.headerImage}`
        );
      }

      const uniqueName = `${Date.now()}_${files.headerImage.originalname}`;
      await this.gcsService.uploadImage(
        { ...files.headerImage, buffer },
        headerFolder,
        uniqueName
      );
      company.headerImage = uniqueName;
    } else if (
      editCompanyDto.removeHeaderImage == "true" &&
      company.headerImage
    ) {
      await this.gcsService.deleteFile(
        `${headerFolder}/${company.headerImage}`
      );
      company.headerImage = "";
    }
    companyData.companyName = companyName;
    companyData.companyShortName = companyShortName;
    companyData.productDomain = productDomain;

    await this.companyRepo.save(companyData);
    await dataSource.getRepository(CompanySetting).save(company);
    return {
      data: {
        ...companyData,
        logo: company.logo,
        headerImage: company.headerImage,
      },
      change_of_data: {
        module: "Settings",
        feature: "Branding",
        status: "Update",
      },
    };
  }

  async getCompanyImages(dataSource: DataSource, companyId: string) {
    const companyData = await this.companyRepo.findOne({
      where: { companyId },
    });
    if (!companyData) {
      throw new NotFoundException("Company not found");
    }

    const settingRepo = dataSource.getRepository(CompanySetting);
    const setting = await settingRepo.findOne({ where: {} });
    if (!setting) {
      throw new NotFoundException("Company settings not found");
    }

    let logoUrl: string | undefined;
    let headerUrl: string | undefined;

    if (setting.logo) {
      logoUrl = await this.gcsService.getSignedUrl(
        `${this.baseFolder}/${setting.companyId}/Logo/${setting.logo}`
      );
    } else {
      logoUrl = "";
    }

    if (setting.headerImage) {
      headerUrl = await this.gcsService.getSignedUrl(
        `${this.baseFolder}/${setting.companyId}/Header Image/${setting.headerImage}`
      );
    } else {
      headerUrl = "";
    }

    return {
      logoUrl,
      headerUrl,
      companyName: companyData.companyName,
      companyShortName: companyData.companyShortName,
    };
  }

  async updateCompanyIdentity(
    companyIdentityDto: CompanyIdentityDto,
    companyMetaDataDto: CompanyMetaDataDto[],
    dataSource: DataSource
  ) {
    const companyIdentityRepo = dataSource.getRepository(CompanyIdentity);
    const companyMetaDataRepo = dataSource.getRepository(CompanyMetaData);

    let company = await companyIdentityRepo.findOne({ where: {} });

    let newMetaData: CompanyMetaData[] = [];
    await companyMetaDataRepo.clear();
    if (companyMetaDataDto && companyMetaDataDto.length > 0) {
      newMetaData = companyMetaDataRepo.create(companyMetaDataDto);
      await companyMetaDataRepo.save(newMetaData);
    }
    let updatedCompany: CompanyIdentity;
    if (!company) {
      updatedCompany = companyIdentityRepo.create(companyIdentityDto);
      updatedCompany = await companyIdentityRepo.save(updatedCompany);
    } else {
      Object.assign(company, companyIdentityDto);
      updatedCompany = await companyIdentityRepo.save(company);
    }
    return {
      data: { company: updatedCompany, metadata: newMetaData },
      change_of_data: {
        module: "Settings",
        feature: "Identity",
        status: "Update",
      },
    };
  }

  async getCompanyIdentity(dataSource: DataSource) {
    const companyIdentityRepo = dataSource.getRepository(CompanyIdentity);
    const companyMetaDataRepo = dataSource.getRepository(CompanyMetaData);
    const company = await companyIdentityRepo.findOne({ where: {} });
    const metadata = await companyMetaDataRepo.find();
    return { company, metadata };
  }

  async listUsersForCompany(companyId: string) {
    const company = await this.companyRepo.findOne({
      where: { companyId },
    });
    if (!company) return [];

    const integerCompanyId = company.id;

    const relations = await this.userCompanyRelation.find({
      where: { company: { id: integerCompanyId } },
      relations: ["user"],
    });

    if (!relations.length) return [];

    const userIds = relations.map((r) => r.user.id);

    const userRoles = await this.userRoleRepo.find({
      where: {
        user: { id: In(userIds) },
        role: {
          company: { id: integerCompanyId },
        },
      },
      relations: ["role", "user"],
    });


    const userRoleMap = userRoles.reduce((acc, ur) => {
      if (!acc[ur.user.id]) acc[ur.user.id] = new Set<string>();
      acc[ur.user.id].add(ur.role.roleName);
      return acc;
    }, {} as Record<number, Set<string>>);

    const fetchedData = relations.map((r) => ({
      id: r.user.id,
      userName: r.user.displayName,
      userId: r.user.username,
      email: r.user.email,
      status: r.status,
      role: Array.from(userRoleMap[r.user.id] || []),
      joinedAt: r.createdAt,
    }));
    return fetchedData;
  }

  async removeAllRolesForUser(userId: number): Promise<void> {
    const userRoles = await this.userRoleRepo.find({
      where: { user: { id: userId } },
    });

    if (userRoles.length > 0) {
      await this.userRoleRepo.remove(userRoles);
    }
  }

  async removeUserFromCompany(
    currentUserId: number,
    userId: number,
    companyId: string
  ) {
    if (userId == currentUserId) {
      throw new ForbiddenException("Cannot delete current logged in user!");
    }

    const tempCompId = await this.companyRepo.findOne({
      where: {
        companyId,
      },
    });

    const integerCompanyId = tempCompId?.id;
    const relatedUser = await this.userCompanyRelation.findOne({
      where: {
        user: { id: userId },
        company: { id: integerCompanyId },
      },
      relations: ["user"],
    });
    if (!relatedUser) {
      throw new NotFoundException(
        "No user-company relation found for the given IDs"
      );
    }

    if (relatedUser.status == "Owner") {
      throw new ForbiddenException("Cannot delete owner");
    }

    await this.userCompanyRelation.delete(relatedUser.id);
    await this.removeAllRolesForUser(userId);
    await this.updateUserDefaultCompany(userId, integerCompanyId!);



    return {
      change_of_data: {
        name: relatedUser.user.username,
        email: relatedUser.user.email,
        module: "Settings",
        feature: "User Management",
        status: "Delete",
      },
    };
  }

  async updateReportStructure(
    ds: DataSource,
    companyId: string,
    updateDto: UpdateReportStructureDto
  ) {
    const companySetting = await ds.getRepository(CompanySetting).findOne({
      where: { companyId },
    });

    if (!companySetting) {
      throw new BadRequestException("Company setting not found");
    }

    Object.assign(companySetting, updateDto);

    const updatedData = await ds
      .getRepository(CompanySetting)
      .save(companySetting);
    return {
      data: updatedData,
      change_of_data: {
        module: "Settings",
        feature: "Report Structure",
        status: "Update",
      },
    };
  }

  async getReportStructure(ds: DataSource, companyId: string) {
    const companySetting = await ds
      .getRepository(CompanySetting)
      .findOne({ where: { companyId } });

    if (!companySetting) {
      return null;
    }

    const companySettingDto = {
      fiscalYearStartDate: companySetting.fiscalYearStartDate,
      fiscalYearStartMonth: companySetting.fiscalYearStartMonth,
      fiscalYearEndDate: companySetting.fiscalYearEndDate,
      fiscalYearEndMonth: companySetting.fiscalYearEndMonth,
      enableFxCorrection: companySetting.enableFxCorrection,
      isCompanyName: companySetting.isCompanyName,
      isHeaderImage: companySetting.isHeaderImage,
      isPageNumber: companySetting.isPageNumber,
      isGeneratedBy: companySetting.isGeneratedBy,
      isGeneratedDate: companySetting.isGeneratedDate,
      isGeneratedTime: companySetting.isGeneratedTime,
      footerContent: companySetting.footerContent,
      reportingCurrency: companySetting.reportingCurrency,
      commaSeparation: companySetting.commaSeparation,
    };

    return companySettingDto;
  }

  async getCompanyDetails(dataSource: DataSource, companyId: string) {
    const companyIdentityRepo = dataSource.getRepository(CompanyIdentity);
    const companyMetaDataRepo = dataSource.getRepository(CompanyMetaData);

    const identity = await companyIdentityRepo.findOne({ where: {} });
    const metaData = await companyMetaDataRepo.find({});
    const companyData = await this.companyRepo.findOne({
      where: { companyId },
    });

    if (!companyData) {
      throw new NotFoundException("Company not found");
    }

    return {
      company: {
        companyId: companyData.companyId,
        companyName: companyData.companyName,
        companyShortName: companyData.companyShortName,
        createdAt: companyData.createdAt,
      },

      identity: identity
        ? {
          addressLine1: identity.addressLine1,
          addressLine2: identity.addressLine2,
          city: identity.city,
          state: identity.state,
          pincode: identity.pincode,
          country: identity.country,
        }
        : null,

      metadata: metaData.map((m) => ({
        label: m.label,
        value: m.value,
      })),
    };
  }

  async inviteUser(
    email: string,
    roleId: number,
    companyId: string,
    req: Request,
    invitedByUserId: number
  ) {
    let userId: number, username: string;
    const tempCompId = await this.companyRepo.findOne({
      where: {
        companyId,
      },
    });
    const integerCompanyId = tempCompId?.id;
    const userExists = await this.userRepo.findOne({
      where: { email },
      relations: ["defaultCompany"],
    });


    const company = await this.companyRepo.findOne({
      where: { id: integerCompanyId },
    });

    const role = await this.roleRepo.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    const userExistsInCompany = await this.relationsRepo.findOne({
      where: {
        company: { id: integerCompanyId },
        user: { email: email },
      },
      relations: ["user", "company"],
    });

    if (userExistsInCompany) {
      const user = userExistsInCompany.user;

      if (userExistsInCompany.status === "Active") {
        throw new ConflictException("User already active in the company!");
      }

      if (userExistsInCompany.status === "Invitation Sent") {
        await this.magicTokenRepo.update(
          { userId: user.id, used: false }, // invalidate old tokens
          { used: true }
        );

        await this.sendInvitationEmail(
          user.id,
          user.email,
          company!.companyName,
          req
        );

        return {
          change_of_data: {
            invitedByUserId,
            id: user.id,
            username: user.username,
            email: user.email,
            module: "Settings",
            feature: "User Management",
            status: "Re-Invite",
          },
        };
      }
    }

    if (!company) {
      throw new NotFoundException("Company not found");
    }

    if (userExists) {
      const userCompanyRelation = this.relationsRepo.create({
        user: { id: userExists.id },
        company: { id: integerCompanyId },
        status: "Active",
      });

      await this.relationsRepo.save(userCompanyRelation);

      if (!userExists.defaultCompany) {
        userExists.defaultCompany = company;
        console.log("Hello")
        await this.userRepo.save(userExists);
      }

      const userRoleData = this.userRoleRepo.create({
        user: { id: userExists.id },
        role: { id: roleId },
      });
      await this.userRoleRepo.save(userRoleData);

      const userEmailTemplate = this.loadEmailTemplate(
        userExists.displayName,
        company.companyName,
        { loginLink: process.env.FRONTEND_BASE_URL }
      );

      await this.mailerService.sendEmail({
        to: email,
        subject: `You're Invited to "${company.companyName}" on Bsuite`,
        html: userEmailTemplate,
        attachments: null,
      });

      ((userId = userExists.id), (username = userExists.username));
    } else {
      await this.userAbsent(email, integerCompanyId!);

      const newUser = await this.userRepo.findOne({ where: { email } });

      await this.sendInvitationEmail(
        newUser!.id,
        email,
        company.companyName,
        req
      );
      userId = newUser!.id;
      username = newUser!.username;
    }
    return {
      change_of_data: {
        invitedByUserId,
        id: userId,
        username,
        email,
        module: "Settings",
        feature: "User Management",
        status: "Invite",
      },
    };
  }

  async setPassword(
    token: string,
    dto: {
      password: string;
      confirmPassword: string;
    }
  ) {
    const magic = await this.magicTokenRepo.findOne({
      where: { token: token, used: false },
    });

    if (!magic) {
      throw new BadRequestException("Invalid or expired token");
    }

    const user = await this.userRepo.findOne({ where: { id: magic.userId } });

    if (dto.password != dto.confirmPassword) {
      throw new ConflictException("Passwords are different!");
    }

    if (!user) {
      throw new BadRequestException("User not found");
    }

    user.password = await argon2.hash(dto.password);
    user.verified = true;
    await this.userRepo.save(user);

    magic.used = true;
    magic.expiresAt = new Date();
    await this.magicTokenRepo.save(magic);

    await this.userCompanyRelation
      .createQueryBuilder()
      .update(UserCompanyRelation)
      .set({ status: "Active" })
      .where("user_id = :userId", { userId: user.id })
      .andWhere("status = :status", { status: "Invitation Sent" })
      .execute();

    return;
  }

  async verifyMagicLink(token: string) {
    const magic = await this.magicTokenRepo.findOne({
      where: { token, used: false },
    });

    if (!magic || magic.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired link");
    }
    return;
  }

  // custom domain
  async customDomainExists(companyId: string, customName: string) {
    const domain = customName.trim().toLowerCase();

    const company = await this.companyRepo.findOne({
      where: { companyId },
    });
    if (!company) throw new NotFoundException("Company not found");

    const exists = await this.companyRepo.findOne({
      where: {
        customDomain: domain,
      },
    });

    if (exists && exists.companyId !== companyId) {
      return {
        exists: true,
        message: "Domain already mapped to another company.",
      };
    }

    if (company.customDomain === domain) {
      return { noChange: true };
    }

    return { available: true };
  }

  async saveCustomDomain(companyId: string, customDomain: string) {
    const domain = customDomain.trim().toLowerCase();

    const company = await this.companyRepo.findOne({ where: { companyId } });
    if (!company) throw new NotFoundException("Company not found");

    const existing = await this.companyRepo.findOne({
      where: { customDomain: domain },
    });
    if (existing && existing.companyId !== companyId) {
      throw new BadRequestException("Domain already mapped to another company");
    }

    company.customDomain = domain;
    company.domainStatus = DomainStatus.PENDING;

    await this.companyRepo.save(company);

    return {
      type: "CNAME",
      host: domain,
      value: await this.generateCnameTarget(companyId),
    };
  }

  async verifyDomain(companyId: string) {
    const company = await this.companyRepo.findOne({ where: { companyId } });
    if (!company?.customDomain) {
      throw new BadRequestException("Custom domain not set");
    }

    const expectedCname = await this.generateCnameTarget(companyId);

    try {
      const records = await dns.resolveCname(company.customDomain);

      if (!records.includes(expectedCname)) {
        throw new BadRequestException(`CNAME not pointing to ${expectedCname}`);
      }

      company.domainStatus = DomainStatus.DNS_VERIFIED;
      await this.companyRepo.save(company);

      return { verified: true };
    } catch (err) {
      throw new BadRequestException("DNS verification failed");
    }
  }

  async getInvoiceTemplates(dataSource: DataSource) {
    return dataSource.getRepository(InvoiceTemplate).find({
      select: ["id", "templateName", "isDefault"],
    });
  }

  async getInvoiceTemplateById(templateId: number, dataSource: DataSource) {
    const invoiceTemplate = await dataSource
      .getRepository(InvoiceTemplate)
      .findOne({ where: { id: templateId } });
    if (!invoiceTemplate)
      throw new NotFoundException(
        `Invoice Template with id ${templateId} not found`
      );
    return invoiceTemplate;
  }

  async setDefaultTemplate(templateId: number, dataSource: DataSource) {
    const invoiceTemplateRepo = await dataSource.getRepository(InvoiceTemplate);
    const invoiceTemplate = await this.getInvoiceTemplateById(
      templateId,
      dataSource
    );

    await invoiceTemplateRepo.update({ isDefault: true }, { isDefault: false });
    invoiceTemplate.isDefault = true;
    await invoiceTemplateRepo.save(invoiceTemplate);

    return {
      change_of_data: {
        module: "Settings",
        feature: "Invoice PDF Template",
        status: "Default",
        templateId: invoiceTemplate.id,
        templateName: invoiceTemplate.templateName,
      },
    };
  }

  async addInvoiceTemplate(
    dataSource: DataSource,
    invoiceTemplateDto: CreateInvoiceTemplateDto
  ) {
    await this.validateTemplateName(
      dataSource,
      invoiceTemplateDto.templateName
    );
    const invoiceTemplateRepo = dataSource.getRepository(InvoiceTemplate);

    const totalTemplates = await invoiceTemplateRepo.count();
    const isDefault = totalTemplates === 0;

    const template = invoiceTemplateRepo.create({
      templateName: invoiceTemplateDto.templateName,
      header: invoiceTemplateDto.header || {},
      footer: invoiceTemplateDto.footer || {},
      transaction: invoiceTemplateDto.transactionDetails || {},
      table: invoiceTemplateDto.table || {},
      others: {
        total: invoiceTemplateDto.total ?? [],
        showBankDetails:
          invoiceTemplateDto.otherDetails?.showBankDetails ?? false,
        showIdentity: invoiceTemplateDto.otherDetails?.showIdentity ?? false,
      },
      bankDetails: invoiceTemplateDto.otherDetails?.bankDetails ?? null,
      identityDetails: invoiceTemplateDto.otherDetails?.identityFields ?? null,
      isDefault,
    });

    const savedTemplate = await invoiceTemplateRepo.save(template);
    return {
      data: savedTemplate,
      change_of_data: {
        id: savedTemplate.id,
        name: savedTemplate.templateName,
        module: "Settings",
        feature: "Invoice PDF Template",
        status: "Create",
      },
    };
  }

  async updateInvoiceTemplate(
    templateId: number,
    dataSource: DataSource,
    invoiceTemplateDto: UpdateInvoiceTemplateDto
  ) {
    const invoiceTemplateRepo = dataSource.getRepository(InvoiceTemplate);

    const existingTemplate = await this.getInvoiceTemplateById(
      templateId,
      dataSource
    );
    if (
      invoiceTemplateDto.templateName &&
      invoiceTemplateDto.templateName.trim().toLowerCase() !==
      existingTemplate.templateName.toLowerCase()
    ) {
      await this.validateTemplateName(
        dataSource,
        invoiceTemplateDto.templateName,
        templateId
      );
    }

    const updatedTemplate = invoiceTemplateRepo.merge(existingTemplate, {
      ...invoiceTemplateDto,
      templateName: invoiceTemplateDto.templateName?.trim(),
    });

    const savedTemplate = await invoiceTemplateRepo.save(updatedTemplate);
    return {
      data: savedTemplate,
      change_of_data: {
        id: savedTemplate.id,
        name: savedTemplate.templateName,
        module: "Settings",
        feature: "Invoice PDF Template",
        status: "Update",
      },
    };
  }

  async removeInvoiceTemplate(templateId: number, dataSource: DataSource) {
    const invoiceTemplateRepo = dataSource.getRepository(InvoiceTemplate);
    const template = await this.getInvoiceTemplateById(templateId, dataSource);

    if (template.isDefault) {
      throw new BadRequestException("Default template cannot be deleted");
    }

    await invoiceTemplateRepo.remove(template);
    return {
      change_of_data: {
        id: template.id,
        name: template.templateName,
        module: "Settings",
        feature: "Invoice PDF Template",
        status: "Delete",
      },
    };
  }
}
