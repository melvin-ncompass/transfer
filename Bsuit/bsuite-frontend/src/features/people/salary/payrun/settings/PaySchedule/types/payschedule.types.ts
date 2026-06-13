/** Create/Update body – matches backend CreatePayScheduleDto / UpdatePayScheduleDto */
export interface PaySchedulePayload {
  frequency?: string;
  workingDays?: string;
  dateOfProcessing?: number;
  firstPayrollFrom?: string | null;
  financialYearStart?: string | null;
  financialYearEnd?: string | null;
  considerPoiFrom?: number;
  isCalendarMonth?: boolean;
  fromPayCycle?: string;
  toPayCycle?: string;
  /** GET response: when true, UI may show edit; when false, schedule is view-only. */
  iseditable?: boolean;
  isEditable?: boolean;
}

/** GET response – backend may return `data` as one schedule object or an array */
export interface PayScheduleGetResponse {
  data?: PaySchedulePayload | PaySchedulePayload[] | null;
  message?: string;
}

/** POST/PATCH response – backend returns { data: PaySchedule } */
export interface PayScheduleResponse {
  data?: PaySchedulePayload | null;
  message?: string;
}