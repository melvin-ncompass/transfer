# 🛠 Tech Stack

This document details the technologies, frameworks, and tools used in the Analytics Benchmark project and the rationale behind their selection.

## 🖥 Frontend

| Technology | Version | Role | Why Selected? |
| :--- | :--- | :--- | :--- |
| **React** | `^18.2.0` | UI Library | Industry standard for building interactive UIs. Component-based architecture suits the dashboard layout. |
| **Vite** | `^5.0.8` | Build Tool | Extremely fast development server and build times compared to Webpack/CRA. |
| **TypeScript** | `^5.2.2` | Language | Provides type safety, reducing runtime errors and improving developer experience. |
| **Lucide React** | `^0.561.0` | Icons | Clean, consistent, and lightweight icon set. |

## ⚙️ Backend

| Technology | Version | Role | Why Selected? |
| :--- | :--- | :--- | :--- |
| **NestJS** | `^10.0.0` | Framework | Structured, opinionated framework for Node.js. Great for scalability and maintainability. |
| **Node.js** | `^20.3.1` | Runtime | Fast, non-blocking I/O, perfect for handling concurrent API requests. |
| **Docker SDK** | N/A | Integration | Allows the backend to execute commands inside containers (used for DuckDB). |

## 🗄 Database Engines

| Engine | Image | Role | Why Selected? |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | `postgres:15-alpine` | OLTP / Source | The baseline standard. Robust, reliable, but typically slower for heavy analytics. |
| **ClickHouse** | `clickhouse/clickhouse-server` | OLAP | Purpose-built for speed. Columnar storage makes it incredibly fast for aggregations. |
| **DuckDB** | `duckdb/duckdb` | In-Process OLAP | "SQLite for Analytics". Offers high performance without the overhead of a full server. |

## 🐳 Infrastructure

| Tool | Role | Why Selected? |
| :--- | :--- | :--- |
| **Docker** | Containerization | Ensures consistent environments across different machines. |
| **Docker Compose** | Orchestration | Simplifies defining and running multi-container applications. |
| **Python** | Data Generation | Python's ecosystem (Pandas, Faker) is superior for generating complex synthetic data quickly. |

## 📦 Compatibility Notes

*   **Node.js**: Requires Node v18+ for the frontend build tools.
*   **Docker**: Requires Docker Desktop or Engine with Compose V2 support.
