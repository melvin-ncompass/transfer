import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { PreprocessModule } from './preprocess/preprocess.module';
import { RepoModule } from './repo/repo.module';
import { GenerateServiceModule } from './generate-service/generate-service.module';
import { ProjectsModule } from './projects/projects.module';
import { CodeAnalyzerModule } from './code-analyzer/code-analyzer.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mindmap_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, 
    }),
    PreprocessModule,
    RepoModule,
    GenerateServiceModule,
    ProjectsModule,
    CodeAnalyzerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
