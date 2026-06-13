import { useState, useCallback, useMemo, useEffect, useRef, Fragment } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';

import { TableToolbar } from './table-toolbar';
import { TableNoData } from './table-no-data';
import { TableSkeleton } from './table-skeleton';
import { dataTableStyles } from '../../styles/components/data-table.styles';
import type { DataTableProps } from '../../types';
import { calculateTableMaxHeight } from './utils/table-height';
import { Iconify } from '../iconify';
import { Typography } from '@mui/material';

// export type SortOrder = 'asc' | 'desc';

interface LazyDataTableProps<Row> extends DataTableProps<Row> {
  onLoadMore: () => void;
  hasMore: boolean;
  debouncedFilterName: string;
  isFetchingNextPage: boolean;
  page: number;
  isLazy?: boolean;
  initialLoad?: boolean;
  hideSearch?: boolean;
  hasError?: boolean; // Add error state to prevent infinite retries
  getRowProps?: (row: Row) => Record<string, any>; // Custom props for TableRow
  // orderBy: string;
  // order: SortOrder;
  // setOrderBy: React.Dispatch<React.SetStateAction<string>>;
  // setOrder: React.Dispatch<React.SetStateAction<SortOrder>>;
}

export function LazyDataTable<Row>({
  columns,
  rows,
  getRowId,
  renderCells,
  filterName,
  onFilterName,
  rightAction,
  leftAction,
  middleAction,
  onRowClick,
  isLoading,
  debouncedFilterName,
  isFetchingNextPage,
  hasMore,
  onLoadMore,
  renderExpandedRow,
  placeholder,
  sortFn,
  hideToolbar = false,
  hideSearch = false,
  defaultSortBy,
  defaultSortOrder = 'desc',
  page,
  isLazy,
  initialLoad,
  tableHeight = 'calc(100vh - 180px)',
  skeletonRows = 9,
  hasError = false, // Default to false if not provided
  getRowProps,
  // order,
  // orderBy,
  // setOrder,
  // setOrderBy,
}: LazyDataTableProps<Row>) {
  const theme = useTheme();

  const [orderBy, setOrderBy] = useState<string>(defaultSortBy || '');
  const [order, setOrder] = useState<'asc' | 'desc'>(
    defaultSortBy ? defaultSortOrder : 'asc'
  );
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLTableRowElement>(null);

  const toggleRowExpansion = useCallback((rowId: string | number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);

      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }

      return next;
    });
  }, []);


  /* Intersection Observer (lazy loading) */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Prevent loading more if: no more data, currently fetching, loading, or has error
        if (!hasMore || isFetchingNextPage || isLoading || hasError) return;
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: containerRef.current,
        rootMargin: '0px 0px 500px 0px',
        threshold: 0,
      }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    const obs = observerTarget.current;

    return () => {
      if (obs) observer.unobserve(obs);
    };
  }, [hasMore, isFetchingNextPage, isLoading, hasError, onLoadMore]);

  /* Sorting */
  const handleSort = useCallback(
    (columnId: string) => {
      // CASE 1: no sort state → ASC
      if (orderBy !== columnId) {
        setOrderBy(columnId);
        setOrder('asc');
        return;
      }

      // CASE 2: ASC → DESC
      if (order === 'asc') {
        setOrder('desc');
        return;
      }

      // CASE 3: DESC → no sort state
      setOrderBy('');
      setOrder('asc');
    },
    [orderBy, order]
  );

  /* Filter + Sort rows */
  const visibleRows = useMemo(() => {
    const processed = [...rows];

    if (orderBy) {
      const column = columns.find((col) => col.id === orderBy);
      if (column && column.sortable !== false) {
        processed.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          if (sortFn) {
            aValue = sortFn(a, orderBy);
            bValue = sortFn(b, orderBy);
          } else {
            const aCells = renderCells(a);
            const bCells = renderCells(b);
            const colIndex = columns.findIndex((col) => col.id === orderBy);
            aValue = aCells[colIndex];
            bValue = bCells[colIndex];
          }

          if (typeof aValue === 'string') {
            return order === 'asc'
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }

          return order === 'asc'
            ? (aValue as number) - (bValue as number)
            : (bValue as number) - (aValue as number);
        });
      }
    }

    return processed;
  }, [rows, orderBy, order, columns, sortFn, renderCells]);

  // /* Filter + Sort rows */
  // const visibleRows = useMemo(() => {
  //   const processed = [...rows];
  
  // can remove the whole middle section as sorting and ordering
  // will be done via backend and we only need to handle the change 
  // logic 

  //   return processed;
  // }, [rows, orderBy, order, columns, sortFn, renderCells]);

  const notFound = !visibleRows.length && !!filterName && !isLoading;
  const isEmpty = !visibleRows.length && !filterName && !isLoading;

  const tableMaxHeight = useMemo(
    () =>
      calculateTableMaxHeight(
        visibleRows.length,
        renderExpandedRow,
        expandedRows.size,
        notFound,
        isEmpty
      ),
    [visibleRows.length, renderExpandedRow, expandedRows.size, notFound, isEmpty]
  );

  if (isLoading && page === 1 && initialLoad) {
    return (
      <TableSkeleton
        columns={columns}
        isLazy={isLazy}
        skeletonRows={skeletonRows}
      />
    );
  }

  return (
    <>
      {!hideToolbar && (
        <TableToolbar
          filterName={filterName}
          onFilterName={onFilterName}
          rightAction={rightAction}
          leftAction={leftAction}
          middleAction={middleAction}
          placeholder={placeholder}
          hideSearch={hideSearch}
        />
      )}

      <TableContainer
        ref={containerRef}
        sx={{
          overflowY: 'auto',
          position: 'relative',
          ...dataTableStyles.tableContainer(
            tableHeight,
            tableMaxHeight,
            true,
            notFound,
            isEmpty
          ),
        }}
      >
        <Table stickyHeader sx={dataTableStyles.table}>
          {/* Table header */}
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  sortDirection={orderBy === col.id ? order : false}
                  sx={dataTableStyles.headerCell(
                    col.id === 'overallChange',
                    col.id === 'indicatorCount',
                    col
                  )}
                >
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                      sx={dataTableStyles.sortLabel(col.id === 'overallChange')}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* Table body */}
          <TableBody>
            {visibleRows.map((row) => {
              const rowId = getRowId(row);
              const isExpanded = expandedRows.has(rowId);
              const cells = renderCells(row);

              let cellIndex = 0;

              const rowProps = getRowProps ? getRowProps(row) : {};
              
              return (
                <Fragment key={rowId}>
                  <TableRow
                    hover
                    sx={dataTableStyles.tableRow(theme)}
                    {...rowProps}
                  >
                    {/* Render each cell */}
                    {columns.map((col, idx) => {
                      const columnId = columns[idx]?.id;
                      const isChangeColumn = columnId === 'overallChange';
                      const isCountColumn = columnId === 'indicatorCount';
                      if (col.id === 'expand') {
                        return (
                          <TableCell key="expand" align="center">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpansion(rowId);
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
                        );
                      }

                      const cell = cells[cellIndex];
                      cellIndex += 1;

                      return (
                        <TableCell
                          key={col.id}
                          align={col.align}
                          sx={dataTableStyles.tableCell(
                            isChangeColumn,
                            isCountColumn,
                            col,
                            onRowClick,
                            renderExpandedRow
                          )}
                        >
                          {cell}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Expanded row content */}
                  {renderExpandedRow && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        sx={{ py: 0, borderBottom: 'none' }}
                      >
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2 }}>
                            {renderExpandedRow(row)}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}

            <TableRow ref={observerTarget} style={{ height: 1 }}>
              <TableCell colSpan={columns.length} style={{ visibility: 'hidden' }} />
            </TableRow>

            {isLoading && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <CircularProgress size={28} />
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {notFound && (
              <TableNoData searchQuery={filterName} colSpan={columns.length} />
            )}

            {isEmpty && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Box sx={{ py: 8 }}>
                    <Typography variant="h6" gutterBottom>
                      No Data Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      There are no records to display at this time.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
