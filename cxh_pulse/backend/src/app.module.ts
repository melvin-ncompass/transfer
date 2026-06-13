import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
// import { VisualizationModule } from './visualization/visualization.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CheckHealthModule } from './check-health/check-health.module';
import { AppLogger } from './utils/logger/logger';
import { safeImportModule } from './utils/module-loader';
import { VisualizationV1Module } from './visualizationV1/visualizationV1.module';

const ScaffoldModule = safeImportModule('scaffolding/scaffold.module');
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'utils', 'swagger', 'assets'),
      serveRoot: '/api/static',
      serveStaticOptions: {
        index: false,
        fallthrough: false,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    ...(ScaffoldModule ? [ScaffoldModule] : []),
    // VisualizationModule,
    VisualizationV1Module,
    CheckHealthModule,
  ],
  controllers: [],
  providers: [AppLogger],
})
export class AppModule { }
