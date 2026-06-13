
export const defaultStartDate = () => new Date().toISOString().slice(0, 10);

export const buildFrequencyPayload = (
  frequency: string,
  customRecurrence: any,
  customUnit: string,
  customInterval: number | ""
) => {
  if (frequency !== "custom") return { type: frequency };
  if (customRecurrence) return customRecurrence;
  return { type: "custom", interval: customInterval || 1, unit: customUnit };
};

