import React from "react";
import { Skeleton, TableRow, TableCell, useTheme } from "@mui/material";

interface TableSkeletonRowsProps {
  rows?: number;
  columns?: number;
  height?: number;
  animation?: "pulse" | "wave" | false;
  columnWidths?: string[];
}

export const TableSkeletonRows: React.FC<TableSkeletonRowsProps> = ({
  rows = 5,
  columns = 1,
  height = 40,
  animation = "pulse",
  columnWidths = [],
}) => {
  const theme = useTheme();

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow
          key={`skeleton-row-${rowIndex}`}
          sx={{
            borderBottom: "none",
            "&:last-child": { borderBottom: "none" },
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell
              key={`skeleton-cell-${rowIndex}-${colIndex}`}
              sx={{
                padding: "4px 8px",
                borderBottom: "none",
                borderTop: "none",
                width: columnWidths[colIndex] ?? "auto",
                backgroundColor: "transparent", // Prevent cell bg color override

                // Remove left border on first cell and right border on last cell
                borderLeft: colIndex === 0 ? "none" : undefined,
                borderRight: colIndex === columns - 1 ? "none" : undefined,
              }}
            >
              <Skeleton
                variant="rectangular"
                height={height}
                animation={animation}
                sx={{
                  bgcolor:
                    theme.palette.mode === "light"
                      ? theme.palette.info.light // info color in light mode
                      : theme.palette.grey[700], // Darker gray in dark mode
                  borderRadius: 1,
                  width: "100%",
                  display: "block",
                }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};
