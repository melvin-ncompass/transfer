import { useState, forwardRef, useImperativeHandle } from "react";
import { Box, Typography, CircularProgress, IconButton, Tooltip } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import { AddExpensePolicyModal } from "./AddExpensePolicyModal";
import { EditExpensePolicyModal, type ExpensePolicy } from "./EditExpensePolicyModal";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog/ConfirmDialog";
import { Snackbar } from "../../../../../../components/atom/snackbar";

import {
    useGetExpensePoliciesQuery,
    useCreateExpensePolicyMutation,
    useUpdateExpensePolicyMutation,
    useDeleteExpensePolicyMutation,
} from "../api/expensePolicy.api";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";

export interface ExpensePolicyTabRef {
    openAddModal: () => void;
}

interface ExpensePolicyTabProps {
    searchQuery?: string;
}

const getBackendMessage = (error: unknown, fallback: string) => {
    if (!error || typeof error !== "object") return fallback;
    const err = error as { data?: { message?: string }; error?: string; message?: string };
    return err.data?.message ?? err.error ?? err.message ?? fallback;
};

export const ExpensePolicyTab = forwardRef<
    ExpensePolicyTabRef,
    ExpensePolicyTabProps
>(({ searchQuery = "" }, ref) => {
    const { data: apiPolicies, isLoading } = useGetExpensePoliciesQuery();
    const [createPolicy] = useCreateExpensePolicyMutation();
    const [updatePolicy] = useUpdateExpensePolicyMutation();
    const [deletePolicy] = useDeleteExpensePolicyMutation();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedPolicy, setSelectedPolicy] = useState<any | null>(null);

    // Confirm dialog state
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

    // Snackbar state
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "info" | "warning";
    }>({ open: false, message: "", severity: "info" });

    useImperativeHandle(ref, () => ({
        openAddModal: () => setIsAddModalOpen(true),
    }));

    const handleSavePolicy = async (newPolicy: any) => {
        try {
            const response = await createPolicy(newPolicy).unwrap();
            setSnackbar({
                open: true,
                message: response.message ?? "Policy added successfully!",
                severity: "success",
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: getBackendMessage(error, "Failed to add policy."),
                severity: "error",
            });
        }
    };

    const handleUpdatePolicy = async (id: number, updatedPolicy: Partial<ExpensePolicy>) => {
        try {
            const response = await updatePolicy({ id, body: updatedPolicy as any }).unwrap();
            setSnackbar({
                open: true,
                message: response.message ?? "Policy updated successfully!",
                severity: "success",
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: getBackendMessage(error, "Failed to update policy."),
                severity: "error",
            });
        }
    };

    const handleActionClick = (
        event: React.MouseEvent<HTMLElement>,
        policy: any
    ) => {
        setAnchorEl(event.currentTarget);
        setSelectedPolicy(policy);
    };

    const handleEditClick = () => {
        setIsEditModalOpen(true);
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        setIsConfirmDialogOpen(true);
        handleMenuClose();
    };

    const handleDeleteConfirm = async () => {
        if (selectedPolicy) {
            try {
                const response = await deletePolicy(selectedPolicy.id).unwrap();
                setSnackbar({
                    open: true,
                    message: response.message ?? "Policy deleted successfully!",
                    severity: "success",
                });
            } catch (error) {
                setSnackbar({
                    open: true,
                    message: getBackendMessage(error, "Failed to delete policy."),
                    severity: "error",
                });
            }
        }
        setIsConfirmDialogOpen(false);
        setSelectedPolicy(null);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const menuItems = [
        {
            label: "Edit",
            icon: <EditIcon fontSize="small" />,
            onClick: handleEditClick,
        },
        {
            label: "Delete",
            icon: <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />,
            onClick: handleDeleteClick,
        },
    ];

    const policies = apiPolicies || [];

    const filteredRows = policies.filter(
        (p) =>
            p.policyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.approver?.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        {
            id: "policyName",
            label: "Policy Name",
            width: 250,
            render: (row: any) => {
                const text = row.policyName?.trim() ?? "";
                const body = (
                    <Typography
                        variant="body2"
                        sx={{
                            maxWidth: 240,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {text || "—"}
                    </Typography>
                );
                return text ? (
                    <Tooltip title={text} placement="top-start">
                        <Box component="span" sx={{ display: "inline-block", maxWidth: 240 }}>
                            {body}
                        </Box>
                    </Tooltip>
                ) : (
                    body
                );
            },
        },
        {
            id: "description",
            label: "Description",
            width: 300,
            render: (row: any) => {
                const text = row.description?.trim() ?? "";
                const body = (
                    <Typography
                        variant="body2"
                        sx={{
                            maxWidth: 290,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {text || "—"}
                    </Typography>
                );
                return text ? (
                    <Tooltip title={text} placement="top-start">
                        <Box component="span" sx={{ display: "inline-block", maxWidth: 290 }}>
                            {body}
                        </Box>
                    </Tooltip>
                ) : (
                    body
                );
            },
        },
        {
            id: "approver",
            label: "Approver",
            render: (row: any) => (
                <Typography variant="body2">{row.approver?.contact?.name || "-"}</Typography>
            ),
        },
        {
            id: "actions",
            label: "",
            width: 100,
            render: (policy: any) => (
                <IconButton
                    size="small"
                    onClick={(e: React.MouseEvent<HTMLElement>) => {
                        e.stopPropagation();
                        handleActionClick(e, policy);
                    }}
                >
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            ),
        },
    ];

    return (
        <Box sx={{ marginTop: 1 }}>
            {isLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress size={30} />
                </Box>
            ) : (
                <StandardTable
                    columns={columns}
                    rows={filteredRows}
                    loading={false}
                    sticky
                    emptyMessage="No policies found"
                />
            )}

            <AddExpensePolicyModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSavePolicy}
            />

            <EditExpensePolicyModal
                open={isEditModalOpen}
                policyInfo={selectedPolicy}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedPolicy(null);
                }}
                onSave={handleUpdatePolicy}
            />

            <MenuAtom
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onCloseAll={handleMenuClose}
                items={menuItems}
            />

            <ConfirmDialog
                open={isConfirmDialogOpen}
                title="Delete Expense Policy"
                message="Are you sure you want to delete this expense policy? This action cannot be undone."
                onClose={() => setIsConfirmDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                confirmText="Delete"
                confirmColor="error"
            />

            {snackbar.open && (
                <Snackbar
                    message={snackbar.message}
                    color={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    autoClose={4000}
                />
            )}      </Box>
    );
});

ExpensePolicyTab.displayName = "ExpensePolicyTab";
