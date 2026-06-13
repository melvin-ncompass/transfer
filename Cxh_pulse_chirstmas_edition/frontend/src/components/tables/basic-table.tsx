import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import type { BasicTableProps } from '../../types';
import { tableStyles } from '../../styles/components/table.styles';

/**
 * BasicTable - Simple data table without pagination or search
 * 
 * Use when:
 * - Displaying small, static lists (< 20 items)
 * - Creating read-only data displays
 * - Building reports or summaries
 * - You don't need search, filter, or pagination
 * 
 * For interactive tables with search and pagination, use DataTable instead
 * 
 * Features:
 * - Clean, minimal styling
 * - Custom cell rendering
 * - Responsive column alignment
 * - Proper border styling
 * 
 * @example
 * ```tsx
 * const columns: BasicTableColumn[] = [
 *   { id: 'name', label: 'Name', align: 'left' },
 *   { id: 'email', label: 'Email', align: 'left' },
 *   { id: 'status', label: 'Status', align: 'center' },
 * ];
 * 
 * const users = [
 *   { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
 *   { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
 * ];
 * 
 * <BasicTable
 *   columns={columns}
 *   rows={users}
 *   getRowId={(row) => row.id}
 *   renderCells={(row) => [
 *     row.name,
 *     row.email,
 *     <Label color={row.status === 'Active' ? 'success' : 'error'}>
 *       {row.status}
 *     </Label>,
 *   ]}
 * />
 * ```
 */
export function BasicTable<Row>({ columns, rows, getRowId, renderCells }: BasicTableProps<Row>) {
  return (
    <TableContainer>
      <Table sx={tableStyles.basicTable}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.id} align={col.align}>{col.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const cells = renderCells(row);
            return (
              <TableRow key={getRowId(row)}>
                {cells.map((cell, idx) => (
                  <TableCell key={columns[idx]?.id ?? idx} align={columns[idx]?.align}>{cell}</TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
