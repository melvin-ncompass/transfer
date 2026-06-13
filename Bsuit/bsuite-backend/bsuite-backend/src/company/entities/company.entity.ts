import { UserCompanyRelation } from "src/company/entities/user-company-relation.entity";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

export enum DomainStatus {
  PENDING = "PENDING",
  DNS_VERIFIED = "DNS_VERIFIED",
  SSL_ISSUED = "SSL_ISSUED",
  ACTIVE = "ACTIVE",
  FAILED = "FAILED",
}

@Entity({ name: "sys_company" })
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "company_name" })
  companyName: string;

  @Column({ name: "company_id" })
  companyId: string;

  @Column({ name: "company_short_name" })
  companyShortName: string;

  @OneToMany(() => UserCompanyRelation, (relation) => relation.company)
  userCompanyRelations: UserCompanyRelation[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @Column({ name: "product_domain", nullable: true })
  productDomain: string;

  @Column({ name: "custom_domain", nullable: true })
  customDomain: string;

  @Column({name: "domain_status",nullable: true})
  domainStatus : DomainStatus
}
