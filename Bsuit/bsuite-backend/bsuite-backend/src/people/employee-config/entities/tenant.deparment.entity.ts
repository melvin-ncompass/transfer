import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "biz_people_department" })
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, name: "deparment_name" })
  departmentName: string;
}
