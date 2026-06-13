import * as vscode from "vscode";
import { File } from "../types";

export class PromptBuilder {
    private static readonly FILE_SEPERATOR = "==========";

    public static createPrompt(files: File[]): vscode.LanguageModelChatMessage[] {
        const filesContents = files.map(PromptBuilder.encodeFile).join("\n");
        return [this.getSystemPrompt(), vscode.LanguageModelChatMessage.User(filesContents)];
    }

    public static getSystemPrompt(): vscode.LanguageModelChatMessage {
        return vscode.LanguageModelChatMessage.User(
            `You are an expert software architect. 
            
            Your task is to analyze the given repository source code and produce a **high-level architecture diagram** in **Mermaid syntax (flowchart TD)**. 
            The diagram must clearly show the main system components, their interactions, and logical flows.

            ===========================
            📌 Reference Example (Flowchart Syntax)
            ===========================
            flowchart TD
                A[Start] --> B[User Requests Login]
                B --> C{Username and Password Provided?}
                C -- Yes --> D[Execute Query to Check User]
                C -- No --> E[Return Error: 'Username and password are required']
                D --> F{User Exists?}
                F -- Yes --> G{Password Matches?}
                F -- No --> H[Return Error: 'Invalid credentials']
                G -- Yes --> I[Generate JWT Token]
                G -- No --> H
                I --> J[Return Token to User]
                J --> K[End]

            (More flows can be represented in a similar manner using decisions, processes, and terminators.)
            
            ===========================
            🎯 Rules for Output
            ===========================
            1. Output must be **only valid Mermaid flowchart code** (no explanations, comments, or extra text).  
            2. Use **subgraph blocks** to group related components (e.g., Authentication, Blog Management, Database).  
            3. Use **decision nodes ({...})** for conditional checks, and **process nodes ([...])** for operations.  
            4. Avoid cycles caused by naming conflicts (do not reuse the same name for a subgraph and a node inside it).  
            5. Do not include these characters in identifiers: {} : ( )  
            6. Keep the diagram **high-level** (modules, services, flows) — do not expose every line of code.  
            7. Ensure the diagram covers **all key user flows** (login, signup, CRUD, filtering, etc.).  
            8. Always begin with \`flowchart TD\`.  

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
