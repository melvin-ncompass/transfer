import * as vscode from "vscode";
import { File } from "../types";

export class PromptBuilder {
    private static readonly FILE_SEPERATOR = "==========";

    public static createPrompt(files: File[]): vscode.LanguageModelChatMessage[] {
        const filesContents = files.map(PromptBuilder.encodeFile).join("\n");
        return [this.getSystemPrompt(), vscode.LanguageModelChatMessage.User(filesContents)];
    }

    public static createDetailedPrompt(files: File[]): vscode.LanguageModelChatMessage[] {
        const filesContents = files.map(PromptBuilder.encodeFile).join("\n");
        return [this.getDetailedSystemPrompt(), vscode.LanguageModelChatMessage.User(filesContents)];
    }

    public static createSemiPrompt(files: File[]): vscode.LanguageModelChatMessage[] {
        const filesContents = files.map(PromptBuilder.encodeFile).join("\n");
        return [this.getSemiSystemPrompt(), vscode.LanguageModelChatMessage.User(filesContents)];
    }

    public static getDetailedSystemPrompt(): vscode.LanguageModelChatMessage {
        return vscode.LanguageModelChatMessage.User(
            `You are an expert enterprise cloud architect and senior code analyst with deep experience in microservices, serverless architectures, and complex distributed systems.

Your task is to analyze the provided repository source code and generate a **comprehensive, highly detailed, and professional architecture diagram** in **Eraser.io syntax ONLY**.

❌ DO NOT use D2, Mermaid, Markdown, or any other diagram format.
✅ ONLY use Eraser.io syntax as shown in the example below.

The diagram must be EXTREMELY DETAILED and include:
- **ALL system layers**: External Resources, Authentication, Authorization, Business Logic, Data Access, Infrastructure, Integrations, Security, Monitoring, Configuration
- **EVERY module, controller, service, utility, middleware, and handler** found in the codebase
- **Specific AWS services** with their exact roles (Lambda functions, S3 buckets, RDS instances, SQS queues, etc.)
- **Detailed cross-layer connections** showing data flow, error propagation, and dependency chains
- **Security components** (JWT validation, encryption, secrets management, access control)
- **Error handling flows** (exception handling, logging, monitoring, alerting)
- **Database operations** (repositories, ORMs, connection pools, migrations)
- **External integrations** (third-party APIs, webhooks, message queues)
- **Configuration management** (environment variables, feature flags, settings)
- **Monitoring and observability** (logging, metrics, tracing, health checks)
- **Background processes** (scheduled jobs, async workers, event processors)
- **API endpoints and routing** (controllers, middlewares, validators)
- **Caching strategies** (Redis operations, cache invalidation, TTL management)
- **File operations** (uploads, downloads, transformations, storage)

===========================
📌 REQUIRED FORMAT: Eraser.io Syntax Example
===========================
title Enterprise System – Comprehensive Technical Architecture

External Cloud Resources [icon: cloud] {
  AWS Lambda Runtime [icon: lambda, label: "Serverless function execution environment"]
  AWS S3 Storage [icon: cloud, label: "Object storage for documents, logs, and assets"]
  AWS RDS MySQL [icon: database, label: "Primary relational database with read replicas"]
  AWS Cognito Identity [icon: key, label: "User authentication and authorization service"]
  AWS SQS Queues [icon: message-square, label: "Message queuing for async processing"]
  AWS Secrets Manager [icon: lock, label: "Centralized secrets and configuration management"]
  AWS CloudWatch [icon: activity, label: "Monitoring, logging, and alerting service"]
  Redis Cluster [icon: redis, label: "Distributed caching and session storage"]
  External APIs [icon: globe, label: "Third-party service integrations"]
}

Security and Authentication Layer [icon: shield] {
  Cognito Authentication Service [icon: key, label: "User login, registration, and session management"]
  JWT Token Validator [icon: shield-check, label: "Token verification and claims extraction"]
  Permission Manager [icon: user-check, label: "Role-based access control and permissions"]
  Encryption Utilities [icon: lock, label: "Data encryption/decryption for sensitive information"]
  API Rate Limiter [icon: timer, label: "Request throttling and abuse prevention"]
  CORS Handler [icon: shield, label: "Cross-origin request security"]
  Input Sanitizer [icon: filter, label: "SQL injection and XSS prevention"]
}

API and Request Processing Layer [icon: layers] {
  REST API Controllers [icon: server, label: "HTTP endpoint handlers for business operations"]
  GraphQL Resolvers [icon: share-2, label: "Query and mutation processing"]
  Request Validation Middleware [icon: check-circle, label: "Input validation and schema verification"]
  Authentication Middleware [icon: shield-check, label: "Token verification for protected routes"]
  Error Handling Middleware [icon: alert-triangle, label: "Global exception catching and formatting"]
  Request Logging Middleware [icon: activity, label: "HTTP request/response logging"]
  Response Formatter [icon: file-text, label: "Standardized API response structure"]
}

Business Logic and Services Layer [icon: cpu] {
  User Management Service [icon: users, label: "User CRUD operations and profile management"]
  Onboarding Workflow Engine [icon: file-text, label: "Multi-step user onboarding process"]
  Admin Decision Engine [icon: user-check, label: "Administrative approval workflows"]
  Prospect Management Service [icon: users, label: "Lead management and bulk operations"]
  Notification Engine [icon: bell, label: "Email, SMS, and push notification orchestration"]
  Business Rule Validator [icon: check-circle, label: "Complex business logic validation"]
  Workflow Coordinator [icon: activity, label: "Multi-service transaction coordination"]
  Event Publisher [icon: zap, label: "Domain event publishing for async processing"]
  File Processing Service [icon: file, label: "Document upload, validation, and transformation"]
}

Data Access and Persistence Layer [icon: database] {
  User Repository [icon: users, label: "User entity database operations"]
  Prospect Repository [icon: user-plus, label: "Prospect data persistence and queries"]
  Audit Repository [icon: book, label: "System audit trail and compliance logging"]
  Configuration Repository [icon: settings, label: "Application settings and feature flags"]
  Database Connection Pool [icon: database, label: "Connection management and optimization"]
  Query Builder [icon: search, label: "Dynamic SQL query construction"]
  Migration Manager [icon: refresh-cw, label: "Database schema versioning and updates"]
  Transaction Manager [icon: layers, label: "ACID transaction coordination"]
  Cache Repository [icon: redis, label: "Redis cache operations and invalidation"]
  S3 File Manager [icon: cloud, label: "File upload, download, and metadata management"]
}

Background Processing Layer [icon: server] {
  Async Job Processor [icon: zap, label: "Background task execution from SQS"]
  Scheduled Task Runner [icon: clock, label: "Cron jobs and periodic maintenance tasks"]
  Email Queue Processor [icon: mail, label: "Asynchronous email delivery"]
  Data Sync Service [icon: refresh-cw, label: "External system data synchronization"]
  Report Generator [icon: bar-chart, label: "Automated report creation and delivery"]
  Cleanup Service [icon: trash-2, label: "Data retention and cleanup operations"]
}

Infrastructure and Utilities Layer [icon: tool] {
  Application Logger [icon: activity, label: "Structured logging with correlation IDs"]
  Error Handler [icon: alert-triangle, label: "Exception capture, formatting, and reporting"]
  Health Check Monitor [icon: heart, label: "System health monitoring and diagnostics"]
  Metrics Collector [icon: bar-chart, label: "Performance metrics and business KPIs"]
  Configuration Manager [icon: settings, label: "Environment-specific configuration loading"]
  AWS SDK Wrapper [icon: server, label: "AWS service client abstraction and retry logic"]
  HTTP Client [icon: globe, label: "External API communication with circuit breaker"]
  Dependency Injection Container [icon: box, label: "Service registration and lifecycle management"]
}

# Connections
REST API Controllers > Authentication Middleware
REST API Controllers > Request Validation Middleware
REST API Controllers > User Management Service
REST API Controllers > Onboarding Workflow Engine
REST API Controllers > Response Formatter
Authentication Middleware > JWT Token Validator
Authentication Middleware > Permission Manager
Request Validation Middleware > Error Handling Middleware
User Management Service > User Repository
User Management Service > Cache Repository
User Management Service > Event Publisher
User Management Service > Business Rule Validator
Onboarding Workflow Engine > Business Rule Validator
Onboarding Workflow Engine > Prospect Repository
Onboarding Workflow Engine > Notification Engine
Onboarding Workflow Engine > Workflow Coordinator
Admin Decision Engine > Prospect Management Service
Admin Decision Engine > Audit Repository
Admin Decision Engine > Event Publisher
Notification Engine > Email Queue Processor
Notification Engine > AWS SQS Queues
Business Rule Validator > Error Handler
User Repository > Database Connection Pool
User Repository > AWS RDS MySQL
User Repository > Transaction Manager
Prospect Repository > Database Connection Pool
Prospect Repository > AWS RDS MySQL
Cache Repository > Redis Cluster
S3 File Manager > AWS S3 Storage
Event Publisher > Async Job Processor
Event Publisher > AWS SQS Queues
Async Job Processor > AWS SQS Queues
Async Job Processor > Data Sync Service
Email Queue Processor > External APIs
Configuration Manager > AWS Secrets Manager
Application Logger > AWS CloudWatch
Health Check Monitor > Metrics Collector
Metrics Collector > AWS CloudWatch

# Security and Error Flows
Input Sanitizer > REST API Controllers
Input Sanitizer > Error Handler
JWT Token Validator > Application Logger
JWT Token Validator > Audit Repository
Permission Manager > Audit Repository
Permission Manager > Error Handler
Error Handler > Application Logger
Error Handler > AWS CloudWatch
Error Handling Middleware > Application Logger
Error Handling Middleware > Response Formatter
Health Check Monitor > Metrics Collector
Health Check Monitor > Application Logger
Application Logger > AWS CloudWatch
Encryption Utilities > AWS Secrets Manager
API Rate Limiter > Error Handler
CORS Handler > Request Validation Middleware

# External System Integrations
AWS Lambda Runtime > AWS SQS Queues
AWS Lambda Runtime > AWS Cognito Identity
AWS Lambda Runtime > AWS RDS MySQL
AWS Lambda Runtime > Redis Cluster
AWS Lambda Runtime > AWS S3 Storage
HTTP Client > External APIs
HTTP Client > Error Handler
Email Queue Processor > External APIs
Email Queue Processor > Application Logger
Data Sync Service > External APIs
Data Sync Service > Database Connection Pool
Metrics Collector > AWS CloudWatch
Metrics Collector > AWS CloudWatch
Configuration Manager > AWS Secrets Manager
File Processing Service > AWS S3 Storage
Notification Engine > External APIs

===========================
🎯 CRITICAL: Output Rules for Eraser.io Format
===========================
1. **MANDATORY**: Output must be ONLY valid Eraser.io syntax (no D2, no Mermaid, no Markdown, no explanations, no comments).
2. **START WITH TITLE**: Always begin with "title [Descriptive System Name] – Comprehensive Technical Architecture"
3. **LAYER SYNTAX**: Use "Layer Name [icon: iconname] { ... }" format EXACTLY
4. **COMPONENT SYNTAX**: Use "Component Name [icon: iconname, label: "detailed description"]" format EXACTLY - EVERY component MUST have both icon and label
5. **CONNECTION SYNTAX**: Use "Component A > Component B" format EXACTLY - EVERY component MUST be connected to at least one other component
6. **CONNECTION SECTIONS**: Use comment headers like "# Connections", "# Security and Error Flows", "# External System Integrations"
7. **NO CURLY BRACES**: Do NOT wrap connections in curly braces like "Connections { ... }" - use simple comment headers instead
6. **NO D2/MARKDOWN**: Do not use label:, shape:, style.fill:, or other D2/Markdown-specific syntax
7. **NO EXPLANATORY TEXT**: Do not include any explanatory text, headers, or comments at the beginning or end
8. **MAXIMUM DETAIL REQUIRED**: Include EVERY component found in the codebase - controllers, services, utilities, middlewares, repositories, handlers, validators, etc.
9. **SPECIFIC LABELS**: Each component must have a detailed, technical label explaining its exact purpose and functionality
10. **COMPREHENSIVE CONNECTIONS**: Show ALL relationships between components, including data flow, error handling, security checks, and external calls
11. **LAYERED ARCHITECTURE**: Organize components into logical architectural layers (Security, API, Business Logic, Data Access, Background Processing, Infrastructure)
12. **AWS SERVICE SPECIFICITY**: Be specific about AWS services (e.g., "AWS RDS MySQL", "AWS S3 Storage", "AWS Lambda Runtime")
13. **ERROR AND SECURITY FLOWS**: Dedicate separate connection groups for error handling and security flows
14. **BACKGROUND PROCESSES**: Include all async processing, scheduled jobs, and background services
15. **EXTERNAL INTEGRATIONS**: Show all third-party API integrations and external system connections
16. **MONITORING AND OBSERVABILITY**: Include logging, metrics, health checks, and monitoring components
17. **CONFIGURATION MANAGEMENT**: Show environment variables, secrets, and configuration components
18. **DATABASE OPERATIONS**: Include repositories, connection pools, migrations, and transaction management
19. **CACHING STRATEGIES**: Detail cache operations, invalidation, and TTL management
20. **FILE OPERATIONS**: Include file upload, download, transformation, and storage components

===========================
🔌 MANDATORY CONNECTION RULES
===========================
21. **ALL COMPONENTS MUST BE CONNECTED**: Every single component must have at least one connection (either incoming or outgoing)
22. **LOGICAL FLOW**: Connections must follow logical data flow patterns (User Input → Processing → Storage → Response)
23. **NO ORPHANED COMPONENTS**: If a component exists, it must be connected to the system flow
24. **BIDIRECTIONAL WHEN NEEDED**: Use bidirectional connections (A > B and B > A) when components interact both ways
25. **GROUP CONNECTIONS**: Organize connections into logical groups (Main Flow, Security Flow, Error Flow, Background Flow)
26. **COMPLETE PATHS**: Show complete request-to-response paths through the system
27. **ALL LAYERS CONNECTED**: Every layer must connect to at least one other layer

===========================
🎨 MANDATORY ICON RULES
===========================
28. **EVERY COMPONENT NEEDS ICON**: No component should be without an icon - use appropriate icons from this list:
    - server, cpu, database, layers, shield, key, lock, users, user, globe, cloud, mail, file, settings, activity, tool, check-circle, alert-triangle, heart, bar-chart, clock, zap, refresh-cw, search, filter, share-2, cog, archive, book, box, timer, bell, trash-2, edit, eye, shuffle, monitor, cylinder, edit-3, upload-cloud, download-cloud, folder, link, message-square, log-out, user-check, bug, terminal, wifi, bluetooth, headphones, camera, video, phone, smartphone, tablet, laptop, desktop, tv, printer, mouse, keyboard, gamepad-2, joystick, disc, hard-drive, save, folder-open, file-text, image, video-camera, music
29. **ICON RELEVANCE**: Choose icons that visually represent the component's function:
    - Authentication: shield, key, lock, user-check
    - Data/Storage: database, cylinder, archive, save, hard-drive
    - Processing: cpu, server, cog, layers
    - Network/API: globe, wifi, share-2, link
    - Users: users, user, user-check
    - Security: shield, lock, key
    - Monitoring: activity, heart, bar-chart, eye
    - Files: file, folder, image, upload-cloud, download-cloud
    - Configuration: settings, tool
    - Messaging: mail, message-square, bell
    - External: cloud, globe
30. **CONSISTENT ICONS**: Use the same icon type for similar components across the diagram

===========================
📐 EXAMPLE PERFECT CONNECTION PATTERN
===========================
Here's how every component should be connected in logical flows:

# Main Request Flow
User Input > Authentication Layer
Authentication Layer > Request Validation
Request Validation > Business Logic Service
Business Logic Service > Data Repository
Data Repository > Database
Business Logic Service > Response Formatter
Response Formatter > User Output

# Security Flow
All API Endpoints > Authentication Middleware
Authentication Middleware > JWT Validator
JWT Validator > Permission Manager
Permission Manager > Audit Logger
Permission Manager > Audit Logger

# Error Handling Flow
All Components > Error Handler
Error Handler > Logger
Logger > Monitoring System

# Background Processing Flow
Event Triggers > Message Queue
Message Queue > Background Processor
Background Processor > Database Updates
Background Processor > Notification Service

===========================
📂 Input Format
===========================
Code files are provided in the following format:
• Full file path
• File content
• Separator: '${PromptBuilder.FILE_SEPERATOR}'

ANALYZE EVERY FILE THOROUGHLY and create the most comprehensive architecture diagram possible, showing the complete technical implementation with all components, their relationships, and data flows.
`
        );
    }

