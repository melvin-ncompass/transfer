import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import type { TableEmptyRowsProps } from '../../types/component.types';

// ----------------------------------------------------------------------

export function TableEmptyRows({ emptyRows, height, sx, ...other }: TableEmptyRowsProps) {
  if (!emptyRows) {
    return null;
  }

  return (
    <TableRow
      sx={[height && { height: height * emptyRows }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <TableCell colSpan={9} />
    </TableRow>
  );
}
