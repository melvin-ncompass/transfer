import { Box, Typography, CircularProgress, Button, IconButton } from '@mui/material';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import '../../../../styles/leaflet.css';
import { ChoroplethMapLayers } from './choropleth-map-layers';
import { ResetButton } from './reset-button';
import { MapDownloadButton } from './map-download-button';
import { ChoroplethLegend } from '../../../../components/legends';
import { useLeafletTileUrl } from '../../../../hooks/use-leaflet-tile-url';
import { useMedia } from '@/hooks/use-media';
import { SelectionModeToggle } from './selection-mode-toggle';
import { choroplethMapStyles } from '../../../../styles/components/choropleth-map.styles';
import { resetButtonStyles } from '@/styles';
import type { ChoroplethMapProps } from '../../../../types/component.types';
import { SelectionMode } from '../overview-view';
import { ReportGuard } from '../../components/protected-components/permission-guard';
import { Iconify } from '@/components/iconify';

// Helper function to convert text to title case
const toTitleCase = (str: string): string => {
    if (!str) return str;
    return str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const [latitude, longitude] = [-2.09, 37.14];
const initialCenter: [number, number] = [latitude, longitude];

export function ChoroplethMap({
    wardsGeoJSON,
    subcountiesGeoJSON,
    facilityData,
    selectedWard,
    selectedCounty,
    onReset,
    selectionMode = SelectionMode.SUBCOUNTY,
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
    filterInfo,
    onFeatureClick,
    mapDateRange,
    hasPlayed,
    onResetMap,
}: ChoroplethMapProps & {
    onResetRef?: (resetFn: () => void) => void;
    filterInfo?: { location?: string; subcounty?: string; ward?: string };
}) {
    const { isSmallMap } = useMedia()
    const tileUrl = useLeafletTileUrl();
    const [valueMap, setValueMap] = useState<Record<string, number>>({});
    const [colorScale, setColorScale] = useState<{ min: number; max: number; getColor: (value: number) => [number, number, number, number] } | null>(null);
    const [isLoadingSelection, setIsLoadingSelection] = useState(false);

    const previousSelectedWard = useRef<string | undefined>(selectedWard);
    const previousSelectedCounty = useRef<string | undefined>(selectedCounty);
    // Ref for the entire map container (including legend) for export
    const exportContainerRef = useRef<HTMLDivElement>(null);

    const handleValueMapChange = useCallback((newValueMap: Record<string, number>) => {
        setValueMap(newValueMap);
    }, []);

    const handleColorScaleChange = useCallback((newColorScale: { min: number; max: number; getColor: (value: number) => [number, number, number, number] } | null) => {
        setColorScale(newColorScale);
    }, []);

    // Build nameMap from GeoJSON features (ID -> display name)
    const nameMap = useMemo(() => {
        const map: Record<string, string> = {};
        const geoJSON = selectionMode === SelectionMode.WARD ? wardsGeoJSON : subcountiesGeoJSON;

        if (geoJSON?.features) {
            geoJSON.features.forEach((feature: any) => {
                const props = feature?.properties || {};
                if (selectionMode === SelectionMode.WARD) {
                    const id = props.wardId || '';
                    const name = props.wardName || '';
                    if (id && name) {
                        // Store with lowercase key to match valueMap
                        map[id.toLowerCase()] = name;
                    }
                } else {
                    const id = props.subcountyId || props.subCountyId || '';
                    const name = props.subcountyName || props.subCountyName || '';
                    if (id && name) {
                        // Store with lowercase key to match valueMap
                        map[id.toLowerCase()] = name;
                    }
                }
            });
        }
        return map;
    }, [wardsGeoJSON, subcountiesGeoJSON, selectionMode]);

    const activeValueMap = dataMode === 'indicator' ? (indicatorValueMap || {}) : valueMap;
    const activeColorScale = dataMode === 'indicator' ? indicatorColorScale : colorScale;

    // Track selection changes
    useEffect(() => {
        const wardChanged = previousSelectedWard.current !== selectedWard;
        const countyChanged = previousSelectedCounty.current !== selectedCounty;

        if (wardChanged || countyChanged) {
            previousSelectedWard.current = selectedWard;
            previousSelectedCounty.current = selectedCounty;
        }
    }, [selectedWard, selectedCounty]);

    const activeGeoJSON = selectionMode === SelectionMode.WARD ? wardsGeoJSON : subcountiesGeoJSON;
    const isGeoJSONReady = !!activeGeoJSON && Array.isArray(activeGeoJSON.features);
    const hasNoData =
        isGeoJSONReady &&
        activeGeoJSON.features.length === 0 &&
        !isLoadingGeoJSON &&
        !isLoadingSelection;

    return (
        <Box ref={exportContainerRef} sx={choroplethMapStyles.container}>
            <MapContainer
                center={[-2.09, 37.14]}
                zoom={zoom}
                minZoom={7}
                maxZoom={19}
                style={{ height: '100%', width: '100%', flex: 1, minHeight: 0 }}
                scrollWheelZoom
                zoomControl={false}
            >
                <TileLayer url={tileUrl} />

                {!hasNoData && (
                    <ChoroplethMapLayers
                        wardsGeoJSON={selectionMode === SelectionMode.WARD ? wardsGeoJSON : undefined}
                        subcountiesGeoJSON={selectionMode === SelectionMode.SUBCOUNTY ? subcountiesGeoJSON : undefined}
                        facilityData={facilityData}
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
                        onFeatureClick={onFeatureClick}
                    />
                )}

                {/* Map Controls: Reset and Download buttons - excluded from export via data-export-ignore */}
                <Box
                    data-export-ignore="true"
                    sx={{
                        position: 'absolute',
                        top: { xs: 45,sm: 16 , md: 45, lg: 16 },
                        // top: 16,
                        right: 16,
                        zIndex: 999,
                        display: 'flex',
                        flexDirection: 'column-reverse',
                        gap: 1,
                        alignItems: 'flex-end',
                    }}
                >
                    {isSmallMap ?
                    <IconButton
                        onClick={onResetMap}
                        sx={resetButtonStyles.button}
                    >
                        <Iconify icon={"solar:restart-bold" as any} width={20} />
                    </IconButton>
                     :
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Iconify icon="solar:restart-bold" width={18} />}
                            onClick={onResetMap}
                            sx={{...resetButtonStyles.button, width: '100%' }}
                        >
                        Reset map
                    </Button>}
                    <ResetButton
                        isSmallMap={isSmallMap}
                        onReset={onReset}
                        initialCenter={initialCenter}
                        initialZoom={zoom}
                        onResetRef={onResetRef}
                        selectedWard={selectedWard}
                        selectedCounty={selectedCounty}
                        selectionMode={selectionMode === SelectionMode.WARD ? 'ward' : 'subcounty'}
                        wardsGeoJSON={wardsGeoJSON}
                        subcountiesGeoJSON={subcountiesGeoJSON}
                    />
                    <ReportGuard>
                        <MapDownloadButton
                            valueMap={activeValueMap}
                            nameMap={nameMap}
                            dataMode={dataMode}
                            title={title}
                            exportContainerRef={exportContainerRef}
                            filterInfo={filterInfo}
                            dateRange={mapDateRange === null ? dateRange : mapDateRange}
                            visible={!isLoadingGeoJSON && !isLoadingSelection && !hasNoData}
                            isPlaying={hasPlayed}
                        />
                    </ReportGuard>
                </Box>
                {showSelectionModeToggle && onSelectionModeChange && (
                    <SelectionModeToggle mode={selectionMode} onChange={onSelectionModeChange} />
                )}
            </MapContainer>

            <Box sx={choroplethMapStyles.titleContainer} data-export-ignore="true">
                <Typography variant="h6" sx={choroplethMapStyles.title}>{title}</Typography>
            </Box>

            <Box sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                zIndex: 800,
                pointerEvents: 'none',
                color: 'black',
                '& > div': {
                    position: 'relative !important' as any,
                    bottom: 'auto !important' as any,
                    right: 'auto !important' as any,
                },
            }}
                data-export-ignore="true"
            >
                {hasPlayed && dataMode !== 'population' && <Typography variant='subtitle2' color='var(--brand-text)'>
                    {mapDateRange?.from?.toLocaleString('en-US', { month: 'short', year: 'numeric' })}
                </Typography>}
            </Box>

            {!selectedWard && activeColorScale && Object.keys(activeValueMap).length > 0 && (
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

            {isLoadingSelection && (
                <Box sx={choroplethMapStyles.loadingOverlay}>
                    <Box sx={choroplethMapStyles.loadingContent}>
                        <CircularProgress size={40} sx={choroplethMapStyles.loadingSpinner} />
                        <Typography variant="body2">{toTitleCase('Loading selection data...')}</Typography>
                    </Box>
                </Box>
            )}

            {!isLoadingGeoJSON && !isLoadingSelection && hasNoData && (
                <Box sx={choroplethMapStyles.noDataOverlay}>
                    <Typography variant="h6" sx={choroplethMapStyles.noDataTitle}>
                        {toTitleCase('No Data Found')}
                    </Typography>
                    <Typography variant="body2">
                        {toTitleCase(`No ${selectionMode === SelectionMode.WARD ? SelectionMode.WARD : SelectionMode.SUBCOUNTY} data available`)}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
