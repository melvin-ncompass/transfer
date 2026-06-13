import { useEffect, useMemo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
    useGetWardPopulationDataQuery,
    useGetSubcountyPopulationDataQuery,
} from '../../../../api';
import { normalizeLocationName } from '../../../../utils/location-normalize';
import { toTitleCase } from '../../../../utils/format-text';
import { getCentroid, getBoundingBoxWidth } from '../utils/geometry-calculations';
import { useChoroplethLayers } from "../hooks/use-choropleth-layers";
import { getLayerStyle } from '../utils/layer-styling';

type ChoroplethMapLayersProps = {
    wardsGeoJSON?: GeoJSON.FeatureCollection;
    subcountiesGeoJSON?: GeoJSON.FeatureCollection;
    selectedWard?: string;
    selectedCounty?: string;
    selectionMode?: 'subcounty' | 'ward';
    dateRange?: { from: Date; to: Date };
    onValueMapChange?: (valueMap: Record<string, number>) => void;
    onColorScaleChange?: (colorScale: { min: number; max: number; getColor: (value: number) => [number, number, number, number] } | null) => void;
    isLoadingSelection?: boolean;
    setIsLoadingSelection?: (isLoading: boolean) => void;
    indicatorData?: any[];
    indicatorValueMap?: Record<string, number>;
    indicatorColorScale?: { min: number; max: number; getColor: (value: number) => [number, number, number, number] } | null;
};

