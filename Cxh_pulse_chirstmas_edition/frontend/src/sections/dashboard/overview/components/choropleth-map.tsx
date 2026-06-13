import { Box, Typography, CircularProgress } from '@mui/material';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useState, useCallback, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import '../../../../styles/leaflet.css';
import { ChoroplethMapLayers } from './choropleth-map-layers';
import { ResetButton } from './reset-button';
import { ChoroplethLegend } from '../../../../components/legends';
import { useLeafletTileUrl } from '../../../../hooks/use-leaflet-tile-url';
import { SelectionModeToggle } from './selection-mode-toggle';
import { choroplethMapStyles } from '../../../../styles/components/choropleth-map.styles';
import type { ChoroplethMapProps } from '../../../../types/component.types';

// Helper function to convert text to title case
const toTitleCase = (str: string): string => {
    if (!str) return str;
    return str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * MapResizeHandler - Component to handle map resize when sidebar collapse state changes
 * Must be inside MapContainer to use useMap hook
 */

/**
 * Choropleth Map Component
 * Main map container with layers, controls, and overlays
 */
export function ChoroplethMap({
    wardsGeoJSON,
    subcountiesGeoJSON,
    selectedWard,
    selectedCounty,
    onReset,
    selectionMode = 'subcounty',
    onSelectionModeChange,
    dateRange,
    isLoadingGeoJSON,
    zoom = 8.4,
    indicatorData,
    indicatorValueMap,
    indicatorColorScale,
    dataMode = 'population',
    title = 'Population',
    showSelectionModeToggle = false,
    onResetRef,
}: ChoroplethMapProps & { onResetRef?: (resetFn: () => void) => void }) {
    const tileUrl = useLeafletTileUrl();
    // State to store valueMap and colorScale from ChoroplethMapLayers (for population mode)
    const [valueMap, setValueMap] = useState<Record<string, number>>({});
    const [colorScale, setColorScale] = useState<{ min: number; max: number; getColor: (value: number) => [number, number, number, number] } | null>(null);

    // Use indicator data if in indicator mode, otherwise use population data
    const activeValueMap = dataMode === 'indicator' ? (indicatorValueMap || {}) : valueMap;
    const activeColorScale = dataMode === 'indicator' ? indicatorColorScale : colorScale;
    // State to track loading when selection changes
    const [isLoadingSelection, setIsLoadingSelection] = useState(false);
    const previousSelectedWard = useRef<string | undefined>(selectedWard);
    const previousSelectedCounty = useRef<string | undefined>(selectedCounty);

    // Callbacks to receive valueMap and colorScale from ChoroplethMapLayers
    const handleValueMapChange = useCallback((newValueMap: Record<string, number>) => {
        setValueMap(newValueMap);
    }, []);

    const handleColorScaleChange = useCallback((newColorScale: { min: number; max: number; getColor: (value: number) => [number, number, number, number] } | null) => {
        setColorScale(newColorScale);
    }, []);

    // Track selection changes to maintain loading state
    useEffect(() => {
        const wardChanged = previousSelectedWard.current !== selectedWard;
        const countyChanged = previousSelectedCounty.current !== selectedCounty;

        if (wardChanged || countyChanged) {
            previousSelectedWard.current = selectedWard;
            previousSelectedCounty.current = selectedCounty;
            // Keep loading state true if GeoJSON is still loading
            if (!isLoadingGeoJSON) {
                // Will be cleared by the next useEffect
            }
        }
    }, [selectedWard, selectedCounty, isLoadingGeoJSON]);

    // Clear loading state when GeoJSON loading completes
    useEffect(() => {
        if (!isLoadingGeoJSON && isLoadingSelection) {
            // Small delay to ensure smooth transition
            const timer = setTimeout(() => {
                setIsLoadingSelection(false);
            }, 100);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [isLoadingGeoJSON, isLoadingSelection]);

    // Determine which GeoJSON to use based on selection mode
    const activeGeoJSON = selectionMode === 'ward' ? wardsGeoJSON : subcountiesGeoJSON;
    const hasNoData = !isLoadingGeoJSON && (!activeGeoJSON || !activeGeoJSON.features || activeGeoJSON.features.length === 0);

    return (
        <Box sx={choroplethMapStyles.container}>
            <MapContainer
                center={[-2.09, 37.14]}
                zoom={zoom}
                minZoom={7}
                maxZoom={19}
                style={{ height: '100%', width: '100%', flex: 1, minHeight: 0 }}
                scrollWheelZoom
                zoomControl={false}
            // attributionControl={false}
            >
                <TileLayer
                    // attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url={tileUrl}
                />
                {!hasNoData && (
                    <ChoroplethMapLayers
                        wardsGeoJSON={selectionMode === 'ward' ? wardsGeoJSON : undefined}
                        subcountiesGeoJSON={selectionMode === 'subcounty' ? subcountiesGeoJSON : undefined}
                        selectedWard={selectedWard}
                        selectedCounty={selectedCounty}
                        selectionMode={selectionMode}
                        dateRange={dataMode === 'population' ? dateRange : undefined}
                        onValueMapChange={dataMode === 'population' ? handleValueMapChange : undefined}
                        onColorScaleChange={dataMode === 'population' ? handleColorScaleChange : undefined}
                        isLoadingSelection={isLoadingSelection}
                        setIsLoadingSelection={setIsLoadingSelection}
                        indicatorData={dataMode === 'indicator' ? indicatorData : undefined}
                        indicatorValueMap={dataMode === 'indicator' ? indicatorValueMap : undefined}
                        indicatorColorScale={dataMode === 'indicator' ? indicatorColorScale : undefined}
                    />
                )}
                <ResetButton
                    onReset={onReset}
                    initialCenter={[-2.09, 37.14]}
                    initialZoom={zoom}
                    onResetRef={onResetRef}
                />
                {showSelectionModeToggle && onSelectionModeChange && (
                    <SelectionModeToggle mode={selectionMode} onChange={onSelectionModeChange} />
                )}
            </MapContainer>
            {/* Title - Top Left */}
            <Box sx={choroplethMapStyles.titleContainer}>
                <Typography variant="h6" sx={choroplethMapStyles.title}>
                    {title}
                </Typography>
            </Box>
            {/* Legend - Bottom Right (for both population and indicator) */}
            {activeColorScale && Object.keys(activeValueMap).length > 0 && (
                <Box sx={choroplethMapStyles.legendContainer}>
                    <ChoroplethLegend
                        wardValueMap={activeValueMap}
                        textColor="black"
                        minValue={activeColorScale.min}
                        maxValue={activeColorScale.max}
                        showLabel={false}
                        backgroundColor="transparent"
                    />
                </Box>
            )}
            {/* Loading Overlay - Selection Loading (blocks interactions) */}
            {isLoadingSelection && (
                <Box sx={choroplethMapStyles.loadingOverlay}>
                    <Box sx={choroplethMapStyles.loadingContent}>
                        <CircularProgress size={40} sx={choroplethMapStyles.loadingSpinner} />
                        <Typography variant="body2">{toTitleCase('Loading selection data...')}</Typography>
                    </Box>
                </Box>
            )}
            {/* No Data Overlay - Only show when not loading and no data */}
            {!isLoadingGeoJSON && !isLoadingSelection && hasNoData && (
                <Box sx={choroplethMapStyles.noDataOverlay}>
                    <Typography variant="h6" sx={choroplethMapStyles.noDataTitle}>
                        {toTitleCase('No Data Found')}
                    </Typography>
                    <Typography variant="body2">
                        {toTitleCase(`No ${selectionMode === 'ward' ? 'ward' : 'subcounty'} data available`)}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

