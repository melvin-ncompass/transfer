export interface AppConfig {
  port: number; // default 3001
  host?: string; // default 127.0.0.1
  apiKey: string; // auto-generated UUID, added later
  ai: {
    googleApiKey?: string;
    groqApiKey?: string;
  };
  database: {
    url: string; // full connection string
  };
  repo: {
    path: string; // absolute path to the target project root
    ignore: string[]; // glob patterns, default ["node_modules", "dist", ".git"]
    maxFileSizeKb: number; // default 50
  };
}
