import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
  Typography,
  Divider,
  IconButton,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { DatePickerElement } from "../../../../../../components/atom/date-picker";
import { ToggleSwitch } from "../../../../../../components/atom/toggle-switch/ToggleSwitch";
import { PrimaryButton, PrimaryIconButton } from "../../../../../../components/atom/button";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import {
  useGetAllDepartmentsQuery,
  useCreateDepartmentMutation,
} from "../../department/api/department.api";
import { useLazyGetAllSubDepartmentsByDepartmentIdQuery } from "../../department/sub-department/api/sub-department.api";
import {
  useGetAllDesignationsQuery,
  useCreateDesignationMutation,
} from "../../designation/api/designation.api";
import type {
  SalaryTemplateDetail,
  TemplateEarningItem,
  TemplateDeductionItem,
} from "../../../../salary/structure/SalaryTemplate/api/salaryTemplate.api";
import { useGetAllSalaryTemplatesQuery } from "../../../../salary/structure/SalaryTemplate/api/salaryTemplate.api";
import {
  SalaryTemplatePreviewModal,
  type RecalculatedAmounts,
  type SalaryPreviewPayload,
} from "../../../../salary/structure/SalaryTemplate/components/SalaryTemplatePreviewModal";
import {
  buildPayrollLinesFromTemplateDetail,
  catalogSalaryTemplateToDetail,
  hasEarningsStructureDrift,
} from "../../../../salary/structure/SalaryTemplate/components/salaryTemplatePreviewUtils";
import { useGetShiftsQuery } from "../../../../time/shifts/api/shifts.api";
import { useGetAllWeekOffsQuery } from "../../../../time/weekoffs/api/weekoffs.api";
import { useGetLeavePlansQuery } from "../../../../time/leaves/api/leavePlan.api";
import { useGetHolidayPlansQuery } from "../../../../time/holiday-plan/api/holidayPlan.api";
import { useGetExpensePoliciesQuery } from "../../../expense/policy/api/expensePolicy.api";
import {
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useGetNextEmployeeIdQuery,
  useGetEmployeeSalaryTemplatePreviewQuery,
  useCreateEmployeeDraftMutation,
  useUpdateEmployeeDraftMutation,
  useGetEmployeeDraftByIdQuery,
  useDeleteEmployeeDraftMutation,
  isEmployeeDraft,
} from "../api/directory.api";
import { useGetIncomeTaxesQuery } from "../../../../salary/payrun/settings/IncomeTax/api/incometax.api";
import { useEmployees } from "../../../../hooks/useEmployees";
import type {
  EmployeeSalaryTemplatePreview,
  EmployeeSalaryTemplatePreviewDeduction,
  EmployeeSalaryTemplatePreviewEarning,
} from "../api/directory.api";
import {
  useEditContactMutation,
  useRegisterContactMutation,
} from "../../../../../books/coa/contact/api/contact.api";
import type {
  IContactRegister,
  IContactResponse,
} from "../../../../../books/coa/contact/types/contact.types";
import AddContactForm from "../../../../../books/coa/contact/dialog/ContactForm";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import {
  type CreateEmployeeDto,
  type UpdateEmployeeDto,
  type Employee,
  getPayrollSalaryTemplateCatalogId,
  getPayrollSalaryTemplateCatalogIdString,
  type CreateEmployeeDraftDto,
  type EmployeeContact,
  getDepartmentId,
  getDesignationId,
} from "../types/employee.types";
import { buildDirectoryHomePath } from "../utils/directoryTableHighlight";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import { useAllAccountOptions } from "../../../../../books/transact/transactHome/hooks/useAllAccountOptions";
import { useSnackbar } from "../../../../../../context/SnackbarContext";
import { PhoneInputAtom } from "../../../../../../components/phoneInput/PhoneInputAtom";
import { useGetEmployeeIdPrefixQuery } from "../../settings/EmpIdGeneration/api/empidgen.api";
import type { EmployeeIdPrefixResponse } from "../../settings/EmpIdGeneration/types/empidgen.types";
import { Drafts } from "@mui/icons-material";

const EMPLOYEE_TYPE_OPTIONS = [
  { label: "Permanent", value: "permanent" },
  { label: "Intern", value: "intern" },
];

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Others", value: "others" },
];

// TODO: integrate when API is ready
// const EXPENSE_POLICY_OPTIONS: { label: string; value: string }[] = [];

function monthlyAmountString(v: string | number | undefined): string {
  if (typeof v === "number") return String(v);
  return v != null && String(v) !== "" ? String(v) : "0";
}

function getEmployeeSeriesPrefixes(data: EmployeeIdPrefixResponse | undefined) {
  const apiData = Array.isArray(data?.data) ? data.data : [];
  return apiData.reduce<{ permanent: string; intern: string }>(
    (acc, curr: { seriesName?: string; seriesPrefix?: string }) => {
      if (curr.seriesName === "permanent") acc.permanent = curr.seriesPrefix ?? "";
      if (curr.seriesName === "intern") acc.intern = curr.seriesPrefix ?? "";
      return acc;
    },
    { permanent: "", intern: "" },
  );
}

function hasEmployeeSeriesForType(
  prefixes: { permanent: string; intern: string },
  type: string,
): boolean {
  const normalized = type.trim().toLowerCase() || "permanent";
  const prefix =
    normalized === "intern" ? prefixes.intern : prefixes.permanent;
  return !!prefix.trim();
}

/** Map preview earning row — full `earning` relation or flat template-only line from API. */
function mapPreviewEarningRow(row: EmployeeSalaryTemplatePreviewEarning): TemplateEarningItem {
  const monthly = monthlyAmountString(row.monthlyAmount);
  const e = row.earning;
  if (e != null) {
    return {
      id: row.id,
      earning: {
        id: e.id,
        earningName: e.earningName,
        nameInPayslip: e.nameInPayslip,
        calculationType: e.calculationType,
        amount: e.amount,
        percentage: e.percentage,
        percentageOf: e.percentageOf,
      },
      monthlyAmount: monthly,
      payslipOrder: row.payslipOrder ?? 0,
    };
  }
  const flatLabel =
    row.earningName?.trim() ||
    row.name?.trim() ||
    (row.payslipOrder != null ? `Earning ${row.payslipOrder}` : "");
  return {
    id: row.id,
    earning: {
      id: row.id,
      earningName: flatLabel || `ID ${row.id}`,
      calculationType: "amount",
      amount: monthly,
      percentage: null,
      percentageOf: null,
    },
    monthlyAmount: monthly,
    payslipOrder: row.payslipOrder ?? 0,
  };
}

/** Map preview deduction row — full `deduction` relation or flat template-only line from API. */
function mapPreviewDeductionRow(row: EmployeeSalaryTemplatePreviewDeduction): TemplateDeductionItem {
  const monthly = monthlyAmountString(row.monthlyAmount);
  const d = row.deduction;
  if (d != null) {
    return {
      id: row.id,
      deduction: {
        id: d.id,
        deductionName: d.deductionName,
        nameInPayslip: d.nameInPayslip,
        calculationType: d.calculationType,
        amount: d.amount,
        percentage: d.percentage ?? null,
        percentageOf: d.percentageOf ?? null,
      },
      monthlyAmount: monthly,
      payslipOrder: row.payslipOrder ?? 0,
    };
  }
  const flatLabel =
    row.deductionName?.trim() ||
    row.name?.trim() ||
    (row.payslipOrder != null ? `Deduction ${row.payslipOrder}` : "");
  return {
    id: row.id,
    deduction: {
      id: row.id,
      deductionName: flatLabel || `ID ${row.id}`,
      calculationType: "amount",
      amount: monthly,
      percentage: null,
      percentageOf: null,
    },
    monthlyAmount: monthly,
    payslipOrder: row.payslipOrder ?? 0,
  };
}

/** Normalize employee salary template preview to SalaryTemplateDetail for use in payload and modal. Uses root annualGross/monthlyGross (employee's assigned values). */
function normalizeEmployeeSalaryPreview(
  raw: EmployeeSalaryTemplatePreview,
): SalaryTemplateDetail | null {
  const template = raw.initialTemplate;
  if (!template) return null;

  /** Prefer employee assignment lines; amounts shown are always from these rows when non-empty. */
  let earnings =
    raw.employeeEarnings != null && raw.employeeEarnings.length > 0
      ? raw.employeeEarnings
      : ((template.earnings ?? []) as EmployeeSalaryTemplatePreviewEarning[]);
  let deductions =
    raw.employeeDeductions != null && raw.employeeDeductions.length > 0
      ? raw.employeeDeductions
      : ((template.deductions ?? []) as EmployeeSalaryTemplatePreviewDeduction[]);

  const earningsMapped: TemplateEarningItem[] = earnings.map(mapPreviewEarningRow);
  const deductionsMapped: TemplateDeductionItem[] = deductions.map(mapPreviewDeductionRow);
  const annualGross =
    raw.annualGross != null && raw.annualGross !== ""
      ? String(raw.annualGross)
      : template.annualGross != null
        ? String(template.annualGross)
        : "0";
  const monthlyGross =
    raw.monthlyGross != null && raw.monthlyGross !== ""
      ? String(raw.monthlyGross)
      : template.monthlyGross != null
        ? String(template.monthlyGross)
        : "0";
  return {
    id: template.id,
    templateName: template.templateName ?? "",
    description: template.description ?? "",
    annualGross,
    monthlyGross,
    earnings: earningsMapped,
    deductions: deductionsMapped,
  };
}

