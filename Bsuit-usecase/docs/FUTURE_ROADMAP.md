# 🗺 Future Roadmap

This document outlines the vision for the project's evolution, from short-term fixes to long-term goals.

## 🟢 Short-Term (Next Sprint)

*   [ ] **Fix DuckDB Performance**: Replace `docker exec` with the native Node.js DuckDB client to eliminate CLI overhead.
*   [ ] **Loading States**: Improve UI feedback when benchmarks are running (e.g., progress bars, spinners).
*   [ ] **Error Handling**: Add better error messages in the UI if a database container is down.

## 🟡 Medium-Term (Next Quarter)

*   [ ] **More Engines**: Add **Apache Doris** or **StarRocks** to the benchmark suite.
*   [ ] **Custom Datasets**: Allow users to upload their own CSV files to benchmark against custom data.
*   [ ] **Detailed Metrics**: Capture CPU and Memory usage per query using `docker stats` API and display it alongside execution time.
*   [ ] **Query Builder**: Add a visual query builder in the frontend so users don't need to write raw SQL (or rely on hardcoded queries).

## 🔴 Long-Term (Vision)

*   [ ] **Cloud Deployment**: Create Terraform scripts to deploy this stack on AWS/GCP (e.g., ECS or Kubernetes).
*   [ ] **Live Streaming**: Benchmark streaming ingestion performance (e.g., Kafka -> ClickHouse).
*   [ ] **AI Analysis**: Integrate an LLM to analyze the benchmark results and suggest the best engine for the specific data profile.

## 🧹 Technical Debt Cleanup

*   **Refactor Engine Interface**: Standardize the `Engine` interface in the backend to make adding new engines easier (Plugin Architecture).
*   **Type Sharing**: Share TypeScript interfaces (DTOs) between Backend and Frontend to ensure type safety across the network boundary (e.g., using Nx or Turborepo).

## ⚠️ Risks

*   **Docker Dependency**: The project is heavily reliant on Docker. Changes to Docker's licensing or breaking changes in Compose could impact us.
    *   *Mitigation*: Pin Docker versions and explore Podman compatibility.
