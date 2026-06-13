import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  type SxProps,
} from "@mui/material";
import { useTheme, type Theme } from "@mui/material/styles";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

// ==============================|| TYPES ||============================== //

export interface CollapsibleRowsTableRenderContext {
  /** True when rendering a child (sub) row, false for a parent row */
  isChild: boolean;
}

export interface CollapsibleRowsTableColumn {
  label: string;
  field: string;
  align?: "left" | "right" | "center" | string;
  /** Fixed column width (px or CSS length). Used with table-layout: fixed. */
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  /** Custom cell content. Receives (value, row, context). Use context.isChild to show e.g. "Nudge all" vs "Nudge". */
  render?: (
    value: any,
    row: any,
    context?: CollapsibleRowsTableRenderContext
  ) => React.ReactNode;
}

export interface ParentRowWithChildren {
  id?: string | number;
  name?: string;
  [key: string]: any;
  /** Child rows shown as rows in the same table when this parent is expanded */
  children: Record<string, any>[];
}

export interface CollapsibleRowsTableAtomProps {
  /** Columns shared by parent and child rows (e.g. Department, Code, Manager) */
  columns: CollapsibleRowsTableColumn[];
  /** Parent rows; each has a unique id/name and a `children` array */
  rows: ParentRowWithChildren[];
  /** Optional table label for a11y */
  ariaLabel?: string;
  /** Optional MUI sx overrides for the scroll container */
  sx?: SxProps;
  /** Max height of the scroll area (enables internal scroll + sticky header) */
  maxHeight?: string | number;
  /** Keep header visible while scrolling (requires maxHeight) */
  stickyHeader?: boolean;
  /** Optional empty message when a parent has no children */
  emptyChildrenMessage?: string;
  /** Left padding (px) for child row indent */
  childRowIndent?: number;
  /** When set, indent applies only to this column field (not the first column) */
  childRowIndentColumn?: string;
  /**
   * When set, parent rows use a compact layout: first column + this action in the last column.
   * Same column is used for child rows (e.g. "Nudge" per row). No extra column is added.
   */
  renderParentActions?: (row: ParentRowWithChildren) => React.ReactNode;
  /**
   * When true and renderParentActions is set, parent row has no column separation: one content
   * cell spans all columns except the last (action). When false, middle columns are separate cells.
   * Default false.
   */
  parentRowNoColumnSeparation?: boolean;
  /** Dynamic styling for parent rows */
  getRowSx?: (row: ParentRowWithChildren) => SxProps<Theme>;
  /** Dynamic styling for child rows */
  getChildRowSx?: (row: any) => SxProps<Theme>;
  /** Automatically open a specific row by its ID initially */
  defaultOpenRow?: string | number | null;
  /** Hide vertical cell borders (column dividers); keeps horizontal row separators only */
  hideColumnDividers?: boolean;
}

const alignValue = (align: string | undefined): "left" | "right" | "center" =>
  ["left", "right", "center"].includes(align ?? "left")
    ? (align as "left" | "right" | "center")
    : "left";

// ==============================|| ATOM COMPONENT ||============================== //

const EMPTY_PARENT_PLACEHOLDER = "\u00a0";
const EXPAND_COL_WIDTH = 48;

const withColumnWidth = (
  col: CollapsibleRowsTableColumn,
  base: SxProps<Theme>,
): SxProps<Theme> => {
  if (col.width == null) return base;
  const width = col.width;
  return {
    ...base,
    width,
    minWidth: col.minWidth ?? width,
    maxWidth: col.maxWidth ?? width,
  };
};

function CellContent({
  align,
  children,
}: {
  align: "left" | "right" | "center";
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: 22,
        display: "flex",
        alignItems: "center",
        justifyContent:
          align === "right"
            ? "flex-end"
            : align === "center"
              ? "center"
              : "flex-start",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        "& .MuiTypography-root": {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
      }}
    >
      {children}
    </Box>
  );
}

