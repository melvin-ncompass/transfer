import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing database connection...');

    try {
      if (this.dataSource.isInitialized) {
        this.logger.log('Database connection already established');
        return;
      }

      this.logger.debug('Attempting to initialize database connection');
      await this.dataSource.initialize();

      // Test the connection with a simple query
      await this.dataSource.query('SELECT 1');

      this.logger.log('Database connection established successfully');
    } catch (error) {
      this.logger.error(
        'Failed to connect to database:',
        error.stack || error.message,
      );
      throw new Error(`Failed to initialize database: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing database connection...');

    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
        this.logger.log('Database connection closed successfully');
      } else {
        this.logger.warn('Database connection was not initialized');
      }
    } catch (error) {
      this.logger.error(
        'Error closing database connection:',
        error.stack || error.message,
      );
      // Don't throw here as it's cleanup
    }
  }

  getConnection(): DataSource {
    if (!this.dataSource.isInitialized) {
      this.logger.error('Attempting to get uninitialized database connection');
      throw new Error('Database connection not initialized');
    }

    return this.dataSource;
  }

  async isConnected(): Promise<boolean> {
    try {
      if (!this.dataSource.isInitialized) {
        this.logger.debug('Database connection not initialized');
        return false;
      }

      // Test the connection with a simple query
      await this.dataSource.query('SELECT 1');
      this.logger.debug('Database connection is healthy');
      return true;
    } catch (error) {
      this.logger.error(
        'Database connection health check failed:',
        error.stack || error.message,
      );
      return false;
    }
  }

  async healthCheck(): Promise<{
    status: string;
    message: string;
    details?: any;
  }> {
    this.logger.debug('Performing database health check');

    try {
      const isConnected = await this.isConnected();

      if (isConnected) {
        // Get additional connection info
        const connectionInfo = {
          isInitialized: this.dataSource.isInitialized,
          driver: this.dataSource.driver?.constructor?.name || 'Unknown',
          database: this.dataSource.options.database || 'Unknown',
          // host: this.dataSource.options. || 'Unknown',
          // port: this.dataSource.options.port || 'Unknown',
        };

        this.logger.debug('Database health check passed');
        return {
          status: 'healthy',
          message: 'Database connection is working properly',
          details: connectionInfo,
        };
      } else {
        this.logger.warn(
          'Database health check failed - connection not available',
        );
        return {
          status: 'unhealthy',
          message: 'Database connection is not established',
        };
      }
    } catch (error) {
      this.logger.error(
        'Database health check failed:',
        error.stack || error.message,
      );
      return {
        status: 'unhealthy',
        message: `Database health check failed: ${error.message}`,
      };
    }
  }
}
