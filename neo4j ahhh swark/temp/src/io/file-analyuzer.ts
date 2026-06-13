import { ModelInteractor } from "../llm/model-interactor";
import * as vscode from "vscode";
import { OpenAI } from "openai";

function getOpenAIClient(): OpenAI {
  
  const config = vscode.workspace.getConfiguration("swark6");
  const apiKey =
    config.get<string>("openaiApiKey") || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenAI API key not found. Please set it in VS Code settings (swark6.openaiApiKey) or environment variable OPENAI_API_KEY"
    );
  }

  return new OpenAI({ apiKey,baseURL:"https:
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
       
      const response = await ModelInteractor.sendPrompt(model, [
        vscode.LanguageModelChatMessage.User(prompt),
      ]);

      return response;
    } catch (error) {
      
      return null;
    }
  };

  public static async analyzeFileUsingOpenAI(
    prompt: string,
    promptTokens: number
  ): Promise<string | null> {
    try {
      const openai = getOpenAIClient(); 
      const MAX_MODEL_TOKENS = 128000 - promptTokens - 1000;
      
      const response = await openai.chat.completions.create({
        model: "deepseek-chat", 
        messages: [
          {
            role: "system",
            content: "You are a helpful code analysis assistant.",
          },
          { role: "user", content: prompt },
        ],
        reasoning_effort: "minimal",
        verbosity: "low",

      });

      return response.choices[0]?.message?.content || null;
    } catch (error) {
      
      return null;
    }
  }
}
