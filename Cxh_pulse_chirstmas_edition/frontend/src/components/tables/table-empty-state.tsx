import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import { tableStyles } from '../../styles/components/table.styles';
import type { TableEmptyStateProps } from '../../types/component.types';

// ----------------------------------------------------------------------

export function TableEmptyState({ message = 'No data available', colSpan = 3, ...other }: TableEmptyStateProps) {
  return (
    <TableRow {...other}>
      <TableCell align="center" colSpan={colSpan}>
        <Box sx={tableStyles.emptyStateContainer}>
          <Typography variant="h6" sx={tableStyles.emptyStateTitle}>
            {message}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            There are no records to display at this time.
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
}
