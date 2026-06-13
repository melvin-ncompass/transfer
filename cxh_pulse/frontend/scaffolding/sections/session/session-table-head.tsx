import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';

import { visuallyHidden } from './utils';

// ----------------------------------------------------------------------

type SessionTableHeadProps = {
  orderBy: string;
  rowCount: number;
  numSelected: number;
  order: 'asc' | 'desc';
  onSort: (id: string) => void;
  headLabel: Array<{
    id: string;
    label: string;
    align?: 'left' | 'center' | 'right' | 'justify' | 'inherit';
    width?: number | string;
    minWidth?: number | string;
  }>;
  onSelectAllRows: (checked: boolean) => void;
};

export function SessionTableHead({
  order,
  onSort,
  orderBy,
  rowCount,
  headLabel,
  numSelected,
  onSelectAllRows,
}: SessionTableHeadProps) {
  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
             <Checkbox
               indeterminate={numSelected > 0 && numSelected < rowCount}
               checked={rowCount > 0 && numSelected === rowCount}
               onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                 onSelectAllRows(event.target.checked)
               }
               inputProps={{
                 'aria-label': 'Select all users',
               }}
               color="primary"
             />
        </TableCell>

        {headLabel.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.align || 'left'}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{ width: headCell.width, minWidth: headCell.minWidth }}
            aria-sort={orderBy === headCell.id ?
              (order === 'asc' ? 'ascending' : 'descending') :
              undefined
            }
          >
            <TableSortLabel
              hideSortIcon
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={() => onSort(headCell.id)}
              tabIndex={0}
              aria-label={`Sort by ${headCell.label}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSort(headCell.id);
                }
              }}
              sx={{
                '&:focus-visible': {
                  outline: '2px solid #3f51b5',
                  outlineOffset: '2px',
                  borderRadius: '4px',
                },
              }}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box sx={{ ...visuallyHidden }}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
