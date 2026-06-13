/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ExtractMetadataService } from './utils/extract-meta-data.service';
import { PromptBuilderService } from './utils/prompt-builder.service';
import { FileAnalyzerService } from './utils/file-analyzer.service';
import { ConfigService } from '@nestjs/config';
import { FilterRepoService } from './utils/filter-repo.service';
import { GenerateSummaryService } from './utils/generate-summary.service';
import { GraphGenerator } from './utils/graph-generator';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { Project } from 'src/entities/project.entity';
import { Preprocess } from 'src/entities/preprocess.entity';
import { errorMessage } from 'src/utils/lib';
import { Metadata } from 'src/utils/types';
import { ProjectsService } from 'src/projects/projects.service';

@Injectable()
export class PreprocessService {
  private readonly logger = new Logger(PreprocessService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Preprocess)
    private preprocessRepository: Repository<Preprocess>,
    private readonly configService: ConfigService,
    private readonly promptBuilderService: PromptBuilderService,
    private readonly fileAnalyzerService: FileAnalyzerService,
    private readonly filterRepoService: FilterRepoService,
    private readonly extractMetadataService: ExtractMetadataService,
    private readonly generateSummaryService: GenerateSummaryService,
    private readonly neo4jService: Neo4jService,
    private readonly projectsService: ProjectsService,
  ) {}

  async generateMetaData(query: Record<string, string>) {
    const USERS_ROOT: string =
      this.configService.get<string>('USERS_ROOT') ||
      process.env.USERS_ROOT ||
      ''; // External storage path

    console.log('Analyzing repository structure...');
    const extractPath = path.join(
      USERS_ROOT,
      query.username,
      query.repo,
      'extracted',
    );

    const metadata = await this.extractMetadataService.extractMetadata(
      extractPath,
      '',
    );

    // Save metadata to Preprocess entity
    // Find the project with retry logic for timing issues
    this.logger.log(
      `Looking for project: ${query.repo} for user: ${query.username}`,
    );

    let project = await this.projectRepository.findOne({
      where: {
        projectname: query.repo,
        user: { username: query.username },
      },
      relations: ['user'],
    });

    // If project not found, wait a bit and try again (timing issue)
    if (!project) {
      this.logger.log(
        `Project not found on first attempt, retrying in 1 second...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      project = await this.projectRepository.findOne({
        where: {
          projectname: query.repo,
          user: { username: query.username },
        },
        relations: ['user'],
      });
    }

    if (!project) {
      this.logger.error(
        `Project still not found after retry. Available projects for user ${query.username}:`,
      );

      // Debug: Show available projects for this user
      const userProjects = await this.projectRepository.find({
        where: { user: { username: query.username } },
        relations: ['user'],
      });

      userProjects.forEach((p) => {
        this.logger.log(`  - Project: ${p.projectname}, ID: ${p.id}`);
      });

      throw new Error(
        `Project '${query.repo}' not found for user '${query.username}'. Make sure the repository was cloned successfully first.`,
      );
    }

    this.logger.log(`Project found: ${project.id} - ${project.projectname}`);

    // Find or create Preprocess
    let preprocess = await this.preprocessRepository.findOne({
      where: { project: { id: project.id } },
      relations: ['project'],
    });

    if (!preprocess) {
      preprocess = this.preprocessRepository.create({
        project,
        projectId: project.id,
        metaData: JSON.stringify(metadata), // storing as string since column is `string`
        buildprompt: '', // or some default value
        createdAt: new Date(),
      });
    } else {
      preprocess.metaData = JSON.stringify(metadata);
      preprocess.updatedAt = new Date();
    }

    await this.preprocessRepository.save(preprocess);

    return metadata;
    // fs.writeFileSync(path.join(repoDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
  }

  async generatePrompt(query: Record<string, string>) {
    console.log('Prompt building from stored metadata...');

    // Step 1: Find the project
    const project = await this.projectRepository.findOne({
      where: {
        projectname: query.repo,
        user: { username: query.username },
      },
      relations: ['user'],
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Step 2: Fetch Preprocess entity
    const preprocess = await this.preprocessRepository.findOne({
      where: { project: { id: project.id } },
      relations: ['project'],
    });

    if (!preprocess || !preprocess.metaData) {
      throw new Error('Metadata not found in Preprocess entity');
    }

    const metadata = JSON.parse(preprocess.metaData) as Metadata;

    // Step 3: Build prompt
    const prompt = (await this.promptBuilderService.buildPrompt(
      metadata,
    )) as Record<string, any>;
    const parsedPrompt = prompt; // Already a JS object

    // Step 4: Store prompt in Preprocess entity
    preprocess.buildprompt = JSON.stringify(prompt); // Store as string
    preprocess.updatedAt = new Date();

    await this.preprocessRepository.save(preprocess);

    return { prompt: parsedPrompt };
  }

  async analyzeWithLLM(query: Record<string, string>) {
    console.log('Fetching prompt from database...');

    // Step 1: Find the project
    const project = await this.projectRepository.findOne({
      where: {
        projectname: query.repo,
        user: { username: query.username },
      },
      relations: ['user'],
    });

    if (!project) {
      throw new Error(
        `Project "${query.repo}" not found for user "${query.username}"`,
      );
    }

    // Step 2: Fetch Preprocess entity
    const preprocess: {
      buildprompt: string;
      analyzedfilesLLM: string;
      updatedAt: Date;
    } | null = await this.preprocessRepository.findOne({
      where: { project: { id: project.id } },
      relations: ['project'],
    });

    if (!preprocess || !preprocess.buildprompt) {
      throw new Error('Build prompt not found in Preprocess entity');
    }

    const prompt = preprocess.buildprompt;
    console.log('Prompt ready for LLM analysis');

    // Step 3: Analyze with LLM
    let responseFromModel: any;
    try {
      const rawResponse =
        (await this.fileAnalyzerService.analyzeFileUsingOpenAI(
          prompt,
          15000, // Further increased token limit for large codebases
        )) as unknown;

      // Check if the response is already parsed JSON or needs extraction
      if (rawResponse && typeof rawResponse === 'object' && 'rawText' in rawResponse) {
        // The analyzer service returned a raw text response, try to extract JSON from it
        console.log('Received raw text response from analyzer, attempting JSON extraction');
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          responseFromModel = this.extractJsonFromResponse(rawResponse);
        } catch (err) {
          console.warn('Failed to extract JSON from raw response, saving as partial result');
          // If JSON extraction fails, save the raw text as a fallback
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          responseFromModel = { 
            partial: true, 
            rawContent: (rawResponse as any).rawText,
            error: 'JSON extraction failed - response may be truncated'
          };
        }
      } else {
        // The response is already parsed JSON
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        responseFromModel = rawResponse;
      }
      
      console.log('LLM response processed successfully');
    } catch (err) {
      console.error('Error during LLM analysis:', err);
      throw new Error('Failed to analyze prompt with LLM');
    }

    // Step 4: Save response to DB
    preprocess.analyzedfilesLLM = responseFromModel as string;
    preprocess.updatedAt = new Date();

    await this.preprocessRepository.save(preprocess);
    console.log('LLM analysis saved to database');

    return responseFromModel as unknown;
  }

  async contentFilteration(query: { repo: string; username: string }) {
    const USERS_ROOT: string =
      this.configService.get<string>('USERS_ROOT') ||
      process.env.USERS_ROOT ||
      '';

    const extractPath = path.join(
      USERS_ROOT,
      query.username,
      query.repo,
      'extracted',
    );
    const outputPath = path.join(
      USERS_ROOT,
      query.username,
      query.repo,
      'filtered',
    );

    const project = await this.projectRepository.findOne({
      where: {
        projectname: query.repo,
        user: { username: query.username },
      },
      relations: ['user'],
    });

    if (!project) {
      throw new Error(
        `Project "${query.repo}" not found for user "${query.username}"`,
      );
    }

    const preprocess = await this.preprocessRepository.findOne({
      where: { project: { id: project.id } },
      relations: ['project'],
    });

    if (!preprocess || !preprocess.analyzedfilesLLM) {
      throw new Error('LLM analysis not found in Preprocess entity');
    }

    let responseFromModel: any = preprocess.analyzedfilesLLM;

    if (typeof responseFromModel === 'string') {
      try {
        responseFromModel = JSON.parse(responseFromModel) as Record<
          string,
          any
        >;
      } catch (err: any) {
        throw new Error(
          `Invalid JSON format in analyzedfilesLLM: ${errorMessage(err)}`,
        );
      }
    }

    const modelData = responseFromModel as Record<string, any>;
    if (!modelData || !modelData.fileIncluded) {
      throw new Error('Incomplete LLM response structure');
    }

    const fileCreated = await this.filterRepoService.copyFilesToTempBatch(
      modelData as { fileIncluded: Record<string, string[]> },
      extractPath,
      outputPath,
    );

    preprocess.contentFilteration = outputPath;
    preprocess.updatedAt = new Date();
    await this.preprocessRepository.save(preprocess);

    return fileCreated
      ? { success: true, message: 'Filtered repo created', outputPath }
      : { success: false, message: 'Failed to create filtered repo' };
  }

  async getRepoDiff(query: Record<string, string>) {
    const USERS_ROOT: string =
      this.configService.get<string>('USERS_ROOT') ||
      process.env.USERS_ROOT ||
      ''; // External storage path

    const extractedRepoPath = path.join(
      USERS_ROOT,
      query.username,
      query.repo,
      'extracted',
    );

    const filteredRepoPath = path.join(
      USERS_ROOT,
      query.username,
      query.repo,
      'filtered',
    );

    // Convert directory structures to arrays of file paths
    // extracted files
    const extractedRepoStructure =
      await this.extractMetadataService.buildDirectoryStructure(
        extractedRepoPath,
      );

    const extractedFiles = extractedRepoStructure
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !!line && !line.endsWith('/')); // Exclude directories

    // filtered files
    const filteredRepoStructure =
      await this.extractMetadataService.buildDirectoryStructure(
        filteredRepoPath,
      );

    const filteredFiles = filteredRepoStructure
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !!line && !line.endsWith('/')); // Exclude directories

    // Find removed files (present in extracted, not in filtered)
    const removedFiles = extractedFiles.filter(
      (file) => !filteredFiles.includes(file),
    );

    return {
      extractedRepoStructure,
      filteredRepoStructure,
      totalExtractedFiles: extractedFiles.length,
      totalFilteredFiles: filteredFiles.length,
      removedFiles,
    };
  }

  async generateBatchSummary(query: Record<string, string>) {
    const USERS_ROOT: string =
      this.configService.get<string>('USERS_ROOT') ||
      process.env.USERS_ROOT ||
      '';
    console.log({ USERS_ROOT });

    const filteredRepoPath = path.join(
      USERS_ROOT,
      query.username,
      query.repo,
      'filtered',
    );

    const summaryDirPath = path.join(
      USERS_ROOT,
      query.username,
      query.repo,
      'summary',
    );

    const summaryFilePath = path.join(summaryDirPath, 'batch-summary.txt');

    try {
      // Ensure summary directory exists
      await fs.promises.mkdir(summaryDirPath, { recursive: true });

      // Clear or create summary file
      await fs.promises.writeFile(summaryFilePath, '', 'utf8');

      await fs.promises.writeFile(summaryFilePath, '', 'utf8'); // Clear or create summary file

      const batchFolders = await fs.promises.readdir(filteredRepoPath, {
        withFileTypes: true,
      });

      const batchDirs = batchFolders.filter(
        (dirent) => dirent.isDirectory() && dirent.name.startsWith('batch'),
      );

      const batchSummaryMap: Record<string, string> = {};

      for (const batchDir of batchDirs) {
        const batchName = batchDir.name;
        const batchPath = path.join(filteredRepoPath, batchName);

        const filePaths: string[] =
          await this.collectFilesRecursively(batchPath);

        let batchPrompt = `You are a system architect. I want you to study the following files and their contents.\n`;
        batchPrompt += `Your goal is to construct a low-level mindmap. Provide a summary that helps build this mindmap.\n`;
        batchPrompt += `Use the following format:\n\n`;

        for (const filePath of filePaths) {
          const relativePath = path.relative(filteredRepoPath, filePath);
          const content = await fs.promises.readFile(filePath, 'utf8');

          batchPrompt += `--- FILE: ${relativePath} ---\n`;
          batchPrompt += `${content}\n\n`;
        }

        const batchSummary = (await this.generateSummaryService.generateSummary(
          batchPrompt,
          5000,
        )) as unknown;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const summaryText: string =
          typeof batchSummary === 'string'
            ? batchSummary
            : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              (batchSummary as any)?.rawText ||
              JSON.stringify(batchSummary, null, 2);

        batchSummaryMap[batchName] = summaryText;

        await fs.promises.appendFile(
          summaryFilePath,
          `=== ${batchName} ===\n${summaryText}\n\n`,
          'utf8',
        );
      }

      // Step: Store summary in Preprocess entity
      const project = await this.projectRepository.findOne({
        where: {
          projectname: query.repo,
          user: { username: query.username },
        },
        relations: ['user'],
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const preprocess = await this.preprocessRepository.findOne({
        where: { project: { id: project.id } },
        relations: ['project'],
      });

      if (!preprocess) {
        throw new Error('Preprocess entity not found');
      }

      preprocess.batchsummary = batchSummaryMap;
      preprocess.updatedAt = new Date();

      await this.preprocessRepository.save(preprocess);

      return { success: true, summaryFilePath };
    } catch (error) {
      console.error('Error generating batch summaries:', error);
      return { success: false, error: errorMessage(error) };
    }
  }

  async generateGraph(query: Record<string, string>): Promise<any> {
    const project = await this.projectsService.getProject(query);
    if (!project) {
      throw new Error('Project not found');
    }
    const preprocess: {
      buildprompt: string;
      analyzedfilesLLM: string;
      updatedAt: Date;
    } | null = await this.preprocessRepository.findOne({
      where: { project: { id: project.id } },
      relations: ['project'],
    });

    if (!preprocess || !preprocess.analyzedfilesLLM) {
      throw new Error('Preprocess not found');
    }

    const cleanedLLMResponse = this.extractJsonFromResponse(
      preprocess.analyzedfilesLLM,
    ) as Record<string, any>;
    const USERS_ROOT: string =
      this.configService.get<string>('USERS_ROOT') ||
      process.env.USERS_ROOT ||
      '';

    const filteredRepoPath = path.join(
      USERS_ROOT,
      query.username,
      query.repo,
      'graph',
    );
    const extractedRepoPath = path.join(
      USERS_ROOT,
      query.username,
      query.repo,
      'extracted',
    );
    const graphGenerator = new GraphGenerator(this.neo4jService);
    return graphGenerator.generateGraph({
      filteredRepoPath,
      extractedRepoPath,
      llmResponse: cleanedLLMResponse,
      repo: query.repo, // Add the missing repo parameter
      username: query.username, // Also add username for completeness
    });
  }

  /**
   * 🎯 NEW ENDPOINT 1: Generate JSON Files Only
   * Extracts functions and creates JSON files without Neo4j graph creation
   */
  async generateJsonFiles(query: Record<string, string>): Promise<any> {
    console.log('🚀 Starting JSON files generation...');

    try {
      // Step 1: Validate project exists
      const project = await this.projectsService.getProject(query);
      if (!project) {
        throw new Error('Project not found');
      }

      // Step 2: Get LLM response from database
      const preprocess: {
        buildprompt: string;
        analyzedfilesLLM: string;
        updatedAt: Date;
      } | null = await this.preprocessRepository.findOne({
        where: { project: { id: project.id } },
        relations: ['project'],
      });

      if (!preprocess || !preprocess.analyzedfilesLLM) {
        throw new Error(
          'Preprocess not found. Please run analyzeWithLLM first.',
        );
      }

      // Step 3: Parse LLM response
      const cleanedLLMResponse = this.extractJsonFromResponse(
        preprocess.analyzedfilesLLM,
      ) as Record<string, any>;

      console.log('📊 LLM Response parsed successfully:', {
        detectedLanguages: Object.keys(cleanedLLMResponse.fileIncluded || {}),
        totalFiles: Object.values(cleanedLLMResponse.fileIncluded || {}).flat()
          .length,
      });

      // Step 4: Setup paths
      const USERS_ROOT: string =
        this.configService.get<string>('USERS_ROOT') ||
        process.env.USERS_ROOT ||
        '';

      const filteredRepoPath = path.join(
        USERS_ROOT,
        query.username,
        query.repo,
        'functions', // Changed from 'graph' to 'functions' for clarity
      );
      const extractedRepoPath = path.join(
        USERS_ROOT,
        query.username,
        query.repo,
        'extracted',
      );

      // Step 5: Validate extracted repo exists
      if (!(await this.directoryExists(extractedRepoPath))) {
        throw new Error(
          `Extracted repository not found at: ${extractedRepoPath}`,
        );
      }

      // Step 6: Create GraphGenerator instance (without Neo4j for JSON-only)
      const graphGenerator = new GraphGenerator(); // No Neo4j service

      // Step 7: Generate JSON files using the existing logic
      const result = await graphGenerator.generateJsonFilesOnly({
        filteredRepoPath,
        extractedRepoPath,
        llmResponse: cleanedLLMResponse,
        repo: query.repo,
        username: query.username,
      });

      console.log('✅ JSON files generation completed successfully');
      return result;
    } catch (error) {
      console.error('❌ Error in generateJsonFiles:', error);
      throw error;
    }
  }

  /**
   * 🎯 NEW ENDPOINT 2: Create Neo4j Graph Only
   * Reads JSON files and creates Neo4j graph without regenerating JSON files
   */
  async createNeo4jGraph(query: Record<string, string>): Promise<any> {
    console.log('🚀 Starting Neo4j graph creation...');

    try {
      // Step 1: Validate project exists
      const project = await this.projectsService.getProject(query);
      if (!project) {
        throw new Error('Project not found');
      }

      // Step 2: Check if Neo4j service is available
      if (!this.neo4jService) {
        throw new Error('Neo4j service not available');
      }

      // Step 3: Setup paths
      const USERS_ROOT: string =
        this.configService.get<string>('USERS_ROOT') ||
        process.env.USERS_ROOT ||
        '';

      const functionsDir = path.join(
        USERS_ROOT,
        query.username,
        query.repo,
        'functions',
        'functions', // JSON files are in nested structure
      );

      // Step 4: Validate functions directory exists
      if (!(await this.directoryExists(functionsDir))) {
        throw new Error(
          `Functions directory not found at: ${functionsDir}. Please run generateJsonFiles first.`,
        );
      }

      // Step 5: Read and parse JSON files
      console.log('📂 Reading JSON files from:', functionsDir);
      const functionsData = await this.readJsonFiles(functionsDir);

      if (functionsData.length === 0) {
        throw new Error('No function data found in JSON files');
      }

      console.log(`📊 Found ${functionsData.length} functions in JSON files`);

      // Step 6: Create GraphGenerator instance with Neo4j
      const graphGenerator = new GraphGenerator(this.neo4jService);

      // Step 7: Create Neo4j graph using existing logic
      const result = await graphGenerator.createNeo4jGraphOnly({
        functionsData,
        repo: query.repo,
        username: query.username,
      });

      console.log('✅ Neo4j graph creation completed successfully');
      return result;
    } catch (error) {
      console.error('❌ Error in createNeo4jGraph:', error);
      throw error;
    }
  }

  /**
   * Helper method to read all JSON files from functions directory
   */
  private async readJsonFiles(functionsDir: string): Promise<any[]> {
    const functionsData: any[] = [];

    try {
      // Get all JSON files recursively
      const jsonFiles = await this.getAllJsonFiles(functionsDir);
      console.log(`📄 Found ${jsonFiles.length} JSON files to process`);

      for (const jsonFile of jsonFiles) {
        try {
          const content = await fs.promises.readFile(jsonFile, 'utf8');
          const functionData = JSON.parse(content);
          functionsData.push(functionData);
        } catch (error) {
          console.error(`❌ Error reading JSON file ${jsonFile}:`, error);
          // Continue with other files
        }
      }

      return functionsData;
    } catch (error) {
      console.error('❌ Error reading JSON files:', error);
      throw error;
    }
  }

  /**
   * Helper method to get all JSON files recursively
   */
  private async getAllJsonFiles(dir: string): Promise<string[]> {
    const jsonFiles: string[] = [];

    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively search subdirectories
          const subFiles = await this.getAllJsonFiles(fullPath);
          jsonFiles.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          jsonFiles.push(fullPath);
        }
      }

      return jsonFiles;
    } catch (error) {
      console.error(`❌ Error scanning directory ${dir}:`, error);
      return [];
    }
  }

  async cleanNeo4j(query: Record<string, string>): Promise<any> {
    console.log('🧹 Starting Neo4j database cleanup...');

    if (!this.neo4jService) {
      throw new Error('Neo4j service not available');
    }

    const session = this.neo4jService.getSession();

    try {
      // Option 1: Clean everything
      if (query.all === 'true') {
        console.log('🧹 Deleting ALL nodes and relationships...');
        await session.run('MATCH (n) DETACH DELETE n');
        return {
          success: true,
          action: 'cleaned_all',
          message: 'All nodes and relationships deleted',
        };
      }

      // Option 2: Clean specific project
      if (query.project) {
        console.log(`🧹 Cleaning project: ${query.project}`);

        // Delete functions for this project
        await session.run(
          'MATCH (f:Function) WHERE f.filePath STARTS WITH $projectPrefix DETACH DELETE f',
          { projectPrefix: query.project },
        );

        // Delete project node
        await session.run('MATCH (p:Project {name: $projectName}) DELETE p', {
          projectName: query.project,
        });

        return {
          success: true,
          action: 'cleaned_project',
          project: query.project,
          message: `Project ${query.project} and its functions deleted`,
        };
      }

      // Option 3: Clean all projects but keep structure
      console.log('🧹 Cleaning all projects and functions...');
      await session.run('MATCH (f:Function) DETACH DELETE f');
      await session.run('MATCH (p:Project) DELETE p');

      return {
        success: true,
        action: 'cleaned_projects',
        message: 'All projects and functions deleted',
      };
    } finally {
      await session.close();
    }
  }

  async listJsonFiles(query: Record<string, string>): Promise<any> {
    console.log('📂 Listing JSON files for project...');

    // Validate required parameters
    if (!query.repo || !query.username) {
      throw new Error('Missing required parameters: repo and username');
    }

    const USERS_ROOT: string =
      this.configService.get<string>('USERS_ROOT') ||
      process.env.USERS_ROOT ||
      '/Users/praveen-ncompass/mindmap';

    // Construct safe path to functions directory
    const functionsDir = path.join(
      USERS_ROOT,
      query.username,
      query.repo,
      'graph',
      'functions',
    );

    console.log(`📁 Looking for JSON files in: ${functionsDir}`);

    try {
      // Check if directory exists
      if (!(await this.directoryExists(functionsDir))) {
        return {
          success: false,
          message: 'No JSON files found. Generate graph first.',
          functionsDir,
          files: [],
        };
      }

      // Recursively scan for JSON files in file-based structure
      const jsonFiles: Array<{
        functionName: string;
        filePath: string;
        relativePath: string;
        size: number;
        modifiedAt: Date;
      }> = [];

      // Helper function to recursively scan directories
      const scanDirectory = async (
        dirPath: string,
        relativeDirPath: string = '',
      ) => {
        const entries = await fs.promises.readdir(dirPath, {
          withFileTypes: true,
        });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relativeEntryPath = relativeDirPath
            ? path.join(relativeDirPath, entry.name)
            : entry.name;

          if (entry.isDirectory()) {
            // Recursively scan subdirectories
            await scanDirectory(fullPath, relativeEntryPath);
          } else if (entry.isFile() && entry.name.endsWith('.json')) {
            // Found a JSON file
            const functionName = path.parse(entry.name).name; // Remove .json extension
            const sourceFilePath = relativeDirPath; // The directory path represents the source file

            try {
              const stats = await fs.promises.stat(fullPath);
              jsonFiles.push({
                functionName,
                filePath: fullPath,
                relativePath: `functions/${sourceFilePath}/${entry.name}`,
                size: stats.size,
                modifiedAt: stats.mtime,
              });
            } catch (error) {
              console.log(
                `⚠️ Error reading JSON file stats: ${fullPath} ${errorMessage(error)}`,
              );
            }
          }
        }
      };

      // Start scanning from the functions directory
      await scanDirectory(functionsDir);

      // Sort by function name
      jsonFiles.sort((a, b) => a.functionName.localeCompare(b.functionName));

      console.log(`✅ Found ${jsonFiles.length} JSON files`);

      return {
        success: true,
        project: {
          repo: query.repo,
          username: query.username,
          functionsDir,
        },
        totalFiles: jsonFiles.length,
        files: jsonFiles.map((file) => ({
          functionName: file.functionName,
          relativePath: file.relativePath,
          size: file.size,
          modifiedAt: file.modifiedAt,
        })),
      };
    } catch (error) {
      console.error('❌ Error listing JSON files:', error);
      throw new Error(`Failed to list JSON files: ${error.message}`);
    }
  }

  async getJsonFile(query: Record<string, string>): Promise<any> {
    console.log('📄 Retrieving JSON file content...');

    // Validate required parameters
    if (!query.repo || !query.username || !query.relativePath) {
      throw new Error(
        'Missing required parameters: repo, username, and relativePath',
      );
    }

    const USERS_ROOT: string =
      this.configService.get<string>('USERS_ROOT') ||
      process.env.USERS_ROOT ||
      '/Users/praveen-ncompass/mindmap';

    // Parse and validate the relative path
    const relativePath = query.relativePath;

    // Security: Ensure relativePath starts with "functions/" and doesn't contain path traversal
    if (
      !relativePath.startsWith('functions/') ||
      relativePath.includes('..') ||
      relativePath.includes('//') ||
      !relativePath.endsWith('.json')
    ) {
      throw new Error('Invalid relativePath format or security violation');
    }

    // Construct safe absolute path
    const jsonFilePath = path.join(
      USERS_ROOT,
      query.username,
      query.repo,
      'graph',
      relativePath,
    );

    console.log(`📁 Reading JSON file: ${jsonFilePath}`);

    try {
      // Security check: ensure path is within expected directory
      const expectedBasePath = path.join(
        USERS_ROOT,
        query.username,
        query.repo,
        'graph',
        'functions',
      );
      if (!jsonFilePath.startsWith(expectedBasePath)) {
        throw new Error('Invalid file path - security violation');
      }

      // Check if file exists
      const fileExists = await fs.promises
        .access(jsonFilePath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) {
        return {
          success: false,
          message: `JSON file not found at path: ${relativePath}`,
          relativePath: relativePath,
          fullPath: jsonFilePath,
        };
      }

      // Read file content
      const fileContent = await fs.promises.readFile(jsonFilePath, 'utf8');
      const jsonData = JSON.parse(fileContent);
      const stats = await fs.promises.stat(jsonFilePath);

      console.log(`✅ Successfully read JSON file at: ${relativePath}`);

      return {
        success: true,
        relativePath: relativePath,
        functionName: jsonData.functionName, // Get actual function name from content
        size: stats.size,
        modifiedAt: stats.mtime,
        content: jsonData,
      };
    } catch (error: any) {
      console.error(`❌ Error reading JSON file at ${relativePath}:`, error);

      if (error.message.includes('security violation')) {
        throw error; // Re-throw security errors
      }

      throw new Error(`Failed to read JSON file: ${error.message}`);
    }
  }

  // Security helper: sanitize filename to prevent path traversal
  // private sanitizeFileName(fileName: string): string {
  //   // Remove any path separators and dangerous characters
  //   return fileName
  //     .replace(/[\/\\\.\.]/g, '') // Remove path separators and dots
  //     .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace unsafe chars with underscore
  //     .substring(0, 100); // Limit length
  // }

  // Helper to check if directory exists
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  // Helper to recursively collect all file paths in a directory
  async collectFilesRecursively(dir: string): Promise<string[]> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const nestedFiles = await this.collectFilesRecursively(fullPath);
        files.push(...nestedFiles);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  async getBatchSummary(query: Record<string, string>) {
    // Step 1: Find the project
    const project = await this.projectRepository.findOne({
      where: {
        projectname: query.repo,
        user: { username: query.username },
      },
      relations: ['user'],
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Step 2: Fetch Preprocess entity
    const preprocess = await this.preprocessRepository.findOne({
      where: { project: { id: project.id } },
      relations: ['project'],
    });

    if (!preprocess || !preprocess.batchsummary) {
      throw new Error('Batch summary not found in Preprocess entity');
    }

    // Step 3: Format summary as a neat string
    const formattedSummary = Object.entries(preprocess.batchsummary)
      .map(
        ([batchName, summary]) =>
          `=== ${batchName} ===\n${(summary as string).trim()}\n`,
      )
      .join('\n');

    return { summaryContent: formattedSummary };
  }

  /**
   * Extract valid JSON from LLM response that may be wrapped in markdown code blocks
   */
  private extractJsonFromResponse(response: any): any {
    let responseText: string;

    // Handle different response types
    if (typeof response === 'string') {
      responseText = response;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    } else if (response && typeof response.rawText === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      responseText = response.rawText;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    } else if (response && typeof response.content === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      responseText = response.content;
    } else {
      responseText = JSON.stringify(response);
    }

    console.log('Processing LLM response, length:', responseText.length);

    // Try to extract JSON from markdown code blocks
    const jsonBlockMatch = responseText.match(
      /```(?:json)?\s*\n([\s\S]*?)\n```/,
    );
    if (jsonBlockMatch) {
      try {
        const jsonContent = jsonBlockMatch[1].trim();
        return JSON.parse(jsonContent);
      } catch (err) {
        console.warn(
          'Failed to parse JSON from code block, trying to fix truncated JSON',
          err,
        );
        // Try to fix truncated JSON by attempting to close incomplete structures
        const jsonContent = jsonBlockMatch[1].trim();
        const fixedJson = this.attemptToFixTruncatedJson(jsonContent);
        if (fixedJson) {
          return fixedJson;
        }
      }
    }

    // Try to find JSON object boundaries
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.warn('Failed to parse extracted JSON object, attempting to fix', err);
        const fixedJson = this.attemptToFixTruncatedJson(jsonMatch[0]);
        if (fixedJson) {
          return fixedJson;
        }
      }
    }

    // Try direct JSON parse as fallback
    try {
      return JSON.parse(responseText);
    } catch (err) {
      console.error(
        'Failed to extract valid JSON from LLM response:',
        responseText.substring(0, 500) + '...',
        err,
      );
      
      // Last attempt: try to fix truncated JSON
      const fixedJson = this.attemptToFixTruncatedJson(responseText);
      if (fixedJson) {
        console.log('Successfully recovered from truncated JSON');
        return fixedJson;
      }
      
      console.error('LLM did not return valid JSON. All parsing attempts failed.');
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

  // Get graph data for D3.js visualization
  async getMindmapData(query: Record<string, string>): Promise<any> {
    console.log('🧠 Fetching mindmap data for flow-based visualization...');

    if (!query.repo || !query.username) {
      throw new Error('Missing required parameters: repo and username');
    }

    if (!this.neo4jService) {
      throw new Error('Neo4j service not available');
    }

    const session = this.neo4jService.getSession();

    try {
      const projectName = query.repo;
      const detailLevel = query.detailLevel || 'all'; // 'all' or 'exported'

      // 1. Get all functions and their metadata
      console.log(
        `🔍 Querying functions for mindmap (detail: ${detailLevel})...`,
      );
      const functionsQuery =
        detailLevel === 'exported'
          ? `MATCH (f:Function) 
           WHERE f.isEntryPoint = true OR f.isExported = true
           RETURN f.id as id, f.name as name, f.filePath as filePath, 
                  f.jsonFilePath as jsonFilePath,
                  f.starts as starts, f.ends as ends, f.language as language,
                  f.module as module, f.functionType as functionType, 
                  f.complexity as complexity, f.isEntryPoint as isEntryPoint,
                  f.dependsOnCount as dependsOnCount, f.usedByCount as usedByCount,
                  f.executionLevel as executionLevel, f.callDepth as callDepth,
                  f.isLeafFunction as isLeafFunction, f.executionPath as executionPath,
                  f.hierarchyId as hierarchyId`
          : `MATCH (f:Function) 
           RETURN f.id as id, f.name as name, f.filePath as filePath, 
                  f.jsonFilePath as jsonFilePath,
                  f.starts as starts, f.ends as ends, f.language as language,
                  f.module as module, f.functionType as functionType, 
                  f.complexity as complexity, f.isEntryPoint as isEntryPoint,
                  f.dependsOnCount as dependsOnCount, f.usedByCount as usedByCount,
                  f.executionLevel as executionLevel, f.callDepth as callDepth,
                  f.isLeafFunction as isLeafFunction, f.executionPath as executionPath,
                  f.hierarchyId as hierarchyId`;

      const functionsResult = await session.run(functionsQuery);

      // 2. Get all relationships with detailed flow information
      console.log(`🔗 Querying execution flow relationships...`);
      const relationshipsResult = await session.run(
        `MATCH (caller:Function)-[r:DEPENDS_ON]->(callee:Function)
         RETURN caller.id as sourceId, callee.id as targetId, 
                caller.name as sourceName, callee.name as targetName,
                caller.module as sourceModule, callee.module as targetModule,
                r.calledAtLine as calledAtLine, r.targetStarts as targetStarts, 
                r.targetEnds as targetEnds`,
      );

      // 3. Calculate execution flow layers (depth from entry points)
      const nodes = functionsResult.records.map((record) => {
        const functionType = record.get('functionType') || 'business-logic';
        const dependsOnCount = record.get('dependsOnCount') || 0;
        const usedByCount = record.get('usedByCount') || 0;
        const isEntryPoint = record.get('isEntryPoint') || false;

        // Execution sequence properties
        const executionLevel = record.get('executionLevel') || 0;
        const callDepth = record.get('callDepth') || 0;
        const isLeafFunction = record.get('isLeafFunction') || false;
        const executionPath = record.get('executionPath') || '';
        const hierarchyId = record.get('hierarchyId') || '';

        return {
          id: record.get('id'),
          name: record.get('name'),
          filePath: record.get('filePath'),
          module: record.get('module'),
          language: record.get('language'),
          starts: record.get('starts'),
          ends: record.get('ends'),
          functionType,
          complexity: record.get('complexity') || 1,
          isEntryPoint,
          dependsOnCount,
          usedByCount,
          totalConnections: dependsOnCount + usedByCount,
          // Flow-specific properties
          executionLayer: 0, // Will be calculated
          isTerminal: usedByCount === 0,
          isCritical: dependsOnCount + usedByCount > 5,
          relativePath: record.get('jsonFilePath'), // Convert to JSON file path
          // Execution sequence properties
          executionLevel,
          callDepth,
          isLeafFunction,
          executionPath: executionPath ? executionPath.split(' -> ') : [],
          hierarchyId,
        };
      });

      const relationships = relationshipsResult.records.map((record) => ({
        source: record.get('sourceId'),
        target: record.get('targetId'),
        sourceName: record.get('sourceName'),
        targetName: record.get('targetName'),
        sourceModule: record.get('sourceModule'),
        targetModule: record.get('targetModule'),
        calledAtLine: record.get('calledAtLine'),
        targetStarts: record.get('targetStarts'),
        targetEnds: record.get('targetEnds'),
        type: 'DEPENDS_ON',
        isCrossModule:
          record.get('sourceModule') !== record.get('targetModule'),
      }));

      // 4. Calculate execution layers using BFS from entry points
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const entryPoints = nodes.filter((n) => n.isEntryPoint);

      // BFS to assign execution layers
      const visited = new Set<string>();
      const queue: { nodeId: string; layer: number }[] = [];

      // Start with entry points at layer 0
      entryPoints.forEach((entry) => {
        entry.executionLayer = 0;
        queue.push({ nodeId: entry.id, layer: 0 });
        visited.add(entry.id);
      });

      while (queue.length > 0) {
        const { nodeId, layer } = queue.shift();
        const dependentRels = relationships.filter((r) => r.source === nodeId);

        dependentRels.forEach((rel) => {
          const targetNode = nodeMap.get(rel.target);
          if (targetNode && !visited.has(rel.target)) {
            targetNode.executionLayer = layer + 1;
            queue.push({ nodeId: rel.target, layer: layer + 1 });
            visited.add(rel.target);
          }
        });
      }

      // 5. Group by modules for layout optimization
      const moduleGroups = nodes.reduce(
        (groups, node) => {
          if (!groups[node.module]) {
            groups[node.module] = {
              name: node.module,
              functions: [],
              entryPoints: [],
              maxLayer: 0,
              connectionCount: 0,
            };
          }
          groups[node.module].functions.push(node);
          if (node.isEntryPoint) groups[node.module].entryPoints.push(node);
          groups[node.module].maxLayer = Math.max(
            groups[node.module].maxLayer,
            node.executionLayer,
          );
          groups[node.module].connectionCount += node.totalConnections;
          return groups;
        },
        {} as Record<string, any>,
      );

      // 6. Calculate flow paths for highlighting
      const flowPaths = this.calculateCriticalPaths(
        entryPoints,
        relationships,
        nodeMap,
      );

      // 7. Statistics for mindmap
      const stats = {
        totalNodes: nodes.length,
        totalRelationships: relationships.length,
        entryPoints: entryPoints.length,
        executionLayers: Math.max(...nodes.map((n) => n.executionLayer), 0) + 1,
        modules: Object.keys(moduleGroups),
        languages: [...new Set(nodes.map((n) => n.language))],
        criticalFunctions: nodes.filter((n) => n.isCritical).length,
        terminalFunctions: nodes.filter((n) => n.isTerminal).length,
        crossModuleConnections: relationships.filter((r) => r.isCrossModule)
          .length,
        averageComplexity:
          nodes.length > 0
            ? Math.round(
                (nodes.reduce((sum, n) => sum + n.complexity, 0) /
                  nodes.length) *
                  100,
              ) / 100
            : 0,
      };

      console.log(
        `✅ Mindmap data prepared: ${stats.totalNodes} nodes across ${stats.executionLayers} layers`,
      );

      return {
        success: true,
        project: {
          name: projectName,
          username: query.username,
          detailLevel,
        },
        mindmap: {
          nodes,
          relationships,
          moduleGroups,
          flowPaths,
        },
        layout: {
          type: 'flow-based',
          executionLayers: stats.executionLayers,
          entryPoints: entryPoints.map((ep) => ep.id),
        },
        statistics: stats,
        metadata: {
          generatedAt: new Date().toISOString(),
          optimizedFor: 'react-flow',
        },
      };
    } catch (error) {
      console.error('❌ Error fetching mindmap data:', error);
      throw new Error(`Failed to fetch mindmap data: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  // Helper method to convert function ID to JSON file path
  private convertFunctionIdToJsonPath(functionId: string): string {
    if (functionId.includes('#')) {
      const [filePath, functionName] = functionId.split('#');
      return `functions/${filePath}/${functionName}.json`;
    }
    // Fallback if no # found
    return `functions/${functionId}.json`;
  }

  // Helper method to calculate critical execution paths
  private calculateCriticalPaths(
    entryPoints: any[],
    relationships: any[],
    nodeMap: Map<string, any>,
  ): any[] {
    const paths: any[] = [];

    entryPoints.forEach((entry) => {
      const path = this.tracePath(
        entry.id,
        relationships,
        nodeMap,
        new Set(),
        [],
      );
      if (path.length > 3) {
        // Only include significant paths
        paths.push({
          id: `path-${entry.id}`,
          startNode: entry.id,
          nodes: path,
          length: path.length,
          type: 'critical-flow',
        });
      }
    });

    return paths.sort((a, b) => b.length - a.length).slice(0, 10); // Top 10 longest paths
  }

  // Helper method to trace execution path from a starting node
  private tracePath(
    nodeId: string,
    relationships: any[],
    nodeMap: Map<string, any>,
    visited: Set<string>,
    currentPath: string[],
  ): string[] {
    if (visited.has(nodeId)) return currentPath;

    visited.add(nodeId);
    currentPath.push(nodeId);

    const dependencies = relationships.filter((r) => r.source === nodeId);
    if (dependencies.length === 0) return currentPath; // Terminal node

    // Follow the most critical dependency (highest connection count)
    const nextDep = dependencies.reduce((prev, curr) => {
      const prevNode = nodeMap.get(prev.target);
      const currNode = nodeMap.get(curr.target);
      return (currNode?.totalConnections || 0) >
        (prevNode?.totalConnections || 0)
        ? curr
        : prev;
    });

    return this.tracePath(
      nextDep.target,
      relationships,
      nodeMap,
      new Set(visited),
      [...currentPath],
    );
  }

  async getGraphData(query: Record<string, string>): Promise<any> {
    console.log('📊 Fetching graph data for D3.js visualization...');

    if (!query.repo || !query.username) {
      throw new Error('Missing required parameters: repo and username');
    }

    if (!this.neo4jService) {
      throw new Error('Neo4j service not available');
    }

    const session = this.neo4jService.getSession();

    try {
      const projectName = query.repo;

      // Fetch all functions (for now, we'll get all functions since we only have one project)
      console.log(`🔍 Querying all functions in the database...`);
      const functionsResult = await session.run(
        `MATCH (f:Function) 
         RETURN f.id as id, f.name as name, f.filePath as filePath, 
                f.starts as starts, f.ends as ends, f.language as language,
                f.module as module, f.functionType as functionType, 
                f.complexity as complexity, f.isEntryPoint as isEntryPoint,
                f.dependsOnCount as dependsOnCount, f.usedByCount as usedByCount`,
      );

      // Fetch all DEPENDS_ON relationships (for now, get all relationships)
      console.log(`🔗 Querying all relationships in the database...`);
      const relationshipsResult = await session.run(
        `MATCH (caller:Function)-[r:DEPENDS_ON]->(callee:Function)
         RETURN caller.id as sourceId, callee.id as targetId, 
                r.calledAtLine as calledAtLine, r.targetStarts as targetStarts, 
                r.targetEnds as targetEnds`,
      );

      // Transform nodes for D3.js
      const nodes = functionsResult.records.map((record) => {
        const functionType = record.get('functionType') || 'business-logic';
        const dependsOnCount = record.get('dependsOnCount') || 0;
        const usedByCount = record.get('usedByCount') || 0;

        return {
          id: record.get('id'),
          name: record.get('name'),
          group: functionType, // for color coding in D3.js
          filePath: record.get('filePath'),
          module: record.get('module'),
          language: record.get('language'),
          starts: record.get('starts'),
          ends: record.get('ends'),
          complexity: record.get('complexity') || 1,
          isEntryPoint: record.get('isEntryPoint') || false,
          dependsOnCount: dependsOnCount,
          usedByCount: usedByCount,
          size: Math.max(5, Math.min(20, (dependsOnCount + usedByCount) * 2)), // Node size based on connections
          totalConnections: dependsOnCount + usedByCount,
        };
      });

      // Transform relationships for D3.js
      const links = relationshipsResult.records.map((record) => ({
        source: record.get('sourceId'), // D3.js will resolve these to node objects
        target: record.get('targetId'),
        type: 'DEPENDS_ON',
        calledAtLine: record.get('calledAtLine'),
        targetStarts: record.get('targetStarts'),
        targetEnds: record.get('targetEnds'),
        strength: 1, // Can be adjusted based on call frequency
      }));

      // Calculate graph statistics
      const stats = {
        totalNodes: nodes.length,
        totalLinks: links.length,
        entryPoints: nodes.filter((n) => n.isEntryPoint).length,
        languages: [...new Set(nodes.map((n) => n.language))],
        modules: [...new Set(nodes.map((n) => n.module))],
        functionTypes: [...new Set(nodes.map((n) => n.group))],
        averageConnections:
          nodes.length > 0
            ? Math.round(
                (nodes.reduce((sum, n) => sum + n.totalConnections, 0) /
                  nodes.length) *
                  100,
              ) / 100
            : 0,
        maxConnections: Math.max(...nodes.map((n) => n.totalConnections), 0),
        isolatedFunctions: nodes.filter((n) => n.totalConnections === 0).length,
      };

      console.log(
        `✅ Graph data prepared: ${stats.totalNodes} nodes, ${stats.totalLinks} links`,
      );

      return {
        success: true,
        project: {
          name: projectName,
          username: query.username,
        },
        graph: {
          nodes,
          links,
        },
        statistics: stats,
        metadata: {
          generatedAt: new Date().toISOString(),
          queryTime: Date.now(),
        },
      };
    } catch (error) {
      console.error('❌ Error fetching graph data:', error);
      throw new Error(`Failed to fetch graph data: ${error.message}`);
    } finally {
      await session.close();
    }
  }
}
