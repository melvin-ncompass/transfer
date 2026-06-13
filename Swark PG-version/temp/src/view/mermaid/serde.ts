import { deflate, inflate } from "pako";
import { toUint8Array, fromUint8Array } from "js-base64";

interface MermaidEditorState {
    code: string;
    mermaid: string;
    updateDiagram: boolean;
    autoSync: boolean;
    rough: boolean;
}

class PakoSerializer {
    public static serialize(state: string): string {
        const data = new TextEncoder().encode(state);
        const compressed = deflate(data, { level: 9 });
        return fromUint8Array(compressed, true);
    }

    public static deserialize(state: string): string {
        const data = toUint8Array(state);
        return inflate(data, { to: "string" });
    }
}

export class MermaidSerializer {
    public static serialize(mermaidCode: string): string {
        try {
            
            const cleanCode = mermaidCode.trim();
            
            const state: MermaidEditorState = {
                code: cleanCode,
                mermaid: '{"theme": "default"}',
                updateDiagram: true,
                autoSync: true,
                rough: false,
            };
            
            const json = JSON.stringify(state);

            JSON.parse(json); 
            
            const serialized = PakoSerializer.serialize(json);
            return `pako:${serialized}`;
        } catch (error) {
            
            throw new Error(`Failed to serialize Mermaid diagram: ${error}`);
        }
    }

    public static deserialize(serialized: string): MermaidEditorState {
        try {
            
            const cleanSerialized = serialized.startsWith('pako:') 
                ? serialized.substring(5) 
                : serialized;
                
            const json = PakoSerializer.deserialize(cleanSerialized);
            return JSON.parse(json) as MermaidEditorState;
        } catch (error) {
            
            throw new Error(`Failed to deserialize Mermaid diagram: ${error}`);
        }
    }
}
