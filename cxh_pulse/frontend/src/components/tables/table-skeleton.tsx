import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Skeleton } from '@mui/material';
import type { DataTableColumn } from '../../types';
import { tableStyles } from '../../styles/components/table.styles';
import { TableToolbarSkeleton } from './table-toolbar-skeleton';
import { SKELETON_TABLE_ROW } from '../../types/table.types';

export function TableSkeleton(
  {
    columns,
    isLazy,
    skeletonRows = SKELETON_TABLE_ROW,
  }: {
    columns: DataTableColumn[];
    isLazy?: boolean;
    skeletonRows?: number
  }) {
  return (
    <Box>
      {!isLazy && <TableToolbarSkeleton />}
      <TableContainer>
        <Table sx={tableStyles.skeletonTable}>
          {/* Table header */}
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  sx={tableStyles.skeletonHeaderCell}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {[...Array(skeletonRows)].map((_, index) => (
              <TableRow key={index}>
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align}>
                    <Skeleton variant="text" width={100} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
