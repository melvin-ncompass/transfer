import { useMemo } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { getYellowToOrangeColor } from '../../../utils/color-gradient';
import { temperatureLegendStyles } from '../../../styles/components/temperature-legend.styles';
import type { SimpleTemperatureLegendProps } from '../../../types/component.types';

// ----------------------------------------------------------------------

/**
 * SimpleTemperatureLegend - Simple color-only legend for temperature choropleth
 * 
 * Displays a color gradient from yellow to orange with value range (no "Temperature" label)
 */
export function SimpleTemperatureLegend({
    minValue,
    maxValue,
    textColor = 'white',
}: SimpleTemperatureLegendProps) {
    const textColorValue = textColor === 'black' ? 'black' : 'white';

    // Generate gradient stops for the legend bar (yellow to orange)
    const gradientStops = useMemo(() => {
        const stops: string[] = [];
        const numStops = 20;

        for (let i = 0; i <= numStops; i++) {
            const factor = i / numStops;
            const rgb = getYellowToOrangeColor(factor);
            stops.push(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]}) ${(factor * 100).toFixed(1)}%`);
        }

        return stops.join(', ');
    }, []);

    const hasData = minValue !== undefined && maxValue !== undefined && maxValue > minValue;

    if (!hasData) return null;

    return (
        <Box sx={temperatureLegendStyles.container}>
            <Paper elevation={3} sx={temperatureLegendStyles.paper}>
                <Stack spacing={1}>
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
                            {minValue !== undefined ? minValue.toFixed(1) : '0.0'}°C
                        </Typography>
                        <Typography variant="caption" sx={temperatureLegendStyles.valueLabel(textColorValue)}>
                            {maxValue !== undefined ? maxValue.toFixed(1) : '0.0'}°C
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

