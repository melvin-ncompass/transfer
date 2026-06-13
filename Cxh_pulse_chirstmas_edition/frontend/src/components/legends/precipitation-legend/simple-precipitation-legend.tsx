import { useMemo } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { getLightBlueToDarkBlueColor } from '../../../utils/color-gradient';
import { precipitationLegendStyles } from '../../../styles/components/precipitation-legend.styles';
import type { SimplePrecipitationLegendProps } from '../../../types/component.types';

// ----------------------------------------------------------------------

/**
 * SimplePrecipitationLegend - Simple color-only legend for precipitation choropleth
 * 
 * Displays a color gradient from light blue to dark blue with value range (no "Precipitation" label)
 */
export function SimplePrecipitationLegend({
    minValue,
    maxValue,
    textColor = 'white',
}: SimplePrecipitationLegendProps) {
    const textColorValue = textColor === 'black' ? 'black' : 'white';

    // Generate gradient stops for the legend bar (light blue to dark blue)
    const gradientStops = useMemo(() => {
        const stops: string[] = [];
        const numStops = 20;

        for (let i = 0; i <= numStops; i++) {
            const factor = i / numStops;
            const rgb = getLightBlueToDarkBlueColor(factor);
            stops.push(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]}) ${(factor * 100).toFixed(1)}%`);
        }

        return stops.join(', ');
    }, []);

    const hasData = minValue !== undefined && maxValue !== undefined && maxValue > minValue;

    if (!hasData) return null;

    return (
        <Box sx={precipitationLegendStyles.container(0)}>
            <Paper elevation={3} sx={precipitationLegendStyles.paper}>
                <Stack spacing={1}>
                    {/* Gradient bar */}
                    <Box
                        sx={{
                            ...precipitationLegendStyles.colorBar,
                            background: `linear-gradient(to right, ${gradientStops})`,
                        }}
                    />

                    {/* Value labels */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" sx={precipitationLegendStyles.valueLabel(textColorValue)}>
                            {minValue !== undefined ? minValue.toFixed(1) : '0.0'} mm
                        </Typography>
                        <Typography variant="caption" sx={precipitationLegendStyles.valueLabel(textColorValue)}>
                            {maxValue !== undefined ? maxValue.toFixed(1) : '0.0'} mm
                        </Typography>
                    </Stack>

                    <Typography variant="caption" sx={precipitationLegendStyles.lowHighLabel(textColorValue)}>
                        Low → High
                    </Typography>
                </Stack>
            </Paper>
        </Box>
    );
}

