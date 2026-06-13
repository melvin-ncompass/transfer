import { baseApi } from "../../../../../../api/base.api";
import type {
  CreateEmployeeResponse,
  UpdateEmployeeResponse,
  GetEmployeesResponse,
  GetEmployeeResponse,
  DeleteEmployeeResponse,
  CreateEmployeeDraftDto,
  UpdateEmployeeDraftDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  Employee,
} from "../types/employee.types";

/** Query args for GET /employee/employeeSalaryTemplatePreview (Nest: initialTemplateId required; employeeId optional for template-only preview) */
export interface GetEmployeeSalaryTemplatePreviewQueryArgs {
  initialTemplateId: number;
  /** Omit when adding a new employee — backend returns initial template + default earnings/deductions. */
  employeeId?: number;
}

export type EmployeeStatus =
  | "active"
  | "inactive"
  | "terminated"
  | "employee_draft";

/** Line item without nested earning (template-only / fallback preview from API). */
export interface EmployeeSalaryTemplatePreviewFlatLine {
  id: number;
  monthlyAmount?: string | number;
  payslipOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  /** Flat preview rows may include labels before nested `earning` / `deduction` is populated */
  earningName?: string;
  deductionName?: string;
  name?: string;
}

export function isEmployeeDraft(emp: Employee): boolean {
  return emp.status === "employee_draft" || (emp.id != null && !emp.employeeId);
}

/** With relations, API includes nested `earning`; template-only preview often omits it. */
export interface EmployeeSalaryTemplatePreviewEarning extends EmployeeSalaryTemplatePreviewFlatLine {
  earning?: {
    id: number;
    earningName: string;
    nameInPayslip?: string;
    calculationType: "amount" | "percentage";
    amount: string | null;
    percentage: string | null;
    percentageOf: string | { id: number; earningName?: string } | null;
  };
}

/** With relations, API includes nested `deduction`; template-only preview often omits it. */
export interface EmployeeSalaryTemplatePreviewDeduction extends EmployeeSalaryTemplatePreviewFlatLine {
  deduction?: {
    id: number;
    deductionName: string;
    nameInPayslip?: string;
    calculationType: string;
    amount: string;
    percentage?: string | null;
    percentageOf?: string | { id: number; earningName?: string } | null;
  };
}

export interface EmployeeSalaryTemplatePreview {
  id?: number;
  employee?: Record<string, unknown> | null;
  /** Employee's assigned annual gross (from employee salary template, not the template default) */
  annualGross?: string;
  monthlyGross?: string;
  initialTemplate?: {
    id: number;
    templateName: string;
    description?: string;
    annualGross?: string;
    monthlyGross?: string;
    /** Same flat shape as `employeeEarnings` when template is embedded in preview */
    earnings?: EmployeeSalaryTemplatePreviewFlatLine[];
    deductions?: EmployeeSalaryTemplatePreviewFlatLine[];
  };
  employeeEarnings?: EmployeeSalaryTemplatePreviewEarning[];
  employeeDeductions?: EmployeeSalaryTemplatePreviewDeduction[];
}
/** Full API response wrapper */
export interface GetEmployeeSalaryTemplatePreviewResponse {
  success?: boolean;
  statusCode?: number;
  timestamp?: string;
  message: string;
  data: EmployeeSalaryTemplatePreview;
}

/** Query params for GET /employee (matches backend EmployeeFilterDto) */
export interface EmployeeFilterParams {
  departmentId?: number[];
  subDepartmentId?: number[];
  designationId?: number[];
  employeeType?: string[];
  employeeStatus?: string[];
}
export interface InitiateExitDto {
  initiateExitBy: "employee" | "company";
  reasonForExit: string;
  exitInitiatedDate: string;
  lastWorkingDate: string | null;
  comments: string;
}

export interface ExportEmployeesDto {
  columns: string[];
}

export interface ExportEmployeesResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: null;
}

export interface CompOffRequestDto {
  dateRange: string[];
  note: string;
  flag: "award";
}

export interface DraftResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: any;
}


