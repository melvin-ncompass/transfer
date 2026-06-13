import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationMemory } from './entities/memory.entity';
import { AuditTrail } from './entities/audit.entity';
import { State } from '../interfaces/core.interface';

@Injectable()
export class MemoryService {
    private readonly logger = new Logger(MemoryService.name);

    constructor(
        @InjectRepository(ConversationMemory)
        private readonly memoryRepo: Repository<ConversationMemory>,
        @InjectRepository(AuditTrail)
        private readonly auditRepo: Repository<AuditTrail>,
    ) { }

    // ====== CONVERSATION MEMORY ======

    async loadSessionState(sessionId: string): Promise<State | null> {
        try {
            const memory = await this.memoryRepo.findOne({ where: { sessionId }, order: { updatedAt: 'DESC' } });
            if (memory) {
                this.logger.debug(`Loaded previous state for session: ${sessionId}`);
                return memory.statePayload;
            }
            return null;
        } catch (error: any) {
            this.logger.error(`Failed to load session memory: ${error.message}`);
            return null; // Fallback to empty state gracefully
        }
    }

    async saveSessionState(sessionId: string, state: State): Promise<void> {
        try {
            let memory = await this.memoryRepo.findOne({ where: { sessionId } });

            if (!memory) {
                memory = this.memoryRepo.create({ sessionId, statePayload: state });
            } else {
                memory.statePayload = state;
            }

            await this.memoryRepo.save(memory);
            this.logger.debug(`Saved state for session: ${sessionId}`);
        } catch (error: any) {
            this.logger.error(`Memory save failed: ${error.message}`);
        }
    }

    // ====== AUDIT TRAIL ======

    async logAuditTrace(traceId: string, state: State, executionTimeMs: number, userId?: string): Promise<void> {
        try {
            const audit = this.auditRepo.create({
                traceId,
                userId,
                originalQuery: state.query,
                generatedSql: state.sqlQuery || null,
                rowsReturned: Array.isArray(state.dbResults) ? state.dbResults.length : null,
                agentReasoning: state.agentResponses.map(res => ({
                    agent: res.agentName,
                    reasoning: res.reasoning,
                    tokens: res.tokensUsed,
                    promptChars: res.tokensUsed?.promptChars
                })),
                executionTimeMs
            } as any);

            await this.auditRepo.save(audit);
            this.logger.log(`[Audit] Trace ${traceId} persisted successfully.`);
        } catch (error: any) {
            this.logger.error(`[CRITICAL] Audit logging failed: ${error.message}`);
        }
    }
}
