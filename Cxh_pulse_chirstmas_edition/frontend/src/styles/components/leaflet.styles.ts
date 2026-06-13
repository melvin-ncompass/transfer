import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Leaflet Map Component Styles
 * 
 * Extracted sx props for leaflet map components
 */

export const leafletStyles = {
  /**
   * Map container
   */
  mapContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  } as SxProps<Theme>,

  /**
   * Reset button container
   */
  resetButtonContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1000,
  } as SxProps<Theme>,

  /**
   * Reset button
   */
  resetButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1000,
    backgroundColor: 'background.paper',
    '&:hover': {
      backgroundColor: 'action.hover',
    },
  } as SxProps<Theme>,
};

