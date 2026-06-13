import { Box, Skeleton, Typography, useTheme, List, ListItemButton, ListItemText, IconButton, alpha } from "@mui/material";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import { useState, useEffect } from "react";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { AssetCategoryModal } from "./AssetCategoryModal";
import { AssetCategoryTypePanel } from "./AssetCategoryTypePanel";
import {
    useCreateAssetCategoryMutation,
    useDeleteAssetCategoryMutation,
    useGetAssetCategoriesQuery,
    useUpdateAssetCategoryMutation,
    type AssetCategoryType
} from "../api/assetCategory.api";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { SearchBoxAtom } from "../../../../../../components/searchbar/SearchBoxAtom";

const SEARCH_KEYS: (keyof AssetCategoryType)[] = ["categoryName"];

export const AssetCategoryList = () => {
    const theme = useTheme();

    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

    const [activeFolder, setActiveFolder] = useState<AssetCategoryType | null>(null);
    const [editFolder, setEditFolder] = useState<AssetCategoryType | null>(null);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [filteredCategories, setFilteredCategories] = useState<AssetCategoryType[]>([]);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        color: "success" as "success" | "error",
    });

    const [searchKey, setSearchKey] = useState(0);

    useEffect(() => {
        setSearchKey(prev => prev + 1);
    }, [selectedCategoryId]);

    const { data: assetCategoryList, isLoading, isFetching } = useGetAssetCategoriesQuery();

    useEffect(() => {
        if (filteredCategories && filteredCategories.length > 0 && selectedCategoryId === null) {
            setSelectedCategoryId(filteredCategories[0].id);
        }
    }, [filteredCategories, selectedCategoryId]);

    useEffect(() => {
        if (assetCategoryList) {
            setFilteredCategories(assetCategoryList);
        }
    }, [assetCategoryList]);

    useEffect(() => {
        if (
            selectedCategoryId &&
            assetCategoryList &&
            !assetCategoryList.some((c) => c.id === selectedCategoryId)
        ) {
            setSelectedCategoryId(null);
        }
    }, [assetCategoryList, selectedCategoryId]);

    const [createAssetCategory,] = useCreateAssetCategoryMutation();
    const [updateAssetCategory,] = useUpdateAssetCategoryMutation();
    const [deleteAssetCategory,] = useDeleteAssetCategoryMutation();

    const handleAddFolder = () => {
        setIsEdit(false);
        setEditFolder(null);
        setOpen(true);
    };

    const handleSave = async (data: AssetCategoryType) => {
        try {
            if (!isEdit) {
                const res = await createAssetCategory(data).unwrap();
                setSnackbar({
                    open: true,
                    message: "Asset category created successfully",
                    color: "success",
                });
                setSelectedCategoryId(res.data?.id);
                setEditFolder(res.data!);
           
            } else {
                const res = await updateAssetCategory({
                    id: data.id,
                    data: {
                        categoryName: data.categoryName,
                        description: data.description
                    }
                }).unwrap();
                setSnackbar({
                    open: true,
                    message: "Asset category updated successfully",
                    color: "success",
                });
                setSelectedCategoryId(res.id);
                setEditFolder(res);
            }
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.data.message || "Failed to create asset category",
                color: "error",
            });
        } finally {
            setOpen(false);
        }
    }


    const handleConfirmDelete = async () => {

        try {
            if (!editFolder?.id) return;
            await deleteAssetCategory(editFolder?.id).unwrap();

            if (selectedCategoryId === editFolder.id) {
                setSelectedCategoryId(null);
            }

            setSnackbar({
                open: true,
                message: "Asset category deleted successfully",
                color: "success",
            });
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.data.message || "Failed to delete asset category",
                color: "error",
            });
        }
        setOpenConfirm(false);
        setEditFolder(null);
    }

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, folder: any) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setActiveFolder(folder);
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setActiveFolder(null);
    };

    const handleClose = () => {
        setOpen(false);
        setEditFolder(null);
        setIsEdit(false);
    }

    const getMenuItems = () => {
        if (!activeFolder) return [];
        return [
            {
                label: "Edit",
                icon: <EditIcon fontSize="small" />,
                onClick: () => {
                    setIsEdit(true);
                    setEditFolder(activeFolder);
                    setOpen(true);
                    handleCloseMenu();
                }
            },
            {
                label: "Delete",
                icon: <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />,
                onClick: () => {
                    setOpenConfirm(true);
                    setEditFolder(activeFolder);
                    handleCloseMenu();
                }
            }
        ];
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
                        flex: "0 0 16%",
                        borderRight: `1px solid ${theme.palette.divider}`,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
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
                        <Typography variant="subtitle2" >Asset Category</Typography>

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
                    <Box sx={{ pt: 1, pr: 1 }}>
                        <SearchBoxAtom<AssetCategoryType>
                            key={searchKey  }
                            data={assetCategoryList ?? []}
                            searchKeys={SEARCH_KEYS}
                            placeholder="Search category..."
                            onFilteredData={(data) => setFilteredCategories(data)}
                        />
                    </Box>

                    <Box sx={{ flex: 1, overflowY: "auto" }}>
                        {isLoading || isFetching ? (
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
                                pr: 1
                            }}>
                                {!filteredCategories || filteredCategories.length === 0 ? (
                                    <Box sx={{ p: 2, textAlign: "center" }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No folders available
                                        </Typography>
                                    </Box>
                                ) : (
                                    filteredCategories?.map((folder) => {
                                        const isSelected = selectedCategoryId === folder.id;
                                        return (
                                            <ListItemButton
                                                key={folder.id}
                                                selected={isSelected}
                                                onClick={() => setSelectedCategoryId(folder.id)}
                                                sx={{
                                                    pl: 3,
                                                    borderRadius: 1,
                                                    mb: 0.5,
                                                    py: 0.25,
                                                    minHeight: 20,
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
                                                    primary={folder.categoryName}
                                                    slotProps={{
                                                        primary: {
                                                            variant: "body2",  
                                                        }
                                                    }}
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

                {/* Document Panel */}
                <Box
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        pl: 3,
                    }}
                >
                    {selectedCategoryId ? (
                        <AssetCategoryTypePanel
                            selectedCategory={assetCategoryList?.find(c => c.id === selectedCategoryId)}
                        />) : (
                        <Box sx={{ p: 2, mt: 2, textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                                Select a folder to view its types
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            <MenuAtom
                items={getMenuItems()}
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onCloseAll={handleCloseMenu}
            />

            <AssetCategoryModal
                open={open}
                isEdit={isEdit}
                onClose={handleClose}
                onSave={handleSave}
                categoryData={editFolder}
            />

            <ConfirmDialog
                open={openConfirm}
                onClose={() => setOpenConfirm(false)}
                onConfirm={handleConfirmDelete}
                confirmColor="error"
                title="Delete Asset Category"
                message="Are you sure you want to delete this asset category?"
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
}