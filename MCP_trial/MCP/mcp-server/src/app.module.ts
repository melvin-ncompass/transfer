import { Module, OnModuleInit } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AiModule } from './ai/ai.module';
import { MemoryModule } from './memory/memory.module';
import { ObservabilityModule } from './observability/observability.module';
import { SessionsModule } from './sessions/sessions.module';
import { RepoModule } from './repo/repo.module';
import { OrchestratorService } from './orchestrator/orchestrator.service';
import { AgentRegistry } from './orchestrator/agent.registry';
import { SupervisorAgent } from './agents/supervisor/supervisor.agent';
import { SqlAgent } from './agents/sql/sql.agent';
import { TaskAgent } from './agents/task/task.agent';
import { ExecutionAgent } from './agents/execution/execution.agent';
import { FormatterAgent } from './agents/formatter/formatter.agent';
import { RepoAgent } from './agents/repo/repo.agent';
import { DiagramAgent } from './agents/diagram.agent';
import { CsvAgent } from './agents/csv.agent';
import { ConfigModule } from './config/config.module';
import { IntrospectionModule } from './introspection/introspection.module';

const REACT_DIST_CANDIDATES = [
  resolve(__dirname, '..', '..', 'react-client', 'dist'),
  resolve(__dirname, '..', '..', '..', 'react-client', 'dist'),
];

const REACT_DIST_ROOT =
  REACT_DIST_CANDIDATES.find((candidate) => existsSync(candidate)) ??
  REACT_DIST_CANDIDATES[0];

if (!existsSync(REACT_DIST_ROOT)) {
  // eslint-disable-next-line no-console
  console.warn(`UI build not found at ${REACT_DIST_ROOT} — run npm run build:ui`);
}

@Module({
  imports: [
    ConfigModule,
    ServeStaticModule.forRoot({
      rootPath: REACT_DIST_ROOT,
      exclude: ['/api', '/api/*path'],
    }),
    DatabaseModule,
    AiModule,
    MemoryModule,
    ObservabilityModule,
    SessionsModule,
    RepoModule,
    IntrospectionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    OrchestratorService,
    AgentRegistry,
    SupervisorAgent,
    SqlAgent,
    TaskAgent,
    ExecutionAgent,
    FormatterAgent,
    RepoAgent,
    DiagramAgent,
    CsvAgent
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly registry: AgentRegistry,
    private readonly supervisorAgent: SupervisorAgent,
    private readonly sqlAgent: SqlAgent,
    private readonly taskAgent: TaskAgent,
    private readonly executionAgent: ExecutionAgent,
    private readonly formatterAgent: FormatterAgent,
    private readonly repoAgent: RepoAgent,
    private readonly diagramAgent: DiagramAgent,
    private readonly csvAgent: CsvAgent,
  ) { }

  onModuleInit() {
    // Register agents on startup
    this.registry.register(this.supervisorAgent.name, this.supervisorAgent);
    this.registry.register(this.sqlAgent.name, this.sqlAgent);
    this.registry.register(this.taskAgent.name, this.taskAgent);
    this.registry.register(this.executionAgent.name, this.executionAgent);
    this.registry.register(this.formatterAgent.name, this.formatterAgent);
    this.registry.register(this.repoAgent.name, this.repoAgent);
    this.registry.register(this.diagramAgent.name, this.diagramAgent);
    this.registry.register(this.csvAgent.name, this.csvAgent);
  }
}
