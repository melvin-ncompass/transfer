import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'biz_books_attachment' })
@Unique(["transactionTypeName", "transactionTypeId","paymentId"])
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', name: 'transaction_type_name', length: 50 })
  transactionTypeName: string;

  @Column({ type: 'varchar', name: 'transaction_type_id', length: 50 })
  transactionTypeId: string;

  @Column({ type: 'varchar', name: 'payment_id', length: 50, nullable: true })
  paymentId: string;

  @Column({ name: "attachments", type: "json"})
  attachments: Array<{
    filename: string;
    path: string;
  }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
