import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material"
import { Tooltip } from "../../../../../components/atom/tooltip";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import { SearchBoxAtom } from "../../../../../components/searchbar/SearchBoxAtom";
import { ModalElement } from "../../../../../components/dialogs/modal-element/ModalElement";
import { RepeaterElement } from "../../../../../components/atom/form-repeater";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { DatePickerElement } from "../../../../../components/atom/date-picker/DatePicker";
import { PrimaryButton } from "../../../../../components/atom/button";
import { Snackbar } from "../../../../../components/atom/snackbar";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import { EmployeeCard } from "./EmployeeDetailsCard";

import GroupAddIcon from '@mui/icons-material/GroupAdd';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import AddIcon from '@mui/icons-material/Add';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import DeleteIcon from "@mui/icons-material/Delete";
import { ArrowBack } from "@mui/icons-material";
import type { StandardTableColumn } from "../../../../../types/types";

import { useGetEmployeesQuery } from "../../../org/people/directory/api/directory.api";
import { useGetProjectTagsQuery, useGetTechStacksQuery } from "../../settings/api/projectSettings.api";
import {
  useGetProjectEmployeesQuery,
  useGetAssignmentHistoryQuery,
  useCreateAssignmentsMutation,
  useArchiveEmployeeFromProjectMutation,
  useUnarchiveEmployeeFromProjectMutation,
  useDeleteAssignmentRecordMutation,
  type ProjectEmployeeItem,
  type AssignmentHistoryRow,
} from "../api/employeeProjectAssignment.api";
import { useGetProjectQuery } from "../api/project.api";

import dayjs, { type Dayjs } from "dayjs";
import { formatDateShort } from "../../../../../utils/numberFormatter";
import CardAtom from "../../../../../components/atom/card/Card";
import { Chip } from "../../../../../components/atom/chips";
import FilterListIcon from "@mui/icons-material/FilterList";
import { Checkbox } from "../../../../../components/atom/check-box";

// ── Re-export type alias used by EmployeeDetailsCard ─────────────────────────
export type ProjectEmployee = ProjectEmployeeItem;

interface AssignmentRow {
  employeeId: string;
  isBillable: string;
  techStackId: string;
  startDate: Dayjs | null;
  tags: string;
}

const BILLABLE_OPTIONS = [
  { label: "Billable", value: "true" },
  { label: "Non-Billable", value: "false" },
];

const INITIAL_ROW_ASSIGNMENT_DTO: AssignmentRow = {
  employeeId: "",
  isBillable: "true",
  techStackId: "",
  startDate: dayjs(),
  tags: "",
};

