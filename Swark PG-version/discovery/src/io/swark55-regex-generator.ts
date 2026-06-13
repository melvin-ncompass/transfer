// import * as vscode from "vscode";
// import { ModelInteractor } from "../llm/model-interactor";
// import { Swark55Metadata } from "./swark55-metadata-extractor";

// export interface Swark55RegexPatterns {
//   fileInclusion: string[];
//   fileExclusion: string[];
//   contentFilters: {
//     [language: string]: {
//       loggingStatements: string[];
//       testBlocks: string[];
//       unusedImports: string[];
//       boilerplate: string[];
//     };
//   };
// }

// export class Swark55RegexGenerator {
//   /**
//    * Generate intelligent regex patterns using LLM analysis
//    */
//   public static async generatePatterns(
//     metadata: Swark55Metadata
//   ): Promise<Swark55RegexPatterns> {
//     try {
//       const model = await ModelInteractor.getModel();
//       const prompt = this.buildRegexPrompt(metadata);
//       const response = await ModelInteractor.sendPrompt(model, [
//         vscode.LanguageModelChatMessage.User(prompt),
//       ]);

//       return this.parseRegexResponse(response, metadata.detectedLanguages);
//     } catch (error) {
//       console.error("Error generating regex patterns:", error);
//       return this.getFallbackPatterns(metadata.detectedLanguages);
//     }
//   }

//   /**
//    * Build comprehensive prompt for regex generation
//    */
//   private static buildRegexPrompt(metadata: Swark55Metadata): string {
//     return `You are an expert code analysis assistant. Analyze this repository structure and generate intelligent regex patterns for filtering files and content.

// **Repository Analysis:**
// - Detected Languages: ${metadata.detectedLanguages.join(", ")}
// - Total Files: ${metadata.totalFiles}
// - Commit: ${metadata.selectedCommit.shortHash} - ${
//       metadata.selectedCommit.message
//     }

// **Directory Structure:**
// \`\`\`
// ${metadata.directoryStructure}
// \`\`\`

// **Current Files :**
// ${metadata.fileList.map((f) => `${f.path} `).join("\n")}

// **Task 1: Generate File-Level Regex Patterns**
// Create regex patterns for:
// 1. **INCLUSION patterns** - Files that should be analyzed (source code, entry points, core logic)
// 2. **EXCLUSION patterns** - Files that should be skipped (tests, docs, build artifacts, deps)

// **Task 2: Generate Content-Level Regex Patterns**
// For each detected language, create regex patterns to remove:
// 1. **Logging/Debug Statements** - console.log, print(), logger calls, debug statements
// 2. **Test Blocks** - describe(), it(), @Test, test functions, assertion blocks
// 3. **Unused Imports** - import statements not referenced in code
// 4. **Boilerplate** - license headers, auto-generated comments, template code

// **Requirements:**
// - Use valid JavaScript regex syntax (no flags in patterns)
// - Be specific to the detected languages and project structure
// - Preserve functional code, classes, methods, and core logic
// - Target common noise patterns while being conservative

// **Response Format (JSON):**
// \`\`\`json
// {
//   "fileInclusion": [
//     "src/**/*.{ts,js}",
//     "lib/**/*.py",
//     "app/**/*.java"
//   ],
//   "fileExclusion": [
//     "**/*test*/**",
//     "**/test/**",
//     "node_modules/**",
//     "dist/**",
//     "build/**"
//   ],
//   "contentFilters": {
//     "javascript": {
//       "loggingStatements": [
//         "console\\.(log|info|warn|error|debug)\\s*\\([^)]*\\);?",
//         "logger\\.(log|info|warn|error|debug)\\s*\\([^)]*\\);?"
//       ],
//       "testBlocks": [
//         "describe\\s*\\([^)]*\\)\\s*{[^}]*}",
//         "it\\s*\\([^)]*\\)\\s*{[^}]*}",
//         "test\\s*\\([^)]*\\)\\s*{[^}]*}"
//       ],
//       "unusedImports": [
//         "import\\s+[^;]+;(?![\\s\\S]*\\1)"
//       ],
//       "boilerplate": [
//         "/\\*\\*?[\\s\\S]*?@license[\\s\\S]*?\\*/",
//         "/\\*\\*?[\\s\\S]*?auto-generated[\\s\\S]*?\\*/"
//       ]
//     }
//   }
// }
// \`\`\`

// Analyze the repository and provide optimized patterns for this specific codebase.`;
//   }

//   /**
//    * Parse LLM response and extract regex patterns
//    */
//   private static parseRegexResponse(
//     response: string,
//     detectedLanguages: string[]
//   ): Swark55RegexPatterns {
//     try {
//       // Try to extract JSON from response
//       const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
//       if (jsonMatch) {
//         const parsed = JSON.parse(jsonMatch[1]);
//         return this.validateAndCleanPatterns(parsed, detectedLanguages);
//       }

