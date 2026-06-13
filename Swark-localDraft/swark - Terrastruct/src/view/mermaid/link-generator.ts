import { MermaidSerializer } from "./serde";

export class MermaidLinkGenerator {
    private static readonly BASE_URL = "https://mermaid.live/";
    private readonly mermaidCode: string;

    public constructor(mermaidCode: string) {
        this.mermaidCode = mermaidCode.trim();
    }

    public createEditLink(): string {
        try {
            const serializedDiagram = MermaidSerializer.serialize(this.mermaidCode);
            return `${MermaidLinkGenerator.BASE_URL}edit#${serializedDiagram}`;
        } catch (error) {
            console.error("Error creating Mermaid edit link:", error);
            // Fallback: create a simple base64 encoded link
            return this.createFallbackEditLink();
        }
    }

    public createViewLink(): string {
        try {
            const serializedDiagram = MermaidSerializer.serialize(this.mermaidCode);
            return `${MermaidLinkGenerator.BASE_URL}view#${serializedDiagram}`;
        } catch (error) {
            console.error("Error creating Mermaid view link:", error);
            // Fallback: create a simple base64 encoded link
            return this.createFallbackViewLink();
        }
    }

    private createFallbackEditLink(): string {
        try {
            const encoded = Buffer.from(this.mermaidCode).toString('base64');
            return `${MermaidLinkGenerator.BASE_URL}edit#base64:${encoded}`;
        } catch (error) {
            console.error("Fallback link creation failed:", error);
            return `${MermaidLinkGenerator.BASE_URL}edit`;
        }
    }

    private createFallbackViewLink(): string {
        try {
            const encoded = Buffer.from(this.mermaidCode).toString('base64');
            return `${MermaidLinkGenerator.BASE_URL}view#base64:${encoded}`;
        } catch (error) {
            console.error("Fallback link creation failed:", error);
            return `${MermaidLinkGenerator.BASE_URL}view`;
        }
    }
}
