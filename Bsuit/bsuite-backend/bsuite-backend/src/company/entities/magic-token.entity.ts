import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, OneToMany } from "typeorm";

@Entity({name:"sys_magic_token"})
export class MagicToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: number;

    @Column()
    token: string;

    @Column()
    expiresAt: Date;

    @Column({ default: false })
    used: boolean;
}
