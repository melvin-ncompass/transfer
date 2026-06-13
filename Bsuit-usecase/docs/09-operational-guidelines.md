# 09. Operational Guidelines

This document provides guidelines for maintaining, extending, and operating the system.

## 1. When to Use Local vs. Docker

| Environment | Use When... |
| :--- | :--- |
| **Local** | You are writing code, debugging logic, or making rapid UI changes. You need fast feedback loops. |
| **Docker** | You are testing the full system integration, verifying `docker-compose` configurations, or running the final benchmark suite before a release. |

## 2. How to Add a New Engine

To add a new engine (e.g., `Trino`), follow these steps:

1.  **Define the Environment**:
    *   **Local**: Install Trino locally.
    *   **Docker**: Add a `trino` service to `docker-compose.yml`.
2.  **Update Configuration**:
    *   Add Trino connection details to `.env` and `configuration.ts`.
3.  **Create the Engine Service**:
    *   Create `src/engines/trino.engine.ts`.
    *   Implement the `getRevenueByMerchant`, `getDailyTransactions`, etc., methods.
4.  **Register the Engine**:
    *   Add it to `EnginesModule`.
    *   Update `AnalyticsService` to handle the new `trino-local` / `trino-docker` keys.
5.  **Update Frontend**:
    *   Add the new engine to the `ENGINES` constant in `App.tsx`.

## 3. Anti-Patterns (What NOT to Do)

*   **❌ Do NOT write to DuckDB/ClickHouse**: These are read-only views of your data. Writing to them will cause immediate inconsistency with Postgres.
*   **❌ Do NOT hardcode IP addresses**: Always use `localhost` for Local and service names (e.g., `analytics-postgres-docker`) for Docker.
*   **❌ Do NOT commit secrets**: Ensure `.env` is in `.gitignore`.
*   **❌ Do NOT skip the Docker build**: If you change code, `docker-compose up` won't see it unless you mount volumes or rebuild (`--build`).

## 4. Production Readiness Checklist

Before deploying this system to a real production environment (e.g., AWS/GCP):

- [ ] **Security**: Change default passwords (`postgres`/`Password`).
- [ ] **Persistence**: Use managed databases (RDS/CloudSQL) instead of containers for Postgres.
- [ ] **Networking**: Put databases in a private subnet; expose only the API.
- [ ] **Observability**: Add logging (Winston/Pino) and metrics (Prometheus) to the NestJS app.
- [ ] **CI/CD**: Automate the "Nuke and Pave" testing pipeline.
