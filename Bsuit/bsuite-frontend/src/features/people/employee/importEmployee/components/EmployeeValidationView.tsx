import { useState, useEffect, useMemo } from "react";
import {
    Box,
    Divider,
    IconButton,
    Typography,
    Chip,
    Button,
    Alert,
    Stack,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Drawer,
    Badge,
    MenuItem,
} from "@mui/material";
import { ToggleSwitch } from "../../../../../components/atom/toggle-switch/ToggleSwitch";
import {
    CheckCircle,
    Error as ErrorIcon,
    Search,
    Edit as EditIcon,
    Close as CloseIcon,
    ArrowBack,
    Warning as WarningIcon,
    Add as AddIcon,
} from "@mui/icons-material";
import { PrimaryButton } from "../../../../../components/atom/button";
import { type ImportedEmployeeItem, useValidateEmployeesMutation } from "../api/employeeImport.api";
import { validateEmployeeItem, validateEmployeeList } from "../api/employeeImportValidation";
import dayjs from "dayjs";
import { DatePickerElement } from "../../../../../components/atom/date-picker/DatePicker";
import { formatDateShort } from "../../../../../utils/numberFormatter";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { useSnackbar } from "../../../../../context/SnackbarContext";

import { useGetExpensePoliciesQuery } from "../../../org/expense/policy/api/expensePolicy.api";
import { useGetAllDepartmentsQuery, useCreateDepartmentMutation } from "../../../org/people/department/api/department.api";
import { useGetAllDesignationsQuery, useCreateDesignationMutation } from "../../../org/people/designation/api/designation.api";
import { useGetIncomeTaxesQuery } from "../../../salary/payrun/settings/IncomeTax/api/incometax.api";
import { useGetAllSalaryTemplatesQuery } from "../../../salary/structure/SalaryTemplate/api/salaryTemplate.api";
import { useGetHolidayPlansQuery } from "../../../time/holiday-plan/api/holidayPlan.api";
import { useGetLeavePlansQuery } from "../../../time/leaves/api/leavePlan.api";
import { useGetShiftsQuery } from "../../../time/shifts/api/shifts.api";
import { useGetAllWeekOffsQuery } from "../../../time/weekoffs/api/weekoffs.api";

// ─── Static option lists ──────────────────────────────────────────────────
const EMPLOYEE_TYPE_OPTIONS = [
    { label: "Permanent", value: "permanent" },
    { label: "Intern", value: "intern" },
];

const GENDER_OPTIONS = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Others", value: "others" },
];

/** PAN format: 5 letters + 4 digits + 1 letter (e.g. AAAAA1234A) */
const PAN_MAX_LEN = 10;

function formatPANNumber(input: string): string {
    const raw = input.replace(/[^a-zA-Z0-9]/g, "").slice(0, PAN_MAX_LEN);
    const part1 = raw
        .slice(0, 5)
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 5);
    const part2 = raw
        .slice(5, 9)
        .replace(/[^0-9]/g, "")
        .slice(0, 4);
    const part3 = raw
        .slice(9, 10)
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 1);
    return (part1 + part2 + part3).toUpperCase();
}

interface TemplateValidationError {
    employeeId: string;
    workEmail: string;
    contactName: string;
    fields: Record<string, string[]>;
}

interface Props {
    uploadedData: ImportedEmployeeItem[];
    initialErrors: any[];
    onConfirm: (employees: ImportedEmployeeItem[]) => void;
    onBack: () => void;
    editedRows?: ImportedEmployeeItem[];
    onRowsChange?: (rows: ImportedEmployeeItem[]) => void;
    cachedErrors?: TemplateValidationError[];
    onErrorsChange?: (errors: TemplateValidationError[]) => void;
    cachedValidated?: boolean;
    onValidatedChange?: (v: boolean) => void;
}

function fieldHasError(te: TemplateValidationError | undefined, field: string): boolean {
    if (!te) return false;
    return Object.keys(te.fields).some(
        (k) => k.toLowerCase() === field.toLowerCase() && te.fields[k]?.length > 0,
    );
}

function getTabErrors(te: TemplateValidationError | undefined, tabIndex: number): string[] {
    if (!te) return [];
    const fieldsWithErrors = Object.keys(te.fields).filter(k => te.fields[k]?.length > 0);
    
    if (tabIndex === 0) {
        // Personal Tab
        const personalFields = ["contactName", "dateofbirth", "gender", "mobilenumber", "pannumber"];
        return fieldsWithErrors.filter(f => personalFields.includes(f.toLowerCase()));
    }
    if (tabIndex === 1) {
        // Job Tab
        const jobFields = [
            "employeeid", "workemail", "dateofjoining", "employeetype", 
            "department", "designation", "expensepolicy", "reportingtoemployeeid"
        ];
        return fieldsWithErrors.filter(f => jobFields.includes(f.toLowerCase()));
    }
    if (tabIndex === 2) {
        // Payroll Tab
        return fieldsWithErrors.filter(f => f.toLowerCase().startsWith("payroll.") || f.toLowerCase() === "payroll");
    }
    if (tabIndex === 3) {
        // Attendance Tab
        return fieldsWithErrors.filter(f => f.toLowerCase().startsWith("attendance.") || f.toLowerCase() === "attendance");
    }
    return [];
}

