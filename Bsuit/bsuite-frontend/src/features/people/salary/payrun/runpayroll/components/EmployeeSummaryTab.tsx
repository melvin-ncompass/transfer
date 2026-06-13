import { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Link,
  Checkbox,
  Divider,
  Chip,
} from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import type { StandardTableColumn } from "../../../../../../types/types";
import {
  useAddNonRecurringEarningMutation,
  useAddNonRecurringDeductionMutation,
  useDeleteNonRecurringEarningMutation,
  useDeleteNonRecurringDeductionMutation,
  useAddLopMutation,
  useRemoveLopMutation,
  useDownloadTdsSheetMutation,
  useSkipEmployeesMutation,
  useRestoreEmployeesMutation,
  type PayrunStatus,
  type PayrunEmployee,
} from "../api/payrun.api";
import { useGetEarningsQuery } from "../../../structure/Earnings/api/earnings.api";
import { useGetDeductionsQuery } from "../../../structure/Deductions/api/deductions.api";
import { PayslipModal } from "./PayslipModal";
import { TdsSheetModal } from "./TdsSheetModal";
import { NonRecurringModal } from "./NonRecurringModal";
import { RemoveNonRecurringModal } from "./RemoveNonRecurringModal";
import { AddLopModal } from "./AddLopModal";
import { SkipEmployeeModal } from "./SkipEmployeeModal";
import { EmployeeActionsMenu } from "./EmployeeActionsMenu";
import type { NonRecurringKind, RemoveOption, LopAction } from "../types";
import { getErrorMessage } from "../utils";

function resolveEmployeeId(emp: PayrunEmployee): number | null {
  const fromRowId = Number(emp.id);
  if (Number.isFinite(fromRowId) && fromRowId > 0) return fromRowId;
  const fromNumericField = Number((emp as { employeeId?: unknown }).employeeId);
  if (Number.isFinite(fromNumericField) && fromNumericField > 0) return fromNumericField;
  return null;
}

