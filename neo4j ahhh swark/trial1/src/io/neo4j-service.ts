import * as neo4j from 'neo4j-driver';
import { FunctionData } from './function-extractor';

export class Neo4jService {
    private driver: neo4j.Driver | null = null;
    private uri = 'bolt://localhost:7687';
    private user = 'neo4j';
    private password = 'password'; // Change this to your Neo4j password
    private database: string = 'neo4j'; // Default database name

    /**
     * Set database name based on repository path
     */
    setDatabaseFromPath(workspacePath: string): void {
        // Extract repository name from path
        const pathParts = workspacePath.replace(/\\/g, '/').split('/');
        const repoName = pathParts[pathParts.length - 1];
        
        // Clean the repo name for database naming (only ascii, numbers, dots, dashes allowed)
        const cleanRepoName = repoName
            .toLowerCase()
            .replace(/[^a-z0-9.-]/g, '-') // Replace invalid chars with dashes
            .replace(/--+/g, '-') // Replace multiple dashes with single dash
            .replace(/^-|-$/g, '') // Remove leading/trailing dashes
            .substring(0, 15); // Limit length
        
        this.database = `v2-${cleanRepoName}`;
        console.log(`Database set to: ${this.database}`);
    }

    async connect(workspacePath?: string): Promise<void> {
        try {
            // Set database name if workspace path provided
            if (workspacePath) {
                this.setDatabaseFromPath(workspacePath);
            }
            
            this.driver = neo4j.driver(this.uri, neo4j.auth.basic(this.user, this.password));
            
            // Verify connectivity
            const serverInfo = await this.driver.getServerInfo();
            console.log(`Connected to Neo4j: ${serverInfo.address} (database: ${this.database})`);
            
            // Create database if it doesn't exist (Neo4j 4.0+)
            await this.ensureDatabaseExists();
        } catch (error) {
            console.error('Failed to connect to Neo4j:', error);
            throw new Error(`Neo4j connection failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Ensure the database exists (for Neo4j 4.0+)
     */
    private async ensureDatabaseExists(): Promise<void> {
        if (!this.driver || this.database === 'neo4j') return; // Skip for default database
        
        // For now, let's just use the default database to avoid complexity
        // In a production environment, you could manually create databases
        console.log(`Note: Using default database instead of ${this.database} to avoid memory issues`);
        this.database = 'neo4j';
        return;
        
        /* 
        // Uncomment this section if you want to try automatic database creation
        const systemSession = this.driver.session({ database: 'system' });
        try {
            // Check if database exists
            const result = await systemSession.run('SHOW DATABASES');
            const databases = result.records.map(record => record.get('name'));
            
            if (!databases.includes(this.database)) {
                // Create database if it doesn't exist
                await systemSession.run(`CREATE DATABASE \`${this.database}\``);
                console.log(`Created database: ${this.database}`);
                
                // Wait a moment for database to be ready
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.warn('Could not create database (may not be supported):', error);
            // Fall back to default database
            this.database = 'neo4j';
        } finally {
            await systemSession.close();
        }
        */
    }

    async close(): Promise<void> {
        if (this.driver) {
            await this.driver.close();
            this.driver = null;
            console.log('Neo4j connection closed');
        }
    }

