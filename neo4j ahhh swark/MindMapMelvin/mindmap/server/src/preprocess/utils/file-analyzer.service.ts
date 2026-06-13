import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { errorMessage, errorStack } from 'src/utils/lib';

@Injectable()
export class FileAnalyzerService {
  constructor(private readonly configService: ConfigService) {}

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

  async analyzeFileUsingOpenAI(prompt: string, promptTokens: number) {
    try {
      const openai = this.getOpenAIClient(); // Get client with proper API key
      const MAX_MODEL_TOKENS = 128000 - promptTokens - 1000;
      console.log(
        'Calling OpenAI API with prompt tokens:',
        promptTokens,
        MAX_MODEL_TOKENS,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const response = (await openai.chat.completions.create({
        model: 'deepseek-chat', // or "gpt-3.5-turbo"         "deepseek"
        messages: [
          {
            role: 'system',
            content: 'You are a helpful code analysis assistant.',
          },
          { role: 'user', content: prompt },
        ],
        reasoning_effort: 'minimal',
        verbosity: 'low',
        // max_completion_tokens: MAX_MODEL_TOKENS, // adjust as needed
        // temperature: 0.2,`
      })) as OpenAI.Chat.Completions.ChatCompletion;
      console.log('OpenAI API response:', response);
      // Return the model's reply
      const rawContent = response.choices[0]?.message?.content || '';

      try {
        const parsed = JSON.parse(rawContent) as Record<string, any>;
        return parsed;
      } catch (err: any) {
        console.warn(
          'LLM did not return valid JSON. Returning raw string.',
          errorStack(err),
        );
        return { rawText: rawContent };
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        statusCode: 500,
        message: 'Failed to analyze files',
        error: errorMessage(error),
      };
    }
  }
}
