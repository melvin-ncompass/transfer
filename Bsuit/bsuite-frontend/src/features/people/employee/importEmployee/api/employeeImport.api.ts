import { baseApi } from "../../../../../api/base.api";

// ─── Interfaces ────────────────────────────────────────────────────────────

export interface EmployeePayroll {
  template: string;
  templateId?: number;
  isPfEnabled: boolean;
  pfNumber: string | null;
  uanNumber: string | null;
  annualGross: number;
  probationEndDate: string | null;
  incomeTaxConfig: string | null;
  earnings?: Array<{ earningName: string; monthlyAmount: number }>;
  deductions?: Array<{ deductionName: string; monthlyAmount: number }>;
}

export interface EmployeeAttendance {
  shift: string;
  shiftId?: number;
  weekoff: string;
  weekoffId?: number;
  leavePlan: string;
  leavePlanId?: number;
  holidayPlan: string;
  holidayPlanId?: number;
}

export interface ImportedEmployeeItem {
  contactName: string;
  middleName: string | null;
  lastName: string | null;
  employeeType: string;
  employeeId: string;
  workEmail: string;
  dateOfJoining: string;
  gender: string | null;
  isEmployeePortalEnabled: boolean;
  department: string;
  departmentId?: number;
  subDepartment: string | null;
  subDepartmentId?: number | null;
  designation: string;
  designationId?: number;
  expensePolicy: string | null;
  expensePolicyId?: number | null;
  isSelfReporting: boolean;
  reportingToEmployeeId: string;
  reportingToEmployeeContactName: string | null;
  payroll: EmployeePayroll | null;
  attendance: EmployeeAttendance | null;
  dateOfBirth: string | null;
  mobileNumber: string | null;
  panNumber: string | null;
}

export interface BulkCreateEmployeeDto {
  employees: ImportedEmployeeItem[];
}

export interface DownloadSampleResponse {
  blob: Blob;
}

export interface ImportEmployeeResponse {
  data: ImportedEmployeeItem[];
  message: string;
}

export interface ValidateEmployeeResponse {
  data: any;
  message: string;
}

export interface BulkCreateEmployeeResponse {
  data: {
    message: string;
    total: number;
    createdEmployees: Array<{
      id: number;
      employeeId: string;
      employeeName: string;
    }>;
  };
  message: string;
}

// ─── API Endpoints ────────────────────────────────────────────────────────

export const employeeImportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Download sample excel
    downloadEmployeeSampleExcel: builder.mutation<Blob, void>({
      query: () => ({
        url: `/employee/download_sample_excel`,
        method: "POST",
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Import employees (file upload)
    importEmployees: builder.mutation<ImportEmployeeResponse, FormData>({
      query: (formData) => ({
        url: `/employee/import`,
        method: "POST",
        body: formData,
      }),
    }),

    // Validate employees
    validateEmployees: builder.mutation<ValidateEmployeeResponse, BulkCreateEmployeeDto>({
      query: (data) => ({
        url: `/employee/validate`,
        method: "POST",
        body: { employees: data.employees },
      }),
    }),

    // Bulk create employees
    bulkCreateEmployees: builder.mutation<BulkCreateEmployeeResponse, BulkCreateEmployeeDto>({
      query: (data) => ({
        url: `/employee/bulk_create`,
        method: "POST",
        body: { employees: data.employees },
      }),
      invalidatesTags: ["People"],
    }),
  }),
});

// ─── Export Hooks ──────────────────────────────────────────────────────────

export const {
  useDownloadEmployeeSampleExcelMutation,
  useImportEmployeesMutation,
  useValidateEmployeesMutation,
  useBulkCreateEmployeesMutation,
} = employeeImportApi;
