import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import type { State } from '../../interfaces/core.interface';

@Entity('conversation_memory')
export class ConversationMemory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    sessionId: string;

    @Column('jsonb')
    statePayload: State;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
