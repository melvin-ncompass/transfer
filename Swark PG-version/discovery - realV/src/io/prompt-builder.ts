import * as vscode from "vscode";
import { ModelInteractor } from "../llm/model-interactor";
import { Swark55Metadata } from "./swark55-metadata-extractor";

export interface Swark55RegexPatterns {
  fileInclusion: string[];
  fileExclusion: string[];
  contentFilters: {
    [language: string]: {
      loggingStatements: string[];
      testBlocks: string[];
      unusedImports: string[];
      boilerplate: string[];
    };
  };
}

export class PromptBuilder {
  /**
   * Generate intelligent regex patterns using LLM analysis
   */

  /**
   * Build comprehensive prompt for regex generation
   */
  public static buildPrompt(metadata: Swark55Metadata): string {
    return `You are an expert code analysis assistant. You will be given a complete list of all file paths in a repository, including files in all folders and subfolders. Your job is to:

1. Analyze the entire file list and repository structure, considering all folders and nested files.
2. Identify the programming languages used across all files.
3. For each detected programming language, map the relevant file paths into that language.
4. Ignoring files that are clearly unnecessary (such as build artifacts, dependencies, coverage reports, documentation, style files, and type definitions). If you are unsure about a file, include it.
5. Generate content filtering patterns for each programming language to remove unwanted code like comments, logging statements, debug code, test blocks, and boilerplate.

**Repository Analysis:**
- Total Files: ${metadata.totalFiles}
- Commit: ${metadata.selectedCommit.shortHash} - ${
      metadata.selectedCommit.message
    }

**Current Files:**
${metadata.fileList
  // .slice(0, 100)
  .map((f: any) => `${f.relativePath} `)
  .join("\n")}

**Response Format (Single line JSON):**
{
  "detectedLanguages": [
    "typescript",
    "javascript",
    "python",
    "java"
  ],
  "fileInclusion": {
    "typescript": [
      "src/user/extension.ts",
      "src/utils/helper.ts",
      "src/components/Button/index.tsx"
    ],
    "python": [
      "scripts/analysis.py"
    ],
    "java": [
      "backend/src/Main.java"
    ]
  },
  "fileIgnored": [
    "node_modules/some-lib/index.js",
    "dist/bundle.js",
    "docs/README.md",
    "build/assets/logo.png",
    "coverage/report.html"
  ],
  "ignoringPattern": {
    "typescript": [
      "//.*",
      "/\\*[\\s\\S]*?\\*/",
      "console\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
      "debugger;?",
      "import\\s+[^;]+from\\s+['\"][^'\"]*test[^'\"]*['\"];?"
    ],
    "javascript": [
      "//.*",
      "/\\*[\\s\\S]*?\\*/",
      "console\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
      "debugger;?"
    ],
    "python": [
      "#.*",
      "print\\s*\\([^)]*\\)",
      "logging\\.(debug|info|warning|error|critical)\\s*\\([^)]*\\)",
      "\"\"\"[\\s\\S]*?\"\"\"",
      "'''[\\s\\S]*?'''"
    ],
    "java": [
      "//.*",
      "/\\*[\\s\\S]*?\\*/",
      "System\\.out\\.(print|println)\\s*\\([^)]*\\);?",
      "logger\\.(debug|info|warn|error)\\s*\\([^)]*\\);?"
    ]
  },
  {
    "Batches":[
      {
        "Batch 1:{
          "src/user/extension.ts",
          "src/utils/helper.ts",
          "src/components/Button/index.tsx"
        }
          
      }
    ]
  }
}

Generate regex patterns for each detected language that will remove:
- Single-line and multi-line comments
- Console/logging statements
- Debug statements
- Test-related imports
- Boilerplate code
- Unused code patterns

Analyze the repository and return the valid JSON as described above.
**IMPORTANT: Make sure to maintain same file fullpath as given in the above Current Files.**
`;
  }

  /**
   * Parse LLM response and extract regex patterns
   */
  private static parseRegexResponse(
    response: string,
    detectedLanguages: string[]
  ): Swark55RegexPatterns {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return this.validateAndCleanPatterns(parsed, detectedLanguages);
      }

