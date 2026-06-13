import { Module } from '@nestjs/common';
import { CleanupController } from './cleanup.controller';
import { CleanupService } from './cleanup.service';

@Module({
    controllers: [CleanupController],
    providers: [CleanupService],
})
export class CleanupModule { }
