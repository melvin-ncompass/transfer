import { Stack, Box, CircularProgress, Alert } from '@mui/material';
import {
    useGetPromptsMonthlyRainfallQuery,
    useGetPromptsMonthlyTemperatureQuery,
} from '../../../../api';
import { MonthlyTemperatureLineChart } from './monthly-temperature-line-chart';
import { MonthlyRainfallLineChart } from './monthly-rainfall-line-chart';
import { MonthlyTemperatureHeatmap } from './monthly-temperature-heatmap';
import { MonthlyRainfallHeatmap } from './monthly-rainfall-heatmap';
import { ClimateAndHealthFilter } from './climate-and-health-filter';
import { useState, useEffect } from 'react';
import { DATE_RANGE_MIN_YEAR, DATE_RANGE_MAX_YEAR, DATE_RANGE_MIN_MONTH, DATE_RANGE_MAX_MONTH, getDateRangeMinDate, getDateRangeMaxDate } from '../../../../store/constants';
import { climateStyles } from '../../../../styles/components/climate.styles';

// ----------------------------------------------------------------------

/**
 * Helper function to get the full date range (from start to end)
 * Returns the complete valid range (Jan 2022 - Oct 2025)
 */
const getFullDateRange = (): { from: Date; to: Date } => {
    const minDate = getDateRangeMinDate();
    const maxDate = getDateRangeMaxDate();

    return { from: minDate, to: maxDate };
};

/**
 * ClimateCharts - Component containing all climate-related charts
 * 
 * Handles:
 * - All API calls for temperature and rainfall data
 * - Loading and error states
 * 
 * Displays:
 * - Line charts for monthly temperature and precipitation trends
 * - Heatmaps for temperature and precipitation by month and year
 */
export function ClimateCharts() {
    // Fetch temperature and precipitation data from separate endpoints

    const [selectedCounty, setSelectedCounty] = useState<string>('');
    const [selectedWard, setSelectedWard] = useState<string>('');
    // Initialize date range to full range: from start (Jan 2022) to end (Oct 2025)
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(getFullDateRange());
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Extract year and month from date range
    const startYear = dateRange.from ? dateRange.from.getFullYear() : undefined;
    const startMonth = dateRange.from ? dateRange.from.getMonth() + 1 : undefined; // getMonth() returns 0-11, so add 1
    const endYear = dateRange.to ? dateRange.to.getFullYear() : undefined;
    const endMonth = dateRange.to ? dateRange.to.getMonth() + 1 : undefined; // getMonth() returns 0-11, so add 1


    const {
        data: rainfallData = [],
        isLoading: isLoadingRainfall,
        isFetching: isFetchingRainfall,
        error: rainfallError,
        refetch: refetchRainfall,
    } = useGetPromptsMonthlyRainfallQuery({
        subcounty: selectedCounty || undefined,
        ward: selectedWard || undefined,
        startYear,
        startMonth,
        endYear,
        endMonth,
    });

    const {
        data: temperatureData = [],
        isLoading: isLoadingTemperature,
        isFetching: isFetchingTemperature,
        error: temperatureError,
        refetch: refetchTemperature,
    } = useGetPromptsMonthlyTemperatureQuery({
        subcounty: selectedCounty || undefined,
        ward: selectedWard || undefined,
        startYear,
        startMonth,
        endYear,
        endMonth,
    });

    // Refetch data when filter values change
    // Note: RTK Query automatically refetches when parameters change,
    // but this ensures explicit refetching when filters are updated
    useEffect(() => {
        // if (selectedWard && selectedCounty && startYear && startMonth && endYear && endMonth) {
        refetchRainfall();
        refetchTemperature();
        // }
    }, [selectedWard, selectedCounty, startYear, startMonth, endYear, endMonth, refetchRainfall, refetchTemperature]);

    const isLoading = isLoadingRainfall || isLoadingTemperature;
    const isFetching = isFetchingRainfall || isFetchingTemperature;
    const error = rainfallError || temperatureError;

    // Loading state
    if (isLoading || isFetching) {
        return (
            <Stack direction="column" spacing={3} sx={climateStyles.container}>
                <Box sx={climateStyles.loadingContainer}>
                    <CircularProgress />
                </Box>
            </Stack>
        );
    }

    // Error state
    if (error) {
        return (
            <Stack direction="column" spacing={3} sx={climateStyles.container}>
                <Alert severity="error">Failed to load data. Please try again later.</Alert>
            </Stack>
        );
    }

    return (
        <Stack direction="column" spacing={3} sx={climateStyles.container}>

            <ClimateAndHealthFilter
                selectedCounty={selectedCounty}
                selectedWard={selectedWard}
                onCountyChange={setSelectedCounty}
                onWardChange={setSelectedWard}
                dateRangeProps={{
                    minYear: DATE_RANGE_MIN_YEAR,
                    maxYear: DATE_RANGE_MAX_YEAR,
                    minMonth: DATE_RANGE_MIN_MONTH,
                    maxMonth: DATE_RANGE_MAX_MONTH,
                    initialFrom: dateRange.from,
                    initialTo: dateRange.to,
                    onChange: (range) => setDateRange(range),
                }}
                isFullscreen={isFullscreen}
            />

            {/* Top Row: Line Charts */}
            <Box sx={climateStyles.chartsRow}>
                {/* Bottom Row: Heatmaps */}
                <Box sx={climateStyles.heatmapsContainer}>
                    <MonthlyTemperatureHeatmap data={temperatureData} />
                    <MonthlyRainfallHeatmap data={rainfallData} />
                </Box>

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <MonthlyTemperatureLineChart data={temperatureData} />
                    <MonthlyRainfallLineChart data={rainfallData} />
                </Box>
            </Box>
        </Stack>
    );
}
