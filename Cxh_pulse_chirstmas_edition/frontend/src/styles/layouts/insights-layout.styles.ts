import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Insights Layout Component Styles
 * 
 * Extracted sx props for insights-layout component to improve maintainability
 * and enable better code organization.
 */

export const insightsLayoutComponentStyles = {
  /**
   * Filters row container - sticky header
   */
  filtersRow: (isFullscreen: boolean): SxProps<Theme> => ({
    p: 1.5,
    bgcolor: 'background.paper',
    borderBottom: 1,
    borderColor: 'divider',
    position: 'sticky',
    top: { xs: '56px', md: '60px' }, // Account for navbar height
    zIndex: 1000,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    ...(isFullscreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10000,
    }),
  }),

  /**
   * Main filters stack container
   */
  filtersStack: {
    width: '100%',
  } as SxProps<Theme>,

  /**
   * Left filters container
   */
  leftFiltersStack: {
    width: '100%',
    flexWrap: 'wrap',
  } as SxProps<Theme>,

  /**
   * Date range slider container
   */
  dateRangeContainer: {
    flexGrow: 1,
    width: { xs: '100%', md: 'auto' },
    minWidth: 300,
  } as SxProps<Theme>,

  /**
   * Temperature/Precipitation/Facilities stack
   */
  togglesStack: {
    flexWrap: 'wrap',
    gap: 1,
  } as SxProps<Theme>,

  /**
   * Action buttons stack (right side)
   */
  actionButtonsStack: {
    flexShrink: 0,
  } as SxProps<Theme>,

  /**
   * Main content stack
   */
  mainContentStack: (minHeight: string): SxProps<Theme> => ({
    height: 'calc(100vh - 200px)',
    width: '100%',
    minHeight,
    flexShrink: 0,
  }),

  /**
   * Map and sidebar container
   */
  mapSidebarContainer: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
    height: '100%',
  } as SxProps<Theme>,

  /**
   * Map section container
   */
  mapSection: (
    isHealthIndicatorsOpen: boolean,
    mapWidth: string | number,
    isFullscreen: boolean
  ): SxProps<Theme> => ({
    flex: isHealthIndicatorsOpen
      ? `0 0 ${typeof mapWidth === 'string' ? mapWidth : `${mapWidth}%`}`
      : '1 1 100%',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    transition: 'flex 0.3s ease-in-out',
    '@media (max-width: 960px)': { flex: '1 1 100%' },
    ...(isFullscreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999,
      bgcolor: 'background.paper',
    }),
  }),

  /**
   * Map container box
   */
  mapContainer: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    p: 0,
    minHeight: 0,
  } as SxProps<Theme>,

  /**
   * Map wrapper with border
   */
  mapWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 1,
    overflow: 'hidden',
    border: 1,
    borderColor: 'divider',
  } as SxProps<Theme>,

  /**
   * Loading state container
   */
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    bgcolor: 'background.paper',
  } as SxProps<Theme>,

  /**
   * Loading stack
   */
  loadingStack: {
    alignItems: 'center',
  } as SxProps<Theme>,

  /**
   * Error state container
   */
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    bgcolor: 'background.paper',
    border: '1px dashed',
    borderColor: 'error.main',
    borderRadius: 1,
  } as SxProps<Theme>,

  /**
   * Error stack
   */
  errorStack: {
    alignItems: 'center',
  } as SxProps<Theme>,

  /**
   * No data container
   */
  noDataContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    bgcolor: 'background.paper',
    border: '1px dashed',
    borderColor: 'divider',
    borderRadius: 1,
  } as SxProps<Theme>,

  /**
   * No indicator selected container
   */
  noIndicatorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    bgcolor: 'background.paper',
  } as SxProps<Theme>,

  /**
   * Map content container
   */
  mapContentContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  } as SxProps<Theme>,

  /**
   * Sidebar container
   */
  sidebarContainer: (
    isHealthIndicatorsOpen: boolean,
    sidebarWidth: string | number
  ): SxProps<Theme> => ({
    flex: isHealthIndicatorsOpen
      ? `0 0 ${typeof sidebarWidth === 'string' ? sidebarWidth : `${sidebarWidth}%`}`
      : '0 0 0',
    bgcolor: 'background.paper',
    borderLeft: isHealthIndicatorsOpen ? 1 : 0,
    borderColor: 'divider',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    transition: 'flex 0.15s ease-out, border-width 0.15s ease-out',
    willChange: 'flex',
    visibility: isHealthIndicatorsOpen ? 'visible' : 'hidden',
    '@media (max-width: 960px)': { display: 'none' },
  }),

  /**
   * Sidebar header
   */
  sidebarHeader: {
    p: 2,
    borderBottom: 1,
    borderColor: 'divider',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    position: 'relative',
    zIndex: 1,
  } as SxProps<Theme>,

  /**
   * Sidebar title
   */
  sidebarTitle: {
    flex: 1,
  } as SxProps<Theme>,

  /**
   * Collapse button
   */
  collapseButton: {
    ml: 1,
    flexShrink: 0,
    cursor: 'pointer',
    position: 'relative',
    zIndex: 2,
    pointerEvents: 'auto',
    minWidth: 'auto',
    px: 1.5,
    py: 0.5,
    '&:hover': {
      bgcolor: 'action.hover',
      borderColor: 'primary.main',
    },
  } as SxProps<Theme>,

  /**
   * Collapsed sidebar button container
   */
  collapsedSidebarContainer: {
    bgcolor: 'background.paper',
    borderLeft: 1,
    borderColor: 'divider',
    display: 'flex',
    alignItems: 'flex-start',
    width: 48,
    '@media (max-width: 960px)': { display: 'none' },
  } as SxProps<Theme>,

  /**
   * Expand sidebar button
   */
  expandButton: {
    width: '100%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 0.5,
    pt: 2,
    pointerEvents: 'auto',
    '&:hover': {
      bgcolor: 'action.hover',
    },
  } as SxProps<Theme>,

  /**
   * Sidebar title vertical text
   */
  sidebarTitleVertical: {
    fontSize: '0.7rem',
    writingMode: 'vertical-rl',
    textOrientation: 'mixed',
  } as SxProps<Theme>,
};

