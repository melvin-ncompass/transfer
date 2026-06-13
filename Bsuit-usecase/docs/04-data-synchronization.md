# 04. Data Synchronization

This document explains how we maintain data and schema consistency between the **Local** and **Docker** Postgres instances.

## 1. The Challenge

Since we have two separate Postgres instances (Local `:5432` and Docker `:5433`), there is a risk of **Schema Drift** or **Data Divergence**.

*   **Schema Drift**: The table structure (columns, types, constraints) differs between environments.
*   **Data Divergence**: The actual rows of data are different, leading to inconsistent benchmark results.

## 2. Schema Consistency Strategy

We treat **Local Postgres** as the development master and **Docker Postgres** as a production-like replica that is initialized from a known state.

### Migration Strategy
1.  **Development**: Developers apply schema changes (e.g., `CREATE TABLE`, `ALTER TABLE`) to their Local Postgres instance manually or via a migration tool.
2.  **Capture**: Once the schema is stable, a `init.sql` script is updated or generated.
3.  **Docker Initialization**: The Docker Postgres container uses this `init.sql` (mounted to `/docker-entrypoint-initdb.d/`) to build its schema **only on the first run**.

**Critical Rule**: Any change made to the Local schema MUST be reflected in the Docker initialization scripts if you want the environments to match.

## 3. Data Consistency Strategy

For benchmarking, it is crucial that both environments contain the **exact same volume and distribution of data**.

### Seeding
We use a unified seeding approach:
*   **Local**: Run a seeding script (e.g., `npm run seed`) that connects to `localhost:5432` and inserts X million rows.
*   **Docker**:
    *   **Option A (Auto-Seed)**: The `init.sql` includes `INSERT` statements or calls a stored procedure to generate data on startup.
    *   **Option B (External Seed)**: Run the same `npm run seed` script but point it to `localhost:5433` (the Docker port).

### Verification
To ensure consistency, run a simple count check before benchmarking:
```sql
-- Run on Local
SELECT COUNT(*) FROM transactions;

-- Run on Docker
SELECT COUNT(*) FROM transactions;
```
If these counts differ, the benchmark comparison is invalid.

## 4. Handling Failures & Resyncing

If the Docker environment falls out of sync (e.g., you added a column locally but forgot to rebuild Docker):

### Symptoms
*   DuckDB/ClickHouse Docker queries fail with "Column not found".
*   NestJS backend throws errors when connecting to Docker engines.

### Resolution: The "Nuke and Pave" Approach
Since Docker data is persistent in a volume, simply restarting the container won't apply new `init.sql` scripts. You must wipe the volume.

1.  **Stop Containers**:
    ```bash
    docker-compose down
    ```
2.  **Remove Volumes**:
    ```bash
    docker-compose down -v
    ```
    *The `-v` flag is critical. It deletes the `postgres_data` volume.*
3.  **Rebuild and Start**:
    ```bash
    docker-compose up --build
    ```
    *This forces Postgres to re-initialize from the updated `init.sql`.*

## 5. Best Practices

1.  **Immutable Schema for Benchmarks**: Do not change the schema in the middle of a benchmark run.
2.  **Version Control**: Commit your `init.sql` or migration scripts.
3.  **Automated Seeding**: Prefer deterministic seeding (using a fixed random seed) so that data distribution remains identical across rebuilds.
