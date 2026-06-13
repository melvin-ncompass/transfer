/**
 * Central Type Exports
 * 
 * This file exports all type definitions from the types folder
 * for convenient importing throughout the application
 * 
 * Usage:
 * ```ts
 * import type { StandardButtonProps, DataTableColumn, UseBooleanReturn } from 'src/types';
 * ```
 */

// Button types
export type { StandardButtonProps } from './button.types';

// Table types
export type {
  BasicTableColumn,
  BasicTableProps,
  DataTableColumn,
  DataTableProps,
} from './table.types';

// Dialog types
export type { ConfirmDialogProps } from './dialog.types';

// Hook types
export type { UseBooleanReturn } from './hooks.types';

// Utility types
export type {
  DatePickerFormat,
  FormatPatterns,
  InputNumberValue,
  NumberFormatOptions,
  LocaleConfig,
} from './utils.types';

// Component types
export type {
  LogoProps,
  ChoroplethMapProps,
  IndicatorOption,
  IndicatorSelectProps,
  ResetButtonProps,
  SelectionModeToggleProps,
  LocationOption,
  CountyAndWardSelectProps,
  ChoroplethLegendProps,
  TableToolbarProps,
  TableEmptyRowsProps,
  TableNoDataProps,
  TableEmptyStateProps,
  PrecipitationLegendProps,
} from './component.types';

// Note: The following types remain in their component files due to dependencies:
// - IconifyProps (register-icons dependency)
// - ColorPickerProps, ColorPickerSlotProps (styled component dependencies)
// - ColorPreviewProps, ColorPreviewSlotProps (styled component dependencies)

// Permission types (already exists)
export type { Permission, Role } from './permissions';

// Branding types
export type { Branding } from './branding.types';

// Section types
export type {
  OverviewFiltersProps,
  ToggleSwitchesProps,
  ClimateAndHealthFilterProps,
  MonthlyTemperatureHeatmapProps,
  MonthlyRainfallHeatmapProps,
  MonthlyTemperatureLineChartProps,
  MonthlyRainfallLineChartProps,
  MonthlyTemperaturePrecipitationChartProps,
  IndicatorTrendsTableProps,
  PromptsTrendTableV1Props,
  TrendSparklineProps,
} from './sections.types';
