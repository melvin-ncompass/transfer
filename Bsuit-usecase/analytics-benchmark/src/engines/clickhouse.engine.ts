import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsEngine } from './engine-selector.service';

/**
 * ClickHouse Engine (Docker)
 * Connects to the Dockerized ClickHouse instance.
 * Uses the `postgresql()` table function to query data directly from the Postgres container.
 */
@Injectable()
export class ClickhouseEngine implements AnalyticsEngine, OnModuleInit {
  private client: any = null;
  private pgConnectionString: string;
  private isAvailable: boolean = false;
  private lastError: string = '';

  constructor(private readonly configService: ConfigService) {
    const dbConfig = {
      // Connect to Docker Postgres from Docker ClickHouse via Docker Network
      host: 'postgres-docker',
      port: 5432,
      name: 'datastuff',
      user: 'postgres',
      password: 'Password',
    };
    
    this.pgConnectionString = `'${dbConfig.host}:${dbConfig.port}', '${dbConfig.name}', '%TABLE%', '${dbConfig.user}', '${dbConfig.password}'`;
  }

  async onModuleInit() {
    await this.initializeClient();
  }

  /**
   * Initializes the ClickHouse client and tests the connection.
   */
  private async initializeClient() {
    try {
      const { ClickHouse } = require('clickhouse');
      
      this.client = new ClickHouse({
        url: 'http://analytics-clickhouse-docker',
        port: 8123,
        debug: false,
        basicAuth: {
          username: 'default',
          password: 'Password',
        },
        isUseGzip: false,
        format: 'json',
        config: {
          session_timeout: 600,
          output_format_json_quote_64bit_integers: 0,
          enable_http_compression: 0,
          database: 'default',
        },
      });
      
      await this.client.query('SELECT 1').toPromise();
      this.isAvailable = true;
    } catch (error) {
      console.warn('⚠️ ClickHouse not available:', error.message);
      this.lastError = error.message;
      this.isAvailable = false;
    }
  }

  private getPgTable(tableName: string): string {
    return this.pgConnectionString.replace('%TABLE%', tableName);
  }

  private notAvailableResponse(): any {
    return {
      data: [],
      executionTimeMs: 0,
      rowCount: 0,
      engine: 'clickhouse-docker',
      error: `ClickHouse not available. Error: ${this.lastError || 'Run: docker-compose up -d'}`,
    };
  }

