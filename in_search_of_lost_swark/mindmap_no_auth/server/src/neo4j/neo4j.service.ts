import { Injectable, OnModuleDestroy } from '@nestjs/common';
import neo4j, { Driver, Session } from 'neo4j-driver';

/**
 * Neo4j Database Service
 *
 * What this does:
 * - Connects to Neo4j database
 * - Provides sessions for running queries
 * - Manages connection lifecycle
 */

@Injectable()
export class Neo4jService implements OnModuleDestroy {
  private driver: Driver;

  constructor() {
    console.log('🔌 Connecting to Neo4j...');

    // Connect to Neo4j (change these settings for your setup)
    this.driver = neo4j.driver(
      'bolt://localhost:7687', // Neo4j connection URL
      neo4j.auth.basic('neo4j', 'password'), // Username & password
    );

    // Test connection
    this.testConnection();
  }

  private async testConnection() {
    try {
      const session = this.driver.session();
      await session.run('RETURN 1 as test');
      await session.close();
      console.log('✅ Neo4j connected successfully!');
    } catch (error) {
      console.error('❌ Neo4j connection failed:', error);
      console.log('💡 Make sure Neo4j is running on localhost:7687');
      console.log('💡 Default credentials: neo4j/password123');
    }
  }

  /**
   * Get a new session for running queries
   * Think of this like getting a connection from a connection pool
   */
  getSession(): Session {
    return this.driver.session();
  }

  /**
   * Helper method to run a single query
   */
  async runQuery(query: string, parameters: any = {}) {
    const session = this.getSession();
    try {
      const result = await session.run(query, parameters);
      return result;
    } finally {
      await session.close(); // Always close sessions!
    }
  }

  /**
   * Clean up when application shuts down
   */
  async onModuleDestroy() {
    console.log('🔌 Closing Neo4j connection...');
    await this.driver.close();
  }
}
