# 03. Docker Environment

This document details the **Docker Environment** setup, where database engines run in isolated containers orchestrated by Docker Compose.

## 1. Docker Compose Architecture

The system uses a `docker-compose.yml` file to define and run the multi-container application.

### Services Overview
| Service Name | Image | Internal Port | Host Port | Role |
| :--- | :--- | :--- | :--- | :--- |
| `analytics-postgres-docker` | `postgres:16` | `5432` | `5433` | **Primary Data Store**. Persistent volume. |
| `analytics-clickhouse-docker` | `clickhouse/clickhouse-server` | `8123` | `8124` | **Analytics Engine**. Connects to Postgres. |
| `analytics-duckdb-docker` | `ubuntu` (custom) | N/A | N/A | **Analytics Engine**. Runs DuckDB CLI via `docker exec`. |

### Networking
All services are connected to a custom bridge network named `analytics-network`. This allows them to communicate using their service names as hostnames.

*   **Internal Communication**: `analytics-clickhouse-docker` can reach `analytics-postgres-docker` at `analytics-postgres-docker:5432`.
*   **External Access**: The host machine accesses these services via the mapped Host Ports (e.g., `localhost:5433`).

## 2. Postgres Docker (`analytics-postgres-docker`)

This container mimics the production database.

*   **Persistence**: Uses a Docker volume (`postgres_data`) to persist data across restarts.
*   **Initialization**: On first startup, it runs scripts in `/docker-entrypoint-initdb.d/` to create the schema and seed initial data.
*   **Configuration**:
    *   `POSTGRES_USER`: `postgres`
    *   `POSTGRES_PASSWORD`: `Password`
    *   `POSTGRES_DB`: `datastuff`

## 3. ClickHouse Docker (`analytics-clickhouse-docker`)

This container runs the ClickHouse server.

*   **Connection**: Exposed on port `8124` to avoid conflict with local ClickHouse (`8123`).
*   **Data Access**: It does **not** store business data. It uses the `PostgreSQL` table engine to query `analytics-postgres-docker`.
*   **Configuration**: Requires `config.xml` and `users.xml` for custom settings (if any).

## 4. DuckDB Docker (`analytics-duckdb-docker`)

This is a unique setup. Since DuckDB is an embedded database, there is no "DuckDB Server" image. Instead, we use a container that keeps running (e.g., `tail -f /dev/null`) and has the DuckDB CLI installed.

*   **Execution Model**: The NestJS backend executes queries by spawning a `docker exec` command.
    ```bash
    docker exec -i analytics-duckdb-docker duckdb -json -c "SELECT ..."
    ```
*   **Data Access**: Inside the container, DuckDB loads the `postgres_scanner` extension and connects to `analytics-postgres-docker:5432`.

## 5. Data Flow Diagram

```ascii
                                    [NestJS Backend]
                                          |
                                          | (Docker API / TCP)
                                          v
      +-----------------------------------------------------------------------+
      |                          Docker Host (Network)                        |
      |                                                                       |
      |   +-------------------+       +-------------------+                   |
      |   | DuckDB Container  |       |ClickHouse Container|                  |
      |   | (Executes CLI)    |       | (Port 8123)       |                   |
      |   +---------+---------+       +---------+---------+                   |
      |             |                           |                             |
      |             | (Internal Network)        | (Internal Network)          |
      |             v                           v                             |
      |   +---------------------------------------------------+               |
      |   |           Postgres Docker Container               |               |
      |   |           (Port 5432, Volume Mounted)             |               |
      |   +---------------------------------------------------+               |
      +-----------------------------------------------------------------------+
```

## 6. Container Startup Order

To ensure stability, services should start in this order:
1.  `analytics-postgres-docker`: Must be healthy and ready to accept connections.
2.  `analytics-clickhouse-docker`: Depends on Postgres availability for queries.
3.  `analytics-duckdb-docker`: Can start independently but queries will fail if Postgres is down.

We use `depends_on` and `healthcheck` in `docker-compose.yml` to enforce this.