function buildEmployeeQueryString(
  filter: EmployeeFilterParams | void,
): string {
  if (!filter) return "";

  const queryParams = new URLSearchParams();

  const append = (key: string, values?: Array<string | number>) => {
    values?.forEach((value) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  };

  append("departmentId", filter.departmentId);
  append("subDepartmentId", filter.subDepartmentId);
  append("designationId", filter.designationId);
  append("employeeType", filter.employeeType);

  const statuses = filter.employeeStatus ?? [];

  const normalStatuses = statuses.filter(
    (status) => status !== "employee_draft",
  );

  if (normalStatuses.length > 0) {
    append("employeeStatus", normalStatuses);
  }

  if (statuses.includes("employee_draft")) {
    queryParams.append("shouldIncludeDrafts", "true");
  }

  const queryString = queryParams.toString();

  return queryString ? `?${queryString}` : "";
}


export const directoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<
      GetEmployeesResponse,
      EmployeeFilterParams | void
    >({
      query: (filter) => ({
        url: `/employee${buildEmployeeQueryString(filter)}`,
        method: "GET",
      }),
      providesTags: ["Employee"],
    }),

    getAllEmployeesWithDrafts: builder.query<GetEmployeesResponse, void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const [normalResult, draftResult] = await Promise.all([
          baseQuery({ url: "/employee", method: "GET" }),
          baseQuery({ url: "/employee?shouldIncludeDrafts=true", method: "GET" }),
        ]);

        if (normalResult.error) return { error: normalResult.error };
        if (draftResult.error) return { error: draftResult.error };

        const normalData = normalResult.data as GetEmployeesResponse;
        const draftData = draftResult.data as GetEmployeesResponse;

        const normalEmployees = normalData?.data ?? [];
        const draftEmployees = (draftData?.data ?? []).filter(
          (emp) => isEmployeeDraft(emp)
        );
        const merged = [...normalEmployees, ...draftEmployees];
        return {
          data: {
            ...normalData,
            data: merged,
          },
        };
      },
      providesTags: ["Employee"],
    }),

    getEmployee: builder.query<GetEmployeeResponse, number>({
      query: (id) => ({
        url: `/employee/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "Employee", id: String(id) },
      ],
    }),

    getNextEmployeeId: builder.query<
      { data: { nextEmployeeId: string }; message: string },
      string
    >({
      query: (employeeType) => ({
        url: "/employee/next_employee_id",
        method: "GET",
        params: { employeeType },
      }),
    }),

    createEmployee: builder.mutation<CreateEmployeeResponse, CreateEmployeeDto>(
      {
        query: (body) => ({
          url: "/employee",
          method: "POST",
          body,
        }),
        invalidatesTags: ["Employee", "Contact"],
      },
    ),

    updateEmployee: builder.mutation<
      UpdateEmployeeResponse,
      { employeeId: number; body: UpdateEmployeeDto }
    >({
      query: ({ employeeId, body }) => ({
        url: `/employee/${employeeId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { employeeId }) => [
        "Employee",
        { type: "Employee", id: String(employeeId) },
        { type: "EmployeeTimeline", id: String(employeeId) },
        "EmployeeTimeline",
        "Contact",
      ],
    }),

    deleteEmployee: builder.mutation<DeleteEmployeeResponse, number>({
      query: (employeeId) => ({
        url: `/employee/${employeeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employee"],
    }),

    getEmployeeSalaryTemplatePreview: builder.query<
      GetEmployeeSalaryTemplatePreviewResponse,
      GetEmployeeSalaryTemplatePreviewQueryArgs
    >({
      query: ({ initialTemplateId, employeeId }) => {
        const params: Record<string, string> = {
          initialTemplateId: String(initialTemplateId),
        };
        if (employeeId != null && employeeId > 0) {
          params.employeeId = String(employeeId);
        }
        return {
          url: `/employee/employeeSalaryTemplatePreview`,
          method: "GET",
          params,
        };
      },
      providesTags: (_result, _error, { employeeId }) =>
        employeeId != null && employeeId > 0
          ? [{ type: "Employee", id: String(employeeId) }]
          : ["Employee"],
    }),


    initiateExit: builder.mutation<
      any,
      {
        employeeId: string,
        body: InitiateExitDto
      }
    >({
      query: ({ employeeId, body }) => ({
        url: `/exit/initiate/${employeeId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employee", "Exit", "ExitReview", "ExitProgress", "ExitRequest"],
    }),

    exportEmployees: builder.mutation<ExportEmployeesResponse, ExportEmployeesDto>({
      query: (body) => ({
        url: "/employee/export",
        method: "POST",
        body,
      }),
    }),

    requestCompOff: builder.mutation<
      any,
      { employeeId: string; body: CompOffRequestDto }
    >({
      query: ({ employeeId, body }) => ({
        url: `/leave/comp_off_credit/${employeeId}`,
        method: "POST",
        body,
      }),
    }),

    resendEmployeeInvite: builder.mutation<any, { employeeEmail: string }>({
      query: ({ employeeEmail }) => ({
        url: `/employee/resendEmployeeInvite`,
        method: "POST",
        params: { email: employeeEmail },
      }),
    }),

    getEmployeeDraftById: builder.query<DraftResponse, number>({
      query: (draftId) => ({
        url: `/employee/draft/${draftId}`,
        method: "GET",
      }),
      providesTags: (_res, _err, id) => [{ type: "Draft", id }],
    }),

    createEmployeeDraft: builder.mutation<DraftResponse, CreateEmployeeDraftDto>({
      query: (body) => ({
        url: `/employee/draft`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Draft", "Employee"],
    }),

    updateEmployeeDraft: builder.mutation<
      DraftResponse,
      { draftId: number; body: UpdateEmployeeDraftDto }
    >({
      query: ({ draftId, body }) => ({
        url: `/employee/draft/${draftId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Draft", "Employee"],
    }),

    deleteEmployeeDraft: builder.mutation<DraftResponse, number>({
      query: (draftId) => ({
        url: `/employee/draft/${draftId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employee"],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetAllEmployeesWithDraftsQuery,
  useGetEmployeeQuery,
  useGetNextEmployeeIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetEmployeeSalaryTemplatePreviewQuery,
  useLazyGetEmployeesQuery,
  useInitiateExitMutation,
  useExportEmployeesMutation,
  useRequestCompOffMutation,
  useResendEmployeeInviteMutation,
  useGetEmployeeDraftByIdQuery,
  useCreateEmployeeDraftMutation,
  useUpdateEmployeeDraftMutation,
  useDeleteEmployeeDraftMutation,
} = directoryApi;
