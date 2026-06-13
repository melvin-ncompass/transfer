import {
    Box,
    Checkbox,
    Chip,
    IconButton,
    TableCell,
    TableRow,
    Typography,
} from "@mui/material";
import { FilterAltOff, MoreVert, Sync } from "@mui/icons-material";
import {
    forwardRef,
    useImperativeHandle,
    useState,
    useMemo,
    useCallback,
    useEffect,
} from "react";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import CustomCircularProgress from "../../../../../components/atom/circular-progress/CircularProgress";
import { MultiSelectElement } from "../../../../../components/atom/select-field/MultiSelect";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { Snackbar } from "../../../../../components/atom/snackbar";
import type { MenuAtomItem } from "../../../../../components/menuatom/MenuAtom";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import type { StandardTableProps } from "../../../../../types/types";
import {
    useGetMissingAttendanceQuery,
    useRegularizeWithoutRequestMutation,
    type IAttendanceMissingItem,
} from "../api/attendanceTracking.api";
import { ApplyLeaveModal } from "../../../me/attendance/components/ApplyLeaveModal";
import { DateRangePicker } from "../../../../../components/atom/custom-date-range-picker";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { useGetEmployeesQuery } from "../../../org/people/directory/api/directory.api";

export interface AttendanceRecord {
    id: string;
    employeeId: number;
    employeeName: string;
    employeeCode: string;
    department: string;
    designation: string;
    date: string;
    discrepancyTypes: DiscrepancyType[];
}

type DiscrepancyType =
    | "No attendance"
    | "Work hours shortage"
    | "Late arrival"
    | "Missing swipes";

export interface AttendanceTrackingRef {
    search: (query: string) => void;
    openRegularise: () => void;
    getTotalCount: () => number;
    getSelectedCount: () => number;
}

function transformToFlatRows(apiData: IAttendanceMissingItem[]): AttendanceRecord[] {
    const rows: AttendanceRecord[] = [];

    for (const item of apiData) {
        for (const [date, detail] of Object.entries(item.missingDates)) {
            const discrepancyTypes: DiscrepancyType[] = [];
            if (detail.noAttendance) discrepancyTypes.push("No attendance");
            if (detail.workHoursShortage) discrepancyTypes.push("Work hours shortage");
            if (detail.lateLogin) discrepancyTypes.push("Late arrival");
            if (detail.missingSwipes) discrepancyTypes.push("Missing swipes");

            rows.push({
                id: `${item.employeeId}_${date}`,
                employeeId: item.employeeId,
                employeeName: item.employee.includes(" - ")
                    ? item.employee.split(" - ").slice(1).join(" - ").trim()
                    : item.employee,
                employeeCode: String(item.employeeId),
                department: item.department ?? "—",
                designation: item.designation ?? "—",
                date,
                discrepancyTypes,
            });
        }
    }

    return rows.sort(
        (a, b) => b.date.localeCompare(a.date) || a.employeeName.localeCompare(b.employeeName),
    );
}

function buildDepartmentOptions(rows: AttendanceRecord[]) {
    const depts = [...new Set(rows.map((r) => r.department).filter((d) => d !== "—"))];
    return [
        { label: "All", value: "__all__" },
        ...depts.map((d) => ({ label: d, value: d })),
    ];
}

const DISCREPANCY_OPTIONS = [
    { label: "All", value: "__all__" },
    { label: "No attendance", value: "No attendance" },
    { label: "Work hours shortage", value: "Work hours shortage" },
    { label: "Late arrival", value: "Late arrival" },
    { label: "Missing swipes", value: "Missing swipes" },
];

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

function getDiscrepancyChipColor(
    type: DiscrepancyType,
): "error" | "warning" | "info" | "default" {
    switch (type) {
        case "No attendance":
            return "error";
        case "Work hours shortage":
            return "warning";
        case "Late arrival":
            return "warning";
        case "Missing swipes":
            return "info";
        default:
            return "default";
    }
}

