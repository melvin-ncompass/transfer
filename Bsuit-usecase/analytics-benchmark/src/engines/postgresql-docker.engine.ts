import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { AnalyticsEngine } from './engine-selector.service';

/**
 * PostgreSQL Docker Engine
 * Connects to the Dockerized PostgreSQL instance on port 5433.
 * Data is migrated here from Local PG.
 */
@Injectable()
export class PostgresqlDockerEngine implements AnalyticsEngine, OnModuleInit {
  private pool: Pool;
  private isAvailable: boolean = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.pool = new Pool({
        host: 'postgres-docker',
        port: 5432,
        database: 'datastuff',
        user: 'postgres',
        password: 'Password',
      });

      const client = await this.pool.connect();
      client.release();
      
      this.isAvailable = true;
    } catch (error) {
      console.warn('⚠️ PostgreSQL Docker not available:', error.message);
      this.isAvailable = false;
    }
  }

  private notAvailableResponse(): any {
    return {
      data: [],
      executionTimeMs: 0,
      rowCount: 0,
      engine: 'postgresql-docker',
      error: 'PostgreSQL Docker not available. Run: docker-compose up -d',
    };
  }

  /**
   * Executes a raw SQL query against the Dockerized PostgreSQL database.
   * @param query - The SQL query string.
   * @param params - Optional parameters for parameterized queries.
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
    const result = await this.pool.query(query, params);
    const executionTimeMs = Date.now() - startTime;

    return {
      data: result.rows,
      executionTimeMs,
      rowCount: result.rowCount,
    };
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
      FROM transactions t
      JOIN merchants m ON t.merchant_id = m.merchant_id
      WHERE t.status = 'completed'
      GROUP BY m.merchant_id, m.merchant_name, m.category
      ORDER BY total_revenue DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.pool.query(query);
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result.rows,
        executionTimeMs,
        rowCount: result.rowCount,
        engine: 'postgresql-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'postgresql-docker',
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
        DATE(transaction_time) as date,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM transactions
      GROUP BY DATE(transaction_time)
      ORDER BY date DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.pool.query(query);
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result.rows,
        executionTimeMs,
        rowCount: result.rowCount,
        engine: 'postgresql-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'postgresql-docker',
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
      FROM customers c
      JOIN transactions t ON c.customer_id = t.customer_id
      WHERE t.status = 'completed'
      GROUP BY c.customer_id, c.name, c.email
      ORDER BY total_spent DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.pool.query(query);
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result.rows,
        executionTimeMs,
        rowCount: result.rowCount,
        engine: 'postgresql-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'postgresql-docker',
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
      FROM transactions t
      JOIN merchants m ON t.merchant_id = m.merchant_id
      GROUP BY m.category
      ORDER BY total_revenue DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.pool.query(query);
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result.rows,
        executionTimeMs,
        rowCount: result.rowCount,
        engine: 'postgresql-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'postgresql-docker',
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
      FROM transactions
      GROUP BY status
      ORDER BY count DESC
    `;

    const startTime = Date.now();
    try {
      const result = await this.pool.query(query);
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result.rows,
        executionTimeMs,
        rowCount: result.rowCount,
        engine: 'postgresql-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'postgresql-docker',
        error: error.message,
      };
    }
  }

  async getSimple1M(): Promise<any> {
    if (!this.isAvailable) {
      return this.notAvailableResponse();
    }

    const query = `SELECT * FROM transactions LIMIT 1000000`;

    const startTime = Date.now();
    try {
      const result = await this.pool.query(query);
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result.rows,
        executionTimeMs,
        rowCount: result.rowCount,
        engine: 'postgresql-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'postgresql-docker',
        error: error.message,
      };
    }
  }

  async getSimple5(): Promise<any> {
    if (!this.isAvailable) {
      return this.notAvailableResponse();
    }

    const query = `SELECT * FROM transactions LIMIT 5`;

    const startTime = Date.now();
    try {
      const result = await this.pool.query(query);
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result.rows,
        executionTimeMs,
        rowCount: result.rowCount,
        engine: 'postgresql-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'postgresql-docker',
        error: error.message,
      };
    }
  }

  async getSimple100K(): Promise<any> {
    if (!this.isAvailable) {
      return this.notAvailableResponse();
    }

    const query = `SELECT * FROM transactions LIMIT 100000`;

    const startTime = Date.now();
    try {
      const result = await this.pool.query(query);
      const executionTimeMs = Date.now() - startTime;

      return {
        data: result.rows,
        executionTimeMs,
        rowCount: result.rowCount,
        engine: 'postgresql-docker',
        query: query.trim(),
      };
    } catch (error) {
      return {
        data: [],
        executionTimeMs: Date.now() - startTime,
        rowCount: 0,
        engine: 'postgresql-docker',
        error: error.message,
      };
    }
  }
}
