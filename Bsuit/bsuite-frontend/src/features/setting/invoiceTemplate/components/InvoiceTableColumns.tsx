import { IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { GridColDef } from "@mui/x-data-grid";

import { RadioButton } from "../../../../components/atom/radio-button";
import type { StandardTableColumn } from "../../../../types/types";

interface ColumnParams {
  onEdit: (row: any) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export const getInvoiceTableColumns = ({
  onEdit,
  onDelete,
  onSetDefault,
}: ColumnParams): StandardTableColumn[] => [
  // Template Name
  {
    id: "templateName",
    label: "Template Name",
    flex: 1.5,
    minWidth: 200,
  },

  // Default
  {
    id: "isDefault",
    label: "Default",
    align: "center",
    headerAlign: "center",
    flex: 0.6,
    render: (row: any) => (
      <RadioButton
        checked={Boolean(row.isDefault)}
        onChange={(e) => {
          e.stopPropagation();
          onSetDefault(String(row.id));
        }}
      />
    ),
  },

  // Edit
  {
    id: "edit",
    label: "Edit",
    align: "center",
    headerAlign: "center",
    flex: 0.4,
    render: (row: any) => (
      <Tooltip title="Edit Template">
        <IconButton
          color="primary"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(row);
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),
  },

  // Delete
  {
    id: "delete",
    label: "Delete",
    align: "center",
    headerAlign: "center",
    flex: 0.4,
    render: (row: any) => {
      const isDefault = row.isDefault;
      return (
        <Tooltip
          title={
            isDefault
              ? "Default template cannot be deleted"
              : "Delete Template"
          }
        >
          <span>
            <IconButton
              color="error"
              size="small"
              disabled={isDefault}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(String(row.id));
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      );
    },
  },
];
