import { AccountData } from "src/books/account/entities/tenant.account.entity";
import { TdsType } from "src/common/enum/transact.enum";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { Bill } from "./tenant.bill.entity";
import { Transaction } from "src/books/transact/entities/tenant.transaction.entity";

@Entity({ name: "biz_books_bill_item" })
export class BillItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Bill, (bill) => bill.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "bill_id" })
  bill: Bill;

  @Column({ name: "item_name" })
  itemName: string;

  @ManyToOne(() => AccountData, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "item_account" })
  itemAccount: AccountData;

  @Column({ name: "hsn_sac", nullable: true })
  hsnSac?: string;

  @Column({
    type: "decimal",
    precision: 18,
    scale: 2,
  })
  quantity: string;

  @Column({
    name: "unit_price",
    type: "decimal",
    precision: 18,
    scale: 2,
  })
  unitPrice: string;

  @Column({
    name: "item_total",
    type: "decimal",
    precision: 18,
    scale: 2,
  })
  itemTotal: string;

  @Column({
    name: "item_tds_value",
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  itemTdsValue: string;

  @Column({
    name: "item_tds_type",
    type: "enum",
    enum: TdsType,
    nullable: true,
  })
  itemTdsType?: TdsType;

  @Column({ name: "item_tax", type: "json", nullable: true })
  itemTax?: Array<{
    taxId: number;
    isOverride: boolean;
    type: string;
    value: number;
  }>;

  @OneToOne(() => Transaction)
  @JoinColumn({ name: "transaction_id" })
  transaction: Transaction;
}
