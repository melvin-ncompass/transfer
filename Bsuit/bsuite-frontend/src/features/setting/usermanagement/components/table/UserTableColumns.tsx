
import { Box, IconButton, Tooltip } from "@mui/material";
import { Delete, Send } from "@mui/icons-material";
import type { GridColDef } from "@mui/x-data-grid";
import { formatDateShort } from "../../../../../utils/numberFormatter";
import { Chip } from "../../../../../components/atom/chips/Chips";

interface ColumnParams {
  currentUserEmail: string;
  setSelectedRow: (id: string) => void;
  setDeleteDialog: (open: boolean) => void;
  onResendInvite: (email: string, roleName: string) => void;
}

export const getUserTableColumns = ({
  currentUserEmail,
  setSelectedRow,
  setDeleteDialog,
  onResendInvite,
  hideActionsColumn = false,
}: ColumnParams & { hideActionsColumn?: boolean }): GridColDef[] => {
  const baseColumns: GridColDef[] = [
    { field: "userName", headerName: "User Name", flex: 0.7 },
    { field: "email", headerName: "Email", flex: 1.5 },
    { field: "role", headerName: "Role", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const status = String(params.value ?? "");
        const normalizedStatus = status.toLowerCase();

        const chipColor =
          normalizedStatus === "active"
            ? "success"
            : normalizedStatus === "owner"
              ? "primary"
              : normalizedStatus === "inactive"
                ? "warning"
                : normalizedStatus === "invitation sent"
                  ? "info"
                  : "default";

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 ,justifyContent:"center",height: "100%", width: "100%" }}>
            <Chip label={status || "-"} color={chipColor as any} size="small" />

            {normalizedStatus === "invitation sent" && (
              <Tooltip title="Resend invitation" arrow>
                <IconButton
                  size="small"
                  color="info"
                  onClick={() =>
                    onResendInvite(
                      String(params.row.email ?? ""),
                      String(params.row.role ?? "")
                    )
                  }
                  sx={{ p: 0.25 }}
                >
                  <Send sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
    {
      field: "joinedAt",
      headerName: "Created",
      flex: 1,
      renderCell: (params) => formatDateShort(params.row.joinedAt),
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      flex: 0.5,
      renderCell: ({ row }) => {
        const isCurrentUser = row.email === currentUserEmail;
        const isOwner = row.status === "Owner";

        const disableDelete = isCurrentUser || isOwner;

        let tooltipText = "Delete user";
        if (isCurrentUser && isOwner)
          tooltipText = "The Owner and the currently logged-in user cannot be deleted.";
        else if (isCurrentUser) tooltipText = "You cannot delete the logged in user";
        else if (isOwner) tooltipText = "Owner cannot be deleted";

        return (
          <Tooltip title={tooltipText} arrow>
            <span>
              <IconButton
                color="error"
                disabled={disableDelete}
                onClick={() => {
                  setSelectedRow(row.id);
                  setDeleteDialog(true);
                }}
              >
                <Delete />
              </IconButton>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  return hideActionsColumn
    ? baseColumns.filter((col) => col.field !== "actions")
    : baseColumns;
};
