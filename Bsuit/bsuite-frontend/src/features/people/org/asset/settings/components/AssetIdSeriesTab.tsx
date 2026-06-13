import { useState, forwardRef, useImperativeHandle } from "react";
import { Box, IconButton, Chip, CircularProgress } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
// import { DenseTableAtom } from "../../../../../../components/tables/standard-table/DenseTableAtom";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog/ConfirmDialog";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { AddAssetIdSeriesModal } from "./AddAssetIdSeriesModal";
import { EditAssetIdSeriesModal } from "./EditAssetIdSeriesModal";
import {
    useGetAssetConfigsQuery,
    useCreateAssetConfigMutation,
    useUpdateAssetConfigMutation,
    useDeleteAssetConfigMutation,
    type AssetConfigResponse,
} from "../api/assetConfig.api";
// import { DataTable } from "../../../../../../components/tables/data-table";
import { StandardTable } from "../../../../../../components/tables/standard-table";

export interface AssetIdSeriesTabRef {
    openAddModal: () => void;
}

export const AssetIdSeriesTab = forwardRef<AssetIdSeriesTabRef>((_, ref) => {
    const { data: configs = [], isLoading } = useGetAssetConfigsQuery();
    const [createAssetConfig] = useCreateAssetConfigMutation();
    const [updateAssetConfig] = useUpdateAssetConfigMutation();
    const [deleteAssetConfig] = useDeleteAssetConfigMutation();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedRow, setSelectedRow] = useState<AssetConfigResponse | null>(null);
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

    const handleAddSubmit = async (formData: any) => {
        try {
            await createAssetConfig({
                seriesTitle: formData.title.trim(),
                description: formData.description.trim(),
                numberOfDigits: formData.digits,
                isAssestSeriesEnabled: formData.enabled,
                nextNumber: formData.nextNumber.trim(),
                prefix: formData.prefix.trim() || "",
                suffix: formData.suffix.trim() || "",
            }).unwrap();
            showSnackbar("Series created successfully!");
        } catch (e: any) {
            showSnackbar(e?.data?.message || "Failed to create Asset ID Series.", "error");
        }
    };

    const handleUpdateSubmit = async (id: number, data: Partial<{
        seriesTitle: string;
        description: string;
        numberOfDigits: string;
        isAssestSeriesEnabled: boolean;
        nextNumber: string;
        prefix: string;
        suffix: string;
    }>) => {
        try {
            await updateAssetConfig({ id, body: data }).unwrap();
            showSnackbar("Asset ID Series updated successfully!");
        } catch (e: any) {
            if (e?.data?.message) {
                showSnackbar(e.data.message, "error");
            } else {
                showSnackbar("Failed to update Asset ID Series.", "error");
            }
        }
    };

    const handleDeleteConfirm = async () => {
        if (selectedRow) {
            try {
                await deleteAssetConfig(selectedRow.id).unwrap();
                showSnackbar("Asset ID Series deleted successfully!");
            } catch (e: any) {
                if (e?.data?.message) {
                    showSnackbar(e.data.message, "error");
                } else {
                    showSnackbar("Failed to delete Asset ID Series.", "error");
                }
            }
            setSelectedRow(null);
        }
        setIsConfirmOpen(false);
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, row: AssetConfigResponse) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setSelectedRow(row);
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
            disabled: selectedRow?.isAssestSeriesEnabled,
            
        },
    ];

    const columns = [
        {
            id: "titleDesc",
            label: "Series Title & Description",
            render: (row: AssetConfigResponse) => (
                <Box sx={{ display: "flex", flexDirection: "column", padding: "5px" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <span style={{ fontWeight: 500 }}>{row.seriesTitle}</span>
                        {row.isAssestSeriesEnabled && (
                            <Chip
                                label="Active"
                                size="small"
                                color="success"
                                sx={{ height: 20, fontSize: "0.7rem", backgroundColor: "#e6f4ea", color: "#1e8e3e" }}
                            />
                        )}
                    </Box>
                    <span style={{ color: "gray", fontSize: "0.85rem" }}>{row.description}</span>
                </Box>
            ),
        },
        { id: "prefix", label: "Prefix", render: (row: AssetConfigResponse) => row.prefix ?? "—" },
        { id: "suffix", label: "Suffix", render: (row: AssetConfigResponse) => row.suffix ?? "—" },
        { id: "nextNumber", label: "Next Number" },
        { id: "numberOfDigits", label: "Number of digits" },
        {
            id: "actions",
            label: "Actions",
            align: "center" as const,
            render: (row: AssetConfigResponse) => (
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
            <StandardTable  columns={columns} rows={configs} />

            <MenuAtom
            
                items={menuItems}
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onCloseAll={handleCloseMenu}
                
                
            />

            <AddAssetIdSeriesModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddSubmit}
                
            />

            <EditAssetIdSeriesModal
                open={isEditModalOpen}
                config={selectedRow}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedRow(null);
                }}
                onSave={handleUpdateSubmit}
            />

            <ConfirmDialog
                open={isConfirmOpen}
                title="Delete Asset ID Series"
                message="Are you sure you want to delete this series? This action cannot be undone."
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

AssetIdSeriesTab.displayName = "AssetIdSeriesTab";
