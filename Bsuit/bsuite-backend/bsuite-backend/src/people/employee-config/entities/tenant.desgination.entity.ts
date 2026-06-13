import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "biz_people_designation" })
export class Designation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, name: "designation_name" })
  designationName: string;
}
