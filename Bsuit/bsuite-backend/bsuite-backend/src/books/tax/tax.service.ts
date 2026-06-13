import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { DataSource, ILike, Repository } from "typeorm";
import { Tax } from "./entities/tenant.tax.entity";
import { CreateTaxDto } from "./dto/create-tax.dto";
import { UpdateTaxDto } from "./dto/update-tax.dto";
import * as ExcelJS from "exceljs";
import { InjectRepository } from "@nestjs/typeorm";
import { Company } from "src/company/entities/company.entity";
import { generateExcel } from "src/shared/utils";
import { ZeroBalance } from "../account/entities/tenant.zeroBalance.entity";

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>
  ) { }

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

  private async findOne(dataSource: DataSource, taxId: number) {
    const repository = dataSource.getRepository(Tax);
    const tax = await repository.findOne({ where: { id: taxId } });
    if (!tax)
      throw new NotFoundException(`Tax record with taxId '${taxId}' not found`);
    return tax;
  }

  async create(dataSource: DataSource, taxDto: CreateTaxDto) {
    const repository = dataSource.getRepository(Tax);
    const exists = await repository.findOne({
      where: { taxName: ILike(taxDto.taxName) },
    });
    if (exists) {
      throw new ConflictException(
        `Tax with name "${taxDto.taxName}" already exists.`
      );
    }

    const tax = repository.create(taxDto);
    const saved = await repository.save(tax);

    return {
      data: saved,
      change_of_data: {
        id: saved.id,
        name: saved.taxName,
        module: "COA",
        feature: "Tax",
        status: "Create",
      },
    };
  }

  async findAll(dataSource: DataSource) {
    const repository = dataSource.getRepository(Tax);

    const taxes = await repository.find();
    return taxes.map((tax) => ({
      ...tax,
      default: tax.taxName === "TDS",
    }));
  }

  async update(dataSource: DataSource, taxId: number, taxDto: UpdateTaxDto) {
    const repository = dataSource.getRepository(Tax);

    const previousTax = await this.findOne(dataSource, taxId);

    if (taxDto.taxName) {
      const exists = await repository.findOne({
        where: { taxName: ILike(taxDto.taxName) },
      });
      if (exists && exists.id !== taxId) {
        throw new ConflictException(
          `Tax with name "${taxDto.taxName}" already exists.`
        );
      }
    }

    Object.assign(previousTax, taxDto);
    const updated = await repository.save(previousTax);

    return {
      data: updated,
      change_of_data: {
        id: previousTax.id,
        name: previousTax.taxName,
        module: "COA",
        feature: "Tax",
        status: "Update",
      },
    };
  }

  async remove(dataSource: DataSource, taxId: number) {
    const repository = dataSource.getRepository(Tax);

    const tax = await this.findOne(dataSource, taxId);
    await repository.remove(tax);

    return {
      change_of_data: {
        id: tax.id,
        name: tax.taxName,
        module: "COA",
        feature: "Tax",
        status: "Delete",
      },
    };
  }

  async taxCount(dataSource: DataSource) {
    const repository = dataSource.getRepository(Tax);
    return repository.count();
  }

  async generateTax(dataSource: DataSource, companyId: string, userId: number) {

    const repository = dataSource.getRepository(Tax);
    const data = await repository.find();
    const workbook = new ExcelJS.Workbook();
    const companyName = await this.getCompanyName(companyId)
    const date = new Date().toISOString()
    const fileName = `Tax_${companyName}_${date}`
    const headerText = `
      Tax\n
      ${companyName}`

    const title = ["taxName", "abbreviation", "taxRate", "description", "taxNumber", "taxBalance"];
    const header = ["Name", "Abbreviation", "Rate", "Description", "Number", "Balance"]

    const showZeroBalance = await this.getZeroBalance(dataSource, userId)

    await generateExcel(workbook, data, headerText, "Tax", title, header, showZeroBalance!)

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return {
      buffer,
      fileName,
      change_of_data: {
        module: "COA",
        feature: "Tax",
        status: "Export",
      },
    };
  }
}
