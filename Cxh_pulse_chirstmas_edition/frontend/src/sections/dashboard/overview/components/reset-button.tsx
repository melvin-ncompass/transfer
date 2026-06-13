import { Button } from '@mui/material';
import { Iconify } from '../../../../components/iconify';
import { useMap } from 'react-leaflet';
import { useEffect, useRef, useCallback } from 'react';
import { resetButtonStyles } from '../../../../styles/components/reset-button.styles';
import type { ResetButtonProps } from '../../../../types/component.types';

/**
 * Reset Button Component - must be inside MapContainer to use useMap hook
 * Resets the map view to original center and zoom, and clears selections
 */
export function ResetButton({ onReset, initialCenter, initialZoom, onResetRef }: ResetButtonProps) {
    const map = useMap();
    const initialCenterRef = useRef<[number, number]>([-2.09, 36.78]);
    const initialZoomRef = useRef<number>(8.4);

    // Store initial map state on mount
    useEffect(() => {
        initialCenterRef.current = initialCenter || [map.getCenter().lat, map.getCenter().lng];
        initialZoomRef.current = initialZoom || map.getZoom();
    }, [map, initialCenter, initialZoom]);

    const handleReset = useCallback(() => {
        // Reset map view to original center and zoom with smooth animation
        map.setView(initialCenterRef.current, initialZoomRef.current, {
            animate: true,
            duration: 0.5,
        });
        // Call the parent reset handler to clear selections
        if (onReset) {
            onReset();
        }
    }, [map, onReset]);

    // Expose reset function to parent via ref callback
    useEffect(() => {
        if (onResetRef) {
            onResetRef(handleReset);
        }
    }, [onResetRef, handleReset]);

    return (
        <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:restart-bold" width={18} />}
            onClick={handleReset}
            sx={resetButtonStyles.button}
        >
            Reset map
        </Button>
    );
}

