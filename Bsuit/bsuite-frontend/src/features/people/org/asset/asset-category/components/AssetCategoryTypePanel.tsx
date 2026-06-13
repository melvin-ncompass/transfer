import { Box } from "@mui/system";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../../../types/types";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useState } from "react";
import { AssetTypeModal } from "./AssetTypeModal";
import { Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
    useCreateAssetTypeMutation,
    useUpdateAssetTypeMutation,
    useDeleteAssetTypeMutation,
    type AssetType
} from "../api/assetCategory.api";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import type { AssetCategoryType } from "../api/assetCategory.api";

export const AssetCategoryTypePanel = (
    { selectedCategory }: { selectedCategory: AssetCategoryType | undefined }
) => {
    const categoryId = selectedCategory?.id ?? 0;

    const [openTypeModal, setOpenTypeModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        color: "success" as "success" | "error",
    });

    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [activeFolder, setActiveFolder] = useState<AssetType | null>(null);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [editRow, setEditRow] = useState<AssetType | null>(null);

    const assetTypeData = selectedCategory?.assetTypes ?? [];

    const [createAssetType] = useCreateAssetTypeMutation();
    const [updateAssetType] = useUpdateAssetTypeMutation();
    const [deleteAssetType] = useDeleteAssetTypeMutation();

    const handleOpenModal = () => {
        setOpenTypeModal(true);
    };

    const handleSave = async (data: AssetType) => {
        try {
            if (isEdit) {
                await updateAssetType({
                    id: categoryId,
                    typeId: editRow?.id ?? 0,
                    data
                }).unwrap();
            } else {
                const payload: AssetType = {
                    typeName: data.typeName,
                    description: data.description,
                    assetTypeAttributes: data.assetTypeAttributes ?? [],
                };
                await createAssetType({
                    id: categoryId,
                    data: payload
                }).unwrap();
            }
            setSnackbar({
                open: true,
                message: "Asset type saved successfully",
                color: "success",
            });
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error?.data?.message || "Failed to save asset type",
                color: "error",
            });
        }
        setOpenTypeModal(false);
        setIsEdit(false);
    };

    const handleConfirmDelete = async () => {
        try {
            if (!editRow?.id) return;
            await deleteAssetType({
                id: categoryId,
                typeId: editRow.id
            }).unwrap();
            setSnackbar({
                open: true,
                message: "Asset type deleted successfully",
                color: "success",
            });
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error?.data?.message || "Failed to delete asset type",
                color: "error",
            });
        }
        setOpenConfirm(false);
        setEditRow(null);
    }

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, row: any) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setActiveFolder(row);
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
                    setIsEdit(true);
                    setEditRow(activeFolder);
                    setOpenTypeModal(true);
                    handleCloseMenu();
                }
            },
            {
                label: "Delete",
                icon: <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />,
                onClick: () => {
                    setOpenConfirm(true);
                    setEditRow(activeFolder);
                    handleCloseMenu();
                }
            }
        ];
    };

    const columns: StandardTableColumn[] = [
        {
            id: "typeName",
            label: "Name",
            width: 200,
        },
        {
            id: "description",
            label: "Description",
            width: 300,
        },
        {
            id: "assetCount",
            label: "Asset count",
            width: 100,
            align: 'center',
        },
        {
            id: "actions",
            label: "Actions",
            width: 100,
            align: 'center',
            render: (row: AssetType) => (
                <PrimaryIconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleOpenMenu(e, row);
                    }}
                    variant="outlined"
                    icon={<MoreVertIcon fontSize="small" titleAccess="Edit" />}
                >
                </PrimaryIconButton>
            )
        }
    ];
    return (
        <>
            <Box
                justifyContent="space-between"
                display="flex"
                pt={1}
                pb={2}
                alignItems="center"
            >
                {selectedCategory && (<Box>
                    <Typography variant="h6" color="textPrimary">
                        Asset Types - {selectedCategory.categoryName}
                    </Typography>
                    </Box>
                )}
                {selectedCategory && (
                    <PrimaryIconButton
                        icon={<AddIcon />}
                        variant="outlined"
                        size="small"
                        onClick={handleOpenModal}
                    />
                )}
            </Box>
            <StandardTable
                rows={assetTypeData ?? []}
                columns={columns}
            />

            <AssetTypeModal
                onSave={handleSave}
                open={openTypeModal}
                assetTypeData={isEdit ? editRow : null}
                onClose={() => {
                    setOpenTypeModal(false);
                    setIsEdit(false);
                    setEditRow(null);
                }}
                isEdit={isEdit}
            />

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
};