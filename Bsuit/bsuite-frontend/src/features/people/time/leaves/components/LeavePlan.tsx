import MoreVertIcon from "@mui/icons-material/MoreVert";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import {
  Box,
  IconButton,
  Typography,
  Stack,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
} from "@mui/material";
import { Chip } from "../../../../../components/atom/chips";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { LeavePlanModal } from "./LeavePlanModal";

import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import {
  useGetLeavePlansQuery,
  useCreateLeavePlanMutation,
  useUpdateLeavePlanMutation,
  useGetLeavePlanByIdQuery,
  useDeleteLeavePlanMutation,
  useGetLeavePlanEmployeeByIdQuery,
  type LeavePlanType,
  type CreateUpdateLeavePlanRequest,
  type LeavePlanEmployee,
} from "../api/leavePlan.api";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { formatDateShort } from "../../../../../utils/numberFormatter";
import { Tooltip } from "../../../../../components/atom/tooltip";

// ─── constants ───────────────────────────────────────────────────────────────

const MAX_VISIBLE = 3;

const AVATAR_COLORS = [
  { bg: "#E6F1FB", color: "#185FA5" },
  { bg: "#E1F5EE", color: "#0F6E56" },
  { bg: "#EEEDFE", color: "#534AB7" },
  { bg: "#FAEEDA", color: "#854F0B" },
  { bg: "#FAECE7", color: "#993C1D" },
];

// ─── helper: format status label ─────────────────────────────────────────────

const formatStatus = (status: string) =>
  status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// ─── EmployeesCell ────────────────────────────────────────────────────────────
// Fetches its own employee data per row so all rows populate independently.

interface EmployeesCellProps {
  planId: number;
  onInfoClick: (employees: LeavePlanEmployee[], planName: string) => void;
  planName: string;
}

const EmployeesCell = ({ planId, onInfoClick, planName }: EmployeesCellProps) => {
  const { data: employees = [], isLoading } = useGetLeavePlanEmployeeByIdQuery(planId, {
    skip: !planId,
  });

  if (isLoading) return <CircularProgress size={14} />;
  if (!employees.length)
    return <Typography variant="body2" color="text.secondary">—</Typography>;

  const visible = employees.slice(0, MAX_VISIBLE);
  const overflow = employees.length - MAX_VISIBLE;

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      {visible.map((emp, i) => {
        const name = emp.contact?.name || "?";
        const palette = AVATAR_COLORS[i % AVATAR_COLORS.length];
        return (
          <Tooltip key={emp.employeeId ?? i} title={name} arrow placement="top">
            <Avatar
              sx={{
                width: 28,
                height: 28,
                fontSize: "0.75rem",
                fontWeight: 500,
                bgcolor: palette.bg,
                color: palette.color,
                border: "1.5px solid",
                borderColor: "background.paper",
                ml: i > 0 ? "-6px !important" : 0,
                cursor: "default",
              }}
            >
              {name.charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
        );
      })}

      {
        overflow > 0 ? (
          <Stack direction="row" alignItems="center" sx={{ ml: "6px !important" }}>
            <Typography variant="caption" color="text.secondary">
              +{overflow} more
            </Typography>
            <IconButton
              size="small"
              sx={{ ml: 0.25, p: 0.25 }}
              onClick={(e) => {
                e.stopPropagation();
                onInfoClick(employees, planName);
              }}
              aria-label="View all employees"
            >
              <InfoOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
            </IconButton>
          </Stack>
        ) : null
      }
    </Stack >
  );
};

// ─── LeaveTypesCell ───────────────────────────────────────────────────────────

interface LeaveTypesCellProps {
  types: string[];
  onInfoClick: (types: string[], planName: string) => void;
  planName: string;
}

const LeaveTypesCell = ({ types, onInfoClick, planName }: LeaveTypesCellProps) => {
  if (!types.length)
    return <Typography variant="body2" color="text.secondary">—</Typography>;

  const visible = types.slice(0, 2);
  const overflow = types.length - visible.length;

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
      <Typography variant="body2" color="text.secondary">
        {visible.join(", ")}
        {overflow > 0 ? `, +${overflow} more` : ""}
      </Typography>
      {overflow > 0 && (
        <IconButton
          size="small"
          sx={{ p: 0.25 }}
          onClick={(e) => {
            e.stopPropagation();
            onInfoClick(types, planName);
          }}
          aria-label="View all leave types"
        >
          <InfoOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
        </IconButton>
      )}
    </Stack>
  );
};

