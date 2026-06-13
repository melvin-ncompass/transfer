# 02. Local Environment

This document details the **Local Environment** setup, where database engines run directly on the host operating system (Windows/WSL/macOS/Linux) without Docker containerization.

## 1. Overview

In the local environment, the NestJS application connects to services running on `localhost`. This setup is optimized for development speed and debugging.

### Component Map
| Component | Host | Port | Role |
| :--- | :--- | :--- | :--- |
| **PostgreSQL (Local)** | `localhost` | `5432` | **Primary Data Store**. Holds all persistent data. |
| **DuckDB (Local)** | In-Process | N/A | **Embedded Analytics Engine**. Runs inside the Node.js process. |
| **ClickHouse (Local)** | `localhost` | `8123` | **Standalone Analytics Engine**. Connects to Postgres via network. |

## 2. PostgreSQL (Local)

This is the foundation of the local environment. It must be installed and running on your machine.

*   **Connection**: `host=localhost`, `port=5432`, `user=postgres`, `password=Password`, `database=datastuff`
*   **Responsibility**:
    *   Stores the `customers`, `merchants`, and `transactions` tables.
    *   Handles all `INSERT`, `UPDATE`, `DELETE` operations from the API.
    *   Serves as the source for DuckDB and ClickHouse queries.

### Data Flow
```ascii
[Client] --> [NestJS API] --> [pg driver] --> [Local PostgreSQL :5432] --> [Result]
```

## 3. DuckDB (Local)

DuckDB runs **in-process** within the Node.js application using the `duckdb` npm package. It does not require a separate server process.

*   **Connection**: Embedded (In-Memory or File-based).
*   **Postgres Integration**: Uses the `postgres_scanner` extension to read directly from the local Postgres instance.
*   **Query Pattern**:
    1.  The NestJS service initializes an in-memory DuckDB instance.
    2.  It loads the `postgres_scanner` extension.
    3.  It executes a query that references Postgres tables using `postgres_scan()`.

### Example Query
```sql
SELECT * FROM postgres_scan('host=localhost port=5432 dbname=datastuff user=postgres password=Password', 'public', 'transactions');
```

### Data Flow
```ascii
[Client] --> [NestJS API]
                 |
                 v
           [DuckDB (Embedded)]
                 |
                 v (postgres_scanner)
                 |
           [Local PostgreSQL :5432] --> [Result]
```

## 4. ClickHouse (Local)

ClickHouse runs as a standalone server process on your machine (e.g., via a binary or a separate service).

*   **Connection**: `host=localhost`, `port=8123` (HTTP Interface).
*   **Postgres Integration**: Uses the `PostgreSQL` table engine or the `postgresql()` table function to query data.
*   **Query Pattern**:
    1.  The NestJS service connects to ClickHouse via HTTP.
    2.  It sends a query that wraps the Postgres connection details.
    3.  ClickHouse connects to Postgres, fetches the data, processes it, and returns the result.

### Example Query
```sql
SELECT * FROM postgresql('localhost:5432', 'datastuff', 'transactions', 'postgres', 'Password');
```

### Data Flow
```ascii
[Client] --> [NestJS API]
                 |
                 v (HTTP)
           [Local ClickHouse :8123]
                 |
                 v (TCP)
           [Local PostgreSQL :5432] --> [Result]
```

## 5. When to Use Local Engines?

| Scenario | Recommendation |
| :--- | :--- |
| **Feature Development** | Use **Local**. It's faster to restart and debug. |
| **Schema Changes** | Use **Local Postgres**. Apply migrations directly. |
| **Performance Tuning** | Use **Local** to profile queries without Docker network overhead. |
| **Integration Testing** | Use **Docker** (see `03-docker-environment.md`) to ensure isolation. |
