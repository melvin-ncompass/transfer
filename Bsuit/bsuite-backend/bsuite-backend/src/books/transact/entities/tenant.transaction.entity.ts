import { AccountData } from "src/books/account/entities/tenant.account.entity";
import { Contact } from "src/books/contact/entities/tenant.contact.entity";
import { Tax } from "src/books/tax/entities/tenant.tax.entity";
import { UncategorizedData } from "src/books/uncategorized/entities/tenant.uncategorized.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity({ name: "biz_books_transaction" })
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "date" })
  date: Date;

  @Column({ type: "varchar", nullable: true, length: 255 })
  description?: string | null;

  @ManyToOne(() => AccountData, (account) => account.journalEntries, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "account_id" })
  account: AccountData;

  @ManyToOne(() => Contact, (contact) => contact.journalEntries, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "contact_id" })
  contact: Contact;

  @ManyToOne(() => Tax, (tax) => tax.journalEntries, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "tax_id" })
  tax: Tax;

  @Column({ type: "varchar", name: "transaction_type_name", length: 50 })
  transactionTypeName: string;

  @Column({ type: "varchar", name: "transaction_type_id", length: 50 })
  transactionTypeId: string;

  @Column({ type: "varchar", name: "payment_id", length: 50, nullable: true })
  paymentId?: string;

  @Column({
    name: "debit_amount",
    type: "decimal",
    precision: 18,
    scale: 2,
  })
  debitAmount: string;

  @Column({
    name: "credit_amount",
    type: "decimal",
    precision: 18,
    scale: 2,
  })
  creditAmount: string;

  @Column({
    name: "journal_balance",
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  journalBalance: string;

  @Column({
    name: "account_currency",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  accountCurrency?: string;

  @Column({
    name: "account_currency_amount",
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  accountCurrencyAmount?: string;

  @Column({
    name: "account_exchange_rate",
    type: "numeric",
    nullable: true,
  })
  accountExchangeRate?: number;

  @Column({
    name: "account_original_exchange_rate",
    type: "numeric",
    nullable: true,
  })
  accountOriginalExchangeRate?: number;

  @Column({
    name: "counter_currency",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  counterCurrency?: string;

  @Column({
    name: "counter_currency_amount",
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  counterCurrencyAmount?: string;

  @Column({
    name: "counter_exchange_rate",
    type: "numeric",
    nullable: true,
  })
  counterExchangeRate?: number;

  @Column({
    name: "counter_original_exchange_rate",
    type: "numeric",
    nullable: true,
  })
  counterOriginalExchangeRate?: number;

  @Column({ type: "boolean", name: "has_contact_mapping", default: false })
  hasContactMapping: boolean;

  // JSON field
  @Column({ type: "json", name: "contact_mapping", nullable: true })
  contactMapping?: object;

  // FK to UncategorizedData
  @ManyToOne(() => UncategorizedData, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "uncategorized_id" })
  uncategorized?: UncategorizedData;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
