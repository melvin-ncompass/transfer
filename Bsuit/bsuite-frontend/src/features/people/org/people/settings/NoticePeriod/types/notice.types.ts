// ---------- Types (align with backend DTOs and entity) ----------
/** Create body – matches backend CreateNoticePeriodConfigDto */
export interface CreateNoticePeriodConfigDto {
  duration: number;
  leaveEncashmentPolicyType: string; // "Gross" or earning id as string
  /** Backend: 1–366 (leave policy year in days) */
  leavePolicyYear: number;
  leaveEncashmentValue?: number;
}

/** Update body – matches backend UpdateNoticePeriodConfigDto */
export interface UpdateNoticePeriodConfigDto {
  duration?: number;
  leaveEncashmentPolicyType?: string;
  leavePolicyYear?: number;
  leaveEncashmentValue?: number;
}

/** Entity returned by GET :id */
export interface NoticePeriodConfig {
  id: number;
  duration: number;
  leaveEncashmentPolicyType: string;
  leavePolicyYear?: number;
  leaveEncashmentValue?: number;
}

/** Backend response shape: { data, message } */
export interface NoticePeriodApiResponse<T> {
  data: T;
  message: string;
}
