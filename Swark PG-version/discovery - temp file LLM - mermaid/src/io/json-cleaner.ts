export interface CleanedModelOutput {
  detectedLanguages: string[];
  batchingRequired?: boolean;
  recommendedBatches?: number;
  batchStrategy?: string;
  batches?: Array<{
    batchNumber: number;
    files?: string[]; // Legacy support
    estimatedTokens: number;
    description: string;
    fileInclusion?: { [lang: string]: string[] }; // New batch structure
  }>;
  fileInclusion: { [lang: string]: string[] };
  fileIgnored: string[];
  ignoringPattern: { [lang: string]: string[] };
}

export class JsonCleaner {
  /**
   * Cleans and normalizes the model output JSON.
   * Keeps fileInclusion as an object.
   * @param rawInput string or object from model
   * @returns CleanedModelOutput or null if invalid
   */
  public static clean(rawInput: string | object): CleanedModelOutput | null {
    try {
      let parsed: any;
      if (typeof rawInput === "string") {
        // First, let's see what we're actually working with
        console.log("Raw input first 100 chars:", rawInput.substring(0, 100));
        console.log("Raw input around position 31:", rawInput.substring(20, 50));
        console.log("Character codes around pos 31:", 
          Array.from(rawInput.substring(25, 40)).map((c, i) => `${25+i}: '${c}' (${c.charCodeAt(0)})`));
        
        // Remove code block markers if present
        const jsonMatch = rawInput.match(
          /```json[\s\S]*?(\{[\s\S]*\})[\s\S]*?```/
        );
        let jsonStr = jsonMatch ? jsonMatch[1] : rawInput;
        
        // Clean up any potential BOM or invisible characters at the start
        jsonStr = jsonStr.replace(/^\uFEFF/, ''); // Remove BOM
        jsonStr = jsonStr.replace(/^[\s\u200B-\u200D\uFEFF]/, ''); // Remove zero-width chars
        jsonStr = jsonStr.trim();
        
        console.log("Cleaned jsonStr first 100 chars:", jsonStr.substring(0, 100));
        
        try {
          // First attempt: try parsing as-is (for well-formed JSON)
          parsed = JSON.parse(jsonStr);
        } catch (parseError) {
          console.warn('Direct JSON parse failed, attempting fixes:', parseError);
          console.log("JSON string around error position:", jsonStr.substring(20, 80));
          
          // Only apply sanitization if direct parsing fails
          let fixedJsonStr = this.sanitizeJsonString(jsonStr);
          
          try {
            parsed = JSON.parse(fixedJsonStr);
          } catch (secondError) {
            console.warn('Sanitized parse failed, trying aggressive repair:', secondError);
            
            // Try more aggressive JSON repair
            fixedJsonStr = this.aggressiveJsonRepair(jsonStr);
            
            try {
              parsed = JSON.parse(fixedJsonStr);
            } catch (thirdError) {
              console.warn('All parsing attempts failed, trying manual extraction:', thirdError);
              
              // Last resort: try to extract key parts manually
              parsed = this.extractJsonManually(jsonStr);
              if (!parsed) {
                throw thirdError;
              }
            }
          }
        }
      } else {
        parsed = rawInput;
      }
      
      // Debug validation
      console.log("Validating parsed object:");
      console.log("detectedLanguages:", Array.isArray(parsed.detectedLanguages) ? "✓ array" : "✗ not array", parsed.detectedLanguages);
      console.log("fileInclusion:", typeof parsed.fileInclusion === "object" ? "✓ object" : "✗ not object", Object.keys(parsed.fileInclusion || {}));
      console.log("fileIgnored:", Array.isArray(parsed.fileIgnored) ? "✓ array" : "✗ not array", parsed.fileIgnored?.length);
      console.log("ignoringPattern:", typeof parsed.ignoringPattern === "object" ? "✓ object" : "✗ not object", Object.keys(parsed.ignoringPattern || {}));
      console.log("batches:", Array.isArray(parsed.batches) ? "✓ array" : "✗ not array", parsed.batches?.length);
      
      // For batch responses, if there's no top-level fileInclusion but we have batches with fileInclusion,
      // create a combined fileInclusion from all batches
      if (!parsed.fileInclusion && Array.isArray(parsed.batches) && parsed.batches.length > 0) {
        console.log("Creating combined fileInclusion from batch data...");
        const combinedFileInclusion: { [lang: string]: string[] } = {};
        
        parsed.batches.forEach((batch: any) => {
          if (batch.fileInclusion) {
            Object.keys(batch.fileInclusion).forEach(lang => {
              if (!combinedFileInclusion[lang]) {
                combinedFileInclusion[lang] = [];
              }
              combinedFileInclusion[lang] = combinedFileInclusion[lang].concat(batch.fileInclusion[lang]);
            });
          }
        });
        
        // Remove duplicates
        Object.keys(combinedFileInclusion).forEach(lang => {
          combinedFileInclusion[lang] = [...new Set(combinedFileInclusion[lang])];
        });
        
        parsed.fileInclusion = combinedFileInclusion;
        console.log("Combined fileInclusion created:", Object.keys(combinedFileInclusion));
      }
      
      // Validate keys
      if (
        Array.isArray(parsed.detectedLanguages) &&
        typeof parsed.fileInclusion === "object" &&
        parsed.fileInclusion !== null &&
        Array.isArray(parsed.fileIgnored) &&
        typeof parsed.ignoringPattern === "object" &&
        parsed.ignoringPattern !== null
      ) {
        console.log("✓ All validation checks passed!");
        
        // Auto-detect batching based on presence of batches array
        const hasBatches = Array.isArray(parsed.batches) && parsed.batches.length > 0;
        const batchingRequired = parsed.batchingRequired === true || hasBatches;
        const recommendedBatches = hasBatches ? parsed.batches.length : parsed.recommendedBatches;
        const batchStrategy = batchingRequired ? 
          (parsed.batchStrategy || "Automatic batching based on token limits and logical grouping") : 
          undefined;

        return {
          detectedLanguages: parsed.detectedLanguages,
          batchingRequired,
          recommendedBatches,
          batchStrategy,
          batches: Array.isArray(parsed.batches) ? parsed.batches : undefined,
          fileInclusion: parsed.fileInclusion,
          fileIgnored: parsed.fileIgnored,
          ignoringPattern: parsed.ignoringPattern || {},
        };
      } else {
        console.log("✗ Validation failed - one or more required fields are missing or invalid");
        
        // If validation fails but we have a parsed object, try emergency extraction on the original JSON string
        if (typeof rawInput === 'string' && parsed) {
          console.log("Attempting emergency extraction due to validation failure...");
          const emergencyResult = this.emergencyExtraction(rawInput);
          if (emergencyResult) {
            console.log("Emergency extraction successful after validation failure!");
            return emergencyResult;
          }
        }
        
        return null;
      }
    } catch (err) {
      console.error("Error cleaning model output:", err);
      console.log("Failed raw input:", typeof rawInput === 'string' ? rawInput.substring(0, 200) : rawInput);
      
      // Try one more time with manual extraction as last resort
      if (typeof rawInput === 'string') {
        console.log("Attempting emergency manual extraction...");
        const emergencyResult = this.emergencyExtraction(rawInput);
        if (emergencyResult) {
          console.log("Emergency extraction successful!");
          return emergencyResult;
        }
      }
      
      return null;
    }
  }

