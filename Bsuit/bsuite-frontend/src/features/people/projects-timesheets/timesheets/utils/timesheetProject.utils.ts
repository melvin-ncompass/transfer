import { formatDateShort } from "../../../../../utils/numberFormatter";
import type {
  TimesheetEmployeeGroup,
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

const toProjectTableRow = (
  group: TimesheetEmployeeGroup,
  day: TimesheetEmployeeGroup["days"][number],
  tab: TimesheetStatusTab,
): TimesheetTableRow => ({
  id: `${group.employee.id}-${day.date}`,
  attendanceId: 0,
  employeeId: group.employee.id,
  date: day.date,
  employeeName: group.employee.employeeName,
  jobTitle: group.employee.jobTitle ?? "—",
  department: group.employee.department ?? "—",
  statusLabel: day.status ?? STATUS_LABELS[tab],
  totalHours: day.totalHours,
  hasTasks:
    (day.projectTasks?.length ?? 0) > 0 || (day.companyTasks?.length ?? 0) > 0,
});

export const buildTimesheetProjectTableGroups = (
  data: TimesheetEmployeeGroup[] | undefined,
  groupMode: TimesheetGroupMode,
  tab: TimesheetStatusTab,
  start: string,
  end: string,
): TimesheetTableGroup[] => {
  if (!data?.length) return [];

  const inRange = (date: string) =>
    !start || !end || (date >= start && date <= end);

  if (groupMode === "byEmployee") {
    return data
      .map((group) => ({
        id: group.employee.id,
        name: group.employee.employeeName,
        children: group.days
          .filter((d) => inRange(d.date))
          .map((day) => toProjectTableRow(group, day, tab)),
      }))
      .filter((g) => g.children.length > 0);
  }

  const byDate = new Map<string, TimesheetTableRow[]>();
  data.forEach((group) => {
    group.days
      .filter((d) => inRange(d.date))
      .forEach((day) => {
        const list = byDate.get(day.date) ?? [];
        list.push(toProjectTableRow(group, day, tab));
        byDate.set(day.date, list);
      });
  });

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, children]) => ({
      id: date,
      name: formatDateShort(date),
      children,
    }));
};
