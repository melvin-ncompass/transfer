import { useState, forwardRef, useImperativeHandle } from "react";
import { Box, Typography, CircularProgress, IconButton, Tooltip } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import { AddExpenseCategoryModal } from "./AddExpenseCategoryModal";
import { EditExpenseCategoryModal, type ExpenseCategory } from "./EditExpenseCategoryModal";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog/ConfirmDialog";
import { Snackbar } from "../../../../../../components/atom/snackbar";

import {
    useGetExpenseCategoriesQuery,
    useCreateExpenseCategoryMutation,
    useUpdateExpenseCategoryMutation,
    useDeleteExpenseCategoryMutation,
} from "../api/expenseCategory.api";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";

export interface ExpenseCategoryTabRef {
    openAddModal: () => void;
}

interface ExpenseCategoryTabProps {
    searchQuery?: string;
}

const getBackendMessage = (error: unknown, fallback: string) => {
    if (!error || typeof error !== "object") return fallback;
    const err = error as { data?: { message?: string }; error?: string; message?: string };
    return err.data?.message ?? err.error ?? err.message ?? fallback;
};

export const ExpenseCategoryTab = forwardRef<
    ExpenseCategoryTabRef,
    ExpenseCategoryTabProps
>(({ searchQuery = "" }, ref) => {
    const { data: apiCategories, isLoading } = useGetExpenseCategoriesQuery();
    const [createCategory] = useCreateExpenseCategoryMutation();
    const [updateCategory] = useUpdateExpenseCategoryMutation();
    const [deleteCategory] = useDeleteExpenseCategoryMutation();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

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

    const handleSaveCategory = async (newCategory: any) => {
        try {
            const response = await createCategory(newCategory).unwrap();
            setSnackbar({
                open: true,
                message: response.message ?? "Category added successfully!",
                severity: "success",
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: getBackendMessage(error, "Failed to add category."),
                severity: "error",
            });
        }
    };

    const handleUpdateCategory = async (id: number, updatedCategory: Partial<ExpenseCategory>) => {
        try {
            const response = await updateCategory({ id, body: updatedCategory }).unwrap();
            setSnackbar({
                open: true,
                message: response.message ?? "Category updated successfully!",
                severity: "success",
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: getBackendMessage(error, "Failed to update category."),
                severity: "error",
            });
        }
    };

    const handleActionClick = (
        event: React.MouseEvent<HTMLButtonElement>,
        category: any
    ) => {
        setAnchorEl(event.currentTarget);
        setSelectedCategory(category);
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
        if (selectedCategory) {
            try {
                const response = await deleteCategory(selectedCategory.id).unwrap();
                setSnackbar({
                    open: true,
                    message: response.message ?? "Category deleted successfully!",
                    severity: "success",
                });
            } catch (error) {
                setSnackbar({
                    open: true,
                    message: getBackendMessage(error, "Failed to delete category."),
                    severity: "error",
                });
            }
        }
        setIsConfirmDialogOpen(false);
        setSelectedCategory(null);
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

    const categories = apiCategories || [];

    const policyLabel = (row: { expensePolicy?: { policyName?: string } | null }) =>
        row.expensePolicy?.policyName?.trim() ?? "";

    const filteredRows = categories.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
            (c.categoryName ?? "").toLowerCase().includes(q) ||
            (c.expenseCode ?? "").toLowerCase().includes(q) ||
            (c.description ?? "").toLowerCase().includes(q) ||
            policyLabel(c).toLowerCase().includes(q)
        );
    });

    const dash = (value: unknown) => {
        if (value === null || value === undefined) return "—";
        if (typeof value === "string" && value.trim() === "") return "—";
        return String(value);
    };

    const columns = [
        {
            id: "categoryName",
            label: "Category Name",
            width: 200,
            render: (row: any) => {
                const text = row.categoryName?.trim() ?? "";
                const body = (
                    <Typography
                        variant="body2"
                        color={text ? "text.primary" : "text.secondary"}
                        sx={{
                            maxWidth: 190,
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
                        <Box component="span" sx={{ display: "inline-block", maxWidth: 190 }}>
                            {body}
                        </Box>
                    </Tooltip>
                ) : (
                    body
                );
            },
        },
        {
            id: "expensePolicy",
            label: "Expense Policy",
            width: 200,
            render: (row: any) => {
                const name = policyLabel(row);
                const display = name || "—";
                const body = (
                    <Typography
                        variant="body2"
                        color={name ? "text.primary" : "text.secondary"}
                        sx={{
                            maxWidth: 190,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {display}
                    </Typography>
                );
                return name ? (
                    <Tooltip title={name} placement="top-start">
                        <Box component="span" sx={{ display: "inline-block", maxWidth: 190 }}>
                            {body}
                        </Box>
                    </Tooltip>
                ) : (
                    body
                );
            },
        },
        {
            id: "expenseCode",
            label: "Expense Code",
            width: 120,
            render: (row: any) => {
                const text = row.expenseCode?.trim() ?? "";
                const body = (
                    <Typography
                        variant="body2"
                        color={text ? "text.primary" : "text.secondary"}
                        sx={{
                            maxWidth: 110,
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
                        <Box component="span" sx={{ display: "inline-block", maxWidth: 110 }}>
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
            width: 250,
            render: (row: any) => {
                const text = row.description?.trim() ?? "";
                const body = (
                    <Typography
                        variant="body2"
                        color={text ? "text.primary" : "text.secondary"}
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
            id: "maxLimit",
            label: "Max Limit",
            align: "right" as const,
            headerAlign: "right" as const,
            width: 120,
            render: (row: any) => {
                const hasValue = row.maxLimit != null && row.maxLimit !== "";
                const numeric = Number(String(row.maxLimit).replace(/,/g, ""));
                const displayValue =
                    hasValue && Number.isFinite(numeric) ? `₹${numeric.toLocaleString("en-IN")}` : "—";
                return (
                    <Typography
                        variant="body2"
                        color={hasValue ? "text.primary" : "text.secondary"}
                        sx={{ textAlign: "right" }}
                    >
                        {displayValue}
                    </Typography>
                );
            },
        },
        {
            id: "actions",
            label: "Action",
            width: 120,
            render: (row: any) => (
                <IconButton
                    size="small"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleActionClick(e, row);
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
                    emptyMessage="No categories found"
                />
            )}

            <AddExpenseCategoryModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSaveCategory}
            />

            <EditExpenseCategoryModal
                open={isEditModalOpen}
                categoryInfo={selectedCategory}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedCategory(null);
                }}
                onSave={handleUpdateCategory}
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
                title="Delete Category"
                message="Are you sure you want to delete this category? This action cannot be undone."
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
            )}
        </Box>
    );
});
