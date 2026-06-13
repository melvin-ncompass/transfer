# ❓ Why This Project?

This document explains the motivation, technical decisions, and trade-offs behind the Analytics Benchmark project.

## 🎯 Problem Statement

In modern data architectures, choosing the right database engine for analytics is critical. Developers often struggle to decide between:
1.  **Traditional RDBMS** (like PostgreSQL) which are great for transactions but slow for heavy analytics.
2.  **Dedicated OLAP Engines** (like ClickHouse) which are fast but require complex infrastructure.
3.  **In-Process OLAP** (like DuckDB) which offer a middle ground but have unique deployment constraints.

**This project exists to provide a tangible, reproducible benchmark** comparing these three approaches on a standardized dataset (10 million rows) within a Dockerized environment.

## 💡 Technical Motivation

### Why this Stack?
*   **NestJS (Backend)**: Chosen for its modular architecture and strong TypeScript support, making it easy to manage distinct "Engine" services.
*   **React (Frontend)**: Provides a responsive, interactive UI to visualize performance differences in real-time.
*   **Docker Compose**: Essential for orchestration. It allows us to spin up a complex multi-database environment with a single command, ensuring consistency across different developer machines.

### Why this Architecture?
We chose a **federated query architecture** where the data lives in PostgreSQL, and other engines query it directly (or via scanners).
*   **Reason**: This mimics a common real-world scenario where data is ingested into an OLTP DB (Postgres) and then analyzed by OLAP engines without complex ETL pipelines.
*   **Benefit**: It highlights the "Zero-ETL" capabilities of ClickHouse and DuckDB.

## ⚖️ Trade-offs & Constraints

### Trade-offs
*   **Performance vs. Complexity**: Running everything in Docker on a single machine limits the raw performance of the engines compared to bare-metal clusters. However, it maximizes **reproducibility** and **ease of use**.
*   **DuckDB via Docker Exec**: We run DuckDB via `docker exec` instead of embedding it in the Node.js process.
    *   *Pro*: Simulates a separate "service" and avoids blocking the Node.js event loop.
    *   *Con*: Adds overhead from Docker CLI execution.

### Assumptions
*   The host machine has sufficient RAM (at least 8GB recommended) to run 3 database containers simultaneously.
*   The user is interested in **relative performance** (Engine A vs. Engine B) rather than absolute benchmarking numbers.

## ✅ What This Project Solves Well
*   **Direct Comparison**: Side-by-side speed comparison of identical queries.
*   **Setup Ease**: "One-click" environment setup.
*   **Visualization**: Clear, graphical representation of results.

## ❌ What It Does NOT Solve
*   **Production Deployment**: This is a dev/benchmark setup. It lacks security hardening, backups, and high-availability configurations needed for production.
*   **Massive Scale**: It is optimized for ~10M rows. Scaling to billions would require a distributed cluster, not a single Docker Compose setup.
