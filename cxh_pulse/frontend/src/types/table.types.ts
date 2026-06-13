import type { ReactNode } from 'react';

/**
 * Table Types and Interfaces
 *
 * This file contains all type definitions for table components
 */

/**
 * Column configuration for BasicTable
 *
 * Defines the structure of table columns including:
 * - Unique identifier
 * - Header label (text or component)
 * - Text alignment options
 */
export type BasicTableColumn = {
  id: string; // Unique column identifier
  label: ReactNode; // Column header text/content
  align?: 'left' | 'right' | 'center' | 'inherit' | 'justify'; // Text alignment
};

/**
 * Props for BasicTable component
 *
 * Generic type parameter <Row> allows for type-safe row data
 */
export type BasicTableProps<Row> = {
  columns: BasicTableColumn[]; // Array of column configurations
  rows: Row[]; // Array of data rows
  getRowId: (row: Row) => string | number; // Function to extract unique ID from row
  renderCells: (row: Row) => ReactNode[]; // Function to render cells for each row
};

/**
 * Column configuration for DataTable
 *
 * Same structure as BasicTableColumn
 * Separated for clarity and potential future differences
 */
export type DataTableColumn<Row = any> = {
  id: string; // Unique column identifier
  label: ReactNode; // Column header text/content
  align?: 'left' | 'right' | 'center' | 'inherit' | 'justify'; // Text alignment
  sortable?: boolean; // Whether the column is sortable (default: true)
  width?: string | number; // Column width (e.g., '200px', '30%', 200)
  minWidth?: string | number; // Minimum column width
  maxWidth?: string | number; // Maximum column width
  valueGetter?: (row: Row) => string | number; // Optional function to extract sortable value from row
  isLazy?: boolean; // Whether the table is lazy-loaded
};

/**
 * Props for DataTable component
 *
 * Includes all features for interactive tables:
 * - Search/filter functionality
 * - Pagination options
 * - Custom filtering logic
 * - Row click handling
 * - Action buttons
 *
 * Generic type parameter <Row> allows for type-safe row data
 */
export type DataTableProps<Row> = {
  columns: DataTableColumn[]; // Array of column configurations
  rows: Row[]; // Array of data rows
  getRowId: (row: Row) => string | number; // Function to extract unique ID
  renderCells: (row: Row) => ReactNode[]; // Function to render cells
  filterName: string; // Current filter/search value
  onFilterName: (event: React.ChangeEvent<HTMLInputElement>) => void; // Filter change handler
  rightAction?: ReactNode; // Optional action button (e.g., "Add User")
  leftAction?: ReactNode;
  middleAction?: ReactNode; // Optional middle action (e.g., date range slider)
  rowsPerPageOptions?: number[]; // Pagination options (default: [5, 10, 25])
  filterFn?: (row: Row, filter: string) => boolean; // Custom filter function
  onRowClick?: (row: Row) => void; // Optional row click handler
  isLoading?: boolean; // Loading state
  renderExpandedRow?: (row: Row) => ReactNode; // Optional function to render expanded row content
  placeholder?: string; // Search input placeholder text
  sortFn?: (row: Row, columnId: string) => string | number; // Custom sort function to extract sortable value from row
  hideToolbar?: boolean; // Whether to hide the toolbar
  disablePagination?: boolean; // Whether to disable pagination and show all rows
  defaultSortBy?: string; // Default column ID to sort by
  defaultSortOrder?: 'asc' | 'desc'; // Default sort order (default: 'desc' for descending)
  tableHeight?: string;
  isLazy?: boolean;
  skeletonRows?: number;
};

export const SKELETON_TABLE_ROW = 7;
