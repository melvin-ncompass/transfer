import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Exclude } from "class-transformer"
import { Session } from "./session.entity"
import { UserCompanyRelation } from "src/company/entities/user-company-relation.entity"
import { Company } from "src/company/entities/company.entity"

@Entity({ name: 'sys_user' })
export class User {

    @PrimaryGeneratedColumn()
    @Exclude()
    id: number

    @Column()
    username: string

    @Column({ name: 'display_name' })
    displayName: string

    @Column()
    email: string

    @Column({ nullable: true })
    @Exclude()
    password?: string

    @JoinColumn()
    @OneToMany(() => Session, (session) => session.user)
    @Exclude()
    sessions: Session[];

    @JoinColumn()
    @OneToMany(() => UserCompanyRelation, (relation) => relation.user)
    @Exclude()
    userCompanyRelation: UserCompanyRelation[];

    @Column({ default: false, name: 'two_FA_enabled' })
    @Exclude()
    twoFAEnabled: boolean

    @Column({ nullable: true, name: 'two_FA_secret' })
    @Exclude()
    twoFASecret?: string

    @Column("simple-json", { nullable: true, name: 'fav_question' })
    @Exclude()
    favQuestion: { nickName: string, color: string, schoolName: string } | null

    @Column({ nullable: true, name: 'google_id' })
    @Exclude()
    googleID?: string

    @Column({ default: false })
    verified: boolean

    @Column({ nullable: true, name: 'profile_image', type: "varchar" })
    @Exclude()
    profileImage?: string | null

    @JoinColumn({ name: 'default_company' })
    @ManyToOne(() => Company, { nullable: true, onDelete:'SET NULL' })
    @Exclude()
    defaultCompany?: Company

    @Exclude()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @Exclude()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date
}




