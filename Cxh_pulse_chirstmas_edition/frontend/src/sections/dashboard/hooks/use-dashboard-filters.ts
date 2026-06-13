import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useGetCopernicusTemperatureQuery, useGetDkhisIndicatorCountQuery, useGetDkhisIndicatorCountDateRangeQuery, useGetDkhsSubcountiesGeoJSONQuery } from '../../../api';
import { COUNTY_NAME, DATE_RANGE_MIN_YEAR, DATE_RANGE_MAX_YEAR, DATE_RANGE_MIN_MONTH, DATE_RANGE_MAX_MONTH, getDateRangeMaxDate, getDateLastYearDate } from '../../../store/constants';
import { POPULATION_INDICATOR_VALUE } from '../../../components/location-filters';
import { useIndicatorAnimation } from '../../../hooks/use-indicator-animation';
import { createColorScale } from '../../../utils/color-gradient';
import { normalizeLocationName } from '../../../utils/location-normalize';
import type { InsightsDataProps, TemperatureGeoJSON } from '../../../types/insights.types';

export type UseDashboardFiltersProps = {
    insightsData: InsightsDataProps;
    hideIndicatorSelector?: boolean;
    useDateRangeSlider?: boolean;
    dateRangeConfig?: {
        minYear?: number;
        maxYear?: number;
        minMonth?: number;
        maxMonth?: number;
    };
    enablePopulationOption?: boolean;
    enableAnimation?: boolean;
};

