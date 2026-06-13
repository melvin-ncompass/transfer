import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GenerateDiagramService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      // Allow fallback if env var is not yet loaded, but log warning
      console.warn('GEMINI_API_KEY not found in configuration');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }
  }

  async generateDiagram(
    prompt: string,
    promptTokens: number, // Kept for interface compatibility, mostly unused for Gemini
  ): Promise<{ rawText: string } | any> {
    try {
      if (!this.model) {
         const apiKey = this.configService.get<string>('GEMINI_API_KEY');
         if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
         this.genAI = new GoogleGenerativeAI(apiKey);
         this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      }

      console.log('Calling Gemini API (gemini-2.5-flash)');

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const rawContent = response.text();

      try {
        // Clean markdown code blocks if present (Gemini often wraps JSON in ```json ... ```)
        const cleanContent = rawContent.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanContent);
        return parsed;
      } catch (err) {
        console.warn('LLM did not return valid JSON. Returning raw string.');
        console.warn('Raw content:', rawContent);
        return { rawText: rawContent };
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        statusCode: 500,
        message: 'Failed to generate summary',
        error: error.message,
      };
    }
  }
}