//       // Fallback parsing if JSON block not found
//       return this.extractPatternsFromText(response, detectedLanguages);
//     } catch (error) {
//       console.error("Error parsing regex response:", error);
//       return this.getFallbackPatterns(detectedLanguages);
//     }
//   }

//   /**
//    * Validate and clean parsed patterns
//    */
//   private static validateAndCleanPatterns(
//     parsed: any,
//     detectedLanguages: string[]
//   ): Swark55RegexPatterns {
//     const result: Swark55RegexPatterns = {
//       fileInclusion: Array.isArray(parsed.fileInclusion)
//         ? parsed.fileInclusion
//         : [],
//       fileExclusion: Array.isArray(parsed.fileExclusion)
//         ? parsed.fileExclusion
//         : [],
//       contentFilters: {},
//     };

//     // Ensure all detected languages have content filters
//     for (const language of detectedLanguages) {
//       if (parsed.contentFilters && parsed.contentFilters[language]) {
//         result.contentFilters[language] = {
//           loggingStatements: Array.isArray(
//             parsed.contentFilters[language].loggingStatements
//           )
//             ? parsed.contentFilters[language].loggingStatements
//             : [],
//           testBlocks: Array.isArray(parsed.contentFilters[language].testBlocks)
//             ? parsed.contentFilters[language].testBlocks
//             : [],
//           unusedImports: Array.isArray(
//             parsed.contentFilters[language].unusedImports
//           )
//             ? parsed.contentFilters[language].unusedImports
//             : [],
//           boilerplate: Array.isArray(
//             parsed.contentFilters[language].boilerplate
//           )
//             ? parsed.contentFilters[language].boilerplate
//             : [],
//         };
//       } else {
//         result.contentFilters[language] =
//           this.getLanguageDefaultPatterns(language);
//       }
//     }

//     return result;
//   }

//   /**
//    * Extract patterns from unstructured text response
//    */
//   private static extractPatternsFromText(
//     response: string,
//     detectedLanguages: string[]
//   ): Swark55RegexPatterns {
//     // Basic pattern extraction from text - this is a fallback
//     const result: Swark55RegexPatterns = {
//       fileInclusion: [],
//       fileExclusion: [],
//       contentFilters: {},
//     };

//     // Extract basic patterns mentioned in text
//     const inclusionPatterns = response.match(/src\/\*\*\/\*\.\w+/g) || [];
//     const exclusionPatterns =
//       response.match(/(?:test|dist|build|node_modules)\/\*\*/g) || [];

//     result.fileInclusion = inclusionPatterns;
//     result.fileExclusion = exclusionPatterns;

//     // Add default content filters for each language
//     for (const language of detectedLanguages) {
//       result.contentFilters[language] =
//         this.getLanguageDefaultPatterns(language);
//     }

//     return result;
//   }

//   /**
//    * Get fallback patterns when LLM fails
//    */
//   private static getFallbackPatterns(
//     detectedLanguages: string[]
//   ): Swark55RegexPatterns {
//     const result: Swark55RegexPatterns = {
//       fileInclusion: [
//         "src/**/*",
//         "lib/**/*",
//         "app/**/*",
//         "components/**/*",
//         "pages/**/*",
//         "views/**/*",
//         "amplify/**/*",
//         "*.{js,ts,vue,jsx,tsx,py,java,cs,go,rs,php,rb,cpp,c,h}",
//         "index.html",
//         "vite.config.*",
//         "webpack.config.*",
//         "nuxt.config.*",
//       ],
//       fileExclusion: [
//         "**/node_modules/**",
//         "**/dist/**",
//         "**/build/**",
//         "**/out/**",
//         "**/target/**",
//         "**/.git/**",
//         "**/coverage/**",
//         "**/.nyc_output/**",
//         "**/logs/**",
//         "**/tmp/**",
//         "**/temp/**",
//         "**/*test*/**",
//         "**/test/**",
//         "**/tests/**",
//         "**/__tests__/**",
//         "**/spec/**",
//         "**/*.spec.*",
//         "**/*.test.*",
//         "**/docs/**",
//         "**/documentation/**",
//         "**/*.min.js",
//         "**/*.min.css",
//         "**/*.map",
//         "**/*.ico",
//         "**/*.png",
//         "**/*.jpg",
//         "**/*.gif",
//         "**/*.svg",
//         "**/README.md",
//         "**/LICENSE*",
//         "**/*.lock",
//         "**/yarn.lock",
//         "**/package-lock.json",
//       ],
//       contentFilters: {},
//     };

//     for (const language of detectedLanguages) {
//       result.contentFilters[language] =
//         this.getLanguageDefaultPatterns(language);
//     }

//     return result;
//   }

