import { Box, Typography, Divider, useTheme, Skeleton } from "@mui/material";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { useState } from "react";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import { EmpDocumentModal } from "./EmpDocumentModal";
import CardAtom from "../../../../../../components/atom/card/Card";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import {
  useGetEmployeeDocFolderByIdQuery,
  useGetEmployeeDocFolderTypesQuery,
  useDeleteEmployeeDocFolderTypeMutation,
  type EmployeeFolderType,
  type PermissionsType,
  type EmployeeDocumentType,
} from "../api/employee-doc.api";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { Stack } from "@mui/system";
import { Chip } from "../../../../../../components/atom/chips";

type EmpDocumentPanelProps = {
  folder: EmployeeFolderType | null;
  onEditFolder: (folder: EmployeeFolderType) => void;
  onDeleteFolder: (folderId: number) => void;
};

// ─── Skeleton for the folder header + permission chips ───────────────────────
const FolderHeaderSkeleton = () => (
  <Box>
    <Box display="flex" flexDirection="row" gap={0.7} alignItems="center" mb={0.5}>
      <Skeleton variant="text" width={180} height={32} />
      <Skeleton variant="text" width={100} height={20} />
    </Box>
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {[80, 110, 95].map((w, i) => (
        <Skeleton key={i} variant="rounded" width={w} height={24} sx={{ borderRadius: 4 }} />
      ))}
    </Stack>
  </Box>
);

// ─── Skeleton for a single document-type card ─────────────────────────────────
const DocumentCardSkeleton = () => (
  <CardAtom
    sx={{
      p: 1.5,
      border: "1px solid #e0e0e0",
      borderRadius: 2,
      boxShadow: "none",
    }}
  >
    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
      <Box flex={1}>
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="80%" height={18} sx={{ mt: 0.5 }} />
      </Box>
      <Skeleton variant="rounded" width={28} height={28} sx={{ ml: 1, borderRadius: 1 }} />
    </Box>
  </CardAtom>
);

// ─── Grid of card skeletons ───────────────────────────────────────────────────
const DocumentCardsSkeleton = ({ count = 4 }: { count?: number }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
    {Array.from({ length: count }).map((_, i) => (
      <DocumentCardSkeleton key={i} />
    ))}
  </Box>
);