export function CollapsibleRowsTableAtom({
  columns,
  rows,
  ariaLabel = "collapsible rows table",
  sx,
  maxHeight,
  stickyHeader = false,
  emptyChildrenMessage = "No rows",
  childRowIndent = 4,
  childRowIndentColumn,
  renderParentActions,
  parentRowNoColumnSeparation = false,
  getRowSx,
  getChildRowSx,
  defaultOpenRow = null,
  hideColumnDividers = false,
}: CollapsibleRowsTableAtomProps) {
  const theme = useTheme();
  const [openRow, setOpenRow] = useState<string | number | null>(defaultOpenRow);

  // Sync openRow if defaultOpenRow changes (e.g., from deep link)
  useEffect(() => {
    if (defaultOpenRow != null) {
      setOpenRow(defaultOpenRow);
    }
  }, [defaultOpenRow]);

  const hasParentActions = Boolean(renderParentActions);
  const lastCol = columns.length > 0 ? columns[columns.length - 1] : null;
  const middleColSpan = Math.max(0, columns.length - 2);
  const singleContentCell = hasParentActions && parentRowNoColumnSeparation;

  const headerBg =
    theme.palette.mode === "light" ? theme.palette.grey[300] : theme.palette.grey[800];

  const useStickyHeader = stickyHeader || maxHeight != null;
  const hasFixedColumns = columns.some((col) => col.width != null);

  const dividerColor = theme.palette.divider;

  /** Top/bottom only — overrides theme borderWidth: 1 on all sides */
  const hideVerticalDividersHeaderSx = hideColumnDividers
    ? {
        borderStyle: "solid",
        borderColor: dividerColor,
        borderWidth: "1px 0",
      }
    : {};

  /** Bottom only */
  const hideVerticalDividersBodySx = hideColumnDividers
    ? {
        borderStyle: "solid",
        borderColor: dividerColor,
        borderWidth: "0 0 1px 0",
      }
    : {};

  const expandCellBaseSx = {
    width: EXPAND_COL_WIDTH,
    minWidth: EXPAND_COL_WIDTH,
    maxWidth: EXPAND_COL_WIDTH,
    px: 0.5,
    py: 1,
    verticalAlign: "middle" as const,
    boxSizing: "border-box" as const,
  };

  const expandHeaderCellSx = expandCellBaseSx;

  const expandBodyCellSx = {
    ...expandCellBaseSx,
    ...(hideColumnDividers
      ? hideVerticalDividersBodySx
      : { borderBottom: `1px solid ${dividerColor}` }),
  };

  const bodyCellSx = {
    px: 1.5,
    py: 1,
    height: 44,
    minHeight: 44,
    verticalAlign: "middle" as const,
    boxSizing: "border-box" as const,
    lineHeight: 1.4,
    ...(hideColumnDividers
      ? hideVerticalDividersBodySx
      : { borderBottom: `1px solid ${dividerColor}` }),
  };

  const headerCellSx = {
    px: 1.5,
    py: 1.25,
    height: 44,
    minHeight: 44,
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
    verticalAlign: "middle" as const,
    boxSizing: "border-box" as const,
    bgcolor: headerBg,
    color:
      theme.palette.mode === "light"
        ? theme.palette.grey[700]
        : theme.palette.grey[400],
    ...(hideColumnDividers
      ? hideVerticalDividersHeaderSx
      : {
          borderTop: `1px solid ${dividerColor}`,
          borderBottom: `1px solid ${dividerColor}`,
        }),
  };

  const renderCellContent = (
    col: CollapsibleRowsTableColumn,
    row: Record<string, unknown>,
    isChild: boolean,
  ): React.ReactNode => {
    const raw = col.render
      ? col.render(row[col.field], row, { isChild })
      : row[col.field];

    if (raw === null || raw === undefined || raw === false) {
      return EMPTY_PARENT_PLACEHOLDER;
    }

    if (typeof raw === "object" && !React.isValidElement(raw)) {
      return EMPTY_PARENT_PLACEHOLDER;
    }

    return raw as React.ReactNode;
  };

  const wrapCell = (
    col: CollapsibleRowsTableColumn,
    content: React.ReactNode,
  ) => (
    <CellContent align={alignValue(col.align)}>{content}</CellContent>
  );

  const getBodyCellPadding = (
    col: CollapsibleRowsTableColumn,
    colIdx: number,
    isChild: boolean,
  ) => {
    if (col.field === "select") {
      return { pl: 0, pr: 0 };
    }

    const pr = col.align === "right" ? 2 : 1.5;

    if (!isChild) {
      return { pl: 1.5, pr };
    }

    if (childRowIndentColumn != null) {
      return {
        pl: col.field === childRowIndentColumn ? childRowIndent : 1.5,
        pr,
      };
    }

    return {
      pl: colIdx === 0 ? childRowIndent : 1.5,
      pr,
    };
  };

  const tableMinWidth =
    EXPAND_COL_WIDTH +
    columns.reduce((sum, col) => {
      if (col.width == null) return sum;
      const w = typeof col.width === "number" ? col.width : parseInt(String(col.width), 10);
      return sum + (Number.isNaN(w) ? 0 : w);
    }, 0);

  return (
    <TableContainer
      sx={{
        ...(maxHeight != null && {
          maxHeight,
          ...(maxHeight === "100%" ? { height: "100%" } : {}),
        }),
        overflow: maxHeight != null ? "auto" : undefined,
        scrollbarGutter: maxHeight != null ? "stable" : undefined,
        width: "100%",
        ...sx,
      }}
    >
      <Table
        aria-label={ariaLabel}
        size="small"
        stickyHeader={useStickyHeader}
        sx={{
          ...(hasFixedColumns && {
            tableLayout: "fixed",
            minWidth: tableMinWidth > 0 ? tableMinWidth : undefined,
            width: "100%",
          }),
          ...(hideColumnDividers && {
            "& .MuiTableCell-head": {
              borderStyle: "solid !important",
              borderColor: `${dividerColor} !important`,
              borderWidth: "1px 0 !important",
            },
            "& .MuiTableCell-body": {
              borderStyle: "solid !important",
              borderColor: `${dividerColor} !important`,
              borderWidth: "0 0 1px 0 !important",
            },
          }),
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headerCellSx, ...expandHeaderCellSx }} />
            {columns.map((col) => (
              <TableCell
                key={col.field}
                align={alignValue(col.align)}
                sx={withColumnWidth(col, headerCellSx)}
              >
                {wrapCell(col, col.label)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.length > 0 ? rows.map((row, rowIndex) => {
            const rowKey = row.id ?? row.name ?? rowIndex;
            const isOpen = openRow === rowKey;
            const childRows = row.children ?? [];

            return (
              <React.Fragment key={String(rowKey)}>
                {/* --- Parent row: compact (first column + actions) when renderParentActions set --- */}
                <TableRow
                  hover
                  sx={{
                    bgcolor: "transparent",
                    ...(getRowSx?.(row) ?? {}),
                  }}
                  id={rowKey ? `parent-row-${rowKey}` : undefined}
                >
                  <TableCell sx={expandBodyCellSx} align="center">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                      }}
                    >
                      <IconButton
                        aria-label={isOpen ? "collapse row" : "expand row"}
                        size="small"
                        onClick={() => setOpenRow(isOpen ? null : rowKey)}
                      >
                        {isOpen ? (
                          <KeyboardArrowUpIcon fontSize="small" />
                        ) : (
                          <KeyboardArrowDownIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                  </TableCell>
                  {hasParentActions && lastCol ? (
                    <>
                      <TableCell
                        align={alignValue(columns[0].align)}
                        colSpan={
                          singleContentCell && columns.length > 1
                            ? columns.length - 1
                            : undefined
                        }
                        sx={withColumnWidth(columns[0], {
                          ...bodyCellSx,
                          fontWeight: 600,
                        })}
                      >
                        {wrapCell(
                          columns[0],
                          renderCellContent(columns[0], row, false),
                        )}
                      </TableCell>
                      {!singleContentCell && middleColSpan > 0 && (
                        <TableCell
                          colSpan={middleColSpan}
                          sx={bodyCellSx}
                        >
                          {EMPTY_PARENT_PLACEHOLDER}
                        </TableCell>
                      )}
                      <TableCell
                        align={alignValue(lastCol.align)}
                        sx={withColumnWidth(lastCol, {
                          ...bodyCellSx,
                          pr: lastCol.align === "right" ? 2 : 1.5,
                        })}
                      >
                        {wrapCell(lastCol, renderParentActions?.(row))}
                      </TableCell>
                    </>
                  ) : (
                    columns.map((col, colIdx) => (
                      <TableCell
                        key={col.field}
                        align={alignValue(col.align)}
                        sx={withColumnWidth(col, {
                          ...bodyCellSx,
                          ...getBodyCellPadding(col, colIdx, false),
                        })}
                      >
                        {wrapCell(col, renderCellContent(col, row, false))}
                      </TableCell>
                    ))
                  )}
                </TableRow>

                {/* --- Child rows: same table, same column names --- */}
                {isOpen &&
                  (childRows.length === 0 ? (
                    <TableRow>
                      <TableCell sx={expandBodyCellSx} />
                      <TableCell
                        colSpan={columns.length}
                        align="center"
                        sx={{
                          ...bodyCellSx,
                          color: "text.secondary",
                          pl: childRowIndent,
                        }}
                      >
                        {emptyChildrenMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    childRows.map((child, idx) => (
                      <TableRow
                        key={child.id ?? idx}
                        id={child.id ? `child-row-${child.id}` : undefined}
                        hover
                        sx={{
                          bgcolor:
                            theme.palette.mode === "light"
                              ? theme.palette.grey[50]
                              : theme.palette.grey[900],
                          ...(getChildRowSx?.(child) ?? {}),
                        }}
                      >
                        <TableCell sx={expandBodyCellSx} />
                        {columns.map((col, colIdx) => (
                          <TableCell
                            key={col.field}
                            align={alignValue(col.align)}
                            sx={withColumnWidth(col, {
                              ...bodyCellSx,
                              ...getBodyCellPadding(col, colIdx, true),
                            })}
                          >
                            {wrapCell(col, renderCellContent(col, child, true))}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ))}
              </React.Fragment>
            );
          }) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + 1}
                align="center"
                sx={{ ...bodyCellSx, py: 2 }}
              >
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
