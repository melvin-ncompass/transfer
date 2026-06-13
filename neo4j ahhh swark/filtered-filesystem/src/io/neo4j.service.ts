import neo4j, { Driver, Session } from 'neo4j-driver';

export class Neo4jService {
  private driver: Driver;
  constructor() {

    this.driver = neo4j.driver(
      'bolt:
      neo4j.auth.basic('neo4j', 'password'), 
    );
    
    this.testConnection();
  }
  private async testConnection() {
    try {
      const session = this.driver.session();
      await session.run('RETURN 1 as test');
      await session.close();
      
    } catch (error) {

    }
  }
  
  getSession(): Session {
    return this.driver.session();
  }
  
  async runQuery(query: string, parameters: any = {}) {
    const session = this.getSession();
    try {
      const result = await session.run(query, parameters);
      return result;
    } finally {
      await session.close(); 
    }
  }
  
  async close() {
    
    await this.driver.close();
  }
}