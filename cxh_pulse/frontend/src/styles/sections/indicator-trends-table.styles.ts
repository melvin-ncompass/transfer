import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Indicator Trends Table Styles
 * 
 * Extracted sx props for indicator-trends-table component
 */

export const indicatorTrendsTableStyles = {
  /**
   * Loading/Error/Empty container
   */
  stateContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    py: 4,
  } as SxProps<Theme>,

  /**
   * Main container
   */
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  } as SxProps<Theme>,

  /**
   * Header container
   */
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    // px: 2,
    pt: 2,
    pb: 1,
  } as SxProps<Theme>,

  /**
   * Title container
   */
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    textWrap: 'nowrap',
    justifyContent: 'space-between'
  } as SxProps<Theme>,

  /**
   * Title typography
   */
  title: {
    fontWeight: 600,
    color: 'text.primary',
  } as SxProps<Theme>,

  /**
   * Hidden filters container
   */
  hiddenFiltersContainer: {
    display: 'none',
    // display: 'flex',
    alignItems: 'center',
    gap: 2,
    visibility: 'hidden',
  } as SxProps<Theme>,

  /**
   * Form control
   */
  formControl: {
    minWidth: 180,
  } as SxProps<Theme>,

  /**
   * Search text field
   */
  searchTextField: {
    width: 250,
  } as SxProps<Theme>,

  /**
   * Search icon
   */
  searchIcon: {
    color: 'text.disabled',
  } as SxProps<Theme>,

  /**
   * Filters row (when hideTitle is true)
   */
  filtersRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    mb: 2,
    gap: 2,
    px: 2,
    pt: 2,
  } as SxProps<Theme>,

  /**
   * Table container
   */
  tableContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  } as SxProps<Theme>,

  /**
   * Indicator text (truncated)
   */
  indicatorText: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'normal',
    maxWidth: '100%', 
  } as SxProps<Theme>,

  /**
   * Trend sparkline cell
   */
  trendCell: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    minWidth: 200,
  } as SxProps<Theme>,
};
