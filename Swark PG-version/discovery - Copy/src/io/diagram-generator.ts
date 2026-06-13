import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { FileAnalyzer } from "./file-analyuzer";

/**
 * DiagramGenerator
 * Handles generation of architectural diagrams from summary files
 */
export class DiagramGenerator {
  /**
   * Step 7: Generate diagrams from the summary file
   * Makes only 2 LLM calls and creates 4 files from those responses
   */
  static async generateFromSummary(
    summaryFilePath: string,
    outputPath: string,
    progress: vscode.Progress<{ message?: string; increment?: number }>
  ): Promise<void> {
    
    if (!fs.existsSync(summaryFilePath)) {
      console.error("Summary file not found:", summaryFilePath);
      return;
    }

    const summaryContent = fs.readFileSync(summaryFilePath, 'utf8');
    
    // Make only 2 LLM calls and create 4 files from responses
    progress.report({ message: "Getting D2 diagram content from LLM..." });
    const d2Content = await this.getD2ContentFromLLM(summaryContent);
    
    progress.report({ message: "Getting Eraser diagram content from LLM..." });
    const eraserContent = await this.getEraserContentFromLLM(summaryContent);
    
    // Create 4 files from the 2 LLM responses
    progress.report({ message: "Creating 4 diagram files from LLM responses..." });
    await this.createAllDiagramFiles(d2Content, eraserContent, outputPath);
  }

  /**
   * Get D2 diagram content from LLM (1 call for both markdown and standalone)
   */
  private static async getD2ContentFromLLM(summaryContent: string): Promise<string | null> {
  const prompt = `You are an expert D2 diagram generator. Generate ONLY valid D2 code that compiles without errors.

**CRITICAL SYNTAX RULES:**
1. ALL labels must be in double quotes: label: "My Label"
2. NO multiline labels - use single line only: label: "Router routes to views"
3. ALL properties must have colons and be properly formatted
4. ALL hex colors must be quoted: "#ffffff"
5. NO missing quotes anywhere
6. ALL nested objects must have proper braces: { }

**REQUIRED STRUCTURE:**
\`\`\`
config: {
  layout: "dagre"
  direction: "right"
  styleMode: "shadow"
  colorMode: "pastel"
}

Root: {
  label: "API Gateway"
  padding: 16
  style: { fill: "#f0f8ff", stroke: "#0b3954" }
}

Frontend: {
  label: "Frontend Layer"
  padding: 12
  style: { fill: "#f8fbff", stroke: "#2b8cbe" }
  Router: { 
    label: "Router" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#9fbce6" } 
  }
  Components: { 
    label: "Components" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#9fbce6" } 
  }
}

Backend: {
  label: "Backend Services"
  padding: 12
  style: { fill: "#fff7f3", stroke: "#c66b3a" }
  Lambdas: { 
    label: "Lambda Functions" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#f3d1bd" } 
  }
  APIs: { 
    label: "API Handlers" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#f3d1bd" } 
  }
}

DataLayer: {
  label: "Data Storage"
  padding: 12
  style: { fill: "#f3fff8", stroke: "#1f7a5a" }
  Database: { 
    shape: "cylinder"
    label: "Main Database" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#7bd9b0" } 
  }
  Cache: { 
    shape: "db"
    label: "Redis Cache" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#7bd9b0" } 
  }
}

External: {
  label: "External Services"  
  padding: 12
  style: { fill: "#f6f7ff", stroke: "#3b3f9e" }
  S3: { 
    shape: "cloud"
    label: "S3 Storage" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#bfc8ff" } 
  }
  Cognito: { 
    shape: "cloud"
    label: "AWS Cognito" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#bfc8ff" } 
  }
}

# Simple connections
Root -> Frontend: "serves" 
Frontend.Router -> Backend.APIs: "HTTP requests"
Backend.Lambdas -> DataLayer.Database: "queries"
Backend.APIs -> External.S3: "file storage"

# Decision node
IsAuthenticated: {
  shape: "diamond"
  label: "Authenticated?"
  padding: 10
  style: { fill: "#fff7e6", stroke: "#e89b00" }
}

Frontend.Router -> IsAuthenticated: "check auth"
IsAuthenticated -> Backend.APIs: "yes - proceed"
IsAuthenticated -> Frontend.Router: "no - redirect"

Legend: {
  shape: "text"
  label: "Legend: rectangle=component, cylinder=database, cloud=external, diamond=decision"
  padding: 8
  style: { fill: "#ffffff", stroke: "#cccccc" }
}
\`\`\`

**VALIDATION CHECKLIST:**
- ✓ All labels in quotes
- ✓ All hex colors quoted  
- ✓ No multiline labels
- ✓ Proper brace matching
- ✓ All properties have colons
- ✓ Valid shape names only
- ✓ Clean node names (no special chars)

**CONTENT TO MODEL:**
${summaryContent}

Generate clean D2 code following the exact syntax patterns above.`;

    try {
      const d2Content = await FileAnalyzer.analyzeFileUsingOpenAI(prompt, 0);
      if (d2Content) {
        console.log("D2 content received from LLM");
        return d2Content;
      }
      return null;
    } catch (error) {
      console.error("Error getting D2 content from LLM:", error);
      return null;
    }
  }

