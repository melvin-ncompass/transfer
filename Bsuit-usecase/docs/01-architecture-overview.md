# 01. Architecture Overview

## 1. High-Level System Goals

The primary goal of this system is to **benchmark and compare the performance** of three different database engines—**PostgreSQL**, **DuckDB**, and **ClickHouse**—across two distinct environments: **Local** (running directly on the host machine) and **Docker** (running within containerized environments).

Key objectives include:
*   **Performance Benchmarking**: Measure execution time for identical analytical queries across all 6 engine configurations.
*   **Data Consistency**: Ensure all engines query the exact same dataset, with **PostgreSQL** serving as the single source of truth.
*   **Isolation**: Demonstrate how these engines perform in a containerized setup versus a native local setup.
*   **Seamless User Experience**: Provide a unified frontend interface that abstracts the complexity of the underlying engines.

## 2. Why Local + Docker?

The system supports two environments to serve different stages of the development lifecycle and to provide comparative performance metrics:

*   **Local Environment**:
    *   **Purpose**: Development speed, debugging, and native performance testing.
    *   **Characteristics**: Engines run as processes on the host OS. Zero network overhead from containerization. Direct access to file systems.
    *   **Use Case**: Rapid iteration during feature development.

*   **Docker Environment**:
    *   **Purpose**: Production-like isolation, reproducibility, and ease of deployment.
    *   **Characteristics**: All components run in isolated containers. Networking is managed via Docker networks. Simulates a real-world microservices deployment.
    *   **Use Case**: Integration testing, verifying deployment artifacts, and benchmarking in a constrained environment.

## 3. The Single Source of Truth: PostgreSQL

A critical architectural decision is that **PostgreSQL is the only persistent data store**.

*   **Data Ownership**: Only PostgreSQL (both Local and Docker versions) holds the primary data (Customers, Merchants, Transactions).
*   **Write Operations**: All `INSERT`, `UPDATE`, `DELETE` operations go **exclusively** to PostgreSQL.
*   **Read-Only Analytics**: DuckDB and ClickHouse are treated as **ephemeral analytical engines**. They do not permanently store business data. Instead, they fetch data from PostgreSQL on-demand or attach to it for querying.

**Why?**
1.  **Simplicity**: Eliminates the need for complex multi-master replication or synchronization logic.
2.  **Consistency**: Guarantees that all benchmarks are run against the exact same state of data.
3.  **Real-world Simulation**: Mimics a common pattern where OLTP (PostgreSQL) handles transactions and OLAP (DuckDB/ClickHouse) handles heavy analytics.

## 4. Data Flow Philosophy

The system follows a **Hub-and-Spoke** data flow model where PostgreSQL is the hub.

1.  **OLTP Transactions**: The application writes transaction data to PostgreSQL.
2.  **OLAP Querying**:
    *   **PostgreSQL**: Queries its own tables directly.
    *   **DuckDB**: Uses the `postgres_scanner` extension to read directly from PostgreSQL tables during query execution.
    *   **ClickHouse**: Uses the `PostgreSQL` table engine or function to proxy queries to PostgreSQL.

This ensures that **DuckDB and ClickHouse never own data**; they only process it.

## 5. System Architecture Diagram

The following diagram illustrates the relationship between the Client (Frontend/API), the six Engine implementations, and the underlying Data Store (PostgreSQL).

```ascii
                                    +-----------------------+
                                    |   React Frontend      |
                                    |   (Engine Selector)   |
                                    +-----------+-----------+
                                                |
                                                v
                                    +-----------+-----------+
                                    |    NestJS Backend     |
                                    |   (API / Controller)  |
                                    +-----------+-----------+
                                                |
                        +-----------------------+-----------------------+
                        |                                               |
           (Local Environment)                                  (Docker Environment)
                        |                                               |
      +-----------------+-----------------+           +-----------------+-----------------+
      |                 |                 |           |                 |                 |
+-----+----+      +-----+----+      +-----+----+ +----+-----+     +-----+----+      +-----+----+
| Postgres |      |  DuckDB  |      |ClickHouse| | Postgres |     |  DuckDB  |      |ClickHouse|
| (Local)  |      | (Local)  |      | (Local)  | | (Docker) |     | (Docker) |      | (Docker) |
+-----+----+      +-----+----+      +-----+----+ +----+-----+     +-----+----+      +-----+----+
      |                 |                 |           |                 |                 |
      |                 v                 v           |                 v                 v
      |          +-------------+   +-------------+    |          +-------------+   +-------------+
      |          |  Postgres   |   |  Postgres   |    |          |  Postgres   |   |  Postgres   |
      +--------->|   Scanner   |   |   Engine    |    +--------->|   Scanner   |   |   Engine    |
      (Direct)   +------+------+   +------+------+    (Direct)   +------+------+   +------+------+
                        |                 |                             |                 |
                        |                 |                             |                 |
                        v                 v                             v                 v
                  +-----+-----------------+-----+                 +-----+-----------------+-----+
                  |      Local PostgreSQL       |                 |     Docker PostgreSQL       |
                  |   (Port 5432, Persistent)   |                 |   (Port 5433, Persistent)   |
                  +-----------------------------+                 +-----------------------------+
```

### Key Takeaways
*   **Vertical Separation**: The diagram clearly splits Local vs. Docker paths.
*   **Horizontal Flow**: Queries flow down from the API to the specific Engine implementation.
*   **Convergence**: All paths ultimately resolve to reading data from a PostgreSQL instance (either Local or Docker).
