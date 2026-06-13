import { IsIn } from "class-validator";
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import countries from "i18n-iso-countries";
import { Exclude } from "class-transformer";
const countryCodes = Object.keys(countries.getAlpha2Codes());

@Entity({ name: "biz_company_identity" })
export class CompanyIdentity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "address_line_1", length: 255, nullable: true })
  addressLine1: string;

  @Column({ name: "address_line_2", length: 255, nullable: true })
  addressLine2: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 50, nullable: true })
  state: string;

  @Column({ length: 15, nullable: true })
  pincode: string;

  @Column({ length: 200, nullable: true })
  @IsIn(countryCodes, { message: "Invalid country code" })
  country: string;

  @Exclude()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @Exclude()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

}


@Entity({ name: "biz_company_metadata" })
export class CompanyMetaData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  label: string;

  @Column({ nullable: true })
  value: string;

  @Exclude()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @Exclude()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}