const ProjectDetailsSection = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const projectIdNum = projectId ? Number(projectId) : undefined;

  const [isBasedOnToday, setIsBasedOnToday] = useState(true);
  // ── Global lookup queries ─────────────────────────────────────────────────
  const { data: employeeList } = useGetEmployeesQuery();
  const { data: techStackList } = useGetTechStacksQuery();
  const { data: projectTags } = useGetProjectTagsQuery();

  // ── Project employees ─────────────────────────────────────────────────────
  const {
    data: projectEmployeesData,
    isLoading: isEmployeesLoading,
  } = useGetProjectEmployeesQuery({ projectId: projectIdNum!, isBasedOnTodayDate: isBasedOnToday }, { skip: !projectIdNum });

  const projectEmployees: ProjectEmployee[] = projectEmployeesData?.employees ?? [];
  const totalEmployees = projectEmployeesData?.totalRecords ?? 0;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const [createAssignments, { isLoading: isSubmitting }] = useCreateAssignmentsMutation();
  const [archiveEmployee, { isLoading: isArchiving }] = useArchiveEmployeeFromProjectMutation();
  const [unarchiveEmployee, { isLoading: isUnarchiving }] = useUnarchiveEmployeeFromProjectMutation();
  const [deleteAssignmentRecord] = useDeleteAssignmentRecordMutation();

  const [selectedEmployee, setSelectedEmployee] = useState<ProjectEmployee | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isArchiveDateModalOpen, setIsArchiveDateModalOpen] = useState(false);
  const [archiveEndDate, setArchiveEndDate] = useState<Dayjs | null>(dayjs());

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error";
  }>({ open: false, message: "", color: "success" });

  const employeeOptions = [
    ...(employeeList?.data?.map((employee) => ({
      label: employee.nameAsPerAadhar || employee.nameAsPerPan || employee.contact?.name || "",
      value: String(employee.id),
    })) ?? []),
  ];

  const techStackOptions = [
    ...(techStackList?.map((techStack) => ({
      label: techStack.techStackName,
      value: String(techStack.id),
    })) ?? []),
  ];

  const projectTagOptions = [
    ...(projectTags?.map((tag) => ({
      label: tag.tagName,
      value: String(tag.id),
    })) ?? []),
  ];

  // ── Project query ─────────────────────────────────────────────────────────
  const { data: projectInfo, isLoading: isProjectLoading } = useGetProjectQuery(
    projectIdNum!,
    { skip: !projectIdNum }
  );

  const handleRowMenuOpen = (event: React.MouseEvent<HTMLElement>, emp: ProjectEmployee) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedEmployee(emp);
  };

  const handleRowMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleArchiveTrigger = () => {
    if (!selectedEmployee) return;
    handleRowMenuClose();
    setArchiveEndDate(dayjs());
    setIsArchiveDateModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!selectedEmployee || !archiveEndDate || !projectIdNum) return;
    try {
      await archiveEmployee({
        employeeId: selectedEmployee.employee.id,
        projectId: projectIdNum,
        endDate: archiveEndDate.format("YYYY-MM-DD"),
      }).unwrap();
      setSnackbar({ open: true, message: `${selectedEmployee.employee.name} archived from project.`, color: "success" });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.data?.message || "Failed to archive employee.", color: "error" });
    } finally {
      setIsArchiveDateModalOpen(false);
      setSelectedEmployee(null);
    }
  };

  const handleUnarchiveTrigger = async () => {
    if (!selectedEmployee || !projectIdNum) return;
    handleRowMenuClose();
    try {
      await unarchiveEmployee({
        employeeId: selectedEmployee.employee.id,
        projectId: projectIdNum,
      }).unwrap();
      setSnackbar({ open: true, message: `${selectedEmployee.employee.name} unarchived from project.`, color: "success" });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.data?.message || "Failed to unarchive employee.", color: "error" });
    } finally {
      setSelectedEmployee(null);
    }
  };

  // ── Search / filter ───────────────────────────────────────────────────────
  type SearchableEmployee = { _searchName: string; _orig: ProjectEmployee };
  const searchableList: SearchableEmployee[] = projectEmployees.map((e) => ({
    _searchName: `${e.employee.name ?? ""} ${e.employee.lastName ?? ""}`.trim(),
    _orig: e,
  }));

  const [filteredEmployees, setFilteredEmployees] = useState<ProjectEmployee[]>([]);
  const [hasFiltered, setHasFiltered] = useState(false);

  const handleFilteredData = useCallback((data: SearchableEmployee[]) => {
    setHasFiltered(true);
    setFilteredEmployees(data.map((d) => d._orig));
  }, []);

  const displayedEmployees = hasFiltered ? filteredEmployees : projectEmployees;

  // ── Revision history modal ────────────────────────────────────────────────
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionEmployee, setRevisionEmployee] = useState<ProjectEmployee | null>(null);

  const {
    data: revisionRows = [],
    isFetching: isRevisionFetching,
  } = useGetAssignmentHistoryQuery(
    {
      employeeId: revisionEmployee?.employee.id ?? 0,
      projectId: projectIdNum ?? 0,
    },
    { skip: !revisionEmployee || !projectIdNum || !isRevisionModalOpen }
  );

  const handleViewRevisions = (emp: ProjectEmployee) => {
    setRevisionEmployee(emp);
    setIsRevisionModalOpen(true);
  };

  const handleCloseRevision = () => {
    setIsRevisionModalOpen(false);
    setRevisionEmployee(null);
  };

  // ── Confirm delete revision ───────────────────────────────────────────────
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<AssignmentHistoryRow | null>(null);

  const handleDeleteRevisionClick = (row: AssignmentHistoryRow) => {
    setSelectedRevision(row);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirm = () => {
    setIsConfirmModalOpen(false);
    setSelectedRevision(null);
  };

  const handleConfirm = async () => {
    if (!selectedRevision || !revisionEmployee || !projectIdNum) return;
    try {
      await deleteAssignmentRecord({ id: selectedRevision.id, empId: revisionEmployee.employee.id, projectId: projectIdNum }).unwrap();
      setSnackbar({ open: true, message: "Revision record deleted.", color: "success" });
      if (revisionRows.length - 1 <= 0) {
        handleCloseRevision();
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.data?.message || "Failed to delete record.", color: "error" });
    } finally {
      handleCloseConfirm();
    }
  };

  const employeeRevisionHistoryColumns: StandardTableColumn[] = [
    {
      id: "startDate",
      label: "Start Date",
      align: 'center',
      render: (row: AssignmentHistoryRow) => row.startDate ? formatDateShort(row.startDate) : "-"
    },
    {
      id: "isBillable",
      label: "Billable",
      render: (row: AssignmentHistoryRow) => row.isBillable ? "Yes" : "No"
    },
    {
      id: "techStack",
      label: "Tech Stack"
    },
    {
      id: "tag",
      label: "Tag"
    },
    {
      id: "endDate",
      label: "End Date",
      align: 'center',
      render: (row: AssignmentHistoryRow) => row.endDate ? formatDateShort(row.endDate) : "-"
    },
    {
      id: "delete",
      label: "Delete",
      align: "center",
      render(row: AssignmentHistoryRow) {
        return (
          <PrimaryIconButton
            size="small"
            color="error"
            variant="outlined"
            onClick={() => handleDeleteRevisionClick(row)}
            icon={<DeleteIcon />}
          />
        );
      },
    },
  ];


  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignRows, setAssignRows] = useState<AssignmentRow[]>([{ ...INITIAL_ROW_ASSIGNMENT_DTO }]);

  const handleOpenAssign = () => {
    setAssignRows([{ ...INITIAL_ROW_ASSIGNMENT_DTO }]);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssign = () => setIsAssignModalOpen(false);

  const handleSubmitAssign = async () => {
    const invalid = assignRows.some((r) => !r.employeeId || !r.techStackId || !r.startDate);
    if (invalid) {
      setSnackbar({ open: true, message: "Please fill all required fields.", color: "error" });
      return;
    }
    if (!projectIdNum) return;
    try {
      await createAssignments({
        projectId: projectIdNum,
        assignments: assignRows.map((r) => ({
          employeeId: Number(r.employeeId),
          isBillable: r.isBillable === "true",
          startDate: r.startDate!.format("YYYY-MM-DD"),
          techStackId: Number(r.techStackId),
          ...(r.tags ? { tagId: Number(r.tags) } : {}),
        })),
      }).unwrap();

      const hasFutureDate = assignRows.some(
        (r) => r.startDate && r.startDate.isAfter(dayjs(), "day")
      );

      setSnackbar({
        open: true,
        message: hasFutureDate
          ? "Employees assigned successfully! Employees with a future start date won't appear in the project until that date arrives."
          : "Employees assigned successfully!",
        color: "success",
      });
      setIsAssignModalOpen(false);
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.data?.message || "Failed to assign employees.", color: "error" });
    }
  };

  const projectName = isProjectLoading
    ? "Loading..."
    : projectInfo?.projectName ?? `Project #${projectId}`;

  const modalFooter = (
    <Box sx={{ p: 1, pt: 2, display: "flex", justifyContent: "flex-end" }}>
      <PrimaryButton onClick={handleSubmitAssign} loading={isSubmitting} disabled={isSubmitting}>
        Submit
      </PrimaryButton>
    </Box>
  );

  const isPageLoading = isProjectLoading || isEmployeesLoading;

  return (
    <CardAtom
      sx={{ height: '100%' }}
    >
      <Box sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            p: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "grey.50",
            borderRadius: 2,
            mb: 2.5,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Tooltip title="Go back">
                <PrimaryIconButton
                  onClick={() => navigate(-1)}
                  size="small"
                  variant="outlined"
                  icon={<ArrowBack fontSize="small" />}
                />
              </Tooltip>
              <Typography variant="h6" fontWeight={600}>
                {projectName}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">

                <Checkbox
                  label="Show all employees"
                  onClick={() => setIsBasedOnToday((prev) => !prev)}
                  checked={!isBasedOnToday}
                />
              <Box
                sx={{
                  px: 1.5,
                  py: 0.6,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "grey.300",
                  whiteSpace: "nowrap",
                }}
              >
                <Typography variant="caption" fontWeight={600} color="textSecondary">
                  Total Employees:{" "}
                  <Typography component="span" variant="caption" fontWeight={700} color="textPrimary">
                    {totalEmployees}
                  </Typography>
                </Typography>
              </Box>

              <PrimaryIconButton
                variant="outlined"
                size="medium"
                title="Add Employee"
                onClick={handleOpenAssign}
                icon={<GroupAddIcon />}
              />

              <Box sx={{ width: 200 }}>
                <SearchBoxAtom<SearchableEmployee>
                  data={searchableList}
                  searchKeys={["_searchName"]}
                  onFilteredData={handleFilteredData}
                  placeholder="Search..."
                  size="small"
                />
              </Box>
            </Stack>
          </Stack>
        </Box>

        {/* ── EMPLOYEE CARDS ── */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {isPageLoading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={32} />
            </Box>
          ) : displayedEmployees.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <Typography color="text.secondary" variant="body2">
                No employees assigned to this project yet.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, pt: 1 }}>
              {displayedEmployees.map((emp) => (
                <EmployeeCard
                  key={emp.assignmentId}
                  emp={emp}
                  onMenuOpen={handleRowMenuOpen}
                  handleViewRevisions={handleViewRevisions}
                />
              ))}
            </Box>
          )}
        </Box>

        <MenuAtom
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onCloseAll={handleRowMenuClose}
          items={
            selectedEmployee?.isArchived
              ? [
                {
                  label: "Unarchive Employee From Project",
                  icon: <PersonAddOutlinedIcon fontSize="small" />,
                  onClick: handleUnarchiveTrigger,
                  disabled: isUnarchiving,
                },
              ]
              : [
                {
                  label: "Archive Employee From Project",
                  icon: <PersonRemoveOutlinedIcon fontSize="small" />,
                  onClick: handleArchiveTrigger,
                  disabled: isArchiving,
                },
              ]
          }
        />

        {/* ── ARCHIVE END DATE MODAL ── */}
        <ModalElement
          open={isArchiveDateModalOpen}
          title={`Archive ${selectedEmployee?.employee.name ?? ""} from Project`}
          onClose={() => setIsArchiveDateModalOpen(false)}
          maxWidth="xs"
          sx={{ borderRadius: "16px" }}
        >
          <Box p={2} display="flex" flexDirection="column" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Select an end date for this employee's assignment before archiving.
            </Typography>
            <DatePickerElement
              label="End Date"
              value={archiveEndDate}
              onChange={(val) => setArchiveEndDate(val)}
              width="100%"
            />
            <Box display="flex" justifyContent="flex-end" gap={1} pt={1}>
              <PrimaryButton
                color="error"
                loading={isArchiving}
                disabled={!archiveEndDate || isArchiving}
                onClick={handleArchiveConfirm}
              >
                Archive
              </PrimaryButton>
            </Box>
          </Box>
        </ModalElement>

        {/* ── REVISION HISTORY MODAL ── */}
        <ModalElement
          open={isRevisionModalOpen}
          title={`${revisionEmployee?.employee.name ?? ""} ${revisionEmployee?.employee.lastName ?? ""} — Revision History`}
          onClose={handleCloseRevision}
          maxWidth="md"
          sx={{ borderRadius: "16px" }}
        >
          <Box p={2}>
            {isRevisionFetching ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <StandardTable
                rows={revisionRows}
                columns={employeeRevisionHistoryColumns}
                sticky
              />
            )}
          </Box>
        </ModalElement>

        {/* ── ASSIGN EMPLOYEES MODAL ── */}
        <ModalElement
          open={isAssignModalOpen}
          title="Add Employees to Project"
          onClose={handleCloseAssign}
          maxWidth="lg"
          sx={{ borderRadius: "16px" }}
        >
          <Box
            sx={{
              "& .MuiStack-root > .MuiIconButton-root": {
                alignSelf: "flex-end",
                mb: 0.5,
              },
            }}
          >
            <RepeaterElement<AssignmentRow>
              label=""
              items={assignRows}
              setItems={setAssignRows}
              minItems={1}
              initialItem={{ ...INITIAL_ROW_ASSIGNMENT_DTO }}
              gap={2}
              renderItem={(item, index, handleChange) => {
                // Collect already-selected employee IDs from other rows
                const selectedInOtherRows = new Set(
                  assignRows
                    .filter((_, i) => i !== index)
                    .map((r) => r.employeeId)
                    .filter(Boolean)
                );

                const filteredEmployeeOptions = employeeOptions.filter(
                  (opt) => !selectedInOtherRows.has(opt.value)
                );

                return (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 2,
                      alignItems: "flex-end",
                      flex: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box sx={{ flex: "1 1 160px", minWidth: 140 }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                        Employees Name <span>*</span>
                      </Typography>
                      <SingleSelectElement
                        label=""
                        value={item.employeeId}
                        options={filteredEmployeeOptions}
                        onChange={(val) => handleChange("employeeId", val ?? "")}
                        placeholder="Select employees"
                        fullWidth
                      />
                    </Box>

                    <Box sx={{ flex: "1 1 140px", minWidth: 130 }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                        Billable/ Non-Billable <span>*</span>
                      </Typography>
                      <SingleSelectElement
                        label=""
                        value={item.isBillable}
                        options={BILLABLE_OPTIONS}
                        onChange={(val) => handleChange("isBillable", val ?? "true")}
                        fullWidth
                      />
                    </Box>

                    <Box sx={{ flex: "1 1 140px", minWidth: 130 }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                        Tech stack <span>*</span>
                      </Typography>
                      <SingleSelectElement
                        label=""
                        value={item.techStackId}
                        options={techStackOptions}
                        onChange={(val) => handleChange("techStackId", val ?? "")}
                        placeholder="Select tech stack"
                        fullWidth
                      />
                    </Box>

                    <Box sx={{ flex: "1 1 140px", minWidth: 140 }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                        Start Date <span>*</span>
                      </Typography>
                      <DatePickerElement
                        label=""
                        value={item.startDate}
                        onChange={(val) => handleChange("startDate", val)}
                        width="100%"
                      />
                    </Box>

                    <Box sx={{ flex: "1 1 120px", minWidth: 110 }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                        Tags
                      </Typography>
                      <SingleSelectElement
                        label=""
                        value={item.tags}
                        options={projectTagOptions}
                        onChange={(val) => handleChange("tags", val ?? "")}
                        placeholder="Tags"
                        clearable
                        fullWidth
                      />
                    </Box>
                  </Box>
                );
              }}
            />

            <Box mt={2}>
              <PrimaryIconButton
                variant="outlined"
                size="small"
                title="Add Employee"
                onClick={() => setAssignRows((prev) => [...prev, { ...INITIAL_ROW_ASSIGNMENT_DTO }])}
                icon={<AddIcon />}
              />
            </Box>

            {modalFooter}
          </Box>
        </ModalElement>

        {/* ── CONFIRM DELETE REVISION ── */}
        <ConfirmDialog
          open={isConfirmModalOpen}
          onClose={handleCloseConfirm}
          onConfirm={handleConfirm}
          title="Confirm"
          confirmColor="error"
          message="Are you sure you want to delete this record?"
        />

        {snackbar.open && (
          <Snackbar
            message={snackbar.message}
            color={snackbar.color}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          />
        )}
      </Box>
    </CardAtom>
  );
};

export default ProjectDetailsSection;