# 🔄 Project Workflow

This document outlines the end-to-end workflow of the Analytics Benchmark project, detailing how data flows from generation to visualization.

## 🏗 High-Level Architecture

The system is designed as a **benchmarking platform** to compare the performance of different OLAP engines (PostgreSQL, ClickHouse, DuckDB) when querying a large dataset.

### Core Components

1.  **Data Generator**: A Python script that seeds the database with synthetic data.
2.  **Database Layer**: Three engines running in Docker containers:
    *   **PostgreSQL**: The primary transactional store and source of truth.
    *   **ClickHouse**: An OLAP engine connected to Postgres.
    *   **DuckDB**: An in-process OLAP engine accessing Postgres data.
3.  **Backend API**: A NestJS application that orchestrates benchmarks and executes queries.
4.  **Frontend UI**: A React application that triggers benchmarks and visualizes results.

---

## 🚀 Step-by-Step Workflow

### 1. Initialization & Data Seeding
*   **Trigger**: `docker-compose up`
*   **Action**: The `data-generator` container starts.
*   **Process**: It runs `seed_docker_10m.py`, generating **10 million rows** of transaction data and inserting them into the `analytics-postgres-docker` database.
*   **Outcome**: The Postgres database is populated. ClickHouse and DuckDB (via scanners) gain access to this data.

### 2. User Interaction
*   **Trigger**: User opens `http://localhost:3001` and clicks "Run Benchmark".
*   **Action**: The Frontend sends a REST API request to the Backend (e.g., `POST /api/benchmark`).

### 3. Benchmark Execution
*   **Process**: The Backend receives the request and orchestrates the benchmark across selected engines.
    *   **Postgres**: Executes standard SQL via `node-postgres`.
    *   **ClickHouse**: Executes SQL via HTTP interface, querying the Postgres table engine.
    *   **DuckDB**: Executes SQL via `docker exec` CLI, using the `postgres_scanner` extension.
*   **Measurement**: The Backend records the execution time for each query.

### 4. Result Aggregation & Response
*   **Process**: The Backend collects execution times and row counts.
*   **Action**: It sends a JSON response back to the Frontend.

### 5. Visualization
*   **Process**: The Frontend receives the data.
*   **Outcome**: It renders charts and tables comparing the performance (speed, rows processed) of each engine.

---

## 📊 Data Flow Diagram

```ascii
[User Browser]
      |
      | (1) Click "Run Benchmark"
      v
[Frontend (React)]
      |
      | (2) API Request (POST /benchmark)
      v
[Backend (NestJS)]
      |
      +-------------------------+-------------------------+
      | (3a) Query              | (3b) Query              | (3c) Exec CLI
      v                         v                         v
[Postgres Container]    [ClickHouse Container]    [DuckDB Container]
      ^                         |                         |
      |                         | (Reads Data)            | (Reads Data)
      +-------------------------+                         |
      |                                                   |
      +---------------------------------------------------+
```

---

## ⚠️ Error Handling & Failure Paths

*   **Database Down**: If a container is unhealthy, the Backend will fail to connect. The API returns a `500 Internal Server Error`.
*   **Timeout**: Long-running queries may time out. The Frontend handles this by showing an error message after a specific duration.
*   **Data Missing**: If the seeding step fails, queries will return 0 rows. Ensure `data-generator` completes successfully.

## 🧪 Example Run

1.  **Start**: `docker-compose up -d`
2.  **Wait**: Wait for `analytics-data-generator` to exit (approx. 5-10 mins for 10M rows).
3.  **Verify**: Check logs `docker-compose logs -f analytics-backend` to ensure it connected to all engines.
4.  **Test**: Go to `localhost:3001`, select "Group By" query, and click Run.
5.  **Result**: See bar chart showing ClickHouse/DuckDB significantly outperforming Postgres.
