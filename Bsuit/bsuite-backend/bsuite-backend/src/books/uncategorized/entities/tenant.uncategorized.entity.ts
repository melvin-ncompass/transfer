import { AccountData } from "src/books/account/entities/tenant.account.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("biz_books_uncategorized_data")
export class UncategorizedData {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AccountData, { nullable: true })
  @JoinColumn({ name: "account" })
  account: AccountData;

  @Column({ type: "date" })
  date: Date;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "float", nullable: true })
  credit: number;

  @Column({ type: "float", nullable: true })
  debit: number;

  @Column({ type: "boolean", default: false })
  isCategorized: boolean;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updatedAt: Date;
}