  /**
   * Executes a raw SQL query against ClickHouse.
   * @param query - The SQL query string.
   * @param params - Optional parameters (unused in ClickHouse driver usually).
   */
  async executeQuery(query: string, params: any[] = []): Promise<{
    data: any[];
    executionTimeMs: number;
    rowCount: number;
  }> {
    if (!this.isAvailable || !this.client) {
      return this.notAvailableResponse();
    }

    const startTime = Date.now();
    try {
      const result = await this.client.query(query).toPromise();
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result,
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
    if (!this.isAvailable || !this.client) {
      return this.notAvailableResponse();
    }

    const transactionsPg = this.getPgTable('transactions');
    const merchantsPg = this.getPgTable('merchants');

    const query = `
      SELECT 
        m.merchant_id,
        m.merchant_name,
        m.category,
        COUNT(t.transaction_id) as transaction_count,
        SUM(t.amount) as total_revenue,
        AVG(t.amount) as avg_transaction
      FROM postgresql(${transactionsPg}) AS t
      JOIN postgresql(${merchantsPg}) AS m ON t.merchant_id = m.merchant_id
      WHERE t.status = 'completed'
      GROUP BY m.merchant_id, m.merchant_name, m.category
      ORDER BY total_revenue DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.client.query(query).toPromise();
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result,
        executionTimeMs,
        rowCount: result.length,
        engine: 'clickhouse-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'clickhouse-docker',
        error: error.message,
      };
    }
  }

  async getDailyTransactions(days?: number): Promise<any> {
    if (!this.isAvailable || !this.client) {
      return this.notAvailableResponse();
    }

    const transactionsPg = this.getPgTable('transactions');

    const query = `
      SELECT 
        toDate(transaction_time) as date,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM postgresql(${transactionsPg})
      GROUP BY toDate(transaction_time)
      ORDER BY date DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.client.query(query).toPromise();
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result,
        executionTimeMs,
        rowCount: result.length,
        engine: 'clickhouse-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'clickhouse-docker',
        error: error.message,
      };
    }
  }

  async getCustomerSpending(limit?: number): Promise<any> {
    if (!this.isAvailable || !this.client) {
      return this.notAvailableResponse();
    }

    const transactionsPg = this.getPgTable('transactions');
    const customersPg = this.getPgTable('customers');

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
      FROM postgresql(${customersPg}) AS c
      JOIN postgresql(${transactionsPg}) AS t ON c.customer_id = t.customer_id
      WHERE t.status = 'completed'
      GROUP BY c.customer_id, c.name, c.email
      ORDER BY total_spent DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.client.query(query).toPromise();
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result,
        executionTimeMs,
        rowCount: result.length,
        engine: 'clickhouse-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'clickhouse-docker',
        error: error.message,
      };
    }
  }

  async getCategoryDistribution(): Promise<any> {
    if (!this.isAvailable || !this.client) {
      return this.notAvailableResponse();
    }

    const transactionsPg = this.getPgTable('transactions');
    const merchantsPg = this.getPgTable('merchants');

    const query = `
      SELECT 
        m.category,
        COUNT(t.transaction_id) as transaction_count,
        SUM(t.amount) as total_revenue,
        AVG(t.amount) as avg_transaction,
        COUNT(DISTINCT t.customer_id) as unique_customers,
        COUNT(DISTINCT t.merchant_id) as merchant_count
      FROM postgresql(${transactionsPg}) AS t
      JOIN postgresql(${merchantsPg}) AS m ON t.merchant_id = m.merchant_id
      GROUP BY m.category
      ORDER BY total_revenue DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.client.query(query).toPromise();
      const executionTimeMs = Date.now() - startTime;

      // Calculate percentage
      const totalTransactions = result.reduce((sum: number, row: any) => sum + Number(row.transaction_count), 0);
      const dataWithPercentage = result.map((row: any) => ({
        ...row,
        percentage: totalTransactions > 0 ? ((Number(row.transaction_count) / totalTransactions) * 100).toFixed(2) : '0',
      }));

      return {
        data: dataWithPercentage,
        executionTimeMs,
        rowCount: result.length,
        engine: 'clickhouse-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'clickhouse-docker',
        error: error.message,
      };
    }
  }

  async getStatusSummary(): Promise<any> {
    if (!this.isAvailable || !this.client) {
      return this.notAvailableResponse();
    }

    const transactionsPg = this.getPgTable('transactions');

    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM postgresql(${transactionsPg})
      GROUP BY status
      ORDER BY count DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.client.query(query).toPromise();
      const executionTimeMs = Date.now() - startTime;

      // Calculate percentage
      const totalCount = result.reduce((sum: number, row: any) => sum + Number(row.count), 0);
      const dataWithPercentage = result.map((row: any) => ({
        ...row,
        percentage: totalCount > 0 ? ((Number(row.count) / totalCount) * 100).toFixed(2) : '0',
      }));

      return {
        data: dataWithPercentage,
        executionTimeMs,
        rowCount: result.length,
        engine: 'clickhouse-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'clickhouse-docker',
        error: error.message,
      };
    }
  }

  async getSimple1M(): Promise<any> {
    if (!this.isAvailable || !this.client) {
      return this.notAvailableResponse();
    }

    const transactionsPg = this.getPgTable('transactions');
    const query = `SELECT * FROM postgresql(${transactionsPg}) LIMIT 1000000`;

    const startTime = Date.now();
    try {
      const result = await this.client.query(query).toPromise();
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result,
        executionTimeMs,
        rowCount: result.length,
        engine: 'clickhouse-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'clickhouse-docker',
        error: error.message,
      };
    }
  }

  async getSimple5(): Promise<any> {
    if (!this.isAvailable || !this.client) {
      return this.notAvailableResponse();
    }

    const transactionsPg = this.getPgTable('transactions');
    const query = `SELECT * FROM postgresql(${transactionsPg}) LIMIT 5`;

    const startTime = Date.now();
    try {
      const result = await this.client.query(query).toPromise();
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result,
        executionTimeMs,
        rowCount: result.length,
        engine: 'clickhouse-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'clickhouse-docker',
        error: error.message,
      };
    }
  }

  async getSimple100K(): Promise<any> {
    if (!this.isAvailable || !this.client) {
      return this.notAvailableResponse();
    }

    const transactionsPg = this.getPgTable('transactions');
    const query = `SELECT * FROM postgresql(${transactionsPg}) LIMIT 100000`;

    const startTime = Date.now();
    try {
      const result = await this.client.query(query).toPromise();
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result,
        executionTimeMs,
        rowCount: result.length,
        engine: 'clickhouse-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'clickhouse-docker',
        error: error.message,
      };
    }
  }
}
