import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { Dayjs } from "dayjs";
import { CollapsibleRowsTableAtom } from "../../../../../components/tables/standard-table/CollapsibleRowsTableAtom";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { PrimaryButton } from "../../../../../components/atom/button";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { formatDateShort } from "../../../../../utils/numberFormatter";
import { GroupByToggle } from "./GroupByToggle";
import { TasksCommentsDrawer } from "./TasksCommentsDrawer";
import { TimesheetBulkActionBar } from "./TimesheetBulkActionBar";
import {
  useApproveAttendanceTasksMutation,
  useGetPendingAttendanceTasksQuery,
  useGetProjectTimesheetsQuery,
  useGetVerificationPendingTasksQuery,
  useGetVerifiedAttendanceTasksQuery,
  useRequestAttendanceTaskChangesMutation,
} from "../api/timesheet.api";
import {
  buildAttendanceTableGroups,
  buildTimesheetProjectTableGroups,
} from "../utils/timesheet.utils";
import { TIMESHEET_COLUMN_WIDTHS as W } from "../constants/timesheetTableColumns";
import type {
  TimesheetEmployeeFilterBody,
  TimesheetGroupMode,
  TimesheetStatusTab,
  TimesheetTableRow,
} from "../types/timesheet.types";

interface TimesheetTabPanelProps {
  statusTab: TimesheetStatusTab;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  filters?: TimesheetEmployeeFilterBody;
  projectId?: number;
  projectFilters?: { techStackId?: number; isBillable?: boolean };
}

