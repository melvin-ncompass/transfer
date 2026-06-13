import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from "src/auth/entities/user.entity";
import { Company } from "./company.entity";

@Entity({name:"sys_user_company_relation"})
export class UserCompanyRelation {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userCompanyRelation, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Company, { onDelete: "CASCADE" })
  @JoinColumn({ name: "company_id" })
  company: Company;

  @Column({
    type: "enum",
    enum: ["Active", "Invitation Sent", "Owner"],
  })
  status: "Active" | "Invitation Sent" | "Owner";

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