      // Fallback parsing if JSON block not found
      return this.extractPatternsFromText(response, detectedLanguages);
    } catch (error) {
      console.error("Error parsing regex response:", error);
      return this.getFallbackPatterns(detectedLanguages);
    }
  }

  /**
   * Validate and clean parsed patterns
   */
  private static validateAndCleanPatterns(
    parsed: any,
    detectedLanguages: string[]
  ): Swark55RegexPatterns {
    const result: Swark55RegexPatterns = {
      fileInclusion: Array.isArray(parsed.fileInclusion)
        ? parsed.fileInclusion
        : [],
      fileExclusion: Array.isArray(parsed.fileExclusion)
        ? parsed.fileExclusion
        : [],
      contentFilters: {},
    };

    // Ensure all detected languages have content filters
    for (const language of detectedLanguages) {
      if (parsed.contentFilters && parsed.contentFilters[language]) {
        result.contentFilters[language] = {
          loggingStatements: Array.isArray(
            parsed.contentFilters[language].loggingStatements
          )
            ? parsed.contentFilters[language].loggingStatements
            : [],
          testBlocks: Array.isArray(parsed.contentFilters[language].testBlocks)
            ? parsed.contentFilters[language].testBlocks
            : [],
          unusedImports: Array.isArray(
            parsed.contentFilters[language].unusedImports
          )
            ? parsed.contentFilters[language].unusedImports
            : [],
          boilerplate: Array.isArray(
            parsed.contentFilters[language].boilerplate
          )
            ? parsed.contentFilters[language].boilerplate
            : [],
        };
      } else {
        result.contentFilters[language] =
          this.getLanguageDefaultPatterns(language);
      }
    }

    return result;
  }

  /**
   * Extract patterns from unstructured text response
   */
  private static extractPatternsFromText(
    response: string,
    detectedLanguages: string[]
  ): Swark55RegexPatterns {
    // Basic pattern extraction from text - this is a fallback
    const result: Swark55RegexPatterns = {
      fileInclusion: [],
      fileExclusion: [],
      contentFilters: {},
    };

    // Extract basic patterns mentioned in text
    const inclusionPatterns = response.match(/src\/\*\*\/\*\.\w+/g) || [];
    const exclusionPatterns =
      response.match(/(?:test|dist|build|node_modules)\/\*\*/g) || [];

    result.fileInclusion = inclusionPatterns;
    result.fileExclusion = exclusionPatterns;

    // Add default content filters for each language
    for (const language of detectedLanguages) {
      result.contentFilters[language] =
        this.getLanguageDefaultPatterns(language);
    }

    return result;
  }

  /**
   * Get fallback patterns when LLM fails
   */
  private static getFallbackPatterns(
    detectedLanguages: string[]
  ): Swark55RegexPatterns {
    const result: Swark55RegexPatterns = {
      fileInclusion: [
        "src/**/*",
        "lib/**/*",
        "app/**/*",
        "components/**/*",
        "pages/**/*",
        "views/**/*",
        "amplify/**/*",
        "*.{js,ts,vue,jsx,tsx,py,java,cs,go,rs,php,rb,cpp,c,h}",
        "index.html",
        "vite.config.*",
        "webpack.config.*",
        "nuxt.config.*",
      ],
      fileExclusion: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/out/**",
        "**/target/**",
        "**/.git/**",
        "**/coverage/**",
        "**/.nyc_output/**",
        "**/logs/**",
        "**/tmp/**",
        "**/temp/**",
        "**/*test*/**",
        "**/test/**",
        "**/tests/**",
        "**/__tests__/**",
        "**/spec/**",
        "**/*.spec.*",
        "**/*.test.*",
        "**/docs/**",
        "**/documentation/**",
        "**/*.min.js",
        "**/*.min.css",
        "**/*.map",
        "**/*.ico",
        "**/*.png",
        "**/*.jpg",
        "**/*.gif",
        "**/*.svg",
        "**/README.md",
        "**/LICENSE*",
        "**/*.lock",
        "**/yarn.lock",
        "**/package-lock.json",
      ],
      contentFilters: {},
    };

    for (const language of detectedLanguages) {
      result.contentFilters[language] =
        this.getLanguageDefaultPatterns(language);
    }

    return result;
  }

  /**
   * Get default content filter patterns for a specific language
   */
  private static getLanguageDefaultPatterns(language: string): {
    loggingStatements: string[];
    testBlocks: string[];
    unusedImports: string[];
    boilerplate: string[];
  } {
    const patterns = {
      javascript: {
        loggingStatements: [
          "console\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
          "logger\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
          "winston\\.(log|info|warn|error|debug)\\s*\\([^)]*\\);?",
        ],
        testBlocks: [
          "describe\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
          "it\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
          "test\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
          "expect\\([^)]*\\)\\.[^;]*;?",
          "assert\\.[^;]*;?",
        ],
        unusedImports: ["import\\s+[^;]+from\\s+[^;]+;(?![\\s\\S]*\\1)"],
        boilerplate: [
          "/\\*\\*?[\\s\\S]*?@license[\\s\\S]*?\\*/",
          "/\\*\\*?[\\s\\S]*?auto-generated[\\s\\S]*?\\*/",
          "/\\*\\*?[\\s\\S]*?@fileoverview[\\s\\S]*?\\*/",
          "//\\s*@ts-ignore.*",
          "//\\s*eslint-disable.*",
        ],
      },
      typescript: {
        loggingStatements: [
          "console\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
          "logger\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
        ],
        testBlocks: [
          "describe\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
          "it\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
          "test\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
        ],
        unusedImports: ["import\\s+[^;]+from\\s+[^;]+;(?![\\s\\S]*\\1)"],
        boilerplate: [
          "/\\*\\*?[\\s\\S]*?@license[\\s\\S]*?\\*/",
          "//\\s*@ts-ignore.*",
          "//\\s*@ts-expect-error.*",
        ],
      },
      vue: {
        loggingStatements: [
          "console\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
          "logger\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
        ],
        testBlocks: [
          "describe\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
          "it\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
          "test\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:describe|it|test|$))",
        ],
        unusedImports: ["import\\s+[^;]+from\\s+[^;]+;(?![\\s\\S]*\\1)"],
        boilerplate: [
          "<!--[\\s\\S]*?@license[\\s\\S]*?-->",
          "//\\s*@ts-ignore.*",
          "<!--\\s*eslint-disable.*-->",
        ],
      },
      python: {
        loggingStatements: [
          "print\\s*\\([^)]*\\)",
          "logging\\.(debug|info|warning|error|critical)\\s*\\([^)]*\\)",
          "logger\\.(debug|info|warning|error|critical)\\s*\\([^)]*\\)",
          "pprint\\.[^\\n]*",
        ],
        testBlocks: [
          "def\\s+test_[^:]*:[\\s\\S]*?(?=\\ndef|\\nclass|$)",
          "@pytest\\.[^\\n]*\\n[\\s\\S]*?(?=\\ndef|\\nclass|$)",
          "unittest\\.[^\\n]*",
          "assert\\s+[^\\n]*",
        ],
        unusedImports: [
          "import\\s+[^\\n]+(?![\\s\\S]*\\1)",
          "from\\s+[^\\n]+\\s+import\\s+[^\\n]+(?![\\s\\S]*\\1)",
        ],
        boilerplate: [
          "#.*?license.*",
          "#.*?auto-generated.*",
          '"""[\\s\\S]*?license[\\s\\S]*?"""',
          "'''[\\s\\S]*?license[\\s\\S]*?'''",
        ],
      },
      java: {
        loggingStatements: [
          "System\\.out\\.(print|println)\\s*\\([^)]*\\);?",
          "logger\\.(debug|info|warn|error)\\s*\\([^)]*\\);?",
          "log\\.(debug|info|warn|error)\\s*\\([^)]*\\);?",
        ],
        testBlocks: [
          "@Test[\\s\\S]*?}(?=\\s*(?:@Test|public|private|protected|$))",
          "@Before[\\s\\S]*?}(?=\\s*(?:@|public|private|protected|$))",
          "@After[\\s\\S]*?}(?=\\s*(?:@|public|private|protected|$))",
          "assertTrue\\([^)]*\\);?",
          "assertEquals\\([^)]*\\);?",
        ],
        unusedImports: ["import\\s+[^;]+;(?![\\s\\S]*\\1)"],
        boilerplate: [
          "/\\*\\*?[\\s\\S]*?@license[\\s\\S]*?\\*/",
          "/\\*\\*?[\\s\\S]*?auto-generated[\\s\\S]*?\\*/",
        ],
      },
    };

    return patterns[language as keyof typeof patterns] || patterns.javascript;
  }
}
