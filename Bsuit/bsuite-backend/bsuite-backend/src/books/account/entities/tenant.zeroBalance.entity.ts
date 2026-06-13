import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Column,
} from "typeorm";

@Entity({ name: "biz_books_zero_balance" })
export class ZeroBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", name: "user_id" })
  userId: number;

  @Column({ type: "boolean", name: "report_zero_balance", default: true })
  reportZeroBalance: boolean;

  @Column({ type: "boolean", name: "account_zero_balance", default: true })
  accountZeroBalance: boolean;

  @Column({ type: "boolean", name: "report_decimal_place", default: true })
  reportDecimalPlace: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
