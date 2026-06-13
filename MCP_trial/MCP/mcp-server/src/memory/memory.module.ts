import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationMemory } from './entities/memory.entity';
import { AuditTrail } from './entities/audit.entity';
import { MemoryService } from './memory.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ConversationMemory, AuditTrail])
    ],
    providers: [MemoryService],
    exports: [MemoryService]
})
export class MemoryModule { }
