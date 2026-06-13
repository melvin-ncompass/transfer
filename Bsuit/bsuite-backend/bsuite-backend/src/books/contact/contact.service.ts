import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from "@nestjs/common";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { Contact } from "./entities/tenant.contact.entity";
import { DataSource, ILike, Repository } from "typeorm";
import * as path from "path";
import * as fs from "fs";
import { ContactCsvMappingDto } from "./dto/contact-csv-mapping.dto";
import Papa from "papaparse";
import { validate } from "class-validator";
import { EconomicTerritory } from "src/common/enum/economic-territory";
import { AccountData } from "../account/entities/tenant.account.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Company } from "src/company/entities/company.entity";
import * as ExcelJS from "exceljs";
import { generateExcel, getTemplatePath } from "src/shared/utils";
import { ZeroBalance } from "../account/entities/tenant.zeroBalance.entity";

@Injectable()
export class ContactService {
  constructor(
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

  async create(createContactDto: CreateContactDto, dataSource: DataSource) {
    const contactRepo = dataSource.getRepository(Contact);
    const existingName = await contactRepo.findOne({
      where: { name: ILike(createContactDto.name) },
    });
    if (existingName) {
      throw new BadRequestException("Contact name already exists");
    }

    if (createContactDto.email) {
      const existingEmail = await contactRepo.findOne({
        where: { email: ILike(createContactDto.email) },
      });
      if (existingEmail) {
        throw new BadRequestException("Email already exists");
      }
    }
    const saved = await contactRepo.save(createContactDto);

    return {
      data: saved,
      change_of_data: {
        id: saved.id,
        name: saved.name,
        module: "COA",
        feature: "Contact",
        status: "Create",
      },
    };
  }

  async update(
    contactId: number,
    updateContactDto: UpdateContactDto,
    dataSource: DataSource,
  ) {
    const contactRepo = dataSource.getRepository(Contact);
    const contact = await this.findContactById(contactId, dataSource);

    if (updateContactDto.name && updateContactDto.name !== contact.name) {
      const nameExists = await contactRepo.findOne({
        where: { name: ILike(updateContactDto.name) },
      });
      if (nameExists)
        throw new BadRequestException("Contact name already exists");
    }

    if (updateContactDto.email && updateContactDto.email !== contact.email) {
      const emailExists = await contactRepo.findOne({
        where: { email: ILike(updateContactDto.email) },
      });
      if (emailExists) throw new BadRequestException("Email already exists");
    }

    Object.assign(contact, updateContactDto);
    const updated = await contactRepo.save(contact);

    return {
      data: updated,
      change_of_data: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        module: "COA",
        feature: "Contact",
        status: "Update",
      },
    };
  }

  async remove(contactId: number, dataSource: DataSource) {
    const contactRepo = dataSource.getRepository(Contact);
    const contact = await this.findContactById(contactId, dataSource);

    await contactRepo.remove(contact);
    await this.recalculatePositions(dataSource);

    return {
      change_of_data: {
        name: contact.name,
        module: "COA",
        feature: "Contact",
        status: "Delete",
      },
    };
  }

  async findAllContacts(dataSource: DataSource, unArchivedOnly?: string) {
    const where: any = {};
    if (unArchivedOnly) {
      where.isArchived = false;
    }
    return await dataSource
      .getRepository(Contact)
      .find({ where, order: { name: "ASC" } });
  }

  async findContactById(contactId: number, dataSource: DataSource) {
    if (!contactId) throw new NotFoundException(`Contact ID not found`);
    const contact = await dataSource
      .getRepository(Contact)
      .findOne({ where: { id: contactId } });
    if (!contact)
      throw new NotFoundException(`Contact with ID ${contactId} not found`);
    return contact;
  }

  getCsvStream(): StreamableFile {
    const filePath = path.resolve(getTemplatePath("sample-contact.csv"));

    if (!fs.existsSync(filePath)) {
      throw new Error("CSV file not found.");
    }

    const fileStream = fs.createReadStream(filePath);
    return new StreamableFile(fileStream);
  }

