import { useState, forwardRef, useImperativeHandle } from "react";
import { Box, IconButton, Typography, CircularProgress } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
// import { DenseTableAtom } from "../../../../../../components/tables/standard-table/DenseTableAtom";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog/ConfirmDialog";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { AddReasonModal } from "./AddReasonModal";
import { EditReasonModal } from "./EditReasonModal";
import {
    useGetAssetUnavailableStatusesQuery,
    useCreateAssetUnavailableStatusMutation,
    useUpdateAssetUnavailableStatusMutation,
    useDeleteAssetUnavailableStatusMutation,
    type AssetUnavailableStatusResponse,
} from "../api/assetUnavailableStatus.api";
import { StandardTable } from "../../../../../../components/tables/standard-table";

export interface UnavailableStatusTabRef {
    openAddModal: () => void;
}

export const UnavailableStatusTab = forwardRef<UnavailableStatusTabRef>((_, ref) => {
    const { data: reasons = [], isLoading } = useGetAssetUnavailableStatusesQuery();
    const [createStatus] = useCreateAssetUnavailableStatusMutation();
    const [updateStatus] = useUpdateAssetUnavailableStatusMutation();
    const [deleteStatus] = useDeleteAssetUnavailableStatusMutation();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedReason, setSelectedReason] = useState<AssetUnavailableStatusResponse | null>(null);
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

    const handleSaveReason = async (newReason: { reasonName: string; description: string }) => {
        try {
            await createStatus({
                reasonName: newReason.reasonName,
                description: newReason.description || undefined,
            }).unwrap();
            showSnackbar("Reason added successfully!");
        } catch (e: any) {
            showSnackbar(e?.data?.message || "Failed to add reason.", "error");
        }
    };

    const handleUpdateReason = async (id: number, data: { reasonName: string; description?: string }) => {
        try {
            await updateStatus({ id, body: data }).unwrap();
            showSnackbar("Reason updated successfully!");
        } catch (e: any) {
            showSnackbar(e?.data?.message || "Failed to update reason.", "error");
        }
    };

    const handleDeleteConfirm = async () => {
        if (selectedReason) {
            try {
                await deleteStatus(selectedReason.id).unwrap();
                showSnackbar("Reason deleted successfully!");
            } catch (e: any) {
                showSnackbar(e?.data?.message || "Failed to delete reason.", "error");
            }
            setSelectedReason(null);
        }
        setIsConfirmOpen(false);
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, row: AssetUnavailableStatusResponse) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setSelectedReason(row);
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
            id: "reasonName",
            label: "Reason",
            render: (row: AssetUnavailableStatusResponse) => (
                <Box sx={{ padding: "5px" }}>
                    <Typography variant="body2">{row.reasonName}</Typography>
                </Box>
            ),
        },
        {
            id: "description",
            label: "Description",
            render: (row: AssetUnavailableStatusResponse) => (
                <Box sx={{ padding: "5px" }}>
                    <Typography variant="body2">{row.description}</Typography>
                </Box>
            ),
        },
        {
            id: "actions",
            label: "Actions",
            align: "center" as const,
            render: (row: AssetUnavailableStatusResponse) => (
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
            <StandardTable columns={columns} rows={reasons} />

            <MenuAtom
                items={menuItems}
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onCloseAll={handleCloseMenu}
            />

            <AddReasonModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSaveReason}
            />

            <EditReasonModal
                open={isEditModalOpen}
                reason={selectedReason}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedReason(null);
                }}
                onSave={handleUpdateReason}
            />

            <ConfirmDialog
                open={isConfirmOpen}
                title="Delete Reason"
                message="Are you sure you want to delete this reason? This action cannot be undone."
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

UnavailableStatusTab.displayName = "UnavailableStatusTab";
