import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import {
    Box,
    IconButton,
    Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../../../types/types";
import LockIcon from '@mui/icons-material/Lock';
import { DeductionsModal } from "./DeductionsModal";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import {
    DeductionCalculationEnum,
    DeductionFrequencyEnum,
    useCreateDeductionMutation,
    useDeleteDeductionMutation,
    useGetDeductionByIdQuery,
    useGetDeductionsQuery,
    useUpdateDeductionMutation,
    type Deduction
} from "../api/deductions.api";
import { Chip } from "../../../../../../components/atom/chips";
import { formatCurrencyByCommaSeparation } from "../../../../../../utils/numberFormatter";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import { Snackbar } from "../../../../../../components/atom/snackbar";

export interface DeductionsSectionRef {
  openAddModal: () => void;
}

export const DeductionsSection = forwardRef<DeductionsSectionRef>((_, ref) => {

    const [openModal, setOpenModal] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const [deductionsData, setDeductionsData] = useState<Deduction[]>([]);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedRow, setSelectedRow] = useState<Deduction | null | undefined>(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        color: "success" as "success" | "error",
    });

    // add instance action
    useImperativeHandle(ref, () => ({
        openAddModal: handleAdd,
    }));

    // API Hooks
    const { data: deductionsAllData, isLoading, refetch: refetchDeductions } = useGetDeductionsQuery();
    const { data: deductionsRowData, isLoading: isDeductionByIdLoading } =
        useGetDeductionByIdQuery(
            selectedRow?.id,
            { skip: !selectedRow?.id }
        );
    const [createDeduction, { isLoading: isCreateLoading }] = useCreateDeductionMutation();
    const [updateDeduction, { isLoading: isUpdateLoading }] = useUpdateDeductionMutation();
    const [deleteDeduction, { isLoading: isDeleteLoading }] = useDeleteDeductionMutation();

    const { data: headerData } = useGetHeaderDataQuery();
    const commaSeparation = (headerData?.data.commaSeparation as "US" | "IN") || "IN";

    useEffect(() => {
        if (deductionsAllData) {
            setDeductionsData(deductionsAllData);
        }
    }, [deductionsAllData]);

    const handleAdd = () => {
        setIsEdit(false);
        setSelectedRow(null);
        setOpenModal(true);
    };

    const deductionOptions = deductionsData
        .filter((e: Deduction) => e.id !== selectedRow?.id)
        .map((e: Deduction) => ({
            label: e.deductionName,
            value: String(e.id),
        }));

    const handleSave = async (data: Deduction) => {
        try {
            if (isEdit) {
                if (!selectedRow?.id) return;
                await updateDeduction(
                    {
                        ...data,
                        id: selectedRow.id
                    }).unwrap();
                setSnackbar({
                    open: true,
                    message: "Deduction updated successfully",
                    color: "success",
                });
            } else {
                await createDeduction(data).unwrap();
                setSnackbar({
                    open: true,
                    message: "Deduction created successfully",
                    color: "success",
                });
            }
            await refetchDeductions();
            setOpenModal(false);
            setSelectedRow(null);
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.data.message || "Failed to save deduction",
                color: "error",
            });
            console.error("Failed to save deduction:", error);
        }
    }

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: Deduction) => {
        setAnchorEl(event.currentTarget);
        setSelectedRow(row);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = () => {
        setIsEdit(true);
        setOpenModal(true);
        handleMenuClose();
    };

    const handleDelete = async () => {
        if (!selectedRow?.id) return;
        try {
            await deleteDeduction(selectedRow.id).unwrap();
            await refetchDeductions();
            setOpenConfirm(false);
            setSelectedRow(null);
            setSnackbar({
                open: true,
                message: "Deduction deleted successfully",
                color: "success",
            });
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.data.message || "Failed to delete deduction",
                color: "error",
            });
            console.error("Failed to delete deduction:", error);
        }
        handleMenuClose();
    };

    const confirmDelete = () => {
        setOpenConfirm(true);
        handleMenuClose();
    }

    const columns: StandardTableColumn[] = [
        {
            id: "deductionName",
            label: "Deduction Name",
        },
        {
            id: "nameInPayslip",
            label: "Name in Payslip",
        },
        {
            id: "calculationType",
            label: "Calculation Type",
            align: "right",
            render: (row: Deduction) => {
                if (row.calculationType === DeductionCalculationEnum.AMOUNT) {
                    return (
                        <Typography variant="body2" color="textPrimary">
                            Flat amount of{" "}
                            {formatCurrencyByCommaSeparation(
                                row.amount ?? 0,
                                commaSeparation,
                                "₹"
                            )}
                        </Typography>);
                }

                if (row.calculationType === DeductionCalculationEnum.PERCENTAGE) {
                    if (
                        typeof row.percentageOf === "object" &&
                        row.percentageOf !== null
                    ) {
                        return (
                        <Typography variant="body2" color="textPrimary">
                            {row.amount}% of {row.percentageOf.deductionName}
                        </Typography>
                        );
                    }
                }
                return "-";
            },
        },
        {
            id: "status",
            label: "Status",
            align: "center",
            render: (row: Deduction) => (
                <Chip
                    size="small"
                    label={row.isActive ? "Active" : "Inactive"}
                    color={row.isActive ? "success" : "error"}
                    sx={{ width: 80, mx: 'auto' }}
                />
            ),
        },
        {
            id: "deductionFrequency",
            label: "Deduction Frequency",
            render: (row: Deduction) => {
                if (row.deductionFrequency === DeductionFrequencyEnum.RECURRING) {
                    return "Recurring";
                }
                if (row.deductionFrequency === DeductionFrequencyEnum.NON_RECURRING) {
                    return "Non Recurring";
                }
                return row.deductionFrequency;
            },
        },
    {
            id: "actions",
            label: "Actions",
            align: "center",
            width: 80,
            render: (row: Deduction) => (
                !row.isDefault ? (
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, row);
                        }}
                    >
                        <MoreVertIcon fontSize="small" titleAccess="Edit"/>
                    </IconButton>
                ) :  
                <Tooltip
                    title="This deduction is pre-configured in accordance with standard 
                            practices observed in the Indian payroll system and is not editable"
                    placement="bottom-end"
                >
                    <LockIcon fontSize="small" color="disabled" titleAccess="Locked"/>
                </Tooltip>
            ),
        },
    ];

    const tableLoading = isLoading;
    const modalLoading =
        isCreateLoading || isUpdateLoading || (isEdit && isDeductionByIdLoading);

    return (
        <>
            <Box sx={{ height: "100%", width: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <Box sx={{ flex: 1, overflow: "auto" }}>
                    <StandardTable
                        columns={columns}
                        rows={deductionsData}
                        sticky
                        loading={tableLoading}
                        rowHeight={ 35 }
                        sx={{ maxHeight: 400 }}
                    />
                </Box>
            </Box>
            {/* Action Menu */}
            <MenuAtom
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onCloseAll={handleMenuClose}
                items={[
                    {
                        label: "Edit",
                        icon: <EditIcon fontSize="small" />,
                        onClick: handleEdit,
                    },
                    {
                        label: "Delete",
                        icon: <DeleteIcon fontSize="small" color="error" />,
                        onClick: confirmDelete,
                    },
                ]}
            />
            <DeductionsModal
                open={openModal}
                onClose={() => {
                    setOpenModal(false);
                    setIsEdit(false);
                    setSelectedRow(null);
                }}
                isLoadingData={modalLoading}
                onSave={handleSave}
                isEdit={isEdit}
                deductionOptions={deductionOptions}
                editRow={deductionsRowData}
            />

            <ConfirmDialog
                open={openConfirm}
                onClose={() => setOpenConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Deduction"
                confirmColor="error"
                confirmText="Delete"
                disableConfirmButton={isDeleteLoading}
                message="Are you sure you want to delete this deduction?"
            />
            {snackbar.open && (
                <Snackbar
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    message={snackbar.message}
                    color={snackbar.color}
                />
            )}
        </>
    );
});
