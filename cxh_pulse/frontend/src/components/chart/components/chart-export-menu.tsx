/**
 * Chart Export Menu Component
 * 
 * Provides a dropdown menu for exporting charts with branding:
 * - PNG export with header (logo + title) and footer (user + timestamp)
 * - SVG export with header and footer
 * - CSV export with data (optional)
 */

import { useState, useCallback } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, CircularProgress } from '@mui/material';
import { Iconify } from '../../iconify';

export interface ChartExportMenuProps {
  /** Function to export as PNG */
  onExportPNG: () => Promise<void>;
  /** Function to export as SVG */
  onExportSVG?: () => Promise<void>;
  /** Function to export as CSV (optional) */
  onExportCSV?: () => Promise<void>;
  /** Whether exports are disabled */
  disabled?: boolean;
  /** Size of the icon button */
  size?: 'small' | 'medium' | 'large';
  /** Whether the export button is visible (if false, it will be hidden but take up space) */
  visible?: boolean;
}

/**
 * Chart Export Menu - Dropdown menu for branded chart exports
 * 
 * @example
 * ```tsx
 * <ChartExportMenu
 *   onExportPNG={exportPNG}
 *   onExportSVG={exportSVG}
 *   onExportCSV={handleCSVExport}
 * />
 * ```
 */
export function ChartExportMenu({
  onExportPNG,
  onExportSVG,
  onExportCSV,
  disabled = false,
  size = 'small',
  visible = true,
}: ChartExportMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleExportPNG = useCallback(async () => {
    setIsExporting(true);
    handleClose();

    try {
      await onExportPNG();
    } catch (error) {
      console.error('PNG export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [onExportPNG, handleClose]);

  const handleExportSVG = useCallback(async () => {
    if (!onExportSVG) return;

    setIsExporting(true);
    handleClose();

    try {
      await onExportSVG();
    } catch (error) {
      console.error('SVG export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [onExportSVG, handleClose]);

  const handleExportCSV = useCallback(async () => {
    if (!onExportCSV) return;

    setIsExporting(true);
    handleClose();

    try {
      await onExportCSV();
    } catch (error: any) {
      console.error('CSV export failed:', error);
      // Show user-friendly error message
      const message = error?.message || 'Failed to export CSV. Please try PNG or SVG export.';
      alert(message);
    } finally {
      setIsExporting(false);
    }
  }, [onExportCSV, handleClose]);

  return (
    <>
      <IconButton
        onClick={handleClick}
        disabled={disabled || isExporting || !visible}
        size={size}
        aria-label="Export chart"
        aria-controls={open ? 'chart-export-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{
          color: 'text.secondary',
          visibility: visible ? 'visible' : 'hidden',
          '&:hover': {
            color: 'text.primary',
            backgroundColor: 'action.hover',
          },
        }}
      >
        {isExporting ? (
          <CircularProgress size={18} />
        ) : (
          <Iconify icon={"solar:download-minimalistic-bold" as any} width={18} />
        )}
      </IconButton>

      <Menu
        id="chart-export-menu"
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
            sx: {
              minWidth: 160,
              boxShadow: 3,
            },
          },
        }}
      >
        <MenuItem onClick={handleExportPNG} disabled={isExporting}>
          <ListItemIcon>
            <Iconify icon={"solar:gallery-bold" as any} width={20} />
          </ListItemIcon>
          <ListItemText>Download PNG</ListItemText>
        </MenuItem>

        {onExportSVG && (
          <MenuItem onClick={handleExportSVG} disabled={isExporting}>
            <ListItemIcon>
              <Iconify icon={"solar:code-square-bold" as any} width={20} />
            </ListItemIcon>
            <ListItemText>Download SVG</ListItemText>
          </MenuItem>
        )}

        {onExportCSV && (
          <MenuItem onClick={handleExportCSV} disabled={isExporting}>
            <ListItemIcon>
              <Iconify icon={"solar:document-text-bold" as any} width={20} />
            </ListItemIcon>
            <ListItemText>Download CSV</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
