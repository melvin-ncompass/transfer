import {
  Controller,
  Get,
  Logger,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { RepoService } from './repo.service';
import { ApiResponse } from 'src/common/api-response';
import { errorMessage, errorStack } from 'src/utils/lib';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('repo')
export class RepoController {
  private readonly logger = new Logger(RepoController.name);

  constructor(private readonly repoService: RepoService) {}

  @Get('user')
  async getUserProfile(@Query() query: any) {
    try {
      const responseData = await this.repoService.getUserProfile(query);
      return new ApiResponse(
        responseData,
        'user profile fetched successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module repo -> user Profile: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('allRepos')
  async allRepos(@Query() query: any) {
    try {
      const responseData = await this.repoService.getRepos(query);
      return new ApiResponse(
        responseData,
        'all repos fetched successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module repo -> all Repos: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('repoBranches')
  async repoBranches(@Query() query: any) {
    try {
      const responseData = await this.repoService.getBranches(query);
      return new ApiResponse(
        responseData,
        'All branches of the repo fetched successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module repo -> getBranches: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('branchCommits')
  async branchCommits(@Query() query: any) {
    try {
      const responseData = await this.repoService.getCommits(query);
      return new ApiResponse(
        responseData,
        'All commits of the branch fetched successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module repo -> getCommits: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('cloneBranch')
  async repoClone(@Query() query: any) {
    try {
      const responseData = await this.repoService.cloneRepoBranch(query);
      return new ApiResponse(responseData, 'cloned repo successfully', 200);
    } catch (error) {
      this.logger.error(
        `Error in module repo -> clone repo: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Get('cloneCommit')
  async commitRepoClone(@Query() query: any) {
    try {
      const responseData = await this.repoService.cloneRepoCommit(query);
      return new ApiResponse(
        responseData,
        'cloned commit repo successfully ',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module repo -> clone commit repo: ${errorStack(error)}`,
      );
      return new ApiResponse(errorMessage(error), 'error', 500);
    }
  }

  @Post('cloneLocalRepo')
  @UseInterceptors(FileInterceptor('file'))
  async cloneLocalRepo(
    @Query() query: { userName: string; repo: string; token: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const responseData = await this.repoService.cloneLocalRepo(query, file);
      return new ApiResponse(
        responseData,
        'cloned commit repo successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        `Error in module repo -> clone commit repo: ${error.stack}`,
      );
      return new ApiResponse(error.message, 'error', 500);
    }
  }

  @Post('cloneLocalPath')
  async cloneLocalPath(@Body() body: { userName: string; repoName: string; repoPath: string }) {
    try {
      const responseData = await this.repoService.cloneLocalPath(body);
      return new ApiResponse(responseData, 'cloned local path successfully', 200);
    } catch (error) {
       this.logger.error(`Error in cloneLocalPath: ${error.stack}`);
       return new ApiResponse(error.message, 'error', 500);
    }
  }
}
