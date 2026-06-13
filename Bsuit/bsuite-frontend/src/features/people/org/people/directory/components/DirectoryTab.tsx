import { useEffect, useMemo, useRef, useState } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SendIcon from "@mui/icons-material/Send";
import Delete from "@mui/icons-material/Delete";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { Chip } from "../../../../../../components/atom/chips";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import {
  useGetEmployeesQuery,
  useDeleteEmployeeMutation,
  useResendEmployeeInviteMutation,
  type EmployeeFilterParams,
  type InitiateExitDto,
  useInitiateExitMutation,
  isEmployeeDraft,
  useDeleteEmployeeDraftMutation,
  useGetAllEmployeesWithDraftsQuery,
} from "../api/directory.api";
import { getDepartmentName, getDesignationName, type Employee, type EmployeeListItem } from "../types/employee.types";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { InitiateExitModal } from "./InitiateExitModal";
import { ReassignManagerModal } from "../../exit/components/reassign-manager-approver/ReassignManagerApproverModal";
import { useLazyGetManagerExpenseApproverQuery } from "../../exit/api/exitManagerReassign.api";
import { useGetEmployeeInfoQuery } from "../../../../api/people.api";
import { CompOffRequestForm } from "./CompOffRequestForm";
import {
  useGetExitedQuery,
  useGetInProgressQuery,
  useGetInReviewQuery,
  useRevertExitRequestMutation,
  type Exit,
  type ExitRequest,
} from "../../exit/api/exit.api";
import type { HighlightedRow, StandardTableColumn } from "../../../../../../types/types";
import { NOTIFICATION_DEEP_LINK_DOM_READY_MS } from "../../../../utils/notificationRowHighlight";
import {
  DIRECTORY_HIGHLIGHT_ROW_ID_PARAM,
  DIRECTORY_HIGHLIGHT_TYPE_PARAM,
  DIRECTORY_ROW_HIGHLIGHT_DURATION_MS,
} from "../utils/directoryTableHighlight";

const TERMINATED_STATUS_KEYS = new Set(["terminated"]);
const RELIEVED_STATUS_KEY = "relieved";
const EXIT_IN_PROGRESS_STATUS_KEYS = new Set([
  "exit_initiated",
  "exit_requested",
  "in_notice_period",
]);

