import type { ActivityItem } from "../types/activity.types";
import { formatFinancialYearLabel } from "../../../people/me/investments/api/itDeclaration.api";
import { boldSubject, employeeSuffix, forEmployee, subjectSuffix } from "./descriptionMarkup";

const humanize = (str?: string): string => {
    if (!str) return "";
    return str.replace(/-/g, " ");
};

export const formatActivityDate = (iso: string): string => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const parseEmployeeId = (row: ActivityItem): number | null => {
    if (typeof row.employee === "number") return row.employee;
    if (typeof row.employeeId === "number") return row.employeeId;
    if (typeof row.employeeId === "string") {
        const parsed = Number(row.employeeId);
        if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (typeof row.draftId === "number") return row.draftId;
    return null;
};

export const resolveEmployeeDisplayName = (
    row: ActivityItem,
    employeeNameMap: Record<number, string>,
): string | null => {
    if (row.employeeName?.trim()) return row.employeeName.trim();

    const id = parseEmployeeId(row);
    if (id != null && employeeNameMap[id]) return employeeNameMap[id];

    if (row.name && typeof row.name === "string" && row.name.trim()) return row.name.trim();

    return null;
};

const resolveEntityName = (
    row: ActivityItem,
    employeeNameMap: Record<number, string>,
): string | null => {
    const employeeName = resolveEmployeeDisplayName(row, employeeNameMap);
    if (employeeName) return employeeName;

    if (row.templateName) return row.templateName;
    if (row.earningName) return row.earningName;
    if (row.deductionName) return row.deductionName;
    if (row.payrunDate) return `Payrun (${row.payrunDate})`;
    if (row.payrunId) return `Payrun #${row.payrunId}`;
    if (row.payslipTemplateName) return row.payslipTemplateName;
    if (row.shiftVersionName) return row.shiftVersionName;
    if (row.shiftName) return row.shiftName;
    if (row.weekOff) return row.weekOff;
    if (row.planName) return row.planName;
    if (row.designationName) return row.designationName;
    if (row.departmentName) return row.departmentName;
    if (row.expenseCategoryName) return row.expenseCategoryName;
    if (row.expense_claim_title) return row.expense_claim_title;
    if (row.incomeTaxName) return row.incomeTaxName;
    if (row.name) return row.name;
    if (row.employeeDocumentFolderName) return row.employeeDocumentFolderName;
    if (row.feature === "Holiday" && row.description) return row.description as string;
    if (row.employeeDocumentTypeName) return row.employeeDocumentTypeName;
    if (row.accountName) return row.accountName;
    if (row.projectName) return row.projectName;
    if (row.leavePlanName) return row.leavePlanName;
    if (row.leaveTypeName) return row.leaveTypeName;

    return null;
};

const formatItDeclarationFy = (financialYear?: string): string => {
    if (!financialYear?.trim()) return "";
    const label = formatFinancialYearLabel(financialYear);
    return ` (FY ${label})`;
};

const isDraftFeature = (feature: string): boolean =>
    feature === "Employee Draft" || feature === "Draft Employee" || feature === "Draft";

const asString = (value: unknown): string | undefined =>
    typeof value === "string" && value.trim() ? value.trim() : undefined;

const entityLabel = (...candidates: unknown[]): string =>
    subjectSuffix(candidates.map(asString).find(Boolean));

const resolveFeatureLabel = (feature: string): string => {
    const overrides: Record<string, string> = {
        // Leave
        "Apply Leave": "A leave request",
        "Approve Leave Request": "A leave request",
        "Reject Leave Request": "A leave request",
        "Cancel Leave Request": "A leave request",
        // Attendance
        "Regularize-Attendance": "An attendance regularization request",
        "Approve Regularize Request": "An attendance regularization request",
        "Reject Regularize Request": "An attendance regularization request",
        "Attendance Configuration": "Attendance configuration",
        // Employee module
        "Basic Information": "Basic information",
        "Payment Information": "Payment information",
        // Documents
        "Documents Details": "An employee document",
        "Documents Folder": "A document folder",
        "Documents Type": "A document type",
    };
    return overrides[feature] ?? feature;
};


export const generateDescription = (
    row: ActivityItem,
    employeeNameMap: Record<number, string>,
): string => {
    const module = humanize(row.module);
    const feature = humanize(row.feature);
    const status = row.status;
    if (!module || !feature || !status) return "—";

    const s = status.toLowerCase();
    const entityName = resolveEntityName(row, employeeNameMap);

    const formatPayrunDate = (d: string) => {
        const date = new Date(d);
        if (isNaN(date.getTime())) return d;
        return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    };

    // ---- Module + feature specific overrides ----

    // Employee (any module)
    if (feature === "Employee") {
        const name = resolveEmployeeDisplayName(row, employeeNameMap);
        const who = employeeSuffix(name);
        switch (s) {
            case "create": return `Employee${who} was added`;
            case "update": return `Employee${who} was updated`;
            case "delete": return `Employee${who} was deleted`;
            default: return `Employee${who} — ${status}`;
        }
    }

    // Employee draft
    if (isDraftFeature(feature)) {
        const name = resolveEmployeeDisplayName(row, employeeNameMap);
        switch (s) {
            case "create": return `Employee draft${forEmployee(name)} was created`;
            case "update": return `Employee draft${forEmployee(name)} was updated`;
            case "delete": return `Employee draft${forEmployee(name)} was deleted`;
            default: return `Employee draft${forEmployee(name)} — ${status}`;
        }
    }

    // Employee module > Basic Information
    if (module === "Employee" && feature === "Basic Information") {
        const name = resolveEmployeeDisplayName(row, employeeNameMap);
        switch (s) {
            case "update": return `Basic information${forEmployee(name)} was updated`;
            default: return `Basic information${forEmployee(name)} — ${status}`;
        }
    }

    // Employee module > Payment Information
    if (module === "Employee" && feature === "Payment Information") {
        const name = resolveEmployeeDisplayName(row, employeeNameMap);
        switch (s) {
            case "update": return `Payment information${forEmployee(name)} was updated`;
            case "create": return `Payment information${forEmployee(name)} was created`;
            default: return `Payment information${forEmployee(name)} — ${status}`;
        }
    }

    // Employee module > Payroll Information (income tax config name from BE when present)
    if (module === "Employee" && feature === "Payroll Information") {
        const empName = resolveEmployeeDisplayName(row, employeeNameMap);
        const taxName = row.incomeTaxName as string | undefined;
        const taxPart = taxName ? ` (${boldSubject(taxName)})` : "";
        switch (s) {
            case "update": return `Payroll information${forEmployee(empName)}${taxPart} was updated`;
            case "create": return `Payroll information${forEmployee(empName)}${taxPart} was created`;
            default: return `Payroll information${forEmployee(empName)}${taxPart} — ${status}`;
        }
    }

    // Income Tax configuration
    if (feature === "Income Tax") {
        const label = entityLabel(row.incomeTaxName, row.name);
        switch (s) {
            case "create": return `Income tax configuration${label} was created`;
            case "update": return `Income tax configuration${label} was updated`;
            case "delete": return `Income tax configuration${label} was deleted`;
            default: return `Income tax configuration${label} — ${status}`;
        }
    }

    // IT Declaration
    if (feature === "IT Declaration") {
        const name = resolveEmployeeDisplayName(row, employeeNameMap);
        const fy = formatItDeclarationFy(row.financialYear as string | undefined);
        switch (s) {
            case "create": return `IT declaration${forEmployee(name)} was created${fy}`;
            case "update": return `IT declaration${forEmployee(name)} was updated${fy}`;
            case "delete": return `IT declaration${forEmployee(name)} was deleted${fy}`;
            default: return `IT declaration${forEmployee(name)}${fy} — ${status}`;
        }
    }

    // Payroll > Payrun
    if (feature === "Payrun") {
        const date = row.payrunDate
            ? ` for ${boldSubject(formatPayrunDate(String(row.payrunDate)))}`
            : row.payrunId
                ? subjectSuffix(`#${row.payrunId}`)
                : "";

        switch (s) {
            case "create": return `Payrun${date} was created`;
            case "delete": return `Payrun${date} was deleted`;
            case "approve": return `Payrun${date} was approved`;
            case "reject": return `Payrun${date} was rejected`;
            case "payment": return `Payment initiated for Payrun${date}`;
            case "delete payment": return `Payment deleted for Payrun${date}`;
            case "record payment": return `Payment recorded for Payrun${date}`;
            case "skip employees": return `Employees skipped for Payrun${date}`;
            default: return `Payrun${date} — ${status}`;
        }
    }

    // Payroll > Pay Schedule
    if (feature === "PaySchedule") {
        const name = entityLabel(row.payScheduleName, row.name);
        switch (s) {
            case "create": return `Pay schedule${name} was created`;
            case "update": return `Pay schedule${name} was updated`;
            case "delete": return `Pay schedule${name} was deleted`;
            default: return `Pay schedule${name} — ${status}`;
        }
    }

    // Payroll > Designation
    if (feature === "Designation") {
        const name = entityLabel(row.designationName, row.name);
        switch (s) {
            case "create": return `Designation${name} was created`;
            case "update": return `Designation${name} was updated`;
            case "delete": return `Designation${name} was deleted`;
            default: return `Designation${name} — ${status}`;
        }
    }

    // Payroll > Department
    if (feature === "Department") {
        const name = entityLabel(row.departmentName, row.name);
        switch (s) {
            case "create": return `Department${name} was created`;
            case "update": return `Department${name} was updated`;
            case "delete": return `Department${name} was deleted`;
            default: return `Department${name} — ${status}`;
        }
    }

    // Payroll > SubDepartment
    if (feature === "SubDepartment" || feature === "Sub department") {
        const name = entityLabel(row.subDepartmentName, row.name);
        switch (s) {
            case "create": return `Sub department${name} was created`;
            case "update": return `Sub department${name} was updated`;
            case "delete": return `Sub department${name} was deleted`;
            default: return `Sub-department${name} — ${status}`;
        }
    }

    // Payroll > Non-Recurring Earning / Deduction
    if (feature === "Non Recurring Earning" || feature === "Non Recurring Deduction") {
        const label = feature === "Non Recurring Deduction" ? "Non-recurring deduction" : "Non-recurring earning";
        const payrun = row.payrunDate
            ? ` for ${boldSubject(formatPayrunDate(String(row.payrunDate)))}`
            : row.payrunId
                ? subjectSuffix(`#${row.payrunId}`)
                : "";
        const ids = row.employeeIds as number[] | undefined;

        const resolvedNames = (ids ?? [])
            .map((id) => employeeNameMap[id])
            .filter(Boolean);
        const allResolved = resolvedNames.length === (ids?.length ?? 0) && resolvedNames.length > 0;

        const empPart = (() => {
            if (allResolved) {
                if (resolvedNames.length === 1) return ` for ${boldSubject(resolvedNames[0])}`;
                if (resolvedNames.length === 2) {
                    return ` for ${boldSubject(resolvedNames[0])} and ${boldSubject(resolvedNames[1])}`;
                }
                const rest = resolvedNames.length - 2;
                return ` for ${boldSubject(resolvedNames[0])}, ${boldSubject(resolvedNames[1])} and ${rest} more`;
            }
            const count = ids?.length ?? 0;
            return count > 0 ? ` for ${count} employee${count > 1 ? "s" : ""}` : "";
        })();

        switch (s) {
            case "add": return `${label} added${empPart} in Payrun${payrun}`;
            case "create": return `${label} created${empPart} in Payrun${payrun}`;
            case "delete": return `${label} removed${empPart} in Payrun${payrun}`;
            default: return `${label}${empPart} — ${status}`;
        }
    }

    // Attendance > Leave Plan
    if (feature === "Leave Plan") {
        const name = entityLabel(row.leavePlanName, row.name);
        switch (s) {
            case "create": return `Leave plan${name} was created`;
            case "update": return `Leave plan${name} was updated`;
            case "delete": return `Leave plan${name} was deleted`;
            default: return `Leave plan${name} — ${status}`;
        }
    }

    // Attendance > Leave Type
    if (feature === "Leave Type") {
        const name = entityLabel(row.leaveTypeName, row.name);
        switch (s) {
            case "create": return `Leave type${name} was created`;
            case "update": return `Leave type${name} was updated`;
            case "delete": return `Leave type${name} was deleted`;
            default: return `Leave type${name} — ${status}`;
        }
    }

    // Attendance > Leave (request / reject / approve)
    if (module === "Attendance" && feature === "Leave") {
        const employeeName = resolveEmployeeDisplayName(row, employeeNameMap);
        const forWho = forEmployee(employeeName);
        const dates = (row.leaveDates ?? row.rejectedDates ?? row.approvedDates) as string[] | undefined;
        const count = dates?.length ?? 0;
        const dayPart = count > 0 ? ` for ${count} day${count > 1 ? "s" : ""}` : "";
        switch (s) {
            case "request": return `Leave${dayPart} was requested${forWho}`;
            case "reject": return `Leave request${dayPart} was rejected${forWho}`;
            case "approve": return `Leave request${dayPart} was approved${forWho}`;
            default: return `Leave${dayPart}${forWho} — ${status}`;
        }
    }

    // Attendance > Approve Regularize Request
    if (feature === "Approve Regularize Request") {
        return "An attendance regularization request was approved";
    }

    // Leave > Apply Leave — use LeaveDates count if available
    if (feature === "Apply Leave") {
        const dates = row.LeaveDates as string[] | undefined;
        const count = dates?.length;
        const dayPart = count ? ` for ${count} day${count > 1 ? "s" : ""}` : "";
        return `A leave request${dayPart} was submitted`;
    }

    // Leave > Approve Leave Request
    if (feature === "Approve Leave Request") {
        return "A leave request was approved";
    }

    // Attendance > Regularize-Attendance
    if (feature === "Regularize-Attendance") {
        if (s === "tasks-update") return "Attendance regularization status was updated";
        if (s === "create") return "An attendance regularization request was submitted";
        return `Attendance regularization — ${status}`;
    }

    // Attendance > Bulk-Regularization
    if (feature === "Bulk-Regularization") {
        switch (s) {
            case "create": return "Bulk attendance regularization was done";
            default: return `Bulk attendance regularization — ${status}`;
        }
    }

    // Attendance > Comp Off
    if (feature === "Comp Off") {
        const name = resolveEmployeeDisplayName(row, employeeNameMap);
        const dates = row.compOffDates as string[] | undefined;
        const count = dates?.length ?? 1;
        return `Comp off${forEmployee(name)} requested for ${count} day${count > 1 ? "s" : ""}`;
    }

    // Payroll > LOP
    if (feature === "LOP") {
        const payrun = row.payrunDate
            ? ` for ${boldSubject(formatPayrunDate(String(row.payrunDate)))}`
            : row.payrunId
                ? subjectSuffix(`#${row.payrunId}`)
                : "";
        const ids = row.employeeIds as number[] | undefined;
        const lopDays = row.lopDays ? ` (${row.lopDays} day${Number(row.lopDays) > 1 ? "s" : ""})` : "";

        if (s === "add") {
            const resolvedNames = (ids ?? [])
                .map((id) => employeeNameMap[id])
                .filter(Boolean);
            const allResolved = resolvedNames.length === (ids?.length ?? 0) && resolvedNames.length > 0;

            if (allResolved) {
                if (resolvedNames.length === 1) {
                    return `LOP${lopDays} added for ${boldSubject(resolvedNames[0])} in Payrun${payrun}`;
                }
                if (resolvedNames.length === 2) {
                    return `LOP${lopDays} added for ${boldSubject(resolvedNames[0])} and ${boldSubject(resolvedNames[1])} in Payrun${payrun}`;
                }
                const rest = resolvedNames.length - 2;
                return `LOP${lopDays} added for ${boldSubject(resolvedNames[0])}, ${boldSubject(resolvedNames[1])} and ${rest} more in Payrun${payrun}`;
            }
            const count = ids?.length ?? 0;
            return `LOP${lopDays} added for ${count} employee${count > 1 ? "s" : ""} in Payrun${payrun}`;
        }

        if (s === "remove") {
            const resolvedNames = (ids ?? [])
                .map((id) => employeeNameMap[id])
                .filter(Boolean);
            const allResolved = resolvedNames.length === (ids?.length ?? 0) && resolvedNames.length > 0;

            if (allResolved) {
                if (resolvedNames.length === 1) return `LOP removed for ${boldSubject(resolvedNames[0])}`;
                if (resolvedNames.length === 2) {
                    return `LOP removed for ${boldSubject(resolvedNames[0])} and ${boldSubject(resolvedNames[1])}`;
                }
                const rest = resolvedNames.length - 2;
                return `LOP removed for ${boldSubject(resolvedNames[0])}, ${boldSubject(resolvedNames[1])} and ${rest} more`;
            }
            const count = ids?.length ?? 0;
            return `LOP removed for ${count} employee${count > 1 ? "s" : ""}`;
        }

        return `LOP — ${status}`;
    }

    // Payroll > Non-Recurring Earning
    if (feature === "Non Recurring Earning") {
        const payrun = row.payrunDate
            ? ` for ${boldSubject(formatPayrunDate(String(row.payrunDate)))}`
            : row.payrunId
                ? subjectSuffix(`#${row.payrunId}`)
                : "";
        const ids = row.employeeIds as number[] | undefined;
        const count = ids?.length ?? 0;
        const empPart = count > 0 ? ` for ${count} employee${count > 1 ? "s" : ""}` : "";
        switch (s) {
            case "add": return `Non-recurring earning added${empPart} in Payrun${payrun}`;
            case "create": return `Non-recurring earning created${empPart} in Payrun${payrun}`;
            case "delete": return `Non-recurring earning removed${empPart} in Payrun${payrun}`;
            default: return `Non-recurring earning${empPart} — ${status}`;
        }
    }
    // Payroll > PaySlip Template
    if (feature === "PaySlip Template") {
        const name = entityLabel(row.payslipTemplateName, row.templateName, row.name);
        switch (s) {
            case "create": return `Payslip template${name} was created`;
            case "update": return `Payslip template${name} was updated`;
            case "delete": return `Payslip template${name} was deleted`;
            case "default": return `Payslip template${name} was set as default`;
            default: return `Payslip template${name} — ${status}`;
        }
    }

    // Payroll > Salary Template
    if (feature === "Salary Template") {
        const name = entityLabel(row.templateName, row.name);
        switch (s) {
            case "create": return `Salary template${name} was created`;
            case "update": return `Salary template${name} was updated`;
            case "delete": return `Salary template${name} was deleted`;
            case "default": return `Salary template${name} was set as default`;
            default: return `Salary template${name} — ${status}`;
        }
    }

    // Timesheet > Project Assign
    if (feature === "Project Assign") {
        const project = entityLabel(row.projectName, row.name);
        const resolvedName = resolveEmployeeDisplayName(row, employeeNameMap);
        const who = resolvedName ? boldSubject(resolvedName) : "An employee";
        switch (s) {
            case "create": return `${who} was assigned to project${project}`;
            case "delete": return `${who} was removed from project${project}`;
            default: return `Project assignment${project} — ${status}`;
        }
    }

    // Employee Documents > Documents Type
    if (feature === "Documents Type") {
        const name = entityLabel(row.employeeDocumentTypeName, row.name);
        switch (s) {
            case "create": return `Document type${name} was created`;
            case "update": return `Document type${name} was updated`;
            case "delete": return `Document type${name} was deleted`;
            default: return `Document type${name} — ${status}`;
        }
    }

    // Organization Documents > Documents Folder
    if (feature === "Documents Folder") {
        const label = entityLabel(row.folderName, row.employeeDocumentFolderName, row.name);
        switch (s) {
            case "create": return `Document folder${label} was created`;
            case "update": return `Document folder${label} was updated`;
            case "delete": return `Document folder${label} was deleted`;
            default: return `Document folder${label} — ${status}`;
        }
    }

    // Attendance > Week Off
    if (feature === "Week Off") {
        const name = entityLabel(row.weekOff, row.name);
        switch (s) {
            case "create": return `Week off${name} was created`;
            case "update": return `Week off${name} was updated`;
            case "delete": return `Week off${name} was deleted`;
            default: return `Week off${name} — ${status}`;
        }
    }

    // Attendance > Holiday Plan
    if (feature === "Holiday Plan") {
        const name = entityLabel(row.planName, row.name);
        switch (s) {
            case "create": return `Holiday plan${name} was created`;
            case "update": return `Holiday plan${name} was updated`;
            case "delete": return `Holiday plan${name} was deleted`;
            default: return `Holiday plan${name} — ${status}`;
        }
    }

    // Attendance > Bulk Regularize (Approve — different from Bulk-Regularization Create)
    if (feature === "Bulk Regularize") {
        switch (s) {
            case "approve": return "Bulk attendance regularization was approved";
            case "create": return "Bulk attendance regularization was done";
            default: return `Bulk attendance regularization — ${status}`;
        }
    }

    // Apps > [Feature] — Enable / Disable
    if (module === "Apps") {
        const appName = humanize(feature);
        switch (s) {
            case "enable": return `${boldSubject(appName)} app was enabled`;
            case "disable": return `${boldSubject(appName)} app was disabled`;
            default: return `${boldSubject(appName)} app — ${status}`;
        }
    }

    // Settings > User Management — Invite / Delete
    if (module === "Settings" && feature === "User Management") {
        const displayName = row.displayName ? boldSubject(String(row.displayName)) : "User";
        const identifier = row.username ? ` (${row.username})` : "";
        const role = row.role ? ` with role ${boldSubject(String(row.role))}` : "";
        switch (s) {
            case "invite":
                return `${displayName}${identifier}${role} was invited to company`;
            case "delete":
                return `${displayName}${identifier} was removed from company`;
            default:
                return `${displayName}${identifier} — ${status}`;
        }
    }

    // Settings > Invoice PDF Template — Default
    if (feature === "Invoice PDF Template") {
        const name = entityLabel(row.templateName, row.name);
        switch (s) {
            case "default": return `Invoice PDF template${name} was set as default`;
            case "create": return `Invoice PDF template${name} was created`;
            case "update": return `Invoice PDF template${name} was updated`;
            case "delete": return `Invoice PDF template${name} was deleted`;
            default: return `Invoice PDF template${name} — ${status}`;
        }
    }

    // Settings > Slack Integration
    if (feature === "Slack URL") {
        switch (s) {
            case "create": return "Slack integration was added";
            case "update": return "Slack integration was updated";
            case "delete": return "Slack integration was removed";
            default: return `Slack integration — ${status}`;
        }
    }

    // Expenses > Expense Claim
    if (feature === "Expense Claim") {
        const title = entityLabel(row.expense_claim_title, row.name);
        switch (s) {
            case "create": return `Expense claim${title} was submitted`;
            case "approve": return `Expense claim${title} was approved`;
            case "reject": return `Expense claim${title} was rejected`;
            default: return `Expense claim${title} — ${status}`;
        }
    }

    // Attendance > Compensatory Credit
    if (feature === "Compensatory Credit") {
        const dates = row.rejectedDates as string[] | undefined;
        const count = dates?.length ?? 0;
        const dayPart = count > 0 ? ` for ${count} day${count > 1 ? "s" : ""}` : "";
        switch (s) {
            case "approve": return `Compensatory credit${dayPart} was approved`;
            case "reject": return `Compensatory credit${dayPart} was rejected`;
            default: return `Compensatory credit${dayPart} — ${status}`;
        }
    }

    // Attendance > Regularize (different from Regularize-Attendance)
    if (feature === "Regularize") {
        const dates = row.rejectedDates as string[] | undefined;
        const count = dates?.length ?? 0;
        const dayPart = count > 0 ? ` for ${count} day${count > 1 ? "s" : ""}` : "";
        const singleDate = row.regularize_date
            ? ` for ${formatActivityDate(row.regularize_date as string)}`
            : "";
        switch (s) {
            case "approve": return `Attendance regularization${dayPart} was approved`;
            case "reject": return `Attendance regularization${dayPart} was rejected`;
            case "create": return `Attendance regularization request was submitted`;
            case "request": return `Attendance regularization${singleDate} was requested`;
            default: return `Attendance regularization${dayPart} — ${status}`;
        }
    }

    // Employee module > Exit
    if (module === "Employee" && feature === "Exit") {
        const name = resolveEmployeeDisplayName(row, employeeNameMap);
        const forWho = forEmployee(name);
        const initiatedDate = row.exitInitiatedDate
            ? ` on ${formatActivityDate(row.exitInitiatedDate as string)}`
            : "";

        switch (s) {
            case "initiated":
                return `Exit process${forWho} was initiated${initiatedDate}`;

            case "revert":
                return `Exit initiation${forWho} was reverted`;

            case "review": {
                const reviewOutcome = (row.reviewStatus as string | undefined)?.toLowerCase();
                const reviewedDate = row.exitRequestReviewedDate
                    ? ` on ${formatActivityDate(row.exitRequestReviewedDate as string)}`
                    : "";
                if (reviewOutcome === "approved") return `Exit review${forWho} was approved${reviewedDate}`;
                if (reviewOutcome === "rejected") return `Exit review${forWho} was rejected${reviewedDate}`;
                return `Exit review${forWho} was submitted`;
            }
            default:
                return `Exit${forWho} — ${status}`;
        }
    }

    // Salary Template — bulk create case
    if (feature === "Salary Template") {
        const isBulk = row.isBulk;
        const templateData = row.templateData as { templateName: string }[] | undefined;
        if (isBulk && templateData?.length) {
            const count = templateData.length;
            return `${count} salary template${count > 1 ? "s" : ""} were created`;
        }
        const name = entityLabel(row.templateName, row.name);
        switch (s) {
            case "create": return `Salary template${name} was created`;
            case "update": return `Salary template${name} was updated`;
            case "delete": return `Salary template${name} was deleted`;
            case "default": return `Salary template${name} was set as default`;
            default: return `Salary template${name} — ${status}`;
        }
    }

    // ---- General path ----

    const featureLabel = resolveFeatureLabel(feature);
    const employeeName = resolveEmployeeDisplayName(row, employeeNameMap);
    const subject = employeeName
        ? `${featureLabel}${forEmployee(employeeName)}`
        : entityName
            ? `${feature} ${boldSubject(entityName)}`
            : featureLabel;

    switch (s) {
        case "create": return `${subject} was created`;
        case "update": return `${subject} was updated`;
        case "edit": return `${subject} was updated`;
        case "delete": return `${subject} was deleted`;
        case "approve": return `${subject} was approved`;
        case "reject": return `${subject} was rejected`;
        case "invite": return `A user was invited via ${feature}`;
        case "remove": return `${subject} was removed`;
        case "requested": return `${subject} was submitted`;
        case "payment": return `Payment was initiated for ${subject}`;
        case "delete payment": return `Payment for ${subject} was deleted`;
        case "download": return `${subject} was downloaded`;
        case "export": {
            const format = row.format ? ` (${row.format})` : "";
            return `${subject} export${format} was initiated`;
        }
        case "bulk_approve": return `Bulk approval performed on ${subject}`;
        default: return `${status} action on ${subject}`;
    }
};

/** Collect numeric ids that may need employee/draft name resolution for the activity table. */
export const collectActivityEmployeeIds = (rows: ActivityItem[]): number[] => {
    const ids = new Set<number>();

    rows.forEach((row) => {
        const id = parseEmployeeId(row);
        if (id != null) ids.add(id);

        if (Array.isArray(row.employeeIds)) {
            (row.employeeIds as number[]).forEach((empId) => {
                if (typeof empId === "number") ids.add(empId);
            });
        }

        if (isDraftActivityRow(row) && typeof row.draftId === "number") {
            ids.add(row.draftId);
        }
    });

    return Array.from(ids);
};

export const collectDraftActivityEmployeeIds = (rows: ActivityItem[]): number[] => {
    const ids = new Set<number>();
    rows.forEach((row) => {
        if (!isDraftActivityRow(row)) return;
        const id = parseEmployeeId(row);
        if (id != null) ids.add(id);
        if (typeof row.draftId === "number") ids.add(row.draftId);
    });
    return Array.from(ids);
};

/** Whether a row should prefer draft API for name resolution. */
export const isDraftActivityRow = (row: ActivityItem): boolean =>
    isDraftFeature(humanize(row.feature));
