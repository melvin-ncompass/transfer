import { Box, Stack } from '@mui/material';
import { ForecastChart, ForecastClimateChart } from '../forecast/components';
import { useGetKhisPredictionQuery, useGetCopernicusPredictionQuery } from '../../../api';
import { IndicatorName, INDICATOR_DISPLAY_NAMES } from '../../../types/indicators';

// ----------------------------------------------------------------------

/**
 * ForecastView - Forecast visualization with 5 line charts
 * 
 * Displays forecast predictions for 5 indicators:
 * - Severe MUAC Percentage
 * - Stillbirth Rate
 * - Low Birth Weight Percentage
 * - Neonatal Mortality Rate
 * - Malaria Case Rate
 */
export function ForecastView() {
    // Fetch climate prediction data
    const {
        data: climateData = [],
        isLoading: isClimateLoading,
        error: climateError,
    } = useGetCopernicusPredictionQuery();

    // Separate MALARIA_CASE_RATE from other indicators
    const malariaIndicator = IndicatorName.MALARIA_CASE_RATE;
    const otherIndicators = [
        IndicatorName.SEVERE_MUAC_PERCENTAGE,
        IndicatorName.STILLBIRTH_RATE,
        IndicatorName.LOW_BIRTH_WEIGHT_PCT,
        IndicatorName.NEONATAL_MORTALITY_RATE,
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
            <Stack spacing={3}>
                {/* Climate Forecast - Full width at top */}
                <ForecastClimateChart
                    title="Climate: Temperature & Precipitation"
                    data={climateData}
                    isLoading={isClimateLoading}
                    error={climateError}
                />

                {/* Malaria Case Rate - Full width */}
                <ForecastChartWrapper
                    indicator={malariaIndicator}
                    title={INDICATOR_DISPLAY_NAMES[malariaIndicator]}
                />

                {/* Other indicators - 50% width each (2 per row) */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                        },
                        gap: 3,
                    }}
                >
                    {otherIndicators.map((indicator) => (
                        <ForecastChartWrapper
                            key={indicator}
                            indicator={indicator}
                            title={INDICATOR_DISPLAY_NAMES[indicator]}
                        />
                    ))}
                </Box>
            </Stack>
        </Box>
    );
}

// ----------------------------------------------------------------------

type ForecastChartWrapperProps = {
    indicator: IndicatorName;
    title: string;
};

function ForecastChartWrapper({ indicator, title }: ForecastChartWrapperProps) {
    const {
        data = [],
        isLoading,
        error,
    } = useGetKhisPredictionQuery({ indicatorName: indicator });

    return (
        <ForecastChart
            title={title}
            data={data}
            isLoading={isLoading}
            error={error}
            indicator={indicator}
        />
    );
}