  /**
   * Get Eraser diagram content from LLM (1 call for both markdown and standalone)
   */
  private static async getEraserContentFromLLM(summaryContent: string): Promise<string | null> {
  const prompt = `You are an expert system architect creating professional Eraser diagrams. Generate a clean, well-structured architecture diagram with proper icons and logical flow.

STRICT REQUIREMENTS:
1. Output ONLY Eraser diagram code (no markdown, no explanations)
2. Every component MUST have an icon from this approved list:
   - monitor, server, lambda, database, box, queue, cloud, key, shield, bell, gear, file, component, user, globe

3. Use professional architectural layering:
   - User Interface Layer (entry points)
   - API Gateway & Routing (request handling)
   - Core Business Services (main logic)
   - Data Management Layer (storage)
   - External Integrations (third-party)
   - Infrastructure & Utilities (support)

4. Create meaningful connection flows:
   - User → API → Business → Data → External
   - Infrastructure supports all layers
   - Show both request flow and data flow
   - Include error/notification flows

5. Professional naming conventions:
   - Use underscores: User_Management not "User Management"
   - Descriptive labels: "User Auth Service" not just "Auth"
   - Clear component purposes

6. Required flow patterns:
   - Primary user journey (happy path)
   - Admin workflow (decision making)
   - Data persistence flow
   - External service integration
   - Cross-cutting concerns (logging, monitoring)

TEMPLATE STRUCTURE TO FOLLOW:

title [System Name] - Professional Architecture Flow

// === USER INTERFACE LAYER ===
User_Interface [icon: monitor, label: "User Interface Layer"] {
  Web_App [icon: monitor, label: "Web Application"]
  Mobile_App [icon: monitor, label: "Mobile Interface"]
  Admin_Portal [icon: shield, label: "Admin Dashboard"]
}

// === API GATEWAY LAYER ===
API_Gateway [icon: server, label: "API Gateway & Routing"] {
  Auth_Router [icon: key, label: "Authentication Router"]
  Business_Router [icon: server, label: "Business Logic Router"]
  File_Router [icon: server, label: "File Management Router"]
}

// === CORE BUSINESS LAYER ===
Business_Services [icon: lambda, label: "Core Business Services"] {
  Primary_Service [icon: lambda, label: "Primary Business Logic"]
  Secondary_Service [icon: lambda, label: "Secondary Processor"]
  Validation_Service [icon: lambda, label: "Data Validator"]
  Notification_Service [icon: bell, label: "Notification Handler"]
}

// === DATA MANAGEMENT LAYER ===
Data_Services [icon: database, label: "Data Management Layer"] {
  Primary_DB [icon: database, label: "Primary Database"]
  Cache_Layer [icon: box, label: "Cache Storage"]
  File_Storage [icon: box, label: "File Storage"]
  Message_Queue [icon: queue, label: "Message Queue"]
}

// === EXTERNAL INTEGRATIONS ===
External_Systems [icon: cloud, label: "External Integrations"] {
  Identity_Service [icon: key, label: "Identity Provider"]
  Email_Service [icon: cloud, label: "Email Service"]
  Storage_Service [icon: cloud, label: "Cloud Storage"]
  Third_Party_API [icon: globe, label: "External APIs"]
}

// === INFRASTRUCTURE LAYER ===
Infrastructure [icon: gear, label: "Infrastructure & Utilities"] {
  Logger [icon: file, label: "Centralized Logging"]
  Config_Manager [icon: gear, label: "Configuration"]
  Security_Utils [icon: shield, label: "Security Utilities"]
  HTTP_Client [icon: component, label: "HTTP Client"]
}

// === LOGICAL FLOW CONNECTIONS ===
// Primary user flow
User_Interface.Web_App > API_Gateway.Auth_Router
API_Gateway.Auth_Router > External_Systems.Identity_Service
API_Gateway.Business_Router > Business_Services.Primary_Service
Business_Services.Primary_Service > Data_Services.Primary_DB

// Admin workflow
User_Interface.Admin_Portal > API_Gateway.Business_Router
API_Gateway.Business_Router > Business_Services.Secondary_Service
Business_Services.Secondary_Service > Business_Services.Notification_Service
Business_Services.Notification_Service > External_Systems.Email_Service

// Data persistence flow
Business_Services.Primary_Service > Data_Services.Cache_Layer
Business_Services.Validation_Service > Data_Services.Primary_DB
API_Gateway.File_Router > Data_Services.File_Storage

// External integrations
Business_Services.Notification_Service > External_Systems.Third_Party_API
Data_Services.File_Storage > External_Systems.Storage_Service

// Infrastructure support (cross-cutting)
Infrastructure.Logger > Business_Services.Primary_Service
Infrastructure.Security_Utils > API_Gateway.Auth_Router
Infrastructure.Config_Manager > Data_Services.Primary_DB
Infrastructure.HTTP_Client > External_Systems.Third_Party_API

SUMMARY CONTENT TO MODEL:
${summaryContent}

Generate the complete Eraser diagram following this exact structure and flow pattern. Ensure every component has an icon and the connections tell a clear architectural story.`;

  try {
    const eraserContent = await FileAnalyzer.analyzeFileUsingOpenAI(prompt, 0);
    if (eraserContent) {
      console.log("Eraser content received from LLM");
      return eraserContent;
    }
    return null;
  } catch (error) {
    console.error("Error getting Eraser content from LLM:", error);
    return null;
  }
}


