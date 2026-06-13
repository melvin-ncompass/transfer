import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ConversationMemory } from '../memory/entities/memory.entity';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatSession, ConversationMemory]),
    ],
    providers: [SessionsService],
    controllers: [SessionsController],
    exports: [SessionsService],
})
export class SessionsModule { }
