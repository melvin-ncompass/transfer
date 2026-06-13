import { useMemo } from 'react';
import { Box, Paper, Stack, Typography, useMediaQuery } from '@mui/material';
import { getGradientColorRGBA } from '../../../utils/color-gradient';
import { legendStyles } from '../../../styles/components/legend.styles';
import type { ChoroplethLegendProps } from '../../../types/component.types';
// ----------------------------------------------------------------------
/**
 * ChoroplethLegend - Reusable legend component for choropleth maps
 *
 * Displays a smooth color gradient from green (low) to red (high) with value range
 *
 * @param wardValueMap - Map of ward names to aggregated values
 * @param textColor - Text color for the legend ('white' or 'black', defaults to 'white')
 * @param minValue - Optional minimum value (auto-calculated if not provided)
 * @param maxValue - Optional maximum value (auto-calculated if not provided)
 */
export function ChoroplethLegend({
  wardValueMap,
  textColor = 'white',
  minValue: providedMinValue,
  maxValue: providedMaxValue,
  showLabel = true, // Default to true for backward compatibility
  backgroundColor = 'rgba(0, 0, 0, 0.6)', // Default to semi-transparent black
}: ChoroplethLegendProps) {
  const textColorValue = textColor === 'black' ? 'black' : 'white';
  const isSmallScreen = useMediaQuery('(max-width:899px)');
  // Calculate min and max values from wardValueMap if not provided
  const { minValue, maxValue } = useMemo(() => {
    // If both min and max are provided, use them
    if (providedMinValue !== undefined && providedMaxValue !== undefined) {
      return { minValue: providedMinValue, maxValue: providedMaxValue };
    }
    const values = Object.values(wardValueMap).filter((v) => v > 0);
    if (values.length === 0) {
      return { minValue: 0, maxValue: 0 };
    }
    const calculatedMin = Math.min(...values);
    const calculatedMax = Math.max(...values);
    return {
      minValue: providedMinValue ?? calculatedMin,
      maxValue: providedMaxValue ?? calculatedMax,
    };
  }, [wardValueMap, providedMinValue, providedMaxValue]);
  // Check if we are displaying a single value
  const isSingleValue = minValue === maxValue;
  // Generate gradient stops for the legend bar
  const gradientBackground = useMemo(() => {
    // If single value, return a solid color (using the 'low/start' color to match map defaults)
    if (isSingleValue) {
      return getGradientColorRGBA(0, 0.8);
    }
    const stops: string[] = [];
    const numStops = 20; // Number of color stops for smooth gradient
    for (let i = 0; i <= numStops; i++) {
      const normalized = i / numStops;
      const color = getGradientColorRGBA(normalized, 0.8);
      stops.push(`${color} ${(normalized * 100).toFixed(1)}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [isSingleValue]);
  const hasData =
    Object.keys(wardValueMap).length > 0 ||
    (providedMinValue !== undefined && providedMaxValue !== undefined);
  if (!hasData) return null;
  return (
    <Box sx={legendStyles.choroplethContainer(isSmallScreen)}>
      <Paper elevation={3} sx={legendStyles.choroplethPaper(backgroundColor)}>
        <Stack spacing={1}>
          {/* Color Bar (Gradient or Solid) */}
          <Box
            sx={{
              ...legendStyles.colorBar,
              background: gradientBackground,
            }}
          />
          {/* Value labels */}
          {isSingleValue ? (
            /* Single Value: Centered Number */
            <Stack direction="row" justifyContent="center" alignItems="center">
              <Typography variant="caption" sx={legendStyles.legendText(textColorValue)}>
                {minValue.toLocaleString()}
              </Typography>
            </Stack>
          ) : (
            /* Range: Min and Max with "Low -> High" label */
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={legendStyles.legendTextNormal(textColorValue)}>
                  {minValue.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={legendStyles.legendTextNormal(textColorValue)}>
                  {maxValue.toLocaleString()}
                </Typography>
              </Stack>
              {showLabel && (
                <Typography
                  variant="caption"
                  sx={legendStyles.legendLabel(textColorValue)}
                >
                  Low → High
                </Typography>
              )}
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}