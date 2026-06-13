import express from 'express';
import cors from 'cors';
import * as path from 'path';
import { Neo4jService } from './neo4j-service';
import { LLMAnalysisService } from '../llm/analysis-service';

export class WebUIServer {
    private app: express.Application;
    private neo4jService: Neo4jService;
    private llmService: LLMAnalysisService;
    private server: any;

    constructor() {
        this.app = express();
        this.neo4jService = new Neo4jService();
        this.llmService = new LLMAnalysisService();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware(): void {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../../webui')));
    }

    private setupRoutes(): void {
        // Serve the main HTML page
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../../webui/index.html'));
        });

        // API: Get all functions
        this.app.get('/api/functions', async (req, res) => {
            try {
                console.log('API: Getting functions from Neo4j...');
                const functions = await this.neo4jService.getAllFunctions();
                console.log(`API: Found ${functions.length} functions`);
                res.json(functions);
            } catch (error) {
                console.error('Error getting functions:', error);
                res.status(500).json({ error: 'Failed to get functions', details: String(error) });
            }
        });

        // API: Get function network data
        this.app.get('/api/network', async (req, res) => {
            try {
                console.log('API: Getting network data from Neo4j...');
                const network = await this.neo4jService.getFunctionNetwork();
                console.log(`API: Found ${network.nodes.length} nodes and ${network.edges.length} edges`);
                res.json(network);
            } catch (error) {
                console.error('Error getting network:', error);
                res.status(500).json({ error: 'Failed to get network data' });
            }
        });

        // API: Get function details
        this.app.get('/api/function/:name', async (req, res) => {
            try {
                const functionName = req.params.name;
                const functionData = await this.neo4jService.getFunctionByName(functionName);
                
                if (!functionData) {
                    return res.status(404).json({ error: 'Function not found' });
                }
                
                res.json(functionData);
            } catch (error) {
                console.error('Error getting function:', error);
                res.status(500).json({ error: 'Failed to get function details' });
            }
        });

        // API: Get function summary (LLM call #2)
        this.app.get('/api/function/:name/summary', async (req, res) => {
            try {
                const functionName = req.params.name;
                const functionData = await this.neo4jService.getFunctionByName(functionName);
                
                if (!functionData) {
                    return res.status(404).json({ error: 'Function not found' });
                }
                
                // Step 7A3: LLM call for function summarization
                const summary = await this.llmService.summarizeFunction({
                    name: functionData.name,
                    filePath: functionData.filePath,
                    code: functionData.code,
                    dependencies: functionData.dependencies,
                    usedBy: functionData.usedBy
                });
                
                res.json({ summary });
            } catch (error) {
                console.error('Error getting function summary:', error);
                res.status(500).json({ error: 'Failed to get function summary' });
            }
        });

        // API: Debug - Check what's in database
        this.app.get('/api/debug', async (req, res) => {
            try {
                const session = this.neo4jService['driver']?.session({ database: this.neo4jService['database'] });
                if (!session) {
                    return res.json({ error: 'No database connection' });
                }
                
                const result = await session.run('MATCH (n) RETURN count(n) as nodeCount, labels(n) as labels LIMIT 10');
                const counts = await session.run('MATCH (n:Function) RETURN count(n) as functionCount');
                const rels = await session.run('MATCH ()-[r]->() RETURN count(r) as relCount');
                
                await session.close();
                
                res.json({
                    database: this.neo4jService['database'],
                    totalNodes: result.records[0]?.get('nodeCount')?.toNumber() || 0,
                    functionNodes: counts.records[0]?.get('functionCount')?.toNumber() || 0,
                    relationships: rels.records[0]?.get('relCount')?.toNumber() || 0,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Debug API error:', error);
                res.status(500).json({ error: 'Debug failed', details: String(error) });
            }
        });

        // API: Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });
    }

    async start(port = 3000, workspacePath?: string): Promise<void> {
        try {
            // Connect to Neo4j with workspace path for database selection
            await this.neo4jService.connect(workspacePath);
            
            // Start the server
            this.server = this.app.listen(port, () => {
                console.log(`WebUI server running on http://localhost:${port}`);
            });
        } catch (error) {
            console.error('Failed to start WebUI server:', error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (this.server) {
            this.server.close();
        }
        await this.neo4jService.close();
    }
}
