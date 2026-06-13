import { useEffect, useMemo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
    useGetWardPopulationDataQuery,
    useGetSubcountyPopulationDataQuery,
} from '../../../../api';
import { toTitleCase } from '../../../../utils/format-text';
import { getCentroid, getBoundingBoxWidth } from '../utils/geometry-calculations';
import { useChoroplethLayers } from "../hooks/use-choropleth-layers";
import { getLayerStyle } from '../utils/layer-styling';

type ChoroplethMapLayersProps = {
    wardsGeoJSON?: GeoJSON.FeatureCollection;
    subcountiesGeoJSON?: GeoJSON.FeatureCollection;
    facilityData?: GeoJSON.FeatureCollection;
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
    onFeatureClick?: (params: { wardId?: string; subcountyId?: string }) => void;
};

export function ChoroplethMapLayers({
    wardsGeoJSON,
    subcountiesGeoJSON,
    facilityData,
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
    onFeatureClick,
}: ChoroplethMapLayersProps) {
    const map = useMap();

    //new normalization functions
    const normalizeSubcountyName = useCallback((name: string): string => {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/\s*sub\s*county$/i, '')
            .replace(/\s+/g, '')
            .trim();
    }, []);

    const normalizeWardName = useCallback((name: string): string => {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/\s*ward$/i, '')
            .replace(/\s+/g, '')
            .trim();
    }, []);


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

    // In subcounty mode, don't filter by selectedCounty to get data for all subcounties
    // This allows all subcounties to be visible and styled properly
    const { data: subcountyPopulationData = [] } = useGetSubcountyPopulationDataQuery(
        {
            startYear: dateRange?.from?.getFullYear(),
            startMonth: dateRange?.from?.getMonth() ? dateRange.from.getMonth() + 1 : undefined,
            endYear: dateRange?.to?.getFullYear(),
            endMonth: dateRange?.to?.getMonth() ? dateRange.to.getMonth() + 1 : undefined,
            // Don't filter by subcounty in subcounty mode - we want all subcounties visible
            // Only filter when we need specific data (not needed for display)
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

    const selectedSubcountyWards = useMemo(() => {
        if (!selectedCounty || !wardsGeoJSON?.features) return new Set<string>();
        const wards = new Set<string>();

        wardsGeoJSON.features.forEach((feature: any) => {
            const props = feature?.properties || {};
            const featureSubcounty = props.subCountyId || '';
            if (featureSubcounty === selectedCounty) {
                const featureWard = props.wardId || '';
                if (featureWard) {
                    wards.add(featureWard);
                }
            }
        });
        return wards;
    }, [selectedCounty, wardsGeoJSON]);

    const selectedWardCounty = useMemo(() => {
        if (!selectedWard || !wardsGeoJSON?.features) return null;

        const normalizedSelectedWard = normalizeWardName(selectedWard);

        const selectedFeature = wardsGeoJSON.features.find((feature: any) => {
            const props = feature?.properties || {};

            const featureWard =
                props.wardId ||
                '';

            return normalizeWardName(featureWard) === normalizedSelectedWard;
        });

        if (selectedFeature) {
            const props = selectedFeature.properties || {};
            return (
                props.countyId ||
                props.County ||
                props.COUNTY ||
                null
            );
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
        selectedSubcountyWards,
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
        if (!activeGeoJSON?.features) return () => { };

        const labelMarkers: Array<{ marker: L.Marker; feature: any }> = [];
        const layerMap = new Map<string, L.Layer>();
        const layers: L.Layer[] = [];

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

                // Get the IDs for lookup in valueMap
                const featureWardId = props.wardId || '';
                const featureSubcountyId = props.subcountyId || props.subCountyId || '';

                // Use the appropriate ID based on selection mode
                const featureId = selectionMode === 'ward' ? featureWardId : featureSubcountyId;
                const featureCounty = props.countyId || '';
                // Use the appropriate name for selection comparison
                const featureName = selectionMode === 'ward' ? featureWardId : featureSubcountyId;

                // Normalize the feature ID for valueMap lookup (same normalization used when building valueMap)
                const normalizedNameForValueMap = selectionMode === 'ward'
                    ? normalizeWardName(featureId)
                    : normalizeSubcountyName(featureId);

                const isSelected = Boolean(
                    (selectionMode === 'ward' && selectedWard && selectedWard === featureName) ||
                    (selectionMode === 'subcounty' && selectedCounty && selectedCounty === featureName)
                );

                const isInSelectedSubcounty = Boolean(
                    selectedCounty &&
                    !selectedWard &&
                    selectionMode === 'ward' &&
                    selectedSubcountyWards.has(featureName)
                );

                const isKajiadoWard = selectedWardCounty &&
                    featureCounty === 'Hsk1YV8kHkT' &&
                    selectedWardCounty === 'Hsk1YV8kHkT';

                return getLayerStyle({
                    valueMap,
                    colorScale,
                    normalizedName: normalizedNameForValueMap, // Use normalized name for valueMap lookup
                    isSelected,
                    isInSelectedSubcounty,
                    isKajiadoWard,
                    hasSelection: !!(selectedCounty || selectedWard),
                    selectionMode,
                });
            },
            onEachFeature: (feature, layer) => {
                const props = feature?.properties || {};
                const featureWardId = props.wardId || '';
                const featureSubcountyId = props.subcountyId || props.subCountyId || '';

                const featureName = selectionMode === 'ward' ? featureWardId : featureSubcountyId;
                const normalizedName = selectionMode === 'ward'
                    ? normalizeWardName(featureName)
                    : normalizeSubcountyName(featureName);

                layerMap.set(normalizedName, layer);

                // Add click handler for zoom and selection
                if (onFeatureClick) {
                    layer.on('click', () => {
                        // Get bounds from the feature geometry
                        if (feature.geometry) {
                            const featureLayer = L.geoJSON(feature as any);
                            const bounds = featureLayer.getBounds();
                            if (bounds.isValid()) {
                                map.fitBounds(bounds, { padding: [50, 50], maxZoom: selectionMode === 'ward' ? 15 : 12 });
                            }
                            // Clean up the temporary layer
                            featureLayer.remove();
                        }

                        // Call the click handler with the appropriate IDs
                        if (selectionMode === 'ward' && featureWardId) {
                            onFeatureClick({ wardId: featureWardId });
                        } else if (selectionMode === 'subcounty' && featureSubcountyId) {
                            onFeatureClick({ subcountyId: featureSubcountyId });
                        }
                    });
                }

                if (feature.geometry) {
                    const centroid = getCentroid(feature.geometry);
                    if (centroid) {
                        const [lat, lng] = centroid;
                        const boundingWidth = getBoundingBoxWidth(feature.geometry, map);
                        const baseFontSize = Math.max(12, Math.min(18, Math.floor(boundingWidth / 12)));
                        const labelText = selectionMode === 'subcounty'
                            ? (featureSubcountyId)
                            : (featureWardId);
                        const normalizedDisplayName = normalizeDisplayName(labelText);
                        const displayName = toTitleCase(normalizedDisplayName);
                        const featureId = selectionMode === 'ward' ? featureWardId : featureSubcountyId;
                        const populationValue = valueMap?.[featureId.toLowerCase()] || 0;
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

        // Add hospital markers after the map layers are loaded
        const pointFeatures = facilityData?.features || [];
        const facilityMarkers: L.Marker[] = [];

        if (pointFeatures.length > 0) {
            // Create hospital icon SVG just like DeckGL
            const hospitalSvg = `
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#66e8ecff" stroke="#0a0a0aff" stroke-width="1"/>
            <circle cx="12" cy="9" r="3" fill="#302e2eff"/>
            <path d="M12 6v6M9 9h6" stroke="#0bd756ff" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        `.trim();

            // Convert SVG to data URL
            const svgUrl = `data:image/svg+xml;base64,${btoa(hospitalSvg)}`;

            // Create hospital icon
            const hospitalIcon = L.icon({
                iconUrl: svgUrl,
                iconSize: [13, 13],
                iconAnchor: [6, 6],
                popupAnchor: [0, -13],
                className: 'hospital-icon',
            });

            pointFeatures.forEach((feature: any) => {
                const coords = feature.geometry?.type === 'Point' && 'coordinates' in feature.geometry
                    ? feature.geometry.coordinates
                    : null;

                if (!coords || coords.length < 2) return;

                // The coordinates in this JSON are [lat, lng], not standard GeoJSON [lng, lat]
                const [lat, lng] = coords;
                const marker = L.marker([lat, lng], {
                    icon: hospitalIcon,
                    interactive: true,
                    riseOnHover: true,
                    riseOffset: 100,
                });

                const props = feature.properties || {};
                const facilityName = props.healthFacilityName || props.raw_facility_name || props.facility_name || '';
                const latitude = props.latitude || props.raw_latitude || props.lat || '';
                const longitude = props.longitude || props.raw_longitude || props.lng || '';
                const facilityType = props.facilityType || props.raw_facility_type || props.type || '';
                const noOfBeds = props.noOfBeds || props.raw_no_of_beds || props.beds || 0;
                const noOfCots = props.noOfCots || props.raw_no_of_cots || props.cots || 0;

                const tooltipContent = `
            <div style="min-width:200px;padding:8px;">
              <div style="font-weight:800;color:#000000;margin-bottom:8px;">Health Facility</div>
              ${facilityName ? `<div style="margin:4px 0"><strong>Facility:</strong> ${String(facilityName)}</div>` : ''}
              ${latitude ? `<div style="margin:4px 0"><strong>Latitude:</strong> ${String(latitude)}</div>` : ''}
              ${longitude ? `<div style="margin:4px 0"><strong>Longitude:</strong> ${String(longitude)}</div>` : ''}
              ${facilityType ? `<div style="margin:4px 0"><strong>Facility Type:</strong> ${String(facilityType)}</div>` : ''}
              ${noOfBeds ? `<div style="margin:4px 0"><strong>No of Beds:</strong> ${String(noOfBeds)}</div>` : ''}
              ${noOfCots ? `<div style="margin:4px 0"><strong>No of Cots:</strong> ${String(noOfCots)}</div>` : ''}
            </div>
          `;

                marker.bindPopup(tooltipContent, {
                    className: 'cxh-leaflet-popup',
                    maxWidth: 300,
                    minWidth: 200,
                    autoPan: true,
                    closeButton: true,
                });

                facilityMarkers.push(marker);
                layers.push(marker);
            });
        }

        // Function to update facility marker visibility based on zoom and viewport
        const updateFacilityMarkers = () => {
            const currentZoom = map.getZoom();
            const bounds = map.getBounds();

            // Show all markers at zoom 11+, major facilities only at lower zooms
            const showAllMarkers = currentZoom >= 9;

            facilityMarkers.forEach((marker, index) => {
                const markerLatLng = marker.getLatLng();
                const isInBounds = bounds.contains(markerLatLng);

                // Get facility type from the original feature
                const feature = pointFeatures[index];
                const facilityType = feature?.properties?.facilityType || '';

                // Determine if this is a major facility (hospitals and health centres)
                const isMajorFacility = facilityType.toLowerCase().includes('hospital') ||
                    facilityType.toLowerCase().includes('health centre');

                // Show marker if:
                // 1. It's in viewport bounds AND
                // 2. Either we're showing all markers OR it's a major facility
                const shouldShow = isInBounds && (showAllMarkers || isMajorFacility);

                if (shouldShow) {
                    if (!map.hasLayer(marker)) {
                        marker.addTo(map);
                    }
                } else {
                    if (map.hasLayer(marker)) {
                        map.removeLayer(marker);
                    }
                }
            });
        };

        // Initial update
        updateFacilityMarkers();


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

                //for label names
                const featureWard = props.wardName || '';
                const featureSubcounty = props.subcountyName || props.subCountyName || '';

                //for label values 
                const featureWardId = props.wardId || '';
                const featureSubcountyId = props.subcountyId || props.subCountyId || '';

                const featureName = selectionMode === 'ward' ? featureWardId : featureSubcountyId;
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
                const populationValue = valueMap?.[(featureSubcountyId || featureWardId).toLowerCase()] === undefined ?
                    valueMap?.[(normalizedNameForUpdate).toLowerCase()]
                    : valueMap?.[(featureSubcountyId || featureWardId).toLowerCase()] || 0;

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
        map.on('zoomend', updateFacilityMarkers);
        map.on('moveend', updateFacilityMarkers);
        updateLabels();



        return () => {
            try {
                map.off('zoomend', updateLabels);
                map.off('moveend', updateLabels);
                map.off('zoomend', updateFacilityMarkers);
                map.off('moveend', updateFacilityMarkers);
                labelMarkers.forEach(({ marker }) => {
                    try {
                        map.removeLayer(marker);
                    } catch (e) {
                        /* ignore marker removal error */
                    }
                });
                map.removeLayer(geoJsonLayer);

                layers.forEach(layer => {
                    try {
                        map.removeLayer(layer);
                    } catch (e) {
                        /* ignore marker removal error */
                    }
                });
            } catch (e) {
                /* ignore cleanup error */
            }
        };
    }, [activeGeoJSON, valueMap, colorScale, map, selectedWard, selectedCounty, selectedWardCounty, selectedSubcountyWards, selectionMode, normalizeSubcountyName, normalizeWardName, normalizeDisplayName, normalizeCountyName, isLoadingSelection, facilityData, onFeatureClick]);

    // For zooming to the selected ward or subcounty

    useEffect(() => {
        try {
            if (!map) return;

            // ---------------- WARD ZOOM (ID-BASED) ----------------
            if (selectedWard && wardsGeoJSON?.features) {
                // eslint-disable-next-line arrow-body-style
                const matchingFeatures = wardsGeoJSON.features.filter((feature: any) => {
                    return feature?.properties?.wardId === selectedWard;
                });

                if (matchingFeatures.length > 0) {
                    const layer = L.geoJSON(matchingFeatures as any);
                    const bounds = layer.getBounds();
                    if (bounds.isValid()) {
                        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                        return;
                    }
                }
            }

            // ---------------- SUBCOUNTY ZOOM (ID-BASED) ----------------
            if (!selectedWard && selectedCounty && wardsGeoJSON?.features?.length) {
                // eslint-disable-next-line arrow-body-style
                const matchingFeatures = wardsGeoJSON.features.filter((feature: any) => {
                    return feature?.properties?.subCountyId === selectedCounty;
                });

                if (matchingFeatures.length > 0) {
                    const layer = L.geoJSON(matchingFeatures as any);
                    const bounds = layer.getBounds();
                    if (bounds.isValid()) {
                        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
                        return;
                    }
                }
            }

            // ---------------- ENTIRE COUNTY ----------------
            const geoJSONToUse =
                selectionMode === 'ward' ? wardsGeoJSON : subcountiesGeoJSON;

            if (geoJSONToUse?.features?.length) {
                const layer = L.geoJSON(geoJSONToUse as any);
                const bounds = layer.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { maxZoom: 8.4 });
                    return;
                }
            }

            // ---------------- FALLBACK ----------------
            map.setView([-2.09, 37.14], 8.4);
        } catch {
            /* swallow map errors safely */
        }
    }, [
        map,
        selectedWard,
        selectedCounty,
        wardsGeoJSON,
        subcountiesGeoJSON,
        selectionMode,
    ]);



    return null;
}
