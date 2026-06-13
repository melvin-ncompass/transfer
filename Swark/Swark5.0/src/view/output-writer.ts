import * as vscode from "vscode";

export class OutputWriter {
    private readonly outputFolder: vscode.Uri;

    public constructor(outputFolder: vscode.Uri) {
        this.outputFolder = outputFolder;
    }

    public async writeDiagramFile(markdownContent: string, diagramType?: string): Promise<vscode.Uri> {
        const filename = this.getFileName("diagram", diagramType);
        return await this.writeFile(filename, markdownContent);
    }

    public async writeLogFile(markdownContent: string, diagramType?: string): Promise<vscode.Uri> {
        const filename = this.getFileName("log", diagramType);
        return await this.writeFile(filename, markdownContent);
    }

    private getFileName(type: string, diagramType?: string): string {
        const prefix = diagramType ? `${diagramType}-` : "";
        return `${prefix}${type}.md`;
    }

    private async writeFile(filename: string, content: string): Promise<vscode.Uri> {
        const uri = vscode.Uri.joinPath(this.outputFolder, filename);
        const encoded = new TextEncoder().encode(content);
        await vscode.workspace.fs.writeFile(uri, encoded);
        return uri;
    }
}
