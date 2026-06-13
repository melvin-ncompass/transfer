import { Box, Stack, TextField, CircularProgress } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useTheme } from "@mui/material/styles";
import type { DataTableProps } from "../../../types/types";

export function DataTable({
  columns,
  rows,
  getRowId = (row) => row.id,
  loading = false,
  pageSizeOptions = [5, 10, 25],
  checkboxSelection = false,
  action,
  filterName,
  onFilterName,
  sx,
  headerBgColor,
  bodyBgColor,
  tableHeight = "auto", // <- NOT used for scrolling
  maxHeight, // <- REMOVED from usage
  pagination = false,
  disableRowClickSelection = true,
  localeText,
}: DataTableProps) {
  const theme = useTheme();

  const resolvedHeaderBg =
    headerBgColor ||
    (theme.palette.mode === "light"
      ? theme.palette.grey[300]
      : theme.palette.grey[800]);

  const resolvedBodyBg =
    bodyBgColor ||
    (theme.palette.mode === "light"
      ? theme.palette.background.paper
      : theme.palette.background.default);

  return (
    // ===== Box wrapper stays, remove overflowX
    <Box
      sx={{
        ...sx,
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={2}>
          {onFilterName && (
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search..."
              value={filterName}
              onChange={onFilterName}
            />
          )}
          {action}
        </Stack>
      </Stack>

      {/* ===== FIX: Make wrapper 100% height */}
      <Box sx={{ width: "100%", height: "100%" }}>
        {loading ? (
          <Stack height="100%" alignItems="center" justifyContent="center">
            <CircularProgress />
          </Stack>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns as GridColDef[]}
            getRowId={getRowId}
            getRowHeight={() => "auto"}
            checkboxSelection={checkboxSelection}
            localeText={{
              noRowsLabel: "No data available",
              ...localeText,
            }}
            disableRowSelectionOnClick={disableRowClickSelection}
            {...(pagination
              ? {
                  initialState: {
                    pagination: { paginationModel: { page: 0, pageSize: 5 } },
                  },
                  pageSizeOptions,
                }
              : {
                  hideFooter: true,
                })}
            // ==================== KEY CHANGE 1 ====================
            // Use height: 100% for proper flex scrolling inside CardContent
            sx={{
              height: "100%", // <- Critical: fill parent
              width: "100%", // <- Take full width
              border: "none",
              minWidth: "100%",
              backgroundColor: resolvedBodyBg,

              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: resolvedHeaderBg,
                fontWeight: 600,
                position: "sticky",
                top: 0,
                zIndex: 10,
              },
              "& .MuiDataGrid-columnHeadersInner": {
                backgroundColor: resolvedHeaderBg,
              },
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: `${resolvedHeaderBg} !important`,
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "visible",
                textOverflow: "clip",
                maxWidth: "none",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: theme.palette.action.hover,
              },
              "& .MuiDataGrid-columnSeparator": {
                backgroundColor: resolvedHeaderBg,
              },
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                outline: "none",
                border: "none",
                boxShadow: "none",
              },
              "& .MuiDataGrid-cell": {
                whiteSpace: "normal",
                wordBreak: "break-word",
                lineHeight: "1.4",
                py: 1,
                overflow: "visible",
                textOverflow: "clip",
              },
              "& .MuiDataGrid-cellContent, & .MuiDataGrid-cellContent .MuiTypography-root":
                {
                  overflow: "visible",
                  whiteSpace: "normal",
                },
              "& .MuiDataGrid-columnHeaderTitleContainer, & .MuiDataGrid-columnHeaderTitle":
                {
                  overflow: "visible",
                  whiteSpace: "nowrap",
                  outline: "none",
                  border: "none",
                  boxShadow: "none",
                },
              "& .MuiDataGrid-overlay": {
                top: 0,
                bottom: 0,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                color: theme.palette.text.secondary,
                background: "transparent",
                padding: 0,
                margin: 0,
              },
              "& .MuiDataGrid-virtualScroller": {
                overflow: "visible !important",
              },

              ...(rows.length === 0
                ? {
                    "& .MuiDataGrid-main": { padding: 0, overflow: "visible" },
                    "& .MuiDataGrid-overlay": { padding: 0, margin: 0 },
                  }
                : {}),
              ...sx,
            }}
          />
        )}
      </Box>
    </Box>
  );
}
