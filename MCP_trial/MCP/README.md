# melcp

## What it is
`melcp` is a sidecar developer tool for engineers who want a fast way to query and inspect their PostgreSQL-backed project without wiring custom internal dashboards. Run it locally against any codebase to chat with your database in natural language, inspect schema and repo context, and trace agent execution in one UI.

## Getting started
1. Install and initialize config in your project directory:
   ```bash
   npx melcp init
   ```
2. Fill in `melcp.config.json` (database URL, repo path, and API key is auto-generated).
3. Start the tool:
   ```bash
   npx melcp start
   ```
   Then open the local dashboard in your browser (for example `http://localhost:3001`).

## Configuration
Create `melcp.config.json` in your working directory:

```jsonc
{
  "port": 3001, // Optional: local server port (default: 3001)
  "host": "127.0.0.1", // Optional: bind host (default: 127.0.0.1)
  "apiKey": "00000000-0000-0000-0000-000000000000", // Required: API auth key
  "database": {
    "url": "postgresql://readonly_user:readonly_password@localhost:5432/your_database" // Required
  },
  "repo": {
    "path": "C:/path/to/your/project/root", // Required: absolute path to target repo
    "ignore": ["node_modules", "dist", ".git"], // Optional: extra ignore patterns
    "maxFileSizeKb": 50 // Optional: max indexed file size in KB
  }
}
```

Required fields: `apiKey`, `database.url`, `repo.path`  
Optional fields: `port`, `host`, `repo.ignore`, `repo.maxFileSizeKb`

## What you get
- **Chat**: Ask questions in plain English and get SQL-backed answers from your PostgreSQL database.
- **Project Explorer**: Inspect repo summary, indexed files, top directories, and structured schema metadata.
- **Traces**: See per-agent reasoning flow, token usage, statuses, and execution sequence.
- **Observability**: Monitor execution history, logs, and performance/health metrics in real time.

## Security
- API routes are protected by a required API key (`x-api-key` header or `apiKey` query param).
- The server binds to `127.0.0.1` by default to keep access local-only unless you explicitly change host.
- SQL safety is enforced through `QueryValidator`, which blocks destructive statements and keeps DB interaction read-oriented.

## Requirements
- Node.js 18+
- PostgreSQL
