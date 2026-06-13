import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as path from "path";
import { InvoiceTemplate } from "src/setting/entities/tenant.invoice-template.entity";
import { CompanySetting } from "src/setting/entities/tenant.company-setting.entity";
import { CompanyIdentity, CompanyMetaData } from "src/setting/entities/tenant.company-identity.entity";
import { Reminders } from "src/reminder/entities/reminder.entity";
const config = new ConfigService();

const DemoTenantDataSource = new DataSource({
  type: "postgres",
  host: config.get<string>("DB_HOST"),
  port: config.get<number>("DB_PORT"),
  username: config.get<string>("DB_USERNAME"),
  password: config.get<string>("DB_PASSWORD"),
  database: config.get<string>("DEMO"),
  entities: [
    path.join(
      __dirname,
      "..",
      "..",
      'books',
      '**',
      "entities",
      "tenant*.entity.{ts,js}"
    ),
    path.join(
      __dirname,
      "..",
      "..",
      'people',
      '**',
      "entities",
      "tenant*.entity.{ts,js}"
    ),
    CompanySetting,
    CompanyIdentity,
    CompanyMetaData,
    InvoiceTemplate,
    Reminders
  ],
  migrations: [
    path.join(__dirname, "..", "company-migration-scripts", "*.{ts,js}"),
  ],
  synchronize: false,
});

export default DemoTenantDataSource;