export function EmployeeSummaryTab({
  employees,
  payrunId,
  status,
  payPeriodLabel,
  payPeriodRange,
  onToast,
}: {
  employees: PayrunEmployee[];
  payrunId: number;
  status: PayrunStatus;
  payPeriodLabel?: string;
  payPeriodRange?: string;
  onToast: (message: string, color?: "success" | "error" | "info" | "warning") => void;
}) {
  const [payslipEmployee, setPayslipEmployee] = useState<{
    employeeId: number | string;
    employeeName: string;
    employeeDisplayId: number | string;
  } | null>(null);
  const [tdsSheetEmployee, setTdsSheetEmployee] = useState<{
    employee: PayrunEmployee;
    resolvedEmployeeId: number;
    employeeDisplayId: number | string;
  } | null>(null);
  // Keyed by resolved numeric employee ID so selection survives refetches/reorders.
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkAnchor, setBulkAnchor] = useState<null | HTMLElement>(null);
  const [nonRecurringModalKind, setNonRecurringModalKind] = useState<NonRecurringKind | null>(null);
  const [removeNonRecurringKind, setRemoveNonRecurringKind] = useState<NonRecurringKind | null>(null);
  const [removeNonRecurringOptions, setRemoveNonRecurringOptions] = useState<RemoveOption[]>([]);
  const [removeNonRecurringComponentIds, setRemoveNonRecurringComponentIds] = useState<number[]>([]);
  const [removeNonRecurringConfirmOpen, setRemoveNonRecurringConfirmOpen] = useState(false);
  const [addLopModalOpen, setAddLopModalOpen] = useState(false);
  const [removeLopConfirmOpen, setRemoveLopConfirmOpen] = useState(false);
  const [targetEmployeeIds, setTargetEmployeeIds] = useState<number[]>([]);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [targetEmployeeNames, setTargetEmployeeNames] = useState<string[]>([]);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [skipReasonByEmployeeId, setSkipReasonByEmployeeId] = useState<Record<number, string>>({});

  const [addNonRecurringEarning, { isLoading: isAddingEarning }] =
    useAddNonRecurringEarningMutation();
  const [addNonRecurringDeduction, { isLoading: isAddingDeduction }] =
    useAddNonRecurringDeductionMutation();
  const [deleteNonRecurringEarning, { isLoading: isRemovingEarning }] =
    useDeleteNonRecurringEarningMutation();
  const [deleteNonRecurringDeduction, { isLoading: isRemovingDeduction }] =
    useDeleteNonRecurringDeductionMutation();
  const [addLop, { isLoading: isAddingLop }] = useAddLopMutation();
  const [removeLop, { isLoading: isRemovingLop }] = useRemoveLopMutation();
  const [downloadTdsSheet, { isLoading: isDownloadingTds }] = useDownloadTdsSheetMutation();
  const [skipEmployees, { isLoading: isSkippingEmployees }] = useSkipEmployeesMutation();
  const [restoreEmployees, { isLoading: isRestoringEmployees }] = useRestoreEmployeesMutation();
  const [tdsDownloadingEmployeeId, setTdsDownloadingEmployeeId] = useState<number | null>(null);

  const bulkMenuOpen = Boolean(bulkAnchor);
  const { data: earnings = [] } = useGetEarningsQuery(undefined, { skip: !bulkMenuOpen });
  const { data: deductions = [] } = useGetDeductionsQuery(undefined, { skip: !bulkMenuOpen });

  const isDraft = status === "draft" || status === "created" || status === "rejected";

  const selectedEmployeeIds = useMemo(
    () => Array.from(selectedIds),
    [selectedIds]
  );

  const selectedEmployees = useMemo(
    () => employees.filter((emp) => {
      const eid = resolveEmployeeId(emp);
      return eid !== null && selectedIds.has(eid);
    }),
    [employees, selectedIds]
  );

  const allHaveLop =
    selectedEmployees.length > 0 && selectedEmployees.every((e) => Number(e.lopDays) > 0);
  const allHaveNoLop =
    selectedEmployees.length > 0 && selectedEmployees.every((e) => Number(e.lopDays) <= 0);

  const allHaveNoNonRecurringEarning =
    selectedEmployees.length > 0 &&
    selectedEmployees.every((e) => (e.onetimeEarningIds?.length ?? 0) === 0);
  const allHaveNoNonRecurringDeduction =
    selectedEmployees.length > 0 &&
    selectedEmployees.every((e) => (e.onetimeDeductionIds?.length ?? 0) === 0);

  const nonRecurringEarningOptions = useMemo(() => {
    const ids = new Set<number>();
    for (const e of selectedEmployees)
      for (const id of e.onetimeEarningIds ?? []) {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) ids.add(n);
      }
    return Array.from(ids).map((id) => {
      const match = earnings.find((e) => Number(e.id) === id);
      return { componentId: id, label: match?.earningName ?? `Earning #${id}` };
    });
  }, [selectedEmployees, earnings]);

  const nonRecurringDeductionOptions = useMemo(() => {
    const ids = new Set<number>();
    for (const e of selectedEmployees)
      for (const id of e.onetimeDeductionIds ?? []) {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) ids.add(n);
      }
    return Array.from(ids).map((id) => {
      const match = deductions.find((d) => Number(d.id) === id);
      return { componentId: id, label: match?.deductionName ?? `Deduction #${id}` };
    });
  }, [selectedEmployees, deductions]);

  const showGear = isDraft && selectedIds.size > 1;

  const isSubmitting =
    isAddingEarning ||
    isAddingDeduction ||
    isRemovingEarning ||
    isRemovingDeduction ||
    isAddingLop ||
    isRemovingLop ||
    isSkippingEmployees ||
    isRestoringEmployees;

  const toggleSelect = (empId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  const allSelectableIds = useMemo(
    () => employees.map((e) => resolveEmployeeId(e)).filter((id): id is number => id !== null),
    [employees]
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === allSelectableIds.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(allSelectableIds));
  };

  const openActionForEmployees = (
    action: "earning" | "deduction" | LopAction,
    employeeIds: number[]
  ) => {
    if (employeeIds.length === 0) {
      onToast("Select at least one employee with valid employee id.", "warning");
      return;
    }
    setTargetEmployeeIds(employeeIds);
    if (action === "add_lop") { setAddLopModalOpen(true); return; }
    if (action === "remove_lop") { setRemoveLopConfirmOpen(true); return; }
    setNonRecurringModalKind(action);
  };

  const handleConfirmNonRecurring = async (
    rows: { componentId: number; monthlyAmount: number }[]
  ) => {
    try {
      const components = rows.map((row) => ({
        componentId: row.componentId,
        monthlyAmount: row.monthlyAmount,
      }));
      if (nonRecurringModalKind === "earning") {
        await addNonRecurringEarning({ payrunId, employeeIds: targetEmployeeIds, components }).unwrap();
        onToast("Non-recurring earning added successfully.", "success");
      } else if (nonRecurringModalKind === "deduction") {
        await addNonRecurringDeduction({ payrunId, employeeIds: targetEmployeeIds, components }).unwrap();
        onToast("Non-recurring deduction added successfully.", "success");
      }
      setNonRecurringModalKind(null);
      setSelectedIds(new Set());
    } catch (err) {
      onToast(getErrorMessage(err), "error");
    }
  };

  const handleConfirmAddLop = async (lopDays: number) => {
    try {
      await addLop({ payrunId, employeeIds: targetEmployeeIds, lopDays }).unwrap();
      onToast("LOP added successfully.", "success");
      setAddLopModalOpen(false);
      setSelectedIds(new Set());
    } catch (err) {
      onToast(getErrorMessage(err), "error");
    }
  };

  const handleConfirmRemoveLop = async () => {
    try {
      await removeLop({ payrunId, employeeIds: targetEmployeeIds }).unwrap();
      onToast("LOP removed successfully.", "success");
      setRemoveLopConfirmOpen(false);
      setSelectedIds(new Set());
    } catch (err) {
      onToast(getErrorMessage(err), "error");
    }
  };

  const openRemoveNonRecurring = (
    kind: NonRecurringKind,
    employeeIds: number[],
    options: RemoveOption[]
  ) => {
    if (employeeIds.length === 0) {
      onToast("Select at least one employee with valid employee id.", "warning");
      return;
    }
    setTargetEmployeeIds(employeeIds);
    setRemoveNonRecurringKind(kind);
    setRemoveNonRecurringOptions(options);
    setRemoveNonRecurringComponentIds([]);
    setRemoveNonRecurringConfirmOpen(false);
  };

  const handleContinueRemoveNonRecurring = (componentIds: number[]) => {
    if (!removeNonRecurringKind || componentIds.length === 0) return;
    setRemoveNonRecurringComponentIds(componentIds);
    setRemoveNonRecurringConfirmOpen(true);
  };

  const handleConfirmRemoveNonRecurring = async () => {
    if (!removeNonRecurringKind) return;
    if (targetEmployeeIds.length === 0 || removeNonRecurringComponentIds.length === 0) return;
    try {
      if (removeNonRecurringKind === "earning") {
        await deleteNonRecurringEarning({
          payrunId,
          componentIds: removeNonRecurringComponentIds,
          employeeIds: targetEmployeeIds,
        }).unwrap();
        onToast("Non-recurring earning removed successfully.", "success");
      } else {
        await deleteNonRecurringDeduction({
          payrunId,
          componentIds: removeNonRecurringComponentIds,
          employeeIds: targetEmployeeIds,
        }).unwrap();
        onToast("Non-recurring deduction removed successfully.", "success");
      }
      setRemoveNonRecurringConfirmOpen(false);
      setRemoveNonRecurringKind(null);
      setRemoveNonRecurringOptions([]);
      setRemoveNonRecurringComponentIds([]);
      setSelectedIds(new Set());
    } catch (err) {
      onToast(getErrorMessage(err), "error");
    }
  };

  const handleDownloadTds = async (emp: PayrunEmployee) => {
    const eid = resolveEmployeeId(emp);
    if (eid == null) {
      onToast("Could not resolve employee id for TDS download.", "warning");
      return;
    }
    setTdsDownloadingEmployeeId(eid);
    try {
      const { blob, fileName } = await downloadTdsSheet({ payrunId, employeeId: eid }).unwrap();

      // Prefer server filename from content-disposition, fall back to constructed name.
      // Format: "FY-2026-2027-Melvin.pdf"
      let resolvedFileName = fileName;
      if (!fileName || fileName.startsWith("tds-sheet-")) {
        const firstName = emp.name.split(" ")[0];
        let fyPrefix = "";
        if (payPeriodLabel) {
          const parsed = dayjs(payPeriodLabel, "MMMM YYYY");
          if (parsed.isValid()) {
            const month = parsed.month() + 1;
            const year = parsed.year();
            const fyStart = month >= 4 ? year : year - 1;
            fyPrefix = `FY-${fyStart}-${fyStart + 1}-`;
          }
        }
        resolvedFileName = `${fyPrefix}${firstName}.pdf`;
      }

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = resolvedFileName;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      anchor.remove();
      onToast("TDS sheet downloaded successfully.", "success");
    } catch (err: unknown) {
      onToast(getErrorMessage(err), "error");
    } finally {
      setTdsDownloadingEmployeeId(null);
    }
  };

  const openSkipForEmployees = (employeeIds: number[], employeeNames: string[]) => {
    if (employeeIds.length === 0) {
      onToast("Select at least one employee with valid employee id.", "warning");
      return;
    }
    setTargetEmployeeIds(employeeIds);
    setTargetEmployeeNames(employeeNames);
    setSkipModalOpen(true);
  };

  const handleConfirmSkip = async (reason: string) => {
    try {
      const result = await skipEmployees({
        payrunId,
        employeeIds: targetEmployeeIds,
        reason,
      }).unwrap();
      const reasonFromApi = result.reason ?? reason;
      if (reasonFromApi?.trim()) {
        setSkipReasonByEmployeeId((prev) => {
          const next = { ...prev };
          const ids = result.employeeIds.length > 0 ? result.employeeIds : targetEmployeeIds;
          ids.forEach((id) => {
            next[id] = reasonFromApi;
          });
          return next;
        });
      }
      onToast("Employee(s) skipped from payrun successfully.", "success");
      setSkipModalOpen(false);
      setSelectedIds(new Set());
    } catch (err) {
      onToast(getErrorMessage(err), "error");
    }
  };

  const openRestoreForEmployees = (employeeIds: number[]) => {
    if (employeeIds.length === 0) {
      onToast("Select at least one employee with valid employee id.", "warning");
      return;
    }
    setTargetEmployeeIds(employeeIds);
    setRestoreConfirmOpen(true);
  };

  const handleConfirmRestore = async () => {
    try {
      const result = await restoreEmployees({ payrunId, employeeIds: targetEmployeeIds }).unwrap();
      setSkipReasonByEmployeeId((prev) => {
        const next = { ...prev };
        const ids = result.employeeIds.length > 0 ? result.employeeIds : targetEmployeeIds;
        ids.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      onToast("Employee(s) added back to payrun successfully.", "success");
      setRestoreConfirmOpen(false);
      setSelectedIds(new Set());
    } catch (err) {
      onToast(getErrorMessage(err), "error");
    }
  };

  const employeeTableRows = employees.map((emp, idx) => ({
    id: idx,
    __empId: resolveEmployeeId(emp),
    emp,
    tdsEmployeeId: resolveEmployeeId(emp),
  }));

  const employeeTableColumns: StandardTableColumn[] = [
    ...(isDraft
      ? [
          {
            id: "_select",
            label: "",
            width: 44,
            minWidth: 44,
            headerAlign: "center" as const,
            align: "center" as const,
            headerRender: () => (
              <Checkbox
                size="small"
                indeterminate={
                  selectedIds.size > 0 && selectedIds.size < allSelectableIds.length
                }
                checked={allSelectableIds.length > 0 && selectedIds.size === allSelectableIds.length}
                onChange={toggleSelectAll}
                sx={{ p: 0, m: 0 }}
              />
            ),
            render: (row: { __empId: number | null }) => (
              <Checkbox
                size="small"
                checked={row.__empId !== null && selectedIds.has(row.__empId)}
                onChange={() => row.__empId !== null && toggleSelect(row.__empId)}
                disabled={row.__empId === null}
                sx={{ p: 0, m: 0 }}
              />
            ),
          } satisfies StandardTableColumn,
        ]
      : []),
    {
      id: "displayId",
      label: "ID",
      width: 72,
      minWidth: 72,
      headerAlign: "left",
      render: (row: { emp: PayrunEmployee }) => {
        const emp = row.emp;
        return (
          <>
            {emp.employeeCode ??
              emp.employeeNumber ??
              (typeof emp.employeeId === "string"
                ? emp.employeeId
                : emp.employeeId != null
                  ? String(emp.employeeId)
                  : "—")}
          </>
        );
      },
    },
    {
      id: "name",
      label: "Name",
      width: 210,
      minWidth: 210,
      headerAlign: "left",
      render: (row: { emp: PayrunEmployee }) => (
        <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>
          {row.emp.name}
        </Typography>
      ),
    },
    {
      id: "paidDays",
      label: "Paid Days",
      width: 100,
      minWidth: 100,
      headerAlign: "left",
      render: (row: { emp: PayrunEmployee }) => {
        const emp = row.emp;
        if (emp.isSkipped) {
          return (
            <Chip
              label="Skipped"
              size="small"
              sx={{
                height: 20,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: "#fbe9e7",
                color: "#bf360c",
                "& .MuiChip-label": { px: 1 },
              }}
            />
          );
        }
        const paidDays = parseFloat(emp.noOfPaidDays);
        return (
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {isNaN(paidDays) ? "—" : paidDays}
          </Typography>
        );
      },
    },
    {
      id: "gross",
      label: "Current Month Gross",
      width: 190,
      minWidth: 190,
      align: "right",
      headerAlign: "right",
      render: (row: { emp: PayrunEmployee }) => {
        const emp = row.emp;
        if (emp.isSkipped) {
          const resolvedId = resolveEmployeeId(emp);
          const reasonText =
            (resolvedId != null ? skipReasonByEmployeeId[resolvedId] : undefined) ??
            emp.skipReason;
          return (
            <Typography
              variant="body2"
              sx={{ fontSize: 12, color: "text.secondary", fontStyle: "italic" }}
            >
              {reasonText ? `Reason: ${reasonText}` : "—"}
            </Typography>
          );
        }
        return (
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(emp.monthlyGross)}
          </Typography>
        );
      },
    },
    {
      id: "netPay",
      label: "Net Pay",
      width: 150,
      minWidth: 150,
      align: "right",
      headerAlign: "right",
      render: (row: { emp: PayrunEmployee }) => {
        const emp = row.emp;
        if (emp.isSkipped) {
          return (
            <Typography variant="body2" color="text.secondary"></Typography>
          );
        }
        return (
          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }}>
            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(emp.netPay)}
          </Typography>
        );
      },
    },
    {
      id: "payslip",
      label: "Pay Slip",
      width: 120,
      minWidth: 120,
      align: "center",
      headerAlign: "center",
      render: (row: { emp: PayrunEmployee }) => {
        const emp = row.emp;
        if (emp.isSkipped) {
          return (
            <Typography variant="body2" color="text.secondary" align="center"></Typography>
          );
        }
        const payslipNumericId = Number(emp.id);
        const canOpenPayslip = Number.isFinite(payslipNumericId) && payslipNumericId > 0;
        const displayCode =
          emp.employeeCode ??
          (typeof emp.employeeId === "string" ? emp.employeeId : undefined) ??
          (typeof emp.employeeId === "number" ? String(emp.employeeId) : undefined) ??
          emp.employeeNumber ??
          "";
        const openPayslip = () =>
          setPayslipEmployee({
            employeeId: canOpenPayslip
              ? payslipNumericId
              : (typeof emp.employeeId === "string" ? emp.employeeId : null) ??
                emp.employeeCode ??
                emp.employeeNumber ??
                "",
            employeeName: emp.name,
            employeeDisplayId: displayCode,
          });
        return (
          <Link
            component="button"
            variant="body2"
            color="primary"
            underline="hover"
            sx={{ fontSize: 13, cursor: "pointer" }}
            onClick={openPayslip}
          >
            View
          </Link>
        );
      },
    },
    {
      id: "tds",
      label: "TDS Sheet",
      width: 120,
      minWidth: 120,
      align: "center",
      headerAlign: "center",
      render: (row: { emp: PayrunEmployee; tdsEmployeeId: number | null }) => {
        const emp = row.emp;
        const tdsEmployeeId = row.tdsEmployeeId;
        if (emp.isSkipped) {
          return (
            <Typography variant="body2" color="text.secondary" align="center"></Typography>
          );
        }
        return emp.monthlyGross > 0 ? (
          <Link
            component="button"
            variant="body2"
            color="primary"
            underline="hover"
            sx={{ fontSize: 13, cursor: "pointer" }}
            onClick={() => {
              if (tdsEmployeeId == null) {
                onToast("Selected employee has no employee id.", "warning");
                return;
              }
              const employeeDisplayValue =
                emp.employeeCode ??
                emp.employeeNumber ??
                (typeof emp.employeeId === "string"
                  ? emp.employeeId
                  : emp.employeeId != null
                    ? String(emp.employeeId)
                    : "");
              setTdsSheetEmployee({
                employee: emp,
                resolvedEmployeeId: tdsEmployeeId,
                employeeDisplayId: employeeDisplayValue,
              });
            }}
          >
            View
          </Link>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center">
            -
          </Typography>
        );
      },
    },
    {
      id: "actions",
      label: "Actions",
      width: 150,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      render: (row: { emp: PayrunEmployee }) => {
        const emp = row.emp;
        return (
          <EmployeeActionsMenu
            isDraft={isDraft}
            lopDays={emp.lopDays}
            appliedNonRecurringEarningIds={emp.onetimeEarningIds ?? []}
            appliedNonRecurringDeductionIds={emp.onetimeDeductionIds ?? []}
            isSkipped={emp.isSkipped}
            onPick={(action) => {
              const resolvedId = resolveEmployeeId(emp);
              if (resolvedId == null) {
                onToast("Selected employee has no employee id.", "warning");
                return;
              }
              openActionForEmployees(action as "earning" | "deduction" | LopAction, [resolvedId]);
            }}
            onRemovePick={(kind, options) => {
              const resolvedId = resolveEmployeeId(emp);
              if (resolvedId == null) {
                onToast("Selected employee has no employee id.", "warning");
                return;
              }
              openRemoveNonRecurring(kind, [resolvedId], options);
            }}
            onSkip={() => {
              const resolvedId = resolveEmployeeId(emp);
              if (resolvedId == null) {
                onToast("Selected employee has no employee id.", "warning");
                return;
              }
              openSkipForEmployees([resolvedId], [emp.name]);
            }}
            onRestore={() => {
              const resolvedId = resolveEmployeeId(emp);
              if (resolvedId == null) {
                onToast("Selected employee has no employee id.", "warning");
                return;
              }
              openRestoreForEmployees([resolvedId]);
            }}
          />
        );
      },
    },
  ];

  return (
    <>
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="subtitle1" fontWeight={700}>
            Employees
          </Typography>
          {showGear && (
            <Tooltip title="Payroll Settings">
              <IconButton size="small" onClick={(e) => setBulkAnchor(e.currentTarget)}>
                <SettingsOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Menu
            anchorEl={bulkAnchor}
            open={Boolean(bulkAnchor)}
            onClose={() => setBulkAnchor(null)}
            slotProps={{ paper: { sx: { borderRadius: 1.5, minWidth: 210 } } }}
          >
            <MenuItem
              onClick={() => { setBulkAnchor(null); openActionForEmployees("earning", selectedEmployeeIds); }}
              sx={{ fontSize: 13 }}
            >
              Add Non-Recurring Earning
            </MenuItem>
            {!allHaveNoNonRecurringEarning && nonRecurringEarningOptions.length > 0 && (
              <MenuItem
                onClick={() => { setBulkAnchor(null); openRemoveNonRecurring("earning", selectedEmployeeIds, nonRecurringEarningOptions); }}
                sx={{ fontSize: 13 }}
              >
                Remove Non-Recurring Earning
              </MenuItem>
            )}
            <MenuItem
              onClick={() => { setBulkAnchor(null); openActionForEmployees("deduction", selectedEmployeeIds); }}
              sx={{ fontSize: 13 }}
            >
              Add Non-Recurring Deduction
            </MenuItem>
            {!allHaveNoNonRecurringDeduction && nonRecurringDeductionOptions.length > 0 && (
              <MenuItem
                onClick={() => { setBulkAnchor(null); openRemoveNonRecurring("deduction", selectedEmployeeIds, nonRecurringDeductionOptions); }}
                sx={{ fontSize: 13 }}
              >
                Remove Non-Recurring Deduction
              </MenuItem>
            )}
            <Divider />
            {allHaveNoLop ? (
              <MenuItem
                onClick={() => { setBulkAnchor(null); openActionForEmployees("add_lop", selectedEmployeeIds); }}
                sx={{ fontSize: 13 }}
              >
                Add LOP
              </MenuItem>
            ) : allHaveLop ? (
              <MenuItem
                onClick={() => { setBulkAnchor(null); openActionForEmployees("remove_lop", selectedEmployeeIds); }}
                sx={{ fontSize: 13 }}
              >
                Remove LOP
              </MenuItem>
            ) : (

              <div>
                <MenuItem
                  onClick={() => { setBulkAnchor(null); openActionForEmployees("add_lop", selectedEmployeeIds); }}
                  sx={{ fontSize: 13 }}
                >
                  Add LOP
                </MenuItem>
                <MenuItem
                  onClick={() => { setBulkAnchor(null); openActionForEmployees("remove_lop", selectedEmployeeIds); }}
                  sx={{ fontSize: 13 }}
                >
                  Remove LOP
                </MenuItem>
              </div>
            )}
            <Divider />
            {selectedEmployees.some((e) => !e.isSkipped) && (
              <MenuItem
                onClick={() => {
                  setBulkAnchor(null);
                  const ids = selectedEmployees
                    .filter((e) => !e.isSkipped)
                    .map((e) => resolveEmployeeId(e))
                    .filter((id): id is number => id !== null);
                  const names = selectedEmployees
                    .filter((e) => !e.isSkipped)
                    .map((e) => e.name);
                  openSkipForEmployees(ids, names);
                }}
                sx={{ fontSize: 13 }}
              >
                Skip Employee
              </MenuItem>
            )}
            {selectedEmployees.some((e) => e.isSkipped) && (
              <MenuItem
                onClick={() => {
                  setBulkAnchor(null);
                  const ids = selectedEmployees
                    .filter((e) => e.isSkipped)
                    .map((e) => resolveEmployeeId(e))
                    .filter((id): id is number => id !== null);
                  openRestoreForEmployees(ids);
                }}
                sx={{ fontSize: 13 }}
              >
                Add Employee to Payrun
              </MenuItem>
            )}
          </Menu>
        </Box>

        <StandardTable
          columns={employeeTableColumns}
          rows={employeeTableRows}
          rowHeight={40}
          nowrapCells
          emptyMessage="No employees found for this payrun."
          isRowSelected={
            isDraft ? (r: any) => r.__empId !== null && selectedIds.has(r.__empId) : undefined
          }
          sx={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: { xs: 420, md: 560 },
            border: "1px solid",
            borderColor: "divider",
          }}
        />
      </Box>

      {payslipEmployee && (
        <PayslipModal
          open={Boolean(payslipEmployee)}
          onClose={() => setPayslipEmployee(null)}
          payrunId={payrunId}
          employeeId={payslipEmployee.employeeId}
          employeeName={payslipEmployee.employeeName}
          employeeDisplayId={payslipEmployee.employeeDisplayId}
          isPayrunPaid={status === "paid"}
          readOnlyIncomeTax={
            status !== "draft" && status !== "created" && status !== "rejected"
          }
        />
      )}

      {tdsSheetEmployee && (
        <TdsSheetModal
          open={Boolean(tdsSheetEmployee)}
          onClose={() => setTdsSheetEmployee(null)}
          payrunId={payrunId}
          employeeId={tdsSheetEmployee.resolvedEmployeeId}
          employeeName={tdsSheetEmployee.employee.name}
          payPeriodLabel={payPeriodLabel}
          onDownload={() => handleDownloadTds(tdsSheetEmployee.employee)}
          isDownloading={isDownloadingTds}
          downloadingEmployeeId={tdsDownloadingEmployeeId}
        />
      )}

      <NonRecurringModal
        open={Boolean(nonRecurringModalKind)}
        onClose={() => setNonRecurringModalKind(null)}
        kind={nonRecurringModalKind ?? "earning"}
        onConfirm={handleConfirmNonRecurring}
        isSubmitting={isSubmitting}
      />

      <RemoveNonRecurringModal
        open={Boolean(removeNonRecurringKind)}
        onClose={() => {
          setRemoveNonRecurringKind(null);
          setRemoveNonRecurringOptions([]);
          setRemoveNonRecurringComponentIds([]);
          setRemoveNonRecurringConfirmOpen(false);
        }}
        kind={removeNonRecurringKind ?? "earning"}
        options={removeNonRecurringOptions}
        onContinue={handleContinueRemoveNonRecurring}
        isSubmitting={isSubmitting}
      />

      <AddLopModal
        open={addLopModalOpen}
        onClose={() => setAddLopModalOpen(false)}
        onConfirm={handleConfirmAddLop}
        isSubmitting={isAddingLop}
      />

      <ConfirmDialog
        open={removeLopConfirmOpen}
        title="Remove LOP"
        message="Remove LOP for the selected employee(s)?"
        confirmText="Remove LOP"
        confirmColor="primary"
        onClose={() => setRemoveLopConfirmOpen(false)}
        onConfirm={handleConfirmRemoveLop}
      />

      <ConfirmDialog
        open={removeNonRecurringConfirmOpen}
        title={
          removeNonRecurringKind === "earning"
            ? "Remove Non-Recurring Earning"
            : "Remove Non-Recurring Deduction"
        }
        message={`Remove selected non-recurring ${
          removeNonRecurringKind === "earning" ? "earning(s)" : "deduction(s)"
        } for the selected ${targetEmployeeIds.length === 1 ? "employee" : `${targetEmployeeIds.length} employees`}?`}
        confirmText="Remove"
        confirmColor="primary"
        onClose={() => setRemoveNonRecurringConfirmOpen(false)}
        onConfirm={handleConfirmRemoveNonRecurring}
      />

      <SkipEmployeeModal
        open={skipModalOpen}
        onClose={() => setSkipModalOpen(false)}
        onConfirm={handleConfirmSkip}
        isSubmitting={isSkippingEmployees}
        employeeNames={targetEmployeeNames}
        payPeriodRange={payPeriodRange}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        title="Add Employee to Payrun"
        message="Add the selected employee(s) back to this payrun?"
        confirmText="Add to Payrun"
        confirmColor="primary"
        onClose={() => setRestoreConfirmOpen(false)}
        onConfirm={handleConfirmRestore}
      />
    </>
  );
}
