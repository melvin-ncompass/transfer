import * as React from "react";
import {
  Box,
  Stack,
} from "@mui/material";
import {
  DataGrid,
  type GridRowModel,
  type GridRenderEditCellParams,
} from "@mui/x-data-grid";
import { useTheme } from "@mui/material/styles";

import useDataGrid from "../../../hooks/useDataGrid";
import { Snackbar } from "../../atom/snackbar";
import { ConfirmDialog } from "../../dialogs/confirm-dialog";

// import { TextFieldElement } from "../../atom/text-field";
import { DatePickerElement } from "../../atom/date-picker";
import { SingleSelectElement } from "../../atom/select-field/SingleSelect";
import { MultiSelectElement } from "../../atom/select-field/MultiSelect";
import { Checkbox } from "../../atom/check-box";
import dayjs from "dayjs";
import type { EditableDataGridProps } from "../../../types/types";

// ==============================|| ATOM COMPONENT - EDITABLE DATA GRID WITH CONFIRMATION ||============================== //

export function EditableDataGridWithConfirm({
  rows,
  columns,
  exportActions,
  headerBgColor,
  bodyBgColor,
  successMessage,
  sx,
  processRowUpdate: customProcessRowUpdate,
  onProcessRowUpdateError,
  validateRow
}: EditableDataGridProps) {
  const theme = useTheme();
  const dataGridBaseStyles = useDataGrid();

  // Snackbar local state
  const [toast, setToast] = React.useState({
    message: "",
    color: "info" as "success" | "error" | "info" | "warning",
    open: false,
  });

  // Confirm Dialog state
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmMessage, setConfirmMessage] = React.useState<string>("");
  const [promiseArguments, setPromiseArguments] = React.useState<any>(null);

  // Fake mutation (replace with API)
  const mutateRow = React.useCallback(
    (user: Partial<any>) =>
      new Promise<Partial<any>>((resolve, reject) => {
        setTimeout(() => {
          if (user.name?.trim() === "") reject();
          else resolve(user);
        }, 400);
      }),
    []
  );

  // Compare old/new row values
  function computeMutation(newRow: GridRowModel, oldRow: GridRowModel) {
    const diffs: string[] = [];
    Object.keys(newRow).forEach((key) => {
      if (newRow[key] !== oldRow[key])
        diffs.push(`${key}: '${oldRow[key]}' → '${newRow[key]}'`);
    });
    return diffs.join(", ");
  }

  // Process row update
  const processRowUpdate = React.useCallback(
    async (newRow: GridRowModel, oldRow: GridRowModel): Promise<GridRowModel> => {
      // Run validation first if provided
      if (validateRow) {
        const validation = validateRow(newRow, oldRow);
        if (!validation.valid) {
          setToast({
            open: true,
            message: validation.message || "Invalid data",
            color: "error",
          });
          throw oldRow; // This will cause DataGrid to revert
        }
      }

      const mutation = computeMutation(newRow, oldRow);
      if (!mutation) {
        return oldRow;
      }

      // Show confirmation dialog
      return new Promise((resolve, reject) => {
        setConfirmMessage(`Apply the following changes? ${mutation}`);
        setPromiseArguments({ resolve, reject, newRow, oldRow });
        setConfirmOpen(true);
      });
    },
    [validateRow]
  );

  const handleConfirm = async () => {
    const { newRow, oldRow, reject, resolve } = promiseArguments;
    try {
      // Use custom processRowUpdate if provided, otherwise use default mutateRow
      const response = customProcessRowUpdate 
        ? await customProcessRowUpdate(newRow, oldRow)
        : await mutateRow(newRow);
      if (successMessage) {
        setToast({
          open: true,
          message: successMessage,
          color: "success",
        });
      }
      resolve(response);
    } catch (error: any) {
      onProcessRowUpdateError?.(error);
      reject(oldRow);
    } finally {
      setConfirmOpen(false);
      setPromiseArguments(null);
    }
  };

  const handleCancel = () => {
    const { oldRow, resolve } = promiseArguments;
    resolve(oldRow);
    setPromiseArguments(null);
    setConfirmOpen(false);
  };

  // Enhanced columns — auto-injects atom components
  const enhancedColumns = React.useMemo(() => {
    return columns.map((col) => {
      if (!col.editable) return col;

      // Date / DateTime
      if (col.type === "date" || col.type === "dateTime") {
        return {
          ...col,
          renderEditCell: (params: GridRenderEditCellParams) => (
          <Box sx={{ p: 1 }}>
            <DatePickerElement
              width="50%"
              value={params.value ? dayjs(params.value) : null}
              onChange={(newValue) =>
                params.api.setEditCellValue({
                  id: params.id,
                  field: params.field,
                  value: newValue ? newValue.toDate() : null,
                })
              }
            />
          </Box>
          ),
        };
      }

      // Boolean
      if (col.type === "boolean") {
        return {
          ...col,
          renderEditCell: (params: GridRenderEditCellParams) => (
            <Box sx={{ p: 1 }}>
              <Checkbox
                label=""
                checked={!!params.value}
                onChange={(e) =>
                  params.api.setEditCellValue({
                    id: params.id,
                    field: params.field,
                    value: e.target.checked,
                  })
                }
              />
            </Box>
          ),
        };
      }

      // Single Select
      if (col.type === "singleSelect") {
        return {
          ...col,
          renderEditCell: (params: GridRenderEditCellParams) => (
            <Box sx={{ p: 1 }}>
              <SingleSelectElement
                label={""}
                value={params.value ?? ""}
                options={col.options ?? []}
                onChange={(newValue) =>
                  params.api.setEditCellValue({
                    id: params.id,
                    field: params.field,
                    value: newValue,
                  })
                }
              />
            </Box>
          ),
        };
      }

      // Multi Select
      if (col.type === "multiSelect") {
        return {
          ...col,
          renderEditCell: (params: GridRenderEditCellParams) => (
            <Box sx={{ p: 1 }}>
              <MultiSelectElement
                label={""}
                value={Array.isArray(params.value) ? params.value : []}
                options={col.options ?? []}
                onChange={(newValue) =>
                  params.api.setEditCellValue({
                    id: params.id,
                    field: params.field,
                    value: newValue,
                  })
                }
              />
            </Box>
          ),
        };
      }

      // Text / Number (Default) - use DataGrid default
      return col;
    });
  }, [columns]);

  // DataGrid Styles (centralized)

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
    <Box sx={{ width: "100%" }}>
      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Changes"
        message={confirmMessage}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        confirmText="Yes, Apply"
        confirmColor="primary"
      />

      {/* DataGrid - Single scrollbar */}
      <Box sx={{ overflowX: "auto", width: "100%" }}>
      <DataGrid
        hideFooter
        rows={rows}
        columns={enhancedColumns as any}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={(error) => {
          // This is called when processRowUpdate rejects
          console.error('DataGrid processRowUpdate error:', error);
        }}
        sx={{
          width: '100%',
          minWidth: '100%',
            backgroundColor: resolvedBodyBg,
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: resolvedHeaderBg,
              fontWeight: 600,
            },
            "& .MuiDataGrid-columnHeadersInner": {
              backgroundColor: resolvedHeaderBg,
            },
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: `${resolvedHeaderBg} !important`,
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
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'visible',
              textOverflow: 'clip',
              maxWidth: 'none'
            },
            // allow cell content to wrap so rows grow to fit content (prevents overlap)
            "& .MuiDataGrid-cell": {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: '1.4',
              py: 1,
              overflow: 'visible',
              textOverflow: 'clip'
            },
            "& .MuiDataGrid-cellContent, & .MuiDataGrid-cellContent .MuiTypography-root": {
              overflow: 'visible',
              whiteSpace: 'normal'
            },
            // ensure header titles do not ellipsize
            "& .MuiDataGrid-columnHeaderTitleContainer, & .MuiDataGrid-columnHeaderTitle": {
              overflow: 'visible',
              whiteSpace: 'nowrap'
            },
            ...sx,
            ...dataGridBaseStyles
          }}
        />
      </Box>

      {/* Optional Export / Secondary Actions */}
      {exportActions && <Stack mt={2}>{exportActions}</Stack>}

      {/* Snackbar Toast */}
      {toast.open && (
        <Snackbar
          message={toast.message}
          color={toast.color}
          onClose={() => setToast({ ...toast, open: false })}
        />
      )}
    </Box>
  );
}