    /**
     * Step 6B3: Clear existing data in batches to avoid memory issues
     */
    async clearDatabase(): Promise<void> {
        if (!this.driver) {
            throw new Error('Not connected to Neo4j');
        }
        
        const session = this.driver.session({ database: this.database });
        try {
            // Clear in small batches to avoid memory issues
            let deletedCount = 0;
            let totalDeleted = 0;
            
            do {
                const result = await session.run('MATCH (n) WITH n LIMIT 500 DETACH DELETE n RETURN count(n) as deleted');
                deletedCount = result.records[0]?.get('deleted')?.toNumber() || 0;
                totalDeleted += deletedCount;
                
                if (deletedCount > 0) {
                    console.log(`Deleted ${deletedCount} nodes (total: ${totalDeleted})`);
                    // Small delay to let Neo4j recover
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } while (deletedCount > 0);
            
            console.log(`Database cleared: ${this.database} (total deleted: ${totalDeleted})`);
        } catch (error) {
            console.error('Error clearing database:', error);
            console.log('Skipping database clear due to memory constraints - proceeding with analysis');
            // Don't throw the error - just continue
        } finally {
            await session.close();
        }
    }

    /**
     * Step 6B3: Create function node in Neo4j
     */
    async createFunctionNode(functionData: FunctionData): Promise<void> {
        if (!this.driver) {
            throw new Error('Not connected to Neo4j');
        }
        
        const session = this.driver.session({ database: this.database });
        try {
            await session.run(
                `CREATE (f:Function {
                    name: $name,
                    filePath: $filePath,
                    startLine: $startLine,
                    endLine: $endLine,
                    code: $code,
                    language: $language
                })`,
                {
                    name: functionData.name,
                    filePath: functionData.filePath,
                    startLine: neo4j.int(functionData.startLine),
                    endLine: neo4j.int(functionData.endLine),
                    code: functionData.code,
                    language: this.getLanguageFromPath(functionData.filePath)
                }
            );
        } finally {
            await session.close();
        }
    }

    /**
     * Step 6B3: Create dependency relationship between functions
     */
    async createDependencyRelationship(fromFunction: string, toFunction: string): Promise<void> {
        if (!this.driver) {
            throw new Error('Not connected to Neo4j');
        }
        
        const session = this.driver.session({ database: this.database });
        try {
            await session.run(
                `MATCH (from:Function {name: $fromName}), (to:Function {name: $toName})
                 CREATE (from)-[:DEPENDS_ON]->(to)`,
                { fromName: fromFunction, toName: toFunction }
            );
        } catch (error) {
            // It's okay if one of the functions doesn't exist (external dependency)
            console.warn(`Could not create relationship ${fromFunction} -> ${toFunction}`);
        } finally {
            await session.close();
        }
    }

    /**
     * Step 6B3: Insert all functions and their relationships
     */
    async insertAllFunctions(functions: FunctionData[]): Promise<void> {
        console.log(`Inserting ${functions.length} functions into Neo4j...`);
        
        // Create all function nodes first
        for (const func of functions) {
            try {
                await this.createFunctionNode(func);
            } catch (error) {
                console.warn(`Failed to create function node for ${func.name}:`, error);
            }
        }

        // Create relationships
        let relationshipCount = 0;
        for (const func of functions) {
            for (const dependency of func.dependsOn) {
                try {
                    await this.createDependencyRelationship(func.name, dependency);
                    relationshipCount++;
                } catch (error) {
                    console.warn(`Failed to create relationship ${func.name} -> ${dependency}:`, error);
                }
            }
        }

        console.log(`Inserted ${functions.length} functions and ${relationshipCount} relationships`);
    }

    /**
     * Get function by name for WebUI
     */
    async getFunctionByName(name: string): Promise<any | null> {
        if (!this.driver) {
            throw new Error('Not connected to Neo4j');
        }
        
        const session = this.driver.session({ database: this.database });
        try {
            const result = await session.run(
                `MATCH (f:Function {name: $name})
                 OPTIONAL MATCH (f)-[:DEPENDS_ON]->(dep:Function)
                 OPTIONAL MATCH (used:Function)-[:DEPENDS_ON]->(f)
                 RETURN f, 
                        collect(DISTINCT dep.name) as dependencies, 
                        collect(DISTINCT used.name) as usedBy`,
                { name }
            );
            
            if (result.records.length === 0) {
                return null;
            }
            
            const record = result.records[0];
            const node = record.get('f');
            
            return {
                name: node.properties.name,
                filePath: node.properties.filePath,
                startLine: node.properties.startLine.toNumber(),
                endLine: node.properties.endLine.toNumber(),
                code: node.properties.code,
                language: node.properties.language,
                dependencies: record.get('dependencies').filter((dep: string) => dep),
                usedBy: record.get('usedBy').filter((used: string) => used)
            };
        } finally {
            await session.close();
        }
    }

    /**
     * Get all functions for WebUI
     */
    async getAllFunctions(): Promise<any[]> {
        if (!this.driver) {
            throw new Error('Not connected to Neo4j');
        }
        
        const session = this.driver.session({ database: this.database });
        try {
            const result = await session.run(`
                MATCH (f:Function)
                OPTIONAL MATCH (f)-[:DEPENDS_ON]->(dep:Function)
                OPTIONAL MATCH (used:Function)-[:DEPENDS_ON]->(f)
                RETURN f, 
                       collect(DISTINCT dep.name) as dependencies, 
                       collect(DISTINCT used.name) as usedBy
                ORDER BY f.name
            `);
            
            return result.records.map(record => {
                const node = record.get('f');
                return {
                    id: node.elementId,
                    name: node.properties.name,
                    filePath: node.properties.filePath,
                    startLine: node.properties.startLine.toNumber(),
                    endLine: node.properties.endLine.toNumber(),
                    language: node.properties.language,
                    dependencies: record.get('dependencies').filter((dep: string) => dep),
                    usedBy: record.get('usedBy').filter((used: string) => used)
                };
            });
        } finally {
            await session.close();
        }
    }

    /**
     * Get function network data for visualization
     */
    async getFunctionNetwork(): Promise<{ nodes: any[], edges: any[] }> {
        if (!this.driver) {
            throw new Error('Not connected to Neo4j');
        }
        
        const session = this.driver.session({ database: this.database });
        try {
            // Get all nodes
            const nodesResult = await session.run(`
                MATCH (f:Function)
                RETURN f.name as name, f.filePath as filePath, f.language as language
            `);
            
            const nodes = nodesResult.records.map(record => ({
                id: record.get('name'),
                label: record.get('name'),
                filePath: record.get('filePath'),
                language: record.get('language'),
                group: record.get('language') || 'unknown'
            }));

            // Get all edges
            const edgesResult = await session.run(`
                MATCH (from:Function)-[:DEPENDS_ON]->(to:Function)
                RETURN from.name as source, to.name as target
            `);
            
            const edges = edgesResult.records.map(record => ({
                from: record.get('source'),
                to: record.get('target'),
                arrows: 'to'
            }));

            return { nodes, edges };
        } finally {
            await session.close();
        }
    }

    private getLanguageFromPath(filePath: string): string {
        const ext = filePath.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'js':
            case 'jsx':
                return 'javascript';
            case 'ts':
            case 'tsx':
                return 'typescript';
            case 'py':
                return 'python';
            case 'java':
                return 'java';
            case 'c':
                return 'c';
            case 'cpp':
            case 'cc':
            case 'cxx':
                return 'cpp';
            default:
                return 'unknown';
        }
    }
}
