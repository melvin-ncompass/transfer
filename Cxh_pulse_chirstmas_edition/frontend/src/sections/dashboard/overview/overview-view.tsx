import { Box, CircularProgress, Stack } from '@mui/material';

import { MonthlyTemperaturePrecipitationChart } from '../climate/components/monthly-temperature-precipitation-chart';
import { PromptFilterProvider } from '../prompts/components/prompt-filter-context';
import {
    useGetDkhsSubcountiesGeoJSONQuery,
    useGetDkhisWardsQuery,
    useGetDkhisIndicatorDateFilterQuery,
} from '../../../api';
import DateRangeSlider from '../../../components/custom-date-range-picker/date-range-picker';
import { LocationSelector } from '../../../components/location-selector';
import { IndicatorSelect } from '../../../components/location-filters/indicator-select';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { DATE_RANGE_MAX_MONTH, DATE_RANGE_MIN_MONTH, DATE_RANGE_MAX_YEAR, DATE_RANGE_MIN_YEAR, getDateRangeMaxDate, getDateLastYearDate } from '../../../store/constants';
import { ChoroplethMap } from './components';
import { IndicatorTrendsTable, PromptsTrendTableV1 } from './components';
import { ChartHoverProvider } from '../climate/contexts/chart-hover-context';
import { useLocationHandlers } from './hooks/use-location-handlers';
import { useDateRangeHandlers } from './hooks/use-date-range-handlers';
import { useIndicatorManagement } from './hooks/use-indicator-management';
import { useLocationData } from './hooks/use-location-data';
import { useAnimationStateSync } from './hooks/use-animation-state-sync';
import { useClimateData } from './hooks/use-climate-data';
import { useIndicatorData } from './hooks/use-indicator-data';
import { overviewViewStyles } from '../../../styles/layouts/overview-view.styles';
import type { InsightsDataProps } from '../../../types/insights.types';

// ----------------------------------------------------------------------

/**
 * Helper function to get the full date range (from start to end)
 * Returns the complete valid range (Jan 2022 - Oct 2025)
 */
const getFullDateRange = (): { from: Date; to: Date } => {
    const minDate = getDateLastYearDate();
    const maxDate = getDateRangeMaxDate();
    return { from: minDate, to: maxDate };
};

/**
 * OverviewView - Overview dashboard component
 * 
 * Displays 4 quadrants:
 * - Q1 (Top Left): Monthly Temperature Line Chart
 * - Q2 (Top Right): Monthly Rainfall Line Chart
 * - Q3 (Bottom Left): Monthly Indicator Trend Line Chart
 * - Q4 (Bottom Right): Monthly Priority Trend Line Chart
 */
