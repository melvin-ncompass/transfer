export interface CleanedModelOutput {
  detectedLanguages: string[];
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
        // Remove code block markers if present
        const jsonMatch = rawInput.match(
          /```json[\s\S]*?(\{[\s\S]*\})[\s\S]*?```/
        );
        const jsonStr = jsonMatch ? jsonMatch[1] : rawInput;
        parsed = JSON.parse(jsonStr);
      } else {
        parsed = rawInput;
      }
      // Validate keys
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
      console.error("Error cleaning model output:", err);
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