  /**
   * Sanitizes JSON string to fix common issues that cause parsing errors
   * @param jsonStr The JSON string to sanitize
   * @returns Sanitized JSON string
   */
  private static sanitizeJsonString(jsonStr: string): string {
    let sanitized = jsonStr;

    try {
      // Step 0: Remove any invisible characters and ensure proper encoding
      sanitized = sanitized.replace(/[\u0000-\u001f\u007f-\u009f]/g, '');
      sanitized = sanitized.replace(/\uFEFF/g, ''); // Remove BOM again just in case
      
      // Step 1: Fix ONLY obvious issues - be very conservative
      // Only fix missing colons if there's clearly a missing colon (no colon after closing quote)
      sanitized = sanitized.replace(/"([^"]+)"\s+([^:"][^,}\]]*)/g, (match, prop, value) => {
        // Only add colon if value doesn't start with colon
        if (!value.trim().startsWith(':')) {
          return `"${prop}": ${value}`;
        }
        return match;
      });
      
      // Step 2: Fix only obvious trailing commas
      sanitized = sanitized.replace(/,(\s*[}\]])/g, '$1');
      
      // Step 3: Remove control characters that definitely break JSON
      sanitized = sanitized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

      // Don't do any aggressive string manipulation that could break valid JSON
      return sanitized;
    } catch (error) {
      console.warn('Error sanitizing JSON string:', error);
      return jsonStr;
    }
  }

  /**
   * More aggressive JSON repair for severely malformed JSON
   */
  private static aggressiveJsonRepair(jsonStr: string): string {
    let repaired = jsonStr;

    try {
      // Fix missing commas more aggressively
      // Look for patterns like "] "pattern" or } "pattern"
      repaired = repaired.replace(/([}\]"])\s+"/g, '$1, "');
      
      // Fix missing commas after numbers, booleans
      repaired = repaired.replace(/([0-9])\s+"([^"]+)":/g, '$1, "$2":');
      repaired = repaired.replace(/(true|false)\s+"([^"]+)":/g, '$1, "$2":');
      
      // Fix missing commas in arrays
      repaired = repaired.replace(/"\s+"(?=[^:]*[,\]}])/g, '", "');
      
      // Fix object property separation
      repaired = repaired.replace(/}\s+"/g, '}, "');
      repaired = repaired.replace(/]\s+"/g, '], "');
      
      // Ensure proper object structure
      repaired = repaired.replace(/"\s*:\s*([^,}\]]+)\s+"/g, '": $1, "');
      
      return repaired;
    } catch (error) {
      console.warn('Error in aggressive JSON repair:', error);
      return jsonStr;
    }
  }

  /**
   * Manual extraction as last resort
   */
  private static extractJsonManually(jsonStr: string): any | null {
    try {
      // Try to extract key components manually using regex
      const detectedLanguages = this.extractArrayValue(jsonStr, 'detectedLanguages');
      const fileInclusion = this.extractObjectValue(jsonStr, 'fileInclusion');
      const fileIgnored = this.extractArrayValue(jsonStr, 'fileIgnored');
      const ignoringPattern = this.extractObjectValue(jsonStr, 'ignoringPattern');
      const batches = this.extractArrayValue(jsonStr, 'batches');
      
      if (detectedLanguages && fileInclusion) {
        return {
          detectedLanguages,
          batchingRequired: Array.isArray(batches) && batches.length > 0,
          recommendedBatches: Array.isArray(batches) ? batches.length : undefined,
          batchStrategy: "Manual extraction - batching detected",
          batches,
          fileInclusion,
          fileIgnored: fileIgnored || [],
          ignoringPattern: ignoringPattern || {}
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Manual extraction failed:', error);
      return null;
    }
  }

  /**
   * Extract array value from malformed JSON (handles complex objects)
   */
  private static extractArrayValue(jsonStr: string, key: string): any[] | null {
    try {
      // Find the start of the array
      const keyPattern = new RegExp(`"${key}"\\s*:\\s*\\[`, 'i');
      const keyMatch = jsonStr.search(keyPattern);
      if (keyMatch === -1) return null;

      // Find the opening bracket
      const arrayStart = jsonStr.indexOf('[', keyMatch);
      if (arrayStart === -1) return null;

      // Find the matching closing bracket by counting brackets
      let bracketCount = 0;
      let braceCount = 0;
      let arrayEnd = -1;
      let inString = false;
      let escapeNext = false;

      for (let i = arrayStart; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '[') bracketCount++;
          else if (char === ']') bracketCount--;
          else if (char === '{') braceCount++;
          else if (char === '}') braceCount--;
          
          if (bracketCount === 0 && braceCount === 0) {
            arrayEnd = i;
            break;
          }
        }
      }

      if (arrayEnd === -1) return null;

      // Extract the array content
      const arrayContent = jsonStr.substring(arrayStart, arrayEnd + 1);
      
      // Try to parse the array
      try {
        const parsed = JSON.parse(arrayContent);
        return Array.isArray(parsed) ? parsed : null;
      } catch (parseError) {
        console.warn(`Failed to parse ${key} array:`, parseError);
        // For simple arrays, fall back to the old method
        if (key !== 'batches') {
          const simpleMatch = arrayContent.match(/\[([^\]]+)\]/);
          if (simpleMatch) {
            const items = simpleMatch[1].split(',').map(item => 
              item.trim().replace(/^"|"$/g, '')
            );
            return items;
          }
        }
        return null;
      }
    } catch (error) {
      console.warn(`Error extracting ${key} array:`, error);
      return null;
    }
  }

  /**
   * Extract object value from malformed JSON
   */
  private static extractObjectValue(jsonStr: string, key: string): any | null {
    try {
      // Find the start of the object
      const keyPattern = new RegExp(`"${key}"\\s*:\\s*{`, 'i');
      const keyMatch = jsonStr.search(keyPattern);
      if (keyMatch === -1) return null;

      // Find the opening brace
      const objectStart = jsonStr.indexOf('{', keyMatch);
      if (objectStart === -1) return null;

      // Find the matching closing brace by counting braces
      let braceCount = 0;
      let bracketCount = 0;
      let objectEnd = -1;
      let inString = false;
      let escapeNext = false;

      for (let i = objectStart; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') braceCount--;
          else if (char === '[') bracketCount++;
          else if (char === ']') bracketCount--;
          
          if (braceCount === 0 && bracketCount === 0) {
            objectEnd = i;
            break;
          }
        }
      }

      if (objectEnd === -1) return null;

      // Extract the object content
      const objectContent = jsonStr.substring(objectStart, objectEnd + 1);
      
      // Try to parse the object
      try {
        const parsed = JSON.parse(objectContent);
        return typeof parsed === 'object' && parsed !== null ? parsed : null;
      } catch (parseError) {
        console.warn(`Failed to parse ${key} object:`, parseError);
        // Return empty object as fallback
        return {};
      }
    } catch (error) {
      console.warn(`Error extracting ${key} object:`, error);
      return null;
    }
  }

  /**
   * Emergency extraction for completely malformed responses
   */
  private static emergencyExtraction(rawInput: string): CleanedModelOutput | null {
    try {
      console.log("Emergency extraction: analyzing raw input");
      
      // First, try to parse the entire JSON one more time with more lenient approach
      try {
        // Remove any potential trailing characters after the main JSON object
        let cleanJson = rawInput.trim();
        
        // Find the first { and the matching closing }
        const firstBrace = cleanJson.indexOf('{');
        if (firstBrace !== -1) {
          let braceCount = 0;
          let lastValidIndex = firstBrace;
          
          for (let i = firstBrace; i < cleanJson.length; i++) {
            if (cleanJson[i] === '{') {
              braceCount++;
            } else if (cleanJson[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                lastValidIndex = i;
                break;
              }
            }
          }
          
          cleanJson = cleanJson.substring(firstBrace, lastValidIndex + 1);
          console.log("Emergency extraction: attempting to parse extracted JSON object");
          
          const parsed = JSON.parse(cleanJson);
          
          // If we successfully parsed, check if it has the minimum required structure
          if (parsed && 
              (Array.isArray(parsed.detectedLanguages) || typeof parsed.detectedLanguages !== 'undefined')) {
            
            console.log("Emergency extraction: successful JSON parse, building result");
            
            // Build fileInclusion from batches if not present at top level
            let fileInclusion = parsed.fileInclusion;
            if (!fileInclusion && Array.isArray(parsed.batches) && parsed.batches.length > 0) {
              console.log("Emergency extraction: building fileInclusion from batches");
              fileInclusion = {};
              parsed.batches.forEach((batch: any) => {
                if (batch.fileInclusion) {
                  Object.keys(batch.fileInclusion).forEach(lang => {
                    if (!fileInclusion[lang]) {
                      fileInclusion[lang] = [];
                    }
                    fileInclusion[lang] = fileInclusion[lang].concat(batch.fileInclusion[lang]);
                  });
                }
              });
              // Remove duplicates
              Object.keys(fileInclusion).forEach(lang => {
                fileInclusion[lang] = [...new Set(fileInclusion[lang])];
              });
            }
            
            return {
              detectedLanguages: Array.isArray(parsed.detectedLanguages) ? parsed.detectedLanguages : ["typescript", "javascript"],
              batchingRequired: Array.isArray(parsed.batches) && parsed.batches.length > 0,
              recommendedBatches: Array.isArray(parsed.batches) ? parsed.batches.length : undefined,
              batchStrategy: Array.isArray(parsed.batches) ? "Automatic batching based on token limits" : undefined,
              batches: Array.isArray(parsed.batches) ? parsed.batches : undefined,
              fileInclusion: fileInclusion || { "typescript": [], "javascript": [] },
              fileIgnored: Array.isArray(parsed.fileIgnored) ? parsed.fileIgnored : ["node_modules/**", "dist/**"],
              ignoringPattern: parsed.ignoringPattern || {
                "typescript": ["//.*", "/\\*[\\s\\S]*?\\*/"],
                "javascript": ["//.*", "/\\*[\\s\\S]*?\\*/"]
              }
            };
          }
        }
      } catch (parseError) {
        console.log("Emergency extraction: JSON parse failed, falling back to pattern extraction");
      }
      
      // Try to find basic structure patterns
      const hasLanguages = /detectedLanguages/i.test(rawInput);
      const hasFiles = /file/i.test(rawInput);
      
      if (!hasLanguages && !hasFiles) {
        console.log("Emergency extraction: No recognizable patterns found");
        return null;
      }
      
      // Create a minimal valid response
      const emergencyResponse: CleanedModelOutput = {
        detectedLanguages: ["typescript", "javascript"], // Default fallback
        batchingRequired: false,
        fileInclusion: {
          "typescript": ["src/**/*.ts", "src/**/*.tsx"],
          "javascript": ["src/**/*.js", "src/**/*.jsx"]
        },
        fileIgnored: [
          "node_modules/**",
          "dist/**", 
          "build/**",
          "**/*.test.*",
          "**/*.spec.*"
        ],
        ignoringPattern: {
          "typescript": [
            "//.*",
            "/\\*[\\s\\S]*?\\*/",
            "console\\.(log|info|warn|error)\\s*\\([^)]*\\);?"
          ],
          "javascript": [
            "//.*", 
            "/\\*[\\s\\S]*?\\*/",
            "console\\.(log|info|warn|error)\\s*\\([^)]*\\);?"
          ]
        }
      };
      
      console.log("Emergency extraction: Created fallback response");
      return emergencyResponse;
      
    } catch (error) {
      console.error("Emergency extraction failed:", error);
      return null;
    }
  }
}

