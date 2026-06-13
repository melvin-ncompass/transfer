import { useMemo, useCallback } from 'react';
import { normalizeLocationName } from '../../../../utils/location-normalize';
import { buildValueMap, buildColorScale } from '../utils/value-map-utils';

type UseChoroplethLayersProps = {
    activePopulationData: any[];
    isIndicatorMode: boolean;
    indicatorValueMap?: Record<string, number>;
    indicatorColorScale?: { min: number; max: number; getColor: (value: number) => [number, number, number, number] } | null;
    selectionMode: 'subcounty' | 'ward';
    normalizeWardName: (name: string) => string;
    normalizeSubcountyName: (name: string) => string;
};

export function useChoroplethLayers({
    activePopulationData,
    isIndicatorMode,
    indicatorValueMap,
    indicatorColorScale,
    selectionMode,
    normalizeWardName,
    normalizeSubcountyName,
}: UseChoroplethLayersProps) {
    const valueMap = useMemo(() => {
        if (isIndicatorMode && indicatorValueMap) {
            return indicatorValueMap;
        }

        const map: Record<string, number> = {};
        activePopulationData.forEach((item: any) => {
            const locationName = selectionMode === 'ward' ? item.ward : (item.subCounty || item.subcounty || '');
            if (locationName) {
                const normalizedName = selectionMode === 'ward'
                    ? normalizeWardName(locationName)
                    : normalizeSubcountyName(locationName);
                const value = parseFloat(item.latestPopulation || 0) || 0;
                if (value > 0) {
                    map[normalizedName] = (map[normalizedName] || 0) + value;
                }
            }
        });
        return map;
    }, [isIndicatorMode, indicatorValueMap, activePopulationData, selectionMode, normalizeWardName, normalizeSubcountyName]);

    const colorScale = useMemo(() => {
        if (isIndicatorMode && indicatorColorScale) {
            return indicatorColorScale.getColor;
        }

        const values = Object.values(valueMap).filter(v => v > 0);
        if (values.length === 0) return null;

        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const scale = buildColorScale(valueMap, false);
        return scale?.getColor || null;
    }, [isIndicatorMode, indicatorColorScale, valueMap]);

    const colorScaleMinMax = useMemo(() => {
        const values = Object.values(valueMap).filter(v => v > 0);
        if (values.length === 0) return null;
        return {
            min: Math.min(...values),
            max: Math.max(...values),
        };
    }, [valueMap]);

    return {
        valueMap,
        colorScale,
        colorScaleMinMax,
    };
}

