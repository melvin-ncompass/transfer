import { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import { Chip } from "../../../../../../components/atom/chips";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { EarningsModal } from "./EarningsModal";
import type { StandardTableColumn } from "../../../../../../types/types";
import type { EarningRequestType, EarningType } from "../api/earnings.api";
import LockIcon from '@mui/icons-material/Lock';
import { forwardRef, useImperativeHandle } from "react";

import {
  EarningCalculationEnum,
  EarningFrequencyEnum,
  useCreateEarningMutation,
  useDeleteEarningMutation,
  useGetEarningByIdQuery,
  useGetEarningsQuery,
  useUpdateEarningMutation,
} from "../api/earnings.api";
import { formatCurrencyByCommaSeparation } from "../../../../../../utils/numberFormatter";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import { Snackbar } from "../../../../../../components/atom/snackbar";

export interface EarningsSectionRef {
  openAddModal: () => void;
}
export const GROSS_ID = 'gross';

export const EarningsSection = forwardRef<EarningsSectionRef>((_, ref) => {
  const [openModal, setOpenModal] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedRow, setSelectedRow] = useState<EarningType | null | undefined>(undefined);
  const [isEdit, setIsEdit] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [earningsData, setEarningsData] = useState<EarningType[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  // Add instance action 
  useImperativeHandle(ref, () => ({
    openAddModal: handleAdd,
  }));

  // API Hooks
  const { data: earningsAllData, isLoading, refetch: refetchEarnings } = useGetEarningsQuery();
  const { data: earningRowData, isLoading: isEarningByIdLoading } =
    useGetEarningByIdQuery(
      selectedRow?.id,
      { skip: !selectedRow?.id }
    );
  const [createEarning, { isLoading: isCreateLoading }] = useCreateEarningMutation();
  const [updateEarning, { isLoading: isUpdateLoading }] = useUpdateEarningMutation();
  const [deleteEarning, { isLoading: isDeleteLoading }] = useDeleteEarningMutation();

  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation = (headerData?.data.commaSeparation as "US" | "IN") || "IN";

  useEffect(() => {
    if (earningsAllData) {
      setEarningsData(earningsAllData);
    }
  }, [earningsAllData]);

  const handleAdd = () => {
    setIsEdit(false);
    setSelectedRow(null);
    setOpenModal(true);
  };

  const earningOptions = [
    {
      label: "Gross",
      value: GROSS_ID,
    },
    ...earningsData
      .filter((e: EarningType) => e.id !== selectedRow?.id)
      .map((e: EarningType) => ({
        label: e.earningName,
        value: String(e.id),
      }))
  ];

  const handleSave = async (data: EarningRequestType) => {

    try {
      if (isEdit) {
        if (!selectedRow?.id) return;

        await updateEarning(
          {
            ...data,
            id: selectedRow.id
          })
          .unwrap();
        setSnackbar({
          open: true,
          message: "Earning updated successfully",
          color: "success",
        });
      } else {
        await createEarning(data).unwrap();
        setSnackbar({
          open: true,
          message: "Earning created successfully",
          color: "success",
        });
      }
      await refetchEarnings();
      setOpenModal(false);
      setSelectedRow(null);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.data.message || "Failed to save earning",
        color: "error",
      });
      console.error("Failed to save earning:", error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: EarningType) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditModal = () => {
    setIsEdit(true);
    setOpenModal(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedRow?.id) return;

    try {
      await deleteEarning(selectedRow.id).unwrap();
      await refetchEarnings();
      setOpenConfirm(false);
      setSelectedRow(null);
      setSnackbar({
        open: true,
        message: "Earning deleted successfully",
        color: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.data.message || "Failed to delete earning",
        color: "error",
      });
    }
  };

  const handleDeleteModal = () => {
    setOpenConfirm(true);
    handleMenuClose();
  }

  const getBaseEarningName = (
    percentageOfId: string | number | undefined,
    rows: EarningType[],
  ) => {
    if (!percentageOfId) return "-";
    return rows.find(r => r.id === percentageOfId)?.earningName ?? "-";
  };

  const columns: StandardTableColumn[] = [
    {
      id: "earningName",
      label: "Earning Name",
      width: "18.3%"
    },
    {
      id: "nameInPayslip",
      label: "Name in Payslip",
      width: "17.8%"
    },
    {
      id: "calculationType",
      label: "Calculation Type",
      align: "right",
      width: "22.7%",
      render: (row: EarningType) => {
        if (row.calculationType === EarningCalculationEnum.AMOUNT) {
          return (
            <Typography variant="body2">
              Flat amount of{" "}
              {formatCurrencyByCommaSeparation(
                row.amount ?? 0,
                commaSeparation,
                "₹"
              )}
            </Typography>
          );
        }

        if (row.calculationType === EarningCalculationEnum.PERCENTAGE) {
          if (row.percentageOf === GROSS_ID) {
            return (
              <Typography variant="body2">
                {row.percentage ?? 0}% of Gross
              </Typography>
            );
          }
          const baseName = getBaseEarningName(
            Number(row.percentageOf),
            earningsData
          );
          return (
            <Typography variant="body2">
              {row.percentage ?? 0}% of {baseName}
            </Typography>
          );
        }

        return "-";
      }
    },
    {
      id: "isActive",
      label: "Status",
      align: "center",
      width: "14%",
      render: (row: EarningType) => (
        <Chip
          size="small"
          label={row.isActive ? "Active" : "Inactive"}
          color={row.isActive ? "success" : "error"}
          sx={{ width: 80, mx: "auto", }}
        />
      ),
    },
    {
      id: "earningFrequency",
      label: "Earning Frequency",
      width: "22%",
      render: (row: EarningType) => {
        if (row.earningFrequency === EarningFrequencyEnum.RECURRING) {
          return "Recurring";
        }
        if (row.earningFrequency === EarningFrequencyEnum.NON_RECURRING) {
          return "Non Recurring";
        }
        return row.earningFrequency;
      },
    },
    {
      id: "actions",
      label: "Actions",
      align: "center",
      width: "6%",
      render: (row: EarningType) => (
        !row.isDefault ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuOpen(e, row);
            }}
          >
            <MoreVertIcon fontSize="small" titleAccess="Edit" />
          </IconButton>
        ) :
          <Tooltip
            title="This earning is pre-configured in accordance with standard practices 
                    observed in the Indian payroll system and is not editable"
            placement="bottom-end"
          >
            <LockIcon fontSize="small" color="disabled" titleAccess="Locked" />
          </Tooltip>
      ),
    },
  ];

  /** Table: initial load only — not tied to save/delete mutations (avoids flash on errors). */
  const tableLoading = isLoading;
  const modalLoading =
    isCreateLoading || isUpdateLoading || (isEdit && isEarningByIdLoading);

  return (
    <>
      <Box sx={{ height: "100%", width: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <StandardTable
            columns={columns}
            rows={earningsData}
            loading={tableLoading}
            sticky
            rowHeight={ 35 }
            sx={{ height: "100%" }}
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
            onClick: handleEditModal,
          },
          {
            label: "Delete",
            icon: <DeleteIcon fontSize="small" color="error" />,
            onClick: handleDeleteModal,
          },
        ]}
      />

      <EarningsModal
        open={openModal}
        isLoadingData={modalLoading}
        onClose={() => {
          setOpenModal(false);
          setSelectedRow(null);
          setIsEdit(false);
        }}
        onSave={handleSave}
        isEdit={isEdit}
        editRow={earningRowData}
        earningsOptions={earningOptions}
      />

      <ConfirmDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Earning"
        confirmColor="error"
        confirmText="Delete"
        disableConfirmButton={isDeleteLoading}
        message="Are you sure you want to delete this Earning?"
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
});
