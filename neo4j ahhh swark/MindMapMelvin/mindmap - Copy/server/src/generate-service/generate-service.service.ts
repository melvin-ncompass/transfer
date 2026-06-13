import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as tar from 'tar';
import { ConfigService } from '@nestjs/config';
import { GenerateDiagramService } from './utils/generate-d2.service';
import { Project } from 'src/entities/project.entity';
import { GeneratedOutput } from 'src/entities/generated-output.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class GenerateService {
  private readonly logger = new Logger(GenerateService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly generateDiagramService: GenerateDiagramService,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(GeneratedOutput)
    private readonly generatedOutputRepository: Repository<GeneratedOutput>,
  ) {}

  async generateD2(query: any) {
    const USERS_ROOT: any =
      this.configService.get<string>('USERS_ROOT') || process.env.USERS_ROOT;

    const repoRoot = path.join(USERS_ROOT, query.username, query.repo);
    const summaryDirPath = path.join(repoRoot, 'summary');
    const flowchartDirPath = path.join(repoRoot, 'flowchart');

    const summaryFilePath = path.join(summaryDirPath, 'batch-summary.txt');
    const diagramFilePath = path.join(flowchartDirPath, 'architecture.d2');

    try {
      // Ensure directories exist
      await fs.promises.mkdir(summaryDirPath, { recursive: true });
      await fs.promises.mkdir(flowchartDirPath, { recursive: true });

      const summaryContent = await fs.promises.readFile(
        summaryFilePath,
        'utf8',
      );

      const prompt = `
You are a system architect. Based on the following low-level summaries of code batches, construct a mindmap using D2 diagram syntax.

Your goal is to:
- Identify modules, services, controllers, entities, DTOs, and their relationships
- Represent them as nodes and edges in a D2 diagram
- Use meaningful labels and groupings
- Focus on clarity and architectural structure

Return only valid D2 code. Do not include explanations or comments.

--- BEGIN SUMMARY ---
${summaryContent}
--- END SUMMARY ---
`;

      const d2Response = await this.generateDiagramService.generateDiagram(
        prompt,
        5000,
      );

      const d2Code =
        typeof d2Response === 'string'
          ? d2Response.trim()
          : d2Response?.rawText?.trim() || JSON.stringify(d2Response, null, 2);

      await fs.promises.writeFile(diagramFilePath, d2Code, 'utf8');

      // Find the project by username and repo name
      const project = await this.projectRepository.findOne({
        where: {
          user: { username: query.username },
          projectname: query.repo,
        },
      });

      if (!project) {
        throw new Error('Project not found for given user and repo');
      }

      //  Check if a flowchart already exists for this project
      let flowchart = await this.generatedOutputRepository.findOne({
        where: { project: { id: project.id } },
      });

      if (flowchart) {
        flowchart.d2Code = d2Code;
        flowchart.updatedAt = new Date();
      } else {
        flowchart = this.generatedOutputRepository.create({
          projectId: project.id,
          project,
          d2Code,
          updatedAt: new Date(),
        });
      }

      await this.generatedOutputRepository.save(flowchart);

      return {
        success: true,
        message: 'D2 diagram generated and saved successfully',
        d2Code,
        diagramPath: diagramFilePath,
        flowchartId: flowchart.id,
      };
    } catch (error) {
      console.error('Error generating D2 diagram:', error);
      return {
        success: false,
        message: 'Failed to generate D2 diagram',
        error: error.message,
      };
    }
  }

  async getGeneratedD2(query: any) {
    const result = await this.generatedOutputRepository.findOne({
      where: { project: { id: query.projectId } },
      relations: ['project'],
    });

    if (!result) {
      throw new Error('Generated D2 code not found for this project');
    }

    return { d2Code: result.d2Code };
  }

  async generateMd(query: any) {

    const USERS_ROOT: any =
      this.configService.get<string>('USERS_ROOT') || process.env.USERS_ROOT;

    const repoRoot = path.join(USERS_ROOT, query.username, query.repo);

    const mdDirPath = path.join(repoRoot, 'mdFile');
      await fs.promises.mkdir(mdDirPath, { recursive: true });


    // Find the project by username and repo name
    const project = await this.projectRepository.findOne({
      where: {
        user: { username: query.username },
        projectname: query.repo,
      },
    });

    if (!project) {
      throw new Error('Project not found for given user and repo');
    }

    //  Check if a flowchart already exists for this project
    let flowchart = await this.generatedOutputRepository.findOne({
      where: { project: { id: project.id } },
    });

    // 2. D2 Markdown file
    const d2MarkdownContent = `# Architecture D2 Diagram

This diagram shows the system architecture based on the batch analysis.

\`\`\`d2
${flowchart?.d2Code}
\`\`\`

## How to Use

1. Copy the D2 code above
2. Paste it into [D2 Playground](https://play.d2lang.com/)
3. Or use D2 CLI: \`d2 architecture.d2 architecture.svg\`

Generated on: ${new Date().toISOString()}
`;

    const d2MarkdownPath = path.join(mdDirPath, 'architecture-d2-diagram.md');
    fs.writeFileSync(d2MarkdownPath, d2MarkdownContent);

    return { d2MarkdownContent };
  }

