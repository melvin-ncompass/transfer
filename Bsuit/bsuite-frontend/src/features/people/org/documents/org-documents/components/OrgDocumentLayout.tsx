import { Box, Typography, useTheme, Skeleton, List, ListItemButton, ListItemText, IconButton, alpha } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import { FolderModal } from "./FolderModal";
import { DocumentsPanel } from "./DocumentPanel";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  useCreateOrganizationDocumentFolderMutation,
  useDeleteOrganizationDocumentFolderMutation,
  useUpdateOrganizationDocumentFolderMutation,
  useGetOrganizationDocumentFoldersQuery,
  type CreateOrganizationDocumentFolderRequest,
  type OrganizationDocumentFolder
} from '../api/organization.api'
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { useNotificationHighlight } from "../../../../../../hooks/useNotificationHighlight";

export const OrgDocumentLayout = () => {
  const theme = useTheme();
  
  // Hook for handling notification deep links and highlights
  const { highlightedValues, getHighlightSx, scrollToElement } = useNotificationHighlight(["folderId", "documentId"]);

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingFolder, setEditingFolder] = useState<OrganizationDocumentFolder | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });
  const [openConfirm, setOpenConfirm] = useState(false);

  const folderListScrollRef = useRef<HTMLDivElement | null>(null);

  const { data: folders = [], isLoading, isFetching } = useGetOrganizationDocumentFoldersQuery();
  const [createFolder] = useCreateOrganizationDocumentFolderMutation();
  const [updateFolder] = useUpdateOrganizationDocumentFolderMutation();
  const [deleteFolder] = useDeleteOrganizationDocumentFolderMutation();

  // Initial selection and deep link handling
  useEffect(() => {
    if (isLoading || isFetching || !folders.length) return;

    if (highlightedValues.folderId) {
      const fId = Number(highlightedValues.folderId);
      if (folders.some(f => f.id === fId)) {
        setSelectedFolderId(fId);
        scrollToElement(`org-doc-folder-${fId}`, "nearest", 200);
        return;
      }
    }

    if (!selectedFolderId || !folders.some(f => f.id === selectedFolderId)) {
      setSelectedFolderId(folders[0].id);
    }
  }, [folders, isLoading, isFetching, highlightedValues.folderId, scrollToElement]);

  const selectedIndex = folders.findIndex(
    (f) => f.id === selectedFolderId
  );

  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const selectedFolder = folders[safeIndex] ?? null;

  // Menu State
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeFolder, setActiveFolder] = useState<OrganizationDocumentFolder | null>(null);

  const [folderToDelete, setFolderToDelete] = useState<OrganizationDocumentFolder | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, folder: OrganizationDocumentFolder) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setActiveFolder(folder);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setActiveFolder(null);
  };

  const getMenuItems = () => {
    if (!activeFolder) return [];
    return [
      {
        label: "Edit",
        icon: <EditIcon fontSize="small" />,
        onClick: () => {
          handleEditFolder(activeFolder);
          handleCloseMenu();
        }
      },
      {
        label: "Delete",
        icon: <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />,
        onClick: () => {
          setFolderToDelete(activeFolder);
          setOpenConfirm(true);
        }
      }
    ];
  };

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setIsEdit(false);
    setOpen(true);
  };

  const handleEditFolder = (folder: OrganizationDocumentFolder) => {
    setEditingFolder(folder);
    setIsEdit(true);
    setOpen(true);
  };

  const handleSave = async (data: CreateOrganizationDocumentFolderRequest) => {
    try {
      if (isEdit && editingFolder) {
        const result = await updateFolder({ id: editingFolder.id, body: data }).unwrap();
        setActiveFolder(result);
        setSelectedFolderId(result.id);
        setSnackbar({
          open: true,
          message: "Folder updated successfully",
          color: "success",
        });
      } else {
        const result = await createFolder(data).unwrap();
        setActiveFolder(result);
        setSelectedFolderId(result.id);
        setSnackbar({
          open: true,
          message: "Folder created successfully",
          color: "success",
        });
      }
      setOpen(false);
      setEditingFolder(null);
      setIsEdit(false);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.data?.message || "Failed to save folder",
        color: "error",
      });
      console.error("Failed to save folder", error);
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    try {
      await deleteFolder(folderId).unwrap();
      setSnackbar({
        open: true,
        message: "Folder deleted successfully",
        color: "success",
      });
      // Adjust selected index if necessary
      if (selectedFolderId === folderId) {
        const remaining = folders.filter(f => f.id !== folderId);
        setSelectedFolderId(remaining[0]?.id ?? null);
        window.setTimeout(() => {
          folderListScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }, 0);
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.data?.message || "Failed to delete folder",
        color: "error",
      });
      console.error("Failed to delete folder", error);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          height: "100%",
          overflow: "hidden",
          pb: 0,
        }}
      >
        <Box
          sx={{
            flex: "0 0 18%",
            borderRight: `1px solid ${theme.palette.divider}`,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            height: "100%",
          }}
        >
          <Box
            sx={{
              px: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="subtitle2">Folders</Typography>

            <PrimaryIconButton
              title="Add folder"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateFolder();
              }}
              icon={<AddIcon fontSize="small" />}
              size="small"
            />
          </Box>

          <Box ref={folderListScrollRef} sx={{ flex: 1, overflowY: "scroll" }}>
            {isLoading ? (
              <Box sx={{ px: 1, pt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} height={48} />
                ))}
              </Box>
            ) : (
              <List className="folder-list" sx={{
                borderRadius: 1,
                flex: 1,
                minHeight: 0,
                height: "100%",
                pr: 1,
              }}>
                {!folders || folders.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      No folders available
                    </Typography>
                  </Box>
                ) : (
                  folders.map((folder) => {
                    const isSelected = selectedFolderId === folder.id;
                    return (
                      <ListItemButton
                        key={folder.id}
                        id={`org-doc-folder-${folder.id}`}
                        selected={isSelected}
                        onClick={() => setSelectedFolderId(folder.id)}
                        sx={{
                          pl: 3,
                          borderRadius: 1,
                          mb: 0.5,
                          py: 0.25,
                          minHeight: 20,
                          alignItems: "flex-start",
                          bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.16) : "transparent",
                          color: isSelected ? "primary.main" : "text.primary",
                          "&:hover": {
                            bgcolor: isSelected
                              ? alpha(theme.palette.primary.main, 0.24)
                              : "action.hover",
                          },
                          ...getHighlightSx("folderId", folder.id, theme),
                        }}
                      >
                        <ListItemText
                          primary={folder.folderName}
                          slotProps={{
                            primary: {
                              variant: "body2",
                              sx: {
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                              },
                            },
                          }}
                          sx={{ minWidth: 0, pr: 1 }}
                        />
                        <IconButton size="small" onClick={(e) => handleOpenMenu(e, folder)}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </ListItemButton>
                    );
                  }))}
              </List>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            pl: 3,
          }}
        >
          <DocumentsPanel
            folder={selectedFolder}
            onEditFolder={handleEditFolder}
            onDeleteFolder={handleDeleteFolder}
            highlightDocumentId={highlightedValues.documentId ? Number(highlightedValues.documentId) : null}
          />
        </Box>
      </Box>
      <MenuAtom
        items={getMenuItems()}
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onCloseAll={handleCloseMenu}
      />
      <FolderModal
        open={open}
        onSave={handleSave}
        onClose={() => setOpen(false)}
        isEdit={isEdit}
        editRow={editingFolder}
      />

      <ConfirmDialog
        open={openConfirm}
        onClose={() => {
          setOpenConfirm(false);
          setFolderToDelete(null);
          handleCloseMenu();
        }}
        onConfirm={() => {
          if (folderToDelete?.id) {
            handleDeleteFolder(folderToDelete.id);
          }
          setOpenConfirm(false);
          setFolderToDelete(null);
          handleCloseMenu();
        }}
        title="Delete Folder"
        confirmColor="error"
        message="Are you sure you want to delete this folder?"
      />
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
