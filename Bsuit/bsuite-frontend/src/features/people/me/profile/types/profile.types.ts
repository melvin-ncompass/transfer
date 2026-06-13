export interface IBasicInformation {
  firstName: string;
  employeeId: string;
  middleName: string;
  lastName: string;
  workEmail: string;
  dateOfJoining: string;
  employeeType: string;
  designation: string;
  department: string;
  subDepartment?: string;
  reportingTo: string;
  expensePolicy: string;
  gender: string;
}

export interface IPersonalInformation {
  nameAsPerPan: string;
  panNumber: string;
  pan?: string;   // Backend might return 'pan'
  panNo?: string; // Backend might return 'panNo'
  nameAsPerAadhar: string;
  aadharNumber: string;
  aadhar?: string;    // Backend might return 'aadhar'
  aadharNo?: string;  // Backend might return 'aadharNo'
  personalEmail: string;
  phoneNumber: string;
  mobileNo?: string; // Backend might return 'mobileNo'
  emergencyContact: string;
  dateOfBirth: string;
  address: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  bloodGroup: string;
  maritalStatus: string;
  fatherName: string;
}


export interface IEducationInformation {
  cgpa: string;
  branch: string;
  degree: string;
  tenure: string;
  university: string;
}

export interface IPaymentInformation {
  bankAccountNumber: string;
  bankAccountHolderName: string;
  bankName: string;
  bankBranchName: string;
  bankIfscCode: string;
}

export interface IProfileMeta {
  isEmployeePortalEnabled: boolean;
  existsInPayRun: boolean;
  itDeclarationExists: boolean;
  inProbation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IPayrollInformation {
  salaryTemplateName?: string;
  salaryTemplateId?: number | string;
  incomeTaxConfig: string;
  incomeTaxConfigId?: number | string;
  uanNumber: string;
  pfNumber: string;
  pfEnabled: boolean;
  isPayrollEnabled?: boolean;
}

export interface IAttendanceInformation {
  shiftInfo: string;
  leavePlan: string;
  weekoffPolicy: string;
  holidayPlan: string;
  shiftId?: number | string;
  weekoffId?: number | string;
  leavePlanId?: number | string;
  holidayPlanId?: number | string;
  isAttendanceEnabled?: boolean;
}

export interface IExperienceInformation {
  designation: string;
  companyName: string;
  startDate: string;
  endDate: string;
}

export interface IEmployeeProfileData {
  basicInformation: IBasicInformation;
  personalInformation: IPersonalInformation;
  educationInformation: IEducationInformation;
  paymentInformation: IPaymentInformation;
  payrollInformation: IPayrollInformation;
  attendanceInformation: IAttendanceInformation;
  experienceInformation: IExperienceInformation[];
  meta?: IProfileMeta;
}

/** Normalize portal profile fields for cards/modals that expect legacy shapes. */
export function normalizeEmployeeProfile(data: IEmployeeProfileData): IEmployeeProfileData {
  const pi = data.personalInformation;
  const address = (pi.address ?? pi.addressLine1 ?? "").trim();

  return {
    ...data,
    personalInformation: {
      ...pi,
      panNumber: pi.panNumber ?? pi.pan ?? pi.panNo ?? "",
      pan: pi.pan ?? pi.panNumber ?? "",
      aadharNumber: pi.aadharNumber ?? pi.aadhar ?? pi.aadharNo ?? "",
      phoneNumber: pi.phoneNumber ?? pi.mobileNo ?? "",
      mobileNo: pi.mobileNo ?? pi.phoneNumber ?? "",
      address: address || pi.addressLine1 || "",
      addressLine1: pi.addressLine1 || address || "",
      addressLine2: pi.addressLine2 ?? "",
      city: pi.city ?? "",
      state: pi.state ?? "",
      pincode: pi.pincode ?? "",
      country: pi.country ?? "",
    },
  };
}

export interface IEmployeeProfileResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: IEmployeeProfileData;
}

// ── Mutation request types ──────────────────────────────────────────────────

export interface IUpdateEducationRequest {
  id: string;
  body: IEducationInformation;
}

export interface IUpdatePersonalInfoRequest {
  id: string;
  body: {
    nameAsPerPan?: string|null;
    panNumber?: string|null;
    panNo?: string|null; // Potential variation
    pan?: string; // Potential variation
    nameAsPerAadhar?: string|null;
    aadharNumber?: string | null;
    aadharNo?: string; // Potential variation
    aadhar?: string; // Potential variation
    personalEmail?: string|null;
    mobileNo?: string|null;
    phoneNumber?: string|null; // Potential variation
    emergencyContact?: string|null;
    dateOfBirth?: string|null;
    addressLine1?: string|null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string|null;
    pincode?: string|null;
    country?: string|null;
    bloodGroup?: string|null;
    maritalStatus?: string|null;
    fatherName?: string|null;
  };
}

export interface IUpdateExperienceRequest {
  id: string;
  body: { experiences: IExperienceInformation[] | null  };
}

export interface IUpdateBasicInfoRequest {
  id: string;
  body: {
    middleName?: string;
    lastName?: string;
    dateOfJoining?: string;
    designationId?: number;
    isSelfReporting?: boolean;
    reportingToEmployeeId?: number;
    departmentId?: number;
    subDepartmentId?: number;
    expensePolicy?: string;
    // Admin-only fields
    employeeId?: string;
    workEmail?: string;
    employeeType?: string;
  };
}

export interface IUpdatePaymentRequest {
  id: string;
  body: {
    bankAccountHolderName?: string|null;
    bankAccountNo?: string|null;
    bankName?: string|null;
    bankBranchName?: string|null;
    bankIfscCode?: string|null;
  };
}

export interface IUpdatePayrollRequest {
  id: string;
  body: {
    isPayrollEnabled?: boolean;
    salaryTemplateId?: number;
    incomeTaxConfigId?: number;
    isPfEnabled?: boolean;
    pfAccNumber?: string;
    uan?: string;
  };
}

export interface IUpdateAttendanceRequest {
  id: string;
  body: {
    isAttendanceEnabled?: boolean;
    shiftId?: number;
    weekoffId?: number;
    leavePlanId?: number;
    holidayPlanId?: number;
  };
}
