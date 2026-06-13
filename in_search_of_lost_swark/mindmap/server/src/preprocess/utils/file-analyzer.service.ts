import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { errorMessage, errorStack } from 'src/utils/lib';
import { env } from 'process';

@Injectable()
export class FileAnalyzerService {
  constructor(private readonly configService: ConfigService) {}

  getOpenAIClient() {
    // Get API key from environment variables or config service
    const apiKey = this.configService.get<string>('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'OpenAI API key not found. Please set it in environment variable OPENAI_API_KEY or in your configuration',
      );
    }

    return new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' });
  }

  private cleanJsonResponse(content: string): string {
    // Remove markdown code block markers if present
    let cleaned = content.trim();
    
    // Remove ```json at the start
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    
    // Remove ``` at the end
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    
    return cleaned.trim();
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
            content: 'You are a helpful code analysis assistant. Always respond with valid JSON only, without any markdown formatting or code block markers.',
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
      console.log('Raw LLM response length:', rawContent.length);
      
      const cleanedContent = this.cleanJsonResponse(rawContent);
      console.log('Cleaned content length:', cleanedContent.length);

      try {
        const parsed = JSON.parse(cleanedContent) as Record<string, any>;
        console.log('✅ Successfully parsed JSON from LLM response');
        return parsed;
      } catch (err: any) {
        console.warn(
          'LLM did not return valid JSON after cleaning.',
          'Raw content preview:',
          rawContent.substring(0, 200),
          'Cleaned content preview:',
          cleanedContent.substring(0, 200),
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