//   /**
//    * Get default content filter patterns for a specific language
//    */
//   private static getLanguageDefaultPatterns(language: string): {
//     loggingStatements: string[];
//     testBlocks: string[];
//     unusedImports: string[];
//     boilerplate: string[];
//   } {
//     const patterns = {
//       javascript: {
//         loggingStatements: [
//           "console\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
//           "logger\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
//           "winston\\.(log|info|warn|error|debug)\\s*\\([^)]*\\);?",
//         ],
//         testBlocks: [
//           "describe\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
//           "it\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
//           "test\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
//           "expect\\([^)]*\\)\\.[^;]*;?",
//           "assert\\.[^;]*;?",
//         ],
//         unusedImports: ["import\\s+[^;]+from\\s+[^;]+;(?![\\s\\S]*\\1)"],
//         boilerplate: [
//           "/\\*\\*?[\\s\\S]*?@license[\\s\\S]*?\\*/",
//           "/\\*\\*?[\\s\\S]*?auto-generated[\\s\\S]*?\\*/",
//           "/\\*\\*?[\\s\\S]*?@fileoverview[\\s\\S]*?\\*/",
//           "//\\s*@ts-ignore.*",
//           "//\\s*eslint-disable.*",
//         ],
//       },
//       typescript: {
//         loggingStatements: [
//           "console\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
//           "logger\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
//         ],
//         testBlocks: [
//           "describe\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
//           "it\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
//           "test\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
//         ],
//         unusedImports: ["import\\s+[^;]+from\\s+[^;]+;(?![\\s\\S]*\\1)"],
//         boilerplate: [
//           "/\\*\\*?[\\s\\S]*?@license[\\s\\S]*?\\*/",
//           "//\\s*@ts-ignore.*",
//           "//\\s*@ts-expect-error.*",
//         ],
//       },
//       vue: {
//         loggingStatements: [
//           "console\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
//           "logger\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
//         ],
//         testBlocks: [
//           "describe\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
//           "it\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
//           "test\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
//         ],
//         unusedImports: ["import\\s+[^;]+from\\s+[^;]+;(?![\\s\\S]*\\1)"],
//         boilerplate: [
//           "<!--[\\s\\S]*?@license[\\s\\S]*?-->",
//           "//\\s*@ts-ignore.*",
//           "<!--\\s*eslint-disable.*-->",
//         ],
//       },
//       python: {
//         loggingStatements: [
//           "print\\s*\\([^)]*\\)",
//           "logging\\.(debug|info|warning|error|critical)\\s*\\([^)]*\\)",
//           "logger\\.(debug|info|warning|error|critical)\\s*\\([^)]*\\)",
//           "pprint\\.[^\\n]*",
//         ],
//         testBlocks: [
//           "def\\s+test_[^:]*:[\\s\\S]*?(?=\\ndef|\\nclass|$)",
//           "@pytest\\.[^\\n]*\\n[\\s\\S]*?(?=\\ndef|\\nclass|$)",
//           "unittest\\.[^\\n]*",
//           "assert\\s+[^\\n]*",
//         ],
//         unusedImports: [
//           "import\\s+[^\\n]+(?![\\s\\S]*\\1)",
//           "from\\s+[^\\n]+\\s+import\\s+[^\\n]+(?![\\s\\S]*\\1)",
//         ],
//         boilerplate: [
//           "#.*?license.*",
//           "#.*?auto-generated.*",
//           '"""[\\s\\S]*?license[\\s\\S]*?"""',
//           "'''[\\s\\S]*?license[\\s\\S]*?'''",
//         ],
//       },
//       java: {
//         loggingStatements: [
//           "System\\.out\\.(print|println)\\s*\\([^)]*\\);?",
//           "logger\\.(debug|info|warn|error)\\s*\\([^)]*\\);?",
//           "log\\.(debug|info|warn|error)\\s*\\([^)]*\\);?",
//         ],
//         testBlocks: [
//           "@Test[\\s\\S]*?}(?=\\s*(?:@Test|public|private|protected|$))",
//           "@Before[\\s\\S]*?}(?=\\s*(?:@|public|private|protected|$))",
//           "@After[\\s\\S]*?}(?=\\s*(?:@|public|private|protected|$))",
//           "assertTrue\\([^)]*\\);?",
//           "assertEquals\\([^)]*\\);?",
//         ],
//         unusedImports: ["import\\s+[^;]+;(?![\\s\\S]*\\1)"],
//         boilerplate: [
//           "/\\*\\*?[\\s\\S]*?@license[\\s\\S]*?\\*/",
//           "/\\*\\*?[\\s\\S]*?auto-generated[\\s\\S]*?\\*/",
//         ],
//       },
//     };

//     return patterns[language as keyof typeof patterns] || patterns.javascript;
//   }
// }
