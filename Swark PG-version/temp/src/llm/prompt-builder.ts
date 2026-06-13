import * as vscode from "vscode";
import { File } from "../types";

export type DiagramFormat = "d2" | "eraser" | "both";

export class PromptBuilder {
    private static readonly FILE_SEPERATOR = "==========";

    public static createPrompt(files: File[], format: DiagramFormat = "both"): vscode.LanguageModelChatMessage[] {
        const filesContents = files.map(PromptBuilder.encodeFile).join("\n");
        return [this.getSystemPrompt(format), vscode.LanguageModelChatMessage.User(filesContents)];
    }

    public static createDetailedPrompt(files: File[], format: DiagramFormat = "both"): vscode.LanguageModelChatMessage[] {
        const filesContents = files.map(PromptBuilder.encodeFile).join("\n");
        return [this.getDetailedSystemPrompt(format), vscode.LanguageModelChatMessage.User(filesContents)];
    }

    public static createSemiPrompt(files: File[], format: DiagramFormat = "both"): vscode.LanguageModelChatMessage[] {
        const filesContents = files.map(PromptBuilder.encodeFile).join("\n");
        return [this.getSemiSystemPrompt(format), vscode.LanguageModelChatMessage.User(filesContents)];
    }

    public static getDetailedSystemPrompt(format: DiagramFormat = "both"): vscode.LanguageModelChatMessage {
        let prompt = `You are an expert software architect and code analyst with deep experience in microservices, serverless architectures, and complex distributed systems.

Your task is to analyze the provided repository source code and generate comprehensive, highly detailed, and professional architecture diagrams.`;

        if (format === "both") {
            prompt += `

**IMPORTANT**: Generate diagrams in BOTH formats:

### 1. D2 FORMAT (Generate First)
- MUST wrap D2 code in \`\`\`d2 code blocks
- Use D2 syntax with proper nested structures, detailed labels, appropriate shapes and styling, clear data flows and relationships
When generating D2 diagrams, always follow these rules:
Use = for assignments (never :).
Only use valid shapes: rectangle, rounded, ellipse, cylinder, circle, image, text, diamond. Default to rectangle if unsure.
Only use valid style keys: style.fill, style.stroke, style.opacity, style.dashed, style.bold. Never invent keys like color, icon, priority.
Group nodes with container: "Name" { ... } or "group" { ... }.
All connections (A -> B) must reference defined nodes.
Use label = "..." and tooltip = "..." for names and info (never inside style).
No dangling references — every node mentioned must be defined.
If in doubt, fall back to rectangle with a label
### 2. ERASER FORMAT (Generate Second)
- Use Eraser.io syntax with icons and labels, comprehensive system layers, all connections and dependencies, proper grouping and visual hierarchy
.
**Separate the two formats with exactly this line:**
===== ERASER FORMAT =====

${this.getD2detailedExample()}

${this.getEraserExample()}`;
        } else if (format === "d2") {
            prompt += `

**IMPORTANT**: Generate diagrams in **D2 syntax ONLY**.
❌ DO NOT use Eraser.io, Mermaid, Markdown, or any other diagram format.
✅ ONLY use D2 syntax as shown in the example below.
✅ MUST wrap your D2 code in \`\`\`d2 code blocks

${this.getD2detailedExample()}`;
        } else if (format === "eraser") {
            prompt += `

**IMPORTANT**: Generate diagrams in **Eraser.io syntax ONLY**.
❌ DO NOT use D2, Mermaid, Markdown, or any other diagram format.
✅ ONLY use Eraser.io syntax as shown in the example below.

${this.getEraserExample()}`;
        }

        prompt += `

===========================
📂 Input Format
===========================
Code files are provided in the following format:
• Full file path
• File content
• Separator: '${PromptBuilder.FILE_SEPERATOR}'`;

        return vscode.LanguageModelChatMessage.User(prompt);
    }

