import { ModelInteractor } from "../llm/model-interactor";
import * as vscode from "vscode";
import { OpenAI } from "openai";

function getOpenAIClient(): OpenAI {
  // Get API key from VS Code settings
  const config = vscode.workspace.getConfiguration("swark6");
  const apiKey =
    config.get<string>("openaiApiKey") || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenAI API key not found. Please set it in VS Code settings (swark6.openaiApiKey) or environment variable OPENAI_API_KEY"
    );
  }

  return new OpenAI({ apiKey,baseURL:"https://api.deepseek.com" });
}
export class FileAnalyzer {
  private static intializeModel = async () => {
    return ModelInteractor.getModel();
  };

  public static analyzeFileUsingModel = async (
    prompt: string,
    promptTokens: number
  ) => {
    const model = await this.intializeModel();
    try {
      console.log("Initialized model Before model interaction"); // [DONE - Step 3]
      const response = await ModelInteractor.sendPrompt(model, [
        vscode.LanguageModelChatMessage.User(prompt),
      ]);

      console.log("Initialized model after model interaction"); // [DONE - Step 3]

      return response;
    } catch (error) {
      console.error("Error in initializing model:", error);
      return null;
    }
  };

  public static async analyzeFileUsingOpenAI(
    prompt: string,
    promptTokens: number
  ): Promise<string | null> {
    try {
      const openai = getOpenAIClient(); // Get client with proper API key
      const MAX_MODEL_TOKENS = 128000 - promptTokens - 1000;
      console.log(
        "Calling OpenAI API with prompt tokens:",
        promptTokens,
        MAX_MODEL_TOKENS
      );
      const response = await openai.chat.completions.create({
        model: "deepseek-chat", // or "gpt-3.5-turbo"         "deepseek"
        messages: [
          {
            role: "system",
            content: "You are a helpful code analysis assistant.",
          },
          { role: "user", content: prompt },
        ],
        reasoning_effort: "minimal",
        verbosity: "low",
        // max_completion_tokens: MAX_MODEL_TOKENS, // adjust as needed
        // temperature: 0.2,
      });
      console.log("OpenAI API response:", response);
      // Return the model's reply
      return response.choices[0]?.message?.content || null;
    } catch (error) {
      console.error("OpenAI API error:", error);
      return null;
    }
  }
}
