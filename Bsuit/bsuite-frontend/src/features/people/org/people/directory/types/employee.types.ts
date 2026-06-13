/**
 * Types aligned with backend Employee controller and DTOs.
 * Contact is required to exist (contactId); backend updates contact fields (email, pan, phone, etc.).
 */

export type EmployeeTypeEnum = "permanent" | "intern";

/** Backend expects probation as nested object */
export interface CreateEmployeePayrollProbationDto {
  probationEndDate?: string; // ISO date YYYY-MM-DD
}

export interface CreateEmployeePayrollEarningDto {
  earningId: number;
  monthlyAmount: string;
  payslipOrder: number;
}

export interface CreateEmployeePayrollDeductionDto {
  deductionId: number;
  monthlyAmount: string;
  payslipOrder: number;
}

export interface CreateEmployeePayrollDto {
  templateId: number;
  /** Only sent when user has updated gross via the salary template preview modal */
  annualGross?: string;
  earnings?: CreateEmployeePayrollEarningDto[];
  deductions?: CreateEmployeePayrollDeductionDto[];
  isPfEnabled?: boolean;
  pfNumber?: string | null;
  uanNumber?: string | null;
  incomeTaxConfig?: number;
  // probation?: CreateEmployeePayrollProbationDto | null;
  probationEndDate?: string; 
}

export interface CreateEmployeeAttendanceDto {
  shiftId?: number;
  weekoffId?: number;
  leavePlanId?: number;
  holidayPlanId?: number;
}

export interface CreateEmployeeDto {
  contactId: number;
  employeeId: string;
  employeeType: EmployeeTypeEnum;
  gender?: string | null;
  dateOfJoining: string; // ISO date
  dateOfBirth: string; // ISO date
  isEmployeePortalEnabled: boolean;
  departmentId: number;
  subDepartmentId?: number | null;
  designationId: number;
  workEmail: string;
  isSelfReporting: boolean;
  reportingToEmployeeId?: number | null;
  mobileNumber: string;
  panNumber?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  expensePolicyId?: number | null;
  payroll?: CreateEmployeePayrollDto | null;
  attendance?: CreateEmployeeAttendanceDto | null;
}

export type UpdateEmployeePayrollDto = CreateEmployeePayrollDto;
export type UpdateEmployeePayrollProbationDto = CreateEmployeePayrollProbationDto;
export type UpdateEmployeeAttendanceDto = CreateEmployeeAttendanceDto;

export interface UpdateEmployeeDto {
  contactId: number;
  employeeId: string;
  employeeType: EmployeeTypeEnum;
  gender?: string | null;
  dateOfJoining: string;
  dateOfBirth: string;
  isEmployeePortalEnabled: boolean;
  departmentId: number;
  subDepartmentId?: number | null;
  designationId: number;
  workEmail: string;
  isSelfReporting: boolean;
  reportingToEmployeeId?: number | null;
  mobileNumber: string;
  panNumber?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  expensePolicyId?: number | null;
  payroll?: UpdateEmployeePayrollDto | null;
  attendance?: UpdateEmployeeAttendanceDto | null;
}

/** Contact shape returned in employee relations */
export interface EmployeeContact {
  id: number;
  name?: string;
  firstName?: string;
  middleName?: string | null;
  lastName?: string | null;
  email?: string;
  phoneNumber?: string;
  pan?: string | null;
  dialCode?: string | null;
  // Address fields
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
}

export interface EmployeeDepartment {
  id: number;
  departmentName?: string;
}

export interface EmployeeDesignation {
  id: number;
  designationName?: string;
}

/** Single employee as returned by GET /employee and GET /employee/:id (with relations) */
export interface Employee {
  id: number;
  employeeId: string;
  employeeType: EmployeeTypeEnum;
  gender?: string | null;
  dateOfJoining: string;
  dateOfBirth?: string | null;
  workEmail?: string | null;
  canDelete?: boolean;
  /** Edit form: when true, date of joining must not be changed (employee appears in a pay run). */
  existsInPayRun?: boolean;
  isEmployeePortalEnabled?: boolean;
  isPayrollEnabled?: boolean;
  isAttendanceEnabled?: boolean;
  isPfEnabled?: boolean;
  inProbation?: boolean;
  probationEndDate?: string | null;
  pfNumber?: string | null;
  uanNumber?: string | null;
  status?: string;
  // Personal information fields returned directly on the employee record
  personalEmail?: string | null;
  emergencyContact?: string | null;
  fatherName?: string | null;
  bloodGroup?: string | null;
  maritalStatus?: string | null;
  aadharNumber?: string | null;
  nameAsPerPan?: string | null;
  nameAsPerAadhar?: string | null;
  contact?: EmployeeContact;
  subDepartment?: { id: number, subDepartmentName?: string } | null;
  department?: EmployeeDepartment | string | null;
  designation?: EmployeeDesignation | string | null;