  /**
   * Create all 4 diagram files from the 2 LLM responses
   */
  private static async createAllDiagramFiles(
    d2Content: string | null, 
    eraserContent: string | null, 
    outputPath: string
  ): Promise<void> {
    // Create D2 files
    if (d2Content) {
      // 1. Standalone D2 file
      const d2FilePath = path.join(outputPath, "architecture.d2");
      fs.writeFileSync(d2FilePath, d2Content);
      console.log("D2 diagram file generated:", d2FilePath);

      // 2. D2 Markdown file
      const d2MarkdownContent = `# Architecture D2 Diagram

This diagram shows the system architecture based on the batch analysis.

\`\`\`d2
${d2Content}
\`\`\`

## How to Use

1. Copy the D2 code above
2. Paste it into [D2 Playground](https://play.d2lang.com/)
3. Or use D2 CLI: \`d2 architecture.d2 architecture.svg\`

Generated on: ${new Date().toISOString()}
`;
      const d2MarkdownPath = path.join(outputPath, "architecture-d2-diagram.md");
      fs.writeFileSync(d2MarkdownPath, d2MarkdownContent);
      console.log("D2 diagram markdown generated:", d2MarkdownPath);
    }

    // Create Eraser files
    if (eraserContent) {
      // 3. Standalone Eraser file
      const eraserFilePath = path.join(outputPath, "architecture.eraserdiagram");
      fs.writeFileSync(eraserFilePath, eraserContent);
      console.log("Eraser diagram file generated:", eraserFilePath);

      // 4. Eraser Markdown file
      const eraserMarkdownContent = `# Architecture Eraser Diagram

This diagram shows the system architecture based on the batch analysis.

\`\`\`eraser
${eraserContent}
\`\`\`

## How to Use

1. Copy the Eraser code above
2. Paste it into [Eraser](https://app.eraser.io/)
3. Or save as .eraserdiagram file and import

Generated on: ${new Date().toISOString()}
`;
      const eraserMarkdownPath = path.join(outputPath, "architecture-eraser-diagram.md");
      fs.writeFileSync(eraserMarkdownPath, eraserMarkdownContent);
      console.log("Eraser diagram markdown generated:", eraserMarkdownPath);
    }
  }
}
