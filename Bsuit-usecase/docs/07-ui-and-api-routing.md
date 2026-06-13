# 07. UI and API Routing

This document explains how the user's choice in the Frontend translates to a specific engine execution in the Backend.

## 1. Frontend: The Engine Selector

The React Frontend (`App.tsx`) maintains the state of the selected engine.

*   **State**: `selectedEngine` (Type: `EngineType`)
*   **Values**:
    *   `postgresql-local`
    *   `postgresql-docker`
    *   `duckdb-local`
    *   `duckdb-docker`
    *   `clickhouse-local`
    *   `clickhouse-docker`

When the user clicks "Execute Query", the frontend sends an HTTP GET request to the backend, passing the engine as a query parameter.

**Example Request**:
```http
GET /analytics/revenue-by-merchant?engine=duckdb-docker&limit=100
```

## 2. Backend: The Routing Layer

The NestJS backend receives this request and routes it through several layers to reach the correct implementation.

### Layer 1: Controller (`AnalyticsController`)
The controller defines the endpoints. It extracts the `engine` query parameter using the `@Query('engine')` decorator.

```typescript
@Get('revenue-by-merchant')
getRevenueByMerchant(@Query('engine') engine: EngineType) {
  return this.analyticsService.getRevenueByMerchant(engine);
}
```

### Layer 2: Service (`AnalyticsService`)
The service acts as a facade. It doesn't contain the engine logic itself. Instead, it uses a helper (or direct switch statement) to delegate to the correct engine service.

*   **Responsibility**: Validation and delegation.
*   **Logic**:
    ```typescript
    switch (engine) {
      case 'postgresql-local': return this.postgresLocal.getRevenue(...);
      case 'duckdb-docker': return this.duckdbDocker.getRevenue(...);
      // ... etc
    }
    ```

### Layer 3: Engine Implementations (`EnginesModule`)
Each engine has its own dedicated service class implementing a common interface (implicitly or explicitly).

*   `PostgresqlEngine` (Local)
*   `PostgresqlDockerEngine`
*   `DuckdbEngine` (Local)
*   `DuckdbDockerEngine`
*   `ClickhouseEngine` (Docker)
*   `ClickhouseLocalEngine`

## 3. Request Flow Diagram

```ascii
   [User Click]
        |
        v
[React Frontend]
        |
        | (GET /analytics/...?engine=duckdb-docker)
        v
[NestJS Controller]
        |
        v
 [AnalyticsService]
        |
        | (Switch on 'engine')
        v
 [DuckdbDockerEngine]
        |
        | (Construct Command)
        v
   [Docker Exec]
        |
        v
 [DuckDB Container]
        |
        v
 [Postgres Container]
```

## 4. API Contract Consistency

A key design principle is that **the API contract remains identical** regardless of the engine selected.

*   **Input**: The same query parameters (e.g., `startDate`, `endDate`, `limit`) apply to all engines.
*   **Output**: The response format is standardized.
    ```json
    {
      "data": [ ... rows ... ],
      "executionTimeMs": 123,
      "rowCount": 1000,
      "engine": "duckdb-docker"
    }
    ```

This allows the Frontend to switch engines seamlessly without changing how it renders charts or tables.
