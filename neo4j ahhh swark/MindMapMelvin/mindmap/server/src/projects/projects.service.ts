import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import fetch from 'node-fetch';

import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Project } from 'src/entities/project.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private readonly configService: ConfigService,
  ) {}

  async getAllProjects(query: Record<string, string>) {
    if (query.username) {
      const user = await this.userRepository.findOne({
        where: { username: query.username },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return await this.projectRepository.find({
        where: { user: { id: user.id } },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    }
  }

  async getProject(query: Record<string, string>) {
    const project = await this.projectRepository.findOne({
      where: {
        projectname: query.repo,
        user: { username: query.username },
      },
      relations: ['user'],
    });

    return project;
  }

  async computeProjectStatus(project: any): Promise<string> {
    const preprocess = project.preprocesses?.[0]; // assuming single or primary preprocess
    const flowchart = project.flowcharts?.[0];

    if (!preprocess) return 'initialize preprocess';
    if (!preprocess.metaData) return 'extract meta data';
    if (!preprocess.buildprompt) return 'build prompt';
    if (!preprocess.analyzedfilesLLM) return 'analyze files';
    if (!preprocess.contentFilteration) return 'content filteration';
    if (!preprocess.batchsummary) return 'summarize batches';
    if (!flowchart?.d2Code) return 'generate mindmap'; // diagram not yet generated

    return 'Diagrammed';
  }

  async getProjectDetails(query) {
    const project = await this.projectRepository.findOne({
      where: { id: query.projectId },
      relations: ['user', 'preprocesses', 'flowcharts'],
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const status = await this.computeProjectStatus(project);
    console.log(status);
    const preprocess = project.preprocesses?.[0];
    const flowchart = project.flowcharts?.[0];

    switch (status) {
      case 'initialize preprocess':
        return { status };

      case 'build prompt':
        return {
          status,
          data: preprocess.metaData,
        };

      case 'analyze files':
        return {
          status,
          data: preprocess.buildprompt,
        };

      case 'content filteration':
        return {
          status,
          data: preprocess.analyzedfilesLLM,
        };

      case 'summarize batches':
        return {
          status,
          data: preprocess.contentFilteration,
        };

      case 'generate mindmap':
        return {
          status,
          data: preprocess.batchsummary,
        };

      case 'Diagrammed':
        return {
          status,
          data: flowchart.d2Code,
        };

      default:
        return {
          status: 'Unknown',
          message: 'Unable to determine project state',
        };
    }
  }

  async deleteProject(query: { projectId: number }) {
    //     if (project.user.id !== currentUserId) {
    //   throw new UnauthorizedException('You do not own this project');
    // }

    const project = await this.projectRepository.findOne({
      where: { id: query.projectId },
      relations: ['user', 'preprocesses', 'flowcharts'],
    });

    console.log('project details', project);

    if (!project) {
      throw new Error('Project not found');
    }

    // Optional: cascade delete related entities manually if needed
    // await this.preprocessRepository.delete({ project: { id: query.projectId } });
    // await this.flowchartRepository.delete({ project: { id: query.projectId } });

    await this.projectRepository.remove(project);

    return { success: true, message: 'Project deleted successfully' };
  }
}
