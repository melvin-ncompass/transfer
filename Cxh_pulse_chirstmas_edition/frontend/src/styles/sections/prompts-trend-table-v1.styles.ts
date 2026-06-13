import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Prompts Trend Table V1 Styles
 * 
 * Extracted sx props for prompts-trend-table-v1 component
 */

export const promptsTrendTableV1Styles = {
  /**
   * Loading/Error container
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
    flexDirection: { xs: 'column', sm: 'row', md: 'row' },
    alignItems: { xs: 'flex-start', sm: 'center', md: 'center' },
    justifyContent: 'space-between',
    gap: 2,
    px: 2,
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
  } as SxProps<Theme>,

  /**
   * Title typography
   */
  title: (isTitleClickable: boolean): SxProps<Theme> => ({
    fontWeight: 600,
    color: 'text.primary',
    ...(isTitleClickable && {
      cursor: 'pointer',
      '&:hover': {
        textDecoration: 'underline',
      },
    }),
  }),

  /**
   * Filters container
   */
  filtersContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  } as SxProps<Theme>,

  /**
   * Form control (category select)
   */
  formControl: {
    width: 150,
  } as SxProps<Theme>,

  /**
   * Search text field
   */
  searchTextField: {
    width: { xs: 150, sm: 200, md: 200, lg: 210 },
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
   * Form control (when hideTitle is true)
   */
  formControlHidden: {
    minWidth: { xs: 120, md: 180 },
    width: { xs: 100 },
  } as SxProps<Theme>,

  /**
   * Search text field (when hideTitle is true)
   */
  searchTextFieldHidden: {
    width: { xs: 200, sm: 200, md: 250 },
    minWidth: { xs: 200 },
  } as SxProps<Theme>,

  /**
   * Table container
   */
  tableContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    px: 2,
    pb: 2,
    mt: 1,
  } as SxProps<Theme>,

  /**
   * Intent text (truncated)
   */
  intentText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 200,
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
