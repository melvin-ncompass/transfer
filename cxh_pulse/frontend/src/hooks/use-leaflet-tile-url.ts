import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import tinycolor from 'tinycolor2';

/**
 * Hook to get the appropriate Leaflet tile layer URL based on theme background color
 * Returns dark tiles for dark backgrounds, light tiles for light backgrounds
 */
export function useLeafletTileUrl(): string {
    const theme = useTheme();
    
    // return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    return useMemo(() => {
        const bgColor = theme.palette.background.default || theme.palette.background.paper || '#FFFFFF';
        const isDark = tinycolor(bgColor).isDark();
        
        // CARTO tile URLs
        // Dark tiles: dark_all
        // Light tiles: light_all
        return isDark 
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    }, [theme.palette.background.default, theme.palette.background.paper]);

    // return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
}

