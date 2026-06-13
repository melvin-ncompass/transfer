import { Controller, Delete, Get, Logger, Param, Query } from '@nestjs/common';
import { ApiResponse } from 'src/common/api-response';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(private readonly projectService: ProjectsService) {}

  @Get('allProjects')
  async getALlProjects(@Query() query: any) {
    try {
      const responseData = await this.projectService.getAllProjects(query);
      return new ApiResponse(
        responseData,
        'projects fetched successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module projecct -> user projects: ${error.stack}`,
      );
      return new ApiResponse(error.message, 'error', 500);
    }
  }

  @Get('projectDetails')
  async projectDetails(@Query() query: any) {
    try {
      const responseData = await this.projectService.getProjectDetails(query);
      return new ApiResponse(
        responseData,
        'projects fetched successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module project -> project Details: ${error.stack}`,
      );
      return new ApiResponse(error.message, 'error', 500);
    }
  }

  @Delete('project')
  async deleteProject(@Query() query: any) {
    try {
      const responseData = await this.projectService.deleteProject(query);
      return new ApiResponse(
        responseData,
        'projects fetched successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module project -> project Details: ${error.stack}`,
      );
      return new ApiResponse(error.message, 'error', 500);
    }
  }
}
