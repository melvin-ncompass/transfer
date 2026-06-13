import { useMemo } from "react";
import { useGetProjectEmployeesQuery } from "../../../projects-timesheets/projects/api/employeeProjectAssignment.api";
import type { TimesheetEmployeeGroup } from "../../../projects-timesheets/timesheets/types/timesheet.types";

/**
 * Fetches the list of employee IDs currently assigned to a project.
 *
 * @param projectId - The project to fetch employees for, or null to skip.
 * @returns `{ employeeIds: number[], isFetching: boolean }`
 */
export function useProjectAssignedEmployeeIds(projectId: number | null): {
  employeeIds: number[];
  isFetching: boolean;
} {
  const { data, isFetching } = useGetProjectEmployeesQuery(
    { projectId: projectId ?? 0 },
    { skip: projectId === null },
  );

  const employeeIds = useMemo(
    () => data?.employees.map((e) => e.employee.id) ?? [],
    [data],
  );

  return { employeeIds, isFetching };
}

/**
 * Filters a timesheet data array to only include employees assigned to a project.
 *
 * When `shouldFilter` is false (e.g. no project selected) the full list is returned as-is.
 * When `isReady` is false (still fetching employee IDs) an empty array is returned
 * so the UI shows a loading state instead of a flash of unfiltered data.
 *
 * @param data         - Raw timesheet groups from the API.
 * @param employeeIds  - IDs of employees assigned to the selected project.
 * @param shouldFilter - Whether filtering should be applied.
 * @param isReady      - Whether the employee ID list has finished loading.
 */
export function filterTimesheetDataByProjectEmployees(
  data: TimesheetEmployeeGroup[],
  employeeIds: number[],
  shouldFilter: boolean,
  isReady: boolean,
): TimesheetEmployeeGroup[] {
  if (!shouldFilter) return data;
  if (!isReady) return [];

  const allowed = new Set(employeeIds);
  return data.filter((group) => allowed.has(group.employee.id));
}
