import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import { tableStyles } from '../../styles/components/table.styles';
import type { TableNoDataProps } from '../../types/component.types';

// ----------------------------------------------------------------------

export function TableNoData(props: TableNoDataProps) {
  const { searchQuery, colSpan = 7, ...rest } = props;
  // Remove colSpan from rest to avoid passing it to TableRow
  const { colSpan: _, ...tableRowProps } = rest as any;
  return (
    <TableRow {...tableRowProps}>
      <TableCell align="center" colSpan={colSpan}>
        <Box sx={tableStyles.noDataContainer}>
          <Typography variant="h6" sx={tableStyles.noDataTitle}>
            Not found
          </Typography>

          <Typography variant="body2" sx={tableStyles.noDataText}>
            No results found for &nbsp;
            <strong>&quot;{searchQuery}&quot;</strong>.
            <br /> Try checking for typos or using complete words.
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
}
