export const BASE_COLOR = 255;

function getCellColors(binData: any, data: any[]) {
  // Calculate color based on intensityPercentage
  // Find min and max intensityPercentage for normalization
  const intensityRatios = data.map((item) => item.intensityPercent!);
  const minIntensityRatio = Math.min(...intensityRatios);
  const maxIntensityRatio = Math.max(...intensityRatios);
  const range = maxIntensityRatio - minIntensityRatio || 1;

  // Normalize to 0-1 range, then apply exponential scaling to amplify small differences
  const normalizedRatio = (binData.intensityPercent || 0 - minIntensityRatio) / range;
  // Apply square root to amplify differences in the lower range
  const amplifiedRatio = Math.pow(normalizedRatio, 0.5);

  const r = BASE_COLOR;
  const g = Math.round(140 - 50 * amplifiedRatio);
  const b = Math.round(140 - 50 * amplifiedRatio); 

  const cellColor = `rgb(${r}, ${g}, ${b})`;
  const textColor =  '#000000'

  return { cellColor, textColor };
}

export default getCellColors;
