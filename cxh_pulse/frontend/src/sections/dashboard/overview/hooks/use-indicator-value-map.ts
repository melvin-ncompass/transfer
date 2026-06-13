import { useMemo } from 'react';
import { normalizeLocationName } from '../../../../utils/location-normalize';
import { POPULATION_INDICATOR_VALUE } from '../../../../components/location-filters/indicator-select';

type UseIndicatorValueMapProps = {
    filteredData: any[];
    isPopulationMode: boolean;
    showAll: boolean;
};

export function useIndicatorValueMap({
    filteredData,
    isPopulationMode,
    showAll,
}: UseIndicatorValueMapProps) {
    return useMemo(() => {
        if (isPopulationMode) return {};

        const map: Record<string, number> = {};
        filteredData.forEach((record: any) => {
            const wardId =  record.wardId || '';
            if (!wardId) return;

            const normalizedWardId = normalizeLocationName(wardId);
            const value = parseFloat(record.totalValue || 0) || 0;

            if (showAll) {
                map[normalizedWardId] = (map[normalizedWardId] || 0) + value;
            } else {
                map[normalizedWardId] = value;
            }
        });
        return map;
    }, [filteredData, isPopulationMode, showAll]);
}