export function useDashboardFilters({
    insightsData,
    hideIndicatorSelector = false,
    useDateRangeSlider = false,
    dateRangeConfig,
    enablePopulationOption = false,
    enableAnimation = false,
}: UseDashboardFiltersProps) {
    const { wardsData, indicatorsData } = insightsData;

    // Selected indicator state
    const [selectedIndicator, setSelectedIndicator] = useState<string>('');
    const isPopulationMode = selectedIndicator === POPULATION_INDICATOR_VALUE;
    const prevIndicatorRef = useRef<string>('');

    // Date range state
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
    const [selectedMonthRange, setSelectedMonthRange] = useState<[string, string] | null>(null);

    // Location filter states
    const [selectedSubcounty, setSelectedSubcounty] = useState<string>('');
    const [selectedWard, setSelectedWard] = useState<string>('');
    const [selectionMode, setSelectionMode] = useState<'subcounty' | 'ward'>('ward');

    // Toggle states
    const [showTemperature, setShowTemperature] = useState<boolean>(false);
    const [showFacilities, setShowFacilities] = useState<boolean>(false);
    const [showPrecipitation, setShowPrecipitation] = useState<boolean>(false);

    // Auto-select first indicator when indicators data loads
    useEffect(() => {
        if (!hideIndicatorSelector && indicatorsData && indicatorsData.length > 0 && !selectedIndicator) {
            const sortedIndicators = [...indicatorsData].sort((a, b) =>
                (a.section || '').localeCompare(b.section || '')
            );
            setSelectedIndicator(sortedIndicators[0].indicator);
        }
    }, [indicatorsData, selectedIndicator, hideIndicatorSelector]);

    // Force ward mode when indicator is selected (not population)
    useEffect(() => {
        if (!isPopulationMode && selectedIndicator) {
            setSelectionMode('ward');
        }
    }, [isPopulationMode, selectedIndicator]);

    // Reset location when indicator changes
    useEffect(() => {
        setSelectedSubcounty('');
        setSelectedWard('');
    }, [selectedIndicator]);

    // Reset ward when subcounty changes
    useEffect(() => {
        setSelectedWard('');
    }, [selectedSubcounty]);

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

    // Set initial date range when indicator is selected
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

    // Set default month range when indicator is selected
    useEffect(() => {
        if (!selectedMonthRange && minMonth && maxMonth && selectedIndicator) {
            setSelectedMonthRange([minMonth, maxMonth]);
        }
    }, [minMonth, maxMonth, selectedIndicator, selectedMonthRange]);

    // Available locations
    const availableSubcounties = useMemo(() => {
        if (!wardsData || Object.keys(wardsData).length === 0) return [];
        // Always return string array of keys
        return Object.keys(wardsData).sort();
    }, [wardsData]);

    const availableWards = useMemo(() => {
        if (!wardsData || Object.keys(wardsData).length === 0) return [];
        if (selectedSubcounty && selectedSubcounty !== '') {
            const wards = Object.entries(wardsData).find(([key, value]) => key === selectedSubcounty)?.[1];
            return Array.isArray(wards) ? wards : [];
        }
        return Object.values(wardsData).flat();
    }, [wardsData, selectedSubcounty]);

    // Location update callbacks
    const handleSetSubcountyFilter = useCallback((subcounty: string) => {
        setSelectedSubcounty(subcounty);
    }, []);

    const handleSetWardFilter = useCallback((ward: string) => {
        setSelectedWard(ward);
    }, []);

    // Copernicus temperature params
    const copernicusTemperatureParams = useMemo(() => {
        let startYear: number;
        let startMonth: number;
        let endYear: number;
        let endMonth: number;

        if (useDateRangeSlider && dateRange) {
            startYear = dateRange.from.getFullYear();
            startMonth = dateRange.from.getMonth() + 1;
            endYear = dateRange.to.getFullYear();
            endMonth = dateRange.to.getMonth() + 1;
        } else if (selectedMonthRange && selectedMonthRange[0] && selectedMonthRange[1]) {
            [startYear, startMonth] = selectedMonthRange[0].split('-').map(Number);
            [endYear, endMonth] = selectedMonthRange[1].split('-').map(Number);
        } else {
            return null;
        }

        return {
            startYear,
            startMonth,
            endYear,
            endMonth,
            county: COUNTY_NAME,
            ...(selectedSubcounty && { subcounty: selectedSubcounty }),
            ...(selectedWard && { ward: selectedWard }),
        };
    }, [selectedMonthRange, selectedSubcounty, selectedWard, dateRange, useDateRangeSlider]);

    // Fetch Copernicus data
    const shouldFetchCopernicus = showTemperature || showPrecipitation;
    const { data: temperatureData, error: temperatureError, isLoading: _isLoadingTemperature } = useGetCopernicusTemperatureQuery(
        copernicusTemperatureParams!,
        {
            skip: !shouldFetchCopernicus || !copernicusTemperatureParams,
        }
    );

    const isLoadingTemperature = _isLoadingTemperature && showTemperature;
    const isLoadingPrecipitation = _isLoadingTemperature && showPrecipitation;

    // Indicator animation params
    const indicatorDateRangeParams = useMemo(() => {
        if (hideIndicatorSelector || !selectedIndicator || isPopulationMode || !enableAnimation) {
            return null;
        }

        let startYear: number;
        let startMonth: number;
        let endYear: number;
        let endMonth: number;

        if (useDateRangeSlider && dateRange) {
            startYear = dateRange.from.getFullYear();
            startMonth = dateRange.from.getMonth() + 1;
            endYear = dateRange.to.getFullYear();
            endMonth = dateRange.to.getMonth() + 1;
        } else if (selectedMonthRange) {
            const [start, end] = selectedMonthRange;
            [startYear, startMonth] = start.split('-').map(Number);
            [endYear, endMonth] = end.split('-').map(Number);
        } else {
            return null;
        }

        return {
            startYear,
            startMonth,
            endYear,
            endMonth,
            indicator: selectedIndicator,
        };
    }, [selectedIndicator, selectedMonthRange, dateRange, useDateRangeSlider, hideIndicatorSelector, isPopulationMode, enableAnimation]);

    const { data: indicatorDataForAnimation = [], isLoading: isLoadingIndicatorAnimation } = useGetDkhisIndicatorCountDateRangeQuery(
        indicatorDateRangeParams!,
        { skip: !indicatorDateRangeParams }
    );

    // Animation hook
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLooping, setIsLooping] = useState(true);
    const [speed] = useState<number>(1);

    const {
        frameIdx,
        setFrameIdx,
        playing,
        setPlaying,
        frames,
        frameDates,
        currentFrame,
        currentFrameDate,
        filteredData: filteredIndicatorData,
    } = useIndicatorAnimation({
        indicatorData: indicatorDataForAnimation,
        dateRange,
        speed,
        isLooping,
        enabled: enableAnimation && !isPopulationMode && !!selectedIndicator,
    });

    useEffect(() => {
        setIsPlaying(playing);
    }, [playing]);

    // Choropleth params
    const choroplethParams = useMemo(() => {
        if (hideIndicatorSelector || !selectedIndicator || isPopulationMode) {
            return null;
        }

        let startYear: number;
        let startMonth: number;
        let endYear: number;
        let endMonth: number;

        if (enableAnimation && currentFrameDate) {
            startYear = currentFrameDate.getFullYear();
            startMonth = currentFrameDate.getMonth() + 1;
            endYear = currentFrameDate.getFullYear();
            endMonth = currentFrameDate.getMonth() + 1;
        } else if (useDateRangeSlider && dateRange) {
            startYear = dateRange.from.getFullYear();
            startMonth = dateRange.from.getMonth() + 1;
            endYear = dateRange.to.getFullYear();
            endMonth = dateRange.to.getMonth() + 1;
        } else if (selectedMonthRange) {
            const [start, end] = selectedMonthRange;
            [startYear, startMonth] = start.split('-').map(Number);
            [endYear, endMonth] = end.split('-').map(Number);
        } else {
            return null;
        }

        return {
            startYear,
            startMonth,
            endYear,
            endMonth,
            indicators: selectedIndicator,
            county: COUNTY_NAME,
        };
    }, [selectedIndicator, selectedMonthRange, dateRange, useDateRangeSlider, hideIndicatorSelector, isPopulationMode, enableAnimation, currentFrameDate]);

    const { data: choroplethResponse, isLoading: isLoadingChoropleth } = useGetDkhisIndicatorCountQuery(
        choroplethParams!,
        {
            skip: !choroplethParams,
        }
    );

    // Choropleth data processing
    const choroplethData = useMemo(() => {
        if (!choroplethResponse || !choroplethResponse.features) {
            return [];
        }

        let features = choroplethResponse.features || [];

        if (enableAnimation && !isPopulationMode && currentFrameDate) {
            const currentYear = currentFrameDate.getFullYear();
            const currentMonth = currentFrameDate.getMonth() + 1;

            features = features.filter((feature: any) => {
                const props = feature?.properties || {};
                const period = props.period || '';
                if (period) {
                    const [year, month] = period.split('-').map(Number);
                    return year === currentYear && month === currentMonth;
                }
                return true;
            });
        }

        return features;
    }, [choroplethResponse, enableAnimation, isPopulationMode, currentFrameDate]);

    const originalChoroplethData = useMemo(() => {
        if (!Array.isArray(choroplethData) || choroplethData.length === 0) {
            return [];
        }
        return choroplethData;
    }, [choroplethData]);

    const filteredChoroplethData = useMemo(() => {
        if (!Array.isArray(originalChoroplethData) || originalChoroplethData.length === 0) {
            return [];
        }

        let filtered = [...originalChoroplethData];

        if (selectedSubcounty) {
            filtered = filtered.filter((feature: any) => {
                const featureSubcounty = feature.properties?.subCounty || feature.properties?.subcounty || '';
                return normalizeLocationName(featureSubcounty) === normalizeLocationName(selectedSubcounty);
            });
        }
        if (selectedWard) {
            filtered = filtered.filter((feature: any) => {
                const featureWard = feature.properties?.ward || '';
                return normalizeLocationName(featureWard) === normalizeLocationName(selectedWard);
            });
        }

        return filtered;
    }, [originalChoroplethData, selectedSubcounty, selectedWard]);

    // Indicator value map for animation
    const indicatorValueMap = useMemo(() => {
        if (isPopulationMode || !enableAnimation || !filteredIndicatorData || filteredIndicatorData.length === 0) {
            return {};
        }

        const map: Record<string, number> = {};
        filteredIndicatorData.forEach((r: any) => {
            if (r.rawWard && r.totalValue !== undefined) {
                const wardName = normalizeLocationName(r.rawWard);
                map[wardName] = parseFloat(r.totalValue) || 0;
            }
        });
        return map;
    }, [filteredIndicatorData, isPopulationMode, enableAnimation]);

    // Indicator color scale for animation
    const indicatorColorScale = useMemo(() => {
        if (isPopulationMode || !enableAnimation || Object.keys(indicatorValueMap).length === 0) {
            return null;
        }

        const values = Object.values(indicatorValueMap).filter(v => v > 0);
        if (values.length === 0) return null;

        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        return {
            min: minValue,
            max: maxValue,
            getColor: createColorScale(minValue, maxValue),
        };
    }, [indicatorValueMap, isPopulationMode, enableAnimation]);

    // Fetch subcounty GeoJSON for population mode
    const { data: subcountiesGeoJSON, isLoading: isLoadingSubcountiesGeoJSON } = useGetDkhsSubcountiesGeoJSONQuery(
        {
            startYear: dateRange?.from?.getFullYear() ?? getDateLastYearDate().getFullYear(),
            startMonth: dateRange?.from?.getMonth() ? dateRange.from.getMonth() + 1 : (getDateLastYearDate().getMonth() + 1),
            endYear: dateRange?.to?.getFullYear() ?? getDateRangeMaxDate().getFullYear(),
            endMonth: dateRange?.to?.getMonth() ? dateRange.to.getMonth() + 1 : (getDateRangeMaxDate().getMonth() + 1),
            ...(selectedSubcounty && { subcounty: selectedSubcounty }),
        },
        { skip: !isPopulationMode || !dateRange || !enablePopulationOption }
    );

    // Reset filters function
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
        // State
        selectedIndicator,
        setSelectedIndicator,
        isPopulationMode,
        dateRange,
        setDateRange,
        selectedMonthRange,
        setSelectedMonthRange,
        selectedSubcounty,
        setSelectedSubcounty,
        selectedWard,
        setSelectedWard,
        selectionMode,
        setSelectionMode,
        showTemperature,
        setShowTemperature,
        showFacilities,
        setShowFacilities,
        showPrecipitation,
        setShowPrecipitation,
        // Computed
        minMonth,
        maxMonth,
        availableSubcounties,
        availableWards,
        // Data
        temperatureData: temperatureData as TemperatureGeoJSON | undefined,
        isLoadingTemperature,
        isLoadingPrecipitation,
        temperatureError,
        isLoadingChoropleth,
        choroplethData,
        originalChoroplethData,
        filteredChoroplethData,
        // Animation
        isPlaying,
        setIsPlaying,
        isLooping,
        setIsLooping,
        playing,
        setPlaying,
        frames,
        frameDates,
        currentFrame,
        currentFrameDate,
        filteredIndicatorData,
        indicatorValueMap,
        indicatorColorScale,
        frameIdx,
        setFrameIdx,
        // Population mode
        subcountiesGeoJSON,
        isLoadingSubcountiesGeoJSON,
        // Callbacks
        handleSetSubcountyFilter,
        handleSetWardFilter,
        handleResetFilters,
    };
}

