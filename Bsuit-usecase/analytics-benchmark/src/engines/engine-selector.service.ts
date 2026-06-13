import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostgresqlDockerEngine } from './postgresql-docker.engine';
import { ClickhouseEngine } from './clickhouse.engine';
import { DuckdbDockerEngine } from './duckdb-docker.engine';

export type EngineType = 
  | 'postgresql-docker' 
  | 'clickhouse-docker' 
  | 'duckdb-docker';

export interface AnalyticsEngine {
  executeQuery(query: string, params?: any[]): Promise<{
    data: any[];
    executionTimeMs: number;
    rowCount: number;
  }>;
  
  getRevenueByMerchant(limit?: number): Promise<any>;
  getDailyTransactions(days?: number): Promise<any>;
  getCustomerSpending(limit?: number): Promise<any>;
  getCategoryDistribution(): Promise<any>;
  getStatusSummary(): Promise<any>;
  getSimple1M(): Promise<any>;
  getSimple5(): Promise<any>;
  getSimple100K(): Promise<any>;
}

/**
 * Service responsible for selecting and providing the appropriate analytics engine.
 * Acts as a factory/strategy pattern implementation.
 */
@Injectable()
export class EngineSelectorService {
  private readonly defaultEngine: EngineType;

  constructor(
    private readonly configService: ConfigService,
    private readonly postgresqlDockerEngine: PostgresqlDockerEngine,
    private readonly clickhouseEngine: ClickhouseEngine,
    private readonly duckdbDockerEngine: DuckdbDockerEngine,
  ) {
    this.defaultEngine = (this.configService.get('defaultEngine') || 'postgresql-docker') as EngineType;
  }

  /**
   * Retrieves an analytics engine instance based on the provided type.
   * @param engineType - The type of engine to retrieve (optional, defaults to configured default).
   * @returns The requested AnalyticsEngine instance.
   */
  getEngine(engineType?: EngineType): AnalyticsEngine {
    const engine = engineType || this.defaultEngine;

    switch (engine) {
      case 'postgresql-docker':
        return this.postgresqlDockerEngine;
      case 'clickhouse-docker':
        return this.clickhouseEngine;
      case 'duckdb-docker':
        return this.duckdbDockerEngine;
      default:
        return this.postgresqlDockerEngine;
    }
  }

  /**
   * Returns a list of all available engine types.
   * @returns Array of EngineType strings.
   */
  getAvailableEngines(): EngineType[] {
    return [
      'postgresql-docker',
      'clickhouse-docker',
      'duckdb-docker',
    ];
  }

  /**
   * Returns the default engine type configured for the application.
   * @returns The default EngineType.
   */
  getDefaultEngine(): EngineType {
    return this.defaultEngine;
  }
}
