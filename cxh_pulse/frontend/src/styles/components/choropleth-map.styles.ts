import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Choropleth Map Styles
 * 
 * Extracted sx props for choropleth-map component
 */

export const choroplethMapStyles = {
  /**
   * Main map container
   */
  container: {
    width: '100%',
    height: '100%',
    minHeight: 400,
    borderRadius: 1,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  } as SxProps<Theme>,

  /**
   * Title container (top left)
   */
  titleContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 999, // Lower than sticky filter (1000)
  } as SxProps<Theme>,

  /**
   * Title typography
   */
  title: {
    color: 'text.primary',
    fontWeight: 600,
  } as SxProps<Theme>,

  /**
   * Legend container (bottom right)
   */
  legendContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 800,
    pointerEvents: 'none',
    '& > div': {
      position: 'relative !important' as any,
      bottom: 'auto !important' as any,
      right: 'auto !important' as any,
    },
  } as SxProps<Theme>,

  /**
   * Loading overlay (blocks interactions)
   */
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001, // Higher than sticky filter (1000) to block interactions
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'all', // Block all interactions
  } as SxProps<Theme>,

  /**
   * Loading content box
   */
  loadingContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: 'white',
    padding: 2,
    borderRadius: 1,
    textAlign: 'center',
    boxShadow: 3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  } as SxProps<Theme>,

  /**
   * Loading spinner
   */
  loadingSpinner: {
    color: 'white',
  } as SxProps<Theme>,

  /**
   * No data overlay
   */
  noDataOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 999, // Lower than sticky filter (1000)
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: 'white',
    padding: 2,
    borderRadius: 1,
    textAlign: 'center',
    boxShadow: 3,
  } as SxProps<Theme>,

  /**
   * No data title
   */
  noDataTitle: {
    mb: 1,
  } as SxProps<Theme>,
};
