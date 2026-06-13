import { useState, useCallback, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, CircularProgress } from '@mui/material';
import { Iconify } from '../../../../components/iconify';
import { useBranding } from '../../../../contexts/branding-context';
import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentUser } from '../../../../store/slices/authSlice';
import {
    exportMapAsPNG,
    exportMapAsSVG,
    exportMapDataAsCSV,
    type BrandedMapExportOptions,
} from '../../../../utils/branded-map-export';
import { mapDownloadButtonStyles } from '../../../../styles/components/map-download-button.styles';

type MapDownloadButtonProps = {
    valueMap: Record<string, number>;
    nameMap?: Record<string, string>;
    dataMode: 'indicator' | 'population';
    title: string;
    /** Optional ref to export container (includes legend). If not provided, uses map container only. */
    exportContainerRef?: React.RefObject<HTMLElement | null>;
    /** Optional filter information to display in export */
    filterInfo?: { location?: string; subcounty?: string; ward?: string };
    /** Optional date range to display in export */
    dateRange?: { from: Date; to: Date };
    /** Whether the export button is visible (if false, it will be hidden but take up space) */
    visible?: boolean;
    /** Whether animation is playing - disables downloads when true */
    isPlaying?: boolean;
};

/**
 * Map Download Button Component
 * Must be inside MapContainer to use useMap hook
 * Provides dropdown menu with PNG, SVG, and CSV export options
 * Exports include branding matching ApexCharts exports
 */
export function MapDownloadButton({ valueMap, nameMap = {}, dataMode, title, exportContainerRef, filterInfo, dateRange, visible = true, isPlaying = false }: MapDownloadButtonProps) {
    const map = useMap();
    const { branding } = useBranding();
    const user = useAppSelector(selectCurrentUser);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const open = Boolean(anchorEl);

    // Store map container ref
    const mapContainerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (map) {
            mapContainerRef.current = map.getContainer();
        }
    }, [map]);

    // Get branding options
    const userName = user?.userInfo?.name || user?.name || user?.email || 'Unknown User';
    const primaryColor = branding?.colors?.primary || branding?.fgcolor || '#D32F2F';
    const logoUrl = branding?.logoData?.src || undefined;

    const getExportOptions = useCallback((): BrandedMapExportOptions => ({
        mapTitle: title,
        userName,
        logoUrl,
        primaryColor,
        scale: window.devicePixelRatio || 2,
        filterInfo,
        dateRange,
    }), [title, userName, logoUrl, primaryColor, filterInfo, dateRange]);

    const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handleExportPNG = useCallback(async () => {
        // Use exportContainerRef if available (includes legend), otherwise fall back to map container
        const containerToExport = exportContainerRef?.current || mapContainerRef.current;
        if (!containerToExport) return;

        setIsExporting(true);
        handleClose();

        try {
            await exportMapAsPNG(containerToExport, getExportOptions());
        } catch (error: any) {
            console.error('Failed to export PNG:', error);
        } finally {
            setIsExporting(false);
        }
    }, [handleClose, getExportOptions, exportContainerRef]);

    const handleExportSVG = useCallback(async () => {
        // Use exportContainerRef if available (includes legend), otherwise fall back to map container
        const containerToExport = exportContainerRef?.current || mapContainerRef.current;
        if (!containerToExport) return;

        setIsExporting(true);
        handleClose();

        try {
            await exportMapAsSVG(containerToExport, getExportOptions());
        } catch (error: any) {
            console.error('Failed to export SVG:', error);
        } finally {
            setIsExporting(false);
        }
    }, [handleClose, getExportOptions, exportContainerRef]);

    const handleExportCSV = useCallback(() => {
        if (Object.keys(valueMap).length === 0) {
            console.warn('No data to export');
            return;
        }

        handleClose();

        try {
            exportMapDataAsCSV(valueMap, {
                ...getExportOptions(),
                dataMode,
                nameMap,
            });
        } catch (error) {
            console.error('Failed to export CSV:', error);
        }
    }, [valueMap, nameMap, dataMode, handleClose, getExportOptions]);

    return (
        <>
            <IconButton
                onClick={handleClick}
                disabled={isExporting || !visible || isPlaying}
                sx={{
                    ...mapDownloadButtonStyles.button,
                    visibility: visible ? 'visible' : 'hidden',
                }}
                aria-label="Download map"
                aria-controls={open ? 'download-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
            >
                {isExporting ? (
                    <CircularProgress size={20} />
                ) : (
                    <Iconify icon={"solar:download-minimalistic-bold" as any} width={20} />
                )}
            </IconButton>

            <Menu
                id="download-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                slotProps={{
                    paper: {
                        sx: mapDownloadButtonStyles.menuPaper,
                    },
                }}
            >
                <MenuItem onClick={handleExportPNG} disabled={isExporting}>
                    <ListItemIcon>
                        <Iconify icon={"solar:gallery-bold" as any} width={20} />
                    </ListItemIcon>
                    <ListItemText>Download PNG</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleExportSVG} disabled={isExporting}>
                    <ListItemIcon>
                        <Iconify icon={"solar:code-square-bold" as any} width={20} />
                    </ListItemIcon>
                    <ListItemText>Download SVG</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleExportCSV} disabled={isExporting || Object.keys(valueMap).length === 0}>
                    <ListItemIcon>
                        <Iconify icon={"solar:document-text-bold" as any} width={20} />
                    </ListItemIcon>
                    <ListItemText>Download CSV</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
}
