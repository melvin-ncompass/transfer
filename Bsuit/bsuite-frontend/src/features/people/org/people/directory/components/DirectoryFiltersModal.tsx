import { useState, useEffect } from "react";
import { Stack, Box } from "@mui/material";
import { MultiSelectElement } from "../../../../../../components/atom/select-field/MultiSelect";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { PrimaryButton } from "../../../../../../components/atom/button";
import type { EmployeeFilterParams } from "../api/directory.api";

/** Options for directory filters */
const EMPLOYEE_TYPE_OPTIONS = [
  { label: "Permanent", value: "permanent" },
  { label: "Intern", value: "intern" },
];

const EMPLOYEE_STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Relieved", value: "relieved" },
  { label: "Terminated", value: "terminated" },
  { label: "Draft", value: "employee_draft" },
];

export interface DirectoryFilterOption {
  label: string;
  value: string;
}

function getDepartmentSelectionValue(
  departmentOptions: DirectoryFilterOption[],
  initialValues?: EmployeeFilterParams,
): string[] {
  if (!initialValues) return [];

  const selected: string[] = [];
  const departmentIds = initialValues.departmentId ?? [];
  const subDepartmentIds = initialValues.subDepartmentId ?? [];

  departmentIds.forEach((departmentId) => {
    const baseValue = `d-${departmentId}`;
    if (departmentOptions.some((opt) => opt.value === baseValue)) {
      selected.push(baseValue);
    }
  });

  subDepartmentIds.forEach((subDepartmentId) => {
    departmentOptions.forEach((opt) => {
      if (opt.value.endsWith(`-s-${subDepartmentId}`) && !selected.includes(opt.value)) {
        selected.push(opt.value);
      }
    });
  });

  return selected;
}

function parseDepartmentFilterValue(
  values?: string[],
): { departmentId?: number[]; subDepartmentId?: number[] } {
  if (!values?.length) return {};

  const departmentIdSet = new Set<number>();
  const subDepartmentIdSet = new Set<number>();

  values.forEach((value) => {
    const subMatch = value.match(/^d-(\d+)-s-(\d+)$/);
    if (subMatch) {
      // departmentIdSet.add(Number(subMatch[1]));
      subDepartmentIdSet.add(Number(subMatch[2]));
      return;
    }

    const deptMatch = value.match(/^d-(\d+)$/);
    if (deptMatch) {
      departmentIdSet.add(Number(deptMatch[1]));
    }
  });

  return {
    departmentId: departmentIdSet.size ? Array.from(departmentIdSet) : undefined,
    subDepartmentId: subDepartmentIdSet.size ? Array.from(subDepartmentIdSet) : undefined,
  };
}

interface DirectoryFiltersModalProps {
  open: boolean;
  onClose: () => void;
  /** Currently applied filter values */
  initialValues?: EmployeeFilterParams;
  /** Called when user clicks Apply with selected filters */
  onApply: (filters: EmployeeFilterParams) => void;
  departmentOptions: DirectoryFilterOption[];
  designationOptions: DirectoryFilterOption[];
}

export function DirectoryFiltersModal({
  open,
  onClose,
  initialValues,
  onApply,
  departmentOptions,
  designationOptions,
}: DirectoryFiltersModalProps) {
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [designationIds, setDesignationIds] = useState<string[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<string[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setDepartmentIds(getDepartmentSelectionValue(departmentOptions, initialValues));
    setDesignationIds(initialValues?.designationId?.map(String) ?? []);
    setEmployeeTypes(initialValues?.employeeType ?? []);
    setEmployeeStatuses(initialValues?.employeeStatus ?? []);
  }, [open, initialValues, departmentOptions]);

  const handleApply = () => {
    const parsedDepartmentFilters = parseDepartmentFilterValue(departmentIds);
    const filters: EmployeeFilterParams = {
      ...parsedDepartmentFilters,
    };

    if (designationIds.length) filters.designationId = designationIds.map(Number);
    if (parsedDepartmentFilters.departmentId?.length) {
      filters.departmentId = parsedDepartmentFilters.departmentId;
    }
    if (employeeTypes.length) filters.employeeType = [...employeeTypes];
    if (employeeStatuses.length) filters.employeeStatus = [...employeeStatuses];

    onApply(filters);
    onClose();
  };

  return (
    <ModalElement
      open={open}
      title="Filters"
      onClose={onClose}
      height={420}
      maxWidth="sm"
      hideCloseButton={false}
      sx={{
        "& .MuiDialog-paper": {
          width: { xs: "98vw", sm: 440 },
          margin: 2,
        },
      }}
    >
      <Stack spacing={2} width="100%">
        <MultiSelectElement
          label="Department"
          options={departmentOptions}
          value={departmentIds}
          onChange={setDepartmentIds}
          width="100%"
        />
        <MultiSelectElement
          label="Designation"
          options={designationOptions}
          value={designationIds}
          onChange={setDesignationIds}
          width="100%"
        />
        <MultiSelectElement
          label="Employee type"
          options={EMPLOYEE_TYPE_OPTIONS}
          value={employeeTypes}
          onChange={setEmployeeTypes}
          width="100%"
        />
        <MultiSelectElement
          label="Employee status"
          options={EMPLOYEE_STATUS_OPTIONS}
          value={employeeStatuses}
          onChange={setEmployeeStatuses}
          width="100%"
        />
      </Stack>
      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <PrimaryButton onClick={handleApply}>Apply</PrimaryButton>
      </Box>
    </ModalElement>
  );
}
