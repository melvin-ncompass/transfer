import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as path from 'path';
// import { CodeExtractor } from "./code-extractor"; // Disabled for now

@Injectable()
export class GenerateSummaryService {
  private genAI: GoogleGenerativeAI;

  constructor(
    private readonly configService: ConfigService
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateSummary(
    prompt: string,
    promptTokens: number,
  ): Promise<{ rawText: string } | any> {
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

      try {
        // Clean potential markdown code blocks
        let cleaned = rawContent.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
        else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
        cleaned = cleaned.trim();

        const parsed = JSON.parse(cleaned);
        return parsed;
      } catch (err) {
        console.warn('LLM did not return valid JSON. Returning raw string.');
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
