import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { Department } from "./tenant.deparment.entity";

@Entity({ name: "biz_people_sub_department" })
export class SubDepartment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, name: "sub_department_name" })
  subDepartmentName: string;

  @JoinColumn({ name: "department" })
  @ManyToOne(() => Department, { onDelete: "RESTRICT" })
  department: Department;
}
