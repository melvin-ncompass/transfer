# MCP Project Full Context (Handoff Doc)

This document explains the current project end-to-end so another LLM (for example Claude) can design an implementation plan with full context.

---

## 1) What this project is

This repo is a two-part application:

- `mcp-server`: NestJS backend that orchestrates multiple AI agents.
- `react-client`: React + Vite frontend that provides a chat + observability UI.

Primary behavior today:

- User asks a natural-language query in UI.
- Backend `SUPERVISOR_AGENT` decides route (SQL flow, task flow, repo flow, etc.).
- Other agents execute.
- Backend returns traces, errors, and final data.
- Frontend animates agent activity and streams final answer text in chat.

---

## 2) Repository structure

Top-level key folders:

- `mcp-server/` - Backend API and orchestration logic.
- `react-client/` - Frontend dashboard/chat UI.

Backend notable paths:

- `mcp-server/src/main.ts` - Nest bootstrap, CORS, validation, global exception filter.
- `mcp-server/src/app.module.ts` - Module wiring and agent registration.
- `mcp-server/src/app.controller.ts` - `GET /` and `POST /query`.
- `mcp-server/src/orchestrator/orchestrator.service.ts` - Core state machine execution.
- `mcp-server/src/agents/` - Supervisor, SQL, Execution, Task, Repo, Diagram, CSV, Formatter.
- `mcp-server/src/database/` - TypeORM setup, schema extraction, SQL validator.
- `mcp-server/src/repo/repo.service.ts` - Local source indexing and file cache.
- `mcp-server/src/sessions/` - Session CRUD + chat history load.
- `mcp-server/src/memory/` - Persistent state + audit logs.
- `mcp-server/src/observability/` - Health/metrics API.

Frontend notable paths:

- `react-client/src/App.tsx` - Main layout and dashboard tabs.
- `react-client/src/components/chat/ChatPanel.tsx` - Chat + input + message rendering.
- `react-client/src/services/websocket.ts` - Main request executor (HTTP fetch-based).
- `react-client/src/store/agentStore.ts` - Zustand state management.

---

## 3) Tech stack

Backend:

- NestJS 11
- TypeORM + PostgreSQL
- LangChain
- Gemini and Groq models via provider abstraction
- Zod for structured LLM output

Frontend:

- React 19 + TypeScript
- Vite
- Zustand
- Tailwind / UI components
- Framer Motion

---

## 4) How backend works (request lifecycle)

Entry endpoint:

- `POST /query` in `mcp-server/src/app.controller.ts`

Flow:

1. API receives `{ query, sessionId?, userRole?, config? }`.
2. `OrchestratorService.execute(...)` builds initial `State`.
3. If `sessionId` exists, prior `chatHistory` is loaded from `conversation_memory`.
4. `SUPERVISOR_AGENT` chooses:
   - mode: `SEQUENTIAL` or `PARALLEL`
   - `nextAgents`: e.g. `["SQL_AGENT","EXECUTION_AGENT"]`
5. Orchestrator executes selected agents.
6. If DB results exist and CSV route is not selected, formatter runs.
7. Fallback logic ensures `finalResponse` is still produced.
8. Memory and audit are persisted.
9. API returns:
   - `query`
   - `traces` (agent responses)
   - `errors`
   - `data` (`finalResponse`)

State object definition: `mcp-server/src/interfaces/core.interface.ts`.

---

## 5) Agent routing logic (important)

Supervisor prompt file:

- `mcp-server/src/prompts/supervisor.prompt.ts`

Current hard routing constraints include:

- DB/data question -> `["SQL_AGENT","EXECUTION_AGENT"]` sequential.
- Pure conversational task -> `["TASK_AGENT"]`.
- Codebase query -> include `REPO_AGENT`.
- Diagram request -> include `DIAGRAM_AGENT`.
- CSV request -> include `CSV_AGENT`.
- `CSV_AGENT` and `DIAGRAM_AGENT` cannot run together.
- `REPO_AGENT` and `SQL_AGENT` are set as mutually exclusive in prompt rules.

This matters for future planning if you want hybrid repo+db introspection in one turn.

---

## 6) Current backend HTTP routes

Defined controllers found in backend:

- `GET /` -> health check
- `POST /query` -> main orchestration
- `GET /sessions` -> list sessions
- `POST /sessions` -> create/upsert session
- `GET /sessions/:id/messages` -> get chat history
- `DELETE /sessions/:id` -> delete session and memory
- `GET /observability/metrics` -> in-memory metrics health

There is no dedicated route yet for:

- repo details endpoint
- DB schema endpoint
- introspection/Swagger-like project metadata endpoint

---

## 7) Database setup and behavior

Environment sample:

- `mcp-server/.env.example`

Variables:

