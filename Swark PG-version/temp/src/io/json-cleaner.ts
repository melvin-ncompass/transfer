export interface CleanedModelOutput {
  detectedLanguages: string[];
  fileInclusion: { [lang: string]: string[] };
  fileIgnored: string[];
  ignoringPattern: { [lang: string]: string[] };
}

export class JsonCleaner {
  
  public static clean(rawInput: string | object): CleanedModelOutput | null {
    try {
      let parsed: any;
      if (typeof rawInput === "string") {
        
        const jsonMatch = rawInput.match(
          /```json[\s\S]*?(\{[\s\S]*\})[\s\S]*?```/
        );
        const jsonStr = jsonMatch ? jsonMatch[1] : rawInput;
        parsed = JSON.parse(jsonStr);
      } else {
        parsed = rawInput;
      }
      
      if (
        Array.isArray(parsed.detectedLanguages) &&
        typeof parsed.fileInclusion === "object" &&
        Array.isArray(parsed.fileIgnored) &&
        typeof parsed.ignoringPattern === "object"
      ) {
        return {
          detectedLanguages: parsed.detectedLanguages,
          fileInclusion: parsed.fileInclusion,
          fileIgnored: parsed.fileIgnored,
          ignoringPattern: parsed.ignoringPattern || {},
        };
      }
      return null;
    } catch (err) {
      
      return null;
    }
  }
}