    public static getSemiSystemPrompt(format: DiagramFormat = "both"): vscode.LanguageModelChatMessage {
        let prompt = `You are an expert software architect. Analyze the repository and create a semi-detailed architecture diagram showing moderate detail with modules and workflows.

Focus on:
- Main application layers and components
- Key data flows between services
- External integrations and dependencies
- Core business logic modules
- Security and authentication flows`;

        if (format === "both") {
            prompt += `

**IMPORTANT**: Generate TWO high-quality diagrams - one in D2 format and one in Eraser.io format.

### 1. D2 FORMAT REQUIREMENTS:
✅ MUST wrap D2 code in \`\`\`d2 code blocks
✅ Use proper D2 syntax with containers, shapes, and connections
✅ Include descriptive labels and appropriate styling
✅ Create clean, technical architecture diagrams
When generating D2 diagrams, always follow these rules:
Use = for assignments (never :).
Only use valid shapes: rectangle, rounded, ellipse, cylinder, circle, image, text, diamond. Default to rectangle if unsure.
Only use valid style keys: style.fill, style.stroke, style.opacity, style.dashed, style.bold. Never invent keys like color, icon, priority.
Group nodes with container: "Name" { ... } or "group" { ... }.
All connections (A -> B) must reference defined nodes.
Use label = "..." and tooltip = "..." for names and info (never inside style).
No dangling references — every node mentioned must be defined.
If in doubt, fall back to rectangle with a label
### 2. ERASER FORMAT REQUIREMENTS:
✅ Create comprehensive, visually rich diagrams with detailed labels
✅ Use meaningful component names reflecting business purpose
✅ Group related components in logical containers with appropriate icons
✅ Include descriptive connection labels explaining data flow and relationships
✅ Show both technical implementation and business value
✅ Make diagrams informative for both technical and business stakeholders

**Separate the two formats with exactly this line:**
===== ERASER FORMAT =====

${this.getD2SemiExample()}

${this.getEraserExample()}`;
        } else if (format === "d2") {
            prompt += `

**IMPORTANT**: Generate diagrams in **D2 syntax ONLY**.
❌ DO NOT use Eraser.io, Mermaid, Markdown, or any other diagram format.
✅ ONLY use D2 syntax as shown in the example below.
✅ MUST wrap your D2 code in \`\`\`d2 code blocks

${this.getD2SemiExample()}`;
        } else if (format === "eraser") {
            prompt += `

**IMPORTANT**: Generate diagrams in **Eraser.io syntax ONLY**.
❌ DO NOT use D2, Mermaid, Markdown, or any other diagram format.  
✅ ONLY use Eraser.io syntax as shown in the example below.

**ERASER DIAGRAM QUALITY REQUIREMENTS:**
• Create comprehensive, visually appealing diagrams with rich detail
• Use meaningful component names that reflect business purpose
• Include detailed labels explaining functionality and technical implementation
• Group related components in logical containers with appropriate icons
• Use descriptive connection labels that explain data flow and relationships
• Show both technical architecture and business value
• Include external dependencies, third-party services, and integrations
• Make diagrams informative for both technical and business stakeholders

${this.getEraserExample()}`;
        }

        prompt += `

===========================
📂 Input Format
===========================
Code files are provided in the following format:
• Full file path
• File content  
• Separator: '${PromptBuilder.FILE_SEPERATOR}'`;

        return vscode.LanguageModelChatMessage.User(prompt);
    }

