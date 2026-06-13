import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Skeleton } from '@mui/material';
import type { DataTableColumn } from '../../types';
import { tableStyles } from '../../styles/components/table.styles';

export function TableSkeleton({ columns }: { columns: DataTableColumn[] }) {
  return (
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
          {[...Array(5)].map((_, index) => (
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
  );
}
