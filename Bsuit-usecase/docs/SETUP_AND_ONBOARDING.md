# 🚀 Setup and Onboarding

This guide will help you get the Analytics Benchmark project running on your local machine in minutes.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

*   **Docker Desktop** (or Docker Engine + Compose V2)
    *   *Verify*: `docker compose version`
*   **Node.js** (v18 or higher) - *Optional, only if you want to run services outside Docker*
    *   *Verify*: `node -v`
*   **Git**
    *   *Verify*: `git --version`

## 🛠️ Installation & Running

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Bsuit-usecase
```

### 2. Start the Environment
We use Docker Compose to spin up the entire stack (Frontend, Backend, Databases, Data Generator).

```bash
docker-compose up -d
```

*   `-d` runs the containers in the background (detached mode).
*   **Note**: The first run will take a few minutes to download images and build the backend/frontend containers.

### 3. Monitor Data Seeding
The `analytics-data-generator` container will automatically start generating 10 million rows of test data. This process takes **5-10 minutes**.

You can monitor its progress:
```bash
docker-compose logs -f data-generator
```
Wait until you see a message like `Seeding complete!` or the container exits with code 0.

### 4. Access the Application
Once the services are running:

*   **Frontend (Dashboard)**: [http://localhost:3001](http://localhost:3001)
*   **Backend (API)**: [http://localhost:3000](http://localhost:3000)
*   **ClickHouse (HTTP)**: [http://localhost:8124](http://localhost:8124)
*   **Postgres (Port)**: `localhost:5433`

## 🧪 Testing Changes

### Running Tests
To run the backend tests locally (requires Node.js):

```bash
cd analytics-benchmark
npm install
npm run test
```

### Rebuilding Containers
If you modify code in `analytics-benchmark` or `analytics-frontend`, you need to rebuild the containers to see changes:

```bash
docker-compose up -d --build
```

## 🐛 Common Issues & Fixes

### "Port already in use"
*   **Error**: `Bind for 0.0.0.0:5433 failed: port is already allocated`
*   **Fix**: Stop any other Postgres instances running on your machine, or change the host port in `docker-compose.yml`.

### "DuckDB connection failed"
*   **Error**: Backend logs show errors connecting to DuckDB.
*   **Fix**: Ensure the `analytics-duckdb-docker` container is running.
    ```bash
    docker ps | grep duckdb
    ```

### "Query returns 0 rows"
*   **Cause**: Data seeding hasn't finished or failed.
*   **Fix**: Check generator logs (`docker-compose logs data-generator`) and restart if needed (`docker-compose up data-generator`).
