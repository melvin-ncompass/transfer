import { useState, useCallback, useMemo, useEffect, useRef, Fragment } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { Iconify } from '../iconify';
import { TableToolbar } from './table-toolbar';
import { TableEmptyRows } from './table-empty-rows';
import { TableNoData } from './table-no-data';
import { TableEmptyState } from './table-empty-state';
import type { DataTableProps } from '../../types';
import { TableSkeleton } from './table-skeleton';
import { dataTableStyles } from '../../styles/components/data-table.styles';
import { calculateTableMaxHeight, shouldEnableScrolling } from './utils/table-height';


/**
 * DataTable - Interactive table with search, pagination, and filtering
 *
 * Use when:
 * - Displaying user-facing data that needs interaction
 * - Lists with more than 10-20 items
 * - You need search/filter functionality
 * - Users need to click rows to view details
 * - Managing collections (users, roles, products, etc.)
 *
 * For simple, static lists without these features, use BasicTable instead
 *
 * Features:
 * - Built-in search toolbar
 * - Pagination controls
 * - Custom filtering logic
 * - Clickable rows (optional)
 * - Hover effects
 * - Action button in toolbar (e.g., "Add New")
 * - Smooth scrolling
 * - Minimum width (800px) for proper layout
 *
 * @example
 * ```tsx
 * const [filterName, setFilterName] = useState('');
 *
 * <DataTable
 *   columns={[
 *     { id: 'name', label: 'Name', align: 'left' },
 *     { id: 'email', label: 'Email', align: 'left' },
 *     { id: 'role', label: 'Role', align: 'center' },
 *     { id: 'actions', label: 'Actions', align: 'right' },
 *   ]}
 *   rows={users}
 *   getRowId={(row) => row.id}
 *   filterName={filterName}
 *   onFilterName={(e) => setFilterName(e.target.value)}
 *   filterFn={(row, filter) =>
 *     row.name.toLowerCase().includes(filter.toLowerCase()) ||
 *     row.email.toLowerCase().includes(filter.toLowerCase())
 *   }
 *   onRowClick={(row) => navigate(`/users/${row.id}`)}
 *   rightAction={
 *     <PrimaryButton onClick={handleAddUser}>
 *       Add User
 *     </PrimaryButton>
 *   }
 *   renderCells={(row) => [
 *     row.name,
 *     row.email,
 *     <Label color="info">{row.role}</Label>,
 *     <IconButton onClick={() => handleEdit(row.id)}>
 *       <Iconify icon="solar:pen-bold" />
 *     </IconButton>,
 *   ]}
 *   rowsPerPageOptions={[5, 10, 25, 50]}
 * />
 * ```
 */

