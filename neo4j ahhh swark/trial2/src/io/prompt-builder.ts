import * as vscode from "vscode";
import { ModelInteractor } from "../llm/model-interactor";
import { Swark55Metadata } from "./swark55-metadata-extractor";

export interface Swark55BatchInfo {
  batchNumber: number;
  files: string[];
  estimatedTokens: number;
  description: string;
}

export interface Swark55RegexPatterns {
  detectedLanguages: string[];
  batchingRequired: boolean;
  recommendedBatches?: number;
  batchStrategy?: string;
  batches?: Swark55BatchInfo[];
  fileInclusion: { [language: string]: string[] };
  fileIgnored: string[];
  ignoringPattern: {
    [language: string]: string[];
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
4. For constructing a detailed mind map, list which files and folders can be safely ignored (if uncertain, include them instead of omitting).
5. Provide an alternate version of the mind map output without ignoring any files or folders.


**Repository Analysis:**
- Total Files: ${metadata.totalFiles}
- Commit: ${metadata.selectedCommit.shortHash} - ${
      metadata.selectedCommit.message
    }

**Current Files (with path token estimates):**
${metadata.fileList
  // .slice(0, 100)
  .map((f: any) => `${f.relativePath} (${this.estimatePathTokens(f.relativePath)} path tokens)`)
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
  }
}


Generate regex patterns for each detected language that will remove:
- Single-line and multi-line comments
- Console/logging statements
- Debug statements
- Test-related imports
- Boilerplate code
- Unused code patterns

`;
  }

  /**
   * Estimate token count for a file path string
   * Using rough approximation: 1 token ≈ 4 characters for English text
   */
  private static estimatePathTokens(filePath: string): number {
    // Simple token estimation: ~4 characters per token
    // Path separators and common programming terms are often single tokens
    const pathLength = filePath.length;
    const separatorCount = (filePath.match(/[\/\\]/g) || []).length;
    const dotCount = (filePath.match(/\./g) || []).length;
    
    // Rough estimation accounting for path structure
    const estimatedTokens = Math.ceil(pathLength / 4) + separatorCount + dotCount;
    return Math.max(1, estimatedTokens); // Minimum 1 token
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
      detectedLanguages: Array.isArray(parsed.detectedLanguages) 
        ? parsed.detectedLanguages 
        : detectedLanguages,
      batchingRequired: parsed.batchingRequired === true,
      recommendedBatches: parsed.recommendedBatches,
      batchStrategy: parsed.batchStrategy,
      batches: Array.isArray(parsed.batches) ? parsed.batches : undefined,
      fileInclusion: parsed.fileInclusion || {},
      fileIgnored: Array.isArray(parsed.fileIgnored) ? parsed.fileIgnored : [],
      ignoringPattern: parsed.ignoringPattern || {},
    };

    // Ensure all detected languages have ignoring patterns
    for (const language of detectedLanguages) {
      if (!result.ignoringPattern[language]) {
        const defaults = this.getLanguageDefaultPatterns(language);
        result.ignoringPattern[language] = [
          ...defaults.loggingStatements,
          ...defaults.testBlocks,
          ...defaults.unusedImports,
          ...defaults.boilerplate
        ];
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
      detectedLanguages: detectedLanguages,
      batchingRequired: false,
      fileInclusion: {},
      fileIgnored: [],
      ignoringPattern: {},
    };

    // Extract basic file patterns from text if any
    const excludePatterns = response.match(/(?:test|dist|build|node_modules)\/[^\s]*/g) || [];
    result.fileIgnored = excludePatterns;

    // Add default ignoring patterns for each language
    for (const language of detectedLanguages) {
      const defaults = this.getLanguageDefaultPatterns(language);
      result.ignoringPattern[language] = [
        ...defaults.loggingStatements,
        ...defaults.testBlocks,
        ...defaults.unusedImports,
        ...defaults.boilerplate
      ];
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
      detectedLanguages: detectedLanguages,
      batchingRequired: false,
      fileInclusion: {},
      fileIgnored: [
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
        "**/.vscode/**",
        "**/.idea/**",
        "**/README*",
        "**/LICENSE*",
        "**/*.md",
        "**/*.txt",
        "**/*.json",
        "**/*.xml",
        "**/*.yml",
        "**/*.yaml",
      ],
      ignoringPattern: {},
    };

    // Set up file inclusion for each language
    for (const language of detectedLanguages) {
      result.fileInclusion[language] = [
        "src/**/*",
        "lib/**/*", 
        "app/**/*",
        "components/**/*",
        "pages/**/*",
        "views/**/*",
        `*.${this.getLanguageExtensions(language).join(',*.')}`
      ];
    }

    // Add default ignoring patterns for each language
    for (const language of detectedLanguages) {
      const defaults = this.getLanguageDefaultPatterns(language);
      result.ignoringPattern[language] = [
        ...defaults.loggingStatements,
        ...defaults.testBlocks,
        ...defaults.unusedImports,
        ...defaults.boilerplate
      ];
    }

    return result;
  }

  /**
   * Get file extensions for a language
   */
  private static getLanguageExtensions(language: string): string[] {
    const extensionMap: { [key: string]: string[] } = {
      typescript: ['ts', 'tsx'],
      javascript: ['js', 'jsx'],
      python: ['py'],
      java: ['java'],
      'c++': ['cpp', 'cxx', 'cc', 'c'],
      'c#': ['cs'],
      go: ['go'],
      rust: ['rs'],
      php: ['php'],
      ruby: ['rb'],
      vue: ['vue'],
    };
    return extensionMap[language.toLowerCase()] || ['*'];
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