    public static getSystemPrompt(format: DiagramFormat = "both"): vscode.LanguageModelChatMessage {
        let prompt = `You are an expert software architect. Analyze the repository and create a high-level architecture diagram for stakeholders.

Focus on:
- Main system components and their purposes
- High-level data flows
- External systems and integrations
- User interfaces and entry points
- Core infrastructure components

Keep the diagram clean and abstract, suitable for business stakeholders and project managers.`;

        if (format === "both") {
            prompt += `

**IMPORTANT**: Generate diagrams in BOTH formats:

### 1. D2 FORMAT (Generate First)
- MUST wrap D2 code in \`\`\`d2 code blocks
- Use D2 syntax with clear component containers and relationships
When generating D2 diagrams, always follow these rules:
Use = for assignments (never :).
Only use valid shapes: rectangle, rounded, ellipse, cylinder, circle, image, text, diamond. Default to rectangle if unsure.
Only use valid style keys: style.fill, style.stroke, style.opacity, style.dashed, style.bold. Never invent keys like color, icon, priority.
Group nodes with container: "Name" { ... } or "group" { ... }.
All connections (A -> B) must reference defined nodes.
Use label = "..." and tooltip = "..." for names and info (never inside style).
No dangling references — every node mentioned must be defined.
If in doubt, fall back to rectangle with a label
### 2. ERASER FORMAT (Generate Second)
- Use Eraser.io syntax with appropriate icons and visual grouping

**Separate the two formats with exactly this line:**
===== ERASER FORMAT =====

${this.getD2Example()}

${this.getEraserExample()}`;
        } else if (format === "d2") {
            prompt += `

**IMPORTANT**: Generate diagrams in **D2 syntax ONLY**.
❌ DO NOT use Eraser.io, Mermaid, Markdown, or any other diagram format.
✅ ONLY use D2 syntax as shown in the example below.
✅ MUST wrap your D2 code in \`\`\`d2 code blocks

${this.getD2Example()}`;
        } else if (format === "eraser") {
            prompt += `

**IMPORTANT**: Generate diagrams in **Eraser.io syntax ONLY**.
❌ DO NOT use D2, Mermaid, Markdown, or any other diagram format.
✅ ONLY use Eraser.io syntax as shown in the example below.

${this.getEraserExample()}`;
        }

        prompt += `

===========================
📂 Input Format
===========================
Code files are provided in the following format:
• Full file path
• File content
• Separator: '${PromptBuilder.FILE_SEPERATOR}'`;

        return vscode.LanguageModelChatMessage.User(prompt);
    }
    private static getD2detailedExample(): string {
        return `
===========================
📌 D2 Format Example
===========================
\`\`\`d2
project: "Swark Detailed" {
  style.fill = "#FFFFFF"
  style.stroke = "#333"
  container: "src/frontend" {
    "App.vue" { shape = rectangle; style.fill = "#C1E1FF" }
    "components/Header.vue" { shape = rectangle; style.fill = "#C1E1FF" }
    "components/Footer.vue" { shape = rectangle; style.fill = "#C1E1FF" }
    "components/Dashboard.vue" { shape = rectangle; style.fill = "#C1E1FF" }
  }
  container: "src/backend" {
    "server.ts" { shape = rectangle; style.fill = "#FFDDC1" }
    "routes/userRoutes.ts" { shape = rectangle; style.fill = "#FFDDC1" }
    "routes/paymentRoutes.ts" { shape = rectangle; style.fill = "#FFDDC1" }
    "services/userService.ts" { shape = rectangle; style.fill = "#FFDDC1" }
    "services/paymentService.ts" { shape = rectangle; style.fill = "#FFDDC1" }
  }
  container: "database" {
    "users.sql" { shape = rectangle; style.fill = "#C6FFB3" }
    "payments.sql" { shape = rectangle; style.fill = "#C6FFB3" }
  }
  
  "App.vue" -> "components/Header.vue"
  "App.vue" -> "components/Footer.vue"
  "App.vue" -> "components/Dashboard.vue"
  "Dashboard.vue" -> "server.ts"
  "server.ts" -> "routes/userRoutes.ts"
  "server.ts" -> "routes/paymentRoutes.ts"
  "routes/userRoutes.ts" -> "services/userService.ts"
  "routes/paymentRoutes.ts" -> "services/paymentService.ts"
  "services/userService.ts" -> "users.sql"
  "services/paymentService.ts" -> "payments.sql"
}
\`\`\`

**IMPORTANT D2 FORMAT RULES:**
- ALWAYS wrap D2 code in \`\`\`d2 code blocks
- Use proper D2 syntax with containers and connections
- Include descriptive labels with \\n line breaks
`;
    }

    private static getD2SemiExample(): string {
        return `
===========================
📌 D2 Format Example
===========================
\`\`\`d2
project: "Swark Semi-Detailed" {
  style.fill = "#F8F8F8"
  style.stroke = "#444"
  container: "Frontend" {
    "index.html" { shape = rectangle; style.fill = "#E3F2FD" }
    "main.ts" { shape = rectangle; style.fill = "#E3F2FD" }
    "components/" { shape = rectangle; style.fill = "#E3F2FD" }
  }
  container: "Backend" {
    "API Gateway" { shape = rectangle; style.fill = "#FFEBEE" }
    "User Service" { shape = rectangle; style.fill = "#FFEBEE" }
    "Payment Service" { shape = rectangle; style.fill = "#FFEBEE" }
  }
  container: "Database" {
    "Users Table" { shape = cylinder; style.fill = "#E8F5E9" }
    "Payments Table" { shape = cylinder; style.fill = "#E8F5E9" }
  }
  
  "main.ts" -> "API Gateway" : "REST Calls"
  "API Gateway" -> "User Service" : "Routes /users"
  "API Gateway" -> "Payment Service" : "Routes /payments"
  "User Service" -> "Users Table" : "CRUD"
  "Payment Service" -> "Payments Table" : "CRUD"
}
\`\`\`

**IMPORTANT D2 FORMAT RULES:**
- ALWAYS wrap D2 code in \`\`\`d2 code blocks
- Use proper D2 syntax with containers and connections
- Include descriptive labels with \\n line breaks
`;
    }
    private static getD2Example(): string {
        return `
===========================
📌 D2 Format Example
===========================
\`\`\`d2
project: "Swark" {
  style.fill = "#F0F0F0"
  style.stroke = "#333"
  container: "Frontend" {
    "Web App": {
      label = ":globe_with_meridians: Web App"
      shape = rectangle
      style.fill = "#C1E1FF"
    }
  }
  container: "Backend" {
    "API Server": {
      label = ":cog: API Server"
      shape = rectangle
      style.fill = "#FFDDC1"
    }
  }
  container: "Database" {
    "DB": {
      label = ":filing_cabinet: Database"
      shape = cylinder
      style.fill = "#C6FFB3"
    }
  }
  
  "Web App" -> "API Server" : "HTTPS"
  "API Server" -> "DB" : "Queries"
}
\`\`\`

**IMPORTANT D2 FORMAT RULES:**
- ALWAYS wrap D2 code in \`\`\`d2 code blocks
- Use proper D2 syntax with containers and connections
- Include descriptive labels with \\n line breaks
`;
    }

