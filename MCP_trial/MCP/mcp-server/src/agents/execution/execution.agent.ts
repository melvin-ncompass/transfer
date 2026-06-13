import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseAgent, State, AgentResponse } from '../../interfaces/core.interface';
import { QueryValidator } from '../../database/query.validator';

@Injectable()
export class ExecutionAgent implements BaseAgent {
    name = 'EXECUTION_AGENT';
    private readonly logger = new Logger(ExecutionAgent.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly queryValidator: QueryValidator,
    ) { }

    async execute(state: State): Promise<AgentResponse> {
        const startTime = Date.now();
        const sql = state.sqlQuery;

        if (!sql) {
            return this.createErrorResponse('No SQL query provided in State.', startTime);
        }

        try {
            this.logger.log('Validating SQL Query before execution...');
            this.queryValidator.validate(sql);

            this.logger.log('Execution Agent running Query...');

            let rawData;
            if (state.userRole) {
                // If a Role is provided, we execute within an isolated Transaction that sets the PostgreSQL Role
                this.logger.log(`Applying Row Level Security Context: Role [${state.userRole}]`);
                rawData = await this.dataSource.transaction(async (manager) => {
                    // SET LOCAL scopes the role only to the current transaction block
                    const roleString: string = state.userRole as string;
                    await manager.query(`SET LOCAL ROLE ${this.dataSource.driver.escape(roleString)}`);
                    return await manager.query(sql);
                });
            } else {
                // Default fallback if no role is propagated
                this.logger.warn('No userRole provided. Executing query with default Application constraints.');
                rawData = await this.dataSource.query(sql);
            }

            this.logger.log(`Query Successful. Returned ${rawData?.length || 0} rows.`);

            return {
                agentName: this.name,
                reasoning: `Validated SQL against blacklist. Executed safely on DataSource under role '${state.userRole || 'default'}'.`,
                input: sql,
                output: { data: rawData },
                executionTime: Date.now() - startTime,
            };

        } catch (error: any) {
            this.logger.error(`Execution failed: ${error.message}`);
            return this.createErrorResponse(error.message, startTime);
        }
    }

    private createErrorResponse(errMsg: string, startTime: number): AgentResponse {
        return {
            agentName: this.name,
            reasoning: 'Execution halted due to validation or database error.',
            input: null,
            output: null,
            error: errMsg,
            executionTime: Date.now() - startTime,
        };
    }
}
