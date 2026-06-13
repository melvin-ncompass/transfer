import { useState, useEffect, useMemo } from "react";
import { Stack, Box, FormControlLabel, Checkbox } from "@mui/material";
import { MultiSelectElement } from "../../../../../components/atom/select-field/MultiSelect";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { PrimaryButton } from "../../../../../components/atom/button";
import { useGetAllDepartmentsQuery } from "../../../org/people/department/api/department.api";
import type { IDepartment } from "../../../org/people/department/types/department.types";
import { useGetEmployeesQuery } from "../../../org/people/directory/api/directory.api";
import type { Employee } from "../../../org/people/directory/types/employee.types";
import { useGetTechStacksQuery } from "../../../projects-timesheets/settings/api/projectSettings.api";
import type { TechStackResponse } from "../../../projects-timesheets/settings/types/projectSettings.types";

export type FilterSelectOption = { label: string; value: string };

interface EmployeeFilterModalProps {
  open: boolean;
  onClose: () => void;
  /** Projects shown in the report sidebar — limits the Project Name multi-select */
  projectOptions: FilterSelectOption[];
  initialValues: {
    departmentId: number[];
    assignedToProjects: boolean;
    techStackId: number[];
    projectId: number[];
    employeeId: number | null;
  };
  onApply: (filters: {
    departmentId: number[];
    assignedToProjects: boolean;
    techStackId: number[];
    projectId: number[];
    employeeId: number | null;
  }) => void;
}

export function EmployeeFilterModal({
  open,
  onClose,
  projectOptions,
  initialValues,
  onApply,
}: EmployeeFilterModalProps) {
  // State
  const [departmentId, setDepartmentId] = useState<string[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [assignedToProjects, setAssignedToProjects] = useState<boolean>(true);
  const [projectId, setProjectId] = useState<string[]>([]);
  const [techStackId, setTechStackId] = useState<string[]>([]);

  // Queries
  const { data: deptData } = useGetAllDepartmentsQuery();
  const { data: empData } = useGetEmployeesQuery();
  const { data: techData } = useGetTechStacksQuery();

  // Map to options
  const deptOptions = useMemo(() => {
    return (
      deptData?.data?.map((d: IDepartment) => ({
        label: d.departmentName,
        value: String(d.id),
      })) ?? []
    );
  }, [deptData]);

  const empOptions = useMemo(() => {
    return (
      empData?.data?.map((e: Employee) => {
        const name = e.contact?.name || `${e.contact?.firstName ?? ""} ${e.contact?.lastName ?? ""}`.trim() || e.employeeId || `Employee #${e.id}`;
        return {
          label: name,
          value: String(e.id),
        };
      }) ?? []
    );
  }, [empData]);

  const projOptions = projectOptions;

  const techOptions = useMemo(() => {
    return (
      techData?.map((t: TechStackResponse) => ({
        label: t.techStackName,
        value: String(t.id),
      })) ?? []
    );
  }, [techData]);

  // Sync on open — keep only project ids that exist in the sidebar list
  useEffect(() => {
    if (open && initialValues) {
      const allowedProjectIds = new Set(projectOptions.map((o) => o.value));
      setDepartmentId(initialValues.departmentId.map(String));
      setEmployeeId(initialValues.employeeId ? String(initialValues.employeeId) : "");
      setAssignedToProjects(initialValues.assignedToProjects);
      setProjectId(
        initialValues.projectId
          .map(String)
          .filter((id) => allowedProjectIds.has(id)),
      );
      setTechStackId(initialValues.techStackId.map(String));
    }
  }, [open, initialValues, projectOptions]);

  const hasChanges = useMemo(() => {
    const currentDepartmentIds = departmentId.map(Number).sort((a, b) => a - b);
    const initialDepartmentIds = [...initialValues.departmentId].sort((a, b) => a - b);
    const currentProjectIds = projectId.map(Number).sort((a, b) => a - b);
    const initialProjectIds = [...initialValues.projectId].sort((a, b) => a - b);
    const currentTechStackIds = techStackId.map(Number).sort((a, b) => a - b);
    const initialTechStackIds = [...initialValues.techStackId].sort((a, b) => a - b);
    const currentEmployeeId = employeeId ? Number(employeeId) : null;

    return (
      JSON.stringify(currentDepartmentIds) !== JSON.stringify(initialDepartmentIds) ||
      currentEmployeeId !== initialValues.employeeId ||
      assignedToProjects !== initialValues.assignedToProjects ||
      JSON.stringify(currentProjectIds) !== JSON.stringify(initialProjectIds) ||
      JSON.stringify(currentTechStackIds) !== JSON.stringify(initialTechStackIds)
    );
  }, [
    departmentId,
    employeeId,
    assignedToProjects,
    projectId,
    techStackId,
    initialValues,
  ]);

  const handleApply = () => {
    onApply({
      departmentId: departmentId.map(Number),
      employeeId: employeeId ? Number(employeeId) : null,
      assignedToProjects,
      projectId: projectId.map(Number),
      techStackId: techStackId.map(Number),
    });
    onClose();
  };

  return (
    <ModalElement
      open={open}
      title="Filters"
      onClose={onClose}
      height={480}
      maxWidth="sm"
      hideCloseButton={false}
      sx={{
        "& .MuiDialog-paper": {
          width: { xs: "98vw", sm: 480 },
          margin: 2,
        },
      }}
    >
      <Stack spacing={2} width="100%" sx={{ pt: 1 }}>
        <MultiSelectElement
          label="Departments"
          options={deptOptions}
          value={departmentId}
          onChange={setDepartmentId}
          width="100%"
          placeholder="Select an option"
        />

        <SingleSelectElement
          label="Employee Name"
          options={empOptions}
          value={employeeId}
          onChange={setEmployeeId}
          width="100%"
          placeholder="Select an option"
          clearable
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={assignedToProjects}
              onChange={(e) => setAssignedToProjects(e.target.checked)}
              color="primary"
            />
          }
          label="Show only employees in project"
          sx={{ userSelect: "none" }}
        />

        <MultiSelectElement
          label="Project Name"
          options={projOptions}
          value={projectId}
          onChange={setProjectId}
          width="100%"
          placeholder="Select an option"
          disabled={!assignedToProjects}
        />

        <MultiSelectElement
          label="Tech stack"
          options={techOptions}
          value={techStackId}
          onChange={setTechStackId}
          width="100%"
          placeholder="Select an option"
          disabled={!assignedToProjects}
        />
      </Stack>
      
      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <PrimaryButton onClick={handleApply} disabled={!hasChanges}>
          Update
        </PrimaryButton>
      </Box>
    </ModalElement>
  );
}
