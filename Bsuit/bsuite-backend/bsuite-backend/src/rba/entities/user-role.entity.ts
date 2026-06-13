import { Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Role } from "./role.entity";
import { User } from "src/auth/entities/user.entity";
import { Exclude } from "class-transformer";

@Entity({ name: "user_roles" })
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Role, { onDelete: "CASCADE" })
  @JoinColumn({ name: "role_id" })
  role: Role;

  @Exclude()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @Exclude()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
