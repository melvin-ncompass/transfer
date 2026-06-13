import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ConversationMemory } from '../memory/entities/memory.entity';

@Injectable()
export class SessionsService {
    private readonly logger = new Logger(SessionsService.name);

    constructor(
        @InjectRepository(ChatSession)
        private readonly sessionRepo: Repository<ChatSession>,

        @InjectRepository(ConversationMemory)
        private readonly memoryRepo: Repository<ConversationMemory>,
    ) { }

    /**
     * Creates a session record if it doesn't exist yet (idempotent).
     * Called on the first message of a new chat from the client.
     */
    async upsertSession(sessionId: string, title: string): Promise<ChatSession> {
        let session = await this.sessionRepo.findOne({ where: { id: sessionId } });

        if (!session) {
            session = this.sessionRepo.create({
                id: sessionId,
                title: title.slice(0, 255),
            });
            await this.sessionRepo.save(session);
            this.logger.log(`Created new session: ${sessionId} — "${title}"`);
        }

        return session;
    }

    /**
     * Returns all sessions ordered most-recent first.
     */
    async listSessions(): Promise<ChatSession[]> {
        return this.sessionRepo.find({
            order: { updatedAt: 'DESC' },
        });
    }

    /**
     * Loads the chat message history for a specific session from conversation_memory.
     * Returns the chatHistory array (array of {role, content} objects).
     */
    async getSessionMessages(sessionId: string): Promise<any[]> {
        const memory = await this.memoryRepo.findOne({
            where: { sessionId },
            order: { updatedAt: 'DESC' },
        });

        if (!memory) {
            return [];
        }

        return memory.statePayload?.chatHistory || [];
    }

    /**
     * Bumps the `updatedAt` timestamp so the session rises to the top of the list.
     * Called after every successful orchestration that uses this session.
     */
    async touchSession(sessionId: string): Promise<void> {
        try {
            await this.sessionRepo.update({ id: sessionId }, { updatedAt: new Date() } as any);
        } catch {
            // Session may not exist yet (first message before upsert) — silently skip
        }
    }

    /**
     * Deletes a session and its conversation memory.
     */
    async deleteSession(sessionId: string): Promise<void> {
        const session = await this.sessionRepo.findOne({ where: { id: sessionId } });

        if (!session) {
            throw new NotFoundException(`Session ${sessionId} not found`);
        }

        // Remove conversation memory first (no FK constraint, but clean up anyway)
        await this.memoryRepo.delete({ sessionId });
        await this.sessionRepo.delete({ id: sessionId });

        this.logger.log(`Deleted session: ${sessionId}`);
    }
}