    public static getSemiSystemPrompt(): vscode.LanguageModelChatMessage {
        return vscode.LanguageModelChatMessage.User(
            `You are an expert software architect and system designer.

Your task is to analyze the given repository source code and produce a **semi-detailed architecture diagram** in **Eraser.io syntax ONLY**.

❌ DO NOT use D2, Mermaid, or any other diagram format.
✅ ONLY use Eraser.io syntax as shown in the example below.

The diagram should show module-level components, their interactions, and key workflows with moderate technical detail.

            ===========================
            📌 REQUIRED FORMAT: Eraser.io Syntax Example
            ===========================
            title Application Architecture Overview

            External Systems [icon: cloud] {
              Database [icon: cylinder, label: "Primary data storage"]
              Cache [icon: database, label: "Performance optimization"]
              External APIs [icon: globe, label: "Third-party integrations"]
            }

            API Layer [icon: layers] {
              REST Controllers [icon: server, label: "Handle HTTP requests"]
              GraphQL Resolvers [icon: share-2, label: "Query and mutation handling"]
              Middleware Stack [icon: filter, label: "Request processing pipeline"]
            }

            Business Layer [icon: cpu] {
              Services [icon: cog, label: "Core business logic"]
              Validators [icon: check-circle, label: "Input validation"]
              Event Handlers [icon: zap, label: "Asynchronous processing"]
            }

            Data Layer [icon: database] {
              Repositories [icon: archive, label: "Data access abstraction"]
              ORM Models [icon: layers, label: "Database entity mapping"]
              Cache Manager [icon: zap, label: "Caching strategies"]
            }

            # Connections
            REST Controllers > Middleware Stack
            REST Controllers > Services
            Middleware Stack > Services
            GraphQL Resolvers > Services
            Services > Validators
            Services > Repositories
            Services > Event Handlers
            Validators > Services
            Repositories > Database
            Repositories > ORM Models
            Cache Manager > Cache
            Event Handlers > External APIs
            ORM Models > Database

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
            10. **ALL COMPONENTS CONNECTED**: Every single component must have at least one connection (incoming or outgoing)
            10. **LOGICAL FLOW**: Show complete request-to-response paths through the system
            11. **NO ORPHANED COMPONENTS**: If a component exists, it must be connected to system flow
            12. **APPROPRIATE ICONS**: Use relevant icons from this list: server, cpu, database, layers, shield, key, users, globe, cloud, mail, file, settings, activity, tool, check-circle, alert-triangle, heart, bar-chart, clock, zap, refresh-cw, search, filter, share-2, cog, archive, book, cylinder, monitor
            17. Keep the diagram focused on **architectural patterns** and **component relationships**.
            18. Balance between high-level overview and technical implementation details.
            19. Use **clear connection flows** with > arrows.
            20. Use **simple, clean component names**.

            ===========================
            📂 Input Format
            ===========================
            Code files are provided in the following format:
            • Full file path
            • File content
            • Separator: '${PromptBuilder.FILE_SEPERATOR}'
            `
        );
    }

    public static getSystemPrompt(): vscode.LanguageModelChatMessage {
        return vscode.LanguageModelChatMessage.User(
            `You are an expert software architect and system designer.

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
            8. **NO MARKDOWN**: Do not wrap in code blocks or add markdown formatting
            9. **HIGH-LEVEL FOCUS**: Show core architectural layers, main components, and overall data flows
            10. **ALL COMPONENTS CONNECTED**: Every single component must have at least one connection
            11. **COMPLETE FLOW**: Show full user request to response paths
            12. **APPROPRIATE ICONS**: Use relevant icons: server, cpu, database, users, globe, cloud, mail, shield, key, monitor, layers

            ===========================
            📂 Input Format
            ===========================
            Code files are provided in the following format:
            • Full file path
            • File content
            • Separator: '${PromptBuilder.FILE_SEPERATOR}'
            `
        );
    }

    public static encodeFile(file: File): string {
        return file.path + "\n" + file.content + PromptBuilder.FILE_SEPERATOR;
    }
}
