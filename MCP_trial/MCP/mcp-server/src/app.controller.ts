import { Controller, Post, Body, Get } from '@nestjs/common';
import { OrchestratorService } from './orchestrator/orchestrator.service';
import { QueryRequestDto } from './dto/query.dto';

@Controller('api')
export class AppController {
  constructor(private readonly orchestratorService: OrchestratorService) { }

  @Get()
  healthCheck() {
    return { status: 'MCP Server is running', timestamp: new Date() };
  }

  @Post('query')
  async processQuery(@Body() body: QueryRequestDto) {
    const provider = (body.config?.provider as 'gemini' | 'groq') ?? undefined;

    const resultState = await this.orchestratorService.execute(
      body.query,
      body.sessionId,
      body.userRole,
      undefined, // userId
      provider
    );

    return {
      query: resultState.query,
      traces: resultState.agentResponses,
      errors: resultState.errors,
      data: resultState.finalResponse,
      queryComplexity: resultState.queryComplexity,
      targetModule: resultState.targetModule,
    };
  }
}
