import React, { useEffect, useRef, useState, forwardRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
} from "@mui/material";
import { TableSkeletonRows } from "../../atom/skeleton";
import type { DenseTableAtomProps } from "../../../types/types";

type HighlightedRow = {
  key: "id" | "paymentId" | "transactionTypeId";
  value: string;
  type: "add" | "edit";
  counter?: number;
} | null;

export const DenseTableAtom = forwardRef<
  HTMLDivElement,
  DenseTableAtomProps & {
    highlightedRow?: HighlightedRow;
    loadingUp?: boolean;
    loadingDown?: boolean;
  }
>(function DenseTableAtom(
  {
    columns,
    rows,
    ariaLabel = "dense table",
    loading = false,
    showSkeleton = false,
    emptyMessage = "No Data Available",
    highlightedRow,
    sx,
    onRowClick,
    loadingUp,
    loadingDown,
  },
  ref,
) {
  const theme = useTheme();

  const [activeHighlight, setActiveHighlight] = useState<HighlightedRow>(null);

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const highlightTimerRef = useRef<number | null>(null);
  const lastHighlightedValue = useRef<string | null>(null);

  const resolveRowId = (row: any): string => {
    if (highlightedRow) {
      switch (highlightedRow.key) {
        case "paymentId":
          return String(row.paymentId ?? row.id);
        case "transactionTypeId":
          return String(row.transactionTypeId ?? row.id);
        default:
          return String(row.id);
      }
    }
    return String(row.id);
  };

  useEffect(() => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }

    if (!highlightedRow) {
      setActiveHighlight(null);
      lastHighlightedValue.current = null;
      return;
    }

    const newHighlightKey = `${highlightedRow.value}-${highlightedRow.type}-${highlightedRow.counter ?? 0}`;

    if (lastHighlightedValue.current !== newHighlightKey) {
      lastHighlightedValue.current = newHighlightKey;
      setActiveHighlight(highlightedRow);

      let attempts = 0;
      const maxAttempts = 30;

      const tryScroll = () => {
        const rowEl = rowRefs.current[highlightedRow.value];

        if (rowEl) {
          rowEl.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return;
        }

        if (attempts < maxAttempts) {
          attempts++;
          requestAnimationFrame(tryScroll);
        }
      };

      tryScroll();
    }

    highlightTimerRef.current = window.setTimeout(() => {
      setActiveHighlight(null);
      highlightTimerRef.current = null;
    }, 3000);
  }, [highlightedRow, rows.length]);

  return (
    <TableContainer
      ref={ref ?? undefined}
      component={Paper}
      sx={{
        width: "100%",
        maxHeight: sx?.maxHeight,
        overflowY: "auto",
        borderRadius: 0,
        boxShadow: "none",
        ...sx,
      }}
    >
      <Table
        size="small"
        aria-label={ariaLabel}
        sx={{
          // minWidth: 1000, // also increase minWidth here (see Step 3)
          tableLayout: "auto",
          borderCollapse: "separate",
          borderSpacing: 0,

          "& .MuiTableCell-root": {
            px: 1,
            fontSize: "0.9rem",
            lineHeight: 1.2,
          },

          "& .MuiTableRow-root": {
            height: 30,
          },
        }}
      >
        {/* HEADER */}
        <TableHead>
          <TableRow
            sx={{
              "& th": {
                position: "sticky",
                top: 0,
                zIndex: 10,
                backgroundColor:
                  theme.palette.mode === "light"
                    ? theme.palette.grey[300]
                    : theme.palette.grey[800],
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            {columns.map((col: any, idx: number) => {
              const key = col.id ?? col.field ?? idx;
              const label = col.label ?? col.headerName ?? "";

              return (
                <TableCell
                  key={key}
                  align={col.headerAlign || "left"}
                  sx={{
                    width: col.width,
                    minWidth: col.minWidth,
                    maxWidth: col.maxWidth,
                  }}
                >
                  {label}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>

        {/* BODY */}
        <TableBody>
          {loading && (
            <TableSkeletonRows rows={10} columns={columns.length} height={32} />
          )}

          {loadingUp && (
            <TableSkeletonRows rows={3} columns={columns.length} height={32} />
          )}

          {!loading &&
            rows.length > 0 &&
            rows.map((row: any, rowIndex: number) => {
              const rowId = resolveRowId(row);
              const isHighlighted = activeHighlight?.value === rowId;

              const highlightColor = isHighlighted
                ? ((theme.palette as any).rowHighlight ??
                  theme.palette.success.light)
                : "transparent";

              return (
                <TableRow
                  hover
                  key={`${rowId}-${rowIndex}`}
                  ref={(el) => {
                    rowRefs.current[rowId] = el;
                  }}
                  sx={{
                    backgroundColor: highlightColor,
                    transition: "background-color 0.3s ease",
                  }}
                  onClick={(e) => {
                    if (
                      (e.target as HTMLElement).closest(
                        "button, a, [role='button'], [data-stop-row-click]",
                      )
                    ) {
                      return;
                    }
                    onRowClick?.(row);
                  }}
                >
                  {columns.map((col: any, colIndex: number) => {
                    const key = col.id ?? col.field ?? colIndex;
                    const field = col.id ?? col.field;

                    let content;

                    if (col.render) {
                      content = col.render(row);
                    } else if (col.renderCell) {
                      content = col.renderCell({
                        value: field ? row[field] : undefined,
                        row,
                      });
                    } else {
                      content = field ? row[field] : null;
                    }

                    return (
                      <TableCell
                        key={key}
                        align={col.align || "left"}
                        sx={{
                          width: col.width,
                          minWidth: col.minWidth,
                          maxWidth: col.maxWidth,
                          pl: colIndex === 0 ? 3 : 1.5,
                          pr: colIndex === columns.length - 1 ? 3 : 1.5,
                          py: 0,
                          border: "none",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color:
                            theme.palette.mode === "light"
                              ? theme.palette.grey[700]
                              : theme.palette.grey[400],
                        }}
                      >
                        {content}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}

          {loadingDown && (
            <TableSkeletonRows rows={3} columns={columns.length} height={32} />
          )}

          {!loading && rows.length === 0 && !showSkeleton && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                sx={{ textAlign: "center", py: 3 }}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}

          {showSkeleton && (
            <TableSkeletonRows rows={5} columns={columns.length} height={32} />
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
});
