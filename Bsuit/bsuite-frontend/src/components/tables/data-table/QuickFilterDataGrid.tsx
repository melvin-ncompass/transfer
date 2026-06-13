import React, { useRef, useState, useCallback } from "react";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import {
  ToolbarButton,
  ExportCsv,
  ExportPrint,
} from "@mui/x-data-grid";
import { Stack, Tooltip, Menu, MenuItem, useTheme } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import type { QuickFilterDataGridProps } from "../../../types/types";
import useDataGrid from "../../../hooks/useDataGrid";
import { Box } from "@mui/system";


export function QuickFilterDataGrid({
  columns,
  rows,
  pageSize = 5,
  quickFilterValues = [],
  showToolbar = true,
  headerBgColor,
  bodyBgColor,
  sx,
  maxHeight,
  loading = false,
  pagination = false,
  disableRowSelectionOnClick = false,
  onRowClick,
  onCellClick,
  checkboxSelection = false,
  getRowHeight = () => 70,
  csvFilename = "BSuite_export",
  disableColumnMenu = true,
  leftActions,
  rightActions,
  rowSelectionModel,
  onRowSelectionChange,
}: QuickFilterDataGridProps) {
  const theme = useTheme();
  const dataGridStyles = useDataGrid();
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
  // const resolvedHeaderBg = theme.palette.primary.main;
  // const resolvedBodyBg = theme.palette.primary.light;
  // Custom toolbar to remove print option
  // function CustomToolbar({ showCsvExport = true, onSearch }: { showCsvExport?: boolean; onSearch?: (value: string) => void }) {
  //   const handleExportClick = () => {
  //     const element = document.querySelector('.MuiDataGrid-root');
  //     if (element) {
  //       const table = element.querySelector('[role="grid"]');
  //       if (table) {
  //         let csv = '';
  //         // Get headers
  //         const headers = table.querySelectorAll('[role="columnheader"]');
  //         headers.forEach((header) => {
  //           csv += header.textContent + ',';
  //         });
  //         csv += '\n';
  //         // Get rows
  //         const rows = table.querySelectorAll('[role="row"]');
  //         rows.forEach((row) => {
  //           const cells = row.querySelectorAll('[role="gridcell"]');
  //           cells.forEach((cell) => {
  //             csv += cell.textContent + ',';
  //           });
  //           csv += '\n';
  //         });
  //         // Download
  //         const blob = new Blob([csv], { type: 'text/csv' });
  //         const url = window.URL.createObjectURL(blob);
  //         const a = document.createElement('a');
  //         a.href = url;
  //         a.download = 'table-export.csv';
  //         a.click();
  //       }
  //     }
  //   };
  //   return (
  //     <Stack direction="row" spacing={1} p={1} sx={{ alignItems: 'center' }}>
  //       <TextField
  //         placeholder="Search..."
  //         size="small"
  //         onChange={(e) => onSearch?.(e.target.value)}
  //         sx={{ flex: 1 }}
  //       />
  //       {showCsvExport && (
  //         <Button
  //           size="small"
  //           variant="outlined"
  //           startIcon={<FileDownloadIcon />}
  //           onClick={handleExportClick}
  //         >
  //           Export CSV
  //         </Button>
  //       )}
  //     </Stack>
  //   );
  // }
  // Customm Toolbar integration
  // const ToolbarComponent = showToolbar
  // ? () => <CustomToolbar showCsvExport={showCsvExport} />
  // : undefined;
  // slots={{
  //   toolbar: ToolbarComponent,
  // }}

  function ExportMenu({ csvFilename }: { csvFilename?: string }) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    return (
      <>
        <Tooltip title="Export">
          <ToolbarButton
            ref={triggerRef}
            id="export-menu-trigger"
            aria-controls="export-menu"
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={() => setOpen(true)}
          >
            <FileDownloadIcon fontSize="small" />
          </ToolbarButton>
        </Tooltip>
        <Menu
          id="export-menu"
          anchorEl={triggerRef.current}
          open={open}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ list: { "aria-labelledby": "export-menu-trigger" } }}
        >
          <ExportCsv render={<MenuItem />} options={{ fileName: csvFilename }}>
            Download as CSV
          </ExportCsv>
          <ExportPrint render={<MenuItem />}>Print</ExportPrint>
        </Menu>
      </>
    );
  }

  function CustomToolbar({
    leftActions,
    rightActions,
    csvFilename,
  }: {
    leftActions?: React.ReactNode;
    rightActions?: React.ReactNode;
    csvFilename?: string;
  }) {
    return (
      <GridToolbarContainer
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {leftActions}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ ml: "auto", pr: 1 }} alignItems="center">
          {rightActions}
          <ExportMenu csvFilename={csvFilename} />  {/* ← replaces GridToolbarExport */}
          <GridToolbarQuickFilter />
        </Stack>
      </GridToolbarContainer>
    );
  }

  const ToolbarWithExtras = useCallback(
    () => <CustomToolbar
      leftActions={leftActions}
      rightActions={rightActions}
      csvFilename={csvFilename} 
    />,
    [leftActions, rightActions, csvFilename]
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ overflowX: "hidden", width: "100%" }}>
        <DataGrid
          rows={rows}
          loading={loading}
          columns={columns}
          disableColumnMenu={disableColumnMenu}
          disableRowSelectionOnClick={disableRowSelectionOnClick}
          onRowClick={onRowClick}
          onCellClick={onCellClick}
          checkboxSelection={checkboxSelection}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={(newModel) => {
            onRowSelectionChange?.(newModel);
          }}
          keepNonExistentRowsSelected={true}
          initialState={{
            ...(pagination
              ? {
                pagination: {
                  paginationModel: { pageSize },
                },
              }
              : {}),
            filter: {
              filterModel: {
                items: [],
                quickFilterValues,
              },
            },
          }}
          {...(pagination ? {} : { hideFooter: true })}
          disableColumnFilter
          disableColumnSelector
          disableDensitySelector
          hideFooterSelectedRowCount
          showToolbar={showToolbar}
          slots={{
            toolbar: showToolbar ? ToolbarWithExtras : undefined, // ← only add this
          }}
          slotProps={{
            footer: {
              sx: {
                position: "sticky",
                bottom: 0,
                backgroundColor: resolvedBodyBg,
                zIndex: 10,
                "& .MuiDataGrid-footerContainer": {
                  borderTop: `1px solid ${theme.palette.divider}`,
                },
              },
            },
            toolbar: {
              csvOptions: {
                fileName: csvFilename,
                disableToolbarButton: true, // ← hides CSV export
              },
              printOptions: {
                disableToolbarButton: true, // ← hides Print export
              },
              sx: {
                position: "sticky",
                top: 0,
                backgroundColor: resolvedBodyBg,
                zIndex: 11,
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
            },
          }}
          sx={{
            width: "100%",
            maxHeight: maxHeight,
            backgroundColor: resolvedBodyBg,
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: resolvedHeaderBg,
              fontWeight: 600,
              position: 'sticky'
            },
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: `${resolvedHeaderBg} !important`,
            },

            //  REMOVE BLUE BORDER ON HEADER CLICK
            "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within":
            {
              outline: "none",
              boxShadow: "none",
            },

        

            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 600,
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
            ...sx,
            ...dataGridStyles,
          }}
        // components={{
        //   NoRowsOverlay: () => (
        //     <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
        //       {emptyRowsText}
        //     </Box>
        //   ),
        // }}
        />
      </Box>
    </Box>
  );
}