/** Display name for an employee (contact name or employeeId) */
function getEmployeeDisplayName(emp: Employee): string {
  const c = emp.contact;
  if (c?.name) return c.name;
  const parts = [c?.firstName, c?.middleName, c?.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return emp.employeeId ?? `Employee #${emp.id}`;
}

type ReportingManagerSource = {
  id?: number;
  reportingTo?: number | null;
  reportingToName?: string | null;
  reportingToEmployee?: Employee["reportingToEmployee"] | null;
};

/** Map API edit/draft fields → reporting manager select value (`self` | employee id | empty). */
function resolveReportingManagerSelectValue(
  source: ReportingManagerSource,
  employeesList: Employee[],
): string {
  const selfId = source.id;
  const nestedId = source.reportingToEmployee?.id;
  const flatId = source.reportingTo;

  const managerId =
    nestedId != null && nestedId > 0
      ? nestedId
      : flatId != null && flatId > 0
        ? flatId
        : null;

  if (managerId != null) {
    if (selfId != null && managerId === selfId) return "self";
    return String(managerId);
  }

  const name = source.reportingToName?.trim();
  if (!name) return "";

  const match = employeesList.find((e) => {
    if (isEmployeeDraft(e)) return false;
    return getEmployeeDisplayName(e).toLowerCase() === name.toLowerCase();
  });
  if (match?.id != null) {
    if (selfId != null && match.id === selfId) return "self";
    return String(match.id);
  }
  return "";
}

/** Map employee / books contact to ContactForm edit payload */
function contactToRegister(
  contact: EmployeeContact | IContactResponse,
  workEmailFallback?: string | null,
): IContactRegister {
  const c = contact as EmployeeContact & Partial<IContactResponse>;
  return {
    name: (c.name ?? c.firstName ?? "").trim(),
    middleName: c.middleName ?? "",
    lastName: c.lastName ?? "",
    email: c.email ?? workEmailFallback ?? "",
    phoneNumber: c.phoneNumber ?? "",
    dialCode: c.dialCode ?? "91",
    addressLine1: c.addressLine1 ?? "",
    addressLine2: c.addressLine2 ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    country: c.country ?? "",
    pincode: c.pincode ?? "",
    pan: c.pan ?? "",
    gstin: c.gstin ?? "",
    economicTerritory: c.economicTerritory ?? "",
    tdsPrefillValue:
      c.tdsPrefillValue != null && Number(c.tdsPrefillValue) !== 0
        ? Number(c.tdsPrefillValue)
        : 0,
    isOrganization: Boolean(c.isOrganization),
  };
}

function applyContactFieldsToEmployeeForm(
  contact: Pick<
    IContactResponse,
    "middleName" | "lastName" | "email" | "phoneNumber" | "dialCode" | "pan"
  >,
  setters: {
    setMiddleName: (v: string) => void;
    setLastName: (v: string) => void;
    setWorkEmail: (v: string) => void;
    setMobileNo: (v: string) => void;
    setDialCode: (v: string) => void;
    setPanNumber: (v: string) => void;
    setCountryCode: (v: string) => void;
  },
) {
  if (contact.middleName != null && contact.middleName !== "") {
    setters.setMiddleName(contact.middleName);
  }
  if (contact.lastName != null && contact.lastName !== "") {
    setters.setLastName(contact.lastName);
  }
  if (contact.email) setters.setWorkEmail(contact.email);
  if (contact.phoneNumber != null && contact.phoneNumber !== "") {
    setters.setMobileNo(contact.phoneNumber);
  }
  if (contact.dialCode) {
    setters.setDialCode(contact.dialCode);
    const dialCodeToCountry: Record<string, string> = {
      "91": "in",
      "1": "us",
      "44": "gb",
    };
    setters.setCountryCode(dialCodeToCountry[contact.dialCode] || "in");
  }
  if (contact.pan != null && contact.pan !== "") {
    setters.setPanNumber(contact.pan);
  }
}

// TODO: integrate when API is ready
// const INCOME_TAX_CONFIG_OPTIONS: { label: string; value: string }[] = [];

/** PF account number: 2 letters + 3–5 letters + 7 digits + 0–3 digits + 7 digits (no slashes in API) */
const PF_BACKEND_REGEX = /^[A-Z]{2}[A-Z]{3,5}\d{7}\d{0,3}\d{7}$/;
/** UI format with slashes: aa/aaa/1234567/890/8765432 (2, 3, 7, 3, 7) */
const PF_ACCOUNT_LENGTHS = [2, 3, 7, 3, 7] as const;
const PF_ACCOUNT_PLACEHOLDER = "aa/aaa/1234567/890/8765432";
const PF_ACCOUNT_MAX_LEN = PF_ACCOUNT_LENGTHS.reduce((a, b) => a + b, 0);

function formatPFAccountNumber(input: string): string {
  const raw = input.replace(/\//g, "").slice(0, PF_ACCOUNT_MAX_LEN);
  let pos = 0;
  const parts: string[] = [];
  for (let seg = 0; seg < PF_ACCOUNT_LENGTHS.length; seg++) {
    const len = PF_ACCOUNT_LENGTHS[seg];
    const segmentRaw = raw.slice(pos, pos + len);
    const isLetterSegment = seg < 2;
    const part = isLetterSegment
      ? segmentRaw.replace(/[^a-zA-Z]/g, "")
      : segmentRaw.replace(/[^0-9]/g, "");
    parts.push(part.slice(0, len));
    pos += len;
  }
  return parts.filter(Boolean).join("/");
}

/** Normalize PF for API: no slashes, uppercase (matches backend DTO regex) */
function normalizePFForApi(pf: string): string {
  return pf.replace(/\//g, "").toUpperCase();
}

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

interface AddEmployeePageProps {
  /** When false, hides the page title (e.g. when used inside AddEmployeeLayoutPage) */
  showTitle?: boolean;
  /** Required by backend – pass when available from contact creation or picker */
  contactId?: number;
  /** When provided, form is in edit mode: prefilled and some fields disabled */
  initialData?: Employee;
  /** Edit mode: use PATCH and disable first name, work email, employee type, employee ID, shift type */
  isEditMode?: boolean;
}

export default function AddEmployeePage({
  showTitle = true,
  contactId: contactIdProp = 0,
  initialData,
  isEditMode = false,
}: AddEmployeePageProps) {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [searchParams] = useSearchParams();
  const draftIdNumber = searchParams.get("draftId");
  const saveDraftRef = useRef<(() => void) | null>(null);

  const [createEmployee, { isLoading: isCreating }] =
    useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] =
    useUpdateEmployeeMutation();
  const { data } = useGetEmployeeDraftByIdQuery(
    Number(draftIdNumber),
    { skip: !draftIdNumber }
  );
  const [registerContact] = useRegisterContactMutation();
  const [editContact] = useEditContactMutation();
  const [createDepartment] = useCreateDepartmentMutation();
  const [createDesignation] = useCreateDesignationMutation();
  const [createDraft] = useCreateEmployeeDraftMutation();
  const [updateDraft] = useUpdateEmployeeDraftMutation();
  const [deleteDraft] = useDeleteEmployeeDraftMutation();

  const [draftId, setDraftId] = useState<number | null>(null);
  const [draftAnnualGross, setDraftAnnualGross] = useState<string | null>(null);
  const isSubmitting = isCreating || isUpdating;
  /** Edit mode: lock DOJ when employee has already been included in a pay run. */
  const isDateOfJoiningLocked =
    isEditMode && Boolean(initialData?.existsInPayRun);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "info" });
  const [openAddContactModal, setOpenAddContactModal] = useState(false);
  const [openEditContactModal, setOpenEditContactModal] = useState(false);
  const [openAddDepartmentModal, setOpenAddDepartmentModal] = useState(false);
  const [openAddDesignationModal, setOpenAddDesignationModal] = useState(false);
  const [openSalaryTemplatePreviewModal, setOpenSalaryTemplatePreviewModal] =
    useState(false);
  const [lastSalaryPreview, setLastSalaryPreview] = useState<{
    templateId: string;
    annualGross: number;
    recalculated: RecalculatedAmounts;
  } | null>(null);
  const [lastSalaryPayload, setLastSalaryPayload] =
    useState<SalaryPreviewPayload | null>(null);
  /** Catalog template applied via preview Save (no gross override) */
  const [acceptedCatalogTemplate, setAcceptedCatalogTemplate] =
    useState<SalaryTemplateDetail | null>(null);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDesignationName, setNewDesignationName] = useState("");

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [employeeId, setEmployeeId] = useState(""); // Prefill from backend when available
  const [workEmail, setWorkEmail] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState<Dayjs | null>(null);
  const [gender, setGender] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [subDepartmentId, setSubDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [expensePolicyId, setExpensePolicyId] = useState("");
  const [reportingManagerId, setReportingManagerId] = useState("");

  // Step 2
  const [enablePayroll, setEnablePayroll] = useState(false);
  const [salaryTemplateId, setSalaryTemplateId] = useState("");
  const [incomeTaxConfigId, setIncomeTaxConfigId] = useState("");
  const [enablePf, setEnablePf] = useState(false);
  const [inProbation, setInProbation] = useState(false);
  const [probationEndDate, setProbationEndDate] = useState<Dayjs | null>(null);
  const [pfAccountNumber, setPfAccountNumber] = useState("");
  const [uanNumber, setUanNumber] = useState("");
  const [enableAttendance, setEnableAttendance] = useState(false);
  const [shiftId, setShiftId] = useState("");
  const [weekOffPolicyId, setWeekOffPolicyId] = useState("");
  const [leavePlanId, setLeavePlanId] = useState("");
  const [holidayPlanId, setHolidayPlanId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Dayjs | null>(null);
  const [panNumber, setPanNumber] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [dialCode, setDialCode] = useState("91");
  const [countryCode, setCountryCode] = useState("in");

  /** Required by backend – from selected contact (First name dropdown) or props */
  const contactId = firstName ? Number(firstName) : contactIdProp;

  // APIs
  const { data: departmentResponse } = useGetAllDepartmentsQuery();
  const [fetchSubDepartments] =
    useLazyGetAllSubDepartmentsByDepartmentIdQuery();
  const [subDepartmentsByDept, setSubDepartmentsByDept] = useState<
    Record<number, { id: number; subDepartmentName: string }[]>
  >({});
  const { data: designationResponse } = useGetAllDesignationsQuery();

  /** Fetch sub-departments for each department (one by one by id) */
  useEffect(() => {
    const list = departmentResponse?.data ?? [];
    if (list.length === 0) return;
    list.forEach((dep) => {
      fetchSubDepartments(dep.id)
        .then((res: any) => {
          const body = res?.data;
          const subs = Array.isArray(body) ? body : (body?.data ?? []);
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
  }, [departmentResponse?.data]);

  useEffect(() => {
    if (!draftIdNumber || !data?.data) {
      setDraftId(null);
      return;
    }

    const draft = data.data;

    setDraftId(null);

    setFirstName(draft.contactId ? String(draft.contactId) : "");
    setMiddleName(draft.middleName ?? "");
    setLastName(draft.lastName ?? "");
    if (draft.employeeId?.trim()) {
      setEmployeeId(draft.employeeId.trim());
    }
    setEmployeeType(draft.employeeType?.toLowerCase() ?? "");
    setWorkEmail(draft.workEmail ?? "");
    setGender(draft.gender?.toLowerCase() ?? "");
    setDateOfJoining(draft.dateOfJoining ? dayjs(draft.dateOfJoining) : null);
    setDateOfBirth(draft.dateOfBirth ? dayjs(draft.dateOfBirth) : null);
    setDepartmentId(draft.departmentId ? String(draft.departmentId) : "");
    setDesignationId(draft.designationId ? String(draft.designationId) : "");
    setExpensePolicyId(draft.expensePolicyId ? String(draft.expensePolicyId) : "");
    setSalaryTemplateId(draft.salaryTemplateId ? String(draft.salaryTemplateId) : "");
    setIncomeTaxConfigId(draft.incomeTaxConfigId ? String(draft.incomeTaxConfigId) : "");
    setEnablePf(!!draft.pfEnabled);
    setUanNumber(draft.uanNumber ?? "");
    setPfAccountNumber(draft.pfAccountNumber ?? "");
    setEnablePayroll(!!(draft.salaryTemplateId || draft.incomeTaxConfigId));
    setEnableAttendance(!!(draft.shiftId || draft.weekoffId || draft.leavePlanId || draft.holidayPlanId));
    setInProbation(!!draft.probationEndDate);
    setProbationEndDate(draft.probationEndDate ? dayjs(draft.probationEndDate) : null);
    setShiftId(draft.shiftId ? String(draft.shiftId) : "");
    setWeekOffPolicyId(draft.weekoffId ? String(draft.weekoffId) : "");
    setLeavePlanId(draft.leavePlanId ? String(draft.leavePlanId) : "");
    setHolidayPlanId(draft.holidayPlanId ? String(draft.holidayPlanId) : "");
    setMobileNo(draft.mobileNumber ?? "");
    setPanNumber(draft.panNumber ?? "");
    setDraftAnnualGross(draft.annualGross ? String(draft.annualGross) : null);

    setDraftId(draft.id);
  }, [draftIdNumber, data]);

  const { data: salaryTemplatesResponse } = useGetAllSalaryTemplatesQuery(
    undefined,
    {
      skip: activeStep < 1,
    },
  );
  const employeeSalaryPreviewQueryArgs = useMemo(() => {
    const rawTemplateId =
      salaryTemplateId.trim() !== ""
        ? salaryTemplateId
        : isEditMode
          ? (getPayrollSalaryTemplateCatalogId(initialData) ?? 0)
          : 0;
    const initialTemplateId = Number(rawTemplateId);
    const employeeId =
      isEditMode && initialData?.id != null && initialData.id > 0
        ? initialData.id
        : undefined;
    return { initialTemplateId, employeeId };
  }, [
    isEditMode,
    initialData?.id,
    initialData?.template?.id,
    initialData?.template?.initialTemplate?.id,
    salaryTemplateId,
  ]);

  const { data: employeeSalaryPreviewResponse } =
    useGetEmployeeSalaryTemplatePreviewQuery(employeeSalaryPreviewQueryArgs, {
      skip:
        activeStep < 1 ||
        !employeeSalaryPreviewQueryArgs.initialTemplateId ||
        Number.isNaN(employeeSalaryPreviewQueryArgs.initialTemplateId),
    });
  const { data: incomeTaxVersions = [] } = useGetIncomeTaxesQuery(undefined, {
    skip: activeStep < 1,
  });
  const employeeSalaryPreview = useMemo(
    () => employeeSalaryPreviewResponse?.data ?? null,
    [employeeSalaryPreviewResponse],
  );

  const salaryTemplateDetail = useMemo((): SalaryTemplateDetail | undefined => {
    const templateIdNum = Number(salaryTemplateId);
    if (
      acceptedCatalogTemplate &&
      !Number.isNaN(templateIdNum) &&
      acceptedCatalogTemplate.id === templateIdNum
    ) {
      return acceptedCatalogTemplate;
    }
    if (!employeeSalaryPreview) return undefined;
    return normalizeEmployeeSalaryPreview(employeeSalaryPreview) ?? undefined;
  }, [acceptedCatalogTemplate, salaryTemplateId, employeeSalaryPreview]);

  useEffect(() => {
    setAcceptedCatalogTemplate(null);
    setLastSalaryPayload(null);
    setLastSalaryPreview(null);
  }, [salaryTemplateId]);

  const catalogSalaryTemplateDetail = useMemo((): SalaryTemplateDetail | undefined => {
    const templateId = employeeSalaryPreview?.initialTemplate?.id;
    if (templateId == null) return undefined;
    const list = salaryTemplatesResponse?.data ?? [];
    const match = list.find((t) => Number(t.id) === Number(templateId));
    return catalogSalaryTemplateToDetail(match) ?? undefined;
  }, [employeeSalaryPreview?.initialTemplate?.id, salaryTemplatesResponse?.data]);

  const showEarningsRevert = useMemo(() => {
    if (acceptedCatalogTemplate) return false;
    if (!employeeSalaryPreview?.employeeEarnings?.length || !catalogSalaryTemplateDetail) {
      return false;
    }
    return hasEarningsStructureDrift(
      employeeSalaryPreview.employeeEarnings,
      catalogSalaryTemplateDetail.earnings,
    );
  }, [
    acceptedCatalogTemplate,
    employeeSalaryPreview?.employeeEarnings,
    catalogSalaryTemplateDetail,
  ]);

  /** In edit mode, prefill salary template dropdown with id from preview so selected option shows updated info when preview modal is opened */
  useEffect(() => {
    if (!isEditMode || !employeeSalaryPreview?.initialTemplate?.id) return;
    setSalaryTemplateId(String(employeeSalaryPreview.initialTemplate.id));
  }, [isEditMode, employeeSalaryPreview?.initialTemplate?.id]);

  const { data: expensePolicies = [] } = useGetExpensePoliciesQuery();
  const { data: shifts = [] } = useGetShiftsQuery(undefined, {
    skip: activeStep < 1,
  });
  const { data: weekOffsResponse } = useGetAllWeekOffsQuery(undefined, {
    skip: activeStep < 1,
  });
  const { data: leavePlans = [] } = useGetLeavePlansQuery(undefined, {
    skip: activeStep < 1,
  });
  const { data: holidayPlans = [] } = useGetHolidayPlansQuery(undefined, {
    skip: activeStep < 1,
  });
  const { contactsData } = useAllAccountOptions(
    null,
    !isEditMode,
    "full",
    undefined,
    !isEditMode,
  );
  const { data: nextEmployeeIdResponse } = useGetNextEmployeeIdQuery(
    employeeType || "permanent",
    { skip: isEditMode, refetchOnMountOrArgChange: true },
  );
  const { data: empIdPrefixResponse, isError: isEmpIdPrefixError } =
    useGetEmployeeIdPrefixQuery(undefined, {
      skip: isEditMode,
    });
  const employeeSeriesPrefixes = useMemo(
    () => getEmployeeSeriesPrefixes(empIdPrefixResponse),
    [empIdPrefixResponse],
  );
  const hasEmployeeSeries = useMemo(
    () =>
      hasEmployeeSeriesForType(employeeSeriesPrefixes, employeeType),
    [employeeSeriesPrefixes, employeeType],
  );
  const { employees: employeesList } = useEmployees();
  const contactList = contactsData?.data ?? [];
  const firstNameOptions = useMemo(() => {
    return contactList.map((c) => ({
      label: c.name?.trim() || `Contact #${c.id}`,
      value: String(c.id),
    }));
  }, [contactList]);

  const selectedContactForEdit = useMemo((): IContactRegister | null => {
    if (!isEditMode || !contactId) return null;
    const fromList = contactList.find((c) => c.id === contactId);
    if (fromList) {
      return contactToRegister(fromList, workEmail);
    }
    const c = initialData?.contact;
    if (c?.id != null) {
      return contactToRegister(c, workEmail || initialData?.workEmail);
    }
    return null;
  }, [isEditMode, contactId, contactList, initialData?.contact, initialData?.workEmail, workEmail]);

  /** When user selects a contact, prefill fields that have data (name, middle, last, email, phone, PAN) */
  const handleFirstNameChange = (value: string) => {
    setFirstName(value);
    const contact = contactList.find((c) => String(c.id) === value);
    if (!contact) return;
    if (contact.email) setWorkEmail(contact.email);
    if (contact.middleName != null && contact.middleName !== "")
      setMiddleName(contact.middleName);
    if (contact.lastName != null && contact.lastName !== "")
      setLastName(contact.lastName);
    if (contact.phoneNumber != null && contact.phoneNumber !== "")
      setMobileNo(contact.phoneNumber);
    if (contact.dialCode) setDialCode(contact.dialCode);
    if (contact.pan != null && contact.pan !== "") setPanNumber(contact.pan);
  };

  /** Edit contact modal (edit employee): update linked contact and refresh prefilled fields */
  const handleSubmitEditContact = async (data: Partial<IContactRegister>) => {
    if (!contactId) return;
    const res = await editContact({ id: contactId, updateData: data }).unwrap();
    const updated: IContactResponse =
      (res as { data?: IContactResponse }).data ?? (res as IContactResponse);
    setOpenEditContactModal(false);
    applyContactFieldsToEmployeeForm(updated, {
      setMiddleName,
      setLastName,
      setWorkEmail,
      setMobileNo,
      setDialCode,
      setPanNumber,
      setCountryCode,
    });
    showSnackbar("Contact updated successfully.", "success");
    setSnackbar({
      open: true,
      message: "Contact updated successfully.",
      color: "success",
    });
  };

  /** Add contact modal: on save, select the new contact in the dropdown and prefill fields */
  const handleSubmitAddContact = async (data: IContactRegister) => {
    try {
      const res = await registerContact(data).unwrap();
      setOpenAddContactModal(false);
      type ContactShape = {
        id: number;
        middleName?: string;
        lastName?: string;
        email?: string;
        phoneNumber?: string;
        pan?: string;
      };
      const contact: ContactShape =
        (res as { data?: ContactShape }).data ?? (res as ContactShape);
      const {
        id,
        middleName: mn,
        lastName: ln,
        email: em,
        phoneNumber: ph,
        pan: pn,
      } = contact;
      if (id != null) {
        setFirstName(String(id));
        if (mn != null && mn !== "") setMiddleName(mn);
        if (ln != null && ln !== "") setLastName(ln);
        if (em) setWorkEmail(em);
        if (ph != null && ph !== "") setMobileNo(ph);
        if (pn != null && pn !== "") setPanNumber(pn);
      }
      showSnackbar("Contact added successfully.", "success");
      setSnackbar({
        open: true,
        message: "Contact added successfully.",
        color: "success",
      });
    } catch (err: unknown) {
      throw err;
    }
  };

  /** Add department modal: on save, select the new department in the dropdown */
  const handleSaveNewDepartment = async () => {
    if (!newDepartmentName.trim()) return;
    try {
      const res = await createDepartment({
        departmentName: newDepartmentName.trim(),
      }).unwrap();
      setOpenAddDepartmentModal(false);
      setNewDepartmentName("");
      console.log(res)
      if (res?.data?.id != null) setDepartmentId(String(res.data.id));
      showSnackbar("Department added successfully.", "success");
      setSnackbar({
        open: true,
        message: "Department added successfully.",
        color: "success",
      });
    } catch (err: any) {
      const deptErrMsg = err?.data?.message ?? err?.error ?? err?.message ?? "Failed to add department.";
      showSnackbar(deptErrMsg, "error");
      setSnackbar({ open: true, message: deptErrMsg, color: "error" });
    }
  };

  /** Add designation modal: on save, select the new designation in the dropdown */
  const handleSaveNewDesignation = async () => {
    if (!newDesignationName.trim()) return;
    try {
      const res = await createDesignation({
        designationName: newDesignationName.trim(),
      }).unwrap();
      setOpenAddDesignationModal(false);
      setNewDesignationName("");
      if (res?.data?.id != null) setDesignationId(String(res.data.id));
      showSnackbar("Designation added successfully.", "success");
      setSnackbar({
        open: true,
        message: "Designation added successfully.",
        color: "success",
      });
    } catch (err: any) {
      const desigErrMsg = err?.data?.message ?? err?.error ?? err?.message ?? "Failed to add designation.";
      showSnackbar(desigErrMsg, "error");
      setSnackbar({ open: true, message: desigErrMsg, color: "error" });
    }
  };

  /** No series configured (e.g. after company switch) — clear stale auto-generated ID */
  useEffect(() => {
    if (isEditMode || !isEmpIdPrefixError) return;
    setEmployeeId("");
  }, [isEditMode, isEmpIdPrefixError]);

  /** Prefill Employee ID when series exists and next_employee_id API returns */
  useEffect(() => {
    if (isEditMode || !hasEmployeeSeries) return;

    const draftSavedId = data?.data?.employeeId?.trim();
    if (draftIdNumber && draftSavedId) return;

    const nextId = nextEmployeeIdResponse?.data?.nextEmployeeId;
    if (!nextId) return;

    setEmployeeId(nextId);
    if (!draftIdNumber) {
      setEmployeeType((prev) => prev || "permanent");
    }
  }, [
    isEditMode,
    draftIdNumber,
    data?.data?.employeeId,
    hasEmployeeSeries,
    nextEmployeeIdResponse?.data?.nextEmployeeId,
  ]);

  /** Prefill form when editing (initialData set) */
  useEffect(() => {
    if (!initialData || !isEditMode) return;
    const c = initialData.contact;
    setFirstName(c?.id != null ? String(c.id) : "");
    setMiddleName(c?.middleName ?? "");
    setLastName(c?.lastName ?? "");
    setEmployeeType(initialData.employeeType ?? "");
    setEmployeeId(initialData.employeeId ?? "");
    setWorkEmail(initialData.workEmail ?? c?.email ?? "");
    setMobileNo(c?.phoneNumber ?? "");
    setDialCode(c?.dialCode ?? "91");

    const dialCodeToCountry: Record<string, string> = {
      "91": "in",
      "1": "us",
      "44": "gb",
    };

    setCountryCode(dialCodeToCountry[c?.dialCode ?? ""] || "in");
    setDateOfJoining(
      initialData.dateOfJoining ? dayjs(initialData.dateOfJoining) : null,
    );
    setGender(initialData.gender?.toLowerCase() ?? "");
    setDepartmentId(getDepartmentId(initialData) != null ? String(getDepartmentId(initialData)) : "");
    setSubDepartmentId(
      initialData.subDepartment?.id != null
        ? String(initialData.subDepartment.id)
        : "",
    );
    setDesignationId(getDesignationId(initialData) != null ? String(getDesignationId(initialData)) : "");
    setExpensePolicyId(
      (initialData as { expensePolicy?: { id: number } }).expensePolicy?.id !=
        null
        ? String(
          (initialData as { expensePolicy?: { id: number } }).expensePolicy!
            .id,
        )
        : "",
    );
    setEnablePayroll(initialData.isPayrollEnabled ?? false);
    setSalaryTemplateId(getPayrollSalaryTemplateCatalogIdString(initialData));
    setIncomeTaxConfigId(
      initialData.incomeTaxConfig?.id != null
        ? String(initialData.incomeTaxConfig.id)
        : "",
    );
    setEnablePf(initialData.isPfEnabled ?? false);
    setInProbation(initialData.inProbation ?? false);
    setProbationEndDate(
      initialData.probationEndDate ? dayjs(initialData.probationEndDate) : null,
    );
    setPfAccountNumber(initialData.pfNumber ?? "");
    setUanNumber(initialData.uanNumber ?? "");
    setEnableAttendance(initialData.isAttendanceEnabled ?? false);
    setShiftId(
      initialData.shift?.id != null ? String(initialData.shift.id) : "",
    );
    setWeekOffPolicyId(
      initialData.weekoff?.id != null ? String(initialData.weekoff.id) : "",
    );
    setLeavePlanId(
      initialData.leavePlan?.id != null ? String(initialData.leavePlan.id) : "",
    );
    setHolidayPlanId(
      initialData.holidayPlan?.id != null
        ? String(initialData.holidayPlan.id)
        : "",
    );
    setDateOfBirth(
      initialData.dateOfBirth ? dayjs(initialData.dateOfBirth) : null,
    );
    setDialCode(c?.dialCode ?? "91");
    setPanNumber(c?.pan ?? "");
  }, [initialData, isEditMode]);

  const departmentOptions = useMemo(() => {
    const list = departmentResponse?.data ?? [];
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
  }, [departmentResponse, subDepartmentsByDept]);

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

  const designationOptions = useMemo(() => {
    const list = designationResponse?.data ?? [];
    return list.map((d) => ({ label: d.designationName, value: String(d.id) }));
  }, [designationResponse]);

  const expensePolicyOptions = useMemo(() => {
    return expensePolicies.map((p) => ({
      label: p.policyName,
      value: String(p.id),
    }));
  }, [expensePolicies]);

  const salaryTemplateOptions = useMemo(() => {
    const list = salaryTemplatesResponse?.data ?? [];
    return list.map((t) => ({ label: t.templateName, value: String(t.id) }));
  }, [salaryTemplatesResponse]);

  const incomeTaxConfigOptions = useMemo(() => {
    const versions = incomeTaxVersions ?? [];
    const byConfigId = new Map<number, { id: number; configName: string }>();
    versions.forEach((v) => {
      if (v.config?.id != null && !byConfigId.has(v.config.id)) {
        byConfigId.set(v.config.id, {
          id: v.config.id,
          configName: v.config.configName ?? `Config ${v.config.id}`,
        });
      }
    });
    return Array.from(byConfigId.values()).map((c) => ({
      label: c.configName,
      value: String(c.id),
    }));
  }, [incomeTaxVersions]);

  const shiftOptions = useMemo(() => {
    return shifts.map((s) => ({ label: s.shiftName, value: String(s.id) }));
  }, [shifts]);

  const weekOffOptions = useMemo(() => {
    const list = weekOffsResponse?.data ?? [];
    return list.map((w) => ({ label: w.weekOffName, value: String(w.id) }));
  }, [weekOffsResponse]);

  const leavePlanOptions = useMemo(() => {
    return leavePlans.map((l) => ({ label: l.name, value: String(l.id) }));
  }, [leavePlans]);

  const holidayPlanOptions = useMemo(() => {
    return holidayPlans.map((h) => ({
      label: h.planName,
      value: String(h.id),
    }));
  }, [holidayPlans]);

  const reportingPrefillKeyRef = useRef("");
  const reportingPrefillResolvedRef = useRef("");

  /** Sync reporting manager from edit `reportingToEmployee` or draft `reportingTo`. */
  useEffect(() => {
    const prefillKey =
      isEditMode && initialData
        ? `edit:${initialData.id}`
        : draftIdNumber && data?.data
          ? `draft:${data.data.id}`
          : "";

    if (!prefillKey) return;

    const source: ReportingManagerSource | null =
      isEditMode && initialData
        ? initialData
        : data?.data
          ? {
              reportingTo: data.data.reportingTo,
              reportingToName: data.data.reportingToName ?? null,
            }
          : null;

    if (!source) return;

    const resolved = resolveReportingManagerSelectValue(source, employeesList);
    const needsNameLookup =
      !resolved &&
      Boolean(source.reportingToName?.trim()) &&
      employeesList.length === 0;

    if (needsNameLookup) return;

    const keyChanged = reportingPrefillKeyRef.current !== prefillKey;
    const resolvedImproved =
      resolved !== "" &&
      reportingPrefillKeyRef.current === prefillKey &&
      reportingPrefillResolvedRef.current !== resolved;

    if (keyChanged || resolvedImproved) {
      setReportingManagerId(resolved);
      reportingPrefillKeyRef.current = prefillKey;
      reportingPrefillResolvedRef.current = resolved;
    }
  }, [isEditMode, initialData, draftIdNumber, data?.data, employeesList]);

  const reportingManagerOptions = useMemo(() => {
    const base = [{ label: "Self", value: "self" }];
    const list =
      isEditMode && initialData
        ? employeesList.filter((e) => e.id !== initialData.id)
        : employeesList;
    const employeeOptions = list
      .filter((e) => !isEmployeeDraft(e))
      .map((e) => ({
        label: getEmployeeDisplayName(e),
        value: String(e.id),
      }));

    const manager = initialData?.reportingToEmployee;
    if (
      manager?.id != null &&
      (initialData == null || manager.id !== initialData.id) &&
      !employeeOptions.some((o) => o.value === String(manager.id))
    ) {
      employeeOptions.unshift({
        label: getEmployeeDisplayName(manager as Employee),
        value: String(manager.id),
      });
    }

    return [...base, ...employeeOptions];
  }, [employeesList, isEditMode, initialData]);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  /** Step 0 (Basic information) required fields – enable Next only when these are filled */
  const canGoNextFromStep0 = useMemo(() => {
    const hasContact = Boolean(firstName || contactIdProp);
    return (
      hasContact &&
      gender.trim() !== "" &&
      employeeType.trim() !== "" &&
      employeeId.trim() !== "" &&
      workEmail.trim() !== "" &&
      Boolean(dateOfJoining) &&
      Boolean(Number(departmentId)) &&
      Boolean(Number(designationId)) &&
      reportingManagerId !== ""
    );
  }, [
    firstName,
    contactIdProp,
    gender,
    employeeType,
    employeeId,
    workEmail,
    dateOfJoining,
    departmentId,
    designationId,
    reportingManagerId,
  ]);

  const canSaveDraft = Boolean(firstName || contactIdProp);

  const saveDraftDisabledReason = !canSaveDraft
    ? "Please select a contact (First name)."
    : "";

  const nextDisabledReason = useMemo(() => {
    const hasContact = Boolean(firstName || contactIdProp);
    if (!hasContact) return "Please select a contact (First name).";
    if (!gender.trim()) return "Gender is required.";
    if (!employeeType.trim()) return "Employee type is required.";
    if (!employeeId.trim()) return "Employee ID is required.";
    if (!workEmail.trim()) return "Work email is required.";
    if (!dateOfJoining) return "Date of joining is required.";
    if (!departmentId) return "Department is required.";
    if (!designationId) return "Designation is required.";
    if (!reportingManagerId) return "Reporting manager is required.";
    return "";
  }, [
    firstName,
    contactIdProp,
    gender,
    employeeType,
    employeeId,
    workEmail,
    dateOfJoining,
    departmentId,
    designationId,
    reportingManagerId,
  ]);

  /** Build payload in the format backend expects for POST /employee */
  function buildCreatePayload(): CreateEmployeeDto {
    const isSelfReporting = reportingManagerId === "self";
    const payload: CreateEmployeeDto = {
      contactId,
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      employeeType:
        (employeeType as CreateEmployeeDto["employeeType"]) || "permanent",
      employeeId: employeeId.trim(),
      workEmail: workEmail.trim(),
      dateOfJoining: dateOfJoining
        ? dayjs(dateOfJoining).format("YYYY-MM-DD")
        : "",
      gender: gender.trim() ? String(gender).trim() : undefined,
      isEmployeePortalEnabled: true,
      departmentId: Number(departmentId) || 0,
      subDepartmentId: subDepartmentId ? Number(subDepartmentId) : undefined,
      designationId: Number(designationId) || 0,
      isSelfReporting,
      reportingToEmployeeId:
        !isSelfReporting && reportingManagerId
          ? Number(reportingManagerId)
          : undefined,
      dateOfBirth: dateOfBirth ? dayjs(dateOfBirth).format("YYYY-MM-DD") : "",
      mobileNumber: mobileNo.trim(),
      panNumber: panNumber.trim() || undefined,
      expensePolicyId: expensePolicyId ? Number(expensePolicyId) : undefined,
    };

    if (enablePayroll && salaryTemplateId && incomeTaxConfigId) {
      const templateIdNum = Number(salaryTemplateId);
      const rawPf = pfAccountNumber.trim();
      payload.payroll = {
        templateId: templateIdNum,
        isPfEnabled: enablePf,
        pfNumber: rawPf ? normalizePFForApi(rawPf) : undefined,
        uanNumber: uanNumber.trim() || undefined,
        incomeTaxConfig: Number(incomeTaxConfigId),
        probationEndDate: inProbation && probationEndDate
          ? dayjs(probationEndDate).format("YYYY-MM-DD")
          : undefined,
      };

      // Previously: send templateId (+ PF/tax) only when gross was not overridden in preview;
      // send annualGross/earnings/deductions only after preview Update.
      // Backend now expects the full payroll object in both cases.
      const payrollFromPreview =
        lastSalaryPayload && lastSalaryPayload.templateId === templateIdNum
          ? lastSalaryPayload
          : null;
      const payrollLines =
        payrollFromPreview ??
        (salaryTemplateDetail
          ? buildPayrollLinesFromTemplateDetail(
            salaryTemplateDetail,
            parseFloat(String(employeeSalaryPreview?.annualGross ?? "")) ||
            undefined,
          )
          : null);

      if (payrollLines) {
        payload.payroll.annualGross = payrollLines.annualGross;
        payload.payroll.earnings = payrollLines.earnings;
        if (payrollLines.deductions?.length) {
          payload.payroll.deductions = payrollLines.deductions;
        }
      }
    }

    if (enableAttendance) {
      payload.attendance = {
        shiftId: shiftId ? Number(shiftId) : undefined,
        weekoffId: weekOffPolicyId ? Number(weekOffPolicyId) : undefined,
        leavePlanId: leavePlanId ? Number(leavePlanId) : undefined,
        holidayPlanId: holidayPlanId ? Number(holidayPlanId) : undefined,
      };
    }

    return payload;
  }

  const buildDraftPayload = useCallback((): CreateEmployeeDraftDto => {
    const isSelf = reportingManagerId === "self" || !reportingManagerId;
    const annualGross =
      lastSalaryPayload?.annualGross != null
        ? lastSalaryPayload.annualGross
        : salaryTemplateDetail?.annualGross != null
          ? String(salaryTemplateDetail.annualGross)
          : null;

    return {
      contactId: contactId || undefined,
      employeeId: employeeId.trim() || null,
      middleName: middleName.trim() || null,
      lastName: lastName.trim() || null,
      gender: gender.trim() || null,
      dateOfJoining: dateOfJoining
        ? dayjs(dateOfJoining).format("YYYY-MM-DD")
        : undefined,
      employeeType: employeeType || undefined,
      workEmail: workEmail.trim() || undefined,
      departmentId: Number(departmentId) || undefined,
      subDepartmentId: subDepartmentId ? Number(subDepartmentId) : null,
      designationId: Number(designationId) || undefined,
      expensePolicyId: expensePolicyId ? Number(expensePolicyId) : null,
      reportingTo: isSelf ? null : (reportingManagerId ? Number(reportingManagerId) : null),
      salaryTemplateId: salaryTemplateId ? Number(salaryTemplateId) : null,
      incomeTaxConfigId: incomeTaxConfigId ? Number(incomeTaxConfigId) : null,
      annualGross: annualGross ? parseFloat(annualGross) : null,
      pfEnabled: enablePf,
      pfAccountNumber: enablePf && pfAccountNumber.trim()
        ? normalizePFForApi(pfAccountNumber.trim())
        : null,
      uanNumber: enablePf && uanNumber.trim() ? uanNumber.trim() : null,
      probationEndDate: inProbation && probationEndDate
        ? dayjs(probationEndDate).format("YYYY-MM-DD")
        : null,
      shiftId: shiftId ? Number(shiftId) : null,
      weekoffId: weekOffPolicyId ? Number(weekOffPolicyId) : null,
      leavePlanId: leavePlanId ? Number(leavePlanId) : null,
      holidayPlanId: holidayPlanId ? Number(holidayPlanId) : null,
      dateOfBirth: dateOfBirth
        ? dayjs(dateOfBirth).format("YYYY-MM-DD")
        : undefined,
      mobileNumber: mobileNo.trim() || null,
      panNumber: panNumber.trim() || null,
    };
  }, [
    contactId,
    employeeId,
    middleName,
    lastName,
    gender,
    dateOfJoining,
    employeeType,
    workEmail,
    departmentId,
    subDepartmentId,
    designationId,
    expensePolicyId,
    reportingManagerId,
    salaryTemplateId,
    incomeTaxConfigId,
    enablePf,
    pfAccountNumber,
    uanNumber,
    inProbation,
    probationEndDate,
    shiftId,
    weekOffPolicyId,
    leavePlanId,
    holidayPlanId,
    dateOfBirth,
    mobileNo,
    panNumber,
    lastSalaryPayload,
    salaryTemplateDetail,
  ]);

  function buildUpdatePayload(): UpdateEmployeeDto {
    return buildCreatePayload() as UpdateEmployeeDto;
  }

  async function handleSubmit() {
    if (!canSubmit) {
      setActiveStep(0);
      showSnackbar("Please complete all required fields in Basic information before submitting.", "error");
      setSnackbar({
        open: true,
        message:
          "Please complete all required fields in Basic information (contact, gender, employee type, department, designation, reporting manager, dates, and contact details) before submitting.",
        color: "error",
      });
      return;
    }
    const resolvedContactId = firstName ? Number(firstName) : contactIdProp;
    if (!resolvedContactId) {
      setActiveStep(0);
      showSnackbar("Please select a contact (First name) before submitting.", "error",);
      return;
    }
    if (
      dateOfBirth &&
      dateOfJoining &&
      !dayjs(dateOfBirth).isBefore(dayjs(dateOfJoining))
    ) {
      showSnackbar("Date of birth must be before date of joining.", "error");
      setSnackbar({
        open: true,
        message: "Date of birth must be before date of joining.",
        color: "error",
      });
      return;
    }
    if (
      inProbation &&
      probationEndDate &&
      dateOfJoining &&
      !dayjs(probationEndDate).isAfter(dayjs(dateOfJoining))
    ) {
      showSnackbar("Probation end date must be after date of joining.", "error");
      setSnackbar({
        open: true,
        message: "Probation end date must be after date of joining.",
        color: "error",
      });
      return;
    }
    if (enablePf && pfAccountNumber.trim()) {
      const normalizedPf = normalizePFForApi(pfAccountNumber.trim());
      if (!PF_BACKEND_REGEX.test(normalizedPf)) {
        showSnackbar(
          "Invalid PF number format. Use format: 2 letters, 3–5 letters, 7 digits, up to 3 digits, 7 digits (e.g. AA/AAA/1234567/890/8765432).",
          "error",
        );
        setSnackbar({
          open: true,
          message:
            "Invalid PF number format. Use format: 2 letters, 3–5 letters, 7 digits, up to 3 digits, 7 digits (e.g. AA/AAA/1234567/890/8765432).",
          color: "error",
        });
        return;
      }
    }
    if (enablePayroll && !enableAttendance) {
      showSnackbar("Attendance is required when payroll is enabled.", "error");
      setSnackbar({
        open: true,
        message: "Attendance is required when payroll is enabled.",
        color: "error",
      });
      return;
    }
    try {
      if (isEditMode && initialData) {
        await updateEmployee({
          employeeId: initialData.id,
          body: buildUpdatePayload(),
        }).unwrap();
        showSnackbar("Employee updated successfully.", "success");
        setSnackbar({
          open: true,
          message: "Employee updated successfully.",
          color: "success",
        });
        navigate(buildDirectoryHomePath(initialData.id, "edit"));
      } else {
        const createRes = await createEmployee(buildCreatePayload()).unwrap();
        // Delete the draft if this submission originated from one
        if (draftId) {
          try {
            await deleteDraft(draftId).unwrap();
          } catch {
            // silently ignore — employee was created successfully, draft cleanup is best-effort
          }
        }
        showSnackbar("Employee created successfully.", "success");
        setSnackbar({
          open: true,
          message: "Employee created successfully.",
          color: "success",
        });
        navigate(buildDirectoryHomePath(createRes.data.id, "add"));
      }
    } catch (error: any) {
      // Try to extract message from backend
      const backendMessage =
        error?.data?.message ||
        error?.error ||
        error?.message ||
        (isEditMode
          ? "Failed to update employee."
          : "Failed to create employee.");
      showSnackbar(backendMessage, "error");
      setSnackbar({
        open: true,
        message: backendMessage,
        color: "error",
      });
    }
  }

  const handleSaveDraft = useCallback(async () => {
    try {
      const payload = buildDraftPayload();
      const isDraftUpdate = draftId != null;
      let savedDraftId = draftId;
      if (isDraftUpdate) {
        await updateDraft({ draftId, body: payload }).unwrap();
        showSnackbar("Draft updated successfully.", "success");
      } else {
        const res = await createDraft(payload).unwrap();
        const newDraftId = res?.data?.employeeDraft?.id ?? res?.data?.id;
        if (newDraftId) {
          savedDraftId = newDraftId;
          setDraftId(newDraftId);
        }
        showSnackbar("Draft saved successfully.", "success");
      }
      if (savedDraftId != null) {
        navigate(
          buildDirectoryHomePath(savedDraftId, isDraftUpdate ? "edit" : "add"),
        );
      } else {
        navigate("/people/home?tab=4&mainTab=0");
      }
    } catch (error: any) {
      const msg = error?.data?.message || error?.message || "Failed to save draft.";
      showSnackbar(msg, "error");
    }
  }, [draftId, buildDraftPayload, updateDraft, createDraft, showSnackbar, navigate]);

  // Expose saveDraft function to parent via ref, so it can be called from header buttons
  useEffect(() => {
    if (saveDraftRef) {
      saveDraftRef.current = handleSaveDraft;
    }
  }, [saveDraftRef, handleSaveDraft]);

  /** Snapshot of initial values when editing (for dirty check) */
  const initialSnapshot = useMemo(() => {
    if (!initialData || !isEditMode) return null;
    const c = initialData.contact;
    const reportingId = resolveReportingManagerSelectValue(
      initialData,
      employeesList,
    );
    return {
      firstName: c?.id != null ? String(c.id) : "",
      middleName: c?.middleName ?? "",
      lastName: c?.lastName ?? "",
      employeeType: initialData.employeeType ?? "",
      employeeId: initialData.employeeId ?? "",
      workEmail: initialData.workEmail ?? c?.email ?? "",
      dateOfJoining: initialData.dateOfJoining ?? "",
      gender: initialData.gender?.toLowerCase() ?? "",
      departmentId: getDepartmentId(initialData) != null ? String(getDepartmentId(initialData)) : "",
      subDepartmentId:
        initialData.subDepartment?.id != null
          ? String(initialData.subDepartment.id)
          : "",
      designationId: getDesignationId(initialData) != null ? String(getDesignationId(initialData)) : "",
      expensePolicyId:
        (initialData as { expensePolicy?: { id: number } }).expensePolicy?.id !=
          null
          ? String(
            (initialData as { expensePolicy?: { id: number } }).expensePolicy!
              .id,
          )
          : "",
      reportingManagerId: reportingId,
      enableEmployeePortal: initialData.isEmployeePortalEnabled ?? false,
      enablePayroll: initialData.isPayrollEnabled ?? false,
      salaryTemplateId: getPayrollSalaryTemplateCatalogIdString(initialData),
      incomeTaxConfigId:
        initialData.incomeTaxConfig?.id != null
          ? String(initialData.incomeTaxConfig.id)
          : "",
      enablePf: initialData.isPfEnabled ?? false,
      inProbation: initialData.inProbation ?? false,
      probationEndDate: initialData.probationEndDate ?? "",
      pfAccountNumber: initialData.pfNumber ?? "",
      uanNumber: initialData.uanNumber ?? "",
      enableAttendance: initialData.isAttendanceEnabled ?? false,
      shiftId:
        initialData.shift?.id != null ? String(initialData.shift.id) : "",
      weekOffPolicyId:
        initialData.weekoff?.id != null ? String(initialData.weekoff.id) : "",
      leavePlanId:
        initialData.leavePlan?.id != null
          ? String(initialData.leavePlan.id)
          : "",
      holidayPlanId:
        initialData.holidayPlan?.id != null
          ? String(initialData.holidayPlan.id)
          : "",
      dateOfBirth: initialData.dateOfBirth ?? "",
      mobileNo: c?.phoneNumber ?? "",
      panNumber: c?.pan ?? "",
    };
  }, [initialData, isEditMode, employeesList]);

  /** In edit mode, true if any field differs from initial data. Comparisons normalized (String/trim) to match prefill. */
  const hasSalaryPreviewChange = useMemo(() => {
    if (lastSalaryPayload) {
      if (!isEditMode || !initialData) return true;
      const initialTemplateId = Number(getPayrollSalaryTemplateCatalogId(initialData));
      const initialAnnualGross = parseFloat(
        String(employeeSalaryPreview?.annualGross ?? "0"),
      );
      return (
        lastSalaryPayload.templateId !== initialTemplateId ||
        parseFloat(lastSalaryPayload.annualGross) !== initialAnnualGross
      );
    }
    if (acceptedCatalogTemplate) return true;
    return false;
  }, [
    lastSalaryPayload,
    acceptedCatalogTemplate,
    isEditMode,
    initialData,
    employeeSalaryPreview?.annualGross,
  ]);

  const hasChanges = useMemo(() => {
    if (!initialSnapshot) return true;
    if (hasSalaryPreviewChange) return true;

    const d = (v: Dayjs | null) => (v ? dayjs(v).format("YYYY-MM-DD") : "");
    const s = (v: unknown) => String(v ?? "").trim();
    const current = {
      firstName: s(firstName),
      middleName: s(middleName),
      lastName: s(lastName),
      employeeType: s(employeeType),
      employeeId: s(employeeId),
      workEmail: s(workEmail),
      dateOfJoining: d(dateOfJoining),
      gender: s(gender),
      departmentId: s(departmentId),
      subDepartmentId: s(subDepartmentId),
      designationId: s(designationId),
      expensePolicyId: s(expensePolicyId),
      reportingManagerId: s(reportingManagerId),
      enableEmployeePortal: true,
      enablePayroll: Boolean(enablePayroll),
      salaryTemplateId: s(salaryTemplateId),
      incomeTaxConfigId: s(incomeTaxConfigId),
      enablePf: Boolean(enablePf),
      inProbation: Boolean(inProbation),
      probationEndDate: d(probationEndDate),
      pfAccountNumber: s(pfAccountNumber),
      uanNumber: s(uanNumber),
      enableAttendance: Boolean(enableAttendance),
      shiftId: s(shiftId),
      weekOffPolicyId: s(weekOffPolicyId),
      leavePlanId: s(leavePlanId),
      holidayPlanId: s(holidayPlanId),
      dateOfBirth: d(dateOfBirth),
      mobileNo: s(mobileNo),
      panNumber: s(panNumber),
    };
    const init = {
      ...initialSnapshot,
      middleName: s(initialSnapshot.middleName),
      lastName: s(initialSnapshot.lastName),
      workEmail: s(initialSnapshot.workEmail),
      expensePolicyId: s(initialSnapshot.expensePolicyId),
      subDepartmentId: s(initialSnapshot.subDepartmentId),
      salaryTemplateId: s(initialSnapshot.salaryTemplateId),
      incomeTaxConfigId: s(initialSnapshot.incomeTaxConfigId),
      pfAccountNumber: s(initialSnapshot.pfAccountNumber),
      uanNumber: s(initialSnapshot.uanNumber),
      mobileNo: s(initialSnapshot.mobileNo),
      panNumber: s(initialSnapshot.panNumber),
    };
    const diffs: string[] = [];
    (Object.keys(current) as (keyof typeof current)[]).forEach((key) => {
      if (current[key] !== init[key])
        diffs.push(
          `${key}: ${JSON.stringify(current[key])} !== ${JSON.stringify(init[key])}`,
        );
    });
    if (diffs.length > 0) {
      console.log("[EditEmployee] hasChanges: true — differing fields:", diffs);
    }
    return diffs.length > 0;
  }, [
    hasSalaryPreviewChange,
    initialSnapshot,
    firstName,
    middleName,
    lastName,
    employeeType,
    employeeId,
    workEmail,
    dateOfJoining,
    gender,
    departmentId,
    subDepartmentId,
    designationId,
    expensePolicyId,
    reportingManagerId,
    enablePayroll,
    salaryTemplateId,
    incomeTaxConfigId,
    enablePf,
    inProbation,
    probationEndDate,
    pfAccountNumber,
    uanNumber,
    enableAttendance,
    shiftId,
    weekOffPolicyId,
    leavePlanId,
    holidayPlanId,
    dateOfBirth,
    mobileNo,
    panNumber,
  ]);

  const submitDisabledMessage = useMemo(() => {
    const hasContact = Boolean(firstName || contactIdProp);

    if (!hasContact) return "Please select a contact (First name).";
    if (!gender.trim()) return "Gender is required.";
    if (!employeeType.trim()) return "Employee type is required.";
    if (!employeeId.trim()) return "Employee ID is required.";
    if (!workEmail.trim()) return "Work email is required.";
    if (!dateOfJoining) return "Date of joining is required.";
    if (!departmentId) return "Department is required.";
    if (!designationId) return "Designation is required.";
    if (!reportingManagerId) return "Reporting manager is required.";
    if (!dateOfBirth) return "Date of birth is required.";
    if (dateOfBirth && dateOfJoining && !dayjs(dateOfBirth).isBefore(dayjs(dateOfJoining))) {
      return "Date of birth must be before date of joining.";
    }
    if (!mobileNo.trim()) return "Mobile number is required.";
    if (!panNumber.trim()) return "PAN number is required.";

    if (enablePayroll) {
      if (!salaryTemplateId) return "Salary template is required when payroll is enabled.";
      if (!incomeTaxConfigId) return "Income tax configuration is required.";
      if (inProbation && !probationEndDate) return "Probation end date is required.";
      if (enablePf && !pfAccountNumber.trim()) return "PF account number is required when PF is enabled.";
    }

    if (enableAttendance) {
      if (!shiftId) return "Shift type is required when attendance is enabled.";
      if (!weekOffPolicyId) return "Weekoff policy is required.";
      if (!leavePlanId) return "Leave plan is required.";
      if (!holidayPlanId) return "Holiday plan is required.";
    }

    if (isEditMode && !hasChanges) return "No changes detected to update.";

    return "";
  }, [
    firstName,
    contactIdProp,
    gender,
    employeeType,
    employeeId,
    workEmail,
    dateOfJoining,
    departmentId,
    designationId,
    reportingManagerId,
    dateOfBirth,
    mobileNo,
    panNumber,
    enablePayroll,
    salaryTemplateId,
    incomeTaxConfigId,
    inProbation,
    probationEndDate,
    enablePf,
    pfAccountNumber,
    enableAttendance,
    shiftId,
    weekOffPolicyId,
    leavePlanId,
    holidayPlanId,
    isEditMode,
    hasChanges,
  ]);

  /** Disable Submit/Update until all required fields (including conditional payroll/attendance) are filled */
  const canSubmit = useMemo(() => {
    const hasContact = Boolean(firstName || contactIdProp);
    const baseValid =
      hasContact &&
      gender.trim() !== "" &&
      employeeType.trim() !== "" &&
      employeeId.trim() !== "" &&
      workEmail.trim() !== "" &&
      Boolean(dateOfJoining) &&
      Boolean(Number(departmentId)) &&
      Boolean(Number(designationId)) &&
      reportingManagerId !== "" &&
      Boolean(dateOfBirth) &&
      mobileNo.trim() !== "" &&
      panNumber.trim() !== "";
    if (!baseValid) return false;
    const dobValid =
      dateOfBirth && dateOfJoining
        ? dayjs(dateOfBirth).isBefore(dayjs(dateOfJoining))
        : true;
    if (!dobValid) return false;

    if (enablePayroll) {
      if (!salaryTemplateId) return false;
      if (!incomeTaxConfigId) return false;
      if (inProbation && !probationEndDate) return false;
      if (enablePf && !pfAccountNumber.trim()) return false;
    }

    if (enableAttendance) {
      if (!shiftId || !weekOffPolicyId || !leavePlanId || !holidayPlanId)
        return false;
    }

    if (isEditMode && !hasChanges) return false;

    return true;
  }, [
    firstName,
    contactIdProp,
    gender,
    employeeType,
    employeeId,
    workEmail,
    dateOfJoining,
    departmentId,
    designationId,
    expensePolicyId,
    reportingManagerId,
    dateOfBirth,
    mobileNo,
    panNumber,
    enablePayroll,
    salaryTemplateId,
    incomeTaxConfigId,
    inProbation,
    probationEndDate,
    enablePf,
    pfAccountNumber,
    enableAttendance,
    shiftId,
    weekOffPolicyId,
    leavePlanId,
    holidayPlanId,
    isEditMode,
    hasChanges,
  ]);

  // Constrain form width so fields don't stretch too wide on large screens
  const formSx = { maxWidth: 880, width: "100%" };
  const submitDisabledReason = useMemo(() => {
    const hasContact = Boolean(firstName || contactIdProp);

    if (!hasContact) return "Please select a contact.";
    if (!gender.trim()) return "Gender is required.";
    if (!employeeType.trim()) return "Employee type is required.";
    if (!employeeId.trim()) return "Employee ID is required.";
    if (!workEmail.trim()) return "Work email is required.";
    if (!dateOfJoining) return "Date of joining is required.";
    if (!departmentId) return "Department is required.";
    if (!designationId) return "Designation is required.";
    if (!reportingManagerId) return "Reporting manager is required.";
    if (!dateOfBirth) return "Date of birth is required.";
    if (dateOfBirth && dateOfJoining && !dayjs(dateOfBirth).isBefore(dayjs(dateOfJoining)))
      return "Date of birth must be before date of joining.";
    if (!mobileNo.trim()) return "Mobile number is required.";
    if (!panNumber.trim()) return "PAN number is required.";

    if (enablePayroll) {
      if (!salaryTemplateId) return "Salary template is required.";
      if (!incomeTaxConfigId) return "Income tax configuration is required.";
      if (inProbation && !probationEndDate)
        return "Probation end date is required.";
      if (enablePf && !pfAccountNumber.trim())
        return "PF account number is required.";
    }

    if (enableAttendance) {
      if (!shiftId) return "Shift type is required.";
      if (!weekOffPolicyId) return "Weekoff policy is required.";
      if (!leavePlanId) return "Leave plan is required.";
      if (!holidayPlanId) return "Holiday plan is required.";
    }

    if (isEditMode && !hasChanges) return "No changes detected to update.";

    return "";
  }, [
    firstName,
    contactIdProp,
    gender,
    employeeType,
    employeeId,
    workEmail,
    dateOfJoining,
    departmentId,
    designationId,
    reportingManagerId,
    dateOfBirth,
    mobileNo,
    panNumber,
    enablePayroll,
    salaryTemplateId,
    incomeTaxConfigId,
    inProbation,
    probationEndDate,
    enablePf,
    pfAccountNumber,
    enableAttendance,
    shiftId,
    weekOffPolicyId,
    leavePlanId,
    holidayPlanId,
    isEditMode,
    hasChanges,
  ]);

  return (
    <>
      {showTitle && (
        <Typography variant="h6" sx={{ mb: 3 }}>
          {isEditMode ? "Edit Employee" : "Add Employee"}
        </Typography>
      )}
      <Stepper activeStep={activeStep} orientation="vertical">
        {/* Step 1: Basic & org info */}
        <Step>
          <StepLabel>Basic information</StepLabel>
          <StepContent>
            <Box sx={formSx}>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}
              >
                {/* Personal Details */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 2, fontWeight: 600 }}
                  >
                    Personal details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        sx={{ width: "100%" }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <SingleSelectElement
                            label="First name"
                            value={firstName}
                            onChange={handleFirstNameChange}
                            options={firstNameOptions}
                            required
                            fullWidth
                            disabled={isEditMode}
                          />
                        </Box>
                        {!isEditMode ? (
                          <IconButton
                            onClick={() => setOpenAddContactModal(true)}
                            size="small"
                            aria-label="Add contact"
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        ) : (
                          <Tooltip title="Edit contact">
                            <span>
                              <IconButton
                                onClick={() => setOpenEditContactModal(true)}
                                size="small"
                                aria-label="Edit contact"
                                disabled={!selectedContactForEdit}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextFieldElement
                        label="Middle name"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextFieldElement
                        label="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <SingleSelectElement
                        label="Gender"
                        value={gender}
                        onChange={setGender}
                        options={GENDER_OPTIONS}
                        required
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      {isDateOfJoiningLocked ? (
                        <Tooltip title="Date of joining cannot be changed because this employee has been included in a pay run.">
                          <Box sx={{ width: "100%" }}>
                            <DatePickerElement
                              label="Date of joining"
                              value={dateOfJoining}
                              onChange={setDateOfJoining}
                              required
                              width="100%"
                              disabled
                            />
                          </Box>
                        </Tooltip>
                      ) : (
                        <DatePickerElement
                          label="Date of joining"
                          value={dateOfJoining}
                          onChange={setDateOfJoining}
                          required
                          width="100%"
                        />
                      )}
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Employment Details */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 2, fontWeight: 600 }}
                  >
                    Employment details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextFieldElement
                        label="Employee ID"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        required
                        fullWidth
                        disabled={isEditMode || hasEmployeeSeries}
                        slotProps={
                          hasEmployeeSeries && !isEditMode
                            ? { input: { readOnly: true } }
                            : undefined
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <SingleSelectElement
                        label="Employee type"
                        value={employeeType}
                        onChange={setEmployeeType}
                        options={EMPLOYEE_TYPE_OPTIONS}
                        required
                        fullWidth
                        disabled={isEditMode}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextFieldElement
                        label="Work email"
                        value={workEmail}
                        onChange={(e) => setWorkEmail(e.target.value)}
                        required
                        fullWidth
                        type="email"
                        disabled={isEditMode}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Organization Details */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 2, fontWeight: 600 }}
                  >
                    Organization details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        sx={{ width: "100%" }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <SingleSelectElement
                            label="Department"
                            value={departmentSelectValue}
                            onChange={handleDepartmentOptionChange}
                            options={departmentOptions}
                            required
                            fullWidth
                          />
                        </Box>
                        <IconButton
                          onClick={() => setOpenAddDepartmentModal(true)}
                          size="small"
                          aria-label="Add department"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        sx={{ width: "100%" }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <SingleSelectElement
                            label="Designation"
                            value={designationId}
                            onChange={setDesignationId}
                            options={designationOptions}
                            required
                            fullWidth
                          />
                        </Box>
                        <IconButton
                          onClick={() => setOpenAddDesignationModal(true)}
                          size="small"
                          aria-label="Add designation"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <SingleSelectElement
                        label="Reporting manager"
                        value={reportingManagerId}
                        onChange={setReportingManagerId}
                        options={reportingManagerOptions}
                        required
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <SingleSelectElement
                        label="Expense policy"
                        value={expensePolicyId}
                        onChange={setExpensePolicyId}
                        options={expensePolicyOptions}
                        clearable
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
                <Tooltip title={nextDisabledReason}>
                  <span>
                    <PrimaryButton
                      onClick={handleNext}
                      disabled={!canGoNextFromStep0}
                    >
                      Next
                    </PrimaryButton>
                  </span>
                </Tooltip>
                {!isEditMode && (
                  <Tooltip title={canSaveDraft ? "Save as Draft" : saveDraftDisabledReason}>
                    <span>
                      <PrimaryIconButton
                        variant="outlined"
                        size="small"
                        icon={<Drafts fontSize="small" />}
                        onClick={() => saveDraftRef.current?.()}
                        disabled={!canSaveDraft}
                      />
                    </span>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </StepContent>
        </Step>

        {/* Step 2: Payroll, attendance, common (employee portal always enabled in API payload) */}
        <Step>
          <StepLabel>Payroll & attendance</StepLabel>
          <StepContent>
            <Box sx={formSx}>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}
              >
                {/* Payroll Section */}
                <Box>
                  <ToggleSwitch
                    label="Enable payroll for this employee"
                    checked={enablePayroll}
                    onChange={(e) => setEnablePayroll(e.target.checked)}
                  />

                  {enablePayroll && (
                    <Box
                      sx={{
                        mt: 3,
                        p: 3,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2.5,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        Payroll configuration
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <Stack
                            direction="row"
                            alignItems="flex-end"
                            spacing={0.5}
                            sx={{ width: "100%" }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <SingleSelectElement
                                label="Salary template name"
                                value={salaryTemplateId}
                                onChange={setSalaryTemplateId}
                                options={salaryTemplateOptions}
                                required
                                fullWidth
                              />
                            </Box>
                            {salaryTemplateId && (
                              <Typography
                                component="button"
                                type="button"
                                variant="body2"
                                onClick={() =>
                                  setOpenSalaryTemplatePreviewModal(true)
                                }
                                sx={{
                                  mb: 0.75,
                                  border: "none",
                                  background: "none",
                                  cursor: "pointer",
                                  color: "primary.main",
                                  textDecoration: "underline",
                                  "&:hover": { color: "primary.dark" },
                                }}
                              >
                                Preview
                              </Typography>
                            )}
                          </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <SingleSelectElement
                            label="Income tax config"
                            value={incomeTaxConfigId}
                            onChange={setIncomeTaxConfigId}
                            options={incomeTaxConfigOptions}
                            required
                            fullWidth
                          />
                        </Grid>
                      </Grid>

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <ToggleSwitch
                          label="Enable PF"
                          checked={enablePf}
                          onChange={(e) => { setEnablePf(e.target.checked); setPfAccountNumber(""); setUanNumber(""); }}
                        />
                        {enablePf && <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <TextFieldElement
                              label="PF account number"
                              value={pfAccountNumber}
                              onChange={(e) =>
                                setPfAccountNumber(
                                  formatPFAccountNumber(e.target.value),
                                )
                              }
                              placeholder={PF_ACCOUNT_PLACEHOLDER}
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <TextFieldElement
                              label="UAN number"
                              type="text"
                              value={uanNumber}
                              onChange={(e) =>
                                setUanNumber(
                                  e.target.value.replace(/\D/g, "").slice(0, 12),
                                )
                              }
                              placeholder="Max 12 digits"
                              fullWidth
                              slotProps={{ input: { inputMode: "numeric" } }}
                            />
                          </Grid>
                        </Grid>}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "flex-start",
                            gap: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          <ToggleSwitch
                            label="In probation"
                            checked={inProbation}
                            onChange={(e) => setInProbation(e.target.checked)}
                          />
                          {inProbation && (
                            <Box sx={{ minWidth: 200, flex: "1 1 200px" }}>
                              <DatePickerElement
                                label="Probation end date"
                                value={probationEndDate}
                                onChange={setProbationEndDate}
                                required
                                width="57%"
                              />
                            </Box>
                          )}
                        </Box>
                      </Box>


                    </Box>
                  )}
                </Box>

                <Divider />

                {/* Attendance Section */}
                <Box>
                  <ToggleSwitch
                    label="Enable attendance for this employee"
                    checked={enableAttendance}
                    onChange={(e) => setEnableAttendance(e.target.checked)}
                  />

                  {enableAttendance && (
                    <Box
                      sx={{
                        mt: 3,
                        p: 3,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2.5,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        Attendance configuration
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <SingleSelectElement
                            label="Shift type"
                            value={shiftId}
                            onChange={setShiftId}
                            options={shiftOptions}
                            required
                            fullWidth
                            disabled={
                              isEditMode && Boolean(initialSnapshot?.shiftId)
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <SingleSelectElement
                            label="Weekoff policy"
                            value={weekOffPolicyId}
                            onChange={setWeekOffPolicyId}
                            options={weekOffOptions}
                            required
                            fullWidth
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <SingleSelectElement
                            label="Leave plan"
                            value={leavePlanId}
                            onChange={setLeavePlanId}
                            options={leavePlanOptions}
                            required
                            fullWidth
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <SingleSelectElement
                            label="Holiday plan"
                            value={holidayPlanId}
                            onChange={setHolidayPlanId}
                            options={holidayPlanOptions}
                            required
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>

                <Divider />

                {/* Common Details */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 2, fontWeight: 600 }}
                  >
                    Common details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <DatePickerElement
                        label="Date of birth"
                        value={dateOfBirth}
                        onChange={setDateOfBirth}
                        required
                        width="100%"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box>
                        <PhoneInputAtom
                          label="Mobile Number"
                          required
                          country={countryCode || "in"}
                          value={mobileNo}
                          onChange={(value, data) => {
                            setMobileNo(value);
                            setDialCode(value ? (data?.dialCode ?? "") : "");
                            setCountryCode(data?.countryCode || "in");
                          }}
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextFieldElement
                        label="PAN number"
                        value={panNumber}
                        onChange={(e) =>
                          setPanNumber(formatPANNumber(e.target.value))
                        }
                        placeholder="AAAAA1234A"
                        required
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                mt: 3,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: 'center',
                gap: 1,
              }}
            >
              {!isEditMode && (
                <Tooltip title={canSaveDraft ? "Save as Draft" : saveDraftDisabledReason}>
                  <span>
                    <PrimaryIconButton
                      variant="outlined"
                      size="small"
                      icon={<Drafts fontSize="small" />}
                      onClick={() => saveDraftRef.current?.()}
                      disabled={!canSaveDraft}
                    />
                  </span>
                </Tooltip>
              )}

              <PrimaryButton onClick={handleBack} variant="outlined">
                Back
              </PrimaryButton>
              <Tooltip title={submitDisabledReason}>
                <span>
                  <PrimaryButton
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canSubmit}
                  >
                    Submit
                  </PrimaryButton>
                </span>
              </Tooltip>
            </Box>
          </StepContent>
        </Step>
      </Stepper>

      <ModalElement
        open={openAddContactModal}
        onClose={() => setOpenAddContactModal(false)}
        title="Add Contact"
        maxWidth="md"
      >
        <AddContactForm onSubmit={handleSubmitAddContact} />
      </ModalElement>

      <ModalElement
        open={openEditContactModal}
        onClose={() => setOpenEditContactModal(false)}
        title="Edit Contact"
        maxWidth="md"
      >
        <AddContactForm
          key={selectedContactForEdit ? `edit-${contactId}` : "edit-empty"}
          selectedContact={selectedContactForEdit}
          onSubmit={handleSubmitEditContact}
        />
      </ModalElement>

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
        <TextFieldElement
          label="Department name"
          value={newDepartmentName}
          onChange={(e) => setNewDepartmentName(e.target.value)}
          fullWidth
          sx={{ mt: 1 }}
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
        <TextFieldElement
          label="Designation name"
          value={newDesignationName}
          onChange={(e) => setNewDesignationName(e.target.value)}
          fullWidth
          sx={{ mt: 1 }}
        />
      </ModalElement>

      <ModalElement
        open={openSalaryTemplatePreviewModal}
        onClose={() => setOpenSalaryTemplatePreviewModal(false)}
        title="Salary template preview"
        maxWidth="md"
        height="85vh"
        sx={{ "& .MuiDialog-paper": { minWidth: 520, maxWidth: 720 } }}
      >
        <SalaryTemplatePreviewModal
          open={openSalaryTemplatePreviewModal}
          onClose={() => setOpenSalaryTemplatePreviewModal(false)}
          templateId={salaryTemplateId}
          templateDetail={salaryTemplateDetail}
          catalogTemplateDetail={catalogSalaryTemplateDetail}
          showEarningsRevert={showEarningsRevert}
          onSaveCatalogTemplate={() => {
            if (catalogSalaryTemplateDetail) {
              setAcceptedCatalogTemplate(catalogSalaryTemplateDetail);
            }
            setLastSalaryPayload(null);
            setLastSalaryPreview(null);
          }}
          onUpdatePayload={(payload) => {
            setAcceptedCatalogTemplate(null);
            setLastSalaryPayload(payload);
            setLastSalaryPreview({
              templateId: salaryTemplateId,
              annualGross: parseFloat(payload.annualGross),
              recalculated: {
                earnings: payload.earnings.map((e) =>
                  parseFloat(e.monthlyAmount),
                ),
                deductions: (payload.deductions ?? []).map((d) =>
                  parseFloat(d.monthlyAmount),
                ),
              },
            });
          }}
          initialOverrides={
            lastSalaryPreview?.templateId === salaryTemplateId
              ? {
                annualGross: lastSalaryPreview.annualGross,
                recalculated: lastSalaryPreview.recalculated,
              }
              : undefined
          }
        />
      </ModalElement>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          autoClose={4000}
        />
      )}
    </>
  );
}
