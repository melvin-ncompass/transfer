import { useMemo, useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { StandardTable } from "../../../../../../../components/tables/standard-table";
import MenuAtom, { type MenuAtomItem } from "../../../../../../../components/menuatom/MenuAtom";
import { Tooltip } from "../../../../../../../components/atom/tooltip";
import { ConfirmDialog } from "../../../../../../../components/dialogs/confirm-dialog";
import { useNavigate } from "react-router-dom";
import { useGetIncomeTaxesQuery, useDeleteIncomeTaxMutation } from "../api/incometax.api";
import type { IncomeTaxVersion } from "../types/incometax.types";
import { isSystemTaxRegimeConfig } from "../utils/incomeTaxConfigUtils";

interface IncomeTaxRow {
  id: string;
  configName: string;
  nonTaxableAmount: string;
  default?: boolean;
}

export interface IncomeTaxTabProps {
  /** When user clicks Edit, open modal with this version’s data. */
  onEditClick?: (versionId: number) => void;
  /** Called after successful delete (e.g. show snackbar). */
  onDeleteSuccess?: (message: string) => void;
  /** Called after failed delete (e.g. show snackbar). */
  onDeleteError?: (message: string) => void;
  /** When true, the list endpoint is not called (e.g. when this tab is not active). */
  skipQuery?: boolean;
}

function formatAmount(value: number | null | undefined): string {
  if (value == null) return "–";
  return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function IncomeTaxTab({
  onEditClick,
  onDeleteSuccess,
  onDeleteError,
  skipQuery = false,
}: IncomeTaxTabProps = {}) {
  const navigate = useNavigate();
  const { data: incomeTaxes = [], isLoading } = useGetIncomeTaxesQuery(undefined, {
    skip: skipQuery,
  });
  const [deleteIncomeTax] = useDeleteIncomeTaxMutation();

  const rows: IncomeTaxRow[] = useMemo(
    () =>
      incomeTaxes.map((v: IncomeTaxVersion) => ({
        id: String(v.id),
        configName: v.config?.configName ?? "–",
        nonTaxableAmount: formatAmount(v.nonTaxableAmount),
        default: false,
      })),
    [incomeTaxes],
  );

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuRowId, setMenuRowId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<IncomeTaxRow | null>(null);

  const openDeleteDialog = (row: IncomeTaxRow) => {
    setRowToDelete(row);
    setDeleteDialogOpen(true);
    closeMenu();
  };

  const handleEdit = (row: IncomeTaxRow) => {
    onEditClick?.(Number(row.id));
    closeMenu();
  };

  const handleDeleteConfirm = async () => {
    if (!rowToDelete) return;
    try {
      await deleteIncomeTax(Number(rowToDelete.id)).unwrap();
      onDeleteSuccess?.("Income Tax configuration deleted successfully.");
    } catch (err: any) {
      const msg = err?.data?.message ?? err?.message ?? "Failed to delete.";
      onDeleteError?.(Array.isArray(msg) ? msg.join(" ") : String(msg));
    }
    setDeleteDialogOpen(false);
    setRowToDelete(null);
  };

  const openMenu = (event: React.MouseEvent<HTMLElement>, rowId: string) => {
    setMenuAnchor(event.currentTarget);
    setMenuRowId(rowId);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRowId(null);
  };

  const columns = [
    {
      id: "configName",
      label: "Config Name",
      render: (row: IncomeTaxRow) => (
        <Typography
          variant="body2"
          color="info.main"
          sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
          onClick={() => navigate(`/people/configs/${row.id}`)}
        >
          {row.configName}
        </Typography>
      ),
    },
    {
      id: "nonTaxableAmount",
      label: "Non-Taxable Amount",
      align: "right" as const,
      headerAlign: "right" as const,
    },
    {
      id: "actions",
      label: "Actions",
      render: (row: IncomeTaxRow) => {
        const isLocked = row.default || isSystemTaxRegimeConfig(row.configName);
        return isLocked ? (
          <Tooltip title={row.default ? "Default configuration cannot be edited or deleted" : "Old Tax Regime and New Tax Regime cannot be edited or deleted"}>
            <LockIcon color="disabled" sx={{ ml: 1, cursor: "pointer" }} />
          </Tooltip>
        ) : (
          <IconButton
            onClick={(e) => openMenu(e, row.id)}
            size="small"
            sx={{ ml: 1 }}
            aria-label="Actions"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        );
      },
    },
  ];

  // Build menu items dynamically based on row
  const menuItems: MenuAtomItem[] = menuRowId
    ? [
        {
          label: "Edit",
          icon: <EditIcon fontSize="small" />,
          onClick: () => {
            const row = rows.find((r) => r.id === menuRowId);
            if (row) handleEdit(row);
          },
        },
        {
          label: "Delete",
          icon: <DeleteIcon fontSize="small" />,
          onClick: () => {
            const row = rows.find((r) => r.id === menuRowId);
            if (row) openDeleteDialog(row);
          },
        },
      ]
    : [];

  return (
    <Box>
      <StandardTable columns={columns} rows={rows} loading={isLoading} sticky />

      {menuAnchor && menuRowId && (
        <MenuAtom
          open={Boolean(menuAnchor)}
          anchorEl={menuAnchor}
          items={menuItems}
          onCloseAll={closeMenu}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setRowToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Income Tax Configuration"
        message={
          rowToDelete
            ? `Are you sure you want to delete "${rowToDelete.configName}"? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        confirmColor="error"
      />
    </Box>
  );
}
