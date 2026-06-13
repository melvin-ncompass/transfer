/**
 * Color Gradient Utilities
 *
 * Provides smooth color transitions from green (low) to red (high) for choropleth maps and charts
 */

// Color stops for gradient: Green -> Yellow -> Red
export const GREEN_COLOR: [number, number, number] = [34, 197, 94];
export const YELLOW_COLOR: [number, number, number] = [255, 255, 0];
export const RED_COLOR: [number, number, number] = [255, 0, 0];

/**
 * Interpolate between two RGB colors
 * @param color1 - First color as [R, G, B]
 * @param color2 - Second color as [R, G, B]
 * @param factor - Interpolation factor (0-1)
 * @returns Interpolated color as [R, G, B]
 */
export function interpolateColor(
  color1: [number, number, number],
  color2: [number, number, number],
  factor: number
): [number, number, number] {
  const clampedFactor = Math.max(0, Math.min(1, factor));
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * clampedFactor),
    Math.round(color1[1] + (color2[1] - color1[1]) * clampedFactor),
    Math.round(color1[2] + (color2[2] - color1[2]) * clampedFactor),
  ];
}

/**
 * Get smooth gradient color from green to red based on normalized value (0-1)
 * @param normalizedValue - Value normalized between 0 and 1
 * @returns RGB color as [R, G, B]
 */
export function getGradientColor(normalizedValue: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, normalizedValue));

  // Smooth transition: Green -> Yellow -> Red
  if (clamped <= 0.5) {
    // First half: Green to Yellow
    const factor = clamped * 2; // 0 to 1 for first half
    return interpolateColor(GREEN_COLOR, YELLOW_COLOR, factor);
  } else {
    // Second half: Yellow to Red
    const factor = (clamped - 0.5) * 2; // 0 to 1 for second half
    return interpolateColor(YELLOW_COLOR, RED_COLOR, factor);
  }
}

/**
 * Get gradient color as RGB string
 * @param normalizedValue - Value normalized between 0 and 1
 * @returns RGB color string like "rgb(34, 197, 94)"
 */
export function getGradientColorString(normalizedValue: number): string {
  const rgb = getGradientColor(normalizedValue);
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

/**
 * Get gradient color with opacity as RGBA string
 * @param normalizedValue - Value normalized between 0 and 1
 * @param opacity - Opacity value (0-1), defaults to 1
 * @returns RGBA color string like "rgba(34, 197, 94, 0.8)"
 */
export function getGradientColorRGBA(normalizedValue: number, opacity: number = 1): string {
  const rgb = getGradientColor(normalizedValue);
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
}

/**
 * Generate array of gradient colors for a set of values
 * @param values - Array of numeric values
 * @returns Array of RGB color strings
 */
export function getGradientColors(values: number[]): string[] {
  if (values.length === 0) return [];

  const nonZeroValues = values.filter((v) => v > 0);
  if (nonZeroValues.length === 0) return values.map(() => '#808080'); // Gray for zero values

  const minValue = Math.min(...nonZeroValues);
  const maxValue = Math.max(...nonZeroValues);

  if (maxValue === minValue) {
    return values.map((value) => {
      if (value === 0) return '#808080'; // Gray for zero values
      return getGradientColorString(0); // Green for minimum value
    });
  }

  return values.map((value) => {
    if (value === 0) return '#808080'; // Gray for zero values

    // Normalize value to 0-1 range
    const normalized = (value - minValue) / (maxValue - minValue);
    return getGradientColorString(normalized);
  });
}

/**
 * Get yellow to orange gradient color based on normalized value (0-1)
 * @param normalizedValue - Value normalized between 0 and 1
 * @returns RGB color as [R, G, B]
 */
export function getYellowToOrangeColor(normalizedValue: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, normalizedValue));

  // Yellow: RGB(255, 255, 0)
  // Orange: RGB(255, 165, 0)
  const yellow: [number, number, number] = [255, 255, 0];
  const orange: [number, number, number] = [255, 165, 0];

  return interpolateColor(yellow, orange, clamped);
}

/**
 * Get yellow to red gradient color based on normalized value (0-1)
 * @param normalizedValue - Value normalized between 0 and 1
 * @returns RGB color as [R, G, B]
 */
export function getYellowToRedColor(normalizedValue: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, normalizedValue));

  // Yellow: RGB(255, 255, 0)
  // Red: RGB(255, 0, 0)
  const yellow: [number, number, number] = [255, 255, 0];
  const red: [number, number, number] = [255, 0, 0];

  return interpolateColor(yellow, red, clamped);
}