export function ChoroplethMapLayers({
    wardsGeoJSON,
    subcountiesGeoJSON,
    selectedWard,
    selectedCounty,
    selectionMode = 'ward',
    dateRange,
    onValueMapChange,
    onColorScaleChange,
    isLoadingSelection = false,
    setIsLoadingSelection,
    indicatorData,
    indicatorValueMap,
    indicatorColorScale,
}: ChoroplethMapLayersProps) {
    const map = useMap();
    const normalizeWardName = normalizeLocationName;

    const isIndicatorMode = !!indicatorData || !!indicatorValueMap;

    const { data: wardPopulationData = [] } = useGetWardPopulationDataQuery(
        {
            startYear: dateRange?.from?.getFullYear(),
            startMonth: dateRange?.from?.getMonth() ? dateRange.from.getMonth() + 1 : undefined,
            endYear: dateRange?.to?.getFullYear(),
            endMonth: dateRange?.to?.getMonth() ? dateRange.to.getMonth() + 1 : undefined,
            ...(selectedWard && { ward: selectedWard }),
        },
        { skip: isIndicatorMode || selectionMode !== 'ward' || !dateRange, refetchOnMountOrArgChange: true }
    );

    const { data: subcountyPopulationData = [] } = useGetSubcountyPopulationDataQuery(
        {
            startYear: dateRange?.from?.getFullYear(),
            startMonth: dateRange?.from?.getMonth() ? dateRange.from.getMonth() + 1 : undefined,
            endYear: dateRange?.to?.getFullYear(),
            endMonth: dateRange?.to?.getMonth() ? dateRange.to.getMonth() + 1 : undefined,
            ...(selectedCounty && { subcounty: selectedCounty }),
        },
        { skip: isIndicatorMode || selectionMode !== 'subcounty' || !dateRange, refetchOnMountOrArgChange: true }
    );

    const activeGeoJSON = selectionMode === 'ward' ? wardsGeoJSON : subcountiesGeoJSON;
    const activePopulationData = selectionMode === 'ward' ? wardPopulationData : subcountyPopulationData;

    const normalizeDisplayName = useCallback((name: string): string => {
        if (!name) return '';
        return name
            .trim()
            .toLowerCase()
            .replace(/\s+ward$/i, '')
            .replace(/ward$/i, '')
            .replace(/\s+subcounty$/i, '')
            .replace(/subcounty$/i, '')
            .replace(/\s+sub\s+county$/i, '')
            .replace(/-/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }, []);

    const normalizeCountyName = useCallback((name: string): string => {
        if (!name) return '';
        return name.trim().toLowerCase().replace(/\s+/g, '');
    }, []);

    const normalizeSubcountyName = useCallback((name: string): string => {
        if (!name) return '';
        return name.trim().toLowerCase().replace(/\s+/g, '');
    }, []);

    const selectedSubcountyWards = useMemo(() => {
        if (!selectedCounty || !wardsGeoJSON?.features) return new Set<string>();
        const normalizedSelectedSubcounty = normalizeSubcountyName(selectedCounty);
        const wards = new Set<string>();
        wardsGeoJSON.features.forEach((feature: any) => {
            const props = feature?.properties || {};
            const featureSubcounty = props.subCounty || props.subcounty || '';
            if (normalizeSubcountyName(featureSubcounty) === normalizedSelectedSubcounty) {
                const featureWard = props.ward || props.Ward || '';
                if (featureWard) {
                    wards.add(normalizeWardName(featureWard));
                }
            }
        });
        return wards;
    }, [selectedCounty, wardsGeoJSON, normalizeWardName, normalizeSubcountyName]);

    const selectedWardCounty = useMemo(() => {
        if (!selectedWard || !wardsGeoJSON?.features) return null;
        const normalizedSelectedWard = normalizeWardName(selectedWard);
        const selectedFeature = wardsGeoJSON.features.find((feature: any) => {
            const props = feature?.properties || {};
            const featureWard = props.ward || props.Ward || '';
            return normalizeWardName(featureWard) === normalizedSelectedWard;
        });
        if (selectedFeature) {
            const props = selectedFeature.properties || {};
            return props.county || props.County || props.COUNTY || null;
        }
        return null;
    }, [selectedWard, wardsGeoJSON, normalizeWardName]);

    const { valueMap, colorScale, colorScaleMinMax } = useChoroplethLayers({
        activePopulationData,
        isIndicatorMode,
        indicatorValueMap,
        indicatorColorScale,
        selectionMode,
        normalizeWardName,
        normalizeSubcountyName,
    });

    // For updating the value map
    useEffect(() => {
        if (onValueMapChange) {
            onValueMapChange(valueMap);
        }
    }, [valueMap, onValueMapChange]);

    // For updating the color scale
    useEffect(() => {
        if (onColorScaleChange) {
            if (colorScale && colorScaleMinMax) {
                onColorScaleChange({
                    min: colorScaleMinMax.min,
                    max: colorScaleMinMax.max,
                    getColor: colorScale as (value: number) => [number, number, number, number],
                });
            } else {
                onColorScaleChange(null);
            }
        }
    }, [colorScale, colorScaleMinMax, onColorScaleChange]);

    // For displaying the choropleth map layers
    useEffect(() => {
        if (!activeGeoJSON?.features || !colorScale) return () => {};

        const labelMarkers: Array<{ marker: L.Marker; feature: any }> = [];
        const layerMap = new Map<string, L.Layer>();

        // For removing the existing layers
        try {
            map.eachLayer((layer: any) => {
                if (!(layer instanceof L.TileLayer)) {
                    try {
                        map.removeLayer(layer);
                    } catch (e) {
                        /* ignore cleanup error */
                    }
                }
            });
        } catch (e) {
            /* ignore cleanup error */
        }

        const geoJsonLayer = L.geoJSON(activeGeoJSON as any, {
            style: (feature: any) => {
                const props = feature?.properties || {};
                const featureWard = props.ward || '';
                const featureSubcounty = props.subCounty || '';
                const featureCounty = props.county || '';

                const featureName = selectionMode === 'ward' ? featureWard : featureSubcounty;
                const normalizedName = selectionMode === 'ward'
                    ? normalizeWardName(featureName)
                    : normalizeSubcountyName(featureName);

                const isSelected = Boolean(
                    (selectionMode === 'ward' && selectedWard && normalizeWardName(selectedWard) === normalizedName) ||
                    (selectionMode === 'subcounty' && selectedCounty && normalizeSubcountyName(selectedCounty) === normalizedName)
                );

                const isInSelectedSubcounty = Boolean(
                    selectedCounty &&
                    !selectedWard &&
                    selectionMode === 'ward' &&
                    selectedSubcountyWards.has(normalizedName)
                );

                const isKajiadoWard = selectedWardCounty &&
                    normalizeCountyName(featureCounty) === 'kajiado' &&
                    normalizeCountyName(selectedWardCounty) === 'kajiado';

                return getLayerStyle({
                    valueMap,
                    colorScale,
                    normalizedName,
                    isSelected,
                    isInSelectedSubcounty,
                    isKajiadoWard,
                    hasSelection: !!(selectedCounty || selectedWard),
                });
            },
            onEachFeature: (feature, layer) => {
                const props = feature?.properties || {};
                const featureWard = props.ward || '';
                const featureSubcounty = props.subCounty || '';

                const featureName = selectionMode === 'ward' ? featureWard : featureSubcounty;
                const normalizedName = selectionMode === 'ward'
                    ? normalizeWardName(featureName)
                    : normalizeSubcountyName(featureName);

                layerMap.set(normalizedName, layer);

                if (feature.geometry) {
                    const centroid = getCentroid(feature.geometry);
                    if (centroid) {
                        const [lat, lng] = centroid;
                        const boundingWidth = getBoundingBoxWidth(feature.geometry, map);
                        const baseFontSize = Math.max(12, Math.min(18, Math.floor(boundingWidth / 12)));
                        const labelText = selectionMode === 'subcounty'
                            ? (featureSubcounty || featureWard)
                            : (featureWard || featureSubcounty);
                        const normalizedDisplayName = normalizeDisplayName(labelText);
                        const displayName = toTitleCase(normalizedDisplayName);
                        const populationValue = valueMap?.[normalizedName] || 0;
                        const populationText = populationValue > 0 ? populationValue.toLocaleString() : '';

                        const labelIcon = L.divIcon({
                            className: 'ward-label',
                            html: `<div style="
                                color: #000000;
                                font-size: ${baseFontSize}px;
                                font-weight: 600;
                                white-space: nowrap;
                                pointer-events: none;
                                user-select: none;
                                text-align: center;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.8);
                            ">
                                <div>${displayName}</div>
                                ${populationText ? `<div style="font-size: ${Math.max(10, baseFontSize - 2)}px; color: #666666; margin-top: 2px; font-weight: 500;">${populationText}</div>` : ''}
                            </div>`,
                            iconSize: [0, 0],
                            iconAnchor: [0, 0],
                        });

                        const labelMarker = L.marker([lat, lng], {
                            icon: labelIcon,
                            interactive: false,
                            zIndexOffset: -1000,
                        });

                        labelMarkers.push({ marker: labelMarker, feature });
                    }
                }
            },
        });

        geoJsonLayer.addTo(map);

        const updateLabels = () => {
            const currentZoom = map.getZoom();
            const minZoomForLabels = selectionMode === 'ward' ? 8.5 : 8;
            const MANUAL_OFFSETS: Record<string, { x: number; y: number }> = {
                'Entonet/Lenkism': { x: -30, y: 10 },
                'Imbrikani/Eselelnkei': { x: 30, y: -10 },
                'Dalalekutuk': { x: -25, y: 5 },
                'Imaroro': { x: 25, y: -5 },
                'Olkeri': { x: 25, y: -5 },
            };

            const visibleLabels: Array<{
                marker: L.Marker;
                feature: any;
                centroid: [number, number];
                labelText: string;
                normalizedName: string;
                isSelected: boolean;
                boundingWidth: number;
                baseFontSize: number;
                displayName: string;
                populationText: string;
                estimatedLabelWidth: number;
                estimatedLabelHeight: number;
                minDistance: number;
            }> = [];

            labelMarkers.forEach((item) => {
                const { marker, feature } = item;
                if (!feature || !feature.geometry) return;

                const props = feature?.properties || {};
                const featureWard = props.ward || '';
                const featureSubcounty = props.subCounty || '';
                const featureName = selectionMode === 'ward' ? featureWard : featureSubcounty;
                const normalizedNameForUpdate = selectionMode === 'ward'
                    ? normalizeWardName(featureName)
                    : normalizeSubcountyName(featureName);

                const isSelectedForUpdate = Boolean(
                    (selectionMode === 'ward' && selectedWard && normalizeWardName(selectedWard) === normalizedNameForUpdate) ||
                    (selectionMode === 'subcounty' && selectedCounty && normalizeSubcountyName(selectedCounty) === normalizedNameForUpdate)
                );

                const labelText = selectionMode === 'subcounty'
                    ? (featureSubcounty || featureWard)
                    : (featureWard || featureSubcounty);

                const boundingWidth = getBoundingBoxWidth(feature.geometry, map);

                const shouldShow = labelText && (
                    isSelectedForUpdate ||
                    (currentZoom >= minZoomForLabels && boundingWidth >= 20) ||
                    (boundingWidth >= 50)
                );

                if (!shouldShow) {
                    try {
                        if (map.hasLayer(marker)) {
                            map.removeLayer(marker);
                        }
                    } catch (e) {
                        /* ignore layer removal error */
                    }
                    return;
                }

                const centroid = getCentroid(feature.geometry);
                if (!centroid) return;

                const baseFontSize = Math.max(12, Math.min(18, Math.floor(boundingWidth / 12)));
                const normalizedDisplayName = normalizeDisplayName(labelText);
                const displayName = toTitleCase(normalizedDisplayName);
                const populationValue = valueMap?.[normalizedNameForUpdate] || 0;
                const populationText = populationValue > 0 ? populationValue.toLocaleString() : '';

                const estimatedLabelWidth = displayName.length * baseFontSize * 0.6 + 20;
                const estimatedLabelHeight = baseFontSize + (populationText ? baseFontSize - 2 + 4 : 0) + 10;
                const minDistance = Math.max(estimatedLabelWidth, estimatedLabelHeight) * 0.15;

                visibleLabels.push({
                    marker,
                    feature,
                    centroid,
                    labelText,
                    normalizedName: normalizedNameForUpdate,
                    isSelected: isSelectedForUpdate,
                    boundingWidth,
                    baseFontSize,
                    displayName,
                    populationText,
                    estimatedLabelWidth,
                    estimatedLabelHeight,
                    minDistance,
                });
            });

            const placedLabels: Array<{ point: L.Point; minDistance: number; displayName: string }> = [];

            visibleLabels.sort((a, b) => {
                if (a.isSelected !== b.isSelected) return a.isSelected ? -1 : 1;
                return b.boundingWidth - a.boundingWidth;
            });

            visibleLabels.forEach((item) => {
                const { marker, centroid, isSelected, baseFontSize, displayName, populationText, minDistance } = item;
                const [lat, lng] = centroid;

                let adjustedLat = lat;
                let adjustedLng = lng;
                let labelPoint = map.latLngToContainerPoint([lat, lng]);

                if (MANUAL_OFFSETS[displayName]) {
                    const offset = MANUAL_OFFSETS[displayName];
                    const offsetPoint = new L.Point(labelPoint.x + offset.x, labelPoint.y + offset.y);
                    const offsetLatLng = map.containerPointToLatLng(offsetPoint);
                    adjustedLat = offsetLatLng.lat;
                    adjustedLng = offsetLatLng.lng;
                    labelPoint = map.latLngToContainerPoint([adjustedLat, adjustedLng]);
                }

                let hasCollision = false;

                if (!isSelected) {
                    for (const placed of placedLabels) {
                        const distance = Math.sqrt(
                            Math.pow(labelPoint.x - placed.point.x, 2) +
                            Math.pow(labelPoint.y - placed.point.y, 2)
                        );
                        if (distance < minDistance) {
                            hasCollision = true;
                            break;
                        }
                    }
                }

                if (!hasCollision) {
                    if (!map.hasLayer(marker)) {
                        marker.addTo(map);
                    }

                    if (adjustedLat !== lat || adjustedLng !== lng) {
                        marker.setLatLng([adjustedLat, adjustedLng]);
                    }

                    const labelIcon = L.divIcon({
                        className: 'ward-label',
                        html: `<div style="
                            color: #000000;
                            font-size: ${baseFontSize}px;
                            font-weight: 600;
                            white-space: nowrap;
                            pointer-events: none;
                            user-select: none;
                            text-align: center;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.8);
                        ">
                            <div>${displayName}</div>
                            ${populationText ? `<div style="font-size: ${Math.max(10, baseFontSize - 2)}px; color: #666666; margin-top: 2px; font-weight: 500;">${populationText}</div>` : ''}
                        </div>`,
                        iconSize: [0, 0],
                        iconAnchor: [0, 0],
                    });
                    marker.setIcon(labelIcon);
                    placedLabels.push({ point: labelPoint, minDistance, displayName });
                } else {
                    try {
                        if (map.hasLayer(marker)) {
                            map.removeLayer(marker);
                        }
                    } catch (e) {
                        /* ignore marker removal error */
                    }
                }
            });
        };

        map.on('zoomend', updateLabels);
        map.on('moveend', updateLabels);
        updateLabels();

        return () => {
            try {
                map.off('zoomend', updateLabels);
                map.off('moveend', updateLabels);
                labelMarkers.forEach(({ marker }) => {
                    try {
                        map.removeLayer(marker);
                    } catch (e) {
                        /* ignore marker removal error */
                    }
                });
                map.removeLayer(geoJsonLayer);
            } catch (e) {
                /* ignore cleanup error */
            }
        };
    }, [activeGeoJSON, valueMap, colorScale, map, selectedWard, selectedCounty, selectedWardCounty, selectedSubcountyWards, selectionMode, normalizeSubcountyName, normalizeWardName, normalizeDisplayName, normalizeCountyName, isLoadingSelection]);

    // For zooming to the selected ward or subcounty
    useEffect(() => {
        if (!wardsGeoJSON?.features) return;

        if (selectedWard) {
            const normalizedSelectedWard = normalizeWardName(selectedWard);
            const selectedFeature = wardsGeoJSON.features.find((feature: any) => {
                const props = feature?.properties || {};
                const featureWard = props.ward || '';
                return normalizeWardName(featureWard) === normalizedSelectedWard;
            });

            if (selectedFeature && selectedFeature.geometry) {
                try {
                    const geoJsonFeature = L.geoJSON(selectedFeature as any);
                    const bounds = geoJsonFeature.getBounds();
                    if (bounds && bounds.isValid()) {
                        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                    }
                } catch (e) {
                    /* ignore zoom error */
                }
            }
        } else if (selectedCounty) {
            const geoJSONToUse = selectionMode === 'subcounty' ? subcountiesGeoJSON : wardsGeoJSON;
            if (geoJSONToUse?.features) {
                const normalizedSubcounty = normalizeSubcountyName(selectedCounty);
                const subcountyFeatures = geoJSONToUse.features.filter((feature: any) => {
                    const props = feature?.properties || {};
                    const featureSubcounty = props.subCounty || '';
                    return normalizeSubcountyName(featureSubcounty) === normalizedSubcounty;
                });

                if (subcountyFeatures.length > 0) {
                    try {
                        const subcountyLayer = L.geoJSON(subcountyFeatures as any);
                        const bounds = subcountyLayer.getBounds();
                        if (bounds && bounds.isValid()) {
                            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
                        }
                    } catch (e) {
                        /* ignore zoom error */
                    }
                }
            }
        } else {
            try {
                const geoJSONToUse = selectionMode === 'ward' ? wardsGeoJSON : subcountiesGeoJSON;
                if (geoJSONToUse?.features && geoJSONToUse.features.length > 0) {
                    const allFeaturesLayer = L.geoJSON(geoJSONToUse as any);
                    const bounds = allFeaturesLayer.getBounds();
                    if (bounds && bounds.isValid()) {
                        map.fitBounds(bounds, { maxZoom: 8.4 });
                    }
                } else {
                    map.setView([-2.09, 37.14], 8.4);
                }
            } catch (e) {
                /* ignore zoom error */
            }
        }
    }, [selectedWard, selectedCounty, wardsGeoJSON, subcountiesGeoJSON, selectionMode, map, normalizeWardName, normalizeSubcountyName]);

    return null;
}
