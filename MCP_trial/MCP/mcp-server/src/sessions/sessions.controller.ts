import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { IsString, IsNotEmpty } from 'class-validator';

class CreateSessionDto {
    @IsString()
    @IsNotEmpty()
    sessionId: string;

    @IsString()
    @IsNotEmpty()
    title: string;
}

@Controller('api/sessions')
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) { }

    /** GET /sessions — list all sessions (most-recent first) */
    @Get()
    async listSessions() {
        const sessions = await this.sessionsService.listSessions();
        return sessions.map(s => ({
            id: s.id,
            title: s.title,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
        }));
    }

    /** POST /sessions — create (or confirm) a session */
    @Post()
    @HttpCode(HttpStatus.OK)
    async createSession(@Body() body: CreateSessionDto) {
        const session = await this.sessionsService.upsertSession(body.sessionId, body.title);
        return {
            id: session.id,
            title: session.title,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        };
    }

    /** GET /sessions/:id/messages — load message history for a session */
    @Get(':id/messages')
    async getMessages(@Param('id') id: string) {
        const messages = await this.sessionsService.getSessionMessages(id);
        return { sessionId: id, messages };
    }

    /** DELETE /sessions/:id — delete a session and its memory */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteSession(@Param('id') id: string): Promise<void> {
        await this.sessionsService.deleteSession(id);
    }
}
