import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Box, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LockIcon from '@mui/icons-material/Lock';
import type { StandardTableColumn } from "../../../../../types/types";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { LeaveTypeModal } from "./LeaveTypesModal";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import { Chip } from "../../../../../components/atom/chips";
import {
  LeaveTypeCategoryEnum,
  useCreateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
  useGetLeaveTypeByIdQuery,
  useGetLeaveTypesQuery,
  useUpdateLeaveTypeMutation,
  type LeaveType
} from "../api/leaveType.api";
import { Snackbar } from "../../../../../components/atom/snackbar";

export interface LeaveTypesRef {
  openAddModal: () => void;
  search?: (text: string) => void;
}

export const LeaveTypes = forwardRef<LeaveTypesRef>((_, ref) => {
  const [openModal, setOpenModal] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [leaveTypesData, setLeaveTypesData] = useState<LeaveType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState<LeaveType | null | undefined>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  // Add instance action
  useImperativeHandle(ref, () => ({
    openAddModal: handleAdd,
    search: (text: string) => setSearchQuery(text),
  }));

  // API Hooks
  const { data: leaveTypesAllData, isLoading } = useGetLeaveTypesQuery();
  const { data: leaveTypeRowData } =
    useGetLeaveTypeByIdQuery(
      selectedRow?.id,
      { skip: !selectedRow?.id }
    );
  const [createLeaveType, { isLoading: isCreateLoading }] = useCreateLeaveTypeMutation();
  const [updateLeaveType, { isLoading: isUpdateLoading }] = useUpdateLeaveTypeMutation();
  const [deleteLeaveType, { isLoading: isDeleteLoading }] = useDeleteLeaveTypeMutation();

  useEffect(() => {
    if (leaveTypesAllData) {
      if (searchQuery) {
        setLeaveTypesData(
          leaveTypesAllData.filter((type) =>
            type.leaveName.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      } else {
        setLeaveTypesData(leaveTypesAllData);
      }
    }
  }, [leaveTypesAllData, searchQuery]);

  const handleAdd = () => {
    setIsEdit(false);
    setSelectedRow(null);
    setOpenModal(true);
  };

  const handleSave = async (data: LeaveType) => {
    try {
      if (isEdit) {
        if (!selectedRow?.id) return;
        await updateLeaveType({
          ...data,
          id: selectedRow.id
        }).unwrap();
        setSnackbar({
          open: true,
          message: "Leave type updated successfully",
          color: "success",
        });
      } else {
        await createLeaveType(data).unwrap();
        setSnackbar({
          open: true,
          message: "Leave type created successfully",
          color: "success",
        });
      }
      setOpenModal(false);
      setSelectedRow(null);
    } catch (error: any) {
      console.error("Failed to save leave type:", error);
      setSnackbar({
        open: true,
        message: error.data.message || "Failed to save leave type",
        color: "error",
      });
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: LeaveType) => {
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
      await deleteLeaveType(selectedRow.id).unwrap();
      setOpenConfirm(false);
      setSelectedRow(null);
      setSnackbar({
        open: true,
        message: "Leave type deleted successfully",
        color: "success",
      });
    } catch (error: any) {
      console.error("Failed to delete leave type:", error);
      setSnackbar({
        open: true,
        message: error.data.message || "Failed to delete leave type",
        color: "error",
      });
    }
    handleMenuClose();
  };

  const confirmDelete = () => {
    setOpenConfirm(true);
    handleMenuClose();
  }

  const columns: StandardTableColumn[] = [
    {
      id: "leaveName",
      label: "Leave Type",
    },
    {
      id: "yearlyQuota",
      label: "Days Offered Per Year",
      align: "right",
      render(row: LeaveType) {
        if (row.yearlyQuota === 'unlimited') return 'Unlimited';
        // if (row.leaveType === LeaveTypeCategoryEnum.COMPOFF) return row.maxInstances;
        return row.yearlyQuota;
      },
    },
    {
      id: "isEncashable",
      label: "Encashable",
      align: "center",
      render: (row: LeaveType) => (
        <Chip
          size="small"
          label={row.isEncashable ? "Yes" : "No"}
          color={row.isEncashable ? "success" : "secondary"}
          sx={{ width: 60, mx: 'auto' }}
        />
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "center",
      width: 80,
      render: (row: LeaveType) => (
        !row.isDefault ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuOpen(e, row);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        ) : <LockIcon fontSize="small" color="disabled" />
      ),
    },
  ];

  const loading = isCreateLoading || isDeleteLoading || isUpdateLoading || isLoading;

  return (
    <>
      <Box sx={{ height: '100%', overflow: 'auto' }}>
        <StandardTable
          columns={columns}
          rows={leaveTypesData}
          loading={loading}
          rowHeight={35}
          sticky
    
        />
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
      <LeaveTypeModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setIsEdit(false);
          setSelectedRow(null);
        }}
        onSave={handleSave}
        isEdit={isEdit}
        isLoading={loading}
        editRow={isEdit ? leaveTypeRowData : null}
      />

      <ConfirmDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Type"
        confirmText="Delete"
        confirmColor="error"
        message="Are you sure you want to delete this leave type?"
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