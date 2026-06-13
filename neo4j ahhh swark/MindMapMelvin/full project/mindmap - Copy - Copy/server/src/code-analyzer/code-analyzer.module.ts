import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CodeAnalyzerController } from './code-analyzer.controller';
import { CodeAnalyzerService } from './code-analyzer.service';
import { FileAnalyzerService } from '../preprocess/utils/file-analyzer.service';

@Module({
  imports: [ConfigModule],
  controllers: [CodeAnalyzerController],
  providers: [CodeAnalyzerService, FileAnalyzerService],
  exports: [CodeAnalyzerService],
})
export class CodeAnalyzerModule {}
