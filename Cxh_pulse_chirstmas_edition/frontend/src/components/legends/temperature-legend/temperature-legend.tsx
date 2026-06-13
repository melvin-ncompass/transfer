import { useMemo } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { kelvinToCelsius } from '../../../utils/format-number';
import { temperatureLegendStyles } from '../../../styles/components/temperature-legend.styles';
import type { TemperatureLegendProps } from '../../../types/component.types';

// ----------------------------------------------------------------------

/**
 * TemperatureLegend - Legend component for temperature heatmap
 * 
 * Displays a color gradient from dark red (low) to orange (high) with temperature range
 * 
 * @param temperatureData - Array of Copernicus records with raw_t2m values
 * @param textColor - Text color for the legend ('white' or 'black', defaults to 'white')
 */
export function TemperatureLegend({
    temperatureData,
    textColor = 'white',
}: TemperatureLegendProps) {
    const textColorValue = textColor === 'black' ? 'black' : 'white';

    // Calculate min and max temperature values
    const { minValue, maxValue } = useMemo(() => {
        if (!temperatureData || temperatureData.length === 0) {
            return { minValue: 0, maxValue: 0 };
        }

        const t2mValues = temperatureData
            .map((d: any) => d.raw_t2m)
            .filter((v: any): v is number => Number.isFinite(v) && v !== undefined);

        if (t2mValues.length === 0) {
            return { minValue: 0, maxValue: 0 };
        }

        const min = Math.min(...t2mValues);
        const max = Math.max(...t2mValues);

        // Convert from Kelvin to Celsius for display
        const minCelsius = min - 273.15;
        const maxCelsius = max - 273.15;

        return { minValue: minCelsius, maxValue: maxCelsius };
    }, [temperatureData]);

    // Generate gradient stops for the legend bar (red to orange)
    const gradientStops = useMemo(() => {
        const stops: string[] = [];
        const numStops = 20;

        for (let i = 0; i <= numStops; i++) {
            const factor = i / numStops;
            // Red to orange gradient
            let r, g, b;
            if (factor <= 0.5) {
                // Dark red to medium red
                const localFactor = factor * 2;
                r = Math.round(64 + (128 - 64) * localFactor);
                g = Math.round(0 + (16 - 0) * localFactor);
                b = 0;
            } else {
                // Medium red to orange
                const localFactor = (factor - 0.5) * 2;
                r = Math.round(128 + (255 - 128) * localFactor);
                g = Math.round(16 + (128 - 16) * localFactor);
                b = 0;
            }
            const alpha = Math.round(40 + (150 - 40) * factor);
            stops.push(`rgba(${r}, ${g}, ${b}, ${alpha / 255}) ${(factor * 100).toFixed(1)}%`);
        }

        return stops.join(', ');
    }, []);

    const hasData = temperatureData && temperatureData.length > 0 && maxValue > minValue;

    if (!hasData) return null;

    return (
        <Box sx={temperatureLegendStyles.container}>
            <Paper elevation={3} sx={temperatureLegendStyles.paper}>
                <Stack spacing={1}>
                    <Typography variant="caption" sx={temperatureLegendStyles.titleLabel(textColorValue)}>
                        Temperature (°C)
                    </Typography>

                    {/* Gradient bar */}
                    <Box
                        sx={{
                            ...temperatureLegendStyles.colorBar,
                            background: `linear-gradient(to right, ${gradientStops})`,
                        }}
                    />

                    {/* Value labels */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" sx={temperatureLegendStyles.valueLabel(textColorValue)}>
                            {kelvinToCelsius(minValue as number).toFixed(1)}°C
                        </Typography>
                        <Typography variant="caption" sx={temperatureLegendStyles.valueLabel(textColorValue)}>
                            {kelvinToCelsius(maxValue as number).toFixed(1)}°C
                        </Typography>
                    </Stack>

                    <Typography variant="caption" sx={temperatureLegendStyles.lowHighLabel(textColorValue)}>
                        Low → High
                    </Typography>
                </Stack>
            </Paper>
        </Box>
    );
}

