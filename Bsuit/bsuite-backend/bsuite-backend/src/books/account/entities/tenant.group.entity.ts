import { Exclude } from 'class-transformer';
import { AccountType } from 'src/common/enum/account-type.enum';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity("biz_books_group_data")
@Unique(["groupName", "groupType"])
export class GroupData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "group_name", length: 255 })
  groupName: string;

  @Column({
    name: "group_type",
    type: "enum",
    enum: AccountType,
    default: AccountType.ASSET,
  })
  groupType: AccountType;

  @Exclude()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @Exclude()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
