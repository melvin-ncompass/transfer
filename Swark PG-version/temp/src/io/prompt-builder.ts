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
      "
      "/\\*[\\s\\S]*?\\*/",
      "console\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
      "?",
      "import\\s+[^;]+from\\s+['\"][^'\"]*test[^'\"]*['\"];?"
    ],
    "javascript": [
      "
      "/\\*[\\s\\S]*?\\*/",
      "console\\.(log|info|warn|error|debug|trace)\\s*\\([^)]*\\);?",
      "?"
    ],
    "python": [
      "#.*",
      "print\\s*\\([^)]*\\)",
      "logging\\.(debug|info|warning|error|critical)\\s*\\([^)]*\\)",
      "\"\"\"[\\s\\S]*?\"\"\"",
      "'''[\\s\\S]*?'''"
    ],
    "java": [
      "
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

Analyze the repository and return the valid JSON as described above.
**IMPORTANT: Make sure to maintain same file fullpath as given in the above Current Files.**
`;
  }

  private static parseRegexResponse(
    response: string,
    detectedLanguages: string[]
  ): Swark55RegexPatterns {
    try {
      
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return this.validateAndCleanPatterns(parsed, detectedLanguages);
      }

      return this.extractPatternsFromText(response, detectedLanguages);
    } catch (error) {
      
      return this.getFallbackPatterns(detectedLanguages);
    }
  }

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

  private static extractPatternsFromText(
    response: string,
    detectedLanguages: string[]
  ): Swark55RegexPatterns {
    
    const result: Swark55RegexPatterns = {
      fileInclusion: [],
      fileExclusion: [],
      contentFilters: {},
    };

    const inclusionPatterns = response.match(/src\/\*\*\/\*\.\w+/g) || [];
    const exclusionPatterns =
      response.match(/(?:test|dist|build|node_modules)\/\*\*/g) || [];

    result.fileInclusion = inclusionPatterns;
    result.fileExclusion = exclusionPatterns;

    for (const language of detectedLanguages) {
      result.contentFilters[language] =
        this.getLanguageDefaultPatterns(language);
    }

    return result;
  }

  private static getFallbackPatterns(
    detectedLanguages: string[]
  ): Swark55RegexPatterns {
    const result: Swark55RegexPatterns = {
      fileInclusion: [
        "src*",
        "lib*",
        "app*",
        "components*",
        "pages*",
        "views*",
        "amplify*",
        "*.{js,ts,vue,jsx,tsx,py,java,cs,go,rs,php,rb,cpp,c,h}",
        "index.html",
        "vite.config.*",
        "webpack.config.*",
        "nuxt.config.*",
      ],
      fileExclusion: [
        "**/node_modulesdistbuildouttarget.gitcoverage.nyc_outputlogstmptemp*test*testtests__tests__spec*.spec.*",
        "**docsdocumentation*.min.js",
        "***.map",
        "***.png",
        "***.gif",
        "**README.md",
        "**/LICENSE*",
        "**yarn.lock",
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
          "
          "
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
          "
          "
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
          "
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