// export class ModelJsonCleaner {
//   /**
//    * Cleans and validates the model output, ensuring it is valid JSON and contains only expected keys.
//    * @param rawOutput string from model (may be wrapped in code block)
//    * @returns cleaned object or null if invalid
//    */
//   public static cleanModelOutput(rawOutput: string): {
//     detectedLanguages: string[];
//     fileInclusion: string[];
//     fileIgnored: string[];
//   } | null {
//     try {
//       // Remove code block markers if present
//       const jsonMatch = rawOutput.match(
//         /```json[\s\S]*?(\{[\s\S]*\})[\s\S]*?```/
//       );
//       const jsonStr = jsonMatch ? jsonMatch[1] : rawOutput;
//       const parsed = JSON.parse(jsonStr);
//       // Validate keys
//       if (
//         Array.isArray(parsed.detectedLanguages) &&
//         Array.isArray(parsed.fileInclusion) &&
//         Array.isArray(parsed.fileIgnored)
//       ) {
//         return {
//           detectedLanguages: parsed.detectedLanguages,
//           fileInclusion: parsed.fileInclusion,
//           fileIgnored: parsed.fileIgnored,
//         };
//       }
//       return null;
//     } catch (err) {
//       console.error("Error cleaning model output:", err);
//       return null;
//     }
//   }
// }
