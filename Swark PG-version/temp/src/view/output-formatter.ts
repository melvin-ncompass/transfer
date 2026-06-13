import * as vscode from "vscode";
import { D2LinkGenerator } from "./d2/link-generator";
import { telemetry } from "../telemetry";

export class OutputFormatter {
  public static getDiagramFileContent(
    modelName: string,
    llmResponse: string
  ): string {
    let d2Block = this.getD2Block(llmResponse);
    let d2Code = d2Block.replace(/```d2|```/g, "").trim();

    const linkGenerator = new D2LinkGenerator(d2Code);

    return `<p align="center">
    <a href="https:
        <img src="https:
    </a>
</p>
<p align="center">
    <b>Automatic Architecture Diagrams from Code</b><br />
    <a href="https:
</p>

## Usage Instructions

1. **Render the Diagram**: Use the links below to open it in D2 Playground (free) or TerraStruct (requires account), or install the [D2 VS Code extension](https:
2. **Recommended Model**: If available for you, use \`claude-3.5-sonnet\` [language model](vscode:
3. **Iterate for Best Results**: Language models are non-deterministic. Generate the diagram multiple times and choose the best result.

## Generated Content
**Model**: ${modelName} - [Change Model](vscode:
**D2 Playground**: [Edit](${linkGenerator.createViewLink()}) | **TerraStruct**: [Open](${linkGenerator.createTerraStructLink()})

${d2Block}`;
  }

  public static getChunkedDiagramFileContent(
    modelName: string,
    diagramContent: string
  ): string {
    
    let d2Block = "";

    if (diagramContent.includes("```d2")) {
      
      d2Block = this.getD2Block(diagramContent);
    } else if (diagramContent.includes("## DIAGRAM")) {
      
      const diagramMatch = diagramContent.match(
        /## DIAGRAM\s*\n([\s\S]*?)(?=\n## |$)/
      );
      if (diagramMatch) {
        const content = diagramMatch[1].trim();
        if (content.includes("```d2")) {
          d2Block = content.match(/```d2[\s\S]*?```/)?.[0] || "";
        } else {
          
          d2Block = "```d2\n" + content + "\n```";
        }
      }
    } else {
      
      d2Block = diagramContent.includes("```")
        ? diagramContent
        : "```d2\n" + diagramContent + "\n```";
    }

    if (!d2Block) {
      throw new Error(
        "No valid diagram content found in the response. Please try again."
      );
    }

    let d2Code = d2Block.replace(/```d2|```/g, "").trim();
    const linkGenerator = new D2LinkGenerator(d2Code);

    return `<p align="center">
    <a href="https:
        <img src="https:
    </a>
</p>
<p align="center">
    <b>Automatic Architecture Diagrams from Code</b><br />
    <a href="https:
</p>

## Usage Instructions

1. **Render the Diagram**: Use the links below to open it in D2 Playground (free) or TerraStruct (requires account), or install the [D2 VS Code extension](https:
2. **Large Repository Analysis**: This diagram was generated using intelligent chunking to analyze your entire codebase.
3. **Iterate for Best Results**: Language models are non-deterministic. Generate the diagram multiple times and choose the best result.

## Generated Content
**Model**: ${modelName} - [Change Model](vscode:
**Analysis Method**: Dependency-based chunking for complete coverage  
**D2 Playground**: [Edit](${linkGenerator.createViewLink()}) | **TerraStruct**: [Open](${linkGenerator.createTerraStructLink()})

${d2Block}`;
  }

  public static getD2Block(llmResponse: string): string {
    const matches = llmResponse.match(/```d2[\s\S]*```/);

    if (!matches) {
      throw new Error(
        "No D2 block found in the language model response. Please try again."
      );
    }

    const block = matches[0];

    if (block !== llmResponse) {
      
    }

    return block;
  }

  public static getLogFileContent(
    selectedFolder: vscode.Uri,
    model: vscode.LanguageModelChat,
    filePaths: string[]
  ): string {
    const json = JSON.stringify(
      {
        selectedFolder: selectedFolder.fsPath,
        model: {
          family: model.family,
          name: model.name,
          maxInputTokens: model.maxInputTokens,
        },
        numFilesUsed: filePaths.length,
      },
      null,
      4
    );

    return `# Swark Log File

## Info
\`\`\`json
${json}
\`\`\`

## Files Used
\`\`\`
total ${filePaths.length}  
${filePaths.join("\n")}
\`\`\``;
  }
}
