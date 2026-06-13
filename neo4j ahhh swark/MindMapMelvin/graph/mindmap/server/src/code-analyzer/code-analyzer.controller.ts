import { Controller, Post, Body, Logger } from '@nestjs/common';
import { CodeAnalyzerService } from './code-analyzer.service';
import { ApiResponse } from '../common/api-response';
import { errorMessage, errorStack } from '../utils/lib';

interface ExplainFunctionDto {
  relativePath: string;
  repo: string;
  username: string;
}

@Controller('code-analyzer')
export class CodeAnalyzerController {
  private readonly logger = new Logger(CodeAnalyzerController.name);

  constructor(private readonly codeAnalyzerService: CodeAnalyzerService) {}

  @Post('explainFunction')
  async explainFunction(@Body() dto: ExplainFunctionDto) {
    try {
      this.logger.log(`🔍 Explaining function: ${dto.relativePath}`);

      const result = await this.codeAnalyzerService.explainFunction(
        dto.relativePath,
        dto.repo,
        dto.username,
      );

      return new ApiResponse(
        result,
        'Function explanation generated successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error explaining function ${dto.relativePath}: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }
}
