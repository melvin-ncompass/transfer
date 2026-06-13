import { MermaidSerializer } from "./serde";

export class MermaidLinkGenerator {
    private static readonly BASE_URL = "https:
    private readonly mermaidCode: string;

    public constructor(mermaidCode: string) {
        this.mermaidCode = mermaidCode.trim();
    }

    public createEditLink(): string {
        try {
            const serializedDiagram = MermaidSerializer.serialize(this.mermaidCode);
            return `${MermaidLinkGenerator.BASE_URL}edit#${serializedDiagram}`;
        } catch (error) {

            return this.createFallbackEditLink();
        }
    }

    public createViewLink(): string {
        try {
            const serializedDiagram = MermaidSerializer.serialize(this.mermaidCode);
            return `${MermaidLinkGenerator.BASE_URL}view#${serializedDiagram}`;
        } catch (error) {

            return this.createFallbackViewLink();
        }
    }

    private createFallbackEditLink(): string {
        try {
            const encoded = Buffer.from(this.mermaidCode).toString('base64');
            return `${MermaidLinkGenerator.BASE_URL}edit#base64:${encoded}`;
        } catch (error) {
            
            return `${MermaidLinkGenerator.BASE_URL}edit`;
        }
    }

    private createFallbackViewLink(): string {
        try {
            const encoded = Buffer.from(this.mermaidCode).toString('base64');
            return `${MermaidLinkGenerator.BASE_URL}view#base64:${encoded}`;
        } catch (error) {
            
            return `${MermaidLinkGenerator.BASE_URL}view`;
        }
    }
}
