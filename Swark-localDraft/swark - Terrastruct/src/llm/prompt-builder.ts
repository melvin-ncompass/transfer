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
            
            Your task is to analyze the given repository source code and produce a **detailed architecture diagram** in **D2 syntax**. 
            The diagram must show comprehensive system components, their relationships, data flows, and include specific implementation details with clear function descriptions.

            ===========================
            📌 Reference Example (Clean Detailed D2 Diagram with Descriptions)
            ===========================
            # External Resources
            database: {
                label: "Database\\nStores user data and content"
                shape: cylinder
                style.fill: "#e6f3ff"
            }
            
            cache: {
                label: "Redis Cache\\nCaches frequently accessed data"
                shape: stored_data
                style.fill: "#e6f3ff"
            }
            
            external_api: {
                label: "External API\\nProvides third-party services"
                shape: cloud
                style.fill: "#fff2e6"
            }
            
            config: {
                label: "Configuration\\nManages app settings and environment variables"
                shape: hexagon
                style.fill: "#f0f8f0"
            }

            # Authentication Layer
            auth_layer: {
                label: "Authentication Layer"
                style.fill: "#f8f9fa"
                
                auth_controller: {
                    label: "Auth Controller\\nHandles user login and registration requests"
                    style.fill: "#e6f3ff"
                }
                
                jwt_middleware: {
                    label: "JWT Middleware\\nValidates and processes JWT tokens"
                    style.fill: "#e6f3ff"
                }
                
                password_utils: {
                    label: "Password Utils\\nEncrypts and validates user passwords"
                    style.fill: "#e6f3ff"
                }
                
                user_validator: {
                    label: "User Validator\\nValidates user input and business rules"
                    style.fill: "#e6f3ff"
                }
            }

            # Business Logic Layer
            business_layer: {
                label: "Business Logic Layer"
                style.fill: "#f8f9fa"
                
                blog_controller: {
                    label: "Blog Controller\\nManages blog post CRUD operations"
                    style.fill: "#e6f3ff"
                }
                
                comment_controller: {
                    label: "Comment Controller\\nHandles comment creation and moderation"
                    style.fill: "#e6f3ff"
                }
                
                user_controller: {
                    label: "User Controller\\nManages user profile and account operations"
                    style.fill: "#e6f3ff"
                }
                
                validation_middleware: {
                    label: "Validation Middleware\\nValidates incoming request data"
                    style.fill: "#e6f3ff"
                }
            }

            # Data Access Layer
            data_layer: {
                label: "Data Access Layer"
                style.fill: "#f8f9fa"
                
                user_repository: {
                    label: "User Repository\\nProvides database access for user entities"
                    style.fill: "#e6f3ff"
                }
                
                blog_repository: {
                    label: "Blog Repository\\nHandles blog post database operations"
                    style.fill: "#e6f3ff"
                }
                
                comment_repository: {
                    label: "Comment Repository\\nManages comment data persistence"
                    style.fill: "#e6f3ff"
                }
                
                cache_manager: {
                    label: "Cache Manager\\nCoordinates caching strategies and operations"
                    style.fill: "#e6f3ff"
                }
            }

            # Infrastructure Layer
            infra_layer: {
                label: "Infrastructure Layer"
                style.fill: "#f8f9fa"
                
                error_handler: {
                    label: "Error Handler\\nCatches and formats application errors"
                    style.fill: "#e6f3ff"
                }
                
                auth_middleware: {
                    label: "Auth Middleware\\nVerifies user authentication status"
                    style.fill: "#e6f3ff"
                }
                
                logging_middleware: {
                    label: "Logging Middleware\\nRecords application events and errors"
                    style.fill: "#e6f3ff"
                }
                
                rate_limiter: {
                    label: "Rate Limiter\\nControls API request frequency per user"
                    style.fill: "#e6f3ff"
                }
            }

            # Cross-layer connections
            auth_layer.auth_controller -> auth_layer.password_utils
            auth_layer.auth_controller -> auth_layer.user_validator
            auth_layer.auth_controller -> data_layer.user_repository
            
            business_layer.blog_controller -> infra_layer.auth_middleware
            business_layer.blog_controller -> business_layer.validation_middleware
            business_layer.blog_controller -> data_layer.blog_repository
            
            business_layer.comment_controller -> infra_layer.auth_middleware
            business_layer.comment_controller -> business_layer.validation_middleware
            business_layer.comment_controller -> data_layer.comment_repository
            
            data_layer.user_repository -> database
            data_layer.blog_repository -> database
            data_layer.comment_repository -> database
            data_layer.cache_manager -> cache
            
            auth_layer.jwt_middleware -> data_layer.cache_manager
            auth_layer.auth_controller -> external_api
            
            # Error flows
            infra_layer.error_handler -> infra_layer.logging_middleware
            config -> auth_layer.auth_controller
            config -> database

            ===========================
            🎯 Enhanced Rules for Detailed Output
            ===========================
            1. Output must be **only valid D2 code** (no explanations, comments, or extra text).  
            2. Use **containers** to show major system layers and functional areas.  
            3. Show **individual modules, controllers, and services** with their specific responsibilities.  
            4. **REQUIRED**: Include descriptive labels with component name and brief description:
               - Format: **label: "Component Name\\nBrief description of what this component does"**
               - **Component Name**: Clear, descriptive component name
               - **Description**: One concise sentence explaining the component's primary function
               - Use newline separator (\\n) between name and description
               - Keep descriptions focused and use active voice
            5. Use **appropriate D2 shapes and styling**:
               - **Regular components/modules/controllers**: Default rectangles with labels
               - **Databases/storage**: shape: cylinder or stored_data
               - **External services**: shape: cloud
               - **Configuration/utilities**: shape: hexagon
               - **Decision points**: shape: diamond (only when showing specific logic flows)
            6. Use **containers** for logical grouping instead of subgraphs
            7. Use **clear, readable names** with underscores (no spaces or special characters in IDs).
            8. Show **detailed workflows and data paths** including middleware chains.
            9. Include **error handling components** and **validation layers**.  
            10. Include **authentication/authorization flows** and **middleware stacks**.  
            11. Display **configuration management** and **environment dependencies**.  
            12. Show **caching layers**, **database connections**, and **external integrations**.
            13. Focus on **implementation-level architecture** showing actual code organization.  
            14. **Group related components** in logical containers (by layer or functionality).
            15. Use **consistent naming** - same component should have same name throughout.
            16. **Maintain clean visual structure** - avoid overcrowding containers.
            17. **Prioritize clarity** - ensure descriptions enhance understanding without cluttering.
            18. Use **style.fill** with light colors for visual organization.

            ===========================
            ❌ Syntax Rules - MUST FOLLOW
            ===========================
            - NEVER use Mermaid syntax - this is D2 format only
            - NEVER use brackets [] or parentheses () for nodes - use container syntax
            - NEVER use --> arrows - use -> for connections
            - NEVER create circular references within the same container
            - ALWAYS use simple, clean node names with underscores
            - ALWAYS include descriptive labels with name\\ndescription format
            - NEVER make descriptions longer than one clear sentence
            - ALWAYS use proper D2 container syntax with braces {}
            - NEVER mix syntax styles - stick to D2 throughout

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
            
            Your task is to analyze the given repository source code and produce a **semi-detailed architecture diagram** in **D2 syntax**. 
            The diagram should show module-level components, their interactions, and key workflows with moderate technical detail.

            ===========================
            📌 Reference Example (Semi-Detailed D2 Diagram Syntax)
            ===========================
            # User Interface Layer
            ui_layer: {
                label: "User Interface Layer"
                style.fill: "#f8f9fa"
                
                ui_components: {
                    label: "UI Components\\nHandles user interface rendering"
                }
                
                routing_system: {
                    label: "Routing System\\nManages application navigation"
                }
                
                form_handlers: {
                    label: "Form Handlers\\nProcesses user input forms"
                }
            }
            
            # Application Layer
            app_layer: {
                label: "Application Layer"
                style.fill: "#f8f9fa"
                
                controllers: {
                    label: "Controllers\\nCoordinates request handling"
                }
                
                business_services: {
                    label: "Business Services\\nImplements core business logic"
                }
                
                input_validators: {
                    label: "Input Validators\\nValidates incoming data"
                }
                
                authentication: {
                    label: "Authentication\\nHandles user authentication"
                }
            }
            
            # Data Access Layer
            data_layer: {
                label: "Data Access Layer"
                style.fill: "#f8f9fa"
                
                repositories: {
                    label: "Repositories\\nProvides data access abstraction"
                }
                
                data_models: {
                    label: "Data Models\\nDefines data structures"
                }
                
                cache_manager: {
                    label: "Cache Manager\\nManages caching strategies"
                }
            }
            
            # External Systems
            external_systems: {
                label: "External Systems"
                style.fill: "#f8f9fa"
                
                external_apis: {
                    label: "External APIs\\nIntegrates with third-party services"
                    shape: cloud
                }
                
                database: {
                    label: "Database\\nPersistent data storage"
                    shape: cylinder
                }
                
                file_storage: {
                    label: "File Storage\\nStores files and media"
                    shape: stored_data
                }
            }
            
            # Connections
            ui_layer.ui_components -> ui_layer.routing_system
            ui_layer.routing_system -> app_layer.controllers
            app_layer.controllers -> app_layer.authentication
            app_layer.authentication -> app_layer.business_services
            app_layer.business_services -> app_layer.input_validators
            app_layer.business_services -> data_layer.repositories
            data_layer.repositories -> data_layer.data_models
            data_layer.repositories -> data_layer.cache_manager
            data_layer.repositories -> external_systems.database
            app_layer.business_services -> external_systems.external_apis
            app_layer.controllers -> external_systems.file_storage

            ===========================
            🎯 Rules for Semi-Detailed Output
            ===========================
            ===========================
            🎯 Rules for Semi-Detailed Output
            ===========================
            1. Output must be **only valid D2 code** (no explanations, comments, or extra text).  
            2. Use **containers** to show major system layers and functional areas.  
            3. Show **modules and services** rather than individual files, but more detail than high-level.  
            4. Include **key workflows and data paths** showing how requests flow through the system.
            5. Use appropriate D2 shapes:
               - **Default rectangles** for modules/services
               - **shape: diamond** for decision points
               - **shape: cylinder** for databases/storage
               - **shape: cloud** for external services
               - **shape: stored_data** for file storage
            6. Show **main error handling** and **validation points**.  
            7. Include **authentication/authorization flows** where relevant.  
            8. Display **configuration and environment setup** if significant.  
            9. Show **key middleware and interceptors** but not every detail.  
            10. Keep the diagram focused on **architectural patterns** and **component relationships**.  
            11. Use **containers with descriptive labels** for organization.
            12. Balance between high-level overview and technical implementation details.
            13. Use **simple, clean node names** with underscores (no special characters).
            14. Include **label** with component name and brief description using \\n separator.

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
            
                Your task is to analyze the given repository source code and produce a **high-level architecture diagram** in **D2 syntax**. 
                The diagram should highlight the core system layers, main components, and overall data flows, without going into low-level implementation details.

                ===========================
                📌 Reference Example (High-Level D2 Diagram Syntax)
                ===========================
                # User Layer
                user_layer: {
                    label: "User Layer"
                    style.fill: "#f8f9fa"
                    
                    end_user: {
                        label: "End User\\nSystem users and administrators"
                        shape: person
                    }
                    
                    frontend_app: {
                        label: "Frontend Application\\nUser interface and client-side logic"
                    }
                }

                # Backend Layer
                backend_layer: {
                    label: "Backend Layer"
                    style.fill: "#f8f9fa"
                    
                    api_gateway: {
                        label: "API Gateway\\nRoutes and manages API requests"
                    }
                    
                    app_server: {
                        label: "Application Server\\nCore business logic processing"
                    }
                    
                    auth_service: {
                        label: "Authentication Service\\nUser authentication and authorization"
                    }
                    
                    business_logic: {
                        label: "Business Logic Layer\\nCore application functionality"
                    }
                }

                # Data Layer
                data_layer: {
                    label: "Data Layer"
                    style.fill: "#f8f9fa"
                    
                    primary_db: {
                        label: "Primary Database\\nMain data storage"
                        shape: cylinder
                    }
                    
                    cache_store: {
                        label: "Cache Store\\nTemporary data caching"
                        shape: stored_data
                    }
                    
                    file_storage: {
                        label: "File Storage\\nStatic files and media"
                        shape: stored_data
                    }
                }

                # External Integrations
                external_layer: {
                    label: "External Integrations"
                    style.fill: "#f8f9fa"
                    
                    external_apis: {
                        label: "External APIs\\nThird-party service integrations"
                        shape: cloud
                    }
                    
                    payment_gateway: {
                        label: "Payment Gateway\\nPayment processing services"
                        shape: cloud
                    }
                }

                # Connections
                user_layer.end_user -> user_layer.frontend_app
                user_layer.frontend_app -> backend_layer.api_gateway
                backend_layer.api_gateway -> backend_layer.app_server
                backend_layer.app_server -> backend_layer.auth_service
                backend_layer.app_server -> backend_layer.business_logic
                backend_layer.business_logic -> data_layer.primary_db
                backend_layer.business_logic -> data_layer.cache_store
                backend_layer.business_logic -> data_layer.file_storage
                backend_layer.business_logic -> external_layer.external_apis
                backend_layer.business_logic -> external_layer.payment_gateway

                ===========================
                🎯 Rules for High-Level Output
                ===========================
                1. Output must be **only valid D2 code** (no explanations, comments, or extra text).  
                2. Use **containers** to represent core architectural layers (e.g., User Layer, Backend Layer, Data Layer, External Integrations).  
                3. Show **components/services at a high abstraction level** (API Gateway, Application Server, Database, External APIs).  
                4. Do not include detailed utilities, helper functions, or file-level granularity.  
                5. Use appropriate D2 shapes:
                - **Default rectangles** for core services/components
                - **shape: person** for users/actors
                - **shape: cylinder** for databases/storage
                - **shape: cloud** for external services
                - **shape: stored_data** for file storage/cache
                6. Focus on **key data flows** between layers (user → frontend → backend → database).  
                7. Keep naming **simple and descriptive** with underscores (no special characters).  
                8. Avoid overloading with too much technical detail — keep the diagram **clean, abstract, and high-level**.  
                9. Use **containers with labels** for organization.
                10. Include **label** with component name and brief description using \\n separator.

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
