import React, { useMemo, useState } from "react";
import {
  Card,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  CircularProgress,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { ToggleSwitch } from "../../../../components/atom/toggle-switch";
import { ModalElement } from "../../../../components/dialogs/modal-element";
import { PrimaryIconButton } from "../../../../components/atom/button";
import { AddReminderBody } from "./ReminderModal";
import { StandardTable } from "../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../types/types";
import {
  useDeleteReminderMutation,
  useGetRemindersQuery,
  usePauseReminderMutation,
  useResumeReminderMutation,
} from "../api/reminders.api";
import { ConfirmDialog } from "../../../../components/dialogs/confirm-dialog";
import { Snackbar } from "../../../../components/atom/snackbar";
import { Tooltip } from "../../../../components/atom/tooltip";
import AddIcon from "@mui/icons-material/Add";
import { PermissionGuard } from "../../../../guards/ComponentGuard";
import {
  AddReminder,
  RemindersTableMenu,
} from "../../BusinessSettingsPermission";
import { usePermission } from "../../../../context/PermissionContext";

export default function RemindersCard() {
  const { data, isLoading, isError } = useGetRemindersQuery();
  const { permissions } = usePermission();
  const [pauseReminder] = usePauseReminderMutation();
  const [resumeReminder] = useResumeReminderMutation();
  const [deleteReminder] = useDeleteReminderMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{
    anchorEl: HTMLElement | null;
    rowId: number | null;
  }>({ anchorEl: null, rowId: null });

  const [toast, setToast] = useState({
    message: "",
    color: "info" as "success" | "error" | "info" | "warning",
    open: false,
  });

  const openMenu = (e: React.MouseEvent<HTMLElement>, rowId: number) => {
    console.log(rowId);
    setMenuAnchor({ anchorEl: e.currentTarget, rowId });
  };

  const closeMenu = () => setMenuAnchor({ anchorEl: null, rowId: null });

  const columns: StandardTableColumn[] = useMemo(() => {
    const baseColumns: StandardTableColumn[] = [
      { id: "subject", label: "Subject" },
      {
        id: "reminderDate",
        label: "Reminder Date",
        render: (row: any) => {
          const date = new Date(row.startDate);
          return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
          }).format(date);
        },
      },
      {
        id: "timezone",
        label: "Timezone",
      },
      { id: "frequency", label: "Frequency" },
      {
        id: "status",
        label: "Status",
        render: (row: any) => (row.status === "ACTIVE" ? "Active" : "Inactive"),
      },
    ];

    if (permissions.includes("manage_reminders")) {
      baseColumns.push(
        {
          id: "toggleStatus",
          label: "Toggle Status",
          render: (row: any) => (
            <ToggleSwitch
              checked={row.status === "ACTIVE"}
              onChange={() => {
                if (row.status === "ACTIVE") {
                  pauseReminder({ id: row.id });
                  setToast({
                    open: true,
                    message: "Reminders paused",
                    color: "info",
                  });
                } else {
                  resumeReminder({ id: row.id });
                  setToast({
                    open: true,
                    message: "Reminder resumed successfully",
                    color: "success",
                  });
                }
              }}
              label=""
            />
          ),
        },
        {
          id: "actions",
          label: "Actions",
          align: "center",
          render: (row: any) => (
            <IconButton onClick={(e) => openMenu(e, row.id)} aria-label="more">
              <MoreVert />
            </IconButton>
          ),
        },
      );
    }

    return baseColumns;
  }, [permissions]);

  // normalizing frequency
  const formatEnumLabel = (value?: string) =>
    value
      ? value
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
      : "-";

  const rows =
    data?.data.map((r: any) => ({
      id: r.id,
      subject: r.subject,
      startDate: r.startDate,
      timezone: r.timezone?.replace(/_/g, " "),
      frequency: formatEnumLabel(r.frequency),
      status: r.status,
    })) || [];

  const selectedRow = useMemo(() => {
    return rows.find((r: any) => r.id === menuAnchor.rowId);
  }, [menuAnchor.rowId, rows]);

  if (isLoading) {
    return (
      <Card sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error">Failed to load reminders</Typography>
      </Card>
    );
  }

  return (
    <PermissionGuard permission="view_reminders">
      <Card sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">Reminders</Typography>

          <AddReminder
            onClick={(s) => {
              closeMenu();
              setIsModalOpen(s);
            }}
          />
        </Stack>

        <ModalElement
          maxWidth="lg"
          title={menuAnchor.rowId != null ? duplicate ? "Duplicate Reminder" : "Edit Reminder" : "Add Reminder"}
          open={isModalOpen}
          onClose={() => {
            console.log(menuAnchor.rowId);
            setIsModalOpen(false);
            closeMenu();
          }}
        >
          <AddReminderBody
            duplicate={duplicate}
            rowId={menuAnchor.rowId!}
            onSave={() => {
              setToast({
                open: true,
                message: "Reminder saved successfully",
                color: "success",
              });
              setIsModalOpen(false);
              closeMenu();
            }}
            onError={(message: string) => {
              setToast({
                open: true,
                message,
                color: "error",
              });
            }}
          />
        </ModalElement>

        <StandardTable columns={columns} rows={rows} sticky />
        <RemindersTableMenu
          closeMenu={() => {
            setMenuAnchor({ anchorEl: null, rowId: menuAnchor.rowId });
          }}
          menuAnchor={menuAnchor}
          onDuplicateClick={() => { 
            setDuplicate(true);
            setIsModalOpen(true);
          }}
          onEditClick={() => {
            console.log(menuAnchor);
            setIsModalOpen(true);
          }}
          onDeleteClick={() => {
            setDeleteModal(true);
          }}
        />

        <ConfirmDialog
          title="Delete Reminder"
          message="Are you sure you want to delete this reminder?"
          open={deleteModal}
          confirmColor="error"
          confirmText="Delete"
          onClose={() => {
            setDeleteModal(false);
            closeMenu();
          }}
          onConfirm={() => {
            console.log(selectedRow);
            deleteReminder({ id: selectedRow?.id });
            setDeleteModal(false);
            closeMenu();
          }}
        />
        {toast.open && (
          <Snackbar
            message={toast.message}
            color={toast.color}
            onClose={() => setToast((t) => ({ ...t, open: false }))}
          />
        )}
      </Card>
    </PermissionGuard>
  );
}
