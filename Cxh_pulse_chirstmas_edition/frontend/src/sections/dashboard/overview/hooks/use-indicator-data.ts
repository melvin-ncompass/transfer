import { useMemo } from 'react';
import { useGetDkhisIndicatorCountDateRangeQuery } from '../../../../api';
import { useIndicatorAnimation } from '../../../../hooks/use-indicator-animation';
import { useIndicatorValueMap } from './use-indicator-value-map';
import { createColorScale } from '../../../../utils/color-gradient';

type UseIndicatorDataProps = {
    selectedIndicator: string;
    isPopulationMode: boolean;
    dateRange: { from: Date; to: Date };
    speed: number;
    isLooping: boolean;
    showAll: boolean;
};

export function useIndicatorData({
    selectedIndicator,
    isPopulationMode,
    dateRange,
    speed,
    isLooping,
    showAll,
}: UseIndicatorDataProps) {
    // Fetch indicator data for date range (only if indicator is selected and not population)
    const indicatorApiParams = useMemo(() => {
        if (isPopulationMode || !selectedIndicator) return null;
        return {
            startYear: dateRange.from.getFullYear(),
            startMonth: dateRange.from.getMonth() + 1,
            endYear: dateRange.to.getFullYear(),
            endMonth: dateRange.to.getMonth() + 1,
            indicator: selectedIndicator,
        };
    }, [selectedIndicator, dateRange, isPopulationMode]);

    const {
        data: indicatorData = [],
        isLoading: isLoadingIndicator,
        isFetching: isFetchingIndicator,
    } = useGetDkhisIndicatorCountDateRangeQuery(
        indicatorApiParams!,
        { skip: !indicatorApiParams }
    );

    // Use animation hook for indicator data
    const {
        setFrameIdx,
        playing,
        setPlaying,
        frames,
        frameDates,
        currentFrameDate,
        filteredData,
    } = useIndicatorAnimation({
        indicatorData,
        dateRange,
        speed,
        isLooping,
        showAll,
        enabled: !isPopulationMode && !!selectedIndicator,
    });

    const indicatorValueMap = useIndicatorValueMap({
        filteredData,
        isPopulationMode,
        showAll,
    });

    // Calculate indicator color scale
    const indicatorColorScale = useMemo(() => {
        if (isPopulationMode || Object.keys(indicatorValueMap).length === 0) return null;

        const values = Object.values(indicatorValueMap).filter(v => v > 0);
        if (values.length === 0) return null;

        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        return {
            min: minValue,
            max: maxValue,
            getColor: createColorScale(minValue, maxValue),
        };
    }, [indicatorValueMap, isPopulationMode]);

    return {
        indicatorData,
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
    };
}

