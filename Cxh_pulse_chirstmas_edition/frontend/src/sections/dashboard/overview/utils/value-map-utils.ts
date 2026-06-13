import { createColorScale } from '../../../../utils/color-gradient';
import { normalizeLocationName } from '../../../../utils/location-normalize';

export function buildValueMap(
    populationData: any[],
    isIndicatorMode: boolean,
    indicatorValueMap?: Record<string, number>
): Record<string, number> {
    if (isIndicatorMode && indicatorValueMap) {
        return indicatorValueMap;
    }

    const map: Record<string, number> = {};
    populationData.forEach((record: any) => {
        const locationName = record.ward || record.subcounty || record.subCounty || '';
        if (locationName) {
            const normalizedName = normalizeLocationName(locationName);
            const value = parseFloat(record.totalValue || record.population || '0') || 0;
            map[normalizedName] = value;
        }
    });
    return map;
}

export function buildColorScale(
    valueMap: Record<string, number>,
    isIndicatorMode: boolean,
    indicatorColorScale?: { min: number; max: number; getColor: (value: number) => [number, number, number, number] } | null
): { min: number; max: number; getColor: (value: number) => [number, number, number, number] } | null {
    if (isIndicatorMode && indicatorColorScale) {
        return indicatorColorScale;
    }

    const values = Object.values(valueMap).filter(v => v > 0);
    if (values.length === 0) return null;

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    return {
        min: minValue,
        max: maxValue,
        getColor: createColorScale(minValue, maxValue),
    };
}

