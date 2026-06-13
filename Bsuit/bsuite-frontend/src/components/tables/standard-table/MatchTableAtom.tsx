import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
} from '@mui/material';

export interface MatchTableColumn {
  field: string;
  headerName: string;
  headerAlign?: 'left' | 'right' | 'center';
  align?: 'left' | 'right' | 'center';
  width?: string;
  renderCell?: (row: any) => React.ReactNode;
}

export interface MatchTableRow {
  id: number | string;
  [key: string]: any;
}

export interface MatchTableAtomProps {
  columns: MatchTableColumn[];
  rows: MatchTableRow[];
  expandedContent?: (row: MatchTableRow) => React.ReactNode;
  tableHeight?: string;
  expandedRowIds?: (number | string)[];
}

export function MatchTableAtom({
  columns,
  rows,
  expandedContent,
  tableHeight = '65vh',
  expandedRowIds = [],
}: MatchTableAtomProps) {
  const theme = useTheme();

  return (
    <TableContainer
      component={Paper}
      sx={{
        maxHeight: tableHeight,
        borderRadius: 0,
        border: 'none',
        boxShadow: 'none',
      }}
    >
      <Table stickyHeader>
        {/* ─────────────── Table Header ─────────────── */}
        <TableHead>
          <TableRow
            sx={{
              '& th': {
                backgroundColor:
                  theme.palette.mode === 'light'
                    ? `${theme.palette.grey[300]} !important`
                    : `${theme.palette.grey[800]} !important`,
                color:
                  theme.palette.mode === 'light'
                    ? `${theme.palette.grey[800]} !important`
                    : `${theme.palette.grey[400]} !important`,
              },
            }}
          >
            {columns.map((col,i) => (
              <TableCell
                key={col.field}
                align={col.headerAlign || 'left'}
                sx={{
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                  width: col.width,
                  minWidth: i === 0 ? undefined : 150,
                }}
              >
                {col.headerName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        {/* ─────────────── Table Body ─────────────── */}
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                align="center"
                sx={{
                  py: 4,
                  fontWeight: 500,
                  color:
                    theme.palette.mode === 'light'
                      ? theme.palette.grey[600]
                      : theme.palette.grey[400],
                }}
              >
                No data available
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const isExpanded = expandedRowIds.includes(row.id);

              return (
                <React.Fragment key={row.id}>
                  {/* Main Row */}
                  <TableRow
                    hover
                    sx={{
                      backgroundColor: isExpanded
                        ? theme.palette.action.hover
                        : 'transparent',
                    }}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={`${row.id}-${col.field}`}
                        align={col.align || 'left'}
                        sx={{
                          py: 1,
                          whiteSpace: 'normal',
                          overflow: 'visible',
                          textOverflow: 'unset',
                          border: 'none',
                          color:
                            theme.palette.mode === 'light'
                              ? `${theme.palette.grey[800]} !important`
                              : `${theme.palette.grey[400]} !important`,
                        }}
                      >
                        {col.renderCell ? col.renderCell(row) : row[col.field]}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Expanded Row */}
                  {isExpanded && expandedContent && (
                    <TableRow
                      sx={{
                        backgroundColor:
                          theme.palette.mode === 'light'
                            ? theme.palette.grey[50]
                            : theme.palette.grey[900],
                      }}
                    >
                      <TableCell
                        colSpan={columns.length}
                        sx={{
                          py: 2,
                          px: 3,
                          border: 'none',
                        }}
                      >
                        {expandedContent(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
