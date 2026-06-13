import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { DatePickerElement } from "../../../../../components/atom/date-picker/DatePicker";
import { useUpdateBasicInfoMutation } from "../api/profile.api";
import { useGetAllDesignationsQuery } from "../../../org/people/designation/api/designation.api";
import { useGetAllDepartmentsQuery } from "../../../org/people/department/api/department.api";
import { useLazyGetAllSubDepartmentsByDepartmentIdQuery } from "../../../org/people/department/sub-department/api/sub-department.api";
import { useEmployees } from "../../../hooks/useEmployees";
import { useGetExpensePoliciesQuery } from "../../../org/expense/policy/api/expensePolicy.api";
import type { IBasicInformation } from "../types/profile.types";
import { buildModalSaveDisabledTooltip } from "../../../../../utils/modalSaveDisabled";


const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Others", value: "others" },
];
interface Props {
    open: boolean;
    onClose: () => void;
    data: IBasicInformation;
    employeeId: string;
    showMessage: (message: string, color: "success" | "error") => void;
    isAdmin?: boolean;
    existsInPayRun?: boolean;
}

function Field({
    label,
    required = false,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <Box>
            <Typography variant="subtitle2" mb={1}>{required ? `${label} *` : label}</Typography>
            {children}
        </Box>
    );
}

const EMPLOYEE_TYPE_OPTIONS = [
    { label: "Permanent", value: "permanent" },
    { label: "Intern", value: "intern" },
];

