# 05. Docker Flow Deep Dive

This document provides a step-by-step technical walkthrough of the Docker environment's lifecycle, from the initial `up` command to the execution of a complex analytical query.

## 1. Startup Sequence (`docker-compose up`)

When you run `docker-compose up`, the following sequence occurs:

1.  **Network Creation**:
    *   Docker creates a bridge network `analytics-network`.
    *   Internal DNS is configured so containers can resolve each other by service name.

2.  **Volume Initialization**:
    *   Docker checks if the `postgres_data` volume exists.
    *   If not, it creates it.

3.  **Container Startup (Phase 1: Postgres)**:
    *   `analytics-postgres-docker` starts.
    *   **Entrypoint**: It checks the data directory. If empty, it runs scripts in `/docker-entrypoint-initdb.d/`.
    *   **Readiness**: It listens on port `5432`.

4.  **Container Startup (Phase 2: Dependents)**:
    *   `analytics-clickhouse-docker` starts (depends on Postgres). It initializes its config and waits for connections on `8123`.
    *   `analytics-duckdb-docker` starts. It enters a loop (e.g., `tail -f`) to stay alive, ready to receive `docker exec` commands.

## 2. Query Execution Flow

This section details what happens when a user selects a "Docker" engine in the UI and clicks "Execute".

### Scenario: DuckDB Docker Query

1.  **User Action**: User selects "DuckDB Docker" and "Revenue by Merchant".
2.  **API Request**: Frontend calls `GET /analytics/revenue-by-merchant?engine=duckdb-docker`.
3.  **Backend Routing**: NestJS routes this to `AnalyticsController` -> `AnalyticsService`.
4.  **Engine Selection**: The service identifies the engine type and delegates to `DuckdbDockerEngine`.
5.  **Command Construction**:
    *   The engine constructs a SQL query: `SELECT * FROM postgres_scan(...) ...`
    *   It wraps this SQL in a Docker command:
        ```bash
        docker exec -i analytics-duckdb-docker duckdb -json -c "SELECT ..."
        ```
6.  **Execution**:
    *   Node.js spawns a child process to run this command.
    *   The command is sent to the Docker daemon.
    *   Docker executes the `duckdb` binary *inside* the `analytics-duckdb-docker` container.
7.  **Data Fetch**:
    *   Inside the container, DuckDB executes `postgres_scan`.
    *   It resolves `analytics-postgres-docker` via DNS.
    *   It opens a TCP connection to port `5432` on the Postgres container.
    *   It streams the data back, performs aggregations in memory.
8.  **Result Return**:
    *   DuckDB outputs JSON to `stdout`.
    *   Docker streams this `stdout` back to the Node.js child process.
    *   NestJS parses the JSON and returns it to the Frontend.

### Sequence Diagram

```ascii
User        Frontend        Backend         Docker Daemon       DuckDB Container      Postgres Container
 |             |               |                  |                    |                      |
 |---Click---->|               |                  |                    |                      |
 |             |---GET Request>|                  |                    |                      |
 |             |               |--Spawn Exec----->|                    |                      |
 |             |               |                  |---Run Command----->|                      |
 |             |               |                  |                    |--Connect (5432)----->|
 |             |               |                  |                    |                      |
 |             |               |                  |                    |<----Stream Data------|
 |             |               |                  |                    |                      |
 |             |               |                  |<--Return JSON------|                      |
 |             |               |<--Stream Stdout--|                    |                      |
 |             |<--JSON Resp---|                  |                    |                      |
 |<--Display---|               |                  |                    |                      |
```

## 3. Critical Dependencies

*   **DNS Resolution**: If `analytics-duckdb-docker` cannot resolve `analytics-postgres-docker`, the query fails immediately.
*   **Volume Persistence**: If the `postgres_data` volume is lost, the Postgres container will restart empty, and queries will return 0 rows until re-seeded.
*   **Port Mapping**: The backend communicates with the *Docker Daemon* (via socket/pipe), not the containers directly (for `exec`). However, for `Postgres Docker` and `ClickHouse Docker` engines, the backend connects via TCP to `localhost:5433` and `localhost:8124` respectively.

    *   *Correction*: `DuckDB Docker` uses `docker exec`. `Postgres Docker` and `ClickHouse Docker` use standard TCP connections mapped to localhost ports.
