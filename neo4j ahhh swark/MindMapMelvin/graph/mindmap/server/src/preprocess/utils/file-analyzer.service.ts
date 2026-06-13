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

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const response = (await openai.chat.completions.create({
        model: 'deepseek-chat', // or "gpt-3.5-turbo"         "deepseek"
        messages: [
          {
            role: 'system',
            content: 'You are a helpful code analysis assistant. Always return valid JSON wrapped in ```json code blocks.',
          },
          { role: 'user', content: prompt },
        ],
        reasoning_effort: 'minimal',
        verbosity: 'low',
        max_completion_tokens: MAX_MODEL_TOKENS, // Enable this to prevent truncation
        temperature: 0.2,
      })) as OpenAI.Chat.Completions.ChatCompletion;
      // console.log('OpenAI API response:', response);
      // Return the model's reply
      const rawContent = response.choices[0]?.message?.content || '';
      console.log('Raw content length:', rawContent.length);
      
      // Always try to extract JSON, even if truncated
      try {
        const parsed = this.extractJsonFromResponse(rawContent);
        console.log('Successfully extracted JSON from response');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return parsed;
      } catch (err: any) {
        console.warn('Initial JSON extraction failed, returning raw text for secondary processing');
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

  private extractJsonFromResponse(response: any): any {
    let responseText: string;
    // Normalize response to string
    if (typeof response === 'string') {
      responseText = response;
    } else if (response?.rawText) {
      responseText = response.rawText;
    } else if (response?.content) {
      responseText = response.content;
    } else {
      responseText = JSON.stringify(response);
    }
    
    // Normalize line endings and trim
    responseText = responseText.replace(/\r\n/g, '\n').trim();
    
    console.log('Extracting JSON from response, length:', responseText.length);
    
    // Try to extract JSON from code block
    const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        const jsonContent = codeBlockMatch[1].trim();
        return JSON.parse(jsonContent);
      } catch (err) {
        console.warn('Failed to parse JSON from code block, attempting to fix truncated JSON');
        const jsonContent = codeBlockMatch[1].trim();
        const fixedJson = this.attemptToFixTruncatedJson(jsonContent);
        if (fixedJson) {
          return fixedJson;
        }
      }
    }
    
    // Try to extract first valid JSON object
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.warn('Failed to parse extracted JSON object, attempting to fix');
        const fixedJson = this.attemptToFixTruncatedJson(jsonMatch[0]);
        if (fixedJson) {
          return fixedJson;
        }
      }
    }
    
    // Final fallback: try full response
    try {
      return JSON.parse(responseText);
    } catch (err) {
      console.error(
        'Failed to extract valid JSON from LLM response:',
        responseText.substring(0, 500) + '...',
      );
      
      // Last attempt: try to fix truncated JSON
      const fixedJson = this.attemptToFixTruncatedJson(responseText);
      if (fixedJson) {
        console.log('Successfully recovered from truncated JSON');
        return fixedJson;
      }
      
      throw new Error('LLM response is not valid JSON format');
    }
  }

  private attemptToFixTruncatedJson(jsonString: string): any {
    try {
      // Remove any markdown code block markers first
      let cleaned = jsonString.trim();
      cleaned = cleaned.replace(/^```json\s*/, ''); // Remove opening markdown
      cleaned = cleaned.replace(/```\s*$/, ''); // Remove closing markdown
      cleaned = cleaned.replace(/^```\s*/, ''); // Remove any stray opening backticks
      cleaned = cleaned.trim();
      
      // More aggressive cleanup for truncated responses
      // Remove any trailing incomplete entries after the last complete comma
      const lastCompleteComma = cleaned.lastIndexOf('",');
      if (lastCompleteComma > -1) {
        // Find if there's incomplete content after the last complete comma
        const afterLastComma = cleaned.substring(lastCompleteComma + 2).trim();
        if (afterLastComma && !afterLastComma.endsWith('"') && !afterLastComma.endsWith(']') && !afterLastComma.endsWith('}')) {
          // Truncate at the last complete entry
          cleaned = cleaned.substring(0, lastCompleteComma + 1);
        }
      }
      
      // Remove trailing incomplete strings or values
      cleaned = cleaned.replace(/,\s*"[^"]*$/, ''); // Remove incomplete string at end
      cleaned = cleaned.replace(/,\s*\[.*$/, ''); // Remove incomplete array at end  
      cleaned = cleaned.replace(/,\s*$/, ''); // Remove trailing comma
      
      // Remove any trailing incomplete object or array starts
      cleaned = cleaned.replace(/,\s*\{[^}]*$/, ''); // Remove incomplete object at end
      cleaned = cleaned.replace(/:\s*"[^"]*$/, ''); // Remove incomplete value after colon
      
      // Count open and close braces/brackets to try to balance them
      const openBraces = (cleaned.match(/\{/g) || []).length;
      const closeBraces = (cleaned.match(/\}/g) || []).length;
      const openBrackets = (cleaned.match(/\[/g) || []).length;
      const closeBrackets = (cleaned.match(/\]/g) || []).length;
      
      // Add missing closing brackets and braces
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        cleaned += ']';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        cleaned += '}';
      }
      
      console.log('Attempting to parse fixed JSON (length:', cleaned.length, ')');
      const result = JSON.parse(cleaned);
      console.log('Successfully parsed truncated JSON with', Object.keys(result).length, 'root keys');
      return result;
    } catch (err) {
      console.warn('Could not fix truncated JSON:', err);
      return null;
    }
  }
}
