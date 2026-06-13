/** Config names that are system-defined and cannot be edited or deleted from the list/details header */
export const SYSTEM_TAX_REGIME_CONFIG_NAMES = ["Old Tax Regime", "New Tax Regime"] as const;

export function isSystemTaxRegimeConfig(configName: string | null | undefined): boolean {
  if (!configName || typeof configName !== "string") return false;
  const trimmed = configName.trim();
  return SYSTEM_TAX_REGIME_CONFIG_NAMES.some((name) => trimmed === name);
}

/** Only Old Tax Regime hides version switcher / add version; New Tax Regime may still add/switch versions. */
export function isOldTaxRegimeConfig(configName: string | null | undefined): boolean {
  if (!configName || typeof configName !== "string") return false;
  return configName.trim() === "Old Tax Regime";
}

export function isNewTaxRegimeConfig(configName: string | null | undefined): boolean {
  if (!configName || typeof configName !== "string") return false;
  return configName.trim() === "New Tax Regime";
}

export function shouldHideVersionControlsForTaxConfig(configName: string | null | undefined): boolean {
  return isOldTaxRegimeConfig(configName);
}
