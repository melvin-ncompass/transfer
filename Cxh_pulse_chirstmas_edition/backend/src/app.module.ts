import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { VisualizationModule } from './visualization/visualization.module';
import { VisualizationV1Module } from './visualizationV1/visualizationV1.module';
import { safeImportModule } from './utils/module-loader';

const ScaffoldModule = safeImportModule('scaffolding/scaffold.module');
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    ...(ScaffoldModule ? [ScaffoldModule] : []),
    VisualizationModule,
    VisualizationV1Module,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
