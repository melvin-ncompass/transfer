import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";
import { Company } from "src/company/entities/company.entity";
import { Permission } from "./permission.entity";
import { Exclude } from "class-transformer";

@Entity({ name: "roles" })
@Unique(["roleName", "company"])
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "role_name", length: 100 })
  roleName: string;

  @Column({ length: 400, nullable: true })
  description: string;

  @ManyToOne(() => Company, (company) => company.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "company_id" })
  company: Company;

  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: "role_permissions",
    joinColumn: { name: "role_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" }
  })
  permissions: Permission[];

  @Exclude()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @Exclude()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
