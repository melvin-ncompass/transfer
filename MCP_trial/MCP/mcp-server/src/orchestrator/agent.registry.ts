import { Injectable, Logger } from '@nestjs/common';
import { BaseAgent } from '../interfaces/core.interface';

@Injectable()
export class AgentRegistry {
    private readonly logger = new Logger(AgentRegistry.name);
    private readonly registry = new Map<string, BaseAgent>();

    /**
     * Registers a new agent in the internal map.
     * @param name Name of the agent (e.g., 'SQL_AGENT')
     * @param agent The instantiated agent class
     */
    register(name: string, agent: BaseAgent): void {
        if (this.registry.has(name)) {
            this.logger.warn(`Agent with name ${name} is already registered. Overwriting.`);
        }
        this.registry.set(name, agent);
        this.logger.log(`Successfully registered agent: ${name}`);
    }

    /**
     * Retrieves an agent by name.
     * @param name Name of the agent to retrieve
     * @returns The agent instance, or undefined if not found
     */
    getAgent(name: string): BaseAgent | undefined {
        const agent = this.registry.get(name);
        if (!agent) {
            this.logger.error(`Agent with name ${name} not found in registry.`);
        }
        return agent;
    }

    /**
     * Returns a list of all currently registered agent names.
     */
    getRegisteredAgentNames(): string[] {
        return Array.from(this.registry.keys());
    }
}
