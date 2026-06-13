import { useState, useCallback, useMemo, useEffect, useRef, Fragment } from 'react'; // Added Fragment
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';

import { TableToolbar } from './table-toolbar';
import { TableNoData } from './table-no-data';
import { TableSkeleton } from './table-skeleton';
import { dataTableStyles } from '../../styles/components/data-table.styles';
import type { DataTableProps } from '../../types';
import { calculateTableMaxHeight } from './utils/table-height';

interface LazyDataTableProps<Row> extends DataTableProps<Row> {
  onLoadMore: () => void;
  hasMore: boolean;
  debouncedFilterName: string;
  isFetchingNextPage: boolean;
  page: number;
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
  defaultSortBy,
  defaultSortOrder = 'desc',
  page
}: LazyDataTableProps<Row>) {
  const theme = useTheme();
  
  const [orderBy, setOrderBy] = useState<string>(defaultSortBy || '');
  const [order, setOrder] = useState<'asc' | 'desc'>(defaultSortBy ? defaultSortOrder : 'asc');
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());


  // Ref for the element
  const observerTarget = useRef<HTMLTableRowElement>(null);

  // --- Intersection Observer Logic ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!hasMore || isFetchingNextPage || isLoading) { return; }
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    const obs = observerTarget.current;

    return () => {
      if (obs) {
        observer.unobserve(obs);
      }
    };
  }, [hasMore, isFetchingNextPage, isLoading, onLoadMore]);


  // Handle Sort
  const handleSort = useCallback(
    (columnId: string) => {
      const isAsc = orderBy === columnId && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(columnId);
    },
    [orderBy, order]
  );

  /* Filter & Sort Logic */
  const visibleRows = useMemo(() => {
    const processed = [...rows];
    if (orderBy) {
      const column = columns.find((col) => col.id === orderBy);
      if (column && column.sortable !== false) {
        processed.sort((a, b) => {
          let aValue: any, bValue: any;
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
             return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          }
          return order === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
        });
      }
    }
    return processed;
  }, [rows, orderBy, order, columns, sortFn, renderCells]);

  /**
   * Check if table is completely empty (no data at all)
   * Don't show empty state when loading
   */
  const notFound = !visibleRows.length && !!filterName;
  const isEmpty = !visibleRows.length && !filterName && !isLoading;

  /* Calculate height of Table */
  const tableMaxHeight = useMemo(
    () => calculateTableMaxHeight(visibleRows.length, renderExpandedRow, expandedRows.size, notFound, isEmpty),
    [visibleRows.length, renderExpandedRow, expandedRows.size, notFound, isEmpty]
  );

  if (isLoading && page === 1) {
    return <TableSkeleton columns={columns} />;
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
        />
      )}

      <TableContainer
        sx={{
          maxHeight: tableMaxHeight,
          overflowY: 'auto',
          position: 'relative',
          ...dataTableStyles.tableContainer(tableMaxHeight, true, notFound, isEmpty)
        }}
      >
        <Table stickyHeader sx={dataTableStyles.table}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  sortDirection={orderBy === col.id ? order : false}
                  sx={dataTableStyles.headerCell(col.id === 'overallChange', col.id === 'indicatorCount', col)}
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

          <TableBody>
            {visibleRows.map((row) => {
              const cells = renderCells(row);
              const rowId = getRowId(row);

              return (
                <Fragment key={rowId}>
                  <TableRow hover sx={dataTableStyles.tableRow(theme)}>
                    {cells.map((cell, idx) => (
                      <TableCell
                        key={columns[idx]?.id ?? idx}
                        align={columns[idx]?.align}
                        onClick={onRowClick && !renderExpandedRow ? () => onRowClick(row) : undefined}
                        sx={dataTableStyles.tableCell(false, false, columns[idx], onRowClick, renderExpandedRow)}
                      >
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                </Fragment>
              );
            })}

            {/* render sentinel */}
            <TableRow ref={observerTarget} style={{ height: 1 }}>
            <TableCell colSpan={columns.length + (renderExpandedRow ? 1 : 0)} style={{visibility: 'hidden'}} > </TableCell>
            </TableRow>

            {isLoading && (
              <TableRow>
                <TableCell colSpan={columns.length + (renderExpandedRow ? 1 : 0)} align="center" sx={{ py: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={28} />
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {notFound && (
              <TableNoData
                searchQuery={filterName}
                colSpan={columns.length + (renderExpandedRow ? 1 : 0)}
              />
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}