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
    county?: string;
    wardsGeoJSON?: any;
    ward?: string;
};

export function useIndicatorData({
    selectedIndicator,
    isPopulationMode,
    dateRange,
    speed,
    isLooping,
    showAll,
    county,
    ward,
    wardsGeoJSON,
}: UseIndicatorDataProps) {
    // Fetch indicator data for date range (only if indicator is selected and not population)
    const indicatorApiParams = useMemo(() => {
        if (isPopulationMode || !selectedIndicator) return null;
        return {
            startYear: dateRange.from.getFullYear(),
            startMonth: dateRange.from.getMonth() + 1,
            endYear: dateRange.to.getFullYear(),
            endMonth: dateRange.to.getMonth() + 1,
            indicatorId: selectedIndicator,
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

    // Compute relevant ward IDs for the selected county
    const relevantWardIds = useMemo(() => {
        if (!county || !wardsGeoJSON?.features) return null;

        const ids = new Set<string>();
        wardsGeoJSON.features.forEach((feature: any) => {
            const props = feature?.properties || {};
            const subId = props.subCountyId || props.subcountyId || '';
            // Ensure comparison handles potential case differences if necessary, though IDs are usually consistent
            if (subId === county) {
                const wId = props.wardId || '';
                if (wId) ids.add(wId.toLowerCase());
            }
        });
        return ids.size > 0 ? ids : null;
    }, [county, wardsGeoJSON]);


    // Calculate indicator color scale
    const indicatorColorScale = useMemo(() => {
        if (isPopulationMode || Object.keys(indicatorValueMap).length === 0) return null;

        if (ward) {
            const val = indicatorValueMap[ward.toLowerCase()];
            if (val && val > 0) {
                return {
                    min: 1,
                    max: val,
                    getColor: createColorScale(1, val),
                };
            }
            return null;
        }

        let values: number[] = [];

        if (relevantWardIds) {
            // Filter values based on wards in the selected county
            values = Object.entries(indicatorValueMap)
                .filter(([key, val]) => relevantWardIds.has(key.toLowerCase()) && val > 0)
                .map(([, val]) => val);
        } else {
            // Use all values if no county is selected
            values = Object.values(indicatorValueMap).filter(v => v > 0);
        }

        if (values.length === 0) return null;

        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        return {
            min: minValue,
            max: maxValue,
            getColor: createColorScale(minValue, maxValue),
        };
    }, [indicatorValueMap, isPopulationMode, relevantWardIds, ward]);

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