const EmployeeDocumentTypePanel = ({
  folder,
  onEditFolder,
  onDeleteFolder,
}: EmpDocumentPanelProps) => {
  const theme = useTheme();

  const [folderAnchorEl, setFolderAnchorEl] = useState<null | HTMLElement>(null);
  const [documentAnchorEl, setDocumentAnchorEl] = useState<null | HTMLElement>(null);

  const [selectedDocument, setSelectedDocument] = useState<EmployeeDocumentType | null>(null);

  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'folder' | 'document' | null>(null);

  const [openPermissionModal, setOpenPermissionModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<{
    label: string;
    roles: string[];
  } | null>(null);

  const [isEdit, setIsEdit] = useState(false);
  const [openDocumentModal, setOpenDocumentModal] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const {
    data: folderDocumentData,
    isLoading: isFolderLoading,
  } = useGetEmployeeDocFolderByIdQuery(folder?.id || 0, {
    skip: !folder?.id,
  });

  const {
    data: documentTypes,
    isLoading: isDocTypesLoading,
  } = useGetEmployeeDocFolderTypesQuery(folder?.id || 0, {
    skip: !folder?.id,
  });

  const [deleteDocumentType] = useDeleteEmployeeDocFolderTypeMutation();

  const handleFolderMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFolderAnchorEl(event.currentTarget);
  };

  const handleFolderMenuClose = () => {
    setFolderAnchorEl(null);
  };

  const handleDocumentMenuOpen = (event: React.MouseEvent<HTMLElement>, row: EmployeeDocumentType) => {
    setDocumentAnchorEl(event.currentTarget);
    setSelectedDocument(row);
  };

  const handleDocumentMenuClose = () => {
    setDocumentAnchorEl(null);
  };

  const handleEditFolder = () => {
    if (folder) {
      onEditFolder(folder);
    }
    handleFolderMenuClose();
  };

  const handleDeleteFolder = () => {
    setDeleteType('folder');
    setOpenConfirm(true);
    handleFolderMenuClose();
  };

  const handleEditDocument = () => {
    setIsEdit(true);
    setOpenDocumentModal(true);
    handleDocumentMenuClose();
  };

  const handleOpenPermissionModal = (perm: { label: string; roles: string[] }) => {
    setSelectedPermission(perm);
    setOpenPermissionModal(true);
  };

  const handleDeleteDocument = () => {
    setDeleteType('document');
    setOpenConfirm(true);
    handleDocumentMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (deleteType === 'folder' && folder) {
      onDeleteFolder(folder.id);
    } else if (deleteType === 'document' && selectedDocument) {
      try {
        await deleteDocumentType(selectedDocument.id).unwrap();
        setSnackbar({
          open: true,
          message: "Document type deleted successfully",
          color: "success",
        });
      } catch (error: any) {
        setSnackbar({
          open: true,
          message: error?.data?.message || "Failed to delete document type",
          color: "error",
        });
      }
    }
    setOpenConfirm(false);
    setDeleteType(null);
    setSelectedDocument(null);
  };

  const documentAddOpen = () => {
    setIsEdit(false);
    setOpenDocumentModal(true);
  };

  const getPermissionMatrix = (data?: EmployeeFolderType) => {
    if (!data) return [];

    const result: { label: string; roles: string[] }[] = [];

    const permissionTypes: { key: keyof PermissionsType; label: string }[] = [
      { key: "view", label: "View" },
      { key: "download", label: "Download" },
      { key: "addUpdate", label: "Update" },
    ];

    permissionTypes.forEach((perm) => {
      const roles: string[] = [];

      if (data.employeeSelfPermission[perm.key]) roles.push("Employee");
      if (data.reportingManagerPermission[perm.key]) roles.push("Reporting Manager");
      if (data.globalAdminPermission[perm.key]) roles.push("Admin");

      if (roles.length > 0) {
        result.push({ label: perm.label, roles });
      }
    });

    return result;
  };

  return (
    <>
      <Box>
        {/* ── Folder header ─────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            mb: 0.5,
          }}
        >
          {isFolderLoading ? (
            <FolderHeaderSkeleton />
          ) : (
            <Box>
              <Box display="flex" flexDirection="column" gap={0.5} justifyContent="flex-start" alignItems="flex-start" sx={{ maxWidth: "100%", width: "100%", overflow: "hidden" }}>
                {!folderDocumentData ? (
                  <Typography variant="body2" noWrap sx={{ maxWidth: "100%" }}>
                    Get started by creating a folder first
                  </Typography>
                ) : (
                  <Typography
                    variant={folder ? "h6" : "body2"}
                    sx={{
                      maxWidth: "100%",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    {folderDocumentData.documentFolderName}
                  </Typography>
                )}
                {folderDocumentData?.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{
                      display: "block",
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {folderDocumentData?.description}
                  </Typography>
                )}
              </Box>

              <Box sx={{ mt: 1 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {getPermissionMatrix(folderDocumentData).map((perm) => (
                    <Chip
                      key={perm.label}
                      label={`${perm.label} access (${perm.roles.length})`}
                      size="small"
                      onClick={() => handleOpenPermissionModal(perm)}
                      sx={{ ...theme.typography.caption }}
                    />
                  ))}
                </Stack>
              </Box>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* ── Document types header ──────────────────────────────────────────── */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          {folder && (
            <Typography variant="subtitle1" color="textPrimary">
              Document Types
            </Typography>
          )}
          {folder?.id && (
            <PrimaryIconButton
              variant="outlined"
              size="small"
              icon={<AddIcon fontSize="small" titleAccess="Add Document" />}
              onClick={documentAddOpen}
              sx={{ mr: 1 }}
            />
          )}
        </Box>

        {/* ── Document type cards ────────────────────────────────────────────── */}
        {isDocTypesLoading ? (
          <DocumentCardsSkeleton count={4} />
        ) : documentTypes?.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", mt: 5 }}>
            <Typography variant="body1" color="textSecondary">
              No document types found
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {(documentTypes || []).map((d: EmployeeDocumentType) => (
              <CardAtom
                key={d.id}
                sx={{
                  p: 1.5,
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  boxShadow: "none",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {d.documentTypeName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {d.description}
                    </Typography>
                  </Box>
                  <PrimaryIconButton
                    variant="outlined"
                    size="small"
                    icon={<MoreVertIcon fontSize="small" titleAccess="Edit" />}
                    onClick={(e) => handleDocumentMenuOpen(e, d)}
                    sx={{ ml: 1 }}
                  />
                </Box>
              </CardAtom>
            ))}
          </Box>
        )}
      </Box>

      {/* Folder Menu */}
      <MenuAtom
        anchorEl={folderAnchorEl}
        open={Boolean(folderAnchorEl)}
        onCloseAll={handleFolderMenuClose}
        items={[
          { label: "Edit", icon: <EditIcon fontSize="small" />, onClick: handleEditFolder },
          { label: "Delete", icon: <DeleteIcon fontSize="small" color="error" />, onClick: handleDeleteFolder },
        ]}
      />

      {/* Document Menu */}
      <MenuAtom
        anchorEl={documentAnchorEl}
        open={Boolean(documentAnchorEl)}
        onCloseAll={handleDocumentMenuClose}
        items={[
          { label: "Edit", icon: <EditIcon fontSize="small" />, onClick: handleEditDocument },
          { label: "Delete", icon: <DeleteIcon fontSize="small" color="error" />, onClick: handleDeleteDocument },
        ]}
      />

      <ConfirmDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={deleteType === 'folder' ? "Delete Folder" : "Delete Document"}
        confirmColor="error"
        confirmText="Delete"
        message={`Are you sure you want to delete this ${deleteType}?`}
      />

      <EmpDocumentModal
        open={openDocumentModal}
        onClose={() => {
          setOpenDocumentModal(false);
          setSelectedDocument(null);
        }}
        isEdit={isEdit}
        editRow={selectedDocument}
        folderId={folder?.id || 0}
      />

      {/* Permission Modal */}
      <ModalElement
        open={openPermissionModal}
        onClose={() => setOpenPermissionModal(false)}
        title={`${selectedPermission?.label} Access`}
        maxWidth="xs"
      >
        <Box sx={{ p: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {selectedPermission?.roles.length ? (
            selectedPermission.roles.map((role) => (
              <Chip label={role} key={role} size="small" />
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">
              No roles available
            </Typography>
          )}
        </Box>
      </ModalElement>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
    </>
  );
};

export default EmployeeDocumentTypePanel;