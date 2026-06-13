import { baseApi } from "../../../../../../api/base.api";

interface Employee {
  id: number;
  contact: {
    name: string;
  }
  employeeId: string;
  gender: string | null;
  employeeType: string;
  dateOfJoining: string;
  pfNumber: string | null;
  uanNumber: string | null;
  dateOfBirth: string;
  personalEmail: string | null;
  emergencyContact: string | null;
  fatherName: string | null;
  bloodGroup: string | null;
  aadharNumber: string | null;
  status: string;
  bankAccountNo: string | null;
  bankAccountHolderName: string | null;
  bankIfscCode: string | null;
  bankName: string | null;
  bankBranchName: string | null;
  isPfEnabled: boolean;
  probationEndDate: string | null;
  inProbation: boolean;
  nameAsPerAadhar: string | null;
  nameAsPerPan: string | null;
  maritalStatus: string | null;
  isPayrollEnabled: boolean;
  isAttendanceEnabled: boolean;
  isEmployeePortalEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExitedEmployee extends Employee {
  reportingToEmployee: Employee;
}

  { /* Manager DTO */}
  // Specific Reassignment
  interface SpecificReassignment {
    employeeId: number;
    newManagerId: number;
  }

  interface SpecificReassignPayload {
    reassignments: SpecificReassignment[];
  }

  // Bulk Reassignment
  interface BulkReassignPayload {
    applyToEveryone: boolean;
    newManagerId: number;
  }

interface ManagerStatus {
    isManager: boolean;
}

 { /* Approver DTO*/}
 interface ExpenseSpecificReassignment {
  policyId: number;
  newApproverId: number;
}

interface ExpenseSpecificReassignPayload {
  reassignments: ExpenseSpecificReassignment[];
}

interface ExpenseBulkReassignPayload {
  applyToAll: boolean;
  newApproverId: number;
}
interface ApproverStatus {
  isExpenseApprover: boolean;
  expensePolicies: { id: number; policyName: string }[];
}

interface ReportingEmployee {
  id: number;
  employeeId: string;
  name: string;
}

interface ExpensePolicy {
  id: number;
  policyName: string;
}

export interface ManagerApproverStatus {
  isManager: boolean;
  reportingEmployees: ReportingEmployee[];
  isExpenseApprover: boolean;
  expensePolicies: ExpensePolicy[];
}

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: T;
};

type ReassignPayload =
  | SpecificReassignPayload
  | BulkReassignPayload
  | ExpenseSpecificReassignPayload
  | ExpenseBulkReassignPayload;

export const exitManagerReassignApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        checkManagerStatusEmployee: builder.query<ManagerStatus, string | number | undefined>({
            query: (employeeId: string) => ({
                url: `/exit/is_manager/${employeeId}`,
                method: "GET",
            }),
            transformResponse: (response: ApiResponse<ManagerStatus>) => response.data,
            providesTags: ["checkManagerStatusEmployee"],
        }),

        getReportingEmployeeList: builder.query<ExitedEmployee[], string | number | undefined>({
            query: (employeeId: string) => ({
                url: `/exit/all_reporting_employee/${employeeId}`,
                method: "GET",
            }),
            transformResponse: (response: ApiResponse<ExitedEmployee[]>) => response.data,
            providesTags: ["getReportingEmployeeList"],
        }),

        reassignManager: builder.mutation<
            any, 
            { 
                employeeId: string | number | undefined; 
                body: ReassignPayload 
            }
        >({
                query: ({ employeeId, body }) => ({
                    url: `/exit/reassign_employees/${employeeId}`,
                    method: "POST",
                    body,
                }),
                invalidatesTags: ["checkManagerStatusEmployee", "getReportingEmployeeList", "Employee","checkManagerApproverStatus"],
            }
        ),
        // ------------------------------------ Expense Approver ---------------------------

        checkApproverStatusEmployee: builder.query<ApproverStatus, string | number | undefined>({
            query: (employeeId: string) => ({
                url: `/exit/is_expense_approver/${employeeId}`,
                method: "GET",
            }),
            transformResponse: (response: ApiResponse<ApproverStatus>) => response.data,
            providesTags: ["checkApproverStatusEmployee"],
        }),


        getManagerExpenseApprover: builder.query<
          ManagerApproverStatus,
          string | number | undefined
        >({
          query: (employeeId) => ({
            url: `/exit/is_manager_approver/${employeeId}`,
            method: "GET",
          }),
          transformResponse: (response: ApiResponse<ManagerApproverStatus>) => response.data,
          providesTags: ["checkManagerApproverStatus", "Employee"],
        }),

        reassignApprover: builder.mutation<
            any,
            { employeeId: string | number | undefined; 
              body: ReassignPayload 
            }
        >({
            query: ({ employeeId, body }) => ({
                url: `/exit/reassign_policy_approver/${employeeId}`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["checkApproverStatusEmployee", "checkManagerApproverStatus"],
        }),

    })
})

export const { 
    useCheckManagerStatusEmployeeQuery,
    useLazyCheckManagerStatusEmployeeQuery,
    useGetReportingEmployeeListQuery, 
    useReassignManagerMutation,
    useGetManagerExpenseApproverQuery,
    useLazyGetManagerExpenseApproverQuery,
    useReassignApproverMutation
} = exitManagerReassignApi;