import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { errorMessage, errorStack } from 'src/utils/lib';

@Injectable()
export class FileAnalyzerService {
  private genAI: GoogleGenerativeAI;
  
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
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
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (!apiKey) {
         throw new Error('GEMINI_API_KEY not configured');
      }
      if (!this.genAI) {
         this.genAI = new GoogleGenerativeAI(apiKey);
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      console.log('Calling Gemini API (gemini-2.5-flash)');
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawContent = response.text();
      
      console.log('Raw LLM response length:', rawContent.length);
      
      const cleanedContent = this.cleanJsonResponse(rawContent);

      try {
        const parsed = JSON.parse(cleanedContent) as Record<string, any>;
        console.log('✅ Successfully parsed JSON from LLM response');
        return parsed;
      } catch (err: any) {
        console.warn(
          'LLM did not return valid JSON after cleaning.',
          'Raw content preview:',
          rawContent.substring(0, 200),
          errorStack(err),
        );
        return { rawText: rawContent };
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        statusCode: 500,
        message: 'Failed to analyze files',
        error: errorMessage(error),
      };
    }
  }
}