function normalizeStatusKey(status?: string | null): string {
  return (status ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

function formatStatusLabel(status?: string | null): string {
  const trimmed = status?.trim();
  if (!trimmed || trimmed === "â€”") return "â€”";

  return trimmed
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

interface DirectoryTabProps {
  searchQuery?: string;
  /** Optional filters for GET /employee query params */
  filters?: EmployeeFilterParams;
}

function getProfileDisplay(emp: Employee): string {
  const c = emp.contact;
  if (!c) return "—";
  if (c.name) return c.name;
  const parts = [c.name, c.middleName, c.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : "—";
}

type ExitListEntry = Exit | ExitRequest;

function isWrappedExitRequest(entry: ExitListEntry): entry is ExitRequest {
  return "exit" in entry && entry.exit != null;
}

function getExitEntryEmployeeId(entry: ExitListEntry): number | undefined {
  if (isWrappedExitRequest(entry)) {
    return entry.exit.employee?.id;
  }
  return entry.employee?.id;
}

function getExitEntryId(entry: ExitListEntry): number | undefined {
  if (isWrappedExitRequest(entry)) {
    return entry.exit.id;
  }
  return entry.id;
}

export function DirectoryTab({ searchQuery = "", filters }: DirectoryTabProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightedRow, setHighlightedRow] = useState<HighlightedRow>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "info" });

  const hasActiveFilters = Boolean(
    filters?.employeeStatus?.length ||
    filters?.departmentId?.length ||
    filters?.subDepartmentId?.length ||
    filters?.designationId?.length ||
    filters?.employeeType?.length
  );

  const mergedFilters: EmployeeFilterParams = {
    ...filters,
    employeeStatus: [...(filters?.employeeStatus ?? [])],
  };

  const { data: filteredResponse, isLoading: filteredLoading, refetch: refetchFiltered } =
    useGetEmployeesQuery(mergedFilters, {
      skip: !hasActiveFilters,
    });

  const { data: allResponse, isLoading: allLoading, refetch: refetchAll } =
    useGetAllEmployeesWithDraftsQuery(undefined, {
      skip: hasActiveFilters,
    });

  const response = hasActiveFilters ? filteredResponse : allResponse;
  const isLoading = hasActiveFilters ? filteredLoading : allLoading;

  const allRows = useMemo(() => response?.data ?? [], [response?.data]);

  const highlightRowIdParam = searchParams.get(DIRECTORY_HIGHLIGHT_ROW_ID_PARAM);
  const highlightTypeParam = searchParams.get(DIRECTORY_HIGHLIGHT_TYPE_PARAM);
  const highlightRefetchAttempted = useRef<string | null>(null);
  const highlightConsumedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!highlightRowIdParam || !highlightTypeParam) {
      highlightConsumedRef.current = null;
    }
  }, [highlightRowIdParam, highlightTypeParam]);

  useEffect(() => {
    if (!highlightRowIdParam || !highlightTypeParam) return;
    if (highlightTypeParam !== "add" && highlightTypeParam !== "edit") return;

    const paramKey = `${highlightRowIdParam}:${highlightTypeParam}`;
    if (highlightConsumedRef.current === paramKey) return;

    const rowExists = allRows.some((row) => String(row.id) === highlightRowIdParam);

    if (!rowExists) {
      if (
        !isLoading &&
        highlightRefetchAttempted.current !== highlightRowIdParam
      ) {
        highlightRefetchAttempted.current = highlightRowIdParam;
        if (hasActiveFilters) void refetchFiltered();
        else void refetchAll();
      }
      return;
    }

    highlightRefetchAttempted.current = null;
    highlightConsumedRef.current = paramKey;

    const timer = window.setTimeout(() => {
      setHighlightedRow({
        key: "id",
        value: highlightRowIdParam,
        type: highlightTypeParam,
      });

      const next = new URLSearchParams(searchParams);
      next.delete(DIRECTORY_HIGHLIGHT_ROW_ID_PARAM);
      next.delete(DIRECTORY_HIGHLIGHT_TYPE_PARAM);
      setSearchParams(next, { replace: true });

      window.setTimeout(() => {
        setHighlightedRow(null);
      }, DIRECTORY_ROW_HIGHLIGHT_DURATION_MS);
    }, NOTIFICATION_DEEP_LINK_DOM_READY_MS);

    return () => window.clearTimeout(timer);
  }, [
    highlightRowIdParam,
    highlightTypeParam,
    allRows,
    isLoading,
    hasActiveFilters,
    refetchFiltered,
    refetchAll,
    searchParams,
    setSearchParams,
  ]);

  const [deleteEmployee] = useDeleteEmployeeMutation();
  const [initiateExit] = useInitiateExitMutation();
  const [resendEmployeeInvite] = useResendEmployeeInviteMutation();
  const [deleteDraft] = useDeleteEmployeeDraftMutation();
  const [revertExitRequest] = useRevertExitRequestMutation();

  // state common for reassign closed and deleting employee
  const deleteTargetRow = useRef<Employee | null>(null);

  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; row: Employee } | null>(null);
  const [selectedMenuRow, setSelectedMenuRow] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [openInitiateExitModal, setOpenInitiateExitModal] = useState(false);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const [openReassignManagerModal, setOpenReassignManagerModal] = useState(false);

  const [compOffTarget, setCompOffTarget] = useState<string | null>(null);
  const [deleteDraftTarget, setDeleteDraftTarget] = useState<number | null>(null);
  const [revertTarget, setRevertTarget] = useState<Employee | null>(null);
  const { data: employeeInfo } = useGetEmployeeInfoQuery();

  const [checkManagerApproverStatus] = useLazyGetManagerExpenseApproverQuery();
  const isEmployeeNonAdminNonManager =
    employeeInfo?.data?.isEmployee === true &&
    employeeInfo?.data?.isAdmin !== true &&
    employeeInfo?.data?.isManager !== true;
  const { data: inReviewExitRequests } = useGetInReviewQuery(undefined, {
    skip: isEmployeeNonAdminNonManager,
  });
  const { data: inProgressExitRequests } = useGetInProgressQuery(undefined, {
    skip: isEmployeeNonAdminNonManager,
  });
  const { data: exitedExitRequests } = useGetExitedQuery(undefined, {
    skip: isEmployeeNonAdminNonManager,
  });

  const exitRequestByEmployeeId = useMemo(() => {
    const entries: ExitListEntry[] = [
      ...(inReviewExitRequests ?? []),
      ...(inProgressExitRequests ?? []),
      ...(exitedExitRequests ?? []),
    ];

    return new Map(
      entries
        .map((request) => {
          const employeeId = getExitEntryEmployeeId(request);
          const exitId = getExitEntryId(request);
          if (employeeId == null || exitId == null) return null;
          return [employeeId, exitId] as const;
        })
        .filter((entry): entry is readonly [number, number] => entry != null),
    );
  }, [exitedExitRequests, inProgressExitRequests, inReviewExitRequests]);

  const handleResendEmpInvite = async (employeeEmail: string) => {
    try {
      await resendEmployeeInvite({ employeeEmail }).unwrap();
      setSnackbar({ open: true, message: "Invitation resent successfully!", color: "success" });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.data?.message || error?.message || "Failed to resend invitation.",
        color: "error",
      });
    }
  };

  const actionHandlers = {
    exit: async (row: Employee) => {
      setSelectedEmployeeId(row.id.toString());
      setOpenInitiateExitModal(true);
    },

    delete: async (row: Employee) => {
      const id = row.id.toString();
      deleteTargetRow.current = row;
      
      setSelectedEmployeeId(id);
      await handleCheckStatus(id, row);
    },

    compOff: (row: Employee) => {
      setCompOffTarget(row.id.toString());
    },

    edit: (row: Employee) => {
      navigate(`/people/directory/edit/${row.id}`);
    },

    revert: (row: Employee) => {
      setRevertTarget(row);
    },
  };

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return allRows;

    const q = searchQuery.toLowerCase();

    return allRows.filter((emp) => {
      const isDraft = isEmployeeDraft(emp);

      if (isDraft) {
        return (
          (emp.middleName ?? "").toLowerCase().includes(q) ||
          (emp.lastName ?? "").toLowerCase().includes(q) ||
          (emp.workEmail ?? "").toLowerCase().includes(q) ||
          (emp.employeeType ?? "").toLowerCase().includes(q)
        );
      }

      const profile = getProfileDisplay(emp).toLowerCase();
      const designation = getDesignationName(emp).toLowerCase();
      const department = getDepartmentName(emp).toLowerCase();
      const reportingTo = emp.reportingToEmployee?.employeeId?.toLowerCase() ?? "";
      const type = (emp.employeeType ?? "").toLowerCase();
      const status = (emp.status ?? "").toLowerCase();
      const employeeId = (emp.employeeId ?? "").toLowerCase();
      return (
        profile.includes(q) ||
        designation.includes(q) ||
        department.includes(q) ||
        reportingTo.includes(q) ||
        type.includes(q) ||
        status.includes(q) ||
        employeeId.includes(q)
      );
    });
  }, [allRows, searchQuery]);

  const columns = useMemo(() => {
    const baseColumns: StandardTableColumn[] = [
      {
        id: "name",
        label: "Name",
        render: (row: EmployeeListItem) => {
          const isDraft = isEmployeeDraft(row);

          const name = isDraft
            ? row.name ||
            [row.middleName, row.lastName].filter(Boolean).join(" ") ||
            "—"
            : getProfileDisplay(row);

          return (
            <Typography
              variant="body2"
              component="button"
              onClick={() => {
                if (isDraft) {
                  navigate(`/people/directory/add?draftId=${row.id}`);
                } else {
                  navigate(`/people/directory/employee/${row.id}`);
                }
              }}
              sx={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "primary.main",
                textAlign: "left",
                textDecoration: "underline",
                "&:hover": { color: "primary.dark" },
              }}
            >
              {name}
            </Typography>
          );
        },
      },
      {
        id: "employeeId",
        label: "Employee ID",
        render: (row: EmployeeListItem) => {
          const isDraft = isEmployeeDraft(row);
          return (
            <Typography variant="body2">
              {isDraft ? "—" : row.employeeId ?? "—"}
            </Typography>
          );
        },
      },
      {
        id: "email",
        label: "Email",
        render: (row: EmployeeListItem) => {
          const email = row.workEmail ?? row.contact?.email ?? "";
          const isInvitationSent = normalizeStatusKey(row.status) === "invitation_sent";

          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography variant="body2">{email || "—"}</Typography>
              {!isEmployeeDraft(row) && isInvitationSent && email && (
                <Tooltip title="Resend invitation" arrow>
                  <IconButton
                    size="small"
                    color="info"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResendEmpInvite(email);
                    }}
                    sx={{ p: 0.25 }}
                  >
                    <SendIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        },
      },
      {
        id: "designation",
        label: "Designation",
        render: (row: EmployeeListItem) => (
          <Typography variant="body2">
            {getDesignationName(row) || "—"}
          </Typography>
        ),
      },
      {
        id: "department",
        label: "Department",
        render: (row: EmployeeListItem) => (
          <Typography variant="body2">
            {`${getDepartmentName(row) || "—"}${row.subDepartment ? ` - ${row.subDepartment.subDepartmentName}` : ""
              }`}
          </Typography>
        ),
      },
      {
        id: "reportingTo",
        label: "Reporting To",
        render: (row: EmployeeListItem) => {
          const isDraft = isEmployeeDraft(row);

          if (isDraft) {
            return (
              <Typography variant="body2">
                {row.reportingTo ?? "—"}
              </Typography>
            );
          }

          const c = row.reportingToEmployee?.contact;
          if (!c) return <Typography variant="body2">—</Typography>;
          const parts = [c.name ?? c.firstName, c.middleName, c.lastName].filter(Boolean);
          return <Typography variant="body2">{parts.join(" ") || "—"}</Typography>;
        },
      },
      {
        id: "type",
        label: "Type",
        render: (row: EmployeeListItem) => (
          <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
            {(row.employeeType ?? "—").toString()}
          </Typography>
        ),
      },
      {
        id: "status",
        label: "Status",
        width: 100,
        render: (row: EmployeeListItem) => {
          const isDraft = isEmployeeDraft(row);
          const status = isDraft ? "draft" : row.status ?? "—";
          const statusLower = status === "—" ? "" : status.toLowerCase();
          const statusKey = normalizeStatusKey(status);

          // Don't render a chip for invitation_sent — handled in email column
          if (!isDraft && statusKey === "invitation_sent") return null;

          const color: "success" | "error" | "warning" | "primary" | "info" =
            statusLower === "in_notice_period" || statusLower === "in notice period"
              ? "warning"
              : statusLower === "exit_requested" || statusLower === "exit requested" || statusLower === "relieved"
                ? "error"
                : statusLower === "active"
                  ? "success"
                  : ["inactive", "terminated", "left"].includes(statusLower)
                    ? "error"
                    : ["onboarding", "probation"].includes(statusLower)
                      ? "warning"
                      : statusLower === "draft"
                        ? "warning"
                        : "primary";

          return (
            <Chip
              aria-label={formatStatusLabel(status)}
              label={
                !status || status === "—"
                  ? "—"
                  : status.charAt(0).toUpperCase() +
                  status.slice(1).toLowerCase().replace(/_/g, " ")
              }
              color={color}
              size="small"
            />
          );
        },
      },
    ];

    if (!isEmployeeNonAdminNonManager) {
      baseColumns.push({
        id: "actions",
        label: "Actions",
        render: (row: EmployeeListItem) => {
          const isDraft = isEmployeeDraft(row);
          const statusKey = normalizeStatusKey(row.status);
          if (isDraft)
            return <PrimaryIconButton
              icon={<Delete fontSize="small" />}
              variant="outlined"
              color="error"
              aria-label="Actions"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteDraftClick(row.id);
              }}
            />;

          if (TERMINATED_STATUS_KEYS.has(statusKey)) {
            return null;
          }

          const showActionsOnlyRevert = statusKey === RELIEVED_STATUS_KEY;
          if (
            !showActionsOnlyRevert &&
            statusKey !== "active" &&
            !EXIT_IN_PROGRESS_STATUS_KEYS.has(statusKey)
          ) {
            return null;
          }

          return (
            <PrimaryIconButton
              icon={<MoreVertIcon fontSize="small" />}
              variant="outlined"
              aria-label="Actions"
              onClick={(e) => {
                e.stopPropagation();
                setMenuAnchor({ el: e.currentTarget, row });
                setSelectedMenuRow(row);
              }}
            />
          );
        },
      });
    }

    return baseColumns;
  }, [isEmployeeNonAdminNonManager, navigate]);

  const handleDeleteDraftClick = (id: number) => {
    setDeleteDraftTarget(id);
  };

  const handleDeleteDraftConfirm = async () => {
    if (!deleteDraftTarget) return;

    try {
      await deleteDraft(deleteDraftTarget).unwrap();

      setSnackbar({
        open: true,
        message: "Draft deleted successfully.",
        color: "success",
      });

      setDeleteDraftTarget(null);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message:
          error?.data?.message ||
          error?.message ||
          "Failed to delete draft.",
        color: "error",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEmployee(deleteTarget.id).unwrap();
      setSnackbar({
        open: true,
        message: "Employee deleted successfully.",
        color: "success",
      });
      setDeleteTarget(null);
    } catch (error: any) {
      console.error("Delete employee error:", error);
      const backendMessage =
        error?.data?.message ||
        error?.error ||
        error?.message ||
        "Failed to delete employee.";

      setSnackbar({
        open: true,
        message: backendMessage,
        color: "error",
      });
    }
  };

  const handleRevertConfirm = async () => {
    if (!revertTarget) return;

    const exitId = exitRequestByEmployeeId.get(revertTarget.id);

    if (exitId == null) {
      setSnackbar({
        open: true,
        message: "Unable to find an active exit request for this employee.",
        color: "error",
      });
      setRevertTarget(null);
      return;
    }

    try {
      const response = await revertExitRequest({ exitId }).unwrap();
      setSnackbar({
        open: true,
        message: response?.message || "Exit request reverted successfully.",
        color: "success",
      });
      setRevertTarget(null);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message:
          error?.data?.message ||
          error?.message ||
          "Failed to revert exit request.",
        color: "error",
      });
    }
  };

  const handleExit = async (data: InitiateExitDto) => {
    try {
      if (!selectedEmployeeId) return;
      const payload = {
        employeeId: selectedEmployeeId,
        body: data,
      };

      await initiateExit(payload).unwrap();

      setSnackbar({
        open: true,
        message: "Exit initiated successfully.",
        color: "success",
      });
      setOpenInitiateExitModal(false);
    } catch (error: any) {
      console.error("Initiate exit error:", error);
      const backendMessage =
        error?.data?.message ||
        error?.error ||
        error?.message ||
        "Failed to initiate exit.";

      setSnackbar({
        open: true,
        message: backendMessage,
        color: "error",
      });
    }
  };

  const handleCheckStatus = async (id: string, row?: Employee) => {
    try {

      // check status 
      const status = await checkManagerApproverStatus(id).unwrap();

      if (status.isManager || status.isExpenseApprover) {
        setOpenReassignManagerModal(true);
      } else if (row) {
        setDeleteTarget(row);
      }
    } catch (error) {
      console.error("Failed to check manager/approver status", error);
    }
  };

  const handleCloseReassignModal = async () => {

    setOpenReassignManagerModal(false);

    if (!selectedEmployeeId) return;
    try {

      const status = await checkManagerApproverStatus(selectedEmployeeId).unwrap();

      if (!status.isManager && !status.isExpenseApprover) {

        if (deleteTargetRow?.current) {
          setDeleteTarget(deleteTargetRow.current);
        }
      }
    } catch (e: any) {
      console.error(e?.data?.message, 'error while fetching status');
    }
  }

  const menuItems = useMemo(() => {
    if (!selectedMenuRow) return [];

    const row = selectedMenuRow;
    const statusKey = normalizeStatusKey(row.status);
    const showCompOff = row.isCompOffEnabled !== false;
    const compOffItem = showCompOff
      ? [
        {
          label: "Award Comp-Off",
          onClick: () => {
            setMenuAnchor(null);
            setTimeout(() => actionHandlers.compOff(row), 0);
          },
        },
      ]
      : [];

    if (statusKey === "active") {
      const shouldInitiateExit = row.existsInPayRun === true || row.canDelete === false;

      return [
        {
          label: "Edit",
          onClick: () => {
            setMenuAnchor(null);
            setTimeout(() => actionHandlers.edit(row), 0);
          },
        },
        shouldInitiateExit
          ? {
            label: "Initiate Exit",
            onClick: () => {
              setMenuAnchor(null);
              setTimeout(() => actionHandlers.exit(row), 0);
            },
          }
          : {
            label: "Delete",
            onClick: () => {
              setMenuAnchor(null);
              setTimeout(() => actionHandlers.delete(row), 0);
            },
          },
        ...compOffItem,
      ];
    }

    if (statusKey === RELIEVED_STATUS_KEY) {
      return [
        {
          label: "Revert",
          onClick: () => {
            setMenuAnchor(null);
            setTimeout(() => actionHandlers.revert(row), 0);
          },
        },
      ];
    }

    if (EXIT_IN_PROGRESS_STATUS_KEYS.has(statusKey)) {
      return [
        {
          label: "Revert",
          onClick: () => {
            setMenuAnchor(null);
            setTimeout(() => actionHandlers.revert(row), 0);
          },
        },
        {
          label: "Edit",
          onClick: () => {
            setMenuAnchor(null);
            setTimeout(() => actionHandlers.edit(row), 0);
          },
        },
        ...compOffItem,
      ];
    }

    return [];
  }, [selectedMenuRow]);


  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <StandardTable
        columns={columns}
        rows={filteredRows}
        loading={isLoading}
        highlightedRow={highlightedRow}
        onRowClick={(row: EmployeeListItem) => {
          if (!isEmployeeDraft(row)) return;

          navigate(`/people/directory/add?draftId=${row.id}`);
        }}
        isRowClickable={(row) => isEmployeeDraft(row)}
        sticky
        emptyMessage="No employees found"
        sx={{ flex: 1, overflow: "auto" }}
      />
      <MenuAtom
        anchorEl={menuAnchor?.el ?? null}
        open={Boolean(menuAnchor)}
        onCloseAll={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        items={menuItems}
      />
      <InitiateExitModal
        open={openInitiateExitModal}
        onClose={() => setOpenInitiateExitModal(false)}
        onConfirm={handleExit}
      />
      <ReassignManagerModal
        open={openReassignManagerModal}
        onClose={handleCloseReassignModal}
        exitId={selectedEmployeeId}
      />

      <CompOffRequestForm
        open={Boolean(compOffTarget)}
        employeeId={compOffTarget || ""}
        onClose={() => setCompOffTarget(null)}
        onAfterAction={(msg, color) => {
          setSnackbar({ open: true, message: msg, color: color as 'success' | 'error' });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget) || Boolean(deleteDraftTarget)}
        title={deleteDraftTarget ? "Delete draft" : "Delete employee"}
        message={
          deleteDraftTarget
            ? "Are you sure you want to delete this draft? This action cannot be undone."
            : "Are you sure you want to delete this employee? This action cannot be undone."
        }
        confirmText="Delete"
        confirmColor="error"
        onClose={() => {
          setDeleteTarget(null);
          setDeleteDraftTarget(null);
        }}
        onConfirm={() => {
          if (deleteDraftTarget) {
            handleDeleteDraftConfirm();
          } else {
            handleDeleteConfirm();
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(revertTarget)}
        title="Revert exit request"
        message="Are you sure you want to revert this employee's exit request?"
        confirmText="Revert"
        confirmColor="primary"
        onClose={() => setRevertTarget(null)}
        onConfirm={handleRevertConfirm}
      />

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          autoClose={4000}
        />
      )}
    </Box>
  );
}
