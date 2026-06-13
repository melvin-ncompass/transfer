# MCP Server (Multi-Agent Control Platform)

A production-grade NestJS backend leveraging LangChain, Gemini API, and PostgreSQL. It implements a Clean Architecture Multi-Agent state graph capable of safely converting natural language queries into executable SQL, returning synthesized results with full "Thinking Visibility" traces.

## Features

- **Multi-Agent Orchestration**: `SupervisorAgent` dynamically routes tasks to parallel or sequential specialized agents.
- **AI Integration Layer**: Abstracted `AIProviderService` wrapping LangChain's Gemini Pro with Zod Structured Outputs.
- **Intelligent Database Layer**: `SchemaService` minifies and injects live DB context into prompts. `QueryValidator` blocks destructive SQL (e.g., DROP, DELETE). `ExecutionAgent` runs safe TypeORM queries.
- **Thinking Visibility**: LangChain Callbacks are intercepted by `ReasoningLogger` to stream tokens used and intermediate routing thoughts back to the client.
- **Prompt Management System**: Variables and templates are fully decoupled in `src/prompts/`.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Duplicate `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Update the `GOOGLE_API_KEY` and PostgreSQL `DB_*` credentials.
   *(Note: Ensure the DB user is strictly Read-Only for safety)*

3. **Spin up Mock Database (Optional)**
   If you need test tables, run the `sample-database.sql` script against your public Postgres schema.

4. **Run the Server**
   ```bash
   npm run start:dev
   ```
   The server will start on `http://localhost:3000`.

## Example Multi-Agent cURL Request

This API tests the full orchestration: Intent -> SQL Generation -> DB Execution -> Formatter.

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show me the top 3 customers by total purchase amount."
  }'
```

### Example Thinking Visibility Response
```json
{
  "query": "Show me the top 3 customers by total purchase amount.",
  "finalOutput": {
    "summary": "Acme Corp is the top customer with $1,950 in total purchases...",
    "tabularData": [
      { "name": "Acme Corp", "total_purchases": "1950.50" },
      { "name": "Globex", "total_purchases": "8900.00" }
    ]
  },
  "responses": [
    {
      "agentName": "SUPERVISOR_AGENT",
      "reasoning": "Routed to SQL and Formatter sequentially based on analytics intent."
    },
    {
      "agentName": "SQL_AGENT",
      "reasoning": "Interpretation: User wants ranked list. Tables Selected: [customers, orders].",
      "tokensUsed": { "prompt": 450, "completion": 75, "total": 525 }
    }
  ],
  "errors": []
}
```

## Architecture & Scalability
- The framework is heavily decoupled. New agents simply implement `BaseAgent` and inject themselves into the `AgentRegistry`.
- Agents themselves use **Stateless Multi-Agent Memory**. They do not hold buffers; the `OrchestratorService` passes a rolling `State` payload through the nodes.
- Replace `GeminiProviderService` with an `OpenAIProviderService` in `ai.module.ts` without modifying downstream orchestrators.
