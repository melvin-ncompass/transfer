import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('audit_trail')
export class AuditTrail {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    traceId: string;

    @Column({ nullable: true })
    userId: string; // From RBAC context

    @Column('text')
    originalQuery: string;

    @Column('text', { nullable: true })
    generatedSql: string;

    @Column('int', { nullable: true })
    rowsReturned: number;

    @Column('jsonb')
    agentReasoning: any;

    @Column('int')
    executionTimeMs: number;

    @CreateDateColumn()
    createdAt: Date;
}
