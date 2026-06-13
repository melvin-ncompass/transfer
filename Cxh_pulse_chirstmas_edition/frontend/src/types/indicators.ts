/**
 * Indicator names for forecast predictions
 */
export enum IndicatorName {
  SEVERE_MUAC_PERCENTAGE = 'severe_MUAC_percentage',
  STILLBIRTH_RATE = 'stillbirth_rate',
  LOW_BIRTH_WEIGHT_PCT = 'low_birth_weight_pct',
  NEONATAL_MORTALITY_RATE = 'neonatal_mortality_rate',
  MALARIA_CASE_RATE = 'malaria_case_rate',
}

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
