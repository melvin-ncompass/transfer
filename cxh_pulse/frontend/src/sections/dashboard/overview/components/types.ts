/**
 * Type definitions for overview components
 */

export type IndicatorTrendRow = {
  id: string;
  indicatorId: string;
  indicator: string;
  category?: string; // Category of the indicator
  trend: number[]; // Array of values for sparkline
  trendDates?: number[]; // Array of timestamps corresponding to trend values
  overallChange: number; // Percentage change
  indicatorCount: number;
};

export type PromptsTrendRow = {
  id: string;
  intent: string;
  category: string;
  priorityLevel: string;
  trend: number[]; // Array of values for sparkline
  trendDates?: number[]; // Array of timestamps corresponding to trend values
  overallChange: number; // Percentage change
  totalCount: number;
};