    private static getEraserExample(): string {
        return `
===========================
📌 Eraser Format Example
===========================
title Modern Web Application Architecture

Frontend Applications [icon: globe] {
  React Web App [icon: react, label: "Main user interface built with React, TypeScript, and Tailwind CSS"]
  Mobile App [icon: phone, label: "React Native mobile application for iOS and Android"]
  Admin Dashboard [icon: settings, label: "Administrative interface for content management"]
}

API Gateway [icon: router, label: "Request routing, rate limiting, and API versioning"] {
  Load Balancer [icon: balance-scale, label: "Distributes traffic across multiple server instances"]
  Rate Limiter [icon: clock, label: "Prevents API abuse and ensures fair usage"]
}

Auth Services [icon: shield] {
  OAuth Provider [icon: key, label: "Google, GitHub, and social login integration"]
  JWT Service [icon: certificate, label: "Token generation, validation, and refresh logic"]
  RBAC Manager [icon: users, label: "Role-based access control with fine-grained permissions"]
}

Backend Services [icon: server] {
  User Service [icon: user, label: "User profile management, preferences, and account settings"]
  Content Service [icon: document, label: "Content creation, editing, versioning, and publishing"]
  Notification Service [icon: bell, label: "Email, SMS, and push notification delivery"]
  Analytics Service [icon: chart-line, label: "User behavior tracking and business intelligence"]
}

Data Storage [icon: database] {
  PostgreSQL Primary [icon: database, label: "Main application database with ACID compliance"]
  Redis Cache [icon: memory, label: "Session storage, caching, and real-time data"]
  S3 Object Storage [icon: cloud, label: "File uploads, images, documents, and static assets"]
  Elasticsearch [icon: search, label: "Full-text search and log aggregation"]
}

Third Party Services [icon: puzzle-piece] {
  Payment Gateway [icon: credit-card, label: "Stripe integration for subscription billing"]
  Email Provider [icon: envelope, label: "SendGrid for transactional and marketing emails"]
  CDN Network [icon: globe, label: "CloudFlare for global content delivery"]
  Monitoring [icon: eye, label: "Datadog for application performance monitoring"]
}

React Web App > API Gateway: "HTTPS requests with authentication headers"
Mobile App > API Gateway: "RESTful API calls with JWT tokens"
Admin Dashboard > API Gateway: "Administrative operations and reporting"

API Gateway > Load Balancer: "Distributed request routing"
Load Balancer > Backend Services: "Load-balanced service calls"

Backend Services > Auth Services: "User authentication and authorization checks"
Auth Services > OAuth Provider: "Social login delegation"

User Service > PostgreSQL Primary: "User data persistence and queries"
Content Service > PostgreSQL Primary: "Content storage and retrieval"
Content Service > S3 Object Storage: "Media file uploads and downloads"

Notification Service > Email Provider: "Email delivery via API"
Analytics Service > Elasticsearch: "Event indexing and search queries"

Backend Services > Redis Cache: "Session management and caching"
CDN Network > S3 Object Storage: "Static asset delivery optimization"

**IMPORTANT ERASER FORMAT RULES:**
- Use descriptive component names with clear business purpose
- Include rich labels explaining functionality and technical details  
- Group related components in logical containers with appropriate icons
- Use meaningful connection labels that describe data flow and purpose
- Leverage diverse icons to make diagrams visually appealing and intuitive
- Show both technical implementation and business value
- Include external dependencies and third-party integrations
- Create visual hierarchy with proper grouping and spacing

**RECOMMENDED ERASER ICONS:**
- Frontend: globe, react, phone, monitor, browser
- Backend: server, cloud, lambda, api, microservice
- Database: database, memory, search, storage
- Auth: shield, key, certificate, user, users
- Communication: envelope, bell, router, network
- Services: puzzle-piece, settings, chart-line, balance-scale
- Infrastructure: aws, docker, kubernetes, cluster`;
    }

    public static encodeFile(file: File): string {
        return file.path + "\n" + file.content + "\n" + PromptBuilder.FILE_SEPERATOR;
    }
}
