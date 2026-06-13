export interface CleanedModelOutput {
  detectedLanguages: string[];
  batchingRequired?: boolean;
  recommendedBatches?: number;
  batchStrategy?: string;
  batches?: Array<{
    batchNumber: number;
    files?: string[]; 
    estimatedTokens: number;
    description: string;
    fileInclusion?: { [lang: string]: string[] }; 
  }>;
  fileInclusion: { [lang: string]: string[] };
  fileIgnored: string[];
  ignoringPattern: { [lang: string]: string[] };
}

export class JsonCleaner {
  
  public static clean(rawInput: string | object): CleanedModelOutput | null {
    try {
      let parsed: any;
      if (typeof rawInput === "string") {
        
        );
        );
        ).map((c, i) => `${25+i}: '${c}' (${c.charCodeAt(0)})`));

        const jsonMatch = rawInput.match(
          /```json[\s\S]*?(\{[\s\S]*\})[\s\S]*?```/
        );
        let jsonStr = jsonMatch ? jsonMatch[1] : rawInput;

        jsonStr = jsonStr.replace(/^\uFEFF/, ''); 
        jsonStr = jsonStr.replace(/^[\s\u200B-\u200D\uFEFF]/, ''); 
        jsonStr = jsonStr.trim();
        
        );
        
        try {
          
          parsed = JSON.parse(jsonStr);
        } catch (parseError) {
          
          );

          let fixedJsonStr = this.sanitizeJsonString(jsonStr);
          
          try {
            parsed = JSON.parse(fixedJsonStr);
          } catch (secondError) {

            fixedJsonStr = this.aggressiveJsonRepair(jsonStr);
            
            try {
              parsed = JSON.parse(fixedJsonStr);
            } catch (thirdError) {

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

       ? "✓ array" : "✗ not array", parsed.detectedLanguages);
      );
       ? "✓ array" : "✗ not array", parsed.fileIgnored?.length);
      );
       ? "✓ array" : "✗ not array", parsed.batches?.length);

      if (!parsed.fileInclusion && Array.isArray(parsed.batches) && parsed.batches.length > 0) {
        
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

        Object.keys(combinedFileInclusion).forEach(lang => {
          combinedFileInclusion[lang] = [...new Set(combinedFileInclusion[lang])];
        });
        
        parsed.fileInclusion = combinedFileInclusion;
        );
      }

      if (
        Array.isArray(parsed.detectedLanguages) &&
        typeof parsed.fileInclusion === "object" &&
        parsed.fileInclusion !== null &&
        Array.isArray(parsed.fileIgnored) &&
        typeof parsed.ignoringPattern === "object" &&
        parsed.ignoringPattern !== null
      ) {

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

        if (typeof rawInput === 'string' && parsed) {
          
          const emergencyResult = this.emergencyExtraction(rawInput);
          if (emergencyResult) {
            
            return emergencyResult;
          }
        }
        
        return null;
      }
    } catch (err) {
      
       : rawInput);

      if (typeof rawInput === 'string') {
        
        const emergencyResult = this.emergencyExtraction(rawInput);
        if (emergencyResult) {
          
          return emergencyResult;
        }
      }
      
      return null;
    }
  }

  private static sanitizeJsonString(jsonStr: string): string {
    let sanitized = jsonStr;

    try {
      
      sanitized = sanitized.replace(/[\u0000-\u001f\u007f-\u009f]/g, '');
      sanitized = sanitized.replace(/\uFEFF/g, ''); 

      sanitized = sanitized.replace(/"([^"]+)"\s+([^:"][^,}\]]*)/g, (match, prop, value) => {
        
        if (!value.trim().startsWith(':')) {
          return `"${prop}": ${value}`;
        }
        return match;
      });

      sanitized = sanitized.replace(/,(\s*[}\]])/g, '$1');

      sanitized = sanitized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

      return sanitized;
    } catch (error) {
      
      return jsonStr;
    }
  }

  private static aggressiveJsonRepair(jsonStr: string): string {
    let repaired = jsonStr;

    try {

      repaired = repaired.replace(/([}\]"])\s+"/g, '$1, "');

      repaired = repaired.replace(/([0-9])\s+"([^"]+)":/g, '$1, "$2":');
      repaired = repaired.replace(/(true|false)\s+"([^"]+)":/g, '$1, "$2":');

      repaired = repaired.replace(/"\s+"(?=[^:]*[,\]}])/g, '", "');

      repaired = repaired.replace(/}\s+"/g, '}, "');
      repaired = repaired.replace(/]\s+"/g, '], "');

      repaired = repaired.replace(/"\s*:\s*([^,}\]]+)\s+"/g, '": $1, "');
      
      return repaired;
    } catch (error) {
      
      return jsonStr;
    }
  }

  private static extractJsonManually(jsonStr: string): any | null {
    try {
      
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
      
      return null;
    }
  }

  private static extractArrayValue(jsonStr: string, key: string): any[] | null {
    try {
      const pattern = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]+)\\]`, 'i');
      const match = jsonStr.match(pattern);
      if (match) {
        
        const items = match[1].split(',').map(item => 
          item.trim().replace(/^"|"$/g, '')
        );
        return items;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private static extractObjectValue(jsonStr: string, key: string): any | null {
    try {
      
      const pattern = new RegExp(`"${key}"\\s*:\\s*{`, 'i');
      if (pattern.test(jsonStr)) {
        
        return {};
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private static emergencyExtraction(rawInput: string): CleanedModelOutput | null {
    try {

      try {
        
        let cleanJson = rawInput.trim();

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

          const parsed = JSON.parse(cleanJson);

          if (parsed && 
              (Array.isArray(parsed.detectedLanguages) || typeof parsed.detectedLanguages !== 'undefined')) {

            let fileInclusion = parsed.fileInclusion;
            if (!fileInclusion && Array.isArray(parsed.batches) && parsed.batches.length > 0) {
              
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
              fileIgnored: Array.isArray(parsed.fileIgnored) ? parsed.fileIgnored : ["node_modules*.ts", "src*.tsx"],
          "javascript": ["src*.js", "src*.jsx"]
        },
        fileIgnored: [
          "node_modules*.test.*",
          "**",
            "console\\.(log|info|warn|error)\\s*\\([^)]*\\);?"
          ],
          "javascript": [
            "
            "/\\*[\\s\\S]*?\\*/",
            "console\\.(log|info|warn|error)\\s*\\([^)]*\\);?"
          ]
        }
      };

      return emergencyResponse;
      
    } catch (error) {
      
      return null;
    }
  }
}

