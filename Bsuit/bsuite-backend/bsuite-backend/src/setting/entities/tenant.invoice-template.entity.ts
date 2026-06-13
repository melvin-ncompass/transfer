import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "biz_books_invoice_template" })
export class InvoiceTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "template_name", length: 255 })
  templateName: string;

  @Column({ type: "jsonb" })
  header: any;

  @Column({ type: "jsonb" })
  footer: any;

  @Column({ type: "jsonb" })
  transaction: any;

  @Column({ type: "jsonb" })
  table: any;

  @Column({ type: "jsonb" })
  others: any;

  @Column({ name: "is_default", default: false })
  isDefault: boolean;

  @Column({ name: "bank_details", type: "jsonb", nullable: true })
  bankDetails: any;

  @Column({ name: 'identity_details', type: 'jsonb', nullable: true })
  identityDetails: any;
}
