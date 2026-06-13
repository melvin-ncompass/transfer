import { Injectable, Logger } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { z } from 'zod';
import { AIProvider } from './ai.provider.interface';
import { delay, retryWhen, scan } from 'rxjs/operators';
import { defer, lastValueFrom } from 'rxjs';

@Injectable()
export class GeminiProviderService implements AIProvider {
    private readonly logger = new Logger(GeminiProviderService.name);

    // Maximum retries for transient LLM parsing errors
    private readonly MAX_RETRIES = 3;

    /**
     * Instantiates the primary model (Gemini) and the fallback model (Groq)
     */
    private getModels(temperature: number = 0) {
        const primaryModel = new ChatGoogleGenerativeAI({
            model: 'gemini-2.5-flash',
            temperature,
            maxRetries: 1,
        });

        const fallbackModel = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            model: 'llama-3.3-70b-versatile',
            temperature,
            maxRetries: 2,
        });

        return { primaryModel, fallbackModel };
    }

    /**
     * Returns a single model instance for an explicit provider selection.
     */
    private getSingleModel(provider: 'gemini' | 'groq', temperature: number = 0) {
        if (provider === 'groq') {
            return new ChatGroq({
                apiKey: process.env.GROQ_API_KEY,
                model: 'llama-3.3-70b-versatile',
                temperature,
                maxRetries: 2,
            });
        }
        return new ChatGoogleGenerativeAI({
            model: 'gemini-2.5-flash',
            temperature,
            maxRetries: 1,
        });
    }

    /**
     * Generates structured output with explicit RxJS retries for semantic hallucination failures.
     * Incorporates LangChain Fallbacks: Gemini -> Groq
     */
    async generateStructured<T>(
        prompt: string,
        schema: z.ZodSchema<T>,
        schemaName: string,
        callbacks?: BaseCallbackHandler[],
        temperature: number = 0,
        provider?: 'gemini' | 'groq'
    ): Promise<T> {
        let modelToUse: any;

        if (provider) {
            // User explicitly picked a provider — use it directly, no fallback
            this.logger.log(`Using provider: ${provider} (user-selected)`);
            const single = this.getSingleModel(provider, temperature);
            modelToUse = single.withStructuredOutput(schema, { name: schemaName });
        } else {
            // Default: Gemini → Groq fallback chain
            const { primaryModel, fallbackModel } = this.getModels(temperature);
            const primaryWithStructuredOutput = primaryModel.withStructuredOutput(schema, { name: schemaName });
            const fallbackWithStructuredOutput = fallbackModel.withStructuredOutput(schema, { name: schemaName });
            modelToUse = primaryWithStructuredOutput.withFallbacks({ fallbacks: [fallbackWithStructuredOutput] });
        }

        const executePipeline = defer(() => modelToUse.invoke(prompt, { callbacks })).pipe(
            retryWhen((errors) =>
                errors.pipe(
                    scan((retryCount, error) => {
                        if (retryCount >= this.MAX_RETRIES) {
                            this.logger.error(`Failed after ${this.MAX_RETRIES} retries. Error: ${error.message}`);
                            throw error;
                        }
                        this.logger.warn(`LLM error. Retrying... Attempt: ${retryCount + 1}`);
                        return retryCount + 1;
                    }, 0),
                    delay(1000)
                )
            )
        );

        return lastValueFrom(executePipeline) as Promise<T>;
    }

    /**
     * Generates an AsyncGenerator for streaming responses using the Fallback chain.
     */
    async *generateStream(
        prompt: string,
        callbacks?: BaseCallbackHandler[],
        temperature: number = 0.5,
        provider?: 'gemini' | 'groq'
    ): AsyncGenerator<string> {
        let modelToStream: any;

        if (provider) {
            this.logger.log(`Streaming with provider: ${provider} (user-selected)`);
            modelToStream = this.getSingleModel(provider, temperature);
        } else {
            const { primaryModel, fallbackModel } = this.getModels(temperature);
            modelToStream = primaryModel.withFallbacks({ fallbacks: [fallbackModel] });
        }

        const stream = await modelToStream.stream(prompt, { callbacks });

        for await (const chunk of stream) {
            if (typeof chunk.content === 'string') {
                yield chunk.content;
            }
        }
    }
}

