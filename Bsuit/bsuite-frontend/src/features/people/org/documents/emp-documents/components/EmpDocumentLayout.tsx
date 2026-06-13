import { Box, Skeleton, Typography, useTheme, List, ListItemButton, ListItemText, IconButton, alpha } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import { EmpFolderModal } from "./EmpFolderModal";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EmployeeDocumentTypePanel from "./EmpDocumentPanel";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import {
    useGetEmployeeDocFoldersQuery,
    useDeleteEmployeeDocFolderMutation,
    type EmployeeFolderType,
    useCreateEmployeeDocFolderMutation,
    useUpdateEmployeeDocFolderMutation,
    type EmployeeFolderRequestType,
} from "../api/employee-doc.api";

export const EmployeeDocumentLayout = () => {
    const theme = useTheme();

    // ─── API hooks ───
    const { data: folders = [], isLoading } = useGetEmployeeDocFoldersQuery();
    const [deleteEmployeeFolder] = useDeleteEmployeeDocFolderMutation();
    const [createEmployeeFolder] = useCreateEmployeeDocFolderMutation();
    const [updateEmployeeFolder] = useUpdateEmployeeDocFolderMutation();

    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editFolder, setEditFolder] = useState<EmployeeFolderType | null>(null);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState<number | null>(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        color: "success" as "success" | "error",
    });

    const folderListScrollRef = useRef<HTMLDivElement | null>(null);

    const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) || null;

    useEffect(() => {
        if (folders.length > 0 && !selectedFolderId) {
            setSelectedFolderId(folders[0].id);
        }
    }, [folders, selectedFolderId]);

    // Menu State
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [activeFolder, setActiveFolder] = useState<EmployeeFolderType | null>(null);

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, folder: EmployeeFolderType) => {
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
                    setFolderToDelete(activeFolder.id);
                    setOpenConfirm(true);
                    handleCloseMenu();
                }
            }
        ];
    };

    const handleAddFolder = () => {
        setIsEdit(false);
        setEditFolder(null);
        setOpen(true);
    };

    const showSnackbar = (message: string, color: "success" | "error") => {
        setSnackbar({ open: true, message, color });
    };

    const handleEditFolder = (folder: EmployeeFolderType) => {
        setIsEdit(true);
        setEditFolder(folder);
        setOpen(true);
    };

    const handleDeleteFolder = async (folderId: number) => {
        const wasSelected = selectedFolderId === folderId;
        try {
            await deleteEmployeeFolder(folderId).unwrap();
            showSnackbar("Folder deleted successfully", "success");

            if (wasSelected) {
                const remaining = folders.filter((f) => f.id !== folderId);
                const nextId = remaining[0]?.id ?? null;
                setSelectedFolderId(nextId);
                window.setTimeout(() => {
                    folderListScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                }, 0);
            }
        } catch (error: any) {
            const errorMessage = error?.data?.message || "Failed to delete folder";
            showSnackbar(errorMessage, "error");
        }
    };

    const handleConfirmDelete = async () => {
        if (folderToDelete !== null) {
            await handleDeleteFolder(folderToDelete);
            setFolderToDelete(null);
        }
        setOpenConfirm(false);
    };

    const handleSaveFolder = async (folderData: EmployeeFolderRequestType) => {
        try {
            if (isEdit && editFolder) {
                const res = await updateEmployeeFolder(
                    {
                        id: editFolder.id,
                        body: folderData
                    }).unwrap();
                setSelectedFolderId(res.id);
                showSnackbar("Folder updated successfully", "success");
            } else {
                const res = await createEmployeeFolder(folderData).unwrap();
                setSelectedFolderId(res.id);
                showSnackbar("Folder created successfully", "success");
            }
            setOpen(false);
            setEditFolder(null);
        } catch (error: any) {
            const errorMessage = error?.data?.message || "Failed to save folder";
            showSnackbar(errorMessage, "error");
            throw error;
        }
    };

    return (
        <>
            <Box
                sx={{
                    display: "flex",
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
                    {/* Folder Panel */}
                    <Box
                        sx={{
                            px: 1,
                            // py: 0.5,
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
                                handleAddFolder();
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
                                pr: 1
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
    selected={isSelected}
    onClick={() => setSelectedFolderId(folder.id)}
    sx={{
        pl: 3,
        borderRadius: 1,
        mb: 0.5,
        py: 0.25,
        minHeight: 20,
        display: "flex",
        alignItems: "flex-start",
        bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.16) : "transparent",
        color: isSelected ? "primary.main" : "text.primary",
        "&:hover": {
            bgcolor: isSelected
                ? alpha(theme.palette.primary.main, 0.24)
                : "action.hover",
        },
    }}
>
    <ListItemText
        primary={folder.documentFolderName}
        slotProps={{
            primary: {
                variant: "body2",
                sx: {
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                },
            },
        }}
        sx={{
            flex: 1,
            minWidth: 0,
            pr: 1,
        }}
    />
    <IconButton
        size="small"
        onClick={(e) => handleOpenMenu(e, folder)}
        sx={{ flexShrink: 0 }}   // prevent icon from being squished
    >
        <MoreVertIcon fontSize="small" />
    </IconButton>
</ListItemButton>
                                        );
                                    }))}
                            </List>
                        )}
                    </Box>
                </Box>

                {/* Document Panel */}
                <Box
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        pl: 3,
                    }}
                >
                    <EmployeeDocumentTypePanel
                        folder={selectedFolder ?? null}
                        onEditFolder={handleEditFolder}
                        onDeleteFolder={handleDeleteFolder}
                    />
                </Box>
            </Box>

            <MenuAtom
                items={getMenuItems()}
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onCloseAll={handleCloseMenu}
            />

            <ConfirmDialog
                open={openConfirm}
                onClose={() => setOpenConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Folder"
                confirmColor="error"
                confirmText="Delete"
                message="Are you sure you want to delete this folder?"
            />

            <EmpFolderModal
                open={open}
                onClose={() => {
                    setOpen(false);
                    setEditFolder(null);
                    setIsEdit(false);
                }}
                onSave={handleSaveFolder}
                isEdit={isEdit}
                editRow={editFolder}
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
