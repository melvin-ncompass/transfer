import { Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { ApiResponse } from 'src/common/api-response';
import { GenerateService } from './generate-service.service';

@Controller('flowchart')
export class GenerateServiceController {
  private readonly logger = new Logger(GenerateServiceController.name);

  constructor(private readonly generateService: GenerateService) {}

  @Get('generateD2')
  async generateD2(@Query() query: any) {
    try {
      const responseData = await this.generateService.generateD2(query);
      return new ApiResponse(responseData, 'D2 generated', 200);
    } catch (error) {
      this.logger.error(
        `Error in module flowchart -> generateD2: ${error.stack}`,
      );
      return new ApiResponse(error.message, 'error', 500);
    }
  }

  //   @Get('generatedD2')
  // async getGeneratedD2(
  //   @Query() query:any
  // ) {
  //   try {
  //     const responseData = await this.flowChartService.getGeneratedD2(query)
  //     return new ApiResponse(responseData, 'D2 generated', 200)
  //   } catch (error) {
  //     this.logger.error(`Error in module flowchart -> generateD2: ${error.stack}`)
  //     return new ApiResponse(error.message, 'error', 500)
  //   }
  // }

  @Get('generateMd')
  async generateMd(@Query() query: any) {
    try {
      const responseData = await this.generateService.generateMd(query);
      return new ApiResponse(responseData, 'md generated', 200);
    } catch (error) {
      this.logger.error(
        `Error in module flowchart -> generateD2Md: ${error.stack}`,
      );
      return new ApiResponse(error.message, 'error', 500);
    }
  }


    @Get('generateEraser')
  async generateEraser(@Query() query: any) {
    try {
      const responseData = await this.generateService.generateEraser(query);
      return new ApiResponse(responseData, 'eraser generated', 200);
    } catch (error) {
      this.logger.error(
        `Error in module flowchart -> eraserGenerate: ${error.stack}`,
      );
      return new ApiResponse(error.message, 'error', 500);
    }
  }
}
