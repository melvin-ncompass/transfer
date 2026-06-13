import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useGetCopernicusTemperatureQuery, useGetDkhisIndicatorCountQuery, useGetDkhisIndicatorCountDateRangeQuery, useGetDkhsSubcountiesGeoJSONQuery } from '../../../api';
import { COUNTY_NAME, DATE_RANGE_MIN_YEAR, DATE_RANGE_MAX_YEAR, DATE_RANGE_MIN_MONTH, DATE_RANGE_MAX_MONTH, getDateRangeMaxDate, getDateLastYearDate } from '../../../store/constants';
import { normalizeLocationName } from '../../../utils/location-normalize';
import { useIndicatorAnimation } from '../../../hooks/use-indicator-animation';
import { createColorScale } from '../../../utils/color-gradient';
import { POPULATION_INDICATOR_VALUE } from '../../../components/location-filters';
import type { InsightsDataProps, TemperatureGeoJSON } from '../../../types/insights.types';

type UseDashboardStateProps = {
    insightsData: InsightsDataProps;
    useDateRangeSlider?: boolean;
    dateRangeConfig?: {
        minYear?: number;
        maxYear?: number;
        minMonth?: number;
        maxMonth?: number;
    };
    hideIndicatorSelector?: boolean;
    enablePopulationOption?: boolean;
    enableAnimation?: boolean;
};

/**
 * useDashboardState - Custom hook to manage dashboard layout state
 * 
 * Extracted from DashboardLayout to separate state management logic
 * from presentation logic.
 */
