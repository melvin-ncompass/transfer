/**
 * Base URL for the backend API.
 */
const API_BASE_URL = 'https://bsuite-usecase-backend.nclabs.tech';

/**
 * Supported analytics engine types.
 */
export type EngineType = 
  | 'postgresql-docker' 
  | 'clickhouse-docker' 
  | 'duckdb-docker';

/**
 * Standard response format for analytics queries.
 */
export interface AnalyticsResponse {
  data: any[];
  executionTimeMs: number;
  rowCount: number;
  engine: string;
  query?: string;
  error?: string;
}

/**
 * Result for a single engine in a benchmark run.
 */
export interface BenchmarkResult {
  engine: string;
  executionTimeMs?: number | null;
  rowCount?: number | null;
  runs?: number[];
  average?: number | null;
  success: boolean;
  error: string | null;
}

/**
 * Response format for benchmark runs.
 */
export interface BenchmarkResponse {
  queryType: string;
  timestamp: string;
  results: BenchmarkResult[];
  fastest: string | null;
  comparison: string;
}

/**
 * Response format for available engines.
 */
export interface EnginesResponse {
  availableEngines: EngineType[];
  defaultEngine: EngineType;
}

/**
 * API client for analytics endpoints.
 */
export const analyticsApi = {
  /**
   * Fetch available analytics engines.
   */
  async getEngines(): Promise<EnginesResponse> {
    const response = await fetch(`${API_BASE_URL}/analytics/engines`);
    if (!response.ok) throw new Error('Failed to fetch engines');
    return response.json();
  },

  /**
   * Run a specific analytics query on a selected engine.
   */
  async runQuery(
    queryType: string,
    engine: EngineType,
    params: Record<string, any> = {}
  ): Promise<AnalyticsResponse> {
    const queryParams = new URLSearchParams({ engine, ...params });
    const response = await fetch(`${API_BASE_URL}/analytics/${queryType}?${queryParams}`);
    if (!response.ok) throw new Error(`Failed to run query: ${queryType}`);
    return response.json();
  },

  /**
   * Run a benchmark across all engines for a specific query type.
   */
  async runBenchmark(queryType: string): Promise<BenchmarkResponse> {
    const response = await fetch(`${API_BASE_URL}/analytics/benchmark?query=${queryType}`);
    if (!response.ok) throw new Error('Failed to run benchmark');
    return response.json();
  },

  async getRevenueByMerchant(engine: EngineType, limit = 100): Promise<AnalyticsResponse> {
    return this.runQuery('revenue-by-merchant', engine, { limit: String(limit) });
  },

  async getDailyTransactions(engine: EngineType, days = 30): Promise<AnalyticsResponse> {
    return this.runQuery('daily-transactions', engine, { days: String(days) });
  },

  async getCustomerSpending(engine: EngineType, limit = 100): Promise<AnalyticsResponse> {
    return this.runQuery('customer-spending', engine, { limit: String(limit) });
  },

  async getCategoryDistribution(engine: EngineType): Promise<AnalyticsResponse> {
    return this.runQuery('category-distribution', engine);
  },

  async getStatusSummary(engine: EngineType): Promise<AnalyticsResponse> {
    return this.runQuery('status-summary', engine);
  },

  async getSimple1M(engine: EngineType): Promise<AnalyticsResponse> {
    return this.runQuery('simple-1m', engine);
  },

  async getSimple5(engine: EngineType): Promise<AnalyticsResponse> {
    return this.runQuery('simple-5', engine);
  },

  async getSimple100K(engine: EngineType): Promise<AnalyticsResponse> {
    return this.runQuery('simple-100k', engine);
  },
};
