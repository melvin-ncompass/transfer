import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import OpenAI from 'openai';
import * as path from 'path';
// import { CodeExtractor } from "./code-extractor"; // Disabled for now

@Injectable()
export class GenerateSummaryService {
  constructor(
    private readonly configService: ConfigService
) {}

  getOpenAIClient() {
    // Get API key from VS Code settings
    // const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const apiKey = "sk-45f419d139724740ad6f12115fad2642"
    // process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OpenAI API key not found. Please set it in VS Code settings (swark6.openaiApiKey) or environment variable OPENAI_API_KEY',
      );
    }

    return new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' });
  }


  async generateSummary(
    prompt: string,
    promptTokens: number,
  ): Promise<{ rawText: string } | any> {
    try {
      const openai: any = await this.getOpenAIClient(); // Your configured OpenAI client
      const MAX_MODEL_TOKENS = 128000 - promptTokens - 1000;

      console.log(
        'Calling OpenAI API',
        // promptTokens,
        'Max tokens:',
        MAX_MODEL_TOKENS,
      );

      const response = await openai.chat.completions.create({
        model: 'deepseek-chat', // or 'gpt-4', 'gpt-3.5-turbo'
        messages: [
          {
            role: 'system',
            content:
              'You are a system architect assistant. Your job is to analyze code and produce low-level summaries for mind map construction.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        reasoning_effort: 'minimal',
        verbosity: 'low',
        // max_completion_tokens: MAX_MODEL_TOKENS,
        // temperature: 0.2,
      });

      const rawContent = response.choices[0]?.message?.content || '';

      try {
        const parsed = JSON.parse(rawContent);
        return parsed;
      } catch (err) {
        console.warn('LLM did not return valid JSON. Returning raw string.');
        return { rawText: rawContent };
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        statusCode: 500,
        message: 'Failed to generate summary',
        error: error.message,
      };
    }
  }
}
