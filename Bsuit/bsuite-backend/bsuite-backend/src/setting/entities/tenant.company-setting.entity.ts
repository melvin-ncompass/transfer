import { CurrencyEnum } from "src/common/enum/currency.enum";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum CommaSeparation {
  US = "US",
  IN = "IN",
}

export enum Month {
  JANUARY = 'January',
  FEBRUARY = 'February',
  MARCH = 'March',
  APRIL = 'April',
  MAY = 'May',


  
  JUNE = 'June',
  JULY = 'July',
  AUGUST = 'August',
  SEPTEMBER = 'September',
  OCTOBER = 'October',
  NOVEMBER = 'November',
  DECEMBER = 'December',
}

@Entity({ name: "biz_company_setting" })
export class CompanySetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "company_id" })
  companyId: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @Column({
    name: "comma_separation",
    type: "enum",
    enum: CommaSeparation,
    default: CommaSeparation.IN,
  })
  commaSeparation: CommaSeparation;

  @Column({ name: "reporting_currency", type: "enum", enum: CurrencyEnum })
  reportingCurrency: string;

  @Column({ name: "custom_domain", nullable: true })
  customDomain: string;

  @Column({
    name: "is_people_enabled",
    type: "boolean",
    default: false,
    nullable: true,
  })
  isPeopleEnabled: boolean | null;

  @Column({ type: "varchar", nullable: true })
  logo: string;

  @Column({ name: "header_image", type: "varchar", nullable: true })
  headerImage: string;

  @Column({ name: "fiscal_year_start_date", type: "integer", nullable: true, default: 1 })
  fiscalYearStartDate: number;

  @Column({ name: "fiscal_year_start_month", type: "varchar", length: 20, nullable: true, default: 'January' })
  fiscalYearStartMonth: string

  @Column({ name: "fiscal_year_end_date", type: "integer", nullable: true, default: 31 })
  fiscalYearEndDate: number;

  @Column({ name: "fiscal_year_end_month", type: "varchar", length: 20, nullable: true, default: 'December' })
  fiscalYearEndMonth: string;

  @Column({ name: "enable_fx_correction", type: "boolean", nullable: true, default: true })
  enableFxCorrection: boolean;

  @Column({ name: "is_company_name", type: "boolean", nullable: true, default: true })
  isCompanyName: boolean;

  @Column({ name: "is_header_image", type: "boolean", nullable: true, default: true })
  isHeaderImage: boolean;

  @Column({ name: "is_page_number", type: "boolean", nullable: true, default: true })
  isPageNumber: boolean;

  @Column({ name: "is_generated_by", type: "boolean", nullable: true, default: true })
  isGeneratedBy: boolean;

  @Column({ name: "is_generated_date", type: "boolean", nullable: true, default: true })
  isGeneratedDate: boolean;

  @Column({ name: "is_generated_time", type: "boolean", nullable: true, default: true })
  isGeneratedTime: boolean;

  @Column({ name: "footer_content", type: "text", nullable: true })
  footerContent: string | null;
}
