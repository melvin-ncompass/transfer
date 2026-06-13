import { formatDateShort } from "../../../../../utils/numberFormatter";
import type {
  AttendanceGetTasksCompanyTask,
  AttendanceGetTasksData,
  AttendanceGetTasksProjectTask,
} from "../../../me/attendance/api/attendance.api";
import type {
  AttendanceGroupedTasksData,
  AttendanceTaskListItem,
  DrawerTaskCard,
  TimesheetGroupMode,
  TimesheetStatusTab,
  TimesheetTableGroup,
  TimesheetTableRow,
} from "../types/timesheet.types";

const STATUS_LABELS: Record<TimesheetStatusTab, string> = {
  pending_on_employee: "Pending",
  pending_verification: "Pending Verification",
  verified: "Verified",
};

export const getDefaultMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: toIso(start), end: toIso(end) };
};

export const buildTimesheetQueryString = (
  start: string,
  end: string,
  filters?: Record<string, unknown>,
): string => {
  const params = new URLSearchParams({ fromDate: start, toDate: end });
  if (!filters) return params.toString();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
      return;
    }
    if (typeof value === "boolean") {
      params.set(key, String(value));
      return;
    }
    params.set(key, String(value));
  });
  
  return params.toString();
};

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const parseDescription = (value: string | null | undefined): string => {
  if (!value?.trim()) return "";
  const trimmed = value.trim();
  if (trimmed.includes("<li>")) {
    const liMatches = trimmed.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    if (liMatches?.length) {
      return liMatches
      .map((li) => stripHtml(li.replace(/<\/?li[^>]*>/gi, "")))
      .filter(Boolean)
      .join(", ");
    }
  }
  return stripHtml(trimmed).replace(/\n+/g, ", ");
};

export const attendanceItemHasTasks = (item: AttendanceTaskListItem): boolean => {
  const { projectTasks, companyTasks } = item.tasks ?? {
    projectTasks: [],
    companyTasks: [],
  };
  return projectTasks.length > 0 || companyTasks.length > 0;
};

const resolveEmployeeDbId = (item: AttendanceTaskListItem): number =>
  item.empid ?? item.empId ?? 0;

const toTableRow = (
  item: AttendanceTaskListItem,
  tab: TimesheetStatusTab,
): TimesheetTableRow => ({
  id: String(item.id),
  attendanceId: item.id,
  employeeId: resolveEmployeeDbId(item),
  date: item.date,
  employeeName: item.employeeName,
  jobTitle: item.designation ?? "—",
  department: item.department ?? "—",
  statusLabel: STATUS_LABELS[tab],
  totalHours: item.totalHours ?? 0,
  hasTasks: attendanceItemHasTasks(item),
});

const filterItemsByDateRange = (
  items: AttendanceTaskListItem[],
  start: string,
  end: string,
) => {
  if (!start || !end) return items;
  return items.filter((item) => item.date >= start && item.date <= end);
};

const filterGroupedData = (
  data: AttendanceGroupedTasksData,
  start: string,
  end: string,
): AttendanceGroupedTasksData => {
  const filterGroup = (group: Record<string, AttendanceTaskListItem[]>) =>
    Object.fromEntries(
      Object.entries(group)
      .map(([key, items]) => [
        key,
        filterItemsByDateRange(items, start, end),
      ])
      .filter(([, items]) => (items as AttendanceTaskListItem[]).length > 0),
    );
    
    return {
      groupedByEmployee: filterGroup(data.groupedByEmployee ?? {}),
      groupedByDate: filterGroup(data.groupedByDate ?? {}),
  };
};

export const buildAttendanceTableGroups = (
  data: AttendanceGroupedTasksData | undefined,
  groupMode: TimesheetGroupMode,
  tab: TimesheetStatusTab,
  start: string,
  end: string,
): TimesheetTableGroup[] => {
  if (!data) return [];
  
  const filtered = filterGroupedData(data, start, end);
  const grouped =
  groupMode === "byEmployee"
  ? filtered.groupedByEmployee
  : filtered.groupedByDate;
  
  return Object.entries(grouped)
  .map(([key, items]) => {
    const children = items.map((item) => toTableRow(item, tab));
    const name =
    groupMode === "byEmployee"
    ? (items[0]?.employeeName ?? key)
    : formatDateShort(key);
    
    return {
      id: key,
      name,
        children,
      };
    })
    .filter((g) => g.children.length > 0)
    .sort((a, b) => {
      if (groupMode === "byDate") {
        return String(a.id).localeCompare(String(b.id));
      }
      return a.name.localeCompare(b.name);
    });
  };
  
  const mapProjectTaskToCard = (
    task: AttendanceGetTasksProjectTask,
  ): DrawerTaskCard => ({
  type: "Project Task",
  title: task.project?.projectName,
  description:
  parseDescription(task.pendingDescription) ||
  parseDescription(task.description) ||
  "—",
  hours: task.timeInHours,
  comments: Array.isArray(task.comments) ? task.comments : undefined,
});

const mapCompanyTaskToCard = (
  task: AttendanceGetTasksCompanyTask,
): DrawerTaskCard => ({
  type: "Company Task",
  description:
  parseDescription(task.pendingDescription) ||
  parseDescription(task.description) ||
  "—",
  hours: task.timeInHours,
  comments: Array.isArray(task.comments)
  ? (task.comments as DrawerTaskCard["comments"])
  : undefined,
});

export const mapAttendanceTasksToDrawerCards = (
  data: AttendanceGetTasksData | undefined,
): DrawerTaskCard[] => {
  if (!data) return [];
  return [
    ...(data.projectTasks ?? []).map(mapProjectTaskToCard),
    ...(data.companyTasks ?? []).map(mapCompanyTaskToCard),
  ];
};

/** Build groups from legacy GET /timesheet/employee (project-scoped view) */

export { buildTimesheetProjectTableGroups } from "./timesheetProject.utils";