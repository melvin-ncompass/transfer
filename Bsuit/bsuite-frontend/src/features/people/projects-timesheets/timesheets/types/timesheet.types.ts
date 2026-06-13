export type TimesheetStatusTab =
  | "pending_on_employee"
  | "pending_verification"
  | "verified";

export type TimesheetGroupMode = "byEmployee" | "byDate";

/** List row from GET /attendance/pending_tasks | verification_pending | verified */
export interface AttendanceTaskListItem {
  id: number;
  empid?: number;
  empId?: number;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  date: string;
  tasks: {
    projectTasks: AttendanceListProjectTask[];
    companyTasks: AttendanceListCompanyTask[];
  };
  totalHours: number;
  clockInOut?: { time: string; type: string }[];
  comments?: string | null;
}

export interface AttendanceListProjectTask {
  id?: number;
  project?: {
    id: number;
    projectName: string;
    billableHoursPerDay?: number;
    isArchived?: boolean;
  };
  description?: string | null;
  pendingDescription?: string | null;
  status?: string;
}

export interface AttendanceListCompanyTask {
  id?: number;
  description?: string | null;
  pendingDescription?: string | null;
  status?: string;
}

export interface AttendanceGroupedTasksData {
  groupedByEmployee: Record<string, AttendanceTaskListItem[]>;
  groupedByDate: Record<string, AttendanceTaskListItem[]>;
}

export interface TimesheetDateRangeParams {
  start: string;
  end: string;
}

export interface TimesheetEmployeeFilterBody {
  departmentId?: number[];
  assignedToProjects?: boolean;
  techStackId?: number[];
  projectId?: number[];
}

export interface TimesheetProjectFilterBody {
  techStackId?: number;
  isBillable?: boolean;
}

export type TimesheetEmployeeQueryArgs = TimesheetDateRangeParams &
  TimesheetEmployeeFilterBody;

export type TimesheetProjectQueryArgs = TimesheetDateRangeParams &
  TimesheetProjectFilterBody & {
    projectId: number;
  };

/** Legacy timesheet project view — GET /timesheet/employee */
export interface TimesheetEmployeeInfo {
  id: number;
  employeeId: string;
  employeeName: string;
  jobTitle?: string;
  department?: string;
}

export interface TimesheetDayEntry {
  date: string;
  isLeave: boolean;
  isCompOff: boolean;
  comments: string;
  projectTasks: (string | null)[];
  companyTasks?: (string | null)[];
  totalHours: number;
  day: number;
  status?: string;
}

export interface TimesheetEmployeeGroup {
  employee: TimesheetEmployeeInfo;
  days: TimesheetDayEntry[];
}

export interface AttendanceTasksActionArgs {
  attendanceIds: number[];
  reason?: string;
}

export interface DrawerTaskCard {
  type: "Project Task" | "Company Task";
  title?: string;
  description: string;
  hours?: string;
  comments?: { date: string; user: string; message: string }[];
}

export interface TimesheetTableRow {
  id: string;
  attendanceId: number;
  employeeId: number;
  date: string;
  employeeName: string;
  jobTitle: string;
  department: string;
  statusLabel: string;
  totalHours: number;
  hasTasks: boolean;
}

export interface TimesheetTableGroup {
  id: string | number;
  name: string;
  children: TimesheetTableRow[];
}
