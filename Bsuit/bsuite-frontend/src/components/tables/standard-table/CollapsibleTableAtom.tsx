import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Box,
  type SxProps,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

// ==============================|| TYPES ||============================== //

export interface CollapsibleTableColumn {
  label: string;
  field: string;
  align?: "left" | "right" | "center" | string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface CollapsibleTableAtomProps {
  /** Columns for the main (outer) table */
  columns: CollapsibleTableColumn[];
  /** Row data for the main table */
  rows: Record<string, any>[];
  /** Function that renders expanded content per row */
  renderCollapseContent?: (row: Record<string, any>) => React.ReactNode;
  /** Optional table label for a11y */
  ariaLabel?: string;
  /** Optional MUI sx overrides */
  sx?: SxProps;
}

// ==============================|| ATOM COMPONENT ||============================== //

export function CollapsibleTableAtom({
  columns,
  rows,
  renderCollapseContent,
  ariaLabel = "collapsible table",
  sx,
}: CollapsibleTableAtomProps) {
  const theme = useTheme();

  const [openRow, setOpenRow] = useState<string | number | null>(null);

  return (
    // To use primary body color: <TableContainer sx={{ backgroundColor: theme.palette.primary.light, ...sx }}>
    <TableContainer sx={sx}>
      <Table aria-label={ariaLabel}>
        <TableHead>
          {/* To use primary colors: sx={{bgcolor: theme.palette.primary.main}} */}
          <TableRow sx={{ bgcolor: theme.palette.grey[300] }}>
            <TableCell />
            {columns.map((col) => (
              <TableCell
                key={col.field}
                align={
                  ["left", "right", "center"].includes(col.align ?? "left")
                    ? (col.align as "left" | "right" | "center")
                    : "left"
                }
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row) => {
            const isOpen = openRow === row.id || openRow === row.name;
            return (
              <React.Fragment key={row.id ?? row.name}>
                {/* --- Main Row --- */}
                <TableRow hover>
                  <TableCell sx={{ width: 64 }}>
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      onClick={() =>
                        setOpenRow(isOpen ? null : (row.id ?? row.name))
                      }
                    >
                      {isOpen ? (
                        <KeyboardArrowUpIcon />
                      ) : (
                        <KeyboardArrowDownIcon />
                      )}
                    </IconButton>
                  </TableCell>

                  {columns.map((col) => (
                    <TableCell
                      key={col.field}
                      align={
                        ["left", "right", "center"].includes(
                          col.align ?? "left",
                        )
                          ? (col.align as "left" | "right" | "center")
                          : "left"
                      }
                      sx={{ pr: col.align === "right" ? 3 : 0 }}
                    >
                      {col.render
                        ? col.render(row[col.field], row)
                        : row[col.field]}
                    </TableCell>
                  ))}
                </TableRow>

                {/* --- Collapsible Row --- */}
                <TableRow>
                  <TableCell sx={{ py: 0 }} colSpan={columns.length + 1}>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 1 }}>
                        {renderCollapseContent
                          ? renderCollapseContent(row)
                          : null}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
