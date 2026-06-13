import { useMemo, useState } from "react";
import { Box, IconButton, Stack } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { RadioButton } from "../../../../../../../components/atom/radio-button";
import { StandardTable } from "../../../../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../../../../types/types";
import {
  useSetDefaultPayslipTemplateMutation,
  useDeletePayslipTemplateMutation,
} from "../api/payslip.api";
import CustomCircularProgress from "../../../../../../../components/atom/circular-progress/CircularProgress";
import PayslipEditor from "./PayslipCustomizationModal";
import type { PayslipTemplate } from "../types/payslipTypes";
import { Snackbar } from "../../../../../../../components/atom/snackbar";
import { ConfirmDialog } from "../../../../../../../components/dialogs/confirm-dialog";
import { useGetImagesQuery } from "../../../../../../setting/companyDetails/api/companyBranding.api";
import { useGetIdentityQuery } from "../../../../../../setting/companyIdentity/components/identity.api";
import { set } from "lodash-es";
import { MoreVert } from "@mui/icons-material";
import MenuAtom from "../../../../../../../components/menuatom/MenuAtom";

export interface PayslipTemplateTableProps {
  /** Payslip templates from parent (PayrunView) – fetched only when Settings > Payslip Customization is active. */
  data?: PayslipTemplate[];
  /** Loading state from parent fetch. */
  isLoading?: boolean;
}

function PayslipTemplateTable({
  data = [],
  isLoading = false,
}: PayslipTemplateTableProps) {
  const [setDefaultTemplate] = useSetDefaultPayslipTemplateMutation();
  const [deleteTemplate] = useDeletePayslipTemplateMutation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PayslipTemplate | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleAddMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    row: any,
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedRow(row.raw);
  };

  const handleAddMenuClose = () => {
    setMenuAnchor(null);
  };

  const { data: branding } = useGetImagesQuery();
  const { data: identity } = useGetIdentityQuery();
  const rows = useMemo(() => {
    return (data || []).map((t) => ({
      id: String(t.id),
      name: t.templateName,
      isDefault: t.isDefault,
      raw: t,
    }));
  }, [data]);

  // ================= DEFAULT =================
  const defaultId = useMemo(() => rows.find((r) => r.isDefault)?.id, [rows]);

  const handleDefaultChange = async (id: string) => {
    try {
      await setDefaultTemplate(Number(id)).unwrap();
      showSnack("Template set as default successfully","success")
    } catch (e: any) {
      console.error("Failed to set default", e);
      showSnack(e?.data?.message ?? e?.error ?? e?.message ?? "Failed to set default template.", "error");
    }
  };

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  // ================= EDIT =================
  const handleEdit = (row: any) => {
    console.log("edit", row.raw);
    setSelectedRow(row.raw);
    setIsEditModalOpen(true);
  };

  // ================= DELETE =================
  const handleDeleteModal = (row: any) => {
    setSelectedRow(row.raw);
    setIsDeleteModalOpen(true);
  };
  const handleDelete = async (row: any) => {
    try {
      await deleteTemplate(Number(row.id)).unwrap();
      showSnack("Template deleted successfully", "success");
      setSelectedRow(null);
    } catch (e: any) {
      console.error("delete failed", e);
      showSnack(e?.data?.message ?? e?.error ?? e?.message ?? "Failed to delete template.", "error");
    }
  };

  // ================= COLUMNS =================
  const columns: StandardTableColumn[] = [
    {
      id: "name",
      label: "Template Name",
      width: 600,
    },
    {
      id: "default",
      label: "Default",
      width: 50,
      render: (row) => (
        <RadioButton
          size="small"
          checked={defaultId === row.id}
          onChange={() => handleDefaultChange(row.id)}
          
        />
      ),
      align: "center",
    },
    {
      id: "actions",
      label: "Actions",
      width: 50,
      render: (row) => (
        <>
          <IconButton onClick={(e) => handleAddMenuOpen(e, row)} size="small" sx={{padding:0}}>
            <MoreVert  fontSize="small" sx={{padding:0}}/>
          </IconButton>

          {selectedRow?.id === row.raw.id && menuAnchor && (
            <MenuAtom
              items={[
                {
                  label: "Edit",
                  onClick: () => {
                    handleAddMenuClose();
                    handleEdit(row);
                  },
                },
                {
                  label: "Delete",
                  onClick: () => {
                    handleAddMenuClose();
                    handleDeleteModal(row);
                  },
                },
              ]}
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onCloseAll={handleAddMenuClose}
            />
          )}
        </>
      ),
      align: "center",
    },
  ];

  if (isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" py={3}>
        <CustomCircularProgress size={24} />
      </Stack>
    );
  }

  return (
    <Box>
      <StandardTable rows={rows} columns={columns} />
      <PayslipEditor
        title="Edit Template"
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        data={selectedRow}
        onSuccess={() => {
          showSnack("Template updated successfully", "success");
          setIsEditModalOpen(false);
        }}
        onError={(error) => {
          showSnack(error || "Failed to update template", "error");
        }}
        branding={branding}
        identity={identity}
      />
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
      <ConfirmDialog
        title="Delete Template"
        message="Are you sure you want to delete this template?"
        open={isDeleteModalOpen}
        confirmText="Delete"
        confirmColor="error"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          handleDelete(selectedRow);
          setIsDeleteModalOpen(false);
        }}
      />
    </Box>
  );
}

export default PayslipTemplateTable;
