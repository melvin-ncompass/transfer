import { Button, IconButton } from '@mui/material';
import { Iconify } from '../../../../components/iconify';
import { useMap } from 'react-leaflet';
import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { resetButtonStyles } from '../../../../styles/components/reset-button.styles';
import type { ResetButtonProps } from '../../../../types/component.types';

/**
 * Reset Button Component - must be inside MapContainer to use useMap hook
 * Resets the map view to the bounding box of the currently selected feature,
 * or to original center and zoom if no feature is selected
 */
export function ResetButton({
    onReset,
    initialCenter,
    initialZoom,
    onResetRef,
    selectedWard,
    selectedCounty,
    selectionMode = 'ward',
    wardsGeoJSON,
    subcountiesGeoJSON,
    isSmallMap,
}: ResetButtonProps) {
    const map = useMap();
    const initialCenterRef = useRef<[number, number]>([-2.09, 36.78]);
    const initialZoomRef = useRef<number>(8.4);

    // Store initial map state on mount
    useEffect(() => {
        initialCenterRef.current = initialCenter || [map.getCenter().lat, map.getCenter().lng];
        initialZoomRef.current = initialZoom || map.getZoom();
    }, [map, initialCenter, initialZoom]);

    const handleReset = useCallback(() => {
        try {
            // Priority 1: Zoom to selected ward
            if (selectedWard && wardsGeoJSON?.features) {
                const matchingFeatures = wardsGeoJSON.features.filter(
                    (feature: any) => feature?.properties?.wardId === selectedWard
                );

                if (matchingFeatures.length > 0) {
                    const layer = L.geoJSON(matchingFeatures as any);
                    const bounds = layer.getBounds();
                    if (bounds.isValid()) {
                        map.fitBounds(bounds, {
                            padding: [50, 50],
                            maxZoom: 15,
                            animate: true,
                            duration: 0.5,
                        });
                        layer.remove(); // Clean up
                        return;
                    }
                    layer.remove(); // Clean up if bounds invalid
                }
            }

            // Priority 2: Zoom to selected subcounty (when no ward is selected)
            if (!selectedWard && selectedCounty && wardsGeoJSON?.features?.length) {
                const matchingFeatures = wardsGeoJSON.features.filter(
                    (feature: any) => feature?.properties?.subCountyId === selectedCounty
                );

                if (matchingFeatures.length > 0) {
                    const layer = L.geoJSON(matchingFeatures as any);
                    const bounds = layer.getBounds();
                    if (bounds.isValid()) {
                        map.fitBounds(bounds, {
                            padding: [50, 50],
                            maxZoom: 12,
                            animate: true,
                            duration: 0.5,
                        });
                        layer.remove(); // Clean up
                        return;
                    }
                    layer.remove(); // Clean up if bounds invalid
                }
            }

            // Priority 3: Zoom to selected subcounty using subcountiesGeoJSON
            if (selectedCounty && subcountiesGeoJSON?.features?.length) {
                const matchingFeatures = subcountiesGeoJSON.features.filter(
                    (feature: any) =>
                        feature?.properties?.subcountyId === selectedCounty ||
                        feature?.properties?.subCountyId === selectedCounty
                );

                if (matchingFeatures.length > 0) {
                    const layer = L.geoJSON(matchingFeatures as any);
                    const bounds = layer.getBounds();
                    if (bounds.isValid()) {
                        map.fitBounds(bounds, {
                            padding: [50, 50],
                            maxZoom: 12,
                            animate: true,
                            duration: 0.5,
                        });
                        layer.remove(); // Clean up
                        return;
                    }
                    layer.remove(); // Clean up if bounds invalid
                }
            }

            // Fallback: Reset to initial center and zoom
            map.setView(initialCenterRef.current, initialZoomRef.current, {
                animate: true,
                duration: 0.5,
            });
        } catch (error) {
            // If anything fails, fall back to initial view
            console.error('Error resetting map:', error);
            map.setView(initialCenterRef.current, initialZoomRef.current, {
                animate: true,
                duration: 0.5,
            });
        }
    }, [map, selectedWard, selectedCounty, wardsGeoJSON, subcountiesGeoJSON]);

    // Expose reset function to parent via ref callback
    useEffect(() => {
        if (onResetRef) {
            onResetRef(handleReset);
        }
    }, [onResetRef, handleReset]);

    return (
        isSmallMap ? 
          <IconButton
                onClick={handleReset}
                sx={resetButtonStyles.button}
            >
                <Iconify icon={"carbon:zoom-reset" as any} width={20} />
            </IconButton>
        :
        <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="carbon:zoom-reset" width={18} />}
            onClick={handleReset}
            sx={resetButtonStyles.button}
        >
            Reset zoom
        </Button>
    );
}

