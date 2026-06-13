/**
 * Indicator names for forecast predictions
 */

export const IndicatorName = {
  SEVERE_MUAC_PERCENTAGE: import.meta.env.VITE_SEVERE_MUAC_PERCENTAGE ?? '',
  STILLBIRTH_RATE: import.meta.env.VITE_STILLBIRTH_RATE ?? '',
  LOW_BIRTH_WEIGHT_PCT: import.meta.env.VITE_LOW_BIRTH_WEIGHT_PCT ?? '',
  NEONATAL_MORTALITY_RATE: import.meta.env.VITE_NEONATAL_MORTALITY_RATE ?? '',
  MALARIA_CASE_RATE: import.meta.env.VITE_MALARIA_CASE_RATE ?? '',
} as const;

export type IndicatorName = (typeof IndicatorName)[keyof typeof IndicatorName];

/**
 * Display names for indicators
 */
export const INDICATOR_DISPLAY_NAMES: Record<IndicatorName, string> = {
  [IndicatorName.SEVERE_MUAC_PERCENTAGE]: 'Severe Acute Malnutrition Rate',
  [IndicatorName.STILLBIRTH_RATE]: 'Stillbirth Rate',
  [IndicatorName.LOW_BIRTH_WEIGHT_PCT]: 'Low Birth Weight Rate',
  [IndicatorName.NEONATAL_MORTALITY_RATE]: 'Neonatal Mortality Rate',
  [IndicatorName.MALARIA_CASE_RATE]: 'Malaria Case Rate',
};