export default function BasicInfoModal({ open, onClose, data, employeeId, showMessage, isAdmin = false, existsInPayRun }: Props) {
    const [form, setForm] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        employeeIdField: "",
        workEmail: "",
        gender: "",
    });
    const [dateOfJoining, setDateOfJoining] = useState<Dayjs | null>(null);
    const [employeeType, setEmployeeType] = useState("");
    const [designationId, setDesignationId] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [subDepartmentId, setSubDepartmentId] = useState("");
    const [reportingToEmployeeId, setReportingToEmployeeId] = useState("");
    const [initialReportingToId, setInitialReportingToId] = useState("");
    const [initialDesignationId, setInitialDesignationId] = useState("");
    const [initialDepartmentId, setInitialDepartmentId] = useState("");
    const [initialSubDepartmentId, setInitialSubDepartmentId] = useState("");
    const [expensePolicyId, setExpensePolicyId] = useState("");

    const [updateBasicInfo, { isLoading }] = useUpdateBasicInfoMutation();

    const { data: designationsResponse } = useGetAllDesignationsQuery(undefined, { skip: !isAdmin });
    const { data: departmentsResponse } = useGetAllDepartmentsQuery(undefined, { skip: !isAdmin });
    const [fetchSubDepartments] = useLazyGetAllSubDepartmentsByDepartmentIdQuery();
    const [subDepartmentsByDept, setSubDepartmentsByDept] = useState<
        Record<number, { id: number; subDepartmentName: string }[]>
    >({});
    const { employees } = useEmployees({ skip: !isAdmin });
    const { data: expensePoliciesData } = useGetExpensePoliciesQuery();

    const designationOptions = useMemo(
        () => (designationsResponse?.data ?? []).map(d => ({ label: d.designationName, value: String(d.id) })),
        [designationsResponse]
    );
    const departmentOptions = useMemo(() => {
        const list = departmentsResponse?.data ?? [];
        const options: { label: string; value: string }[] = [];

        list.forEach((d) => {
            options.push({ label: d.departmentName, value: `d-${d.id}` });
            const subs = subDepartmentsByDept[d.id] ?? [];
            subs.forEach((s) => {
                options.push({
                    label: `${d.departmentName} - ${s.subDepartmentName}`,
                    value: `d-${d.id}-s-${s.id}`,
                });
            });
        });

        return options;
    }, [departmentsResponse, subDepartmentsByDept]);

    const employeeOptions = useMemo(
        () => employees.map((e) => {
            const c = e.contact;
            const name = c?.name || [c?.firstName, c?.middleName, c?.lastName].filter(Boolean).join(" ") || e.employeeId;
            return { label: `${name} (${e.employeeId})`, value: String(e.id) };
        }),
        [employees]
    );
    const policyOptions = useMemo(
        () => (expensePoliciesData ?? []).map((p: any) => ({ label: p.policyName, value: String(p.id) })),
        [expensePoliciesData]
    );

    useEffect(() => {
        if (!open) return;
        const list = departmentsResponse?.data ?? [];
        if (!isAdmin || list.length === 0) return;

        list.forEach((dep) => {
            fetchSubDepartments(dep.id)
                .then((res: any) => {
                    const body = res?.data;
                    const subs = Array.isArray(body) ? body : body?.data ?? [];
                    setSubDepartmentsByDept((prev) => ({
                        ...prev,
                        [dep.id]: subs.map((s: any) => ({
                            id: s.id,
                            subDepartmentName: s.subDepartmentName ?? "",
                        })),
                    }));
                })
                .catch(() => {
                    setSubDepartmentsByDept((prev) => ({ ...prev, [dep.id]: [] }));
                });
        });
    }, [isAdmin, departmentsResponse?.data, fetchSubDepartments]);

    const departmentSelectValue = departmentId
        ? subDepartmentId
            ? `d-${departmentId}-s-${subDepartmentId}`
            : `d-${departmentId}`
        : "";

    const handleDepartmentOptionChange = useCallback((value: string) => {
        if (!value) {
            setDepartmentId("");
            setSubDepartmentId("");
            return;
        }

        const subMatch = value.match(/^d-(\d+)-s-(\d+)$/);
        const deptMatch = value.match(/^d-(\d+)$/);

        if (subMatch) {
            setDepartmentId(subMatch[1]);
            setSubDepartmentId(subMatch[2]);
        } else if (deptMatch) {
            setDepartmentId(deptMatch[1]);
            setSubDepartmentId("");
        } else {
            setDepartmentId("");
            setSubDepartmentId("");
        }
    }, []);

    useEffect(() => {
        if (open) {
            setForm({
                firstName: data.firstName ?? "",
                middleName: data.middleName ?? "",
                lastName: data.lastName ?? "",
                employeeIdField: data.employeeId ?? "",
                workEmail: data.workEmail ?? "",
                gender: data.gender ?? "",
            });
            setDateOfJoining(data.dateOfJoining ? dayjs(data.dateOfJoining) : null);
            // Pre-fill expense policy: match by id or by name
            const matchedPolicy = (expensePoliciesData ?? []).find(
                (p: any) => String(p.id) === String((data as any).expensePolicyId) || p.policyName === data.expensePolicy
            );
            setExpensePolicyId(matchedPolicy ? String(matchedPolicy.id) : "");
            if (isAdmin) {
                setEmployeeType(data.employeeType ?? "");

                const matchedDesig = (designationsResponse?.data ?? []).find(
                    d => d.designationName.toLowerCase() === (data.designation ?? "").toLowerCase()
                );
                const matchedDesigId = matchedDesig ? String(matchedDesig.id) : "";
                setDesignationId(matchedDesigId);
                setInitialDesignationId(matchedDesigId);

                const matchedDept = (departmentsResponse?.data ?? []).find(
                    d => d.departmentName.toLowerCase() === (data.department ?? "").toLowerCase()
                );
                const matchedDeptId = matchedDept ? String(matchedDept.id) : "";
                setDepartmentId(matchedDeptId);
                setInitialDepartmentId(matchedDeptId);

                let matchedSubDeptId = "";
                const subDepartmentName = (data as any).subDepartment ?? "";
                if (matchedDeptId && subDepartmentName) {
                    const deptSubs = subDepartmentsByDept[Number(matchedDeptId)] ?? [];
                    const matchedSubDept = deptSubs.find(
                        (s) => s.subDepartmentName.toLowerCase() === subDepartmentName.toLowerCase(),
                    );
                    matchedSubDeptId = matchedSubDept ? String(matchedSubDept.id) : "";
                }
                setSubDepartmentId(matchedSubDeptId);
                setInitialSubDepartmentId(matchedSubDeptId);

                // Pre-fill reporting manager: match by name from reportingTo string
                const matchedEmployee = employees.find((e) => {
                    const c = e.contact;
                    const name = c?.name || [c?.firstName, c?.middleName, c?.lastName].filter(Boolean).join(" ") || "";
                    return name.toLowerCase() === (data.reportingTo ?? "").toLowerCase();
                });
                const reportingId = matchedEmployee ? String(matchedEmployee.id) : "";
                setReportingToEmployeeId(reportingId);
                setInitialReportingToId(reportingId);
            }
        }
    }, [open, data, isAdmin, designationsResponse, departmentsResponse, expensePoliciesData, employees, subDepartmentsByDept]);

    const hasChanges = useMemo(() => {
        const joiningChanged =
            dayjs(dateOfJoining).format("YYYY-MM-DD") !== (data.dateOfJoining ?? "");
        const baseChanged =
            (form.firstName ?? "") !== (data.firstName ?? "") ||
            (form.middleName ?? "") !== (data.middleName ?? "") ||
            (form.lastName ?? "") !== (data.lastName ?? "") ||
            (form.gender ?? "") !== (data.gender ?? "") ||
            joiningChanged ||
            expensePolicyId !== ((expensePoliciesData ?? []).find((p: any) => p.policyName === data.expensePolicy) ? String((expensePoliciesData as any[]).find((p: any) => p.policyName === data.expensePolicy).id) : "");

        if (!isAdmin) return baseChanged;

        return (
            baseChanged ||
            (form.employeeIdField ?? "") !== (data.employeeId ?? "") ||
            (form.workEmail ?? "") !== (data.workEmail ?? "") ||
            employeeType !== (data.employeeType ?? "") ||
            designationId !== initialDesignationId ||
            departmentId !== initialDepartmentId ||
            subDepartmentId !== initialSubDepartmentId ||
            reportingToEmployeeId !== initialReportingToId
        );
    }, [form, dateOfJoining, data, isAdmin, employeeType, designationId, departmentId, subDepartmentId, reportingToEmployeeId, initialReportingToId, expensePolicyId, expensePoliciesData, initialDesignationId, initialDepartmentId, initialSubDepartmentId]);

    const set = useCallback(
        (field: keyof typeof form) =>
            (e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, [field]: e.target.value })),
        []
    );

    const handleSave = useCallback(async () => {
        try {
            const toNull = (value: string) => {
                const trimmed = value.trim();
                return trimmed === "" ? null : trimmed;
            };
            const body: Record<string, any> = {
                firstName: toNull(form.firstName),
                middleName: toNull(form.middleName),
                lastName: toNull(form.lastName),
                dateOfJoining: dateOfJoining ? dayjs(dateOfJoining).format("YYYY-MM-DD") : null,
                expensePolicyId: expensePolicyId ? Number(expensePolicyId) : null,
                gender: toNull(form.gender),
            };

            if (isAdmin) {
                body.employeeType = employeeType || null;
                body.designationId = designationId ? Number(designationId) : null;
                body.departmentId = departmentId ? Number(departmentId) : null;
                body.subDepartmentId = subDepartmentId ? Number(subDepartmentId) : null;
                body.reportingToEmployeeId = reportingToEmployeeId ? Number(reportingToEmployeeId) : null;
            }

            await updateBasicInfo({ id: employeeId, body }).unwrap();
            showMessage("Basic information updated successfully.", "success");
            onClose();
        } catch (error: any) {
            showMessage(error?.data?.message ?? error?.error ?? error?.message ?? "Failed to update basic information.", "error");
        }
    }, [form, dateOfJoining, isAdmin, employeeType, designationId, departmentId, subDepartmentId, reportingToEmployeeId, expensePolicyId, employeeId, updateBasicInfo, onClose, showMessage]);

    const isSaveDisabled = isLoading || !hasChanges || (isAdmin && !reportingToEmployeeId);
    const saveDisabledTooltip = useMemo(
        () =>
            buildModalSaveDisabledTooltip([
                isLoading && "Save is in progress.",
                !hasChanges && "Make a change before saving.",
                (isAdmin && !reportingToEmployeeId) && "Reporting Manager is required.",
            ]),
        [isLoading, hasChanges, isAdmin, reportingToEmployeeId],
    );

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            title="Edit Basic Information"
            maxWidth={isAdmin ? "md" : "sm"}
            onClick={handleSave}
            disabled={isSaveDisabled}
            disabledActionTooltip={saveDisabledTooltip}
        >
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                {isAdmin && (
                    <>
                        <Field label="Employee ID" required>
                            <TextFieldElement label="" fullWidth value={form.employeeIdField} onChange={set("employeeIdField")} disabled={true} />
                        </Field>
                        <Field label="Work Email" required>
                            <TextFieldElement label="" fullWidth value={form.workEmail} onChange={set("workEmail")}  disabled={true}/>
                        </Field>
                        <Field label="First Name" required>
                            <TextFieldElement label="" fullWidth value={form.firstName} onChange={set("firstName")} disabled={true} />
                        </Field>
                        <Field label="Gender" required>
                            <SingleSelectElement
                                label=""
                                options={GENDER_OPTIONS}
                                value={form.gender}
                                onChange={(value: string) => setForm((prev) => ({ ...prev, gender: value }))}
                                fullWidth
                            />
                        </Field>
                        <Field label="Employee Type" required>
                            <SingleSelectElement
                                label=""
                                options={EMPLOYEE_TYPE_OPTIONS}
                                value={employeeType}
                                onChange={setEmployeeType}
                                fullWidth
                                disabled={true}
                            />
                        </Field>
                    </>
                )}

                
                <Field label="Middle Name">
                    <TextFieldElement label="" fullWidth value={form.middleName} onChange={set("middleName")} />
                </Field>
                <Field label="Last Name" required>
                    <TextFieldElement label="" fullWidth value={form.lastName} onChange={set("lastName")} />
                </Field>
                
                <Field label="Date of Joining" required>
                    <DatePickerElement label="" value={dateOfJoining} onChange={setDateOfJoining} width="100%" disabled={existsInPayRun}/>
                </Field>
                <Field label="Expense Policy">
                    <SingleSelectElement
                        label=""
                        options={policyOptions}
                        value={expensePolicyId}
                        onChange={setExpensePolicyId}
                        clearable
                        fullWidth
                    />
                </Field>

                {isAdmin ? (
                    <>
                        <Field label="Designation" required>
                            <SingleSelectElement
                                label=""
                                options={designationOptions}
                                value={designationId}
                                onChange={setDesignationId}
                                fullWidth
                            />
                        </Field>
                        <Field label="Department / Sub-department" required>
                            <SingleSelectElement
                                label=""
                                options={departmentOptions}
                                value={departmentSelectValue}
                                onChange={handleDepartmentOptionChange}
                                fullWidth
                            />
                        </Field>
                        {/* <Box sx={{ gridColumn: "1 / -1" }}> */}
                            <Field label="Reporting Manager" required>
                                <SingleSelectElement
                                    label=""
                                    options={employeeOptions}
                                    value={reportingToEmployeeId}
                                    onChange={setReportingToEmployeeId}
                                    clearable
                                    fullWidth
                                />
                            </Field>
                        {/* </Box> */}
                    </>
                ) : (
                    // <Box sx={{ gridColumn: "1 / -1" }}>
                        <Typography variant="caption" color="text.secondary">
                            Designation, Department, and Reporting Manager are managed by your administrator.
                        </Typography>
                    // </Box>
                )}
            </Box>
        </ModalElement>
    );
}