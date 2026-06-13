import { AccountData } from "src/books/account/entities/tenant.account.entity";
import { Contact } from "src/books/contact/entities/tenant.contact.entity";
import {
  DiscountApplied,
  DiscountType,
  ApplyLevel,
  TdsType,
} from "src/common/enum/transact.enum";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { BillItem } from "./tenant.bill-item.entity";
import { Exclude } from "class-transformer";

@Entity({ name: "biz_books_bill" })
export class Bill {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: "contact_id" })
  contact: Contact;

  @Column({ name: "bill_no", length: 50 })
  billNo: string;

  @Column({ name: "service_start_date", type: "date" })
  serviceStartDate: Date;

  @Column({ name: "service_end_date", type: "date" })
  serviceEndDate: Date;

  @Column({ name: "bill_date", type: "date" })
  billDate: Date;

  @Column({ name: "bill_due_date", type: "date" })
  billDueDate: Date;

  @Column({ name: "bill_currency" })
  billCurrency: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ name: "has_tds", default: true })
  hasTds: boolean;

  @Column({ name: "tds_level", type: "enum", enum: ApplyLevel, nullable: true })
  tdsLevel?: ApplyLevel;

  @Column({
    name: "tds_value",
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  tdsValue?: string;

  @Column({ name: "tds_type", type: "enum", enum: TdsType, nullable: true })
  tdsType?: TdsType;

  @Column({
    name: "discount_applied",
    type: "enum",
    enum: DiscountApplied,
    nullable: true,
  })
  discountApplied?: DiscountApplied;

  @Column({
    name: "discount_value",
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  discountValue?: string;

  @Column({
    name: "discount_type",
    type: "enum",
    enum: DiscountType,
    nullable: true,
  })
  discountType?: DiscountType;

  @ManyToOne(() => AccountData, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "discount_account_id" })
  discountAccount?: AccountData;

  @Column({
    name: "bill_total",
    type: "decimal",
    precision: 18,
    scale: 2,
  })
  billTotal: string;

  @Column({ name: "is_round_off", default: false })
  isRoundOff: boolean;

  @Column({
    name: "roundoff_total",
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  roundoffTotal?: string;

  @Column({ type: "varchar", name: "transaction_type_id", length: 50 })
  transactionTypeId: string;

  @OneToMany(() => BillItem, (item) => item.bill, { cascade: true })
  items: BillItem[];

  @Exclude()
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
