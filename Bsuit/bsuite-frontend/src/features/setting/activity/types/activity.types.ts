// Base fields present on every log entry
export interface ActivityItemBase {
  timestamp: string;
  username: string;
  userId: number;
  companyId: string;
  module?: string;
  feature?: string;
  status?: string;
}

// Entity-specific optional fields (union of all possible extra fields)
export interface ActivityItemEntityFields {
  // Payroll - Employee
  employeeId?: string | number;
  employee?: number;
  employeeName?: string;
  name?: string;
  incomeTaxName?: string;
  financialYear?: string;
  draftId?: number;

  // Payroll - Salary Template
  templateId?: number;
  templateName?: string;

  // Payroll - Earning
  earningName?: string;

  // Payroll - Deductions
  deductionName?: string;
  nameInPayslip?: string;

  // Attendance - Shift
  shiftId?: number;
  shiftName?: string;
  shiftVersionId?: number;
  shiftVersionName?: string;

  accountName?: string;

  // Timesheet
  projectName?: string;
  projectId?: number;

  // Attendance - Leave Plan
  leavePlanId?: number;
  leavePlanName?: string;

  // Attendance - Leave Type
  leaveTypeName?: string;

  // Attendance - Leave (manager actions)
  rejectedDates?: string[];
  approvedDates?: string[];

  employeeDocumentFolderName?: string;
  employeeDocumentTypeName?: string;
  detailsId?: number;

  weekOff?: string;
  planName?: string;
  leaveDates?: string[];

  payslipTemplateName?: string;
  designationName?: string;
  departmentName?: string;

  expenseCategoryName?: string;
  expense_claim_title?: string;

  [key: string]: unknown;
}

export type ActivityItem = ActivityItemBase & ActivityItemEntityFields;

export interface ActivityResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: ActivityItem[];
}

export interface ActivityFilterParams {
  page?: number;
  limit?: number;
  startTime?: string | null;
  endTime?: string | null;
  users?: string[];
  modules?: string[];
  features?: string[];
  _refresh?: number;
}

export interface DisplayNamesResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: string[];
}

export interface FeaturesModulesResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: {
    modules: string[];
    features: string[];
  };
}