# 08. Failure Debugging

This document outlines common failure scenarios and their resolution steps.

## 1. Postgres Connection Failures

### Symptom
*   Backend logs: `Connection refused at localhost:5433` (Docker) or `localhost:5432` (Local).
*   Frontend: "Failed to fetch engines" or "Query failed".

### Root Cause
*   **Local**: The local Postgres service is stopped.
*   **Docker**: The `analytics-postgres-docker` container is not running or is unhealthy.

### Resolution
*   **Local**: Start the service (e.g., `sudo service postgresql start` or via Windows Services).
*   **Docker**:
    1.  Check status: `docker-compose ps`
    2.  View logs: `docker-compose logs analytics-postgres-docker`
    3.  Restart: `docker-compose restart analytics-postgres-docker`

## 2. DuckDB Docker "Extension Not Found"

### Symptom
*   Query fails with: `Error: IO Error: Extension "postgres_scanner" not found`.

### Root Cause
*   The DuckDB container cannot download the extension from the internet.
*   The extension installation path is not persistent or writable.

### Resolution
*   Ensure the host machine has internet access (DuckDB downloads extensions on demand).
*   Check if the container can reach the internet: `docker exec -it analytics-duckdb-docker ping google.com`.

## 3. ClickHouse Connection Refused

### Symptom
*   Backend logs: `Error: connect ECONNREFUSED 127.0.0.1:8124`.

### Root Cause
*   The ClickHouse container is crashing or hasn't finished starting up.
*   Port mapping conflict on port 8124.

### Resolution
*   Check logs: `docker-compose logs analytics-clickhouse-docker`.
*   Wait: ClickHouse can take 10-20 seconds to initialize.
*   Verify ports: `netstat -an | grep 8124`.

## 4. Schema Mismatch (Column Not Found)

### Symptom
*   DuckDB/ClickHouse queries fail with `Column 'x' not found in table 'y'`.

### Root Cause
*   You added a column to **Local Postgres** but did not update **Docker Postgres**.
*   The Docker volume `postgres_data` is stale and contains the old schema.

### Resolution
*   **Nuke and Pave**:
    ```bash
    docker-compose down -v
    docker-compose up --build
    ```
    This deletes the old volume and re-initializes Postgres from the latest `init.sql`.

## 5. Docker Network Issues

### Symptom
*   DuckDB Docker fails with: `IO Error: Could not connect to server: Connection refused` (inside the container).

### Root Cause
*   DuckDB is trying to connect to `localhost` inside the container (which is empty) instead of the Postgres container name.
*   The Docker network `analytics-network` is broken.

### Resolution
*   Verify the connection string uses the hostname `analytics-postgres-docker`, NOT `localhost`.
*   Inspect network: `docker network inspect analytics-network`.
