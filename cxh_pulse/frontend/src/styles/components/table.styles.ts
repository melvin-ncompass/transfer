import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Table Component Styles
 * 
 * Extracted sx props for table components
 */

export const tableStyles = {
  /**
   * Table container
   */
  container: {
    overflow: 'unset',
  } as SxProps<Theme>,

  /**
   * Toolbar styles
   */
  toolbar: {
    minHeight: 80,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    px: { xs: 1, md: 2 },
    py: {sm: 1},
    minWidth: 200,
    gap: 2,
  } as SxProps<Theme>,

  /**
   * Left action container
   */
  leftActionContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: { xs: 0, md: 1 },
    flex: '0 0 auto',
  } as SxProps<Theme>,

  /**
   * Search text field
   */
  searchField: {
    width: { xs:140, sm: 180, md: 220},
    '& .MuiInputBase-input': {
      fontSize: '14px',
    },
  } as SxProps<Theme>,

  /**
   * Middle action container
   */
  middleActionContainer: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  } as SxProps<Theme>,

  /**
   * Middle action container (small screen)
   */
  middleActionContainerSmall: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    flexBasis: { xs: '100%', sm: '100%', md: 'auto', lg: 'auto' },
  } as SxProps<Theme>,

  /**
   * Right action container
   */
  rightActionContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    flex: '0 0 auto',
    ml: { xs: 'auto', sm: 'auto', md: 0 },
  } as SxProps<Theme>,

  /**
   * Table no data container
   */
  noDataContainer: {
    py: 15,
    textAlign: 'center',
    maxWidth: { xs: 'inherit', lg: 1450 },
  } as SxProps<Theme>,

  /**
   * Table no data title
   */
  noDataTitle: {
    mb: 1,
  } as SxProps<Theme>,

  /**
   * Table no data text
   */
  noDataText: {
    wordWrap: 'break-word',
    wordBreak: 'break-word',
    display: 'block',
  } as SxProps<Theme>,

  /**
   * Table skeleton
   */
  skeletonTable: {
    minWidth: 800,
    height: '100%'
  } as SxProps<Theme>,

  /**
   * Table skeleton header cell
   */
  skeletonHeaderCell: {
    backgroundColor: 'var(--brand-header-surface)',
    color: 'var(--brand-header-text)',
  } as SxProps<Theme>,

  /**
   * Table empty state container
   */
  emptyStateContainer: {
    py: 10,
    textAlign: 'center',
  } as SxProps<Theme>,

  /**
   * Table empty state title
   */
  emptyStateTitle: {
    mb: 1,
  } as SxProps<Theme>,

  /**
   * Basic table styles
   */
  basicTable: {
    '& .MuiTableRow-root': {
      '&:last-child td': {
        borderBottom: 'none',
      },
    },
    '& .MuiTableCell-root': {
      borderBottom: '1px solid',
      borderColor: 'divider',
      py: 1.5,
    },
    '& .MuiTableHead-root .MuiTableCell-root': {
      fontWeight: 'fontWeightBold',
      borderBottom: '2px solid',
      borderColor: 'divider',
      py: 1.5,
    },
  } as SxProps<Theme>,

  /**
   * Search icon in toolbar
   */
  searchIcon: {
    color: 'text.disabled',
  } as SxProps<Theme>,
};

