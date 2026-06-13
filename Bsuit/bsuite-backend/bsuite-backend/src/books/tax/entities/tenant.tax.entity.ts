import { Exclude } from "class-transformer";
import { Transaction } from "src/books/transact/entities/tenant.transaction.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

@Entity({ name: "biz_books_tax_data" })
export class Tax {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "tax_name", length: 100 })
  taxName: string;

  @Column({ length: 50 })
  abbreviation: string;

  @Column({ name: "tax_rate", type: "float" })
  taxRate: number;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ name: "tax_number", type: "bigint", nullable: true })
  taxNumber: number;

  @Exclude()
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => Transaction, (entry) => entry.account)
  journalEntries: Transaction[];

  @Column({
    name: "tax_balance",
    type: "decimal",
    precision: 18,
    scale: 2,
    default: 0,
    nullable: true,
  })
  taxBalance: string;
}
