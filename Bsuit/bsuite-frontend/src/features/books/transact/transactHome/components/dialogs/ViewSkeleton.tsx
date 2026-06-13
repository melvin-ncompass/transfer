import { Divider, Skeleton } from "@mui/material";
import { Box, useTheme } from "@mui/system";

export function ViewSkeleton() {
  const theme = useTheme();

  // Mimic a typical number of journal account rows
  const journalRowCount = 4;
  // Column widths roughly matching: name, type, debit, credit, exchangeRate, convertedAmount
  const columnWidths = ["30%", "15%", "12%", "12%", "15%", "16%"];

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        p: 3,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Header grid: Date | Total Credit | Total Debit | Description */}
      <Box
        display="grid"
        gridTemplateColumns="1fr 1fr 1fr minmax(0, 2fr)"
        gap={2}
        mb={3}
        alignItems="center"
        sx={{ minWidth: 0 }}
      >
        {/* Date */}
        <Box sx={{ minWidth: 0 }}>
          <Skeleton width={40} height={16} sx={{ mb: 0.5 }} />
          <Skeleton width={100} height={22} />
        </Box>

        {/* Total Credit */}
        <Box sx={{ minWidth: 0 }}>
          <Skeleton width={70} height={16} sx={{ mb: 0.5 }} />
          <Skeleton width={90} height={22} />
        </Box>

        {/* Total Debit */}
        <Box sx={{ minWidth: 0 }}>
          <Skeleton width={70} height={16} sx={{ mb: 0.5 }} />
          <Skeleton width={90} height={22} />
        </Box>

        {/* Description */}
        <Box sx={{ minWidth: 0 }}>
          <Skeleton width={70} height={16} sx={{ mb: 0.5 }} />
          <Skeleton width="80%" height={22} />
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Table skeleton */}
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box sx={{ minWidth: 900, width: "100%" }}>
          {/* Table header row */}
          <Box
            display="grid"
            gridTemplateColumns={columnWidths.join(" ")}
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              pb: 1,
              mb: 0.5,
            }}
          >
            {columnWidths.map((_, i) => (
              <Box
                key={i}
                sx={{ px: 1, display: "flex", justifyContent: i >= 2 ? "flex-end" : "flex-start" }}
              >
                <Skeleton width={i === 0 ? 100 : 70} height={18} />
              </Box>
            ))}
          </Box>

          {/* Table body rows */}
          {Array.from({ length: journalRowCount }).map((_, rowIdx) => (
            <Box
              key={rowIdx}
              display="grid"
              gridTemplateColumns={columnWidths.join(" ")}
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                py: 0.3,
              }}
            >
              {columnWidths.map((_, colIdx) => {
                // Vary widths to look natural; debit/credit cells are often empty
                const isNumericCol = colIdx >= 2;
                const isEmpty = isNumericCol && (rowIdx + colIdx) % 3 === 0;
                return (
                  <Box
                    key={colIdx}
                    sx={{
                      px: 1,
                      py: 0.6,
                      display: "flex",
                      justifyContent: isNumericCol ? "flex-end" : "flex-start",
                    }}
                  >
                    {!isEmpty && (
                      <Skeleton
                        width={
                          colIdx === 0
                            ? `${60 + ((rowIdx * 17 + 30) % 30)}%`
                            : colIdx === 1
                            ? "60%"
                            : "70%"
                        }
                        height={18}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      <Divider />
    </Box>
  );
}

export default ViewSkeleton;