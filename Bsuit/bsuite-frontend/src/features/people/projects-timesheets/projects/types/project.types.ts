/** Billable hours per day cannot exceed a full calendar day. */
export const MAX_BILLABLE_HOURS_PER_DAY = 24;

export interface ProjectParams {
  projectName: string;
  billableHoursPerDay: number;
}

export interface ProjectResponse {
  id: number;
  projectName: string;
  billableHoursPerDay: number;
  isArchived?: boolean;
  totalEmployees?: number;
}
