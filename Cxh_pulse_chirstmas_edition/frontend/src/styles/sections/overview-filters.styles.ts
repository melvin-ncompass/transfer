import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Overview Filters Styles
 * 
 * Extracted sx props for overview-filters component
 */

export const overviewFiltersStyles = {
  /**
   * Main container
   */
  container: {
    p: 1.5,
    bgcolor: 'background.paper',
    borderBottom: 1,
    borderColor: 'divider',
    position: 'sticky',
    top: { xs: '56px', md: '60px' },
    zIndex: 1000,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginTop: 2,
  } as SxProps<Theme>,

  /**
   * Indicator select box
   */
  indicatorSelectBox: {
    minWidth: { xs: '100%', md: 300 },
  } as SxProps<Theme>,

  /**
   * Location selector box
   */
  locationSelectorBox: {
    minWidth: { xs: '100%', md: 200 },
    position: 'relative',
  } as SxProps<Theme>,

  /**
   * Loading indicator overlay
   */
  loadingIndicatorOverlay: {
    position: 'absolute',
    top: '50%',
    right: 8,
    transform: 'translateY(-50%)',
    zIndex: 1,
  } as SxProps<Theme>,

  /**
   * Date range slider box
   */
  dateRangeSliderBox: {
    flex: 1,
    width: '100%',
  } as SxProps<Theme>,
};
