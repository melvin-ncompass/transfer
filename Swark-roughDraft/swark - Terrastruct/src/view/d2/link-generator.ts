export class D2LinkGenerator {
    private static readonly TERRASTRUCT_URL = "https://app.terrastruct.com/";
    private static readonly D2_PLAYGROUND_URL = "https://play.d2lang.com/";
    private readonly d2Code: string;

    public constructor(d2Code: string) {
        this.d2Code = d2Code.trim();
    }

    public createEditLink(): string {
        try {
            // Create a link to D2 Playground with the code (since TerraStruct requires login)
            const encoded = encodeURIComponent(this.d2Code);
            return `${D2LinkGenerator.D2_PLAYGROUND_URL}?script=${encoded}`;
        } catch (error) {
            console.error("Error creating D2 link:", error);
            return D2LinkGenerator.D2_PLAYGROUND_URL;
        }
    }

    public createViewLink(): string {
        // Return the same as edit link
        return this.createEditLink();
    }

    public createTerraStructLink(): string {
        // Return TerraStruct link for users who have accounts
        return D2LinkGenerator.TERRASTRUCT_URL;
    }
}
