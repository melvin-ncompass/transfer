import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./user.entity";

@Entity({ name: 'sys_session' })
export class Session {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "session_id", type: "uuid", unique: true })
    sessionId: string;

    @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ name: "expires_at" })
    expiresAt: Date;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @Column({ name: 'browser_name' })
    browserName: string;

    @Column({ name: 'client_info', type: "jsonb", nullable: true })
    clientInfo: object
}




