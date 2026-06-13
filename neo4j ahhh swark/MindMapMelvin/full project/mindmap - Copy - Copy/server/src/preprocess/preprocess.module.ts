import { Module } from '@nestjs/common';
import { PreprocessService } from './preprocess.service';
import { PreprocessController } from './preprocess.controller';
import { PromptBuilderService } from './utils/prompt-builder.service';
import { FileAnalyzerService } from './utils/file-analyzer.service';
import { FilterRepoService } from './utils/filter-repo.service';
import { ExtractMetadataService } from './utils/extract-meta-data.service';
import { GenerateSummaryService } from './utils/generate-summary.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Project } from 'src/entities/project.entity';
import { Preprocess } from 'src/entities/preprocess.entity';
import { ProjectsModule } from 'src/projects/projects.module';
import { Neo4jService } from 'src/neo4j/neo4j.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Project, Preprocess]),
    ProjectsModule,
  ],
  controllers: [PreprocessController],
  providers: [
    PreprocessService,
    ExtractMetadataService,
    PromptBuilderService,
    FileAnalyzerService,
    FilterRepoService,
    GenerateSummaryService,
    Neo4jService, // Added Neo4j service
  ],
})
export class PreprocessModule {}