  async processContactCsvFile(buffer: Buffer, mapping: ContactCsvMappingDto) {
    const csv = buffer.toString("utf-8");
    const { data: rows, errors: parseErrors } = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
    });
    if (parseErrors.length > 0)
      throw new BadRequestException("Error parsing CSV.");

    const results: any[] = [];
    const nameTracker = new Set<string>();
    const emailTracker = new Set<string>();

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 2;
      const rowResult: any = { rowNumber, data: {} };

      const dtoData: any = {};
      for (const key of Object.keys(mapping)) {
        const column = mapping[key];
        const raw = column ? row[column] : "";
        const value = typeof raw === "string" ? raw.trim() : raw;
        dtoData[key] = value === "" ? undefined : value;
      }

      const contactDto = new CreateContactDto();
      Object.assign(contactDto, dtoData);

      const errors = await validate(contactDto, {
        skipMissingProperties: true,
      });
      if (errors.length > 0) {
        rowResult.hasError = true;
        for (const err of errors) {
          const property = err.property;
          rowResult.data[property] = {
            value: dtoData[property],
            error: Object.values(err.constraints || {}).join(", "),
          };
        }
      }

      if (contactDto.name) {
        const nameKey = contactDto.name.toLowerCase();
        if (nameTracker.has(nameKey)) {
          rowResult.hasError = true;
          rowResult.data["name"] = {
            value: contactDto.name,
            error: "Duplicate name is not allowed.",
          };
        } else {
          nameTracker.add(nameKey);
        }
      }

      if (contactDto.email) {
        const emailKey = contactDto.email.toLowerCase();
        if (emailTracker.has(emailKey)) {
          rowResult.hasError = true;
          rowResult.data["email"] = {
            value: contactDto.email,
            error: rowResult.data["email"]?.error
              ? `${rowResult.data["email"].error}, Duplicate email is not allowed.`
              : "Duplicate email is not allowed.",
          };
        } else {
          emailTracker.add(emailKey);
        }
      }

      for (const field of Object.keys(dtoData)) {
        if (!rowResult.data[field])
          rowResult.data[field] = { value: dtoData[field] ?? "", error: "" };
      }

      results.push(rowResult);
    }

    return results;
  }

  async createContacts(rows: ContactCsvMappingDto[], dataSource: DataSource) {
    return dataSource.transaction(async (manager) => {
      const contactRepo = manager.getRepository(Contact);
      const duplicates: any[] = [];
      const createdContacts: Contact[] = [];
      const errors: any[] = [];

      for (const row of rows) {
        const rowResult: any = { data: {}, hasError: false };

        const exists = await contactRepo.findOne({
          where: { name: ILike(row.name) },
        });

        const dto = new CreateContactDto();
        const dtoData: any = {};

        for (const key of Object.keys(row)) {
          let value = row[key];
          if (key === "isOrganization")
            value = value === "true" || value === true;
          if (key === "tdsPrefillValue")
            value =
              value !== "" && value !== undefined ? Number(value) : undefined;
          if (typeof value === "string") value = value.trim();
          dtoData[key] = value;
          rowResult.data[key] = { value, error: "" };
        }

        Object.assign(dto, dtoData);
        const validation = await validate(dto, { skipMissingProperties: true });

        if (validation.length > 0) {
          rowResult.hasError = true;
          for (const err of validation) {
            const property = err.property;
            if (!rowResult.data[property])
              rowResult.data[property] = {
                value: dtoData[property],
                error: "",
              };
            rowResult.data[property].error = Object.values(
              err.constraints ?? {},
            ).join(", ");
          }
          errors.push(rowResult);
          continue;
        }

        if (exists) {
          rowResult.hasError = true;
          for (const key of Object.keys(row)) {
            rowResult.data[key] = {
              value: row[key],
              error: key === "name" ? "Duplicate name not allowed" : "",
            };
          }
          duplicates.push(rowResult);
          continue;
        }

        if (row.email) {
          const emailExists = await contactRepo.findOne({
            where: { email: ILike(row.email) },
          });
          if (emailExists) {
            rowResult.hasError = true;
            for (const key of Object.keys(row)) {
              rowResult.data[key] = {
                value: row[key],
                error:
                  key === "email" ? `Email "${row.email}" already exists` : "",
              };
            }
            errors.push(rowResult);
            continue;
          }
        }

        try {
          const created = await contactRepo.save(dto);
          createdContacts.push(created);
        } catch (e) {
          rowResult.hasError = true;
          rowResult.data["general"] = { value: "", error: e.message };
          errors.push(rowResult);
        }
      }

      return {
        message: "Contacts created successfully",
        createdContacts: createdContacts.length,
        duplicates,
        errors,
      };
    });
  }

  async updateDuplicateContacts(
    rows: ContactCsvMappingDto[],
    dataSource: DataSource,
  ) {
    return dataSource.transaction(async (manager) => {
      const contactRepo = manager.getRepository(Contact);

      const updatedContacts: Contact[] = [];
      const duplicates: any[] = [];
      const errors: any[] = [];

      for (const row of rows) {
        const existsByName = await contactRepo.findOne({
          where: { name: ILike(row.name) },
        });

        if (existsByName) {
          duplicates.push({
            name: row.name,
            middleName: row.middleName ?? "",
            lastName: row.lastName ?? "",
            dialCode: row.dialCode ?? "",
            email: row.email ?? "",
            phoneNumber: row.phoneNumber ?? "",
            addressLine1: row.addressLine1 ?? "",
            addressLine2: row.addressLine2 ?? "",
            city: row.city ?? "",
            state: row.state ?? "",
            pincode: row.pincode ?? "",
            country: row.country ?? "",
            pan: row.pan ?? "",
            gstin: row.gstin ?? "",
            isOrganization: row.isOrganization ?? "",
            economicTerritory: row.economicTerritory ?? "",
            tdsPrefillValue: row.tdsPrefillValue ?? "",
          });

          existsByName.middleName = row.middleName ?? existsByName.middleName;
          existsByName.lastName = row.lastName ?? existsByName.lastName;
          existsByName.dialCode = row.dialCode ?? existsByName.dialCode;
          existsByName.email = row.email ?? existsByName.email;
          existsByName.phoneNumber =
            row.phoneNumber ?? existsByName.phoneNumber;
          existsByName.addressLine1 =
            row.addressLine1 ?? existsByName.addressLine1;
          existsByName.addressLine2 =
            row.addressLine2 ?? existsByName.addressLine2;
          existsByName.city = row.city ?? existsByName.city;
          existsByName.state = row.state ?? existsByName.state;
          existsByName.pincode = row.pincode ?? existsByName.pincode;
          existsByName.country = row.country ?? existsByName.country;
          existsByName.pan = row.pan ?? existsByName.pan;
          existsByName.gstin = row.gstin ?? existsByName.gstin;

          existsByName.isOrganization =
            row.isOrganization === "true"
              ? true
              : row.isOrganization === "false"
                ? false
                : existsByName.isOrganization;

          if (
            row.economicTerritory &&
            Object.values(EconomicTerritory).includes(
              row.economicTerritory as EconomicTerritory,
            )
          ) {
            existsByName.economicTerritory =
              row.economicTerritory as EconomicTerritory;
          }

          if (
            typeof row.tdsPrefillValue === "number" &&
            row.tdsPrefillValue >= 0 &&
            row.tdsPrefillValue <= 100
          ) {
            existsByName.tdsPrefillValue = row.tdsPrefillValue;
          }

          try {
            const updated = await contactRepo.save(existsByName);
            updatedContacts.push(updated);
            continue;
          } catch (e) {
            errors.push({ row, error: e.message });
          }
        }

        if (row.email) {
          const existsByEmail = await contactRepo.findOne({
            where: { email: ILike(row.email) },
          });

          if (existsByEmail) {
            errors.push({
              row,
              error: `Duplicate email found: ${row.email}. Record was not overridden.`,
            });
            continue;
          }
        }

        const dto = new CreateContactDto();
        Object.assign(dto, row);

        const validation = await validate(dto);
        if (validation.length > 0) {
          errors.push({
            row,
            error: validation
              .map((e) => Object.values(e.constraints ?? {}))
              .join(", "),
          });
          continue;
        }

        try {
          const created = await contactRepo.save(dto);
          updatedContacts.push(created);
        } catch (e) {
          errors.push({ row, error: e.message });
        }
      }

      return {
        message: "Contacts updated/created successfully",
        data: {
          updatedContacts: updatedContacts.length,
          duplicates,
          errors,
        },
      };
    });
  }

  async archive(dataSource: DataSource, contactId: number) {
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const contactRepo = dataSource.getRepository(Contact);
      const contact = await contactRepo.findOne({ where: { id: contactId } });

      if (!contact) throw new NotFoundException("Contact Does Not Exist");

      contact.isArchived = !contact.isArchived;
      await contactRepo.save(contact);

      await queryRunner.commitTransaction();
      return {
        data: contact,
        change_of_data: {
          id: contact.id,
          archived: contact.isArchived,
          module: "COA",
          feature: "Contact",
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

  async toggleReports(dataSource: DataSource, contactId: number) {
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const contactRepo = dataSource.getRepository(Contact);
      let contact = await contactRepo.findOne({ where: { id: contactId } });

      if (!contact) throw new NotFoundException("Contact Does Not Exist");

      contact.showInReports = !contact.showInReports;

      if (contact.showInReports) {
        const accountRepo = dataSource.getRepository(AccountData);
        const activeAccounts = await accountRepo.find({
          where: { showInReports: true },
        });
        const activeContacts = await contactRepo.find({
          where: { showInReports: true },
        });

        contact.position = activeAccounts.length + activeContacts.length + 1;
        await contactRepo.save(contact);
      } else {
        await contactRepo.save(contact);
        await this.recalculatePositions(dataSource);
      }

      await queryRunner.commitTransaction();
      return contact;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async generateContact(
    dataSource: DataSource,
    companyId: string,
    userId: number,
  ) {
    const repository = dataSource.getRepository(Contact);
    const data = await repository.find();
    const workbook = new ExcelJS.Workbook();
    const companyName = await this.getCompanyName(companyId);
    const date = new Date().toISOString();
    const fileName = `Contact_${companyName}_${date}`;
    const headerText = `
      Contact\n
      ${companyName}`;

    const title = [
      "name",
      "middleName",
      "lastName",
      "email",
      "phoneNumber",
      "dialCode",
      "addressLine1",
      "addressLine2",
      "city",
      "state",
      "pincode",
      "country",
      "contactBalance",
      "isArchived",
      "gstin",
      "isOrganization",
      "economicTerritory",
      "pan",
      "tdsPrefillValue",
      "reports",
    ];
    const header = [
      "Name",
      "Middle Name",
      "Last Name",
      "Email",
      "Phone Number",
      "Dial Code",
      "Address Line 1",
      "Address Line 2",
      "City",
      "State",
      "Pin Code",
      "Country",
      "Contact Balance",
      "Is Archived",
      "GSTIN",
      "Is Organization",
      "Economic Territory",
      "PAN",
      "TDS Prefill Value",
      "Reports",
    ];

    const showZeroBalance = await this.getZeroBalance(dataSource, userId);

    await generateExcel(
      workbook,
      data,
      headerText,
      "Contact",
      title,
      header,
      showZeroBalance!,
    );

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return {
      buffer,
      fileName,
      change_of_data: {
        module: "COA",
        feature: "Contact",
        status: "Export",
      },
    };
  }
}