export const EmployeeValidationView = ({
    uploadedData,
    initialErrors,
    onConfirm,
    onBack,
    editedRows,
    onRowsChange,
    cachedErrors,
    onErrorsChange,
    cachedValidated,
    onValidatedChange,
}: Props) => {
    const [rows, setRowsLocal] = useState<ImportedEmployeeItem[]>(editedRows ?? []);
    const [templateErrors, setTemplateErrorsLocal] = useState<TemplateValidationError[]>(cachedErrors ?? []);
    const [hasEdits, setHasEdits] = useState(false);
    const [validated, setValidatedLocal] = useState<boolean>(cachedValidated ?? false);
    const [validateEmployees, { isLoading: isValidating }] = useValidateEmployeesMutation();

    const { showSnackbar } = useSnackbar();
    const [createDepartment] = useCreateDepartmentMutation();
    const [createDesignation] = useCreateDesignationMutation();

    const [openAddDepartmentModal, setOpenAddDepartmentModal] = useState(false);
    const [newDepartmentName, setNewDepartmentName] = useState("");

    const [openAddDesignationModal, setOpenAddDesignationModal] = useState(false);
    const [newDesignationName, setNewDesignationName] = useState("");

    const [openInfoModal, setOpenInfoModal] = useState(false);
    const [infoModalTitle, setInfoModalTitle] = useState("");
    const [infoModalMessage, setInfoModalMessage] = useState("");

    const handleOpenInfoModal = (title: string, message: string) => {
        setInfoModalTitle(title);
        setInfoModalMessage(message);
        setOpenInfoModal(true);
    };

    const handleSaveNewDepartment = async () => {
        if (!newDepartmentName.trim()) return;
        try {
            await createDepartment({ departmentName: newDepartmentName.trim() }).unwrap();
            setOpenAddDepartmentModal(false);
            if (selectedEmployeeIndex !== null) {
                updateRow(selectedEmployeeIndex, { department: newDepartmentName.trim() });
            }
            setNewDepartmentName("");
            showSnackbar("Department added successfully", "success");
        } catch (err: any) {
            showSnackbar(err?.data?.message ?? "Failed to add department", "error");
        }
    };

    const handleSaveNewDesignation = async () => {
        if (!newDesignationName.trim()) return;
        try {
            await createDesignation({ designationName: newDesignationName.trim() }).unwrap();
            setOpenAddDesignationModal(false);
            if (selectedEmployeeIndex !== null) {
                updateRow(selectedEmployeeIndex, { designation: newDesignationName.trim() });
            }
            setNewDesignationName("");
            showSnackbar("Designation added successfully", "success");
        } catch (err: any) {
            showSnackbar(err?.data?.message ?? "Failed to add designation", "error");
        }
    };

    // Filter, Search and Pagination local state
    const [filterTab, setFilterTab] = useState<"all" | "errors" | "valid">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Slide drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedEmployeeIndex, setSelectedEmployeeIndex] = useState<number | null>(null);
    const [activeDrawerTab, setActiveDrawerTab] = useState(0);

    // Sync wrappers
    const setRows = (updater: ImportedEmployeeItem[] | ((prev: ImportedEmployeeItem[]) => ImportedEmployeeItem[])) => {
        setRowsLocal((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            onRowsChange?.(next);
            return next;
        });
    };

    const setTemplateErrors = (
        updater: TemplateValidationError[] | ((prev: TemplateValidationError[]) => TemplateValidationError[]),
    ) => {
        setTemplateErrorsLocal((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            onErrorsChange?.(next);
            return next;
        });
    };

    const setValidated = (v: boolean) => {
        setValidatedLocal(v);
        onValidatedChange?.(v);
    };

    // ── API config data ──────────────────────────────────────────────────────
    const { data: departmentResponse } = useGetAllDepartmentsQuery();
    const { data: designationResponse } = useGetAllDesignationsQuery();
    const { data: salaryTemplatesResponse } = useGetAllSalaryTemplatesQuery();
    const { data: shifts = [] } = useGetShiftsQuery();
    const { data: weekOffsResponse } = useGetAllWeekOffsQuery();
    const { data: leavePlans = [] } = useGetLeavePlansQuery();
    const { data: holidayPlans = [] } = useGetHolidayPlansQuery();
    const { data: expensePolicies = [] } = useGetExpensePoliciesQuery();
    const { data: incomeTaxVersions = [] } = useGetIncomeTaxesQuery();

    const departmentOptions = useMemo(() => (departmentResponse?.data ?? []).map((d: any) => d.departmentName), [departmentResponse]);
    const designationOptions = useMemo(() => (designationResponse?.data ?? []).map((d: any) => d.designationName), [designationResponse]);
    const salaryTemplateOptions = useMemo(() => (salaryTemplatesResponse?.data ?? []).map((t: any) => t.templateName), [salaryTemplatesResponse]);
    const shiftOptions = useMemo(() => shifts.map((s: any) => s.shiftName), [shifts]);
    const weekOffOptions = useMemo(() => (weekOffsResponse?.data ?? []).map((w: any) => w.weekOffName), [weekOffsResponse]);
    const leavePlanOptions = useMemo(() => leavePlans.map((l: any) => l.name), [leavePlans]);
    const holidayPlanOptions = useMemo(() => holidayPlans.map((h: any) => h.planName), [holidayPlans]);
    const expensePolicyOptions = useMemo(() => expensePolicies.map((p: any) => p.policyName), [expensePolicies]);

    const incomeTaxConfigOptions = useMemo(() => {
        const byConfigId = new Map<number, string>();
        incomeTaxVersions.forEach((v: any) => {
            if (v.config?.id != null && !byConfigId.has(v.config.id)) {
                byConfigId.set(v.config.id, v.config.configName ?? `Config ${v.config.id}`);
            }
        });
        return Array.from(byConfigId.entries()).map(([, name]) => ({ label: name, value: name }));
    }, [incomeTaxVersions]);

    // Initial mount data sync
    useEffect(() => {
        if (!uploadedData?.length) return;
        if (editedRows?.length) return;

        setRows(uploadedData.map((r) => JSON.parse(JSON.stringify(r))));

        if (cachedErrors !== undefined) return;

        // If errors are passed initially (from server/client checks in upload view)
        if (initialErrors?.length > 0) {
            const errorMap: Record<string, TemplateValidationError> = {};
            initialErrors.forEach((error) => {
                if (!errorMap[error.employeeId]) {
                    errorMap[error.employeeId] = {
                        employeeId: error.employeeId,
                        workEmail: error.workEmail,
                        contactName: error.contactName,
                        fields: error.fields || {},
                    };
                }
            });
            setTemplateErrors(Object.values(errorMap));
            setValidated(false);
        } else {
            setTemplateErrors([]);
            setValidated(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset page to 0 on filter change
    useEffect(() => {
        setPage(0);
    }, [filterTab, searchQuery]);

    // ── Field update helpers ──────────────────────────────────────────────────
const updateRow = (index: number, patch: Partial<ImportedEmployeeItem>) => {
    setRows((prev) => {
        const next = [...prev];
        const updated = { ...next[index], ...patch };
        next[index] = updated;

        // Only re-validate the fields that were actually changed
        const changedFields = Object.keys(patch);
        const freshErrors = validateEmployeeItem(updated);

        setTemplateErrors((prevErrors: TemplateValidationError[]) => {
            const existing = prevErrors.find((e) => e.employeeId === updated.employeeId);
            const baseFields: Record<string, string[]> = existing ? { ...existing.fields } : {};

            // For each changed field, update only that field's errors
            changedFields.forEach((field) => {
                if (freshErrors[field]) {
                    baseFields[field] = freshErrors[field];
                } else {
                    delete baseFields[field];
                }
            });

            const filtered = prevErrors.filter((e) => e.employeeId !== updated.employeeId);
            if (Object.keys(baseFields).length > 0) {
                filtered.push({
                    employeeId: updated.employeeId || "",
                    workEmail: updated.workEmail || "",
                    contactName: updated.contactName || "",
                    fields: baseFields,
                });
            }
            return filtered;
        });

        return next;
    });
    setHasEdits(true);
    setValidated(false);
};

    const updatePayrollField = (index: number, patch: Partial<NonNullable<ImportedEmployeeItem["payroll"]>>) => {
        const currentPayroll = rows[index].payroll || {
            template: "",
            incomeTaxConfig: "",
            annualGross: 0,
            isPfEnabled: false,
            pfNumber: null,
            uanNumber: null,
            probationEndDate: null,
        };
        updateRow(index, {
            payroll: { ...currentPayroll, ...patch }
        });
    };

    const updateAttendanceField = (index: number, patch: Partial<NonNullable<ImportedEmployeeItem["attendance"]>>) => {
        const currentAttendance = rows[index].attendance || {
            shift: "",
            weekoff: "",
            leavePlan: "",
            holidayPlan: "",
        };
        updateRow(index, {
            attendance: { ...currentAttendance, ...patch }
        });
    };

    // ── Re-validate ──────────────────────────────────────────────────────────
    const handleValidate = async () => {
        // 1. Run client-side validation first
        const clientErrors = validateEmployeeList(rows);

        // 2. Call backend validation
        let apiErrors: TemplateValidationError[] = [];
        try {
            const response = await validateEmployees({ employees: rows }).unwrap();
            if (response?.data?.errors?.length > 0) {
                apiErrors = response.data.errors.map((e: any) => ({
                    employeeId: e.employeeId,
                    workEmail: e.workEmail,
                    contactName: e.contactName,
                    fields: e.fields ?? {},
                }));
            }
        } catch (err: any) {
            if (err?.data?.errors) {
                apiErrors = err.data.errors.map((e: any) => ({
                    employeeId: e.employeeId,
                    workEmail: e.workEmail,
                    contactName: e.contactName,
                    fields: e.fields ?? {},
                }));
            }
        }

        // 3. Merge clientErrors and apiErrors
        const mergedMap = new Map<string, TemplateValidationError>();
        clientErrors.forEach(err => {
            mergedMap.set(err.employeeId, { ...err, fields: { ...err.fields } });
        });

        apiErrors.forEach(err => {
            const existing = mergedMap.get(err.employeeId);
            if (existing) {
                Object.entries(err.fields || {}).forEach(([field, msgs]) => {
                    const existingMsgs = existing.fields[field] || [];
                    const uniqueMsgs = Array.from(new Set([...existingMsgs, ...(msgs as string[])]));
                    existing.fields[field] = uniqueMsgs;
                });
            } else {
                mergedMap.set(err.employeeId, { ...err, fields: { ...err.fields } });
            }
        });

        const merged = Array.from(mergedMap.values());
        setTemplateErrors(merged);
        setValidated(true);
        setHasEdits(false);

        if (merged.length > 0) {
            setValidated(false);
        }
    };

    // ── Derived state for summary & filtering ───────────────────────────────
    const errorRowsCount = templateErrors.length;
    const validRowsCount = rows.length - errorRowsCount;

    const filteredRows = useMemo(() => {
        return rows.filter((emp) => {
            const te = templateErrors.find((e) => e.employeeId === emp.employeeId);
            const hasErrors = Boolean(te);

            if (filterTab === "errors" && !hasErrors) return false;
            if (filterTab === "valid" && hasErrors) return false;

            if (searchQuery.trim() !== "") {
                const q = searchQuery.toLowerCase();
                const name = String(emp.contactName || "").toLowerCase();
                const id = String(emp.employeeId || "").toLowerCase();
                const email = String(emp.workEmail || "").toLowerCase();
                const dept = String(emp.department || "").toLowerCase();
                return name.includes(q) || id.includes(q) || email.includes(q) || dept.includes(q);
            }

            return true;
        });
    }, [rows, templateErrors, filterTab, searchQuery]);

    const paginatedRows = useMemo(() => {
        return filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredRows, page, rowsPerPage]);

    const allValid = errorRowsCount === 0 && validated;

    const handleEditRow = (emp: ImportedEmployeeItem) => {
        const idx = rows.findIndex((r) => r.employeeId === emp.employeeId);
        if (idx !== -1) {
            setSelectedEmployeeIndex(idx);
            setDrawerOpen(true);
            setActiveDrawerTab(0);
        }
    };

    const currentEditingEmployee = selectedEmployeeIndex !== null ? rows[selectedEmployeeIndex] : null;
    const editingTe = currentEditingEmployee ? templateErrors.find(e => e.employeeId === currentEditingEmployee.employeeId) : undefined;

    const renderFieldError = (field: string) => {
        if (!editingTe) return null;
        // Search matching key case-insensitively
        const key = Object.keys(editingTe.fields).find(k => k.toLowerCase() === field.toLowerCase());
        if (!key) return null;
        const messages = editingTe.fields[key];
        if (!messages || messages.length === 0) return null;

        return (
            <Typography variant="caption" color="error.main" display="block" sx={{ mt: 0.5, fontWeight: 600 }}>
                {messages.join(", ")}
            </Typography>
        );
    };

    const getFieldErrorString = (field: string): string | undefined => {
        if (!editingTe) return undefined;
        const key = Object.keys(editingTe.fields).find(k => k.toLowerCase() === field.toLowerCase());
        if (!key) return undefined;
        const messages = editingTe.fields[key];
        if (!messages || messages.length === 0) return undefined;
        return messages.join(", ");
    };

    const pulseErrorSx = (field: string): any => {
        const hasError = fieldHasError(editingTe, field);
        if (!hasError) return undefined;
        return {
            "& .MuiOutlinedInput-root": {
                animation: "pulse-error 2.5s infinite",
                "@keyframes pulse-error": {
                    "0%": { boxShadow: "0 0 0 0 rgba(244, 63, 94, 0.45)" },
                    "70%": { boxShadow: "0 0 0 6px rgba(244, 63, 94, 0)" },
                    "100%": { boxShadow: "0 0 0 0 rgba(244, 63, 94, 0)" },
                }
            }
        };
    };

    return (
        <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header / Action Bar */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography variant="h6" fontWeight={700}>Review Employee Data</Typography>
                    <Chip label={`${rows.length} total`} size="small" variant="outlined" />
                    {errorRowsCount > 0 && (
                        <Chip
                            icon={<ErrorIcon fontSize="small" />}
                            label={`${errorRowsCount} with errors`}
                            size="small"
                            color="error"
                            variant="filled"
                            sx={{ fontWeight: 600 }}
                        />
                    )}
                    {allValid && (
                        <Chip
                            icon={<CheckCircle fontSize="small" />}
                            label="All records valid"
                            size="small"
                            color="success"
                            variant="filled"
                            sx={{ fontWeight: 600 }}
                        />
                    )}
                </Stack>

                <Stack direction="row" spacing={1.5}>
                    <Button variant="outlined" startIcon={<ArrowBack fontSize="small" />} onClick={onBack} sx={{ borderRadius: 2 }}>
                        Back
                    </Button>
                    <PrimaryButton onClick={handleValidate} variant="outlined" sx={{ borderRadius: 2 }} disabled={isValidating}>
                        {isValidating ? "Validating..." : "Re-validate"}
                    </PrimaryButton>
                    <PrimaryButton onClick={() => onConfirm(rows)} disabled={!allValid} sx={{ borderRadius: 2 }}>
                        Continue to Confirm
                    </PrimaryButton>
                </Stack>
            </Stack>

            {hasEdits && (
                <Alert severity="warning" icon={<WarningIcon />} sx={{ borderRadius: 2 }}>
                    You have made changes to the data. Please click <strong>Re-validate</strong> to verify they are correct before continuing.
                </Alert>
            )}

            {/* Filter Tabs and Search Bar */}
            <Stack direction={{ xs: "column", sm: "row" }} gap={2} justifyContent="space-between" alignItems="center">
                <Tabs 
                    value={filterTab} 
                    onChange={(_, val) => setFilterTab(val)}
                    sx={{
                        borderBottom: 1, 
                        borderColor: 'divider',
                        "& .MuiTab-root": { fontWeight: 600 }
                    }}
                >
                    <Tab label={`All Rows (${rows.length})`} value="all" />
                    <Tab label={`Errors (${errorRowsCount})`} value="errors" color="error" />
                    <Tab label={`Valid (${validRowsCount})`} value="valid" />
                </Tabs>

                <TextField
                    placeholder="Search by name, ID, email..."
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: { xs: "100%", sm: 320 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Stack>

            {/* Preview Table */}
            <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "background.paper", maxHeight: 480, overflow: "auto" }}>
                <Table stickyHeader size="medium">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Employee ID</TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Work Email</TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Department</TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Designation</TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Date of Joining</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No employee records match the selected filters.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedRows.map((emp) => {
                                const te = templateErrors.find((e) => e.employeeId === emp.employeeId);
                                const hasErrors = Boolean(te);
                                const errCount = te ? Object.values(te.fields).reduce((s, msgs) => s + msgs.length, 0) : 0;

                                return (
                                    <TableRow 
                                        key={emp.employeeId} 
                                        hover 
                                        sx={{ 
                                            cursor: "pointer",
                                            bgcolor: hasErrors ? "rgba(244, 63, 94, 0.02)" : "inherit"
                                        }}
                                        onClick={() => handleEditRow(emp)}
                                    >
                                        <TableCell>
                                            {hasErrors ? (
                                                <Chip
                                                    icon={<ErrorIcon sx={{ fontSize: 16 }} />}
                                                    label={`${errCount} Error${errCount > 1 ? "s" : ""}`}
                                                    color="error"
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            ) : (
                                                <Chip
                                                    icon={<CheckCircle sx={{ fontSize: 16 }} />}
                                                    label="Clean"
                                                    color="success"
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{emp.employeeId || "—"}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{emp.contactName || "—"}</TableCell>
                                        <TableCell>{emp.workEmail || "—"}</TableCell>
                                        <TableCell>{emp.department || "—"}</TableCell>
                                        <TableCell>{emp.designation || "—"}</TableCell>
                                        <TableCell>{formatDateShort(emp.dateOfJoining) || "—"}</TableCell>
                                        <TableCell align="center">
                                            <IconButton 
                                                color="primary" 
                                                size="small" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditRow(emp);
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                count={filteredRows.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 20]}
            />

            {/* Slide-out Drawer Form Editor */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: { width: { xs: "100%", sm: 580 }, p: 3, display: "flex", flexDirection: "column" }
                }}
            >
                {currentEditingEmployee && selectedEmployeeIndex !== null && (
                    <>
                        {/* Drawer Header */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                            <Box>
                                <Typography variant="h6" fontWeight={700}>
                                    Edit Record: {currentEditingEmployee.contactName || `Employee ${selectedEmployeeIndex + 1}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Employee ID: {currentEditingEmployee.employeeId || "—"}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => setDrawerOpen(false)} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Stack>

                        <Divider />

                        {/* Drawer Tabs */}
                        <Tabs 
                            value={activeDrawerTab} 
                            onChange={(_, val) => setActiveDrawerTab(val)} 
                            variant="fullWidth" 
                            sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
                        >
                            <Tab 
                                label={
                                    <Badge color="error" variant="dot" invisible={getTabErrors(editingTe, 0).length === 0} sx={{ "& .MuiBadge-dot": { width: 8, height: 8 } }}>
                                        Personal
                                    </Badge>
                                } 
                            />
                            <Tab 
                                label={
                                    <Badge color="error" variant="dot" invisible={getTabErrors(editingTe, 1).length === 0} sx={{ "& .MuiBadge-dot": { width: 8, height: 8 } }}>
                                        Job
                                    </Badge>
                                } 
                            />
                            <Tab 
                                label={
                                    <Badge color="error" variant="dot" invisible={getTabErrors(editingTe, 2).length === 0} sx={{ "& .MuiBadge-dot": { width: 8, height: 8 } }}>
                                        Payroll
                                    </Badge>
                                } 
                            />
                            <Tab 
                                label={
                                    <Badge color="error" variant="dot" invisible={getTabErrors(editingTe, 3).length === 0} sx={{ "& .MuiBadge-dot": { width: 8, height: 8 } }}>
                                        Attendance
                                    </Badge>
                                } 
                            />
                        </Tabs>

                        {/* Drawer Content Body */}
                        <Box sx={{ flex: 1, overflow: "auto", pr: 1, pt: 1.5 }}>
                            {/* TAB 0: Personal Details */}
                            {activeDrawerTab === 0 && (
                                <Stack spacing={2.5}>
                                    <TextField
                                        label="Contact Name"
                                        fullWidth
                                        value={currentEditingEmployee.contactName || ""}
                                        onChange={(e) => updateRow(selectedEmployeeIndex, { contactName: e.target.value })}
                                        error={fieldHasError(editingTe, "contactName")}
                                        helperText={renderFieldError("contactName")}
                                        sx={pulseErrorSx("contactName")}
                                    />
                                    <Stack direction="row" spacing={2}>
                                        <TextField
                                            label="Middle Name"
                                            fullWidth
                                            value={currentEditingEmployee.middleName || ""}
                                            onChange={(e) => updateRow(selectedEmployeeIndex, { middleName: e.target.value || null })}
                                        />
                                        <TextField
                                            label="Last Name"
                                            fullWidth
                                            value={currentEditingEmployee.lastName || ""}
                                            onChange={(e) => updateRow(selectedEmployeeIndex, { lastName: e.target.value || null })}
                                        />
                                    </Stack>
                                    <Box sx={pulseErrorSx("dateOfBirth")}>
                                        <DatePickerElement
                                            label="Date of Birth"
                                            value={currentEditingEmployee.dateOfBirth ? dayjs(currentEditingEmployee.dateOfBirth) : null}
                                            onChange={(newValue) => updateRow(selectedEmployeeIndex, { dateOfBirth: newValue ? newValue.format("YYYY-MM-DD") : "" })}
                                            error={fieldHasError(editingTe, "dateOfBirth")}
                                            helperText={getFieldErrorString("dateOfBirth")}
                                            width="100%"
                                        />
                                    </Box>
                                    <TextField
                                        select
                                        label="Gender"
                                        fullWidth
                                        value={currentEditingEmployee.gender || ""}
                                        onChange={(e) => updateRow(selectedEmployeeIndex, { gender: e.target.value || null })}
                                        error={fieldHasError(editingTe, "gender")}
                                        helperText={renderFieldError("gender")}
                                        sx={pulseErrorSx("gender")}
                                    >
                                        <MenuItem value="">— None —</MenuItem>
                                        {GENDER_OPTIONS.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        label="Mobile Number"
                                        fullWidth
                                        value={currentEditingEmployee.mobileNumber || ""}
                                        onChange={(e) => updateRow(selectedEmployeeIndex, { mobileNumber: e.target.value })}
                                        error={fieldHasError(editingTe, "mobileNumber")}
                                        helperText={renderFieldError("mobileNumber")}
                                        sx={pulseErrorSx("mobileNumber")}
                                    />
                                    <TextField
                                        label="PAN Number"
                                        placeholder="AAAAA9999A"
                                        fullWidth
                                        value={currentEditingEmployee.panNumber || ""}
                                        onChange={(e) => updateRow(selectedEmployeeIndex, { panNumber: formatPANNumber(e.target.value) })}
                                        error={fieldHasError(editingTe, "panNumber")}
                                        helperText={renderFieldError("panNumber")}
                                        sx={pulseErrorSx("panNumber")}
                                    />
                                </Stack>
                            )}

                            {/* TAB 1: Employment Details */}
                            {activeDrawerTab === 1 && (
                                <Stack spacing={2.5}>
                                    <TextField
                                        label="Employee ID"
                                        fullWidth
                                        value={currentEditingEmployee.employeeId || ""}
                                        onChange={(e) => updateRow(selectedEmployeeIndex, { employeeId: e.target.value })}
                                        error={fieldHasError(editingTe, "employeeId")}
                                        helperText={renderFieldError("employeeId")}
                                        sx={pulseErrorSx("employeeId")}
                                    />
                                    <TextField
                                        label="Work Email"
                                        type="email"
                                        fullWidth
                                        value={currentEditingEmployee.workEmail || ""}
                                        onChange={(e) => updateRow(selectedEmployeeIndex, { workEmail: e.target.value })}
                                        error={fieldHasError(editingTe, "workEmail")}
                                        helperText={renderFieldError("workEmail")}
                                        sx={pulseErrorSx("workEmail")}
                                    />
                                    <Box sx={pulseErrorSx("dateOfJoining")}>
                                        <DatePickerElement
                                            label="Date of Joining"
                                            value={currentEditingEmployee.dateOfJoining ? dayjs(currentEditingEmployee.dateOfJoining) : null}
                                            onChange={(newValue) => updateRow(selectedEmployeeIndex, { dateOfJoining: newValue ? newValue.format("YYYY-MM-DD") : "" })}
                                            error={fieldHasError(editingTe, "dateOfJoining")}
                                            helperText={getFieldErrorString("dateOfJoining")}
                                            width="100%"
                                        />
                                    </Box>
                                    <TextField
                                        select
                                        label="Employee Type"
                                        fullWidth
                                        value={currentEditingEmployee.employeeType || ""}
                                        onChange={(e) => updateRow(selectedEmployeeIndex, { employeeType: e.target.value })}
                                        error={fieldHasError(editingTe, "employeeType")}
                                        helperText={renderFieldError("employeeType")}
                                        sx={pulseErrorSx("employeeType")}
                                    >
                                        {EMPLOYEE_TYPE_OPTIONS.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                    </TextField>
                                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: "100%" }}>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <TextField
                                                select
                                                label="Department"
                                                fullWidth
                                                value={currentEditingEmployee.department || ""}
                                                onChange={(e) => updateRow(selectedEmployeeIndex, { department: e.target.value })}
                                                error={fieldHasError(editingTe, "department")}
                                                helperText={renderFieldError("department")}
                                                sx={pulseErrorSx("department")}
                                            >
                                                {departmentOptions.map((opt) => (
                                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                ))}
                                            </TextField>
                                        </Box>
                                        <IconButton
                                            onClick={() => setOpenAddDepartmentModal(true)}
                                            size="small"
                                            aria-label="Add department"
                                        >
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>

                                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: "100%" }}>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <TextField
                                                select
                                                label="Designation"
                                                fullWidth
                                                value={currentEditingEmployee.designation || ""}
                                                onChange={(e) => updateRow(selectedEmployeeIndex, { designation: e.target.value })}
                                                error={fieldHasError(editingTe, "designation")}
                                                helperText={renderFieldError("designation")}
                                                sx={pulseErrorSx("designation")}
                                            >
                                                {designationOptions.map((opt) => (
                                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                ))}
                                            </TextField>
                                        </Box>
                                        <IconButton
                                            onClick={() => setOpenAddDesignationModal(true)}
                                            size="small"
                                            aria-label="Add designation"
                                        >
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>

                                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: "100%" }}>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <TextField
                                                select
                                                label="Expense Policy"
                                                fullWidth
                                                value={currentEditingEmployee.expensePolicy || ""}
                                                onChange={(e) => updateRow(selectedEmployeeIndex, { expensePolicy: e.target.value || null })}
                                                error={fieldHasError(editingTe, "expensePolicy")}
                                                helperText={renderFieldError("expensePolicy")}
                                                sx={pulseErrorSx("expensePolicy")}
                                            >
                                                <MenuItem value="">— None —</MenuItem>
                                                {expensePolicyOptions.map((opt) => (
                                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                ))}
                                            </TextField>
                                        </Box>
                                        <IconButton
                                            onClick={() => handleOpenInfoModal(
                                                "Add Expense Policy",
                                                "To create a new Expense Policy, please navigate to Settings > Expense > Expense Policies."
                                            )}
                                            size="small"
                                            aria-label="Add expense policy"
                                        >
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                    <ToggleSwitch
                                        label="Enable Employee Portal"
                                        checked={currentEditingEmployee.isEmployeePortalEnabled}
                                        onChange={(e) => updateRow(selectedEmployeeIndex, { isEmployeePortalEnabled: e.target.checked })}
                                    />
                                    <ToggleSwitch
                                        label="Self Reporting (No Manager)"
                                        checked={currentEditingEmployee.isSelfReporting}
                                        onChange={(e) => updateRow(selectedEmployeeIndex, { 
                                            isSelfReporting: e.target.checked,
                                            reportingToEmployeeId: e.target.checked ? "" : currentEditingEmployee.reportingToEmployeeId
                                        })}
                                    />
                                    {!currentEditingEmployee.isSelfReporting && (
                                        <TextField
                                            label="Reporting Manager Employee ID"
                                            fullWidth
                                            value={currentEditingEmployee.reportingToEmployeeId || ""}
                                            onChange={(e) => updateRow(selectedEmployeeIndex, { reportingToEmployeeId: e.target.value })}
                                            error={fieldHasError(editingTe, "reportingToEmployeeId")}
                                            helperText={renderFieldError("reportingToEmployeeId")}
                                            sx={pulseErrorSx("reportingToEmployeeId")}
                                        />
                                    )}
                                </Stack>
                            )}

                            {/* TAB 2: Payroll Config */}
                            {activeDrawerTab === 2 && (
                                <Stack spacing={2.5}>
                                    <ToggleSwitch
                                        label="Enable Payroll Details"
                                        checked={Boolean(currentEditingEmployee.payroll)}
                                        onChange={(e) => {
                                            const initializedPayroll = e.target.checked ? {
                                                template: "",
                                                incomeTaxConfig: "",
                                                annualGross: 0,
                                                isPfEnabled: false,
                                                pfNumber: null,
                                                uanNumber: null,
                                                probationEndDate: null,
                                            } : null;
                                            updateRow(selectedEmployeeIndex, { payroll: initializedPayroll });
                                        }}
                                    />

                                    {currentEditingEmployee.payroll && (
                                        <>
                                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: "100%" }}>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <TextField
                                                        select
                                                        label="Salary Template"
                                                        fullWidth
                                                        value={currentEditingEmployee.payroll.template || ""}
                                                        onChange={(e) => updatePayrollField(selectedEmployeeIndex, { template: e.target.value })}
                                                        error={fieldHasError(editingTe, "payroll.template")}
                                                        helperText={renderFieldError("payroll.template")}
                                                        sx={pulseErrorSx("payroll.template")}
                                                    >
                                                        {salaryTemplateOptions.map((opt) => (
                                                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Box>
                                                <IconButton
                                                    onClick={() => handleOpenInfoModal(
                                                        "Add Salary Template",
                                                        "To create a new Salary Template, please configure it in Salary > Structures > Salary Templates."
                                                    )}
                                                    size="small"
                                                    aria-label="Add salary template"
                                                >
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: "100%" }}>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <TextField
                                                        select
                                                        label="Income Tax Configuration"
                                                        fullWidth
                                                        value={currentEditingEmployee.payroll.incomeTaxConfig || ""}
                                                        onChange={(e) => updatePayrollField(selectedEmployeeIndex, { incomeTaxConfig: e.target.value })}
                                                        error={fieldHasError(editingTe, "payroll.incomeTaxConfig")}
                                                        helperText={renderFieldError("payroll.incomeTaxConfig")}
                                                        sx={pulseErrorSx("payroll.incomeTaxConfig")}
                                                    >
                                                        {incomeTaxConfigOptions.map((opt) => (
                                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Box>
                                                <IconButton
                                                    onClick={() => handleOpenInfoModal(
                                                        "Add Income Tax Configuration",
                                                        "To add a new Income Tax Configuration, please go to Salary > Payrun > Settings > Income Tax."
                                                    )}
                                                    size="small"
                                                    aria-label="Add income tax configuration"
                                                >
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                            <TextField
                                                label="Annual Gross (₹)"
                                                type="number"
                                                fullWidth
                                                value={currentEditingEmployee.payroll.annualGross || ""}
                                                onChange={(e) => updatePayrollField(selectedEmployeeIndex, { annualGross: Number(e.target.value) })}
                                                error={fieldHasError(editingTe, "payroll.annualGross")}
                                                helperText={renderFieldError("payroll.annualGross")}
                                                sx={pulseErrorSx("payroll.annualGross")}
                                            />
                                            <ToggleSwitch
                                                label="Enable PF (Provident Fund)"
                                                checked={currentEditingEmployee.payroll.isPfEnabled}
                                                onChange={(e) => updatePayrollField(selectedEmployeeIndex, { 
                                                    isPfEnabled: e.target.checked,
                                                    pfNumber: e.target.checked ? currentEditingEmployee.payroll?.pfNumber : null,
                                                    uanNumber: e.target.checked ? currentEditingEmployee.payroll?.uanNumber : null
                                                })}
                                            />
                                            {currentEditingEmployee.payroll.isPfEnabled && (
                                                <>
                                                    <TextField
                                                        label="PF Number"
                                                        placeholder="MHBAN123456700000012345"
                                                        fullWidth
                                                        value={currentEditingEmployee.payroll.pfNumber || ""}
                                                        onChange={(e) => updatePayrollField(selectedEmployeeIndex, { pfNumber: e.target.value })}
                                                        error={fieldHasError(editingTe, "payroll.pfNumber")}
                                                        helperText={renderFieldError("payroll.pfNumber")}
                                                        sx={pulseErrorSx("payroll.pfNumber")}
                                                    />
                                                    <TextField
                                                        label="UAN Number"
                                                        placeholder="12 digits"
                                                        fullWidth
                                                        value={currentEditingEmployee.payroll.uanNumber || ""}
                                                        onChange={(e) => updatePayrollField(selectedEmployeeIndex, { uanNumber: e.target.value })}
                                                        error={fieldHasError(editingTe, "payroll.uanNumber")}
                                                        helperText={renderFieldError("payroll.uanNumber")}
                                                        sx={pulseErrorSx("payroll.uanNumber")}
                                                    />
                                                </>
                                            )}
                                            <ToggleSwitch
                                                label="In probation"
                                                checked={Boolean(currentEditingEmployee.payroll.probationEndDate)}
                                                onChange={(e) => {
                                                    const todayStr = new Date().toISOString().split('T')[0];
                                                    updatePayrollField(selectedEmployeeIndex, { 
                                                        probationEndDate: e.target.checked ? todayStr : null 
                                                    });
                                                }}
                                            />
                                            {Boolean(currentEditingEmployee.payroll.probationEndDate) && (
                                                <DatePickerElement
                                                    label="Probation End Date"
                                                    value={currentEditingEmployee.payroll.probationEndDate ? dayjs(currentEditingEmployee.payroll.probationEndDate) : null}
                                                    onChange={(newValue) => updatePayrollField(selectedEmployeeIndex, { probationEndDate: newValue ? newValue.format("YYYY-MM-DD") : null })}
                                                    width="100%"
                                                />
                                            )}
                                        </>
                                    )}
                                </Stack>
                            )}

                            {/* TAB 3: Attendance Config */}
                            {activeDrawerTab === 3 && (
                                <Stack spacing={2.5}>
                                    <ToggleSwitch
                                        label="Enable Attendance & Leave Config"
                                        checked={Boolean(currentEditingEmployee.attendance)}
                                        onChange={(e) => {
                                            const initializedAttendance = e.target.checked ? {
                                                shift: "",
                                                weekoff: "",
                                                leavePlan: "",
                                                holidayPlan: "",
                                            } : null;
                                            updateRow(selectedEmployeeIndex, { attendance: initializedAttendance });
                                        }}
                                    />

                                    {currentEditingEmployee.attendance && (
                                        <>
                                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: "100%" }}>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <TextField
                                                        select
                                                        label="Shift"
                                                        fullWidth
                                                        value={currentEditingEmployee.attendance.shift || ""}
                                                        onChange={(e) => updateAttendanceField(selectedEmployeeIndex, { shift: e.target.value })}
                                                        error={fieldHasError(editingTe, "attendance.shift")}
                                                        helperText={renderFieldError("attendance.shift")}
                                                        sx={pulseErrorSx("attendance.shift")}
                                                    >
                                                        {shiftOptions.map((opt) => (
                                                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Box>
                                                <IconButton
                                                    onClick={() => handleOpenInfoModal(
                                                        "Add Shift",
                                                        "To configure a new Shift, please go to Time > Shifts."
                                                    )}
                                                    size="small"
                                                    aria-label="Add shift"
                                                >
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: "100%" }}>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <TextField
                                                        select
                                                        label="Week Off Plan"
                                                        fullWidth
                                                        value={currentEditingEmployee.attendance.weekoff || ""}
                                                        onChange={(e) => updateAttendanceField(selectedEmployeeIndex, { weekoff: e.target.value })}
                                                        error={fieldHasError(editingTe, "attendance.weekoff")}
                                                        helperText={renderFieldError("attendance.weekoff")}
                                                        sx={pulseErrorSx("attendance.weekoff")}
                                                    >
                                                        {weekOffOptions.map((opt) => (
                                                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Box>
                                                <IconButton
                                                    onClick={() => handleOpenInfoModal(
                                                        "Add Week Off Plan",
                                                        "To create a new Week Off Plan, please go to Time > Week Offs."
                                                    )}
                                                    size="small"
                                                    aria-label="Add week off plan"
                                                >
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: "100%" }}>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <TextField
                                                        select
                                                        label="Leave Plan"
                                                        fullWidth
                                                        value={currentEditingEmployee.attendance.leavePlan || ""}
                                                        onChange={(e) => updateAttendanceField(selectedEmployeeIndex, { leavePlan: e.target.value })}
                                                        error={fieldHasError(editingTe, "attendance.leavePlan")}
                                                        helperText={renderFieldError("attendance.leavePlan")}
                                                        sx={pulseErrorSx("attendance.leavePlan")}
                                                    >
                                                        {leavePlanOptions.map((opt) => (
                                                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Box>
                                                <IconButton
                                                    onClick={() => handleOpenInfoModal(
                                                        "Add Leave Plan",
                                                        "To create a new Leave Plan, please go to Time > Leaves."
                                                    )}
                                                    size="small"
                                                    aria-label="Add leave plan"
                                                >
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: "100%" }}>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <TextField
                                                        select
                                                        label="Holiday Plan"
                                                        fullWidth
                                                        value={currentEditingEmployee.attendance.holidayPlan || ""}
                                                        onChange={(e) => updateAttendanceField(selectedEmployeeIndex, { holidayPlan: e.target.value })}
                                                        error={fieldHasError(editingTe, "attendance.holidayPlan")}
                                                        helperText={renderFieldError("attendance.holidayPlan")}
                                                        sx={pulseErrorSx("attendance.holidayPlan")}
                                                    >
                                                        {holidayPlanOptions.map((opt) => (
                                                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Box>
                                                <IconButton
                                                    onClick={() => handleOpenInfoModal(
                                                        "Add Holiday Plan",
                                                        "To configure a new Holiday Plan, please go to Time > Holiday Plans."
                                                    )}
                                                    size="small"
                                                    aria-label="Add holiday plan"
                                                >
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </>
                                    )}
                                </Stack>
                            )}
                        </Box>

                        {/* Drawer Actions */}
                        <Box sx={{ pt: 2, display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
                            <Button variant="outlined" onClick={() => setDrawerOpen(false)} sx={{ borderRadius: 2 }}>
                                Done
                            </Button>
                        </Box>
                    </>
                )}
            </Drawer>

            <ModalElement
                open={openAddDepartmentModal}
                onClose={() => {
                    setOpenAddDepartmentModal(false);
                    setNewDepartmentName("");
                }}
                title="Add Department"
                maxWidth="sm"
                onClick={handleSaveNewDepartment}
                disabled={!newDepartmentName.trim()}
            >
                <TextField
                    label="Department name"
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ mt: 1.5 }}
                />
            </ModalElement>

            <ModalElement
                open={openAddDesignationModal}
                onClose={() => {
                    setOpenAddDesignationModal(false);
                    setNewDesignationName("");
                }}
                title="Add Designation"
                maxWidth="sm"
                onClick={handleSaveNewDesignation}
                disabled={!newDesignationName.trim()}
            >
                <TextField
                    label="Designation name"
                    value={newDesignationName}
                    onChange={(e) => setNewDesignationName(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ mt: 1.5 }}
                />
            </ModalElement>

            <ModalElement
                open={openInfoModal}
                onClose={() => setOpenInfoModal(false)}
                title={infoModalTitle}
                maxWidth="xs"
                onClick={() => setOpenInfoModal(false)}
            >
                <Typography variant="body2" sx={{ mt: 1.5 }}>
                    {infoModalMessage}
                </Typography>
            </ModalElement>
        </Box>
    );
};

export default EmployeeValidationView;