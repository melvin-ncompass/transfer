# 📂 Project Structure

This document explains the organization of the repository to help you navigate the codebase effectively.

## 🌳 Root Directory

```text
.
├── analytics-benchmark/    # Backend (NestJS) application
├── analytics-frontend/     # Frontend (React) application
├── data-generator/         # Python scripts for seeding data
├── docs/                   # Project documentation
├── extra-stuff/            # Miscellaneous scripts and experiments
└── docker-compose.yml      # Main orchestration file
```

---

## 🏗 Backend: `analytics-benchmark/`

This is a **NestJS** application.

```text
analytics-benchmark/
├── src/
│   ├── app.module.ts       # Root module, imports all feature modules
│   ├── main.ts             # Application entry point
│   ├── config/             # Configuration service (env vars)
│   ├── engines/            # Logic for interacting with DB engines
│   │   ├── postgres-docker.engine.ts
│   │   ├── duckdb-docker.engine.ts
│   │   └── ...
│   ├── transactions/       # API endpoints for benchmarking
│   └── ...
├── Dockerfile              # Instructions to build the backend container
└── package.json            # Dependencies and scripts
```

**Key Files:**
*   `src/engines/*.engine.ts`: These files contain the specific logic to connect to and query each database engine. **Modify these if you want to change how queries are executed.**
*   `src/transactions/transactions.service.ts`: Orchestrates the benchmark by calling the engines.

---

## 🖥 Frontend: `analytics-frontend/`

This is a **React + Vite** application.

```text
analytics-frontend/
├── src/
│   ├── api/                # API client functions
│   ├── components/         # Reusable UI components (Charts, Buttons)
│   ├── styles/             # Global styles
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Entry point
├── Dockerfile              # Instructions to build the frontend container
└── vite.config.ts          # Vite configuration
```

**Key Files:**
*   `src/App.tsx`: The main dashboard layout.
*   `src/api/`: Contains functions to fetch data from the backend.

---

## 🎲 Data Generator: `data-generator/`

Scripts to create synthetic data.

```text
data-generator/
├── seed_docker_10m.py      # Main script to generate 10M rows
├── requirements.txt        # Python dependencies
└── Dockerfile              # Container definition
```

**Key Files:**
*   `seed_docker_10m.py`: **Edit this file** if you want to change the schema or the volume of data generated.

---

## 📝 Naming Conventions

*   **Files**: Kebab-case (e.g., `user-profile.component.ts`).
*   **Classes**: PascalCase (e.g., `UserProfileComponent`).
*   **Variables**: camelCase (e.g., `userProfile`).
*   **Directories**: Kebab-case (e.g., `data-generator`).

## ⚠️ Do Not Modify Casually

*   `docker-compose.yml`: Changing service names or ports here will break the connections defined in the application code.
*   `analytics-benchmark/src/engines/`: These are tightly coupled to the Docker container configurations.
