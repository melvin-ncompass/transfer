
import { baseApi } from "../../../../../../api/base.api";
import type { Contact } from "../../../../../books/transact/utils/types";
import type { LeaveType } from "../../../../time/leaves/api/leaveType.api";
import type { InitiateExitDto } from "../../directory/api/directory.api";

export type Employee = {
  id: number;
  contact: Contact;
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
};

export type ExitRequest = {
  approvedByAdmin: Employee | null;
  exit: {
    id: number;
    employee: Employee;
    initiateExitBy: "employee" | "company";
    reasonForExit: string;
    exitInitiatedDate: string;
    approvedByAdmin: Employee | null;
    lastWorkingDate: string;
    comments: string | null;
    approvedBy: Employee | null;
    leaveImpactConfigs: LeaveImpactResponse[];
    financeConfigs: {
      id: number;
      gratuity: number;
      bonus: number;
    }[];
    exitLeaveConfig: {
      id: number;
      leaveType: {
        id: number;
        leaveType: string;
        leaveName: string;
        colorCode: string;
        shortCode: string;
        limitToGender: string;
        yearlyQuota: string;
        allocation: string;
        leaveBalances: string;
        expiresAfter: string | null;
        specialDays: Record<string, unknown>;
        isEncashable: boolean;
        isDefault: boolean;
        leaveProration: string | null;
        maxInstances: number;
      };
      encashLeaveFor: number;
      amount: number;
    }[];
    status: "approved" | "exited" | "pending";
    createdAt: string;
    updatedAt: string;
  }

};
export type Exit = ExitRequest["exit"];

export type LeaveImpactResponse = {
  id: number;
  leaveType: LeaveType;
  availability: "can_apply" | "restricted" | string;
  noticePeriodAction: "extend" | "no_action" | string;
  extendByMultiplier: string;
};

export type LeaveImpactConfig = {
  leaveTypeId: number;
  availability: "can_apply" | "restricted" | string;
  noticePeriodAction: "extend" | "no_action" | string;
  extendByMultiplier: number;
};

export type LeaveConfigDto = {
  leaveImpactConfigs: LeaveImpactConfig[];
};

export type ReviewExitDto = {
  status: "approved" | "rejected";
};

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: T;
};

export type ExitResponse = ApiResponse<ExitRequest[]>;

export type EncashableLeaveType = {
  id: number;
  leaveType: string;
  leaveName: string;
  colorCode: string;
  shortCode: string;
  limitToGender: string;
  yearlyQuota: string;
  allocation: string;
  leaveBalances: string;
  expiresAfter: string | null;
  specialDays: {
    work: boolean;
    marriage: boolean;
    birthday: boolean;
  };
  isEncashable: boolean;
  isDefault: boolean;
  leaveProration: string | null;
  maxInstances: number;
};

export type EncashableLeave = {
  id: number;
  leaveType: EncashableLeaveType;
  createdAt: string;
  updatedAt: string;
  totalAllocated: number;
  balance: number;
};

export type EncashableLeaveResponse = ApiResponse<EncashableLeave[]>;

export type EncashableAmount = {
  totalEncashAmount: number;
};

export const exitApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // patch exit
    editExit: builder.mutation<any, { exitId: string | number; body: InitiateExitDto }>({
      query: ({ exitId, body }) => ({
        url: `/exit/edit/${exitId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Exit", "ExitRequest", "ExitProgress"],
    }),

    // approve or reject exit request
    reviewExit: builder.mutation<any, { exitId: string | number | undefined; body: ReviewExitDto }>({
      query: ({ exitId, body }) => ({
        url: `/exit/review/${exitId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Exit", "ExitReview", "ExitProgress", "ExitRequest"],
    }),

    // configure leave
    configLeave: builder.mutation<any, { exitId: string | number; body: LeaveConfigDto }>({
      query: ({ exitId, body }) => ({
        url: `/exit/leave_config/${exitId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ExitRequest", "ExitProgress"],
    }),

    getExitRequest: builder.query<ExitRequest, string | number | undefined>({
      query: (requestId) => `/exit/${requestId}`,
      transformResponse: (response: ApiResponse<ExitRequest>) => response.data,
      providesTags: ["ExitRequest"],
    }),

    submitFinanceConfig: builder.mutation<any, { exitId: string | number; body: any }>({
      query: ({ exitId, body }) => ({
        url: `/exit/employee/finance/${exitId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ExitRequest", "ExitProgress"],
    }),

    getExited: builder.query<ExitRequest[], void>({
      query: () => "/exit/exited",
      transformResponse: (response: ApiResponse<ExitRequest[]>) => response.data,
      providesTags: ["Exit"],
    }),

    getInReview: builder.query<Exit[], void>({
      query: () => "/exit/in_review",
      transformResponse: (response: ApiResponse<Exit[]>) => response.data,
      providesTags: ["ExitReview"],
    }),

    getInProgress: builder.query<ExitRequest[], void>({
      query: () => "/exit/in_progress",
      transformResponse: (response: ApiResponse<ExitRequest[]>) => response.data,
      providesTags: ["ExitProgress"],
    }),

    revertExitRequest: builder.mutation<any, { exitId: string | number | undefined; }>({
      query: ({ exitId }) => ({
        url: `/exit/revert/${exitId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employee", "Exit", "ExitReview", "ExitProgress", "ExitRequest"],
    }),

    getEmployeeAssets: builder.query<any[], string | number>({
      query: (employeeId) => `/exit/employee/asset/${employeeId}`,
      transformResponse: (response: ApiResponse<any[]>) => response.data,
      providesTags: ["AssetCategory", "AssetType", "ExitRequest"],
    }),
    getEncashableLeaves: builder.query<EncashableLeave[], string | number>({
      query: (employeeId) => `/exit/encashable-leave/${employeeId}`,
      transformResponse: (response: EncashableLeaveResponse) => response.data,
      providesTags: ["ExitRequest"],
    }),
    getEncashableAmount: builder.query<
      EncashableAmount,
      { employeeId: string | number; days: number }
    >({
      query: ({ employeeId, days }) =>
        `/exit/encashable-amount/${employeeId}?days=${days}`,
      transformResponse: (response: ApiResponse<EncashableAmount>) => response.data,
    }),
  }),
});

export const {
  useEditExitMutation,
  useReviewExitMutation,
  useConfigLeaveMutation,
  useGetExitRequestQuery,
  useGetExitedQuery,
  useGetInReviewQuery,
  useGetInProgressQuery,
  useRevertExitRequestMutation,
  useSubmitFinanceConfigMutation,
  useGetEmployeeAssetsQuery,
  useGetEncashableLeavesQuery,
  useLazyGetEncashableAmountQuery,
} = exitApi;
