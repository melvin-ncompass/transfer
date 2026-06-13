/**
 * Section Component Types
 * 
 * Type definitions for section components
 */

// ==================== Overview Filters Component ====================

/**
 * Props for OverviewFilters component
 */
export type OverviewFiltersProps = {
  selectedIndicator: string;
  setSelectedIndicator: (value: string) => void;
  county: string;
  setCounty: (value: string) => void;
  ward: string;
  setWard: (value: string) => void;
  dateRange: { from: Date; to: Date };
  setDateRange: (range: { from: Date; to: Date }) => void;
  availableSubcounties: string[];
  availableWards: string[];
  hierarchyData: any;
  isLoadingWards: boolean;
  isPopulationMode: boolean;
  selectionMode: 'subcounty' | 'ward';
  setSelectionMode: (mode: 'subcounty' | 'ward') => void;
  wardsData: any;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  currentFrameDate: Date | null;
  frameDates: Date[];
  setFrameIdx: (idx: number) => void;
  isLooping: boolean;
  setIsLooping: (value: boolean | ((prev: boolean) => boolean)) => void;
  showAll: boolean;
  setShowAll: (value: boolean | ((prev: boolean) => boolean)) => void;
  framesLength: number;
  isLoadingIndicator: boolean;
  isFetchingIndicator: boolean;
  onCountyChange: (value: string) => void;
  onWardChange: (value: string) => void;
  onPlayToggle: () => void;
  onLoopToggle: () => void;
  onShowAllToggle: () => void;
};

// ==================== Toggle Switches Component ====================

/**
 * Props for ToggleSwitches component
 */
export type ToggleSwitchesProps = {
  showTemperature: boolean;
  showPrecipitation: boolean;
  onTemperatureChange: (checked: boolean) => void;
  onPrecipitationChange: (checked: boolean) => void;
};

// ==================== Climate and Health Filter Component ====================

/**
 * Props for ClimateAndHealthFilter component
 */
export type ClimateAndHealthFilterProps = {
  /** Selected county/subcounty */
  selectedCounty: string;
  /** Selected ward */
  selectedWard: string;
  /** Callback when county changes */
  onCountyChange: (value: string) => void;
  /** Callback when ward changes */
  onWardChange: (value: string) => void;
  /** Date range picker props */
  dateRangeProps: {
    minYear?: number;
    maxYear?: number;
    minMonth?: number;
    maxMonth?: number;
    initialFrom: Date;
    initialTo: Date;
    onChange?: (range: { from: Date; to: Date }) => void;
  };
  /** Whether in fullscreen mode (for z-index) */
  isFullscreen?: boolean;
};

// ==================== Monthly Temperature Heatmap Component ====================

/**
 * Props for MonthlyTemperatureHeatmap component
 */
export type MonthlyTemperatureHeatmapProps = {
  data: Array<{ monthdate: string; temperature: number }>;
};

// ==================== Monthly Rainfall Heatmap Component ====================

/**
 * Props for MonthlyRainfallHeatmap component
 */
export type MonthlyRainfallHeatmapProps = {
  data: Array<{ monthdate: string; precipitation: number }>;
};

// ==================== Monthly Temperature Line Chart Component ====================

/**
 * Props for MonthlyTemperatureLineChart component
 */
export type MonthlyTemperatureLineChartProps = {
  data: Array<{ monthdate: string; temperature: number }>;
  onTitleClick?: () => void;
  isTitleClickable?: boolean;
};

// ==================== Monthly Rainfall Line Chart Component ====================

/**
 * Props for MonthlyRainfallLineChart component
 */
export type MonthlyRainfallLineChartProps = {
  data: Array<{ monthdate: string; precipitation: number }>;
  onTitleClick?: () => void;
  isTitleClickable?: boolean;
};

// ==================== Monthly Temperature Precipitation Chart Component ====================

/**
 * Props for MonthlyTemperaturePrecipitationChart component
 */
export type MonthlyTemperaturePrecipitationChartProps = {
  temperatureData: Array<{ monthdate: string; temperature: number }>;
  precipitationData: Array<{ monthdate: string; precipitation: number }>;
  onTitleClick?: () => void;
  isTitleClickable?: boolean;
  hideTitle?: boolean;
};

// ======================== Content State for Climate ========================================
/**
 * Content State type climate tab 
 */
export const ViewState = {
  LOADING: 'loading',
  EMPTY: 'empty',
  DATA: 'data',
} as const;

export type ViewState = typeof ViewState[keyof typeof ViewState];


// ==================== Indicator Trends Table Component ====================

/**
 * Props for IndicatorTrendsTable component
 */
export type IndicatorTrendsTableProps = {
  dateRange: { from: Date; to: Date };
  ward?: string;
  county?: string;
  selectedIndicator?: string; // Filter by selected indicator, if empty/null show all
  selectedIndicatorDisplayName?: string;
  hideTitle?: boolean;
  hasPromptsPermission?: boolean;
};

// ==================== Prompts Trend Table V1 Component ====================

/**
 * Props for PromptsTrendTableV1 component
 */
export type PromptsTrendTableV1Props = {
  dateRange: { from: Date; to: Date };
  intent?: string;
  ward?: string;
  county?: string;
  onTitleClick?: () => void;
  isTitleClickable?: boolean;
  hideTitle?: boolean;
  hasPromptsPermission?: boolean;
};

// ==================== Trend Sparkline Component ====================

/**
 * Props for TrendSparkline component
 */
export type TrendSparklineProps = {
  data: number[];
  dates?: number[];
};
