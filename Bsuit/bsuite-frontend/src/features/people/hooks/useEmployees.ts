import { useMemo } from "react";
import {
  useGetEmployeesQuery,
  type EmployeeFilterParams,
} from "../org/people/directory/api/directory.api";
import type { Employee } from "../org/people/directory/types/employee.types";

export interface UseEmployeesOptions {
  /** When true (default), only fetch employees with status "active". */
  activeOnly?: boolean;
  /** When true (default), only fetch employees with type "permanent". */
  permanentOnly?: boolean;
  skip?: boolean;
}

export function buildEmployeeListFilter({
  activeOnly = true,
  permanentOnly = true,
}: Pick<UseEmployeesOptions, "activeOnly" | "permanentOnly">): EmployeeFilterParams | void {
  if (!activeOnly && !permanentOnly) {
    return undefined;
  }

  const params: EmployeeFilterParams = {};

  if (activeOnly) {
    params.employeeStatus = ["active"];
  }
  if (permanentOnly) {
    params.employeeType = ["permanent"];
  }

  return params;
}

export function useEmployees(options: UseEmployeesOptions = {}) {
  const {
    activeOnly = true,
    permanentOnly = true,
    skip = false,
  } = options;

  const filter = useMemo(
    () => buildEmployeeListFilter({ activeOnly, permanentOnly }),
    [activeOnly, permanentOnly],
  );

  const query = useGetEmployeesQuery(filter, { skip });

  return {
    ...query,
    employees: (query.data?.data ?? []) as Employee[],
  };
}
