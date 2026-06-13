import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SchemaService implements OnModuleInit {
    private readonly logger = new Logger(SchemaService.name);
    private minifiedSchema: string = '';
    private schemaSummary: string = '';

    constructor(private readonly dataSource: DataSource) { }

    async onModuleInit() {
        this.logger.log('Extracting database schema for LLM Agent Context...');
        await this.extractAndCacheSchema();
    }

    /**
     * Retrieves the cached minified schema string.
     */
    getSchema(): string {
        return this.minifiedSchema;
    }

    /**
     * Retrieves the cached schema summary string (table names only).
     */
    getSchemaSummary(): string {
        return this.schemaSummary;
    }

    /**
     * Queries the information_schema to build a dense representation of tables and columns.
     */
    private async extractAndCacheSchema(): Promise<void> {
        try {
            if (!this.dataSource.isInitialized) {
                this.logger.warn('DataSource not initialized. Will retry schema extraction later.');
                return;
            }

            // Query to get all tables and columns in the 'public' schema
            const sql = `
        SELECT 
          table_name, 
          column_name, 
          data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
      `;

            const rows: any[] = await this.dataSource.query(sql);

            // Group columns by table
            const schemaMap: Record<string, string[]> = {};

            for (const row of rows) {
                if (!schemaMap[row.table_name]) {
                    schemaMap[row.table_name] = [];
                }
                schemaMap[row.table_name].push(`"${row.column_name}" (${row.data_type})`);
            }

            // Format as dense Markdown to save LLM context tokens
            let minified = 'Database Schema:\n';
            for (const [tableName, columns] of Object.entries(schemaMap)) {
                minified += `Table [${tableName}]: ${columns.join(', ')}\n`;
            }

            this.minifiedSchema = minified;
            this.schemaSummary = this.buildSchemaSummaryFromSchema(this.minifiedSchema);

            this.logger.log(`Schema extraction complete. Cached ${Object.keys(schemaMap).length} tables.`);
        } catch (error: any) {
            this.logger.error(`Failed to extract schema: ${error.message}`);
            // Fallback for tests or disconnected environments
            this.minifiedSchema = 'Schema unavailable. Do not attempt direct SQL operations.';
            this.schemaSummary = 'Tables (0): unavailable';
        }
    }

    private buildSchemaSummaryFromSchema(schema: string): string {
        const tableNames = schema
            .split('\n')
            .map(line => line.trim())
            .map(line => {
                const match = /^Table\s+\[([^\]]+)\]:/.exec(line);
                return match?.[1] ?? '';
            })
            .filter(Boolean);

        const uniqueTableNames = [...new Set(tableNames)];
        const prefix = `Tables (${uniqueTableNames.length}): `;
        if (uniqueTableNames.length === 0) {
            return 'Tables (0): unavailable';
        }

        let summary = prefix;
        for (let i = 0; i < uniqueTableNames.length; i++) {
            const candidate = i === 0 ? uniqueTableNames[i] : `, ${uniqueTableNames[i]}`;
            if ((summary + candidate).length > 200) {
                summary += '...';
                break;
            }
            summary += candidate;
        }
        return summary.slice(0, 200);
    }
}