function buildColumns(
    allSelected: boolean,
    someSelected: boolean,
    onSelectAll: (checked: boolean) => void,
): StandardTableProps["columns"] {
    return [
        {
            id: "checkbox",
            label: "",
            width: "20px",
            headerRender: () => (
                <Checkbox
                    size="small"
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    sx={{ p: 0, pl: 0.8 }}
                />
            ),
        },
        { id: "employeeName", label: "Employee", width: "25%" },
        { id: "department", label: "Department", width: "18%" },
        { id: "date", label: "Date", width: "16%", minWidth: 150 },
        { id: "discrepancyType", label: "Discrepancy type", width: "30%" },
        { id: "actions", label: "Actions", width: "5%", headerAlign: "right" },
    ];
}

interface AttendanceTrackingDetailsProps {
    startDate: Dayjs;
    endDate: Dayjs;
    onDateRangeChange: (start: Dayjs, end: Dayjs) => void;
    onCountChange?: () => void;
}

export const AttendanceTrackingDetails = forwardRef<
    AttendanceTrackingRef,
    AttendanceTrackingDetailsProps
>(({ startDate, endDate, onDateRangeChange, onCountChange }, ref) => {
    const { data, isLoading, isError, refetch } = useGetMissingAttendanceQuery({
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
    });
    const { data: employeesData } = useGetEmployeesQuery();

    const allRows = useMemo(
        () => transformToFlatRows(data?.data ?? []),
        [data],
    );

    // ── Filter state ───────────────────────────────────────────────────────
    const [employeeValues, setEmployeeValues] = useState<string[]>([]);
    const [departmentValues, setDepartmentValues] = useState<string[]>([]);
    const [discrepancyValues, setDiscrepancyValues] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Derive filter option lists from live data
    const employeeOptions = useMemo(() => {
        const employees = employeesData?.data ?? [];

        return [
            { label: "All", value: "__all__" },
            ...employees.map((emp) => {
                const contact = emp.contact;

                const employeeName =
                    contact?.name ||
                    [
                        contact?.firstName,
                        contact?.middleName,
                        contact?.lastName,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .trim() ||
                    emp.employeeId;

                return {
                    label: employeeName,
                    value: String(emp.id),
                };
            }),
        ];
    }, [employeesData]);
    const departmentOptions = useMemo(() => buildDepartmentOptions(allRows), [allRows]);
    // ── Selection state ────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // ── Modal state ────────────────────────────────────────────────────────
    const [leaveModal, setLeaveModal] = useState<{
        open: boolean;
        record: AttendanceRecord | null;
    }>({ open: false, record: null });

    // ── Snackbar ───────────────────────────────────────────────────────────
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        color: "success" | "error" | "info" | "warning";
    }>({ open: false, message: "", color: "info" });

    const showSnackbar = useCallback(
        (message: string, color: "success" | "error" | "info" | "warning" = "success") =>
            setSnackbar({ open: true, message, color }),
        [],
    );

    const [regularizeWithoutRequest, { isLoading: isBulkRegularizing }] = useRegularizeWithoutRequestMutation();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const [directRegulariseTarget, setDirectRegulariseTarget] = useState<AttendanceRecord | null>(null);
    const [isDirectRegularizing, setIsDirectRegularizing] = useState(false);

    const handleDirectRegularise = useCallback(async (record: AttendanceRecord) => {
        setIsDirectRegularizing(true);
        try {
            const res = await regularizeWithoutRequest({
                regularizeItems: [{ employeeId: record.employeeId, dates: [record.date] }],
            }).unwrap();
            showSnackbar(res.message ?? "Attendance regularized successfully", "success");
        } catch (err: any) {
            showSnackbar(err?.data?.message ?? "Failed to regularize attendance", "error");
        } finally {
            setIsDirectRegularizing(false);
            setDirectRegulariseTarget(null);
        }
    }, [regularizeWithoutRequest, showSnackbar]);

    const filteredRecords = useMemo(() => {
        return allRows.filter((r) => {
            const empOk = employeeValues.length === 0 || employeeValues.includes(r.employeeCode);
            const deptOk = departmentValues.length === 0 || departmentValues.includes(r.department);
            const discOk =
                discrepancyValues.length === 0 ||
                r.discrepancyTypes.some((dt) => discrepancyValues.includes(dt));
            const searchOk =
                !searchQuery ||
                r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());
            return empOk && deptOk && discOk && searchOk;
        });
    }, [allRows, employeeValues, departmentValues, discrepancyValues, searchQuery]);

    const allSelected =
        filteredRecords.length > 0 && filteredRecords.every((r) => selectedIds.has(r.id));
    const someSelected = filteredRecords.some((r) => selectedIds.has(r.id)) && !allSelected;
    const activeSelectionCount = filteredRecords.filter((r) => selectedIds.has(r.id)).length;

    useEffect(() => {
        onCountChange?.();
    }, [filteredRecords.length, activeSelectionCount, onCountChange]);

    const handleBulkRegularise = useCallback(() => {
        const count = filteredRecords.filter((r) => selectedIds.has(r.id)).length;
        if (count === 0) return;
        setConfirmOpen(true);
    }, [filteredRecords, selectedIds]);

    const handleConfirmBulkRegularise = useCallback(async () => {
        const grouped = new Map<number, string[]>();
        for (const r of filteredRecords) {
            if (!selectedIds.has(r.id)) continue;
            if (!grouped.has(r.employeeId)) grouped.set(r.employeeId, []);
            grouped.get(r.employeeId)!.push(r.date);
        }

        const regularizeItems = Array.from(grouped.entries()).map(([employeeId, dates]) => ({
            employeeId,
            dates,
        }));

        try {
            const res = await regularizeWithoutRequest({ regularizeItems }).unwrap();
            showSnackbar(res.message ?? "Attendance regularized successfully", "success");
            setSelectedIds(new Set());
        } catch (err: any) {
            showSnackbar(err?.data?.message ?? "Failed to regularize attendance", "error");
        } finally {
            setConfirmOpen(false);
        }
    }, [filteredRecords, selectedIds, regularizeWithoutRequest, showSnackbar]);

    useImperativeHandle(
        ref,
        () => ({
            search: (query: string) => setSearchQuery(query),
            openRegularise: () => handleBulkRegularise(),
            getTotalCount: () => filteredRecords.length,
            getSelectedCount: () => activeSelectionCount,
        }),
        [filteredRecords, activeSelectionCount, handleBulkRegularise],
    );

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            filteredRecords.forEach((r) => (checked ? next.add(r.id) : next.delete(r.id)));
            return next;
        });
        onCountChange?.();
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            checked ? next.add(id) : next.delete(id);
            return next;
        });
        onCountChange?.();
    };

    const handleRowAction = (action: string, record: AttendanceRecord) => {
        if (action === "regulariseDirect") {
            setDirectRegulariseTarget(record);
        } else if (action === "requestLeave") {
            setLeaveModal({ open: true, record });
        }
    };

    const columns = buildColumns(allSelected, someSelected, handleSelectAll);

    return (
        <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {isLoading ? (
                    <Box
                        sx={{
                            display: "flex",
                            width: "100%",
                            minHeight: "calc(100vh - 350px)",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <CustomCircularProgress size={32} />
                    </Box>
                ) : isError ? (
                    <Box sx={{ py: 6, textAlign: "center" }}>
                        <Typography variant="body2" color="error">
                            Failed to load attendance data. Please try again.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* ── Filters row (sticky at top) ── */}
                        <Box
                            sx={{
                                display: "flex",
                                gap: 1.5,
                                flexWrap: "wrap",
                                alignItems: "flex-end",
                                mb: 1.5,
                                px: 1.5,
                                py: 1,
                                backgroundColor: "background.paper",
                                borderBottom: "1px solid",
                                borderColor: "divider",
                                flexShrink: 0,
                            }}
                        >
                            <MultiSelectElement
                                label="Employee"
                                options={employeeOptions}
                                value={employeeValues}
                                onChange={(vals) => {
                                    if (vals.includes("__all__")) setEmployeeValues([]);
                                    else setEmployeeValues(vals);
                                }}
                                width="200px"
                                menuWidth="200px"
                                placeholder="All"
                            />
                            <MultiSelectElement
                                label="Department"
                                options={departmentOptions}
                                value={departmentValues}
                                onChange={(vals) => {
                                    if (vals.includes("__all__")) setDepartmentValues([]);
                                    else setDepartmentValues(vals);
                                }}
                                width="200px"
                                placeholder="All"
                            />

                            <DateRangePicker
                                label="Date Range"
                                startValue={startDate}
                                endValue={endDate}
                                onChange={([start, end]) => {
                                    if (start && end) onDateRangeChange(start, end);
                                }}
                                months={2}
                                width="260px"
                                max={dayjs()}
                            />

                            <MultiSelectElement
                                label="Discrepancy type"
                                options={DISCREPANCY_OPTIONS}
                                value={discrepancyValues}
                                onChange={(vals) => {
                                    if (vals.includes("__all__")) setDiscrepancyValues([]);
                                    else setDiscrepancyValues(vals);
                                }}
                                width="220px"
                                placeholder="All"
                            />
                            <PrimaryIconButton
                                disabled={(
                                    employeeValues.length === 0 &&
                                    departmentValues.length === 0 &&
                                    discrepancyValues.length === 0
                                )}
                                title="Reset filters"
                                icon={<FilterAltOff fontSize="small" />}
                                variant="outlined"
                                onClick={() => {
                                    setEmployeeValues([]);
                                    setDepartmentValues([]);
                                    setDiscrepancyValues([]);
                                }}
                            />

                            {activeSelectionCount > 1 && (
                                <>
                                    <Box
                                        sx={{
                                            px: 2,
                                            py: 0.75,
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: 1,
                                            typography: "body2",
                                            fontWeight: 500,
                                            whiteSpace: "nowrap",
                                            ml: "auto",
                                        }}
                                    >
                                        {activeSelectionCount}
                                    </Box>
                                    <PrimaryIconButton
                                        title="Bulk Regularize"
                                        icon={<Sync />}
                                        onClick={handleBulkRegularise}
                                    />
                                </>
                            )}
                        </Box>

                        {/* ── Table wrapper (scrollable) ── */}
                        <Box
                            sx={{
                                flex: 1,
                                overflowY: "auto",
                                overflowX: "hidden",
                                minHeight: 0,
                            }}
                        >
                            <Box sx={{ px: 1.5 }}>
                                <StandardTable
                                    columns={columns}
                                    rows={filteredRecords}
                                    loading={isLoading}
                                    emptyMessage="No attendance records found"
                                    sticky
                                    stickyTop={-8}
                                    rowHeight={40}
                                    isRowSelected={(row) => selectedIds.has((row as AttendanceRecord).id)}
                                    renderCustomRow={(rawRow, _rowIndex, { rowRef, highlightBackground }) => {
                                        const record = rawRow as AttendanceRecord;
                                        return (
                                            <AttendanceRow
                                                key={record.id}
                                                record={record}
                                                selected={selectedIds.has(record.id)}
                                                highlightBackground={highlightBackground}
                                                rowRef={rowRef}
                                                onSelect={(checked) => handleSelectRow(record.id, checked)}
                                                onAction={(action) => handleRowAction(action, record)}
                                            />
                                        );
                                    }}
                                />
                            </Box>
                        </Box>
                    </>
                )}

                {/* ── Apply Leave Modal ── */}
                <ApplyLeaveModal
                    title="Grant Leave"
                    open={leaveModal.open}
                    onClose={() => setLeaveModal({ open: false, record: null })}
                    initialLeaveDateIso={leaveModal.record?.date ?? null}
                    employeeId={leaveModal.record?.employeeId ?? null}
                    showSnackbar={showSnackbar}
                    onApplySuccess={(message) => {
                        refetch();
                        showSnackbar(message, "success");
                        setLeaveModal({ open: false, record: null });
                    }}
                />

                {snackbar.open && (
                    <Snackbar
                        message={snackbar.message}
                        color={snackbar.color}
                        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                        autoClose={6000}
                    />
                )}
                <ModalElement
                    open={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    title="Bulk Regularise"
                    maxWidth="xs"
                    onClick={handleConfirmBulkRegularise}
                    disabled={isBulkRegularizing}
                >
                    <Typography variant="body2">
                        Regularise attendance for{" "}
                        <strong>{filteredRecords.filter((r) => selectedIds.has(r.id)).length}</strong>{" "}
                        selected record(s) without a request? This cannot be undone.
                    </Typography>
                </ModalElement>

                <ModalElement
                    open={Boolean(directRegulariseTarget)}
                    onClose={() => setDirectRegulariseTarget(null)}
                    title="Regularise Attendance"
                    maxWidth="xs"
                    onClick={() => directRegulariseTarget && handleDirectRegularise(directRegulariseTarget)}
                    disabled={isDirectRegularizing}
                >
                    <Typography variant="body2">
                        Regularise attendance for{" "}
                        <strong>{directRegulariseTarget?.employeeName}</strong> on{" "}
                        <strong>
                            {directRegulariseTarget ? formatDate(directRegulariseTarget.date) : ""}
                        </strong>{" "}
                        without a request? This cannot be undone.
                    </Typography>
                </ModalElement>
            </Box>
    );
});

