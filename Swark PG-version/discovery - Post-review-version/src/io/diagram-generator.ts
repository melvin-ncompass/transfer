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
  const prompt = `You are an expert D2 diagram generator creating HIGH-LEVEL business architecture diagrams. Generate ONLY valid D2 code that compiles without errors.

**FOCUS ON HIGH-LEVEL ARCHITECTURE:**
- Business domains and services (not technical classes or functions)
- Major system boundaries and their business purposes
- High-level data flow between business domains
- External business integrations and partners
- Avoid low-level technical implementation details

**CRITICAL SYNTAX RULES:**
1. ALL labels must be in double quotes: label: "My Label"
2. NO multiline labels - use single line only: label: "User Management Domain"
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

Business_Domain_1: {
  label: "User Management Domain"
  padding: 16
  style: { fill: "#f0f8ff", stroke: "#0b3954" }
  
  User_Services: { 
    label: "User Services" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#9fbce6" } 
  }
  Authentication: { 
    label: "Authentication Service" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#9fbce6" } 
  }
}

Business_Domain_2: {
  label: "Content Management Domain"
  padding: 12
  style: { fill: "#fff7f3", stroke: "#c66b3a" }
  
  Content_Services: { 
    label: "Content Services" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#f3d1bd" } 
  }
  Media_Processing: { 
    label: "Media Processing" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#f3d1bd" } 
  }
}

Data_Domain: {
  label: "Data Management Domain"
  padding: 12
  style: { fill: "#f3fff8", stroke: "#1f7a5a" }
  
  User_Data: { 
    shape: "cylinder"
    label: "User Data Store" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#7bd9b0" } 
  }
  Content_Data: { 
    shape: "cylinder"
    label: "Content Data Store" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#7bd9b0" } 
  }
}

External_Systems: {
  label: "External Business Partners"  
  padding: 12
  style: { fill: "#f6f7ff", stroke: "#3b3f9e" }
  
  Payment_Provider: { 
    shape: "cloud"
    label: "Payment Services" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#bfc8ff" } 
  }
  Email_Provider: { 
    shape: "cloud"
    label: "Email Services" 
    padding: 8 
    style: { fill: "#ffffff", stroke: "#bfc8ff" } 
  }
}

# High-level business flow connections
Business_Domain_1.User_Services -> Data_Domain.User_Data: "manages user data"
Business_Domain_2.Content_Services -> Data_Domain.Content_Data: "manages content"
Business_Domain_1.Authentication -> External_Systems.Email_Provider: "sends notifications"
Business_Domain_2.Media_Processing -> External_Systems.Payment_Provider: "processes payments"

Legend: {
  shape: "text"
  label: "High-Level Business Architecture: domains=major business areas, cylinders=data stores, clouds=external partners"
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

Generate clean D2 code following the high-level business architecture patterns above. Focus on business domains rather than technical implementation details.`;

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
  const prompt = `You are an expert software architect and system designer.
Your task is to analyze the given repository source code and produce a **high-level architecture diagram** in **Eraser.io syntax ONLY**.
❌ DO NOT use D2, Mermaid, or any other diagram format.
✅ ONLY use Eraser.io syntax as shown in the example below.
The diagram should highlight the core system layers, main components, and overall data flows, without going into low-level implementation details.

===========================
📌 REQUIRED FORMAT: Eraser.io Syntax Example
===========================
title System Architecture Overview

Users [icon: users] {
  End Users [icon: user, label: "Application users"]
  Administrators [icon: user-check, label: "System administrators"]
}

Frontend Layer [icon: monitor] {
  Web App [icon: globe, label: "React/Vue/Angular application"]
  Mobile App [icon: smartphone, label: "iOS/Android application"]
}

Backend Layer [icon: server] {
  API Gateway [icon: share-2, label: "Request routing and authentication"]
  Application Server [icon: cpu, label: "Business logic processing"]
  Authentication Service [icon: shield, label: "User authentication and authorization"]
}

Data Layer [icon: database] {
  Primary Database [icon: cylinder, label: "Main data storage"]
  Cache [icon: zap, label: "Fast data access"]
  File Storage [icon: folder, label: "Static assets and files"]
}

External Services [icon: cloud] {
  Third-party APIs [icon: link, label: "External integrations"]
  Email Service [icon: mail, label: "Notification delivery"]
  Analytics [icon: bar-chart, label: "Usage tracking"]
}

# Connections
Users > Web App
Users > Mobile App
Web App > API Gateway
Mobile App > API Gateway
API Gateway > Application Server
API Gateway > Authentication Service
Application Server > Primary Database
Application Server > Cache
Application Server > File Storage
Application Server > Third-party APIs
Authentication Service > Primary Database
Application Server > Email Service
Application Server > Analytics

===========================
🎯 CRITICAL: Output Rules for Eraser.io Format
===========================
1. **MANDATORY**: Output must be ONLY valid Eraser.io syntax (no D2, no Mermaid, no other formats).
2. **NO COMMENTS**: Do not include any explanatory text, headers, or comments at the beginning.
3. **START WITH TITLE**: Always begin with "title [description]"
4. **LAYER SYNTAX**: Use "Layer Name [icon: iconname] { ... }" format EXACTLY
5. **COMPONENT SYNTAX**: Use "Component Name [icon: iconname, label: "description"]" format EXACTLY - EVERY component MUST have both icon and label
6. **CONNECTION SYNTAX**: Use "Component A > Component B" format EXACTLY
7. **CONNECTION SECTIONS**: Use comment headers like "# Connections" - do NOT wrap in curly braces
8. **NO D2 SYNTAX**: Do not use label:, shape:, style.fill:, or other D2-specific syntax
9. **NO MARKDOWN**: Do not wrap in code blocks or add markdown formatting
10. **HIGH-LEVEL FOCUS**: Show core architectural layers, main components, and overall data flows
11. **ALL COMPONENTS CONNECTED**: Every single component must have at least one connection
12. **COMPLETE FLOW**: Show full user request to response paths
13. **APPROPRIATE ICONS**: Use relevant icons: server, cpu, database, users, globe, cloud, mail, shield, key, monitor, layers


SUMMARY CONTENT TO MODEL:
${summaryContent}

Generate the complete Eraser diagram following the exact format and rules above. Focus on high-level system architecture and data flows.`;

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
