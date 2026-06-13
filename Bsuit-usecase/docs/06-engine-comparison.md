# 06. Engine Comparison

This document provides a comparative analysis of the six engine configurations available in the system.

## 1. Engine Matrix

| Engine Name | Environment | Stores Data? | Connection Type | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL Local** | Local | **YES** | Native TCP (`5432`) | **OLTP**, Data Master, Development |
| **DuckDB Local** | Local | No | In-Process (Node.js) | **OLAP**, Fast Analytics on Local Data |
| **ClickHouse Local** | Local | No | HTTP (`8123`) | **OLAP**, High-Scale Analytics Dev |
| **PostgreSQL Docker** | Docker | **YES** | TCP Mapped (`5433`) | **OLTP**, Production Simulation |
| **DuckDB Docker** | Docker | No | `docker exec` CLI | **OLAP**, Isolated Analytics |
| **ClickHouse Docker** | Docker | No | TCP Mapped (`8124`) | **OLAP**, Integration Testing |

## 2. Detailed Breakdown

### PostgreSQL (Local & Docker)
*   **Role**: The "Source of Truth".
*   **Strengths**: Transactional integrity (ACID), reliable storage, wide ecosystem support.
*   **Weaknesses**: Slower at heavy analytical queries (aggregations over millions of rows) compared to columnar stores.
*   **When to use**: For all `INSERT/UPDATE/DELETE` operations and simple lookups.

### DuckDB (Local & Docker)
*   **Role**: The "embedded analytical accelerator".
*   **Strengths**:
    *   **Vectorized Execution**: Extremely fast aggregations.
    *   **Zero-Copy (Local)**: Can read Postgres data files directly (in some configs) or stream efficiently.
    *   **Simplicity**: No server management required (runs as a library or CLI).
*   **Weaknesses**:
    *   **Concurrency**: Single-writer design (though we use it read-only here).
    *   **Docker Overhead**: The `docker exec` method introduces process spawning overhead for every query.
*   **When to use**: For complex analytical queries (GROUP BY, SUM, AVG) where Postgres is too slow.

### ClickHouse (Local & Docker)
*   **Role**: The "dedicated analytical server".
*   **Strengths**:
    *   **Scalability**: Designed for petabyte-scale data.
    *   **Compression**: Excellent data compression (though less relevant when proxying Postgres).
    *   **Functions**: Rich set of analytical functions.
*   **Weaknesses**:
    *   **Complexity**: Requires running a separate heavy server process.
    *   **Network Overhead**: Always fetches data over the network (or localhost loopback) from Postgres.
*   **When to use**: When you need to simulate a production environment where a dedicated OLAP cluster offloads queries from the OLTP database.

## 3. Performance Expectations

| Query Type | Fastest Engine (Expected) | Why? |
| :--- | :--- | :--- |
| **Simple Lookup** (`SELECT * WHERE id=1`) | **Postgres** | Index usage, no overhead. |
| **Aggregation** (`SUM(amount) GROUP BY cat`) | **DuckDB Local** | Vectorized engine, minimal overhead. |
| **Complex Join** | **DuckDB / ClickHouse** | Columnar processing optimizes joins. |
| **Docker Aggregation** | **DuckDB Docker** | Fast engine, but penalized by `docker exec` startup time (~300ms). |

*Note: In this specific architecture, DuckDB and ClickHouse performance is capped by the speed of reading data from Postgres. They act as "compute engines" over "Postgres storage".*