export function DataTable<Row>({
  columns,
  rows,
  getRowId,
  renderCells,
  filterName,
  onFilterName,
  rightAction,
  leftAction,
  middleAction,
  rowsPerPageOptions = [5, 10, 25],
  filterFn,
  onRowClick,
  isLoading,
  renderExpandedRow,
  placeholder,
  sortFn,
  hideToolbar = false,
  disablePagination = false,
  defaultSortBy,
  defaultSortOrder = 'desc',
  tableHeight = 'calc(100vh - 180px)',
  isLazy,
  skeletonRows = 9,
}: DataTableProps<Row>) {
  const theme = useTheme();
  // Pagination state
  const [page, setPage] = useState(0); // Current page number
  const [rowsPerPage, setRowsPerPage] = useState(10); // Rows per page
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set()); // Track expanded rows

  // Sorting state - initialize with default sort if provided
  const [orderBy, setOrderBy] = useState<string>(defaultSortBy || '');
  const [order, setOrder] = useState<'asc' | 'desc'>(defaultSortBy ? defaultSortOrder : 'asc');

  const tableContainerRef = useRef<HTMLDivElement | null>(null);



  /**
   * resets page index to 0 for searching through all data
   */
  useEffect(() => {
    setPage(0);
  }, [filterName])

  /**
   * Handles page change in pagination
   * Scrolls table container to top when page changes
   */
  const onChangePage = useCallback(
    (_: unknown, newPage: number) => {
      setPage(newPage);
      // Scroll table container to top when page changes
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    },
    []
  );

  /**
   * Handles rows per page change
   * Resets to first page when changing rows per page
   */
  const onChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page
  }, []);

  /**
   * Handles column sort
   * Toggles between asc, desc, and no sort
   */
  const handleSort = useCallback(
    (columnId: string) => {
      // CASE 1: no sort state → ASC
      if (orderBy !== columnId) {
        setOrderBy(columnId);
        setOrder('asc');
        setPage(0);
        return;
      }

      // CASE 2: ASC → DESC
      if (order === 'asc') {
        setOrder('desc');
        setPage(0);
        return;
      }

      // CASE 3: DESC → no sort state
      setOrderBy('');
      setOrder('asc');
      setPage(0);
    },
    [orderBy, order]
  );

  /**
   * Filter rows based on search input
   * - If filterName is empty, shows all rows
   * - If filterFn is provided, uses custom filter logic
   * - Otherwise, shows all rows (no filtering)
   */
  const filtered = useMemo(
    () =>
      filterName && filterName.trim().length > 0
        ? filterFn
          ? rows.filter((r) => filterFn(r, filterName))
          : rows
        : rows,
    [rows, filterName, filterFn]
  );

  /**
   * Sort filtered rows
   * - If sortFn is provided, uses custom sort logic
   * - Otherwise, tries to extract value from renderCells
   */
  const sorted = useMemo(() => {
    if (!orderBy) return filtered;

    const column = columns.find((col) => col.id === orderBy);
    if (!column || column.sortable === false) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortFn) {
        aValue = sortFn(a, orderBy);
        bValue = sortFn(b, orderBy);
      } else {
        // Try to extract value from renderCells (fallback)
        const aCells = renderCells(a);
        const bCells = renderCells(b);
        const colIndex = columns.findIndex((col) => col.id === orderBy);
        aValue = aCells[colIndex] as string | number;
        bValue = bCells[colIndex] as string | number;
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      // Handle number comparison
      const aNum = typeof aValue === 'number' ? aValue : parseFloat(String(aValue));
      const bNum = typeof bValue === 'number' ? bValue : parseFloat(String(bValue));

      if (isNaN(aNum) || isNaN(bNum)) {
        // Fallback to string comparison if not numbers
        return order === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      }

      return order === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }, [filtered, orderBy, order, columns, sortFn, renderCells]);
  /**
   * Slice sorted rows for current page
   * If pagination is disabled, show all rows
   */
  const sliced = disablePagination
    ? sorted
    : sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  /**
   * Calculate empty rows for consistent table height
   */
  const emptyRowsCount = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - sorted.length) : 0;

  /**
   * Check if no data found after filtering
   */
  const notFound = !sorted.length && !!filterName;

  /**
   * Check if table is completely empty (no data at all)
   * Don't show empty state when loading
   */
  const isEmpty = !sorted.length && !filterName && !isLoading;

  const tableMaxHeight = useMemo(
    () => calculateTableMaxHeight(sliced.length, renderExpandedRow, expandedRows.size, notFound, isEmpty),
    [sliced.length, renderExpandedRow, expandedRows.size, notFound, isEmpty]
  );

  const enableScrolling = useMemo(
    () => shouldEnableScrolling(sliced.length, renderExpandedRow, expandedRows.size, notFound, isEmpty),
    [sliced.length, renderExpandedRow, expandedRows.size, notFound, isEmpty]
  );


  // Track previous rows length to detect filter changes
  const prevRowsLengthRef = useRef<number>(rows.length);

  // Reset page to 0 when data length changes and current page is out of bounds
  // Also reset when rows prop changes significantly (filter change)
  useEffect(() => {
    if (!disablePagination) {
      const rowsChanged = prevRowsLengthRef.current !== rows.length;
      prevRowsLengthRef.current = rows.length;

      if (sorted.length === 0) {
        // Reset to page 0 when there's no data
        setPage(0);
      } else {
        const maxPage = Math.max(0, Math.ceil(sorted.length / rowsPerPage) - 1);
        // Reset page if out of bounds or if rows prop changed significantly (filter change)
        if (page > maxPage || (rowsChanged && page > 0)) {
          setPage(0);
        }
      }
    }
  }, [sorted.length, rowsPerPage, page, disablePagination, rows.length]);

  // Scroll table container to top whenever page changes
  useEffect(() => {
    if (!disablePagination && tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [page, disablePagination]);

  if (isLoading) {
    return <TableSkeleton columns={columns} isLazy={isLazy} skeletonRows={skeletonRows} />;
  }

  return (
    <Box>
      {/* Search toolbar with optional action button */}
      {!hideToolbar && (
        <TableToolbar
          filterName={filterName}      // Current search/filter value
          onFilterName={onFilterName}  // Search input change handler
          rightAction={rightAction}    // Optional button (e.g., "Add User")
          leftAction={leftAction}
          middleAction={middleAction} // Optional middle action (e.g., date range slider)
          placeholder={placeholder}
        />
      )}

      <TableContainer
        ref={tableContainerRef}
        sx={dataTableStyles.tableContainer(tableHeight, tableMaxHeight, enableScrolling, notFound, isEmpty)}
      >
        {/* Minimum width ensures proper layout on smaller screens */}
        <Table stickyHeader sx={dataTableStyles.table}>
          {/* Table header */}
          <TableHead>
            <TableRow>
              {columns.map((col) => {
                const isSortable = col.sortable !== false;
                const isChangeColumn = col.id === 'overallChange';
                const isCountColumn = col.id === 'indicatorCount';
                return (
                  <TableCell
                    key={col.id}
                    align={col.align}
                    sortDirection={orderBy === col.id ? order : false}
                    sx={dataTableStyles.headerCell(isChangeColumn, isCountColumn, col)}
                  >
                    {isSortable ? (
                      <TableSortLabel
                        active={orderBy === col.id}
                        direction={orderBy === col.id ? order : 'asc'}
                        onClick={() => handleSort(col.id)}
                        sx={dataTableStyles.sortLabel(isChangeColumn)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                );
              })}
              {renderExpandedRow && (
                <TableCell sx={dataTableStyles.expandHeaderCell} />
              )}
            </TableRow>
          </TableHead>

          {/* Table body - only shows current page's rows */}
          <TableBody>
            {sliced.map((row) => {
              // Render cells for this row
              const cells = renderCells(row);
              const rowId = getRowId(row);
              const isExpanded = expandedRows.has(rowId);

              return (
                <Fragment key={rowId}>
                  <TableRow
                    hover // Shows hover effect
                    sx={dataTableStyles.tableRow(theme)}
                  >
                    {/* Render each cell */}
                    {cells.map((cell, idx) => {
                      const columnId = columns[idx]?.id;
                      const isChangeColumn = columnId === 'overallChange';
                      const isCountColumn = columnId === 'indicatorCount';
                      return (
                        <TableCell
                          key={columnId ?? idx}
                          align={columns[idx]?.align}
                          onClick={
                            onRowClick && !renderExpandedRow ? () => onRowClick(row) : undefined
                          }
                          sx={dataTableStyles.tableCell(isChangeColumn, isCountColumn, columns[idx], onRowClick, renderExpandedRow)}
                        >
                          {cell}
                        </TableCell>
                      );
                    })}
                    {/* Expand/Collapse button */}
                    {renderExpandedRow && (
                      <TableCell sx={dataTableStyles.expandButtonCell}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const newExpanded = new Set(expandedRows);
                            if (isExpanded) {
                              newExpanded.delete(rowId);
                            } else {
                              newExpanded.add(rowId);
                            }
                            setExpandedRows(newExpanded);
                          }}
                        >
                          <Iconify
                            icon={
                              isExpanded
                                ? 'eva:arrow-ios-upward-fill'
                                : 'eva:arrow-ios-downward-fill'
                            }
                            width={20}
                          />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                  {/* Expanded row content */}
                  {renderExpandedRow && (
                    <TableRow>
                      <TableCell sx={dataTableStyles.expandedRowCell} colSpan={columns.length + 1}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={dataTableStyles.expandedContentBox}>{renderExpandedRow(row)}</Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}

            {/* Empty rows to maintain consistent table height */}
            {!disablePagination && <TableEmptyRows height={68} emptyRows={emptyRowsCount} />}

            {/* Show "no data" message when search returns no results */}
            {notFound && (
              <TableNoData
                searchQuery={filterName}
                colSpan={columns.length + (renderExpandedRow ? 1 : 0)}
              />
            )}

            {/* Show empty state when there's no data at all */}
            {isEmpty && <TableEmptyState message="No data available" colSpan={columns.length} />}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination controls */}
      {!disablePagination && (
        <TablePagination
          component="div"
          page={page} // Current page (0-indexed)
          count={sorted.length} // Total number of sorted rows
          rowsPerPage={rowsPerPage} // Rows per page
          onPageChange={onChangePage} // Page change handler
          rowsPerPageOptions={rowsPerPageOptions} // Available rows per page options
          onRowsPerPageChange={onChangeRowsPerPage} // Rows per page change handler
        />
      )}
    </Box>
  );
}
