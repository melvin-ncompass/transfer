import { Module, Global } from '@nestjs/common';
import { EngineSelectorService } from './engine-selector.service';
import { PostgresqlDockerEngine } from './postgresql-docker.engine';
import { ClickhouseEngine } from './clickhouse.engine';
import { DuckdbDockerEngine } from './duckdb-docker.engine';

/**
 * Global module that registers and exports all analytics engine implementations.
 * Provides the `EngineSelectorService` to other modules.
 */
@Global()
@Module({
  providers: [
    EngineSelectorService,
    PostgresqlDockerEngine,
    ClickhouseEngine,
    DuckdbDockerEngine,
  ],
  exports: [
    EngineSelectorService,
    PostgresqlDockerEngine,
    ClickhouseEngine,
    DuckdbDockerEngine,
  ],
})
export class EnginesModule {}