export function OverviewView({ wardsGeoJSON, navigateToClimateTab, navigateToPromptsTab, hasClimatePermission, hasPromptsPermission }: InsightsDataProps) {
    // Location state
    const [ward, setWard] = useState<string>('');
    const [county, setCounty] = useState<string>('');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(getFullDateRange());
    const [selectionMode, setSelectionMode] = useState<'subcounty' | 'ward'>('ward');

    // Animation state (only for indicators, not population)
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLooping, setIsLooping] = useState(true);
    const [showAll, setShowAll] = useState(true); // Show all data by default
    const [speed] = useState<number>(1); // Can be made configurable later

    // Fetch wards data for location selector
    const { data: wardsData, isLoading: isLoadingWards } = useGetDkhisWardsQuery();

    // Fetch indicators data for IndicatorSelect
    const { data: indicatorsData } = useGetDkhisIndicatorDateFilterQuery();

    // Indicator management
    const {
        selectedIndicator,
        setSelectedIndicator,
        isPopulationMode,
        indicatorDisplayName,
        previousIndicatorRef,
    } = useIndicatorManagement({ indicatorsData });

    // Reset location selector and map when indicator changes
    const mapResetRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        // Only reset if indicator actually changed (not on initial load)
        if (previousIndicatorRef.current && previousIndicatorRef.current !== selectedIndicator) {
            setWard('');
            setCounty('');
            // Reset map view when indicator changes
            if (mapResetRef.current) {
                mapResetRef.current();
            }
        }
    }, [selectedIndicator, previousIndicatorRef]);

    // Indicator data and animation
    const {
        isLoadingIndicator,
        isFetchingIndicator,
        setFrameIdx,
        playing,
        setPlaying,
        frames,
        frameDates,
        currentFrameDate,
        filteredData,
        indicatorValueMap,
        indicatorColorScale,
    } = useIndicatorData({
        selectedIndicator,
        isPopulationMode,
        dateRange,
        speed,
        isLooping,
        showAll,
    });

    // Sync animation state
    useAnimationStateSync({
        playing,
        showAll,
        setPlaying,
        setShowAll,
        setFrameIdx,
        setIsPlaying,
    });

    // Force ward mode when indicator is selected (not population)
    useEffect(() => {
        if (!isPopulationMode && selectedIndicator) {
            setSelectionMode('ward');
        }
    }, [isPopulationMode, selectedIndicator]);

    // Location data processing
    const { availableSubcounties, availableWards, hierarchyData } = useLocationData({
        wardsData,
        county,
    });

    // Location handlers
    const { handleCountyChange, handleWardChange } = useLocationHandlers({
        setCounty,
        setWard,
        setSelectionMode,
        isPopulationMode,
        wardsData,
    });

    // Date range handlers
    const { handlePlayToggle, handleFrameChange, handleShowAllToggle, handleLoopToggle } = useDateRangeHandlers({
        isPlaying,
        setPlaying,
        setShowAll,
        setFrameIdx,
        frameDates,
        setIsLooping,
    });

    // Fetch subcounty GeoJSON with date range
    const { data: subcountiesGeoJSON, isLoading: isLoadingSubcountiesGeoJSON } = useGetDkhsSubcountiesGeoJSONQuery(
        {
            startYear: dateRange.from.getFullYear(),
            startMonth: dateRange.from.getMonth() + 1,
            endYear: dateRange.to.getFullYear(),
            endMonth: dateRange.to.getMonth() + 1,
            ...(county && { subcounty: county }),
        },
        { skip: !dateRange }
    );

    // Climate data
    const {
        temperatureData,
        rainfallData,
        isLoadingTemperature,
        isLoadingRainfall,
        temperatureError,
        rainfallError,
        isFetchingTemperature,
        isFetchingRainfall,
    } = useClimateData({ ward, county, dateRange });


    return (
        <ChartHoverProvider>
            <PromptFilterProvider>
                {/* Date Range Slider and Location Selector - Sticky to page, above content */}
                <Box sx={overviewViewStyles.stickyFilterBar}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                        {/* Indicator Select */}
                        <Box sx={overviewViewStyles.indicatorSelectBox}>
                            <IndicatorSelect
                                value={selectedIndicator}
                                onChange={setSelectedIndicator}
                                label="Indicator"
                                placeholder="Select indicator..."
                                enablePopulationOption
                                maxWidth={300}
                            />
                        </Box>
                        <Box sx={overviewViewStyles.locationSelectorBox}>
                            {isLoadingWards && (
                                <Box sx={overviewViewStyles.loadingIndicatorOverlay}>
                                    <CircularProgress size={20} />
                                </Box>
                            )}
                            <LocationSelector
                                level2Options={availableSubcounties}
                                level2Selected={county}
                                onLevel2Change={handleCountyChange}
                                level3Options={availableWards}
                                level3Selected={ward}
                                onLevel3Change={handleWardChange}
                                hierarchyData={hierarchyData}
                                size="small"
                                maxWidth="100%"
                                filterMode="all"
                            />
                        </Box>
                        <Box sx={overviewViewStyles.dateRangeSliderBox}>
                            <DateRangeSlider
                                minYear={DATE_RANGE_MIN_YEAR}
                                maxYear={DATE_RANGE_MAX_YEAR}
                                minMonth={DATE_RANGE_MIN_MONTH}
                                maxMonth={DATE_RANGE_MAX_MONTH}
                                initialFrom={dateRange.from}
                                initialTo={dateRange.to}
                                onChange={setDateRange}
                                playable={!isPopulationMode && !!selectedIndicator && frames.length > 0}
                                isPlaying={isPlaying}
                                currentFrame={showAll ? null : currentFrameDate}
                                onPlayToggle={handlePlayToggle}
                                onFrameChange={handleFrameChange}
                                frames={frameDates}
                                isLooping={isLooping}
                                onLoopToggle={handleLoopToggle}
                                showAll={showAll}
                                onShowAllToggle={handleShowAllToggle}
                                isLoading={isLoadingIndicator || isFetchingIndicator}
                            />
                        </Box>
                    </Stack>
                </Box>
                <Stack direction="column" spacing={0} sx={overviewViewStyles.mainContentStack}>
                    <Box sx={overviewViewStyles.topRowContainer}>
                        <Box sx={overviewViewStyles.mapBox}>
                            {(isLoadingIndicator || isFetchingIndicator) && !isPopulationMode && (
                                <Box sx={overviewViewStyles.mapLoadingOverlay}>
                                    <CircularProgress />
                                </Box>
                            )}
                            <ChoroplethMap
                                wardsGeoJSON={wardsGeoJSON}
                                subcountiesGeoJSON={subcountiesGeoJSON}
                                selectedWard={ward}
                                selectedCounty={county}
                                selectionMode={selectionMode}
                                onSelectionModeChange={useCallback((mode: 'subcounty' | 'ward') => setSelectionMode(mode), [])}
                                dateRange={useMemo(() => ({ from: dateRange.from, to: dateRange.to }), [dateRange.from, dateRange.to])}
                                isLoadingGeoJSON={selectionMode === 'ward' ? isLoadingWards : isLoadingSubcountiesGeoJSON}
                                onReset={useCallback(() => {
                                    setWard('');
                                    setCounty('');
                                }, [])}
                                onResetRef={useCallback((resetFn: () => void) => {
                                    mapResetRef.current = resetFn;
                                }, [])}
                                dataMode={isPopulationMode ? 'population' : 'indicator'}
                                indicatorData={!isPopulationMode ? filteredData : undefined}
                                indicatorValueMap={!isPopulationMode ? indicatorValueMap : undefined}
                                indicatorColorScale={!isPopulationMode ? indicatorColorScale : undefined}
                                title={indicatorDisplayName}
                                showSelectionModeToggle={isPopulationMode}
                            />
                        </Box>
                        <Box sx={overviewViewStyles.chartBox}>
                            {(isLoadingTemperature || isLoadingRainfall || isFetchingTemperature || isFetchingRainfall) ? (
                                <Box sx={overviewViewStyles.chartLoadingBox}>
                                    <CircularProgress />
                                </Box>
                            ) : (temperatureError || rainfallError) ? (
                                <Box sx={overviewViewStyles.chartErrorBox}>
                                    Error loading climate data
                                </Box>
                            ) : (
                                <Box sx={overviewViewStyles.chartContentBox}>
                                    <MonthlyTemperaturePrecipitationChart
                                        temperatureData={temperatureData}
                                        precipitationData={rainfallData}
                                        onTitleClick={navigateToClimateTab}
                                        isTitleClickable={hasClimatePermission && !!navigateToClimateTab}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>

                    <Box sx={overviewViewStyles.bottomRowContainer}>
                        <Box sx={overviewViewStyles.indicatorTrendsTableBox(isPopulationMode)}>
                            <IndicatorTrendsTable
                                dateRange={dateRange}
                                ward={ward || undefined}
                                county={county || undefined}
                                selectedIndicator={selectedIndicator || undefined}
                            />
                        </Box>
                        {/* Prompts Trends Table */}
                        <Box sx={overviewViewStyles.promptsTrendTableBox}>
                            <PromptsTrendTableV1
                                dateRange={useMemo(() => ({ from: dateRange.from, to: dateRange.to }), [dateRange.from, dateRange.to])}
                                ward={ward || undefined}
                                county={county || undefined}
                                onTitleClick={navigateToPromptsTab}
                                isTitleClickable={hasPromptsPermission && !!navigateToPromptsTab}
                            />
                        </Box>
                    </Box>
                </Stack>
            </PromptFilterProvider>
        </ChartHoverProvider>
    );
}
