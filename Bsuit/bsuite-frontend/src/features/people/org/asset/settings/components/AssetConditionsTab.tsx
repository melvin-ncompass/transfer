import { useState, forwardRef, useImperativeHandle } from "react";
import { Box, IconButton, Typography, CircularProgress } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
// import { DenseTableAtom } from "../../../../../../components/tables/standard-table/DenseTableAtom";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog/ConfirmDialog";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { AddConditionModal } from "./AddConditionModal";
import { EditConditionModal } from "./EditConditionModal";
import {
    useGetAssetConditionsQuery,
    useCreateAssetConditionMutation,
    useUpdateAssetConditionMutation,
    useDeleteAssetConditionMutation,
    type AssetConditionResponse,
} from "../api/assetCondition.api";
import { StandardTable } from "../../../../../../components/tables/standard-table";

export interface AssetConditionsTabRef {
    openAddModal: () => void;
}

export const AssetConditionsTab = forwardRef<AssetConditionsTabRef>((_, ref) => {
    const { data: conditions = [], isLoading } = useGetAssetConditionsQuery();
    const [createAssetCondition] = useCreateAssetConditionMutation();
    const [updateAssetCondition] = useUpdateAssetConditionMutation();
    const [deleteAssetCondition] = useDeleteAssetConditionMutation();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedCondition, setSelectedCondition] = useState<AssetConditionResponse | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        color: "success" | "error";
    }>({ open: false, message: "", color: "success" });

    useImperativeHandle(ref, () => ({
        openAddModal: () => setIsAddModalOpen(true),
    }));

    const showSnackbar = (message: string, color: "success" | "error" = "success") => {
        setSnackbar({ open: true, message, color });
    };

    const handleSaveCondition = async (newCondition: { conditionName: string; description: string }) => {
        try {
            await createAssetCondition({
                conditionName: newCondition.conditionName,
                description: newCondition.description || undefined,
            }).unwrap();
            showSnackbar("Condition added successfully!");
        } catch (e: any) {
            showSnackbar(e?.data?.message || "Failed to add condition.", "error");
        }
    };

    const handleUpdateCondition = async (id: number, data: { conditionName: string; description?: string }) => {
        try {
            await updateAssetCondition({ id, body: data }).unwrap();
            showSnackbar("Condition updated successfully!");
        } catch (e: any) {
            showSnackbar(e?.data?.message || "Failed to update condition.", "error");
        }
    };

    const handleDeleteConfirm = async () => {
        if (selectedCondition) {
            try {
                await deleteAssetCondition(selectedCondition.id).unwrap();
                showSnackbar("Condition deleted successfully!");
            } catch (e: any) {
                showSnackbar(e?.data?.message || "Failed to delete condition.", "error");
            }
            setSelectedCondition(null);
        }
        setIsConfirmOpen(false);
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, row: AssetConditionResponse) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setSelectedCondition(row);
    };

    const handleCloseMenu = () => setMenuAnchor(null);

    const menuItems = [
        {
            label: "Edit",
            icon: <EditIcon fontSize="small" />,
            onClick: () => {
                setIsEditModalOpen(true);
                handleCloseMenu();
            },
        },
        {
            label: "Delete",
            icon: <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />,
            onClick: () => {
                setIsConfirmOpen(true);
                handleCloseMenu();
            },
        },
    ];

    const columns = [
        {
            id: "conditionName",
            label: "Condition",
            render: (row: AssetConditionResponse) => (
                <Box sx={{ padding: "5px" }}>
                    <Typography variant="body2">{row.conditionName}</Typography>
                </Box>
            ),
        },
        {
            id: "description",
            label: "Description",
            render: (row: AssetConditionResponse) => (
                <Box sx={{ padding: "5px" }}>
                    <Typography variant="body2">{row.description}</Typography>
                </Box>
            ),
        },
        {
            id: "actions",
            label: "Actions",
            align: "center" as const,
            render: (row: AssetConditionResponse) => (
                <IconButton size="small" onClick={(e) => handleOpenMenu(e, row)}>
                    <MoreVertIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </IconButton>
            ),
        },
    ];

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress size={30} />
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", pt: "2vh" }}>
            <StandardTable columns={columns} rows={conditions} />

            <MenuAtom
                items={menuItems}
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onCloseAll={handleCloseMenu}
            />

            <AddConditionModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSaveCondition}
            />

            <EditConditionModal
                open={isEditModalOpen}
                condition={selectedCondition}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedCondition(null);
                }}
                onSave={handleUpdateCondition}
            />

            <ConfirmDialog
                open={isConfirmOpen}
                title="Delete Condition"
                message="Are you sure you want to delete this condition? This action cannot be undone."
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDeleteConfirm}
                confirmText="Delete"
                confirmColor="error"
            />

            {snackbar.open && (
                <Snackbar
                    message={snackbar.message}
                    color={snackbar.color}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    autoClose={4000}
                />
            )}
        </Box>
    );
});

AssetConditionsTab.displayName = "AssetConditionsTab";