export function TimesheetTabPanel({
  statusTab,
  startDate,
  endDate,
  filters,
  projectId,
  projectFilters,
}: TimesheetTabPanelProps) {
  const [groupMode, setGroupMode] = useState<TimesheetGroupMode>("byDate");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeRow, setActiveRow] = useState<TimesheetTableRow | null>(null);
  const [drawerAttendanceId, setDrawerAttendanceId] = useState<number | null>(
    null,
  );
  const [requestChangesOpen, setRequestChangesOpen] = useState(false);
  const [requestChangesAttendanceIds, setRequestChangesAttendanceIds] =
    useState<number[]>([]);
  const [changeReason, setChangeReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const start = startDate?.format("YYYY-MM-DD") ?? "";
  const end = endDate?.format("YYYY-MM-DD") ?? "";
  const skip = !start || !end;

  const dateRangeArgs = useMemo(
    () => (skip ? undefined : { start, end }),
    [start, end, skip],
  );

  const projectQueryArgs = useMemo(
    () =>
      projectId
        ? {
            projectId,
            start,
            end,
            ...projectFilters,
          }
        : null,
    [projectId, start, end, projectFilters],
  );

  const useProjectTimesheetView = Boolean(projectId && projectQueryArgs);

  const {
    data: pendingData,
    isLoading: pendingLoading,
    isFetching: pendingFetching,
    refetch: refetchPending,
  } = useGetPendingAttendanceTasksQuery(dateRangeArgs, {
    skip: skip || useProjectTimesheetView || statusTab !== "pending_on_employee",
  });

  const {
    data: verificationData,
    isLoading: verificationLoading,
    isFetching: verificationFetching,
    refetch: refetchVerification,
  } = useGetVerificationPendingTasksQuery(dateRangeArgs, {
    skip:
      skip || useProjectTimesheetView || statusTab !== "pending_verification",
  });

  const {
    data: verifiedData,
    isLoading: verifiedLoading,
    isFetching: verifiedFetching,
    refetch: refetchVerified,
  } = useGetVerifiedAttendanceTasksQuery(dateRangeArgs, {
    skip: skip || useProjectTimesheetView || statusTab !== "verified",
  });

  const {
    data: projectTimesheetData,
    isLoading: projectLoading,
    isFetching: projectFetching,
    refetch: refetchProject,
  } = useGetProjectTimesheetsQuery(projectQueryArgs!, {
    skip: skip || !useProjectTimesheetView,
  });

  const [approveTasks] = useApproveAttendanceTasksMutation();
  const [requestChanges] = useRequestAttendanceTaskChangesMutation();

  const attendanceData =
    statusTab === "pending_on_employee"
      ? pendingData
      : statusTab === "pending_verification"
        ? verificationData
        : verifiedData;

  const loading = useProjectTimesheetView
    ? projectLoading || projectFetching
    : statusTab === "pending_on_employee"
      ? pendingLoading || pendingFetching
      : statusTab === "pending_verification"
        ? verificationLoading || verificationFetching
        : verifiedLoading || verifiedFetching;

  // Refetch only the active tab's data whenever the date range changes
  useEffect(() => {
    if (skip) return;

    if (useProjectTimesheetView) {
      refetchProject();
      return;
    }

    if (statusTab === "pending_on_employee") {
      refetchPending();
    } else if (statusTab === "pending_verification") {
      refetchVerification();
    } else {
      refetchVerified();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, statusTab, useProjectTimesheetView]);

  const tableGroups = useMemo(() => {
    if (useProjectTimesheetView) {
      return buildTimesheetProjectTableGroups(
        projectTimesheetData,
        groupMode,
        statusTab,
        start,
        end,
      );
    }
    return buildAttendanceTableGroups(
      attendanceData,
      groupMode,
      statusTab,
      start,
      end,
    );
  }, [
    useProjectTimesheetView,
    projectTimesheetData,
    attendanceData,
    groupMode,
    statusTab,
    start,
    end,
  ]);

  const allChildRows = useMemo(
    () => tableGroups.flatMap((g: { children: any; }) => g.children),
    [tableGroups],
  );

  const selectedRows = useMemo(
    () => allChildRows.filter((r: { id: string; }) => selectedIds.has(r.id)),
    [allChildRows, selectedIds],
  );

  const selectedAttendanceIds = useMemo(
    () =>
      selectedRows
        .map((r: { attendanceId: any; }) => r.attendanceId)
        .filter((id: number) => id > 0),
    [selectedRows],
  );

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  const clearSelection = () => setSelectedIds(new Set());

  const getAttendanceIdsFromRows = (rows: TimesheetTableRow[]) =>
    rows.map((r) => r.attendanceId).filter((id) => id > 0);

  const handleBulkApprove = async (attendanceIds: number[]) => {
    if (!attendanceIds.length) return;
    setIsApproving(true);
    try {
      await approveTasks({ attendanceIds }).unwrap();
      const label =
        statusTab === "pending_on_employee"
          ? "Marked as verified successfully"
          : "Approved successfully";
      showSnack(label, "success");
      clearSelection();
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        "Failed to approve";
      showSnack(message, "error");
    } finally {
      setIsApproving(false);
    }
  };

  const handleBulkRequestChanges = async (
    attendanceIds: number[],
    reason: string,
  ) => {
    if (!attendanceIds.length) return;
    try {
      await requestChanges({ attendanceIds, reason }).unwrap();
      showSnack("Change request submitted", "success");
      clearSelection();
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        "Failed to submit request";
      showSnack(message, "error");
    }
  };

  const openRequestChangesModal = (attendanceIds: number[]) => {
    if (!attendanceIds.length) return;
    setRequestChangesAttendanceIds(attendanceIds);
    setRequestChangesOpen(true);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveRow(null);
  };

  const getMenuItems = () => {
    if (!activeRow) return [];

    const ids = getAttendanceIdsFromRows([activeRow]);

    if (statusTab === "pending_verification") {
      return [
        {
          label: "Approve",
          onClick: () => handleBulkApprove(ids),
        },
        {
          label: "Request changes",
          onClick: () => openRequestChangesModal(ids),
        },
      ];
    }

    if (statusTab === "pending_on_employee") {
      return [
        {
          label: "Mark as Verified",
          onClick: () => handleBulkApprove(ids),
        },
        {
          label: "Request changes",
          onClick: () => openRequestChangesModal(ids),
        },
      ];
    }

    return [
      {
        label: "Request changes",
        onClick: () => openRequestChangesModal(ids),
      },
    ];
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const showTaskColumns =
    statusTab === "pending_verification" || statusTab === "verified";
  const showStatusColumn = statusTab === "pending_on_employee";

  const checkboxCellSx = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "& .MuiCheckbox-root": { p: 0 },
  } as const;

  const columns = useMemo(() => [
    {
      label: "",
      field: "select",
      width: W.select,
      align: "center" as const,
      
      render: (
        _v: unknown,
        row: TimesheetTableRow & { children?: TimesheetTableRow[]; name?: string },
        ctx?: { isChild?: boolean },
      ) =>
        ctx?.isChild ? (
          <Box sx={checkboxCellSx}>
            <Checkbox
              size="small"
              checked={selectedIds.has(row.id)}
              onChange={(e) => toggleRow(row.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </Box>
        ) : (
          <Box sx={checkboxCellSx}>
          <Checkbox
            size="small"
            checked={
              (row.children?.length ?? 0) > 0 &&
              row.children!.every((c) => selectedIds.has(c.id))
            }
            indeterminate={
              row.children?.some((c) => selectedIds.has(c.id)) &&
              !row.children?.every((c) => selectedIds.has(c.id))
            }
            onChange={(e) => {
              const ids = (row.children ?? []).map((c) => c.id);
              setSelectedIds((prev) => {
                const next = new Set(prev);
                ids.forEach((id) =>
                  e.target.checked ? next.add(id) : next.delete(id),
                );
                return next;
              });
            }}
            onClick={(e) => e.stopPropagation()}
          />
          </Box>
        ),
    },
    {
      label: "Group",
      field: "group",
      width: W.group,
      render: (_v: unknown, row: TimesheetTableRow & { name?: string; children?: TimesheetTableRow[] }, ctx?: { isChild?: boolean }) =>
        ctx?.isChild ? null : (
          <Typography variant="body2" fontWeight={600} noWrap title={row.name}>
            {row.name}
          </Typography>
        ),
    },
    {
      label: "Date",
      field: "date",
      width: W.date,
      render: (_v: unknown, row: TimesheetTableRow, ctx?: { isChild?: boolean }) =>
        ctx?.isChild ? (
          <Typography variant="body2" noWrap>
            {formatDateShort(row.date)}
          </Typography>
        ) : null,
    },
    {
      label: "Employee Name",
      field: "employeeName",
      width: W.employeeName,
      render: (_v: unknown, row: TimesheetTableRow, ctx?: { isChild?: boolean }) =>
        ctx?.isChild ? (
          <Typography variant="body2" noWrap title={row.employeeName}>
            {row.employeeName}
          </Typography>
        ) : null,
    },
    {
      label: "Job Title",
      field: "jobTitle",
      width: W.jobTitle,
      render: (_v: unknown, row: TimesheetTableRow, ctx?: { isChild?: boolean }) =>
        ctx?.isChild ? (
          <Typography variant="body2" noWrap title={row.jobTitle}>
            {row.jobTitle}
          </Typography>
        ) : null,
    },
    {
      label: "Department",
      field: "department",
      width: W.department,
      render: (_v: unknown, row: TimesheetTableRow, ctx?: { isChild?: boolean }) =>
        ctx?.isChild ? (
          <Typography variant="body2" noWrap title={row.department}>
            {row.department}
          </Typography>
        ) : null,
    },
    ...(showStatusColumn
      ? [
          {
            label: "Status",
            field: "status",
            width: W.status,
            render: (_v: unknown, row: TimesheetTableRow, ctx?: { isChild?: boolean }) =>
              ctx?.isChild ? (
                <Typography variant="body2" color="error.main" fontWeight={500} noWrap>
                  {row.statusLabel}
                </Typography>
              ) : null,
          },
        ]
      : []),
    ...(showTaskColumns
      ? [
          {
            label: "Task",
            field: "task",
            width: W.task,
            render: (_v: unknown, row: TimesheetTableRow, ctx?: { isChild?: boolean }) =>
              ctx?.isChild && row.attendanceId > 0 ? (
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={() => setDrawerAttendanceId(row.attendanceId)}
                >
                  View
                </Typography>
              ) : null,
          },
          {
            label: "Total Hours",
            field: "totalHours",
            width: W.totalHours,
            
            render: (_v: unknown, row: TimesheetTableRow, ctx?: { isChild?: boolean }) =>
              ctx?.isChild ? (
                <Typography variant="body2" noWrap>
                  {row.totalHours.toFixed(1)}
                </Typography>
              ) : null,
          },
        ]
      : []),
    {
      label: "Actions",
      field: "actions",
      width: W.actions,
      align: "center" as const,
      render: (_v: unknown, row: TimesheetTableRow, ctx?: { isChild?: boolean }) =>
        ctx?.isChild && row.attendanceId > 0 ? (
          <IconButton
            size="small"
            sx={{ p: 0.5 }}
            onClick={(e) => {
              setAnchorEl(e.currentTarget);
              setActiveRow(row);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        ) : null,
    },
  ], [
    showStatusColumn,
    showTaskColumns,
    selectedIds,
    statusTab,
  ]);

  const collapsibleRows = tableGroups.map((group: { children: any; }) => ({
    ...group,
    children: group.children,
  }));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        gap: 1.5,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={1.5}
        flexShrink={0}
        minHeight={33}
      >
        <GroupByToggle value={groupMode} onChange={setGroupMode} />
        <TimesheetBulkActionBar
          selectedCount={selectedAttendanceIds.length}
          statusTab={statusTab}
          onClear={clearSelection}
          onApprove={() => handleBulkApprove(selectedAttendanceIds)}
          onRequestChanges={() =>
            openRequestChangesModal(selectedAttendanceIds)
          }
          isApproving={isApproving}
        />
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {loading ? (
          <Stack alignItems="center" justifyContent="center" flex={1} py={6}>
            <CircularProgress />
          </Stack>
        ) : (
          <CollapsibleRowsTableAtom
            columns={columns}
            rows={collapsibleRows}
            ariaLabel={`Timesheets ${statusTab}`}
            emptyChildrenMessage="No timesheet entries"
            childRowIndentColumn="group"
            childRowIndent={2}
            stickyHeader
            maxHeight="100%"
            hideColumnDividers
            sx={{ flex: 1, minHeight: 0, overflowX: "auto" }}
          />
        )}
      </Box>

      <MenuAtom
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        items={getMenuItems()}
        onCloseAll={handleMenuClose}
      />

      <TasksCommentsDrawer
        open={drawerAttendanceId != null}
        attendanceId={drawerAttendanceId}
        onClose={() => setDrawerAttendanceId(null)}
      />

      <ModalElement
        open={requestChangesOpen}
        title="Request changes"
        onClose={() => {
          setRequestChangesOpen(false);
          setRequestChangesAttendanceIds([]);
          setChangeReason("");
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {requestChangesAttendanceIds.length > 1
            ? `Request changes for ${requestChangesAttendanceIds.length} entries`
            : "Request changes for this entry"}
        </Typography>
        <TextFieldElement
          fullWidth
          label="Reason"
          value={changeReason}
          onChange={(e) => setChangeReason(e.target.value)}
          required
          multiline
          rows={3}
        />
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <PrimaryButton
            disabled={
              !changeReason.trim() || requestChangesAttendanceIds.length === 0
            }
            onClick={async () => {
              await handleBulkRequestChanges(
                requestChangesAttendanceIds,
                changeReason.trim(),
              );
              setRequestChangesOpen(false);
              setRequestChangesAttendanceIds([]);
              setChangeReason("");
              handleMenuClose();
            }}
          >
            Submit
          </PrimaryButton>
        </Box>
      </ModalElement>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        />
      )}
    </Box>
  );
}
