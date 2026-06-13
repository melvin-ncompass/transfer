import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Climate and Health Filter Styles
 * 
 * Extracted sx props for climate-and-health-filter component
 */

export const climateAndHealthFilterStyles = {
  /**
   * Main container
   */
  container: {
    p: 1.5,
    bgcolor: 'background.paper',
    borderBottom: 1,
    borderColor: 'divider',
    flexShrink: 0,
  } as SxProps<Theme>,

  /**
   * Filters stack
   */
  filtersStack: {
    flexWrap: 'wrap',
    gap: 2,
  } as SxProps<Theme>,

  /**
   * Date range container
   */
  dateRangeContainer: {
    flex: 1,
    minWidth: { xs: 180, md: 400 },
  } as SxProps<Theme>,
};
