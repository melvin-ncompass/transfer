import { EconomicTerritory } from "src/common/enum/economic-territory";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { IsIn } from "class-validator";
import countries from "i18n-iso-countries";
import { Exclude } from "class-transformer";
import { Transaction } from "src/books/transact/entities/tenant.transaction.entity";

const countryCodes = Object.keys(countries.getAlpha2Codes());
@Entity({ name: "biz_books_contact_data" })
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true, name: 'middle_name' })
  middleName: string;

  @Column({ length: 255, nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ length: 50, nullable: true, name: 'phone_number' })
  phoneNumber: string;

  @Column({ length: 50, nullable: true, name: 'dial_code' })
  dialCode: string;

  @Column({ length: 255, nullable: true, name: 'address_line1' })
  addressLine1: string;

  @Column({ length: 255, nullable: true, name: 'address_line2' })
  addressLine2: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 50, nullable: true })
  state: string;

  @Column({ length: 15, nullable: true })
  pincode: string;

  @Column({ length: 200, nullable: true })
  @IsIn(countryCodes, { message: "Invalid country code" })
  country: string;

  @Column({
    name: "contact_balance",
    type: "decimal",
    precision: 18,
    scale: 2,
    default: 0,
    nullable: true,
  })
  contactBalance: string;

  @Column({ default: false, name: 'is_archived' })
  isArchived: boolean;

  @Column({ default: false, name: 'show_in_reports' })
  showInReports: boolean;

  @Column({ length: 15, nullable: true })
  gstin: string;

  @Column({ default: false, name: 'is_organization' })
  isOrganization: boolean;

  @Column({ length: 5, nullable: true, name: 'economic_territory' })
  economicTerritory: EconomicTerritory;

  @Column({ length: 10, nullable: true })
  pan: string;

  @Column({ type: "float", nullable: true, name: 'tds_prefill_value' })
  tdsPrefillValue: number;

  @Column({ nullable: true, type: 'bigint' })
  position: number | null;

  @OneToMany(() => Transaction, (entry) => entry.account)
  journalEntries: Transaction[];

  @Exclude()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @Exclude()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}