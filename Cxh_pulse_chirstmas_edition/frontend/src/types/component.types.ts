import type { LinkProps } from '@mui/material/Link';

/**
 * Common Component Types and Interfaces
 * 
 * This file contains type definitions for various UI components
 */

// ==================== Logo Component ====================

/**
 * Props for Logo component
 * 
 * Extends Material-UI LinkProps with:
 * - isSingle: Toggle between icon-only and full logo
 * - disabled: Disable link navigation
 */
export type LogoProps = LinkProps & {
  isSingle?: boolean;  // If true, shows icon only; if false, shows full logo with text
  disabled?: boolean;  // If true, disables click navigation
  collapsed?: boolean; // Collapsed state adjustment for layout spacing
};

// ==================== Color Picker Component ====================
// Note: ColorPicker types remain in the component file due to styled component dependencies

// ==================== Color Preview Component ====================
// Note: ColorPreview types remain in the component file due to styled component dependencies

// ==================== Iconify Component ====================
// Note: Iconify types remain in the component file due to register-icons dependencies

// Interface for Snackbar 
export interface ISnackBar {
  open: boolean;
  message: string;
  severity?: 'success' | 'error' | 'info' | 'warning';
}

// ==================== Choropleth Map Component ====================

/**
 * Props for ChoroplethMap component
 */
export type ChoroplethMapProps = {
  wardsGeoJSON?: GeoJSON.FeatureCollection;
  subcountiesGeoJSON?: GeoJSON.FeatureCollection;
  selectedWard?: string;
  selectedCounty?: string;
  onReset?: () => void;
  selectionMode?: 'subcounty' | 'ward';
  onSelectionModeChange?: (mode: 'subcounty' | 'ward') => void;
  dateRange?: { from: Date; to: Date };
  isLoadingGeoJSON?: boolean;
  zoom?: number;
  // Indicator data mode (when provided, uses indicator data instead of population)
  indicatorData?: any[]; // Array of indicator records with comYear, comMonth, rawWard, totalValue
  indicatorValueMap?: Record<string, number>; // Pre-computed value map (ward/subcounty -> value)
  indicatorColorScale?: { min: number; max: number; getColor: (value: number) => [number, number, number, number] } | null;
  dataMode?: 'population' | 'indicator'; // Which data mode to use
  title?: string; // Title to display (e.g., "Population" or indicator name)
  showSelectionModeToggle?: boolean; // Whether to show the selection mode toggle (subcounty/ward)
  onResetRef?: (resetFn: () => void) => void;
};

// ==================== Indicator Select Component ====================

/**
 * Option type for IndicatorSelect component
 */
export type IndicatorOption = {
  label: string;
  value: string;
  section?: string;
  isPopulation?: boolean; // Flag to identify population option
};

/**
 * Props for IndicatorSelect component
 */
export type IndicatorSelectProps = {
  /** Selected indicator value */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Label for the filter */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to disable portal (for fullscreen compatibility) */
  disablePortal?: boolean;
  /** Z-index for dropdown (for fullscreen compatibility) */
  zIndex?: number;
  /** Maximum width */
  maxWidth?: number;
  /** Default index to select (1-based, e.g., 1 = first indicator, 2 = second, etc.) */
  defaultIndex?: number;
  /** Text color for placeholder and input (defaults to black) */
  textColor?: string;
  /** Enable Population option at the end with divider */
  enablePopulationOption?: boolean;
};

// ==================== Reset Button Component ====================

/**
 * Props for ResetButton component
 */
export type ResetButtonProps = {
  onReset?: () => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  onResetRef?: (resetFn: () => void) => void; // Callback to expose reset function
};

// ==================== Selection Mode Toggle Component ====================

/**
 * Props for SelectionModeToggle component
 */
export type SelectionModeToggleProps = {
  mode: 'subcounty' | 'ward';
  onChange: (mode: 'subcounty' | 'ward') => void;
};

// ==================== Location Selector Component ====================

/**
 * Internal option type for LocationSelector
 */
export type LocationOption = {
  value: string;
  label: string;
  type: 'level1' | 'level2' | 'level3';
  group: string;
};

// ==================== County and Ward Select Component ====================

/**
 * Props for CountyAndWardSelect component
 */
export type CountyAndWardSelectProps = {
  /** Selected county/subcounty value */
  selectedCounty: string;
  /** Selected ward value */
  selectedWard: string;
  /** Callback when county changes */
  onCountyChange: (value: string) => void;
  /** Callback when ward changes */
  onWardChange: (value: string) => void;
  /** Label for county filter */
  countyLabel?: string;
  /** Label for ward filter */
  wardLabel?: string;
  /** Placeholder for county filter */
  countyPlaceholder?: string;
  /** Placeholder for ward filter */
  wardPlaceholder?: string;
  /** Whether to disable portal (for fullscreen compatibility) */
  disablePortal?: boolean;
  /** Z-index for dropdown (for fullscreen compatibility) */
  zIndex?: number;
  /** Maximum width for each filter */
  maxWidth?: number;
  /** Direction of layout */
  direction?: 'row' | 'column';
  /** Spacing between filters */
  spacing?: number;
};

// ==================== Choropleth Legend Component ====================

/**
 * Props for ChoroplethLegend component
 */
export type ChoroplethLegendProps = {
  wardValueMap: Record<string, number>;
  textColor?: 'white' | 'black';
  minValue?: number;
  maxValue?: number;
  showLabel?: boolean; // Show "Low → High" label
  backgroundColor?: string; // Background color for the legend paper
};

// ==================== Table Toolbar Component ====================

/**
 * Props for TableToolbar component
 */
export type TableToolbarProps = {
  filterName: string;
  onFilterName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  middleAction?: React.ReactNode;
  placeholder?: string;
};

// ==================== Table Empty Rows Component ====================

import type { TableRowProps } from '@mui/material/TableRow';

/**
 * Props for TableEmptyRows component
 */
export type TableEmptyRowsProps = TableRowProps & {
  emptyRows: number;
  height?: number;
};

// ==================== Table No Data Component ====================

/**
 * Props for TableNoData component
 */
export type TableNoDataProps = TableRowProps & {
  searchQuery: string;
  colSpan?: number;
};

// ==================== Table Empty State Component ====================

/**
 * Props for TableEmptyState component
 */
export type TableEmptyStateProps = TableRowProps & {
  message?: string;
  colSpan?: number;
};

// ==================== Precipitation Legend Component ====================

/**
 * Props for PrecipitationLegend component
 */
export type PrecipitationLegendProps = {
  temperatureData?: any[];
  textColor?: 'white' | 'black';
  bottomOffset?: number; // Offset from bottom when stacking with other legends
};

/**
 * Props for SimplePrecipitationLegend component
 */
export type SimplePrecipitationLegendProps = {
  minValue?: number;
  maxValue?: number;
  textColor?: 'white' | 'black';
};

// ==================== Temperature Legend Component ====================

/**
 * Props for TemperatureLegend component
 */
export type TemperatureLegendProps = {
  temperatureData?: any[];
  textColor?: 'white' | 'black';
};

/**
 * Props for SimpleTemperatureLegend component
 */
export type SimpleTemperatureLegendProps = {
  minValue?: number;
  maxValue?: number;
  textColor?: 'white' | 'black';
};