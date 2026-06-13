import { Box, Typography, Divider, Link, Stack, useTheme } from "@mui/material";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { DocumentModal } from "./DocumentModal";
import { formatDateShort } from "../../../../../../utils/numberFormatter";
import { useGetAllDepartmentsQuery } from "../../../people/department/api/department.api";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { EmployeeAckListModal } from "./EmployeeAckListModal";
import { useNavigate } from "react-router-dom";
import {
  useCreateOrganizationDocumentMutation,
  useDeleteOrganizationDocumentMutation,
  useUpdateOrganizationDocumentMutation,
  type OrganizationDocumentFolder,
  type OrganizationDocumentType,
} from "../api/organization.api";
import type { StandardTableColumn } from "../../../../../../types/types";
import { Chip } from "../../../../../../components/atom/chips";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import { useNotificationHighlight } from "../../../../../../hooks/useNotificationHighlight";


interface DocumentPanelProps {
  folder: OrganizationDocumentFolder | null;
  onEditFolder: (folder: OrganizationDocumentFolder) => void;
  onDeleteFolder: (folderId: number) => void;
  highlightDocumentId?: number | null;
}

export const DocumentsPanel = ({ folder, onEditFolder, onDeleteFolder, highlightDocumentId = null }: DocumentPanelProps) => {

  const theme = useTheme();

  const navigate = useNavigate();
  
  // Use the highlight hook to handle deep linking and animations
  const { getHighlightSx, scrollToElement } = useNotificationHighlight(["documentId"]);

  const [folderAnchorEl, setFolderAnchorEl] = useState<null | HTMLElement>(null);
  const [documentAnchorEl, setDocumentAnchorEl] = useState<null | HTMLElement>(null);
  const [openEmployeeListModal, setOpenEmployeeListModal] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState<OrganizationDocumentType | null>(null);

  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'folder' | 'document' | null>(null);
  const [openDepartmentModal, setOpenDepartmentModal] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const { data: departmentsData } = useGetAllDepartmentsQuery();

  const [isEdit, setIsEdit] = useState(false);
  const [openDocumentModal, setOpenDocumentModal] = useState(false);

  // API Mutations
  const [createDocument] = useCreateOrganizationDocumentMutation();
  const [updateDocument] = useUpdateOrganizationDocumentMutation();
  const [deleteDocument] = useDeleteOrganizationDocumentMutation();

  const departmentNames = folder?.departments
    ?.map((deptId) =>
      deptId === "all"
        ? "All"
        : departmentsData?.data?.find((dept) => String(dept.id) === deptId)?.departmentName
    )
    .filter(Boolean) ?? [];

  // Scroll to document if highlighted
  useEffect(() => {
    if (highlightDocumentId && folder?.documentTypes) {
      if (folder.documentTypes.some(d => d.id === highlightDocumentId)) {
        scrollToElement(`org-doc-row-${highlightDocumentId}`, "center", 400);
      }
    }
  }, [highlightDocumentId, folder?.documentTypes, scrollToElement]);

  const handleFolderMenuClose = () => {
    setFolderAnchorEl(null);
  };

  const handleDocumentMenuOpen = (event: React.MouseEvent<HTMLElement>, row: any) => {
    setDocumentAnchorEl(event.currentTarget);
    setSelectedDocument(row);
  };

  const handleDocumentMenuClose = () => {
    setDocumentAnchorEl(null);
  };

  const handleEditFolderTrigger = () => {
    if (folder) onEditFolder(folder);
    handleFolderMenuClose();
  };

  const handleDeleteFolderTrigger = () => {
    setDeleteType('folder');
    setOpenConfirm(true);
    handleFolderMenuClose();
  };

  const handleEditDocumentTrigger = () => {
    setIsEdit(true);
    setOpenDocumentModal(true);
    handleDocumentMenuClose();
  };

  const handleDeleteDocumentTrigger = () => {
    setDeleteType('document');
    setOpenConfirm(true);
    handleDocumentMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (deleteType === 'folder' && folder) {
      onDeleteFolder(folder.id);
    } else if (deleteType === 'document' && selectedDocument && folder) {
      try {
        await deleteDocument(selectedDocument.id).unwrap();
        setSnackbar({
          open: true,
          message: "Document deleted successfully",
          color: "success",
        });
      } catch (error: any) {
        setSnackbar({
          open: true,
          message: error.data?.message || "Failed to delete document",
          color: "error",
        });
        console.error("Failed to delete document", error);
      }
    }
    setOpenConfirm(false);
    setDeleteType(null);
    setSelectedDocument(null);
  };

  const documentAddOpen = () => {
    setIsEdit(false);
    setSelectedDocument(null);
    setOpenDocumentModal(true);
  }

  const handleSaveDocument = async (data: FormData) => {
    if (!folder) return;
    try {
      if (isEdit && selectedDocument) {
        await updateDocument({
          folderId: folder.id,
          documentId: selectedDocument.id,
          body: data
        }).unwrap();
        setSnackbar({
          open: true,
          message: "Document updated successfully",
          color: "success",
        });
      } else {
        await createDocument({
          folderId: folder.id,
          body: data
        }).unwrap();
        setSnackbar({
          open: true,
          message: "Document created successfully",
          color: "success",
        });
      }
      setOpenDocumentModal(false);
      setSelectedDocument(null);

    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.data?.message || "Failed to save document",
        color: "error",
      });
      console.error("Failed to save document", error);

    }
  };

  // format bytes
  function formatBytes(bytes: number, decimals = 2) {
    if (bytes == null) return '-';
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  const columns: StandardTableColumn[] = [
    {
      id: "name",
      label: "Title",
      width: "15%",
      render: (row: OrganizationDocumentType) => (
        <Link
          component="button"
          underline="always"
          align="left"
          color="info"
          onClick={() => {
            navigate(`/people/org/document/acknowledge/${row.id}`, {
              state: { returnTab: 4, returnMainTab: 1, returnSubTab: 2 }
            })
          }}
          sx={{
            display: 'block',
            maxWidth: '100%',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
          {row.name}
        </Link>
      )
    },
    {
      id: "description",
      label: "Description",
      width: "20%",
      align: 'left',
      render: (row: OrganizationDocumentType) => (
        <Tooltip title={row.description || ""} placement="top-end">
          <Box
            sx={{
              width: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.description || "—"}
          </Box>
        </Tooltip>
      ),
    },
    {
      id: "acknowledgementRequired",
      label: "Acknowledgment Required",
      align: 'center',
      render: (row: OrganizationDocumentType) => row.acknowledgementRequired ? "Yes" : "No"
    },
    {
      id: "viewsAcknowledgement",
      label: "Views/Acknowledgement",
      align: 'center',
      render: (row: OrganizationDocumentType) => (
        <Link
          component="button"
          underline="always"
          color="info"
          onClick={() => {
            setSelectedDocument(row)
            setOpenEmployeeListModal(true)
          }}
        >
          View
        </Link>
      )
    },
    {
      id: "size",
      label: "Size",
      align: 'center',
      render: (row: OrganizationDocumentType) => formatBytes(row.totalAttachmentSize)
    },
    {
      id: "updatedAt",
      label: "Last Updated",
      align: 'center',
      render: (row: OrganizationDocumentType) => formatDateShort(row.updatedAt)
    },
    {
      id: "actions",
      label: "Actions",
      align: 'center',
      render: (row: any) => (
        <PrimaryIconButton
          variant="outlined"
          size="small"
          icon={<MoreVertIcon fontSize="small" titleAccess="Edit" />}
          onClick={(e) => handleDocumentMenuOpen(e, row)}
          sx={{ mr: 1 }}
        />
      )
    }
  ]

  if (!folder) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 5 }}>
        <Typography variant="body1" color="text.secondary">Select a folder to view documents</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: '100%',
          }}
        >
          <Box display="flex" flexDirection="column" gap={1} justifyContent='center' alignItems='flex-start' sx={{ width: '100%', minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{ whiteSpace: "nowrap", maxWidth: "100%" }}
            >
              {folder.folderName}
            </Typography>
            <Typography variant="caption" color="textSecondary">{folder.description}</Typography>
          </Box>
        </Box>

        <Box mt={1}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label={
                folder?.departments?.includes("all")
                  ? "Departments (All)"
                  : `Departments (${departmentNames?.length || 0})`
              }
              size="small"
              onClick={() => setOpenDepartmentModal(true)}
              sx={{
                ...theme.typography.caption
              }}
            />
            <Chip
              label={`Employee Type: ${folder.employeeType}`}
              size="small"
              sx={{
                ...theme.typography.caption
              }}
            />
          </Stack>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography variant="subtitle2">Documents</Typography>
          <PrimaryIconButton
            variant="outlined"
            size="small"
            icon={<AddIcon fontSize="small" titleAccess="Add Document" />}
            onClick={documentAddOpen}
            sx={{ mr: 1 }}
          />
        </Box>

        <StandardTable
          columns={columns}
          rows={folder?.documentTypes || []}
          getRowSx={(row) => ({
            ...getHighlightSx("documentId", row.id, theme),
          })}
          getRowId={(row) => `org-doc-row-${row.id}`}
          sticky
          tableSx={{ tableLayout: 'fixed' }}
        />
      </Box>

      {/* Folder Menu */}
      <MenuAtom
        anchorEl={folderAnchorEl}
        open={Boolean(folderAnchorEl)}
        onCloseAll={handleFolderMenuClose}
        items={[
          {
            label: "Edit",
            icon: <EditIcon fontSize="small" />,
            onClick: handleEditFolderTrigger,
          },
          {
            label: "Delete",
            icon: <DeleteIcon fontSize="small" color="error" />,
            onClick: handleDeleteFolderTrigger,
          },
        ]}
      />

      {/* Document Menu */}
      <MenuAtom
        anchorEl={documentAnchorEl}
        open={Boolean(documentAnchorEl)}
        onCloseAll={handleDocumentMenuClose}
        items={[
          {
            label: "Edit",
            icon: <EditIcon fontSize="small" />,
            onClick: handleEditDocumentTrigger,
          },
          {
            label: "Delete",
            icon: <DeleteIcon fontSize="small" color="error" />,
            onClick: handleDeleteDocumentTrigger,
          },
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

      <DocumentModal
        open={openDocumentModal}
        onClose={() => setOpenDocumentModal(false)}
        isEdit={isEdit}
        documentId={selectedDocument?.id}
        onSave={handleSaveDocument}
      />

      <EmployeeAckListModal
        open={openEmployeeListModal}
        onClose={() => {
          setOpenEmployeeListModal(false);
          setSelectedDocument(null);
        }}
        acknowledgementRequired={selectedDocument?.acknowledgementRequired}
        documentName={selectedDocument?.name}
        documentId={selectedDocument?.id}
      />

      <ModalElement
        open={openDepartmentModal}
        onClose={() => setOpenDepartmentModal(false)}
        title="Departments"
        maxWidth="xs"
      >
        <Box sx={{ p: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {departmentNames?.length ? (
            departmentNames?.map((dept) => (
              <Chip
                key={dept}
                label={dept}
                size="small"
              />
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">
              No departments assigned
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
  )
};
