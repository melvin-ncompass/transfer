import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { PreprocessModule } from './preprocess/preprocess.module';
import { RepoModule } from './repo/repo.module';
import { GenerateServiceModule } from './generate-service/generate-service.module';
import { UsersModule } from './user/user.module';
import { ProjectsModule } from './projects/projects.module';
import { AuthModule } from './auth/auth.module';
import { CodeAnalyzerModule } from './code-analyzer/code-analyzer.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'your_database_name',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Set to false in production
    }),
    AuthModule,
    PreprocessModule,
    RepoModule,
    GenerateServiceModule,
    UsersModule,
    ProjectsModule,
    CodeAnalyzerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
