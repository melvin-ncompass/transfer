import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material";
import { Fragment, useEffect, useRef, useState } from "react";
import { TableSkeletonRows } from "../../atom/skeleton";
import type { HighlightedRow, StandardTableProps } from "../../../types/types";
import {
  getTableCellStyles,
  getTableHeaderStyles,
  UI_CONSTANTS,
} from "../../../themes/uiConstants";
import { getRowHighlightColor } from "../../../features/people/utils/notificationRowHighlight";

interface TableRow {
  id: string | number;
  paymentId?: string | number;
  transactionId?: string | number;
  [key: string]: unknown;
}

export function StandardTable({
  columns,
  rows,
  loading = false,
  gap = 0,
  showSkeleton = false,
  sticky = false,
  stickyTop = 0,
  emptyMessage = "No Data Available",
  nowrapCells = false,
  isRowSelected,
  sx = {},
  highlightedRow,
  minWidth,
  rowHeight,
  renderCustomRow,
  onRowClick,
  isRowClickable,
  tableSx,
  getRowSx,
  getRowId,
}: StandardTableProps & { 
  highlightedRow?: HighlightedRow; 
  rowHeight?: number; 
  getRowSx?: (row: any) => SxProps<Theme>;
  getRowId?: (row: any) => string;
}) {
  const theme = useTheme();

  const ROW_HIGHLIGHT_DURATION_MS = 3000;

  /* ---------- Highlight state ---------- */
  const [activeHighlight, setActiveHighlight] = useState<HighlightedRow>(null);
  const appliedHighlightRef = useRef<string | null>(null);
  const scrolledHighlightRef = useRef<string | null>(null);

  /* ---------- Row refs ---------- */
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  /* ---------- Resolve row id ---------- */
  const resolveRowId = (row: TableRow): string => {
    if (getRowId) return getRowId(row);
    if (highlightedRow) {
      switch (highlightedRow.key) {
        case "paymentId":
          return String(row.paymentId ?? row.id);
        case "transactionTypeId":
          return String(
            (row as TableRow & { transactionTypeId?: string | number })
              .transactionTypeId ?? row.id,
          );
        case "transactionId":
          return String(row.transactionId ?? row.id);
        default:
          return String(row.id);
      }
    }
    return String(row.id);
  };

  /* ---------- Highlight + scroll (once per highlight; not on every rows change) ---------- */
  useEffect(() => {
    if (!highlightedRow) {
      setActiveHighlight(null);
      appliedHighlightRef.current = null;
      scrolledHighlightRef.current = null;
      return;
    }

    const signature = `${highlightedRow.key}:${highlightedRow.value}:${highlightedRow.type}`;
    const isNewHighlight = appliedHighlightRef.current !== signature;

    if (isNewHighlight) {
      appliedHighlightRef.current = signature;
      scrolledHighlightRef.current = null;
      setActiveHighlight(highlightedRow);
    }

    const raf = requestAnimationFrame(() => {
      if (scrolledHighlightRef.current === signature) return;
      const rowEl = rowRefs.current[highlightedRow.value];
      if (!rowEl) return;
      scrolledHighlightRef.current = signature;
      rowEl.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    let clearTimer: ReturnType<typeof setTimeout> | undefined;
    if (isNewHighlight) {
      clearTimer = setTimeout(() => {
        setActiveHighlight(null);
      }, ROW_HIGHLIGHT_DURATION_MS);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, [highlightedRow, rows]);

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 0,
        border: "none",
        boxShadow: "none",
        overflow: "unset",
        ...sx,
      }}
    >
      <Table
        sx={{
          width: "100%",
          borderCollapse: gap > 0 ? "separate" : "collapse",
          borderSpacing: gap > 0 ? `0px ${gap}px` : 0,
          ...tableSx,
        }}
      >
        <TableHead>
          <TableRow
            sx={{
              "& th": {
                position: sticky ? "sticky" : "static",
                top: stickyTop,
                zIndex: 3,
                backgroundColor:
                  theme.palette.mode === "light"
                    ? `${theme.palette.grey[300]} !important`
                    : `${theme.palette.grey[800]} !important`,
                color:
                  theme.palette.mode === "light"
                    ? `${theme.palette.grey[700]} !important`
                    : `${theme.palette.grey[400]} !important`,
                fontWeight: 600,
                minWidth: minWidth,
              },
            }}
          >
            {columns.map((col) => (
              <TableCell
                key={col.id}
                align={col.headerAlign ?? col.align ?? "left"}
                width={col.width}
                sx={{
                  minWidth: col.minWidth,
                  ...getTableHeaderStyles(),
                }}
              >
                {col.headerRender ? col.headerRender() : col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                align="center"
                sx={{ py: 4, border: "none" }}
              >
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {rows.length > 0 &&
                rows.map((row, rowIndex) => {
                  const rowId = resolveRowId(row);
                  const isHighlighted = activeHighlight?.value === rowId;

                  const highlightColor = isHighlighted
                    ? getRowHighlightColor(theme)
                    : "transparent";

                  const rowRef = (el: HTMLTableRowElement | null) => {
                    if (el) rowRefs.current[rowId] = el;
                  };

                  const custom = renderCustomRow?.(row, rowIndex, {
                    rowId,
                    rowRef,
                    highlightBackground: highlightColor,
                    columns,
                  });

                  if (custom != null) {
                    return <Fragment key={`${rowId}-${rowIndex}`}>{custom}</Fragment>;
                  }

                  return (
                    <TableRow
                      key={`${rowId}-${rowIndex}`}
                      id={rowId}
                      hover
                      selected={Boolean(isRowSelected?.(row, rowIndex))}
                      ref={rowRef}
                      onClick={() => onRowClick?.(row, rowIndex)}
                      sx={{
                        backgroundColor: highlightColor,
                        transition: "background-color 0.3s ease-in-out",
                        cursor: isRowClickable?.(row, rowIndex) ? "pointer" : "default",
                        ...(rowHeight && { height: rowHeight }),
                        ...(getRowSx?.(row) ?? {})                      }}
                    >
                      {columns.map((col) => (
                        <TableCell
                          key={col.id}
                          align={col.align || "left"}
                          width={col.width}
                          sx={{
                            ...getTableCellStyles(),
                            whiteSpace: nowrapCells ? "nowrap" : "normal",
                            // overflow: "visible",
                            // textOverflow: "clip",
                            border: "none",
                            color:
                              theme.palette.mode === "light"
                                ? theme.palette.grey[700]
                                : theme.palette.grey[400],
                          }}
                        >
                          {col.render ? col.render(row) : row[col.id]}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}

              {!loading && rows.length === 0 && !showSkeleton && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    sx={{
                      textAlign: "center",
                      py: UI_CONSTANTS.spacing.tableNoDataPadding,
                      fontSize: UI_CONSTANTS.fontSize.tableCell,
                      color: "text.secondary",
                    }}
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}

              {showSkeleton && (
                <TableSkeletonRows
                  rows={5}
                  columns={columns.length}
                  height={40}
                  animation="pulse"
                />
              )}
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