export function useDashboardState({
    insightsData,
    useDateRangeSlider = false,
    dateRangeConfig,
    hideIndicatorSelector = false,
    enablePopulationOption = false,
    enableAnimation = false,
}: UseDashboardStateProps) {
    const { wardsData, indicatorsData } = insightsData;

    // Selected indicator state
    const [selectedIndicator, setSelectedIndicator] = useState<string>('');
    const isPopulationMode = selectedIndicator === POPULATION_INDICATOR_VALUE;

    // Date range states
    const [selectedMonthRange, setSelectedMonthRange] = useState<[string, string] | null>(null);
    const getInitialDateRange = () => {
        if (useDateRangeSlider) {
            return {
                from: getDateLastYearDate(),
                to: getDateRangeMaxDate(),
            };
        }
        return null;
    };
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(getInitialDateRange());

    // Auto-select first indicator when indicators data loads
    useEffect(() => {
        if (!hideIndicatorSelector && indicatorsData && indicatorsData.length > 0 && !selectedIndicator) {
            const sortedIndicators = [...indicatorsData].sort((a, b) =>
                (a.section || '').localeCompare(b.section || '')
            );
            setSelectedIndicator(sortedIndicators[0].indicator);
        }
    }, [indicatorsData, selectedIndicator, hideIndicatorSelector]);

    // Animation state
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLooping, setIsLooping] = useState(true);
    const [speed] = useState<number>(1);

    // Layer visibility toggles
    const [showTemperature, setShowTemperature] = useState<boolean>(false);
    const [showFacilities, setShowFacilities] = useState<boolean>(false);
    const [showPrecipitation, setShowPrecipitation] = useState<boolean>(false);

    // Sidebar state
    const [isHealthIndicatorsOpen, setIsHealthIndicatorsOpen] = useState<boolean>(true);

    // Location filter states
    const [selectedSubcounty, setSelectedSubcounty] = useState<string>('');
    const [selectedWard, setSelectedWard] = useState<string>('');

    // Selection mode state (for population mode)
    const [selectionMode, setSelectionMode] = useState<'subcounty' | 'ward'>('ward');

    // Fullscreen state
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Extract min/max months for date picker
    const { minMonth, maxMonth } = useMemo(() => {
        if (selectedIndicator) {
            const selectedIndicatorData = indicatorsData?.find((indicatorOption) => indicatorOption.indicator === selectedIndicator);
            if (selectedIndicatorData) {
                return {
                    minMonth: `${selectedIndicatorData?.minYear}-${String(selectedIndicatorData?.minMonth).padStart(2, '0')}`,
                    maxMonth: `${selectedIndicatorData?.maxYear}-${String(selectedIndicatorData?.maxMonth).padStart(2, '0')}`,
                };
            }
        }
        return {
            minMonth: undefined,
            maxMonth: undefined,
        };
    }, [indicatorsData, selectedIndicator]);

    // Track previous indicator to detect changes
    const prevIndicatorRef = useRef<string>('');

    // Set initial date range when indicator changes
    useEffect(() => {
        if (hideIndicatorSelector) {
            if (useDateRangeSlider && !dateRange) {
                setDateRange({
                    from: getDateLastYearDate(),
                    to: getDateRangeMaxDate(),
                });
            }
            return;
        }

        if (selectedIndicator && minMonth && maxMonth) {
            const indicatorChanged = prevIndicatorRef.current !== selectedIndicator;
            prevIndicatorRef.current = selectedIndicator;

            if (!selectedMonthRange || indicatorChanged) {
                setSelectedMonthRange([minMonth, maxMonth]);
            } else {
                const [currentStart, currentEnd] = selectedMonthRange;
                if (currentStart < minMonth || currentEnd > maxMonth || currentStart > currentEnd) {
                    setSelectedMonthRange([minMonth, maxMonth]);
                }
            }
        }
    }, [selectedIndicator, minMonth, maxMonth, selectedMonthRange, hideIndicatorSelector, useDateRangeSlider, dateRange]);

    // Force ward mode when indicator is selected (not population)
    useEffect(() => {
        if (!isPopulationMode && selectedIndicator) {
            setSelectionMode('ward');
        }
    }, [isPopulationMode, selectedIndicator]);

    // Reset subcounty and ward when indicator changes
    useEffect(() => {
        setSelectedSubcounty('');
        setSelectedWard('');
    }, [selectedIndicator]);

    // Reset ward when subcounty changes
    useEffect(() => {
        setSelectedWard('');
    }, [selectedSubcounty]);

    // Set default month range when indicator is selected
    useEffect(() => {
        if (!selectedMonthRange && minMonth && maxMonth && selectedIndicator) {
            setSelectedMonthRange([minMonth, maxMonth]);
        }
    }, [minMonth, maxMonth, selectedIndicator, selectedMonthRange]);

    // Extract location options
    const availableSubcounties = useMemo(() => {
        if (!wardsData || Object.keys(wardsData).length === 0) return [];
        if (Object.keys(wardsData).length) {
            return Object.keys(wardsData).sort();
        }
        return Object.entries(wardsData).map(([key, value]) => value);
    }, [wardsData]);

    const availableWards = useMemo(() => {
        if (!wardsData || Object.keys(wardsData).length === 0) return [];
        if (selectedSubcounty && selectedSubcounty !== '') {
            const wards = Object.entries(wardsData).find(([key, value]) => key === selectedSubcounty)?.[1];
            return Array.isArray(wards) ? wards : [];
        }
        return Object.values(wardsData).flat();
    }, [wardsData, selectedSubcounty]);

    // Callbacks
    const handleSetSubcountyFilter = useCallback((subcounty: string) => {
        setSelectedSubcounty(subcounty);
    }, []);

    const handleSetWardFilter = useCallback((ward: string) => {
        setSelectedWard(ward);
    }, []);

    const handleResetFilters = useCallback(() => {
        setSelectedSubcounty('');
        setSelectedWard('');
        setSelectedIndicator('');
        setSelectedMonthRange(null);
        setShowTemperature(false);
        setShowFacilities(false);
        setShowPrecipitation(false);
    }, []);

    return {
        // Indicator
        selectedIndicator,
        setSelectedIndicator,
        isPopulationMode,

        // Date range
        selectedMonthRange,
        setSelectedMonthRange,
        dateRange,
        setDateRange,
        minMonth,
        maxMonth,

        // Animation
        isPlaying,
        setIsPlaying,
        isLooping,
        setIsLooping,
        speed,

        // Layer toggles
        showTemperature,
        setShowTemperature,
        showFacilities,
        setShowFacilities,
        showPrecipitation,
        setShowPrecipitation,

        // Sidebar
        isHealthIndicatorsOpen,
        setIsHealthIndicatorsOpen,

        // Location
        selectedSubcounty,
        setSelectedSubcounty,
        selectedWard,
        setSelectedWard,
        availableSubcounties,
        availableWards,
        handleSetSubcountyFilter,
        handleSetWardFilter,

        // Selection mode
        selectionMode,
        setSelectionMode,

        // Fullscreen
        isFullscreen,
        setIsFullscreen,

        // Actions
        handleResetFilters,
    };
}
