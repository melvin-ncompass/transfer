import { useMemo } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { meterToMillimeter } from '../../../utils/format-number';
import { precipitationLegendStyles } from '../../../styles/components/precipitation-legend.styles';
import type { PrecipitationLegendProps } from '../../../types/component.types';

// ----------------------------------------------------------------------

/**
 * PrecipitationLegend - Legend component for precipitation heatmap
 * 
 * Displays a color gradient from dark blue (low) to white (high) with precipitation range
 * 
 * @param temperatureData - Array of Copernicus records with raw_tp values (precipitation)
 * @param textColor - Text color for the legend ('white' or 'black', defaults to 'white')
 */
export function PrecipitationLegend({
    temperatureData,
    textColor = 'white',
    bottomOffset = 0,
}: PrecipitationLegendProps) {
    const textColorValue = textColor === 'black' ? 'black' : 'white';

    // Calculate min and max precipitation values
    const { minValue, maxValue } = useMemo(() => {
        if (!temperatureData || temperatureData.length === 0) {
            return { minValue: 0, maxValue: 0 };
        }

        const tpValues = temperatureData
            .map((d: any) => d.raw_tp)
            .filter((v: any): v is number => Number.isFinite(v) && v !== undefined);

        if (tpValues.length === 0) {
            return { minValue: 0, maxValue: 0 };
        }

        const min = Math.min(...tpValues);
        const max = Math.max(...tpValues);

        return { minValue: min, maxValue: max };
    }, [temperatureData]);

    // Generate gradient stops for the legend bar (blue to cyan to white)
    const gradientStops = useMemo(() => {
        const stops: string[] = [];
        const numStops = 20;

        for (let i = 0; i <= numStops; i++) {
            const factor = i / numStops;
            let r, g, b;

            if (factor <= 0.33) {
                // Dark blue to medium blue
                const localFactor = factor / 0.33;
                r = 0;
                g = Math.round(0 + (64 - 0) * localFactor);
                b = Math.round(128 + (255 - 128) * localFactor);
            } else if (factor <= 0.66) {
                // Medium blue to cyan
                const localFactor = (factor - 0.33) / 0.33;
                r = Math.round(0 + (64 - 0) * localFactor);
                g = Math.round(64 + (192 - 64) * localFactor);
                b = 255;
            } else {
                // Cyan to white
                const localFactor = (factor - 0.66) / 0.34;
                r = Math.round(64 + (255 - 64) * localFactor);
                g = Math.round(192 + (255 - 192) * localFactor);
                b = 255;
            }

            const alpha = Math.round(40 + (180 - 40) * factor);
            stops.push(`rgba(${r}, ${g}, ${b}, ${alpha / 255}) ${(factor * 100).toFixed(1)}%`);
        }

        return stops.join(', ');
    }, []);

    const hasData = temperatureData && temperatureData.length > 0 && maxValue > minValue;

    if (!hasData) return null;

    return (
        <Box sx={precipitationLegendStyles.container(bottomOffset)}>
            <Paper elevation={3} sx={precipitationLegendStyles.paper}>
                <Stack spacing={1}>
                    <Typography variant="caption" sx={precipitationLegendStyles.minMaxLabel(textColorValue)}>
                        Precipitation (mm)
                    </Typography>

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
                            {meterToMillimeter(minValue as number).toFixed(2)} m
                        </Typography>
                        <Typography variant="caption" sx={precipitationLegendStyles.valueLabel(textColorValue)}>
                            {meterToMillimeter(maxValue as number).toFixed(2)} mm
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