- `PORT`
- `GOOGLE_API_KEY`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`

TypeORM config source:

- `mcp-server/src/database/database.module.ts`

Notable DB behavior:

- Uses Postgres.
- `autoLoadEntities: true`.
- `synchronize` enabled when not production.
- Logs query and error.

Read-only protection:

- `QueryValidator` (`mcp-server/src/database/query.validator.ts`) blocks destructive SQL patterns (`DROP/DELETE/UPDATE/INSERT/...`).
- SQL must start with `SELECT` or `WITH`.
- `.env.example` also advises using a DB read-only user.

Schema extraction for LLM context:

- `SchemaService` (`mcp-server/src/database/schema.service.ts`)
- Reads `information_schema.columns` (public schema)
- Caches compact schema text like `Table [x]: "col" (type), ...`

Persistence tables/entities:

- `conversation_memory` (`memory.entity.ts`)
- `audit_trail` (`audit.entity.ts`)
- `chat_sessions` (`chat-session.entity.ts`)

---

## 8) How repo indexing currently works

Service:

- `mcp-server/src/repo/repo.service.ts`

Lifecycle:

- Runs `reindex()` on module init.
- Loads config from `mcp-server/mcp.config.json`.
- Walks configured root dir.
- Caches file content and export/import summaries.

Config file today:

- `mcp-server/mcp.config.json`

Current config values:

- `rootDir`: `"src"`
- `ignore`: `["*.spec.ts", "*.test.ts", "dist"]`
- `maxFileSizeKb`: `50`

Important detail:

- Ignore matching is simple string/path matching, not true glob processing. Patterns like `"*.spec.ts"` may not behave as expected.

Repo context usage:

- Used by `REPO_AGENT` prompt context.
- No direct public API route currently exposes repo index/file cache.

---

## 9) Frontend behavior and API integration

Main UI:

- `react-client/src/App.tsx`

It shows:

- Chat panel
- Agent graph
- Reasoning tree
- Live activity
- SQL view
- Diagram view
- CSV/Data view
- Execution history
- Logs + token chart

Transport layer:

- `react-client/src/services/websocket.ts`

Important note:

- File name says websocket, but it currently uses `fetch(...)` HTTP calls (not socket transport) to backend.

Store:

- `react-client/src/store/agentStore.ts`

Responsibilities:

- Maintains chat state, sessions, provider state, traces/logs.
- Calls backend session APIs.
- Simulates streaming response text in UI by chunking words.

---

## 10) Ports, URLs, and run commands

Backend defaults:

- `.env.example` and README indicate backend at `http://localhost:3000`.

Frontend API calls currently target:

- `http://localhost:3001` (hardcoded in `websocket.ts` and `agentStore.ts`).

This is a known mismatch and should be normalized in plan.

Run backend:

- In `mcp-server`: `npm install`, then `npm run start:dev`

Run frontend:

- In `react-client`: `npm install`, then `npm run dev`

Useful local URLs (depending on final port choices):

- Backend root health: `http://localhost:<backend-port>/`
- Query API: `http://localhost:<backend-port>/query`
- Sessions API: `http://localhost:<backend-port>/sessions`
- Metrics API: `http://localhost:<backend-port>/observability/metrics`
- Frontend dev UI (Vite default): `http://localhost:5173`

---

## 11) Observability and logging

Metrics service:

- `mcp-server/src/observability/metrics.service.ts`

Captures in-memory per-agent stats:

- runs/success/failure
- aggregate execution time
- aggregate token usage

Health endpoint:

- `GET /observability/metrics`
- returns `HEALTHY` or `DEGRADED` based on failure rate threshold.

Audit trail:

- Every orchestration writes trace metadata to `audit_trail` via `MemoryService.logAuditTrace(...)`.

---

## 12) AI provider behavior

Provider abstraction:

- `mcp-server/src/ai/ai.provider.interface.ts`

Current module wiring:

- `AiModule` binds `'AIProvider'` to `GeminiProviderService`.

Inside Gemini provider service:

- Supports explicit provider selection (`gemini` or `groq`).
- Default behavior uses fallback chain Gemini -> Groq.
- Uses structured output with Zod schemas.
- Uses retries for transient LLM failures.

---



## 15) Quick map for Claude planning prompts

Use these source files first when making a plan:

- Orchestration and route flow:
  - `mcp-server/src/app.controller.ts`
  - `mcp-server/src/orchestrator/orchestrator.service.ts`
  - `mcp-server/src/agents/supervisor/supervisor.agent.ts`
  - `mcp-server/src/prompts/supervisor.prompt.ts`

- Repo and schema internals:
  - `mcp-server/src/repo/repo.service.ts`
  - `mcp-server/mcp.config.json`
  - `mcp-server/src/database/schema.service.ts`
  - `mcp-server/src/database/database.module.ts`

- Data persistence:
  - `mcp-server/src/memory/memory.service.ts`
  - `mcp-server/src/sessions/sessions.service.ts`
  - `mcp-server/src/memory/entities/*.ts`
  - `mcp-server/src/sessions/entities/*.ts`

- Frontend integration points:
  - `react-client/src/services/websocket.ts`
  - `react-client/src/store/agentStore.ts`
  - `react-client/src/App.tsx`
  - `react-client/src/components/chat/ChatPanel.tsx`

---

## 16) Final summary

You already have most foundational pieces for your target design:

- Multi-agent orchestration
- DB schema extraction
- Repo indexing
- Session and audit persistence
- Observability endpoint
- Rich operator UI

What is missing is mostly productization:

- public introspection routes
- Swagger docs
- security around metadata exposure
- port/config cleanup

This makes your “Swagger-like internal endpoint for repo + DB + operable UI” goal very realistic without a full rewrite.

