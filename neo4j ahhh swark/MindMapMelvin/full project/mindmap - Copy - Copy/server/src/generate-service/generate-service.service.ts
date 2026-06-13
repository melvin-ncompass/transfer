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

  async generateWorkflow(body: any) {
    try {
      const { nodeData, username, repo  } = body;
      const parentFile =  `extracted/${nodeData.id.split('#')[0]}`
      if (!nodeData) {
        throw new BadRequestException('Node data is required');
      }

      const USERS_ROOT = this.configService.get<string>('USERS_ROOT') || process.env.USERS_ROOT || './users';
      
      let parentFileContent = null;
      let parentFileError = null;
      let functionDependencies = [];
      let dependencyExtractionErrors = [];

      // Read parent file content
      if (parentFile && username && repo) {
        try {
          const repoRoot = path.join(USERS_ROOT, username, repo);
          const parentFilePath = path.isAbsolute(parentFile) 
            ? parentFile 
            : path.join(repoRoot, parentFile);

          this.logger.log(`Attempting to read parent file: ${parentFilePath}`);
          
          if (fs.existsSync(parentFilePath)) {
            parentFileContent = await fs.promises.readFile(parentFilePath, 'utf8');
            this.logger.log(`Successfully read parent file: ${parentFilePath.slice(-50)} (${parentFileContent.length} chars)`);
          } else {
            // Try alternative file extensions if exact file doesn't exist
            const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c'];
            const basePath = parentFilePath.replace(/\.[^/.]+$/, ''); // Remove existing extension
            
            for (const ext of extensions) {
              const altPath = basePath + ext;
              if (fs.existsSync(altPath)) {
                parentFileContent = await fs.promises.readFile(altPath, 'utf8');
                this.logger.log(`Found parent file with extension: ${altPath}`);
                break;
              }
            }
            
            if (!parentFileContent) {
              this.logger.warn(`Parent file not found: ${parentFilePath}`);
              parentFileError = `Parent file not found: ${parentFilePath}`;
            }
          }
        } catch (fileError) {
          this.logger.error(`Error reading parent file: ${fileError.message}`);
          parentFileError = `Error reading parent file: ${fileError.message}`;
        }
      }

      // Load graph data to get dependency information
      let graphData = null;
      try {
        // Try to read the graph data file directly as JSON-like content
        const graphDataPath = path.join(process.cwd(), '../client/src/data/graphData.ts');
        const altGraphDataPath = path.resolve(__dirname, '../../../client/src/data/graphData.ts');
        
        let graphFilePath = null;
        if (fs.existsSync(graphDataPath)) {
          graphFilePath = graphDataPath;
        } else if (fs.existsSync(altGraphDataPath)) {
          graphFilePath = altGraphDataPath;
        }

        if (graphFilePath) {
          this.logger.log(`Reading graph data from: ${graphFilePath}`);
          const graphFileContent = await fs.promises.readFile(graphFilePath, 'utf8');
          
          // Extract the graph object manually - look for the const graph = { ... }; pattern
          const graphMatch = graphFileContent.match(/const graph = (\{[\s\S]*?\});/);
          if (graphMatch) {
            const graphString = graphMatch[1];
            // Use Function constructor for safer evaluation than eval
            const parseGraph = new Function('return ' + graphString);
            graphData = parseGraph();
            this.logger.log(`Successfully loaded graph data with ${graphData?.data?.graph?.nodes?.length || 0} nodes`);
          } else {
            this.logger.warn('Could not find graph object in graphData.ts file');
          }
        } else {
          this.logger.warn('GraphData.ts file not found in expected locations');
        }
      } catch (graphError) {
        this.logger.warn(`Could not load graph data: ${graphError.message}`);
      }

      // Extract function dependencies recursively
      if (graphData && nodeData.hasChildren && nodeData.children) {
        this.logger.log(`Processing ${nodeData.children.length} children nodes for function extraction`);
        
        const processedNodes = new Set(); // Prevent infinite recursion
        const repoRoot = path.join(USERS_ROOT, username, repo);

        const extractFunctionDependencies = async (nodeId: string, depth: number = 0, maxDepth: number = 3) => {
          if (depth > maxDepth || processedNodes.has(nodeId)) {
            return;
          }
          
          processedNodes.add(nodeId);
          
          // Find the node in graph data
          const graphNode = graphData.data.graph.nodes.find(n => n.id === nodeId);
          if (!graphNode) {
            this.logger.warn(`Node not found in graph data: ${nodeId}`);
            return;
          }

          try {
            // Extract file content for this function
            const functionFilePath = path.join(repoRoot, 'extracted', graphNode.filePath);
            
            if (fs.existsSync(functionFilePath)) {
              const fullFileContent = await fs.promises.readFile(functionFilePath, 'utf8');
              const fileLines = fullFileContent.split('\n');
              
              // Extract function lines using starts and ends
              const functionLines = fileLines.slice(graphNode.starts - 1, graphNode.ends);
              const functionContent = functionLines.join('\n');
              
              functionDependencies.push({
                nodeId: graphNode.id,
                name: graphNode.name,
                filePath: graphNode.filePath,
                starts: graphNode.starts,
                ends: graphNode.ends,
                content: functionContent,
                depth: depth,
                complexity: graphNode.complexity,
                group: graphNode.group
              });

              this.logger.log(`Extracted function ${graphNode.name} (${functionContent.length} chars, depth: ${depth})`);

              // Find dependencies of this node
              const dependencies = graphData.data.graph.links.filter(link => link.source === nodeId);
              for (const dep of dependencies) {
                await extractFunctionDependencies(dep.target, depth + 1, maxDepth);
              }
              
            } else {
              // Try alternative extensions
              const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c'];
              const basePath = functionFilePath.replace(/\.[^/.]+$/, '');
              let found = false;
              
              for (const ext of extensions) {
                const altPath = basePath + ext;
                if (fs.existsSync(altPath)) {
                  const fullFileContent = await fs.promises.readFile(altPath, 'utf8');
                  const fileLines = fullFileContent.split('\n');
                  const functionLines = fileLines.slice(graphNode.starts - 1, graphNode.ends);
                  const functionContent = functionLines.join('\n');
                  
                  functionDependencies.push({
                    nodeId: graphNode.id,
                    name: graphNode.name,
                    filePath: graphNode.filePath,
                    starts: graphNode.starts,
                    ends: graphNode.ends,
                    content: functionContent,
                    depth: depth,
                    complexity: graphNode.complexity,
                    group: graphNode.group
                  });

                  this.logger.log(`Extracted function ${graphNode.name} from ${altPath} (${functionContent.length} chars, depth: ${depth})`);
                  found = true;
                  break;
                }
              }
              
              if (!found) {
                dependencyExtractionErrors.push({
                  nodeId: graphNode.id,
                  name: graphNode.name,
                  error: `Function file not found: ${functionFilePath}`
                });
              }
            }
          } catch (error) {
            dependencyExtractionErrors.push({
              nodeId: graphNode.id,
              name: graphNode.name,
              error: `Error extracting function: ${error.message}`
            });
          }
        };

        // Start extraction from each direct child
        for (const child of nodeData.children) {
          await extractFunctionDependencies(child.id, 0);
        }
      }

      // Calculate expected minimum nodes for logging and validation
      const totalFunctionsAnalyzed = 1 + (functionDependencies.length || 0);
      const minimumRequiredNodes = Math.max(8, totalFunctionsAnalyzed + 3);
      this.logger.log(`Workflow generation requirements:`);
      this.logger.log(`- Total functions analyzed: ${totalFunctionsAnalyzed} (1 parent + ${functionDependencies.length || 0} dependencies)`);
      this.logger.log(`- Minimum workflow nodes required: ${minimumRequiredNodes}`);
      this.logger.log(`- Function dependencies extracted: ${functionDependencies.map(f => f.name).join(', ') || 'None'}`);

      const prompt = `
You are an expert software architect and workflow designer. Based on the provided code node data, parent file context, and children node implementations, create a professional workflow diagram data structure.

WORKFLOW SIZE REQUIREMENTS:
- Total Functions Analyzed: ${1 + (functionDependencies.length || 0)} (1 parent + ${functionDependencies.length || 0} dependencies)
- MINIMUM Workflow Nodes Required: ${Math.max(8, 1 + (functionDependencies.length || 0) + 3)}
- Expected Node Types: Start (1) + Function Nodes (${1 + (functionDependencies.length || 0)}) + Decision/Validation/Error/End Nodes (${Math.max(3, functionDependencies.length || 3)})

The node data represents a function/component and its dependencies. Your task is to:
1. Analyze the function and its child dependencies
2. Use the parent file content to understand the broader context and implementation details
3. Use the children file contents to understand the actual implementation of dependent functions/components
4. Create a logical workflow showing how this function operates within its parent context and interacts with its children
5. Transform it into a sequential process with decision points where appropriate
6. Make the workflow more accurate and detailed using the actual code structure from both parent and children files
7. Use the exact JSON format provided below

Node Data:
${JSON.stringify(nodeData, null, 2)}

${parentFileContent ? `
Parent File Context:
--- BEGIN PARENT FILE CONTENT ---
${parentFileContent.slice(0, 5000)} ${parentFileContent.length > 5000 ? '\n... (truncated for brevity)' : ''}
--- END PARENT FILE CONTENT ---

Use this parent file context to:
- Understand the actual implementation of the selected function/component
- Identify real parameters, return values, and internal logic
- Create more accurate workflow steps based on the actual code structure
- Include proper error handling and validation steps as seen in the code
- Make the workflow sequential and logical based on the real implementation
` : `
Note: Parent file content not available. ${parentFileError || 'Creating workflow based on node structure only.'}
`}

${functionDependencies.length > 0 ? `
Function Dependencies (Recursive Analysis):
${functionDependencies.map((func, index) => {
  return `
--- BEGIN FUNCTION ${index + 1}: ${func.name} (Depth: ${func.depth}) ---
File Path: ${func.filePath}
Node ID: ${func.nodeId}
Lines: ${func.starts}-${func.ends}
Group: ${func.group}
Complexity: ${func.complexity}

Function Code:
${func.content}
--- END FUNCTION ${index + 1} ---
`;
}).join('\n')}

Use these function dependencies to:
- Understand the complete execution flow and call hierarchy
- Create accurate sub-processes and decision points based on real function logic
- Include proper data flow between the main function and its dependencies
- Add validation steps, error handling, and edge cases as implemented in the functions
- Make the workflow reflect the actual call hierarchy and data dependencies
- Include API calls, database operations, validation logic as seen in the function implementations
- Show the complete workflow from parent function through all recursive dependencies
- Arrange the workflow neatly to show the depth and complexity of the execution flow
` : `
Note: No function dependencies extracted. ${dependencyExtractionErrors.length > 0 ? `Errors: ${dependencyExtractionErrors.map(e => `${e.name}: ${e.error}`).join(', ')}` : 'No dependencies available or graph data not accessible.'}
`}

Required Output Format (JSON only, no explanations):
{
  "nodes": [
    {
      "id": "start",
      "key": "start", 
      "name": "Start",
      "text": "Start - ${nodeData.text || 'Function Entry'}",
      "type": "start",
      "category": "start",
      "isParentNode": true,
      "hasChildren": false,
      "everExpanded": false,
      "isExpanded": false,
      "level": 0,
      "description": "Entry point for ${nodeData.text || 'the function'}"
    }
    // CRITICAL REQUIREMENT: You must create at least ${1 + (functionDependencies.length || 0)} nodes total
    // This includes: 1 start node + ${functionDependencies.length || 0} function-specific nodes + additional workflow nodes (decisions, validations, end)
    // Each extracted function must have at least one corresponding workflow node
    // Add additional nodes for: decisions, validations, error handling, database operations, API calls, and end nodes
    // Use categories: "process", "decision", "start", "end", "validation", "database", "api"
    // Use types: "start", "process", "decision", "end", "validation", "database", "api"
    // Make nodes reflect actual code implementation from parent file and function dependencies
  ],
  "links": [
    {
      "key": "link-1",
      "from": "start", 
      "to": "next-node",
      "source": "start",
      "target": "next-node", 
      "type": "flow",
      "category": "main"
    }
    // Add links connecting all nodes in logical sequence based on actual code flow
    // Use categories: "main", "success", "error", "validation"
    // For decision nodes, create branching paths with appropriate labels
  ],
  "expandableData": {
    "node-key": [
      {
        "id": "child-1",
        "key": "child-1",
        "name": "Child Process",
        "text": "Child Process", 
        "type": "process",
        "category": "subprocess",
        "hasChildren": false,
        "level": 2,
        "description": "Child process description based on actual dependencies"
      }
    ]
  }
}

Create a workflow that accurately represents the execution flow of this function based on:
1. Its actual implementation in the parent file (if available)
2. Its dependencies and child components with their real implementations
3. Real conditional logic, loops, error handling, and data flow from both parent and children
4. Actual function calls, API endpoints, database operations as seen in the children implementations
5. Professional software architecture patterns
6. Inter-component communication and data dependencies
7. Error propagation and exception handling across the call hierarchy

Guidelines for creating the workflow:
- MINIMUM NODES REQUIREMENT: Create at least ${1 + (functionDependencies.length || 0)} workflow nodes total
  * 1 start node (mandatory)
  * At least 1 node per extracted function (${functionDependencies.length || 0} function nodes minimum)
  * Additional nodes for workflow logic (decisions, validations, error handling, end nodes)
- Start with the main function entry point from the parent file
- Create a dedicated workflow node for each extracted function dependency
- Include initialization and setup steps based on parent file implementation
- Add decision nodes for conditional logic found in the code
- Include process nodes for each major operation or child function call
- Add validation nodes for input/output validation as seen in the function implementations
- Include database/API nodes for external service calls found in dependencies
- Add error handling paths for try-catch blocks and error scenarios
- End with appropriate success/failure termination points
- Use the function dependencies to create accurate sub-workflow steps with proper depth organization
- Make the workflow depth reflect the actual code complexity and call hierarchy
- Arrange nodes neatly by depth levels to show the execution flow clearly
- Group related functions from the same depth level together
- Use different node categories to distinguish between different types of operations
- Show the complete execution path from parent through all recursive dependencies
- Include complexity indicators for functions with high complexity scores
- Make the diagram comprehensive but well-organized to handle large workflows

Node Organization Strategy:
- Level 0: Parent function (main entry point)
- Level 1: Direct dependencies (immediate function calls)
- Level 2-N: Recursive dependencies (nested function calls)
- Use different colors/shapes for different complexity levels and function groups
- Include proper linking between levels to show call hierarchy

MANDATORY Function-to-Node Mapping:
${functionDependencies.length > 0 ? functionDependencies.map((func, index) => 
  `- Function "${func.name}" (${func.filePath}) MUST have a corresponding workflow node`
).join('\n') : '- No specific functions to map (create workflow based on parent node structure)'}

Make the workflow detailed, sequential, and true to the actual code implementation with comprehensive coverage of the entire execution tree.`;

      const workflowResponse = await this.generateDiagramService.generateDiagram(
        prompt,
        10000, // Increased timeout for more complex analysis
      );

      let workflowData;
      try {
        const responseText = typeof workflowResponse === 'string' 
          ? workflowResponse.trim() 
          : workflowResponse?.rawText?.trim() || JSON.stringify(workflowResponse);
        
        // Extract JSON from response if wrapped in markdown or other text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : responseText;
        
        workflowData = JSON.parse(jsonString);

        // Validate minimum node requirement
        const actualNodeCount = workflowData?.nodes?.length || 0;
        const requiredMinimumNodes = Math.max(8, totalFunctionsAnalyzed + 3);
        
        this.logger.log(`Workflow validation: Generated ${actualNodeCount} nodes, required minimum ${requiredMinimumNodes}`);
        
        if (actualNodeCount < requiredMinimumNodes) {
          this.logger.warn(`Generated workflow has insufficient nodes: ${actualNodeCount} < ${requiredMinimumNodes} required`);
          // Add warning to the response but don't fail the request
        } else {
          this.logger.log(`✅ Workflow meets minimum node requirement: ${actualNodeCount} >= ${requiredMinimumNodes}`);
        }

      } catch (parseError) {
        this.logger.error('Failed to parse LLM response as JSON:', parseError);
        throw new BadRequestException('Invalid workflow data generated');
      }

      return {
        success: true,
        message: 'Workflow generated successfully',
        workflowData,
        originalNodeData: nodeData,
        workflowValidation: {
          totalFunctionsAnalyzed,
          minimumRequiredNodes: Math.max(8, totalFunctionsAnalyzed + 3),
          actualNodesGenerated: workflowData?.nodes?.length || 0,
          meetsRequirement: (workflowData?.nodes?.length || 0) >= Math.max(8, totalFunctionsAnalyzed + 3),
          functionNodeMapping: functionDependencies.map(func => ({
            functionName: func.name,
            functionId: func.nodeId,
            depth: func.depth
          }))
        },
        parentFileAnalysis: {
          fileRequested: parentFile,
          fileFound: !!parentFileContent,
          fileSize: parentFileContent?.length || 0,
          error: parentFileError
        },
        childrenFileAnalysis: {
          totalChildren: nodeData.children?.length || 0,
          functionsExtracted: functionDependencies.length,
          functionsFound: functionDependencies.filter(f => f.content).length,
          maxDepthReached: Math.max(...functionDependencies.map(f => f.depth), 0),
          errors: dependencyExtractionErrors.length,
          functionDetails: functionDependencies.map(func => ({
            nodeId: func.nodeId,
            name: func.name,
            filePath: func.filePath,
            depth: func.depth,
            starts: func.starts,
            ends: func.ends,
            codeLength: func.content?.length || 0,
            complexity: func.complexity,
            group: func.group
          })),
          errorDetails: dependencyExtractionErrors
        }
      };

    } catch (error) {
      this.logger.error('Error generating workflow:', error);
      return {
        success: false,
        message: 'Failed to generate workflow',
        error: error.message,
      };
    }
  }

  // async getGeneratedMd(query: any) {}
}

//C:\Users\Melvin M Shajan\Desktop\neo4j ahhh swark\MindMapMelvin\full project\mindmap - Copy\server