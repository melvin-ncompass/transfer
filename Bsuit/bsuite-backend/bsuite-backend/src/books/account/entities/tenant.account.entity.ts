import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { GroupData } from "./tenant.group.entity";
import { CurrencyEnum } from "src/common/enum/currency.enum";
import { AccountType } from "src/common/enum/account-type.enum";
import { Exclude } from "class-transformer";
import { Transaction } from "src/books/transact/entities/tenant.transaction.entity";

@Entity("biz_books_account_data")
@Unique(["accountName", "accountType"])
export class AccountData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "account_name", length: 255 })
  accountName: string;

  @Column({ name: "account_code", length: 100, nullable: true })
  accountCode?: string;

  @Column({
    name: "account_type",
    type: "enum",
    enum: AccountType,
    default: AccountType.ASSET,
  })
  accountType: AccountType;

  @Column({ name: "account_currency", type: "enum", enum: CurrencyEnum })
  accountCurrency: string;

  @Column({
    name: "account_balance",
    type: "decimal",
    precision: 18,
    scale: 2,
    default: 0,
    nullable: true,
  })
  accountBalance: string;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @ManyToOne(() => AccountData, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "parent_account_id" })
  parentAccount?: AccountData;

  @Column({ name: "is_archived", default: false })
  isArchived: boolean;

  @Column({ name: "show_in_reports", default: false })
  showInReports: boolean;

  @ManyToOne(() => GroupData, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "group_id" })
  group?: GroupData;

  @Column({ nullable: true, type: "bigint" })
  position: number | null;

  @OneToMany(() => Transaction, (entry) => entry.account)
  journalEntries: Transaction[];

  @Exclude()
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
