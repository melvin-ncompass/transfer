export class D2LinkGenerator {
    private static readonly TERRASTRUCT_URL = "https:
    private static readonly D2_PLAYGROUND_URL = "https:
    private readonly d2Code: string;

    public constructor(d2Code: string) {
        this.d2Code = d2Code.trim();
    }

    public createEditLink(): string {
        try {
            
            const encoded = encodeURIComponent(this.d2Code);
            return `${D2LinkGenerator.D2_PLAYGROUND_URL}?script=${encoded}`;
        } catch (error) {
            
            return D2LinkGenerator.D2_PLAYGROUND_URL;
        }
    }

    public createViewLink(): string {
        
        return this.createEditLink();
    }

    public createTerraStructLink(): string {
        
        return D2LinkGenerator.TERRASTRUCT_URL;
    }
}
