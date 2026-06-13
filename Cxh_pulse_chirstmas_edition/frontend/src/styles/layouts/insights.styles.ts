import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Insights Layout Styles
 * 
 * Extracted sx props for insights layout components
 */

export const insightsLayoutStyles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
  } as SxProps<Theme>,

  tabsContainer: {
    borderBottom: 1,
    borderColor: 'divider',
    mb: 1,
  } as SxProps<Theme>,

  tabs: {
    minHeight: 40,
    '& .MuiTab-root': {
      minHeight: 40,
      textTransform: 'none',
      fontSize: '0.9rem',
      fontWeight: 600,
      py: 1,
      px: 1.5,
    },
  } as SxProps<Theme>,

  tabContent: {
    marginTop: '0px',
    minHeight: '400px',
  } as SxProps<Theme>,

  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: 2,
  } as SxProps<Theme>,

  skeletonContainer: {
    p: 3,
  } as SxProps<Theme>,

  skeletonFilter: {
    mb: 2,
  } as SxProps<Theme>,

  skeletonMap: {
    height: '500px',
  } as SxProps<Theme>,

  skeletonStack: {
    width: '40%',
  } as SxProps<Theme>,

  loadingText: {
    color: 'text.secondary',
    fontSize: '0.875rem',
  } as SxProps<Theme>,

  tabIcon: {
    gap: 0.75,
  } as SxProps<Theme>,

  tabContentBox: {
    pt: 0,
  } as SxProps<Theme>,
};

