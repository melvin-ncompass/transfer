import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { RepoService } from './repo.service';

@Module({
  imports: [AiModule],
  providers: [RepoService],
  exports: [RepoService],
})
export class RepoModule {}