/**
 * Get light blue to dark blue gradient color based on normalized value (0-1)
 * @param normalizedValue - Value normalized between 0 and 1
 * @returns RGB color as [R, G, B]
 */
export function getLightBlueToDarkBlueColor(normalizedValue: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, normalizedValue));

  // Light blue: RGB(173, 216, 230)
  // Dark blue: RGB(0, 0, 139)
  const lightBlue: [number, number, number] = [173, 216, 230];
  const darkBlue: [number, number, number] = [0, 0, 139];

  return interpolateColor(lightBlue, darkBlue, clamped);
}

/**
 * Get color scale function for choropleth maps (green to red)
 * @param minValue - Minimum value in the dataset
 * @param maxValue - Maximum value in the dataset
 * @returns Function that takes a value and returns [R, G, B, A] color array
 */
export function createColorScale(minValue: number, maxValue: number) {
  return (value: number): [number, number, number, number] => {
    if (value === 0) return [0, 0, 0, 0]; // Transparent for no data

    // Handle case when minValue === maxValue (e.g., all values are the same)
    // In this case, treat it as the minimum value (normalized = 0) to show green
    if (maxValue === minValue) {
      const rgb = getGradientColor(0); // Green for minimum value
      const opacity = 150; // Minimum opacity
      return [rgb[0], rgb[1], rgb[2], opacity];
    }

    // Normalize value to 0-1 range
    const normalized = (value - minValue) / (maxValue - minValue);
    const clampedNormalized = Math.max(0, Math.min(1, normalized));

    const rgb = getGradientColor(clampedNormalized);

    // Opacity increases with value (minimum 150, maximum 255)
    const opacity = Math.round(150 + clampedNormalized * 105);

    return [rgb[0], rgb[1], rgb[2], opacity];
  };
}

/**
 * Get color scale function for temperature choropleth maps (yellow to orange)
 * @param minValue - Minimum value in the dataset
 * @param maxValue - Maximum value in the dataset
 * @returns Function that takes a value and returns [R, G, B, A] color array
 */
export function createTemperatureColorScale(minValue: number, maxValue: number) {
  return (value: number): [number, number, number, number] => {
    if (value === 0) return [0, 0, 0, 0]; // Transparent for no data

    // Handle case when minValue === maxValue
    if (maxValue === minValue) {
      const rgb = getYellowToOrangeColor(0); // Yellow for minimum value
      const opacity = 150; // Minimum opacity
      return [rgb[0], rgb[1], rgb[2], opacity];
    }

    // Normalize value to 0-1 range
    const normalized = (value - minValue) / (maxValue - minValue);
    const clampedNormalized = Math.max(0, Math.min(1, normalized));

    const rgb = getYellowToOrangeColor(clampedNormalized);

    // Opacity increases with value (minimum 150, maximum 255)
    const opacity = Math.round(150 + clampedNormalized * 105);

    return [rgb[0], rgb[1], rgb[2], opacity];
  };
}

/**
 * Get color scale function for precipitation choropleth maps (light blue to dark blue)
 * @param minValue - Minimum value in the dataset
 * @param maxValue - Maximum value in the dataset
 * @returns Function that takes a value and returns [R, G, B, A] color array
 */
export function createPrecipitationColorScale(minValue: number, maxValue: number) {
  return (value: number): [number, number, number, number] => {
    if (value === 0) return [0, 0, 0, 0]; // Transparent for no data

    // Handle case when minValue === maxValue
    if (maxValue === minValue) {
      const rgb = getLightBlueToDarkBlueColor(0); // Light blue for minimum value
      const opacity = 150; // Minimum opacity
      return [rgb[0], rgb[1], rgb[2], opacity];
    }

    // Normalize value to 0-1 range
    const normalized = (value - minValue) / (maxValue - minValue);
    const clampedNormalized = Math.max(0, Math.min(1, normalized));

    const rgb = getLightBlueToDarkBlueColor(clampedNormalized);

    // Opacity increases with value (minimum 150, maximum 255)
    const opacity = Math.round(150 + clampedNormalized * 105);

    return [rgb[0], rgb[1], rgb[2], opacity];
  };
}

/**
 * Convert RGBA color array to hex string
 * @param color - Color as [R, G, B, A] array
 * @returns Hex color string like "#22c55e" (ignores alpha channel for hex)
 */
export function rgbaToHex(color: [number, number, number, number]): string {
  const [r, g, b] = color;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
