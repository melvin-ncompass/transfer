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

    const summaryContent = fs.readFileSync(summaryFilePath, "utf8");

    // Make only 2 LLM calls and create 4 files from responses
    progress.report({ message: "Getting Mermaid diagram content from LLM..." });
    const mermaidContent = await this.getMermaidContentFromLLM(summaryContent);

    progress.report({ message: "Getting Eraser diagram content from LLM..." });
    const eraserContent = await this.getEraserContentFromLLM(summaryContent);

    // Create 4 files from the 2 LLM responses
    progress.report({
      message: "Creating 4 diagram files from LLM responses...",
    });
    await this.createAllDiagramFiles(mermaidContent, eraserContent, outputPath);
  }

  /**
   * Get Mermaid diagram content from LLM (1 call for both markdown and standalone)
   */
  private static async getMermaidContentFromLLM(
    summaryContent: string
  ): Promise<string | null> {
    const prompt = `You are an expert Mermaid diagram generator creating HIGH-LEVEL system architecture flowcharts. Generate ONLY valid Mermaid flowchart code that renders properly, following the comprehensive architectural pattern shown in the reference.

**FOCUS ON HIGH-LEVEL ARCHITECTURE:**
- Business domains and services (not technical classes or functions)
- Major system boundaries and their business purposes
- High-level data flow between business domains
- External business integrations and partners
- Clear visual flow from input to output
- Use different shapes for different component types
- Comprehensive workflow orchestration and messaging patterns
- Cross-cutting utilities and services

**MERMAID SHAPE GUIDELINES:**
- Use **circles (( ))** for external users, actors, and external systems
- Use **rectangles [ ]** for business services, APIs, and UI components
- Use **diamonds { }** for gateways, decision points, and authentication
- Use **cylinders [( )]** for databases and data storage
- Use **trapezoids [/ /]** for processing, orchestration, and workflow components
- Use **parallelograms [/ \\]** for input/output operations and handlers

**REQUIRED COMPREHENSIVE STRUCTURE:**

flowchart TD
    %% External Users and Entry Points
    U(("👥 End Users / Customers"))
    A(("🔧 Admin Users"))
    P(("🤝 External Partners"))

    %% User Interface Layer (entry points)
    Web["🌐 Web Application"]
    AdminUI["🧭 Admin Dashboard"]
    API["🔌 Public API"]
    MobileApp["📱 Mobile Application"]

    %% API Gateway / Auth
    Auth{"🔐 Identity & Auth Gateway"}

    %% Core Business Services
    UserSvc["👤 User Management Service"]
    ContentSvc["📄 Content Management Service"]
    PaymentSvc["💳 Payment Service"]
    NotificationSvc["📧 Notification Service"]
    ReportingSvc["📊 Reporting Service"]
    ValidationSvc["✅ Validation Service"]

    %% Orchestration and Processing
    Orchestrator["/🚦 Workflow Orchestration/"]
    MessageProcessor["/📬 Message Processing/"]
    EventHandler["/📣 Event Handler/"]
    BatchProcessor["/🔄 Batch Processing/"]

    %% Data Storage Layer
    UserDB[("💾 User Database")]
    ContentDB[("📁 Content Database")]
    PaymentDB[("💰 Payment Database")]
    AuditDB[("📝 Audit & Events Database")]
    CacheStore[("⚡ Cache Store")]
    FileStorage[("🗂️ File Storage")]

    %% Utilities / Cross-cutting
    Logger["/🧭 Logging & Monitoring/"]
    Analytics["/📊 Analytics Engine/"]
    BackupService["/💾 Backup Service/"]

    %% External Systems
    PaymentGateway(("💳 Payment Gateway"))
    EmailProvider(("� Email Provider"))
    CloudStorage(("☁️ Cloud Storage"))
    ThirdPartyAPI(("🔗 Third Party APIs"))

    %% User Flow Connections
    U --> Web
    U --> MobileApp
    A --> AdminUI
    P --> API

    Web --> Auth
    MobileApp --> Auth
    AdminUI --> Auth
    API --> Auth

    %% Service Connections
    Auth --> UserSvc
    Auth --> ContentSvc
    Auth --> PaymentSvc
    Auth --> ReportingSvc

    UserSvc --> UserDB
    ContentSvc --> ContentDB
    PaymentSvc --> PaymentDB
    
    UserSvc --> ValidationSvc
    ContentSvc --> ValidationSvc
    
    %% Orchestration Flow
    UserSvc --> Orchestrator
    PaymentSvc --> Orchestrator
    Orchestrator --> MessageProcessor
    MessageProcessor --> EventHandler
    EventHandler --> NotificationSvc

    %% Data Persistence
    ValidationSvc --> CacheStore
    ContentSvc --> FileStorage
    EventHandler --> AuditDB

    %% External Integrations
    PaymentSvc --> PaymentGateway
    NotificationSvc --> EmailProvider
    FileStorage --> CloudStorage
    ReportingSvc --> ThirdPartyAPI

    %% Cross-cutting Services
    Logger -->|monitors| UserSvc
    Logger -->|monitors| PaymentSvc
    Logger -->|monitors| Orchestrator
    Analytics --> AuditDB
    BatchProcessor --> UserDB
    BatchProcessor --> ContentDB
    BackupService --> UserDB
    BackupService --> FileStorage

    %% Styling for comprehensive visualization
    classDef userClass fill:#f3f4ff,stroke:#3f51b5,stroke-width:2px,color:#1a237e
    classDef uiClass fill:#f3f4ff,stroke:#3f51b5,stroke-width:2px,color:#1a237e
    classDef serviceClass fill:#e8f7ea,stroke:#2e7d32,stroke-width:2px,color:#1b5e20
    classDef procClass fill:#fff8e1,stroke:#ff8f00,stroke-width:2px,color:#e65100
    classDef dataClass fill:#fff0f6,stroke:#c2185b,stroke-width:2px,color:#880e4f
    classDef externalClass fill:#e3f2fd,stroke:#0277bd,stroke-width:2px,color:#01579b
    classDef utilClass fill:#f1f8e9,stroke:#558b2f,stroke-width:2px,color:#33691e

    class U,A,P userClass
    class Web,AdminUI,API,MobileApp,Auth uiClass
    class UserSvc,ContentSvc,PaymentSvc,NotificationSvc,ReportingSvc,ValidationSvc serviceClass
    class Orchestrator,MessageProcessor,EventHandler,BatchProcessor procClass
    class UserDB,ContentDB,PaymentDB,AuditDB,CacheStore,FileStorage dataClass
    class PaymentGateway,EmailProvider,CloudStorage,ThirdPartyAPI externalClass
    class Logger,Analytics,BackupService utilClass

**CRITICAL MERMAID SYNTAX RULES:**
1. Start with "flowchart TD" for top-down layout
2. Use proper node syntax with meaningful IDs and emojis
3. Group related components with %% comments
4. Use connection labels when helpful: A -->|"processes"| B
5. Include comprehensive classDef styling with 6 distinct categories
6. Ensure logical flow from users → UI → services → data → external
7. Show cross-cutting concerns and utilities
8. Include orchestration and messaging patterns
9. All nodes must be properly connected and styled

**ARCHITECTURAL PATTERNS TO INCLUDE:**
- User entry points and authentication flow
- Core business service layer
- Data persistence layer with appropriate storage types
- External system integrations
- Cross-cutting utilities (logging, monitoring, analytics)
- Event-driven architecture with orchestration
- Caching and performance optimization
- Security and validation patterns

**CONTENT TO MODEL:**
${summaryContent}

Generate a comprehensive, clean Mermaid flowchart following the architectural patterns above. Focus on business domains, clear visual hierarchy, and logical data flows with appropriate shapes for each component type. Ensure the diagram tells a complete story of the system architecture.`;
    try {
      const mermaidContent = await FileAnalyzer.analyzeFileUsingOpenAI(
        prompt,
        0
      );
      if (mermaidContent) {
        console.log("Mermaid content received from LLM");
        return mermaidContent;
      }
      return null;
    } catch (error) {
      console.error("Error getting Mermaid content from LLM:", error);
      return null;
    }
  }

  /**
   * Get Eraser diagram content from LLM (1 call for both markdown and standalone)
   */
  private static async getEraserContentFromLLM(
    summaryContent: string
  ): Promise<string | null> {
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
      const eraserContent = await FileAnalyzer.analyzeFileUsingOpenAI(
        prompt,
        0
      );
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
    mermaidContent: string | null,
    eraserContent: string | null,
    outputPath: string
  ): Promise<void> {
    // Create Mermaid files
    if (mermaidContent) {
      // 1. Standalone Mermaid file
      const mermaidFilePath = path.join(outputPath, "architecture.mmd");
      fs.writeFileSync(mermaidFilePath, mermaidContent);
      console.log("Mermaid diagram file generated:", mermaidFilePath);

      // 2. Mermaid Markdown file
      const mermaidMarkdownContent = `# Architecture Mermaid Diagram

This diagram shows the system architecture based on the batch analysis.

\`\`\`mermaid
${mermaidContent}
\`\`\`

## How to Use

1. Copy the Mermaid code above
2. Paste it into [Mermaid Live Editor](https://mermaid.live/)
3. Or use VS Code with Mermaid extension
4. Or include in GitHub/GitLab markdown files

Generated on: ${new Date().toISOString()}
`;
      const mermaidMarkdownPath = path.join(
        outputPath,
        "architecture-mermaid-diagram.md"
      );
      fs.writeFileSync(mermaidMarkdownPath, mermaidMarkdownContent);
      console.log("Mermaid diagram markdown generated:", mermaidMarkdownPath);
    }

    // Create Eraser files
    if (eraserContent) {
      // 3. Standalone Eraser file
      const eraserFilePath = path.join(
        outputPath,
        "architecture.eraserdiagram"
      );
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
      const eraserMarkdownPath = path.join(
        outputPath,
        "architecture-eraser-diagram.md"
      );
      fs.writeFileSync(eraserMarkdownPath, eraserMarkdownContent);
      console.log("Eraser diagram markdown generated:", eraserMarkdownPath);
    }
  }
}
