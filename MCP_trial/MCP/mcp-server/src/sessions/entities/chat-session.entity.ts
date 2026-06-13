import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('chat_sessions')
export class ChatSession {
    /** The sessionId from the client (UUID) — used as the PK to link directly with conversation_memory */
    @PrimaryColumn()
    id: string;

    @Index()
    @Column({ length: 255 })
    title: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