function AttendanceRow({
    record,
    selected,
    highlightBackground,
    rowRef,
    onSelect,
    onAction,
}: {
    record: AttendanceRecord;
    selected: boolean;
    highlightBackground: string;
    rowRef: (el: HTMLTableRowElement | null) => void;
    onSelect: (checked: boolean) => void;
    onAction: (action: string) => void;
}) {
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

    const menuItems: MenuAtomItem[] = [
        {
            label: "Regularise",
            onClick: () => {
                onAction("regulariseDirect");
                setMenuAnchor(null);
            },
        },
        {
            label: "Grant Leave",
            onClick: () => {
                onAction("requestLeave");
                setMenuAnchor(null);
            },
        },
    ];

    return (
        <TableRow
            ref={rowRef}
            hover
            selected={selected}
            sx={{
                backgroundColor: highlightBackground,
                transition: "background-color 0.3s ease-in-out",
                height: 40,
                "& .MuiTableCell-root": { py: 0.5 },
            }}
        >
            <TableCell padding="checkbox" sx={{ pl: 1.5 }}>
                <Checkbox
                    size="small"
                    checked={selected}
                    onChange={(e) => onSelect(e.target.checked)}
                />
            </TableCell>

            <TableCell>
                <Typography variant="body2" fontWeight={500} lineHeight={1.3}>
                    {record.employeeName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {record.designation !== "—" ? record.designation : record.employeeCode}
                </Typography>
            </TableCell>

            <TableCell>
                <Typography variant="body2">{record.department}</Typography>
            </TableCell>

            <TableCell>
                <Typography variant="body2">{formatDate(record.date)}</Typography>
            </TableCell>

            <TableCell>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {record.discrepancyTypes.length > 0 ? (
                        record.discrepancyTypes.map((type) => (
                            <Chip
                                key={type}
                                label={type}
                                size="small"
                                color={getDiscrepancyChipColor(type)}
                            />
                        ))
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            —
                        </Typography>
                    )}
                </Box>
            </TableCell>

            <TableCell align="right">
                <Box
                    component="span"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    sx={{ display: "inline-flex" }}
                >
                    <IconButton
                        size="small"
                        onClick={(e) => setMenuAnchor(e.currentTarget)}
                        aria-label="Row actions"
                    >
                        <MoreVert fontSize="small" />
                    </IconButton>
                    <MenuAtom
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        items={menuItems}
                        onCloseAll={() => setMenuAnchor(null)}
                    />
                </Box>
            </TableCell>
        </TableRow>
    );
}