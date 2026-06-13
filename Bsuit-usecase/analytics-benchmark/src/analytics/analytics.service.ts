import { Injectable, Logger } from '@nestjs/common';
import { EngineSelectorService, EngineType } from '../engines/engine-selector.service';
import { AnalyticsResponseDto, BenchmarkResponseDto } from './dto';

/**
 * Service handling analytics logic.
 * Routes requests to the selected engine and aggregates results.
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly engineSelector: EngineSelectorService) {}

  /**
   * Returns available engines and the default configured engine.
   */
  getAvailableEngines() {
    return {
      availableEngines: this.engineSelector.getAvailableEngines(),
      defaultEngine: this.engineSelector.getDefaultEngine(),
    };
  }

  async getRevenueByMerchant(engineType?: EngineType, limit: number = 100): Promise<AnalyticsResponseDto> {
    const engine = this.engineSelector.getEngine(engineType);
    const engineName = engineType || this.engineSelector.getDefaultEngine();
    
    this.logger.log(`Executing getRevenueByMerchant on ${engineName} engine`);
    
    try {
      const result = await engine.getRevenueByMerchant(limit);
      return {
        ...result,
        engine: engineName,
      };
    } catch (error) {
      this.logger.error(`Error executing query on ${engineName}: ${error.message}`);
      throw error;
    }
  }

  async getDailyTransactions(engineType?: EngineType, days: number = 30): Promise<AnalyticsResponseDto> {
    const engine = this.engineSelector.getEngine(engineType);
    const engineName = engineType || this.engineSelector.getDefaultEngine();
    
    this.logger.log(`Executing getDailyTransactions on ${engineName} engine`);
    
    try {
      const result = await engine.getDailyTransactions(days);
      return {
        ...result,
        engine: engineName,
      };
    } catch (error) {
      this.logger.error(`Error executing query on ${engineName}: ${error.message}`);
      throw error;
    }
  }

  async getCustomerSpending(engineType?: EngineType, limit: number = 100): Promise<AnalyticsResponseDto> {
    const engine = this.engineSelector.getEngine(engineType);
    const engineName = engineType || this.engineSelector.getDefaultEngine();
    
    this.logger.log(`Executing getCustomerSpending on ${engineName} engine`);
    
    try {
      const result = await engine.getCustomerSpending(limit);
      return {
        ...result,
        engine: engineName,
      };
    } catch (error) {
      this.logger.error(`Error executing query on ${engineName}: ${error.message}`);
      throw error;
    }
  }

  async getCategoryDistribution(engineType?: EngineType): Promise<AnalyticsResponseDto> {
    const engine = this.engineSelector.getEngine(engineType);
    const engineName = engineType || this.engineSelector.getDefaultEngine();
    
    this.logger.log(`Executing getCategoryDistribution on ${engineName} engine`);
    
    try {
      const result = await engine.getCategoryDistribution();
      return {
        ...result,
        engine: engineName,
      };
    } catch (error) {
      this.logger.error(`Error executing query on ${engineName}: ${error.message}`);
      throw error;
    }
  }

  async getStatusSummary(engineType?: EngineType): Promise<AnalyticsResponseDto> {
    const engine = this.engineSelector.getEngine(engineType);
    const engineName = engineType || this.engineSelector.getDefaultEngine();
    
    this.logger.log(`Executing getStatusSummary on ${engineName} engine`);
    
    try {
      const result = await engine.getStatusSummary();
      return {
        ...result,
        engine: engineName,
      };
    } catch (error) {
      this.logger.error(`Error executing query on ${engineName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Simple SELECT query returning 1 million rows.
   */
  async getSimple1M(engineType?: EngineType): Promise<AnalyticsResponseDto> {
    const engine = this.engineSelector.getEngine(engineType);
    const engineName = engineType || this.engineSelector.getDefaultEngine();
    
    this.logger.log(`Executing getSimple1M on ${engineName} engine`);
    
    try {
      const result = await engine.getSimple1M();
      return {
        ...result,
        engine: engineName,
      };
    } catch (error) {
      this.logger.error(`Error executing query on ${engineName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Simple SELECT query returning 5 rows.
   */
  async getSimple5(engineType?: EngineType): Promise<AnalyticsResponseDto> {
    const engine = this.engineSelector.getEngine(engineType);
    const engineName = engineType || this.engineSelector.getDefaultEngine();
    
    this.logger.log(`Executing getSimple5 on ${engineName} engine`);
    
    try {
      const result = await engine.getSimple5();
      return {
        ...result,
        engine: engineName,
      };
    } catch (error) {
      this.logger.error(`Error executing query on ${engineName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Simple SELECT query returning 100k rows.
   */
  async getSimple100K(engineType?: EngineType): Promise<AnalyticsResponseDto> {
    const engine = this.engineSelector.getEngine(engineType);
    const engineName = engineType || this.engineSelector.getDefaultEngine();
    
    this.logger.log(`Executing getSimple100K on ${engineName} engine`);
    
    try {
      const result = await engine.getSimple100K();
      return {
        ...result,
        engine: engineName,
      };
    } catch (error) {
      this.logger.error(`Error executing query on ${engineName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Runs the specified query across all available engines to compare performance.
   */
  async runBenchmark(queryType: string): Promise<BenchmarkResponseDto> {
    const engines: EngineType[] = [
      'postgresql-docker',
      'clickhouse-docker',
      'duckdb-docker',
    ];
    const results: any[] = [];

    for (const engine of engines) {
      try {
        let result: any;
        const startTime = Date.now();

        switch (queryType) {
          case 'revenue-by-merchant':
            result = await this.getRevenueByMerchant(engine, 100);
            break;
          case 'daily-transactions':
            result = await this.getDailyTransactions(engine, 30);
            break;
          case 'customer-spending':
            result = await this.getCustomerSpending(engine, 100);
            break;
          case 'category-distribution':
            result = await this.getCategoryDistribution(engine);
            break;
          case 'status-summary':
            result = await this.getStatusSummary(engine);
            break;
          default:
            throw new Error(`Unknown query type: ${queryType}`);
        }

        results.push({
          engine,
          executionTimeMs: result.executionTimeMs,
          rowCount: result.rowCount,
          success: true,
          error: null,
        });
      } catch (error) {
        results.push({
          engine,
          executionTimeMs: null,
          rowCount: null,
          success: false,
          error: error.message,
        });
      }
    }

    // Sort by execution time (fastest first)
    const successfulResults = results.filter(r => r.success);
    successfulResults.sort((a, b) => a.executionTimeMs - b.executionTimeMs);

    return {
      queryType,
      timestamp: new Date().toISOString(),
      results,
      fastest: successfulResults.length > 0 ? successfulResults[0].engine : null,
      comparison: this.generateComparison(results),
    };
  }

  private generateComparison(results: any[]): string {
    const successful = results.filter(r => r.success);
    if (successful.length === 0) return 'No successful executions';
    
    const fastest = Math.min(...successful.map(r => r.executionTimeMs));
    
    return successful.map(r => {
      const diff = r.executionTimeMs - fastest;
      const percentage = fastest > 0 ? ((diff / fastest) * 100).toFixed(1) : '0';
      return `${r.engine}: ${r.executionTimeMs}ms ${diff > 0 ? `(+${diff}ms, +${percentage}%)` : '(fastest)'}`;
    }).join(' | ');
  }
}
