import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Data Table Component Styles
 * 
 * Extracted sx props for data-table component
 */

export const dataTableStyles = {
  /**
   * Table container with dynamic max height
   */
  tableContainer: (tableHeight: string, tableMaxHeight: string, shouldEnableScrolling: boolean, notFound: boolean, isEmpty: boolean): SxProps<Theme> => ({
    height: tableHeight,
    // overflowY: shouldEnableScrolling ? 'auto' : (notFound || isEmpty ? 'visible' : 'hidden'),
    overflowY: 'auto',
    overflowX: 'auto',
    width: '100%',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  }),

  /**
   * Table with sticky header
   */
  table: {
    '& .MuiTableHead-root': {
      zIndex: 10, // Lower than tooltip z-index
    },
    '& .MuiTableCell-head': {
      zIndex: 10, // Ensure header cells also have lower z-index
    },
  } as SxProps<Theme>,

  /**
   * Table header cell
   */
  headerCell: (isChangeColumn: boolean, isCountColumn: boolean, col: any): SxProps<Theme> => ({
    backgroundColor: 'var(--brand-header-surface)',
    color: 'var(--brand-header-text)',
    minWidth: col.minWidth ?? (isChangeColumn || isCountColumn ? '100px' : 'auto'),
    width: col.width ?? 'auto',
    maxWidth: col.maxWidth ?? 'none',
    whiteSpace: isChangeColumn ? 'nowrap' : 'normal',
  }),

  /**
   * Table sort label
   */
  sortLabel: (isChangeColumn: boolean): SxProps<Theme> => 
    isChangeColumn ? { whiteSpace: 'nowrap' } : {},

  /**
   * Expandable row header cell
   */
  expandHeaderCell: {
    width: 50,
    backgroundColor: 'var(--brand-header-surface)',
    color: 'var(--brand-header-text)',
  } as SxProps<Theme>,

  /**
   * Table row with hover effect
   */
  tableRow: (theme: Theme) => ({
    '&:hover': {
      backgroundColor: 'action.hover',
    },
    // Focus outline for accessibility (keyboard navigation)
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: '-2px',
    },
  }),

  /**
   * Expanded row content
   */
  expandedRow: {
    '& > *': {
      borderBottom: 'unset',
    },
  } as SxProps<Theme>,

  /**
   * Table cell styles
   */
  tableCell: (isChangeColumn: boolean, isCountColumn: boolean, col: any, onRowClick: any, renderExpandedRow: any): SxProps<Theme> => ({
    padding: '12px 16px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: col.maxWidth ?? (isChangeColumn || isCountColumn ? '120px' : '240px'),
    minWidth: col.minWidth ?? (isChangeColumn || isCountColumn ? '100px' : 'auto'),
    width: col.width ?? 'auto',
    display: 'table-cell',
    cursor: onRowClick && !renderExpandedRow ? 'pointer' : 'default',
    // Allow overflow for cells containing charts (e.g., trend sparkline)
    '&:has(.trend-sparkline-cell)': {
      overflow: 'visible',
    },
  }),

  /**
   * Expand button cell
   */
  expandButtonCell: {
    width: 50,
    padding: '8px',
  } as SxProps<Theme>,

  /**
   * Expanded row cell
   */
  expandedRowCell: {
    padding: 0,
    border: 0,
  } as SxProps<Theme>,

  /**
   * Expanded content box
   */
  expandedContentBox: {
    p: 2,
  } as SxProps<Theme>,
};