async generateEraser(query: any) {
  const USERS_ROOT: any =
    this.configService.get<string>('USERS_ROOT') || process.env.USERS_ROOT;

  const repoRoot = path.join(USERS_ROOT, query.username, query.repo);
  const summaryDirPath = path.join(repoRoot, 'summary');
  const flowchartDirPath = path.join(repoRoot, 'flowchart');

  const summaryFilePath = path.join(summaryDirPath, 'batch-summary.txt');
  const diagramFilePath = path.join(flowchartDirPath, 'architecture.eraser');

  try {
    // Ensure directories exist
    await fs.promises.mkdir(summaryDirPath, { recursive: true });
    await fs.promises.mkdir(flowchartDirPath, { recursive: true });

    const summaryContent = await fs.promises.readFile(summaryFilePath, 'utf8');

    const prompt = `
You are an expert system architect and Eraser (app.eraser.io) diagram builder. 
Your task is to generate a valid Eraser diagram from the provided batch analysis summary.

### STRICT RULES:
- Output only Eraser diagram code, no Markdown fences, no explanations.
- Use valid Eraser blocks with icons and labels:
  - component [icon: some-icon, label: "..."]
  - database [icon: some-icon, label: "..."]
  - queue [icon: some-icon, label: "..."]
  - cloud [icon: some-icon, label: "..."]
  - note [icon: some-icon, label: "..."]
  - group [icon: some-icon, label: "..."]
- Organize nodes into logical layers or groups:
  - External Resources
  - Security and Authentication Layer
  - API and Request Processing Layer
  - Business Logic and Services Layer
  - Data Access and Persistence Layer
  - Infrastructure and Utilities Layer
- Show all workflow/data flows using arrows:
  - Format: 'Source > Target'
  - Include security and error flows if applicable
- Add a Legend explaining node types, colors, or icons
- Must be compilation-ready in Eraser (no unknown shapes, no invalid keywords)
- Do not output Mermaid, D2, Markdown, or any non-Eraser syntax

### REFERENCE DIAGRAM STYLE:

title Custom Domain System – Comprehensive Technical Architecture

External Resources [icon: cloud] {
  Django Authentication System [icon: key, label: "User authentication and session management"]
  SQLite Database [icon: database, label: "Primary relational database for application data"]
}

Security and Authentication Layer [icon: shield] {
  Login View (Auth) [icon: key, label: "Handles user login and authentication"]
  Logout View [icon: log-out, label: "Handles user logout and session termination"]
  Login Required Decorator [icon: shield, label: "Ensures authenticated access to protected views"]
  Password Validators [icon: lock, label: "Enforces password strength and security policies"]
  CSRF Middleware [icon: shield, label: "Cross-site request forgery protection"]
  Error Handler [icon: alert-triangle, label: "Handles security and runtime errors"]
}

# Connections example:
Login View (Auth) > Django Authentication System
Login View (UI) > Login View (Auth)
Login View (UI) > Dashboard View

### SUMMARY CONTENT:
${summaryContent}

Now generate the full Eraser diagram code following this style.
`;

    const eraserResponse = await this.generateDiagramService.generateDiagram(prompt, 5000);

    const eraserCode =
      typeof eraserResponse === 'string'
        ? eraserResponse.trim()
        : eraserResponse?.rawText?.trim() || JSON.stringify(eraserResponse, null, 2);

    await fs.promises.writeFile(diagramFilePath, eraserCode, 'utf8');

    const project = await this.projectRepository.findOne({
      where: {
        user: { username: query.username },
        projectname: query.repo,
      },
    });

    if (!project) {
      throw new Error('Project not found for given user and repo');
    }

    let flowchart = await this.generatedOutputRepository.findOne({
      where: { project: { id: project.id } },
    });

    if (flowchart) {
      flowchart.eraserCode = eraserCode;
      flowchart.updatedAt = new Date();
    } else {
      flowchart = this.generatedOutputRepository.create({
        projectId: project.id,
        project,
        eraserCode,
        updatedAt: new Date(),
      });
    }

    await this.generatedOutputRepository.save(flowchart);

    return {
      success: true,
      message: 'Eraser diagram generated and saved successfully',
      eraserCode,
      diagramPath: diagramFilePath,
      flowchartId: flowchart.id,
    };
  } catch (error) {
    console.error('Error generating Eraser diagram:', error);
    return {
      success: false,
      message: 'Failed to generate Eraser diagram',
      error: error.message,
    };
  }
}

  // async getGeneratedMd(query: any) {}
}
