import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsEngine } from './engine-selector.service';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * DuckDB Docker Engine
 * Executes queries INSIDE the DuckDB Docker container via `docker exec`.
 * Queries Postgres Docker directly via the Docker network using `postgres_scanner`.
 */
@Injectable()
export class DuckdbDockerEngine implements AnalyticsEngine, OnModuleInit {
  private isAvailable: boolean = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      await execAsync('docker ps --filter "name=analytics-duckdb-docker" --format "{{.Names}}"');
      this.isAvailable = true;
    } catch (error) {
      console.warn('⚠️ DuckDB Docker container not found:', error.message);
      this.isAvailable = false;
    }
  }

  private notAvailableResponse(): any {
    return {
      data: [],
      executionTimeMs: 0,
      rowCount: 0,
      engine: 'duckdb-docker',
      error: 'DuckDB Docker container not available. Run: docker-compose up -d',
    };
  }

  /**
   * Spawns a `docker exec` process to run DuckDB CLI inside the container.
   * Streams stdout to capture JSON output.
   */
  private async runQueryInDocker(query: string): Promise<any[]> {
    const fullSql = `
      INSTALL postgres;
      LOAD postgres;
      ATTACH 'dbname=datastuff user=postgres password=Password host=postgres-docker port=5432' AS pg (TYPE postgres);
      ${query}
    `;

    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const child = spawn('docker', ['exec', '-i', 'analytics-duckdb-docker', 'duckdb', '-json']);
      
      let stdoutData = '';
      let stderrData = '';

      child.stdout.on('data', (chunk) => {
        stdoutData += chunk;
      });

      child.stderr.on('data', (chunk) => {
        stderrData += chunk;
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Docker Exec Error (Exit Code ${code}): ${stderrData}`));
          return;
        }
        
        try {
          if (!stdoutData.trim()) {
             resolve([]);
             return;
          }
          const result = JSON.parse(stdoutData);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse DuckDB output: ${e.message}`));
        }
      });

      child.on('error', (err) => {
        reject(new Error(`Spawn Error: ${err.message}`));
      });

      child.stdin.write(fullSql);
      child.stdin.end();
    });
  }

  private convertBigInts(data: any[]): any[] {
    return data.map(row => {
      const converted: any = {};
      for (const key of Object.keys(row)) {
        converted[key] = row[key];
      }
      return converted;
    });
  }

  /**
   * Executes a raw SQL query inside the DuckDB Docker container.
   * @param query - The SQL query string.
   * @param params - Optional parameters (unused).
   */
  async executeQuery(query: string, params: any[] = []): Promise<{
    data: any[];
    executionTimeMs: number;
    rowCount: number;
  }> {
    if (!this.isAvailable) {
      return this.notAvailableResponse();
    }

    const startTime = Date.now();
    try {
      const result = await this.runQueryInDocker(query);
      const executionTimeMs = Date.now() - startTime;

      return {
        data: this.convertBigInts(result),
        executionTimeMs,
        rowCount: result.length,
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
      };
    }
  }

  async getRevenueByMerchant(limit?: number): Promise<any> {
    if (!this.isAvailable) {
      return this.notAvailableResponse();
    }

    const query = `
      SELECT 
        m.merchant_id,
        m.merchant_name,
        m.category,
        COUNT(t.transaction_id) as transaction_count,
        SUM(t.amount) as total_revenue,
        AVG(t.amount) as avg_transaction
      FROM pg.public.transactions t
      JOIN pg.public.merchants m ON t.merchant_id = m.merchant_id
      WHERE t.status = 'completed'
      GROUP BY m.merchant_id, m.merchant_name, m.category
      ORDER BY total_revenue DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.runQueryInDocker(query);
      const executionTimeMs = Date.now() - startTime;

      return {
        data: this.convertBigInts(result),
        executionTimeMs,
        rowCount: result.length,
        engine: 'duckdb-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'duckdb-docker',
        error: error.message,
      };
    }
  }

  async getDailyTransactions(days?: number): Promise<any> {
    if (!this.isAvailable) {
      return this.notAvailableResponse();
    }

    const query = `
      SELECT 
        CAST(transaction_time AS DATE) as date,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM pg.public.transactions
      GROUP BY CAST(transaction_time AS DATE)
      ORDER BY date DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.runQueryInDocker(query);
      const executionTimeMs = Date.now() - startTime;

      return {
        data: this.convertBigInts(result),
        executionTimeMs,
        rowCount: result.length,
        engine: 'duckdb-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'duckdb-docker',
        error: error.message,
      };
    }
  }

  async getCustomerSpending(limit?: number): Promise<any> {
    if (!this.isAvailable) {
      return this.notAvailableResponse();
    }

    const query = `
      SELECT 
        c.customer_id,
        c.name,
        c.email,
        COUNT(t.transaction_id) as transaction_count,
        SUM(t.amount) as total_spent,
        AVG(t.amount) as avg_transaction,
        MIN(t.transaction_time) as first_transaction,
        MAX(t.transaction_time) as last_transaction
      FROM pg.public.customers c
      JOIN pg.public.transactions t ON c.customer_id = t.customer_id
      WHERE t.status = 'completed'
      GROUP BY c.customer_id, c.name, c.email
      ORDER BY total_spent DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.runQueryInDocker(query);
      const executionTimeMs = Date.now() - startTime;

      return {
        data: this.convertBigInts(result),
        executionTimeMs,
        rowCount: result.length,
        engine: 'duckdb-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'duckdb-docker',
        error: error.message,
      };
    }
  }

  async getCategoryDistribution(): Promise<any> {
    if (!this.isAvailable) {
      return this.notAvailableResponse();
    }

    const query = `
      SELECT 
        m.category,
        COUNT(t.transaction_id) as transaction_count,
        SUM(t.amount) as total_revenue,
        AVG(t.amount) as avg_transaction,
        COUNT(DISTINCT t.customer_id) as unique_customers,
        COUNT(DISTINCT t.merchant_id) as merchant_count,
        ROUND(COUNT(t.transaction_id) * 100.0 / SUM(COUNT(t.transaction_id)) OVER (), 2) as percentage
      FROM pg.public.transactions t
      JOIN pg.public.merchants m ON t.merchant_id = m.merchant_id
      GROUP BY m.category
      ORDER BY total_revenue DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.runQueryInDocker(query);
      const executionTimeMs = Date.now() - startTime;

      return {
        data: this.convertBigInts(result),
        executionTimeMs,
        rowCount: result.length,
        engine: 'duckdb-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'duckdb-docker',
        error: error.message,
      };
    }
  }

  async getStatusSummary(): Promise<any> {
    if (!this.isAvailable) {
      return this.notAvailableResponse();
    }

    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM pg.public.transactions
      GROUP BY status
      ORDER BY count DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.runQueryInDocker(query);
      const executionTimeMs = Date.now() - startTime;
      return {
        data: this.convertBigInts(result),
        executionTimeMs,
        rowCount: result.length,
        engine: 'duckdb-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'duckdb-docker',
        error: error.message,
      };
    }
  }

  async getSimple1M(): Promise<any> {
    if (!this.isAvailable) {
      return this.notAvailableResponse();
    }

    const query = `SELECT * FROM pg.public.transactions LIMIT 1000000`;

    const startTime = Date.now();
    try {
      const result = await this.runQueryInDocker(query);
      const executionTimeMs = Date.now() - startTime;
      return {
        data: this.convertBigInts(result),
        executionTimeMs,
        rowCount: result.length,
        engine: 'duckdb-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'duckdb-docker',
        error: error.message,
      };
    }
  }

  async getSimple5(): Promise<any> {
    if (!this.isAvailable) {
      return this.notAvailableResponse();
    }

    const query = `SELECT * FROM pg.public.transactions LIMIT 5`;

    const startTime = Date.now();
    try {
      const result = await this.runQueryInDocker(query);
      const executionTimeMs = Date.now() - startTime;
      return {
        data: this.convertBigInts(result),
        executionTimeMs,
        rowCount: result.length,
        engine: 'duckdb-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'duckdb-docker',
        error: error.message,
      };
    }
  }

  async getSimple100K(): Promise<any> {
    if (!this.isAvailable) {
      return this.notAvailableResponse();
    }

    const query = `SELECT * FROM pg.public.transactions LIMIT 100000`;

    const startTime = Date.now();
    try {
      const result = await this.runQueryInDocker(query);
      const executionTimeMs = Date.now() - startTime;
      return {
        data: this.convertBigInts(result),
        executionTimeMs,
        rowCount: result.length,
        engine: 'duckdb-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'duckdb-docker',
        error: error.message,
      };
    }
  }
}
