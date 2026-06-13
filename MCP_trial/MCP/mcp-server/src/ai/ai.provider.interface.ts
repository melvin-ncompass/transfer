import { z } from 'zod';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';

/**
 * Agnostic interface for AI Providers (Gemini, OpenAI, Anthropic)
 */
export interface AIProvider {
    /**
     * Generates a structured JSON output enforcing the provided Zod schema.
     */
    generateStructured<T>(
        prompt: string,
        schema: z.ZodSchema<T>,
        schemaName: string,
        callbacks?: BaseCallbackHandler[],
        temperature?: number,
        provider?: 'gemini' | 'groq'
    ): Promise<T>;

    /**
     * Generates a streaming text response.
     */
    generateStream(
        prompt: string,
        callbacks?: BaseCallbackHandler[],
        temperature?: number,
        provider?: 'gemini' | 'groq'
    ): AsyncGenerator<string>;
}

