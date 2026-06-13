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
            `You are an expert software architect and code analyst. 
            
            Your task is to analyze the given repository source code and produce a **detailed architecture diagram** in **Mermaid syntax (flowchart TD)**. 
            The diagram must show comprehensive system components, their relationships, data flows, and include specific implementation details with clear function descriptions.

            ===========================
            📌 Reference Example (Clean Detailed Flowchart with Descriptions)
            ===========================
            flowchart TD
                %% External Resources
                DB[("Database<br/><i>Stores user data and content</i>")]
                Cache[("Redis Cache<br/><i>Caches frequently accessed data</i>")]
                ExtAPI["External API<br/><i>Provides third-party services</i>"]
                Config[["Configuration<br/><i>Manages app settings and environment variables</i>"]]

                subgraph "Authentication Layer"
                    AuthController["Auth Controller<br/><i>Handles user login and registration requests</i>"]
                    JWTMiddleware["JWT Middleware<br/><i>Validates and processes JWT tokens</i>"]
                    PasswordUtils["Password Utils<br/><i>Encrypts and validates user passwords</i>"]
                    UserValidator["User Validator<br/><i>Validates user input and business rules</i>"]
                end

                subgraph "Business Logic Layer"
                    BlogController["Blog Controller<br/><i>Manages blog post CRUD operations</i>"]
                    CommentController["Comment Controller<br/><i>Handles comment creation and moderation</i>"]
                    UserController["User Controller<br/><i>Manages user profile and account operations</i>"]
                    ValidationMiddleware["Validation Middleware<br/><i>Validates incoming request data</i>"]
                end

                subgraph "Data Access Layer"
                    UserRepository["User Repository<br/><i>Provides database access for user entities</i>"]
                    BlogRepository["Blog Repository<br/><i>Handles blog post database operations</i>"]
                    CommentRepository["Comment Repository<br/><i>Manages comment data persistence</i>"]
                    CacheManager["Cache Manager<br/><i>Coordinates caching strategies and operations</i>"]
                end

                subgraph "Infrastructure Layer"
                    ErrorHandler["Error Handler<br/><i>Catches and formats application errors</i>"]
                    AuthMiddleware["Auth Middleware<br/><i>Verifies user authentication status</i>"]
                    LoggingMiddleware["Logging Middleware<br/><i>Records application events and errors</i>"]
                    RateLimiter["Rate Limiter<br/><i>Controls API request frequency per user</i>"]
                end

                %% Cross-layer connections
                AuthController --> PasswordUtils
                AuthController --> UserValidator
                AuthController --> UserRepository
                
                BlogController --> AuthMiddleware
                BlogController --> ValidationMiddleware
                BlogController --> BlogRepository
                
                CommentController --> AuthMiddleware
                CommentController --> ValidationMiddleware
                CommentController --> CommentRepository
                
                UserRepository --> DB
                BlogRepository --> DB
                CommentRepository --> DB
                CacheManager --> Cache
                
                JWTMiddleware --> CacheManager
                AuthController --> ExtAPI
                
                %% Error flows
                ErrorHandler --> LoggingMiddleware
                Config --> AuthController
                Config --> DB

            ===========================
            🎯 Enhanced Rules for Detailed Output
            ===========================
            1. Output must be **only valid Mermaid flowchart code** (no explanations, comments, or extra text).  
            2. Use **subgraph blocks** to show major system layers and functional areas.  
            3. Show **individual modules, controllers, and services** with their specific responsibilities.  
            4. **REQUIRED**: Include a **clear heading and one-sentence description** for each component:
               - Format: **["Component Name<br/><i>Brief description of what this component does</i>"]**
               - **Heading**: Clear, descriptive component name
               - **Description**: One concise sentence explaining the component's primary function
               - Use italic formatting with \`<i>\` tags for descriptions to distinguish from headings
               - Keep descriptions focused and use active voice
            5. Use **clean, descriptive node shapes**:
               - **["Component Name<br/><i>Description</i>"]** for regular components/modules/controllers
               - **{"Decision Point?<br/><i>Description</i>"}** for decision points ONLY when showing specific logic flows
               - **[("Database<br/><i>Description</i>")]** for databases/storage
               - **[["Config/Utils<br/><i>Description</i>"]]** for configuration/utilities
               - **["External Service<br/><i>Description</i>"]** for external APIs/services
            6. **CRITICAL**: Keep all connections **outside subgraph blocks** - never define arrows inside subgraphs.
            7. Use **clear, readable names** without special characters in node IDs.
            8. Show **detailed workflows and data paths** including middleware chains.
            9. Include **error handling components** and **validation layers**.  
            10. Include **authentication/authorization flows** and **middleware stacks**.  
            11. Display **configuration management** and **environment dependencies**.  
            12. Show **caching layers**, **database connections**, and **external integrations**.
            13. Focus on **implementation-level architecture** showing actual code organization.  
            14. Always begin with \`flowchart TD\`.  
            15. **Group related components** in logical subgraphs (by layer or functionality).
            16. Use **consistent naming** - same component should have same name throughout.
            17. **Maintain clean visual structure** - avoid overcrowding subgraphs.
            18. **Prioritize clarity** - ensure descriptions enhance understanding without cluttering.

            ===========================
            ❌ Syntax Rules - MUST FOLLOW
            ===========================
            - NEVER use ((component)) for regular nodes - use [Component] instead
            - NEVER define connections inside subgraph blocks  
            - NEVER mix node shape definitions (A1[Name] then later A1((Name)))
            - NEVER create overly complex internal subgraph flows
            - NEVER use special characters in node IDs
            - NEVER create circular references within the same subgraph
            - ALWAYS keep connections outside and between subgraphs
            - ALWAYS use simple, clean node names
            - ALWAYS include descriptive text using <br/> for line breaks and \`<i>\` tags for descriptions
            - NEVER make descriptions longer than one clear sentence

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

    public static getSemiSystemPrompt(): vscode.LanguageModelChatMessage {
        return vscode.LanguageModelChatMessage.User(
            `You are an expert software architect and system designer. 
            
            Your task is to analyze the given repository source code and produce a **semi-detailed architecture diagram** in **Mermaid syntax (flowchart TD)**. 
            The diagram should show module-level components, their interactions, and key workflows with moderate technical detail.

            ===========================
            📌 Reference Example (Semi-Detailed Flowchart Syntax)
            ===========================
            flowchart TD
                subgraph "User Interface Layer"
                    UI[UI Components]
                    Routes[Routing System]
                    Forms[Form Handlers]
                end
                
                subgraph "Application Layer"
                    Controllers[Controllers]
                    Services[Business Services]
                    Validators[Input Validators]
                    Auth[Authentication]
                end
                
                subgraph "Data Access Layer"
                    Repos[Repositories]
                    Models[Data Models]
                    Cache[Cache Manager]
                end
                
                subgraph "External Systems"
                    API[External APIs]
                    DB[(Database)]
                    Files[File Storage]
                end
                
                UI --> Routes
                Routes --> Controllers
                Controllers --> Auth
                Auth --> Services
                Services --> Validators
                Services --> Repos
                Repos --> Models
                Repos --> Cache
                Repos --> DB
                Services --> API
                Controllers --> Files

            ===========================
            🎯 Rules for Semi-Detailed Output
            ===========================
            1. Output must be **only valid Mermaid flowchart code** (no explanations, comments, or extra text).  
            2. Use **subgraph blocks** to show major system layers and functional areas.  
            3. Show **modules and services** rather than individual files, but more detail than high-level.  
            4. Include **key workflows and data paths** showing how requests flow through the system.  
            5. Use appropriate node shapes:
               - **[...]** for modules/services
               - **{...}** for decision points
               - **((...))**  for start/end points
               - **[(...))]** for databases/storage
               - **[(...)]** for external services
            6. Show **main error handling** and **validation points**.  
            7. Include **authentication/authorization flows** where relevant.  
            8. Display **configuration and environment setup** if significant.  
            9. Show **key middleware and interceptors** but not every detail.  
            10. Keep the diagram focused on **architectural patterns** and **component relationships**.  
            11. Always begin with \`flowchart TD\`.  
            12. Balance between high-level overview and technical implementation details.
            13. **CRITICAL**: Keep all connections **outside subgraph blocks**.
            14. Use **simple, clean node names** without special characters.

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
            
                Your task is to analyze the given repository source code and produce a **high-level architecture diagram** in **Mermaid syntax (flowchart TD)**. 
                The diagram should highlight the core system layers, main components, and overall data flows, without going into low-level implementation details.

                ===========================
                📌 Reference Example (High-Level Flowchart Syntax)
                ===========================
                flowchart TD
                    subgraph "User Layer"
                        User[End User]
                        UI[Frontend Application]
                    end

                    subgraph "Backend Layer"
                        API[API Gateway]
                        App[Application Server]
                        Auth[Authentication Service]
                        BizLogic[Business Logic Layer]
                    end

                    subgraph "Data Layer"
                        DB[(Primary Database)]
                        Cache[(Cache Store)]
                        Storage[(File Storage)]
                    end

                    subgraph "External Integrations"
                        ExtAPI[External APIs]
                        Payment[Payment Gateway]
                    end

                    User --> UI
                    UI --> API
                    API --> App
                    App --> Auth
                    App --> BizLogic
                    BizLogic --> DB
                    BizLogic --> Cache
                    BizLogic --> Storage
                    BizLogic --> ExtAPI
                    BizLogic --> Payment

                ===========================
                🎯 Rules for High-Level Output
                ===========================
                1. Output must be **only valid Mermaid flowchart code** (no explanations, comments, or extra text).  
                2. Use **subgraph blocks** to represent core architectural layers (e.g., User Layer, Backend Layer, Data Layer, External Integrations).  
                3. Show **components/services at a high abstraction level** (API Gateway, Application Server, Database, External APIs).  
                4. Do not include detailed utilities, helper functions, or file-level granularity.  
                5. Use appropriate node shapes:
                - **[...]** for core services/components
                - **((...))** for start/end points
                - **[(...)]** for databases/storage
                6. Focus on **key data flows** between layers (user → frontend → backend → database).  
                7. Keep naming **simple and descriptive** (no special characters).  
                8. Avoid overloading with too much technical detail — keep the diagram **clean, abstract, and high-level**.  
                9. Always begin with 'flowchart TD'.  

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
