import { rgbaToHex } from '../../../../utils/color-gradient';

type LayerStyleOptions = {
    valueMap: Record<string, number>;
    colorScale: ((value: number) => [number, number, number, number]) | null;
    normalizedName: string;
    isSelected: boolean;
    isInSelectedSubcounty: boolean;
    isKajiadoWard: boolean;
    hasSelection: boolean;
};

export function getLayerStyle({
    valueMap,
    colorScale,
    normalizedName,
    isSelected,
    isInSelectedSubcounty,
    isKajiadoWard,
    hasSelection,
}: LayerStyleOptions): L.PathOptions {
    const featureValue = valueMap?.[normalizedName] || 0;

    if (!hasSelection) {
        if (featureValue > 0 && colorScale) {
            const color = colorScale(featureValue);
            const hexColor = rgbaToHex(color);
            return {
                color: '#ffffff',
                weight: 1,
                opacity: 0.35,
                fillColor: hexColor,
                fillOpacity: color[3] / 255,
            };
        }
        return {
            color: '#999999',
            weight: 1,
            opacity: 0.5,
            fillColor: '#e0e0e0',
            fillOpacity: 0.4,
        };
    }

    if (isSelected) {
        if (featureValue > 0 && colorScale) {
            const color = colorScale(featureValue);
            const hexColor = rgbaToHex(color);
            return {
                color: '#ffc800',
                weight: 3,
                opacity: 1.0,
                fillColor: hexColor,
                fillOpacity: color[3] / 255,
            };
        }
        return {
            color: '#ffc800',
            weight: 3,
            opacity: 1.0,
            fillColor: '#e0e0e0',
            fillOpacity: 0.3,
        };
    }

    if (isInSelectedSubcounty) {
        if (featureValue > 0 && colorScale) {
            const color = colorScale(featureValue);
            const hexColor = rgbaToHex(color);
            return {
                color: '#0066cc',
                weight: 2,
                opacity: 0.8,
                fillColor: hexColor,
                fillOpacity: color[3] / 255,
            };
        }
        return {
            color: '#0066cc',
            weight: 2,
            opacity: 0.8,
            fillColor: '#e0e0e0',
            fillOpacity: 0.2,
        };
    }

    if (isKajiadoWard && !isSelected) {
        return {
            color: '#0066cc',
            weight: 2,
            opacity: 0.8,
            fillColor: '#e0e0e0',
            fillOpacity: 0.2,
        };
    }

    return {
        color: '#cccccc',
        weight: 1,
        opacity: 0.3,
        fillColor: '#e0e0e0',
        fillOpacity: 0.2,
    };
}