// ─── Modals ───────────────────────────────────────────────────────────────────

interface EmployeeModalProps {
  open: boolean;
  onClose: () => void;
  employees: LeavePlanEmployee[];
  planName: string;
}

const EmployeeModal = ({ open, onClose, employees, planName }: EmployeeModalProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle sx={{ fontSize: 15, fontWeight: 500 }}>
      Employees — {planName}
    </DialogTitle>

    <Divider />

    <DialogContent
      sx={{
        p: 2,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
          },
          gap: 1.5,
        }}
      >
        {employees.map((emp, i) => {
          const name = emp.contact?.name || "—";
          const palette = AVATAR_COLORS[i % AVATAR_COLORS.length];
          const status = emp.status ? formatStatus(String(emp.status)) : "—";
          const isActive =
            String(emp.status).toLowerCase() === "active";

          return (
            <Stack
              key={emp.employeeId ?? i}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 1.5,
                py: 1.25,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                minWidth: 0,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ minWidth: 0 }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    bgcolor: palette.bg,
                    color: palette.color,
                    flexShrink: 0,
                  }}
                >
                  {name.charAt(0).toUpperCase()}
                </Avatar>

                <Stack sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    noWrap
                  >
                    {name}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                  >
                    {emp.employeeId || "—"}
                  </Typography>
                </Stack>
              </Stack>

              <Chip
                label={status}
                size="xs"
                color={isActive ? "success" : "info"}
                sx={{
                  minWidth: 64,
                  flexShrink: 0,
                }}
              />
            </Stack>
          );
        })}
      </Box>
    </DialogContent>
  </Dialog>
);

interface LeaveTypesModalProps {
  open: boolean;
  onClose: () => void;
  types: string[];
  planName: string;
}

const LeaveTypesModal = ({ open, onClose, types, planName }: LeaveTypesModalProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ fontSize: 15, fontWeight: 500 }}>
      Leave Types — {planName}
    </DialogTitle>
    <Divider />
    <DialogContent sx={{ p: 0 }}>
      {types.map((type, i) => (
        <Stack
          key={i}
          direction="row"
          alignItems="center"
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: "1px solid",
            borderColor: "divider",
            "&:last-child": { borderBottom: "none" },
          }}
        >
          <Typography variant="body2">{type}</Typography>
        </Stack>
      ))}
    </DialogContent>
  </Dialog>
);

// ─── LeavePlan ────────────────────────────────────────────────────────────────

