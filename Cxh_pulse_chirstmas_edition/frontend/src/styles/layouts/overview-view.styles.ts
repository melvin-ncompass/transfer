import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Overview View Styles
 * 
 * Extracted sx props for overview-view component
 */

export const overviewViewStyles = {
  stickyFilterBar: {
    p: 1.5,
    bgcolor: 'background.paper',
    borderBottom: 1,
    borderColor: 'divider',
    position: 'sticky',
    top: { xs: '56px', md: '60px' }, // Account for navbar height
    zIndex: 1000,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginTop: 2,
  } as SxProps<Theme>,


  indicatorSelectBox: {
    minWidth: { xs: '100%', md: 300 },
  } as SxProps<Theme>,

  locationSelectorBox: {
    minWidth: { xs: '100%', md: 200 },
    position: 'relative',
  } as SxProps<Theme>,

  loadingIndicatorOverlay: {
    position: 'absolute',
    top: '50%',
    right: 8,
    transform: 'translateY(-50%)',
    zIndex: 1,
  } as SxProps<Theme>,

  dateRangeSliderBox: {
    flex: 1,
    width: '100%',
  } as SxProps<Theme>,

  mainContentStack: {
    width: '100%',
    // minHeight: 'calc(100vh - 120px)', // Account for header/tabs
    position: 'relative',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  } as SxProps<Theme>,

  topRowContainer: {
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    width: '100%',
    flex: { xs: '0 0 auto', md: 1 },
  } as SxProps<Theme>,

  mapBox: {
    flex: 1,
    width: { xs: '100%', md: '50%' },
    p: { xs: 1, sm: 2 },
    position: 'relative',
  } as SxProps<Theme>,

  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
    borderRadius: 1,
  } as SxProps<Theme>,

  chartBox: {
    flex: 1,
    width: { xs: '100%', md: '50%' },
    minHeight: { xs: '400px', md: '100%' },
    p: { xs: 1, sm: 2 },
  } as SxProps<Theme>,

  chartLoadingBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    minHeight: 400,
  } as SxProps<Theme>,

  chartErrorBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    minHeight: 400,
  } as SxProps<Theme>,

  chartContentBox: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  } as SxProps<Theme>,

  bottomRowContainer: {
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    minHeight: { xs: 'auto', md: '50%' },
    width: '100%',
  } as SxProps<Theme>,

  indicatorTrendsTableBox: (isPopulationMode: boolean) => ({
    flex: '0 0 50%', // Fixed 50% width, don't grow or shrink
    width: { xs: '100%', md: '50%' },
    maxWidth: { xs: '100%', md: '50%' }, // Prevent expansion
    minHeight: { xs: '400px', md: '100%' },
    p: { xs: 1, sm: 2 },
    visibility: isPopulationMode ? 'hidden' : 'visible', // Hide but keep in layout flow
    overflow: 'hidden', // Hide content overflow
  }) as SxProps<Theme>,

  promptsTrendTableBox: {
    flex: '0 0 50%', // Fixed 50% width, don't grow or shrink
    width: { xs: '100%', md: '50%' },
    maxWidth: { xs: '100%', md: '50%' }, // Prevent expansion
    minHeight: { xs: '400px', md: '100%' },
    p: 1,
  } as SxProps<Theme>,
};