  // Optional draft employee 
  name?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  reportingToName?: string | null;
  reportingTo?: number | null;
  salaryTemplateId?: number | null;
  incomeTaxConfigId?: number | null;
  pfEnabled?: boolean;
  pfAccountNumber?: string | null;
  /**
   * Payroll assignment: `id` may be EmployeeSalaryTemplate (junction) id; catalog template is `initialTemplate.id`.
   * Use `getPayrollSalaryTemplateCatalogId` for dropdown + `payroll.templateId`.
   */
  template?: {
    id?: string | number;
    templateName?: string;
    initialTemplate?: { id?: number; templateName?: string; description?: string };
  } | null;
  incomeTaxConfig?: { id: number; configName?: string } | null;
  shift?: { id: number; shiftName?: string } | null;
  weekoff?: { id: number; weekOffName?: string } | null;
  leavePlan?: { id: number; name?: string } | null;
  holidayPlan?: { id: number; planName?: string } | null;
  reportingToEmployee?: {
    id: number;
    employeeId?: string;
    contact?: {
      name?: string;
      firstName?: string;
      middleName?: string | null;
      lastName?: string | null;
    };
  } | null;
  expensePolicyId?: number | null;
  isCompOffEnabled?: boolean;
  expensePolicy?: { id: number; policyName: string; description?: string } | null;
  /** From list API; when false, directory row actions must not offer delete. */
  // canDelete?: boolean;
}

/**
 * Salary template master id (`SalaryTemplates.id`) for payroll DTO and UI — not the EmployeeSalaryTemplate row id.
 */
export function getPayrollSalaryTemplateCatalogId(
  emp: Employee | undefined,
): number | null {
  if (!emp?.template) return null;
  const nested = emp.template.initialTemplate?.id;
  if (nested != null && !Number.isNaN(Number(nested))) return Number(nested);
  const top = emp.template.id;
  if (top != null && top !== "" && !Number.isNaN(Number(top))) return Number(top);
  return null;
}

export function getPayrollSalaryTemplateCatalogIdString(
  emp: Employee | undefined,
): string {
  const n = getPayrollSalaryTemplateCatalogId(emp);
  return n != null ? String(n) : "";
}

export function getDepartmentName(emp: Employee | undefined): string {
  if (!emp?.department) return "";
  return typeof emp.department === "string"
    ? emp.department
    : emp.department.departmentName ?? "";
}

export function getDesignationName(emp: Employee | undefined): string {
  if (!emp?.designation) return "";
  return typeof emp.designation === "string"
    ? emp.designation
    : emp.designation.designationName ?? "";
}

export function getDepartmentId(emp: Employee | undefined): number | null {
  if (!emp?.department || typeof emp.department === "string") return null;
  return emp.department.id ?? null;
}

export function getDesignationId(emp: Employee | undefined): number | null {
  if (!emp?.designation || typeof emp.designation === "string") return null;
  return emp.designation.id ?? null;
}

export interface CreateEmployeeResponse {
  data: { id: number; employeeId: string };
  message: string;
  change_of_data?: Record<string, unknown>;
}

export interface UpdateEmployeeResponse {
  data: { id: number; employeeId: string; employeeName?: string };
  message: string;
  change_of_data?: Record<string, unknown>;
}
export interface GetEmployeeResponse {
  data: Employee;
  message: string;
}

export interface GetEmployeesResponse {
  success?: boolean;
  statusCode?: number;
  timestamp?: string;
  message: string;
  data: EmployeeListItem[];
}
export interface DeleteEmployeeResponse {
  data: { id: number; employeeId: string };
  message: string;
  change_of_data?: Record<string, unknown>;
}


export type EmployeeDraft = Employee;
export type EmployeeListItem = Employee;

export interface CreateEmployeeDraftDto {
  contactId?: number;
  employeeId?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  dateOfJoining?: string;
  employeeType?: string;
  workEmail?: string;
  departmentId?: number;
  subDepartmentId?: number | null;
  designationId?: number;
  expensePolicyId?: number | null;
  reportingTo?: number | null;       // send numeric ID, backend resolves the name

  // Flat payroll fields
  salaryTemplateId?: number | null;
  incomeTaxConfigId?: number | null;
  pfEnabled?: boolean;
  pfAccountNumber?: string | null;
  uanNumber?: string | null;
  probationEndDate?: string | null;

  // Flat attendance fields
  shiftId?: number | null;
  weekoffId?: number | null;
  leavePlanId?: number | null;
  holidayPlanId?: number | null;

  // Common details
  dateOfBirth?: string;
  mobileNumber?: string | null;
  panNumber?: string | null;
  annualGross?: number | null;
}

export type UpdateEmployeeDraftDto = CreateEmployeeDraftDto;