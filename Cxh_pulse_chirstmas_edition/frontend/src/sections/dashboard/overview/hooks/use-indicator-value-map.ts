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
            const wardName = record.rawWard || record.ward || '';
            if (!wardName) return;

            const normalizedWard = normalizeLocationName(wardName);
            const value = parseFloat(record.totalValue || 0) || 0;

            if (showAll) {
                map[normalizedWard] = (map[normalizedWard] || 0) + value;
            } else {
                map[normalizedWard] = value;
            }
        });
        return map;
    }, [filteredData, isPopulationMode, showAll]);
}

