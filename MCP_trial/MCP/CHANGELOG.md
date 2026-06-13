## 0.1.8 — Tiered context optimization + summary caching

- Add three-tier context routing (`overview`, `module`, `specific`) with supervisor-driven `queryComplexity` and `targetModule`.
- Introduce orchestrator context selection to provide compact repo/schema context for overview and module requests.
- Add repository overview graph/summaries and persistent per-file summary cache to reduce repeated LLM token usage.
- Expose `queryComplexity` and `targetModule` in API responses and add a tier test script for prompt token comparison.

## 0.1.7 — Context tiers + repo intelligence improvements

- Add `getRepoGraph()`, `getFileSummaries()`, and `getRepoOverview()` to generate compact repository context from the existing cache.
- Introduce LLM-generated per-file summaries with persistent `.melcp-cache/file-summaries.json` and hash-based re-use for unchanged files.
- Update supervisor routing to classify `overview`/`module`/`specific` complexity and pass `targetModule` for module-scoped context selection.
- Route agents to precomputed `computedContext` (`repoCtx`/`schemaCtx`) so context can be tiered and token usage reduced.

## 0.1.6 — Auth reliability + config-first AI keys + UI restore

- Fix frontend API base fallback to same-origin so API key cookie auth works consistently (`localhost` vs `127.0.0.1`) across all dashboard calls.
- Update repo indexing config parsing to support `repo.path` (and still accept legacy `rootDir`) to remove false "rootDir missing" warnings.
- Require at least one AI key in `melcp.config.json` (`ai.googleApiKey` or `ai.groqApiKey`) before `melcp start`, and inject these into runtime env automatically.
- Update both config example files with the new `ai` section and restore a polished default UI background without missing media dependencies.

## 0.1.5 — New-device setup guardrails

- Add startup preflight checks in CLI to validate `melcp.config.json` (`database.url` and `repo.path`) before boot.
- Validate AI key presence from env or `mcp-server/.env` and print actionable setup guidance when missing.
- Remove frontend API-key prompt flow and rely on server-managed API-key cookie for local UI authentication.

## 0.1.4 — Auth + routing compatibility fixes

- Fix Nest static exclude routes to use `'/api'` + `'/api/*path'` syntax compatible with current `path-to-regexp`.
- Prevent double-response crashes by throwing `HttpException` in API key guard and skipping writes when headers are already sent.
- Attach `x-api-key` from env/local storage prompt across all frontend API calls and align config file reads to `melcp.config.json`.

## 0.1.3 — Static route exclusion fix

- Fix Nest static exclude matcher from `'/api/(.*)'` to `'/api*'` to avoid `path-to-regexp` runtime errors and header-sent failures.

## 0.1.2 — Config/runtime fixes

- Read database connection from `melcp.config.json` (`database.url`) during backend boot, with env fallback.
- Fix static UI path resolution to support both local workspace runs and globally installed npm package layout.

## 0.1.0 — Initial release

- Single-package delivery: compiled NestJS backend + compiled React frontend served together.
- CLI workflow for local usage: `init` and `start` commands.
- Natural-language chat against PostgreSQL with guarded SQL execution.
- Introspection API and dashboard views for project/repo and database schema exploration.
- Agent trace and observability views for execution insight and debugging.
- API key protection for `/api` routes with localhost-first runtime defaults.
