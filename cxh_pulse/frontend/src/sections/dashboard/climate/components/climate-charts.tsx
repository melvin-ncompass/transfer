import { Stack, Box, Alert } from '@mui/material';
import {
    useGetPromptsMonthlyRainfallQuery,
    useGetPromptsMonthlyTemperatureQuery,
    useGetDkhisWardsQuery,
} from '../../../../api';
import { MonthlyTemperatureLineChart } from './monthly-temperature-line-chart';
import { MonthlyRainfallLineChart } from './monthly-rainfall-line-chart';
import { MonthlyTemperatureHeatmap } from './monthly-temperature-heatmap';
import { MonthlyRainfallHeatmap } from './monthly-rainfall-heatmap';
import { ClimateAndHealthFilter } from './climate-and-health-filter';
import { useState, useEffect, useMemo } from 'react';
import { DATE_RANGE_MIN_YEAR, DATE_RANGE_MAX_YEAR, DATE_RANGE_MIN_MONTH, DATE_RANGE_MAX_MONTH, getDateRangeMinDate, getDateRangeMaxDate } from '../../../../store/constants';
import { climateStyles } from '../../../../styles/components/climate.styles';
import { useLocationData } from '../../overview/hooks/use-location-data';

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
    const { data: wardsData } = useGetDkhisWardsQuery();
    const { availableSubcounties, availableWards, countyData } = useLocationData({ wardsData });

    const [selectedCounty, setSelectedCounty] = useState<string>('');
    const [selectedWard, setSelectedWard] = useState<string>('');
    const [selectedSubCounty, setSelectedSubCounty] = useState<string>('');
    // Initialize date range to full range: from start (Jan 2022) to end (Oct 2025)
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(getFullDateRange());
    // Add debounced state for API calls to prevent race conditions during slider scrubbing
    const [debouncedDateRange, setDebouncedDateRange] = useState<{ from: Date; to: Date }>(dateRange);

    // Debounce the date selection
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedDateRange(dateRange);
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [dateRange]);

    // Get location names for export
    const filterInfo = useMemo(() => {
        if (selectedWard) {
            const ward = availableWards.find((w) => w.id === selectedWard);
            return { ward: ward?.name || selectedWard };
        }
        if (selectedSubCounty) {
            const subcounty = availableSubcounties.find((s) => s.id === selectedSubCounty);
            return { subcounty: subcounty?.name || selectedSubCounty };
        }
        if (countyData?.label) {
            return { location: countyData.label };
        }
        return undefined;
    }, [selectedWard, selectedSubCounty, availableWards, availableSubcounties, countyData]);

    // Extract year and month from DEBOUNCED date range for API calls
    const startYear = debouncedDateRange.from ? debouncedDateRange.from.getFullYear() : undefined;
    const startMonth = debouncedDateRange.from ? debouncedDateRange.from.getMonth() + 1 : undefined; // getMonth() returns 0-11, so add 1
    const endYear = debouncedDateRange.to ? debouncedDateRange.to.getFullYear() : undefined;
    const endMonth = debouncedDateRange.to ? debouncedDateRange.to.getMonth() + 1 : undefined; // getMonth() returns 0-11, so add 1


    const {
        data: rainfallData = [],
        isLoading: isLoadingRainfall,
        isFetching: isFetchingRainfall,
        error: rainfallError,
        refetch: refetchRainfall,
    } = useGetPromptsMonthlyRainfallQuery({
        countyId: selectedCounty,
        wardId: selectedWard,
        subcountyId: selectedSubCounty,
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
        countyId: selectedCounty,
        wardId: selectedWard,
        subcountyId: selectedSubCounty,
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
    }, [selectedWard, selectedCounty, selectedSubCounty, startYear, startMonth, endYear, endMonth, refetchRainfall, refetchTemperature]);

    const isLoading = isLoadingRainfall || isLoadingTemperature;
    const isFetching = isFetchingRainfall || isFetchingTemperature;
    const error = rainfallError || temperatureError;


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
                selectedSubCounty={selectedSubCounty}
                onCountyChange={setSelectedCounty}
                onSubCountyChange={setSelectedSubCounty}
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
            />

            {/* Top Row: Line Charts */}
            <Box sx={climateStyles.chartsRow}>
                {/* Bottom Row: Heatmaps */}
                <Box sx={climateStyles.heatmapsContainer}>
                    <MonthlyTemperatureHeatmap
                        data={temperatureData}
                        filterInfo={filterInfo}
                        dateRange={dateRange}
                        isLoading={isFetching || isLoading}
                    />
                    <MonthlyRainfallHeatmap
                        data={rainfallData}
                        filterInfo={filterInfo}
                        dateRange={dateRange}
                        isLoading={isFetching || isLoading}
                    />
                </Box>

                <Box sx={climateStyles.lineChartsContainer}>
                    <MonthlyTemperatureLineChart
                        data={temperatureData}
                        filterInfo={filterInfo}
                        dateRange={dateRange}
                        isLoading={isFetching || isLoading}
                    />
                    <MonthlyRainfallLineChart
                        data={rainfallData}
                        filterInfo={filterInfo}
                        dateRange={dateRange}
                        isLoading={isFetching || isLoading}
                    />
                </Box>
            </Box>
        </Stack>
    );
}
