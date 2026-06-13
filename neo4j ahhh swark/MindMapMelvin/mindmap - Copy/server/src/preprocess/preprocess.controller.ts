/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Get, Logger, Query } from '@nestjs/common';
import { PreprocessService } from './preprocess.service';
import { ApiResponse } from 'src/common/api-response';
import { errorMessage, errorStack } from 'src/utils/lib';

@Controller('preprocess')
export class PreprocessController {
  private readonly logger = new Logger(PreprocessController.name);

  constructor(private readonly preprocessService: PreprocessService) {}

  @Get('metadata')
  async getMetaData(@Query() query: any) {
    try {
      const responseData = await this.preprocessService.generateMetaData(query);
      return new ApiResponse(responseData, 'meta data generated', 200);
    } catch (error) {
      this.logger.error(
        `Error in module preprocess -> metadata: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('buildPrompt')
  async getPrompt(@Query() query: any) {
    try {
      const responseData = await this.preprocessService.generatePrompt(query);
      return new ApiResponse(responseData, 'prompt generated', 200);
    } catch (error) {
      this.logger.error(
        `Error in module preprocess -> buildprompt: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('analyzeWithLLM')
  async analyzeWithLLM(@Query() query: any) {
    try {
      const responseData = await this.preprocessService.analyzeWithLLM(query);
      return new ApiResponse(
        responseData,
        'Analyzed files - Response from LLM successfull',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module preprocess -> analyzeWithLLM: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('contentFilteration')
  async contentFilteration(@Query() query: any) {
    try {
      const responseData =
        await this.preprocessService.contentFilteration(query);
      return new ApiResponse(
        responseData,
        'contentFilteration from the LLM-response successfull',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module preprocess -> contentFilteration: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('repoDiff')
  async getRepoDiff(@Query() query: any) {
    try {
      const responseData = await this.preprocessService.getRepoDiff(query);
      return new ApiResponse(
        responseData,
        'contentFilteration from the LLM-response successfull',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module preprocess -> repoDiff: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('generateGraph')
  async generateGraph(@Query() query: any) {
    try {
      const responseData = (await this.preprocessService.generateGraph(
        query,
      )) as unknown;
      return new ApiResponse(responseData, 'graph generated', 200);
    } catch (error) {
      this.logger.error(
        `Error in module preprocess -> generateGraph: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('cleanNeo4j')
  async cleanNeo4j(@Query() query: any) {
    try {
      const responseData = (await this.preprocessService.cleanNeo4j(
        query,
      )) as unknown;
      return new ApiResponse(responseData, 'Neo4j database cleaned', 200);
    } catch (error) {
      this.logger.error(
        `Error in module preprocess -> cleanNeo4j: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('listJsonFiles')
  async listJsonFiles(@Query() query: any) {
    try {
      const responseData = await this.preprocessService.listJsonFiles(query);
      return new ApiResponse(
        responseData,
        'JSON files listed successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module preprocess -> listJsonFiles: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('getJsonFile')
  async getJsonFile(@Query() query: any) {
    try {
      const responseData = await this.preprocessService.getJsonFile(query);
      return new ApiResponse(responseData, 'JSON file content retrieved', 200);
    } catch (error) {
      this.logger.error(
        `Error in module preprocess -> getJsonFile: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('generateBatchSummary')
  async generateBatchSummary(@Query() query: any) {
    try {
      const responseData =
        await this.preprocessService.generateBatchSummary(query);
      return new ApiResponse(
        responseData,
        'generatedBatchSummary from the LLM successfull',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module preprocess -> generateBatchSummary: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('getBatchSummary')
  async getBatchSummary(@Query() query: any) {
    try {
      const responseData = await this.preprocessService.getBatchSummary(query);
      return new ApiResponse(
        responseData,
        'getBatchSummary from the LLM successfull',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module preprocess -> getBatchSummary: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('getMindmapData')
  async getMindmapData(@Query() query: any) {
    try {
      const responseData = await this.preprocessService.getMindmapData(query);
      return new ApiResponse(
        responseData,
        'Mindmap data for flow-based visualization retrieved successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module preprocess -> getMindmapData: ${errorStack(error)}`,
      );
      
      // Provide fallback data when Neo4j is not available
      if (error.message && error.message.includes('Failed to connect to server')) {
        const fallbackData = {
          mindmap: {
            nodes: [
              {
                id: 'fetchMindmapData',
                name: 'fetchMindmapData',
                module: 'ProjectMindmap',
                relativePath: 'client/src/components/Pages/ProjectMindmap.tsx'
              },
              {
                id: 'useCodeDetails',
                name: 'useCodeDetails',
                module: 'hooks',
                relativePath: 'client/src/hooks/useCodeDetails.tsx'
              },
              {
                id: 'useFetch',
                name: 'useFetch',
                module: 'hooks',
                relativePath: 'client/src/hooks/useFetch.ts'
              },
              {
                id: 'useSessionStorage',
                name: 'useSessionStorage',
                module: 'hooks',
                relativePath: 'client/src/hooks/useSession.ts'
              },
              {
                id: 'handleNodeClick',
                name: 'handleNodeClick',
                module: 'ProjectMindmap',
                relativePath: 'client/src/components/Pages/ProjectMindmap.tsx'
              },
              {
                id: 'AnimatedSVGEdge',
                name: 'AnimatedSVGEdge',
                module: 'Mindmap',
                relativePath: 'client/src/components/Mindmap/AnimatedEdge.tsx'
              }
            ],
            relationships: [
              {
                source: 'fetchMindmapData',
                target: 'useFetch',
                type: 'DEPENDS_ON'
              },
              {
                source: 'fetchMindmapData',
                target: 'useSessionStorage',
                type: 'DEPENDS_ON'
              },
              {
                source: 'handleNodeClick',
                target: 'useCodeDetails',
                type: 'DEPENDS_ON'
              },
              {
                source: 'useCodeDetails',
                target: 'useFetch',
                type: 'DEPENDS_ON'
              },
              {
                source: 'useCodeDetails',
                target: 'useSessionStorage',
                type: 'DEPENDS_ON'
              }
            ]
          }
        };
        
        return new ApiResponse(
          fallbackData,
          'Fallback mindmap data provided (Neo4j unavailable)',
          200,
        );
      }
      
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('getGraphData')
  async getGraphData(@Query() query: any) {
    try {
      const responseData = await this.preprocessService.getGraphData(query);
      return new ApiResponse(
        responseData,
        'Graph data for D3.js visualization retrieved successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module preprocess -> getGraphData: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }
}