export const LeavePlan = forwardRef((_, ref) => {
  const [leavePlanData, setLeavePlanData] = useState<LeavePlanType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRow, setSelectedRow] = useState<LeavePlanType | null | undefined>(null);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  // Employee info modal
  const [empModal, setEmpModal] = useState<{
    open: boolean;
    employees: LeavePlanEmployee[];
    planName: string;
  }>({ open: false, employees: [], planName: "" });

  // Leave types info modal
  const [typesModal, setTypesModal] = useState<{
    open: boolean;
    types: string[];
    planName: string;
  }>({ open: false, types: [], planName: "" });

  const { data: leavePlanAllData, isLoading } = useGetLeavePlansQuery();
  const [createLeavePlan, { isLoading: isCreateLoading }] = useCreateLeavePlanMutation();
  const [updateLeavePlan, { isLoading: isUpdateLoading }] = useUpdateLeavePlanMutation();
  const [deleteLeavePlan, { isLoading: isDeleteLoading }] = useDeleteLeavePlanMutation();

  const { data: leavePlanByIdData } = useGetLeavePlanByIdQuery(
    selectedRow?.id,
    { skip: !selectedRow?.id }
  );

  useImperativeHandle(ref, () => ({
    openAddModal: handleAdd,
    search: (text: string) => setSearchQuery(text),
  }));

  useEffect(() => {
    if (leavePlanAllData) {
      setLeavePlanData(
        searchQuery
          ? leavePlanAllData.filter((plan) =>
            plan.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          : leavePlanAllData
      );
    }
  }, [leavePlanAllData, searchQuery]);

  const handleAdd = () => {
    setIsEdit(false);
    setSelectedRow(null);
    setPlanModalOpen(true);
  };

  const handleEdit = () => {
    setIsEdit(true);
    setPlanModalOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedRow?.id) return;
    try {
      await deleteLeavePlan(selectedRow.id).unwrap();
      setOpenConfirm(false);
      setSelectedRow(null);
      setSnackbar({ open: true, message: "Leave plan deleted successfully", color: "success" });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.data.message || "Failed to delete leave plan", color: "error" });
    }
    handleMenuClose();
  };

  const confirmDelete = () => {
    setOpenConfirm(true);
    handleMenuClose();
  };

  const handleSave = async (data: Partial<CreateUpdateLeavePlanRequest>) => {
    try {
      if (isEdit) {
        if (!selectedRow?.id) return;
        await updateLeavePlan({ ...data, id: selectedRow.id }).unwrap();
      } else {
        await createLeavePlan(data).unwrap();
      }
      setPlanModalOpen(false);
      setSelectedRow(null);
      setSnackbar({ open: true, message: "Leave plan saved successfully", color: "success" });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.data.message || "Failed to save leave plan", color: "error" });
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: LeavePlanType) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const getCalendarYearDisplay = (plan: LeavePlanType) => {
    if (plan.leaveCalendarType === "particular_month" && plan.calendarMonth) {
      return formatDateShort(plan.calendarMonth);
    }
    return "Calendar Year";
  };

  const loading = isLoading || isCreateLoading || isUpdateLoading || isDeleteLoading;

  return (
    <>
      {loading && !leavePlanData.length ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <StandardTable
          rows={leavePlanData}
          columns={[
            {
              id: "name",
              label: "Plan Name",
              width: "20%",
              render: (row: LeavePlanType) => (
                <Typography variant="body2" fontWeight={500}>
                  {row.name}
                </Typography>
              ),
            },
            {
              id: "calendarYear",
              label: "Calendar Year",
              width: "18%",
              render: (row: LeavePlanType) => (
                <Typography variant="body2" color="text.secondary">
                  {getCalendarYearDisplay(row)}
                </Typography>
              ),
            },
            {
              id: "leaveTypes",
              label: "Leave Types",
              width: "25%",
              render: (row: LeavePlanType) => {
                const types = row.LeavePlanDetails?.map((d) => d.leaveType.leaveName) ?? [];
                return (
                  <LeaveTypesCell
                    types={types}
                    planName={row.name}
                    onInfoClick={(t, name) =>
                      setTypesModal({ open: true, types: t, planName: name })
                    }
                  />
                );
              },
            },
            {
              id: "employees",
              label: "Employees",
              width: "27%",
              render: (row: LeavePlanType) => (
                <EmployeesCell
                  planId={row.id}
                  planName={row.name}
                  onInfoClick={(emps, name) =>
                    setEmpModal({ open: true, employees: emps, planName: name })
                  }
                />
              ),
            },
            {
              id: "actions",
              label: "Actions",
              width: "10%",
              align: "center",
              render: (row: LeavePlanType) => (
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, row)}
                  aria-label="Row actions"
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              ),
            },
          ]}
        />
      )}

      {/* Context menu */}
      <MenuAtom
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onCloseAll={handleMenuClose}
        items={[
          { label: "Edit", onClick: handleEdit },
          { label: "Delete", onClick: confirmDelete },
        ]}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={handleDelete}
        confirmText="Delete"
        confirmColor="error"
        title="Delete Plan"
        message="Are you sure you want to delete this leave plan?"
      />

      {/* Add / edit modal */}
      <LeavePlanModal
        isEdit={isEdit}
        isLoadingData={loading}
        open={planModalOpen}
        onClose={() => {
          setPlanModalOpen(false);
          setSelectedRow(null);
        }}
        onSave={handleSave}
        editRow={isEdit ? leavePlanByIdData : null}
      />

      {/* Employee info modal */}
      <EmployeeModal
        open={empModal.open}
        onClose={() => setEmpModal((s) => ({ ...s, open: false }))}
        employees={empModal.employees}
        planName={empModal.planName}
      />

      {/* Leave types info modal */}
      <LeaveTypesModal
        open={typesModal.open}
        onClose={() => setTypesModal((s) => ({ ...s, open: false }))}
        types={typesModal.types}
        planName={typesModal.planName}
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