import { useState, useMemo, useEffect } from "react";
import {
  Grid,
  Box,
  Typography,
  Card,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import { DateRangePicker } from "../../../../../components/atom/custom-date-range-picker";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { PrimaryIconButton } from "../../../../../components/atom/button/PrimaryIconButton";
import { PrimaryButton } from "../../../../../components/atom/button";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { Download, Tune, ClearAll, AccessTime, CalendarMonth, EventBusy, CheckCircle } from "@mui/icons-material";
import dayjs, { Dayjs } from "dayjs";
import { useGetProjectsQuery } from "../../../projects-timesheets/projects/api/project.api";
import type { ProjectResponse } from "../../../projects-timesheets/projects/types/project.types";
import type { TimesheetEmployeeGroup, TimesheetDayEntry } from "../../../projects-timesheets/timesheets/types/timesheet.types";
import {
  useGetProjectTimesheetReportQuery,
  useExportProjectTimesheetReportMutation,
} from "../api/projects-timesheets-report.api";
import { ProjectFilterModal } from "./ProjectFilterModal";
import { Snackbar } from "../../../../../components/atom/snackbar";
import type { StandardTableColumn } from "../../../../../types/types";
import { formatDateShort } from "../../../../../utils/numberFormatter";
import {
  filterTimesheetDataByProjectEmployees,
  useProjectAssignedEmployeeIds,
} from "../utils/projectTimesheetEmployees.utils";

interface ProjectTimesheetReportProps {
  isActive?: boolean;
}

export function ProjectTimesheetReport({
  isActive = false,
}: ProjectTimesheetReportProps) {
  // Date ranges (May 2026 default as in image)
  const [startDate, setStartDate] = useState<Dayjs>(dayjs("2026-05-01"));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs("2026-05-31"));

  // Selected Project (Dropdown)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Filters State
  const [filters, setFilters] = useState({
    techStackId: null as number | null,
    isBillable: false,
  });

  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const [activeEmployeeIndex, setActiveEmployeeIndex] = useState(0);

  // Snackbar State
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "info" });

  const showSnackbar = (message: string, color: "success" | "error" | "info" | "warning" = "success") => {
    setSnackbar({ open: true, message, color });
  };

  // Queries
  const { data: projects, isLoading: isProjectsLoading } = useGetProjectsQuery();
  const [exportProjectTimesheet, { isLoading: isExporting }] = useExportProjectTimesheetReportMutation();

  const projOptions = useMemo(() => {
    return (
      projects?.map((p: ProjectResponse) => ({
        label: p.projectName,
        value: String(p.id),
      })) ?? []
    );
  }, [projects]);

  // Set default project
  useEffect(() => {
    if (projOptions.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projOptions[0].value);
    }
  }, [projOptions, selectedProjectId]);

  // Fetch report data (GET Query with query params)
  const { data: timesheetResponse, isFetching: isTimesheetLoading, refetch } =
    useGetProjectTimesheetReportQuery(
      {
        projectId: Number(selectedProjectId),
        start: startDate.format("YYYY-MM-DD"),
        end: endDate.format("YYYY-MM-DD"),
        techStackId: filters.techStackId || undefined,
        isBillable: filters.isBillable ? true : undefined,
      },
      {
        skip: !selectedProjectId || !startDate || !endDate,
        refetchOnMountOrArgChange: true,
      }
    );

  useEffect(() => {
    if (!isActive || !selectedProjectId) return;
    void refetch();
  }, [isActive, selectedProjectId, refetch]);

  const projectIdNum = selectedProjectId ? Number(selectedProjectId) : null;
  const { employeeIds, isFetching: isProjectEmployeesFetching } =
    useProjectAssignedEmployeeIds(projectIdNum);

  const rawTimesheetData = useMemo(
    () =>
      (timesheetResponse?.data ?? []) as TimesheetEmployeeGroup[],
    [timesheetResponse],
  );

  const timesheetData = useMemo(
    () =>
      filterTimesheetDataByProjectEmployees(
        rawTimesheetData,
        employeeIds,
        Boolean(projectIdNum),
        !isProjectEmployeesFetching,
      ),
    [rawTimesheetData, employeeIds, projectIdNum, isProjectEmployeesFetching],
  );

  const isReportLoading =
    isTimesheetLoading ||
    (Boolean(projectIdNum) && isProjectEmployeesFetching);

  // Reset active employee index on query update
  useEffect(() => {
    setActiveEmployeeIndex(0);
  }, [timesheetResponse, selectedProjectId, employeeIds]);

  const activeEmployeeItem = timesheetData[activeEmployeeIndex];

  // Selected project details
  const activeProjectName = useMemo(() => {
    return projects?.find((p: ProjectResponse) => String(p.id) === String(selectedProjectId))?.projectName || "";
  }, [projects, selectedProjectId]);

  // Compute metrics for active employee
  const metrics = useMemo(() => {
    if (!activeEmployeeItem) return null;
    let totalHours = 0;
    let totalDays = 0;
    let leaveDays = 0;
    let compOffDays = 0;

    activeEmployeeItem.days.forEach((day: TimesheetDayEntry) => {
      totalHours += day.totalHours ?? 0;
      totalDays += day.day ?? 0;
      if (day.isLeave) leaveDays++;
      if (day.isCompOff) compOffDays++;
    });

    return {
      totalHours: totalHours.toFixed(2),
      totalDays: totalDays.toFixed(2),
      leaveDays,
      compOffDays,
    };
  }, [activeEmployeeItem]);

  // Helper to format date
  const formatDateHeader = (dateStr: string) => {
    return formatDateShort(dateStr) || dateStr;
  };

  // Helper to strip HTML and join tasks cleanly
  const renderTaskList = (tasks: (string | null)[]) => {
    const list = tasks.filter(Boolean);
    if (list.length === 0) return "—";
    return (
      <Box sx={{ py: 0.5, fontSize: "0.85rem" }}>
        {list.map((task, idx) => {
          if (task!.includes("<li>") || task!.includes("<ul")) {
            return (
              <div
                key={idx}
                dangerouslySetInnerHTML={{ __html: task! }}
                style={{ margin: 0, paddingLeft: "14px" }}
              />
            );
          }
          return (
            <Box key={idx} sx={{ whiteSpace: "pre-line", mb: 0.5 }}>
              {task}
            </Box>
          );
        })}
      </Box>
    );
  };

  // Build Table Rows
  const tableRows = useMemo(() => {
    if (!activeEmployeeItem) return [];
    
    return activeEmployeeItem.days.map((day: TimesheetDayEntry, idx: number) => {
      const dateObj = dayjs(day.date);
      const isWeekend = dateObj.day() === 0 || dateObj.day() === 6;
      const defaultComment = isWeekend ? "Week off" : "";
      const commentText = day.comments || defaultComment;

      return {
        id: String(idx),
        date: formatDateHeader(day.date),
        projectTasks: renderTaskList(day.projectTasks ?? []),
        hours: (day.totalHours ?? 0).toFixed(2),
        days: (day.day ?? 0).toFixed(2),
        leave: day.isLeave ? (
          <Chip label="Leave" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: "0.75rem" }} />
        ) : (
          "—"
        ),
        compOff: day.isCompOff ? (
          <Chip label="Comp Off" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: "0.75rem" }} />
        ) : (
          "—"
        ),
        comments: commentText ? (
          <Chip
            label={commentText}
            size="small"
            variant="outlined"
            sx={{
              height: 20,
              fontSize: "0.75rem",
              borderColor: commentText.toLowerCase().includes("week off") ? "rgba(0,0,0,0.12)" : "primary.light",
              bgcolor: commentText.toLowerCase().includes("week off") ? "rgba(0,0,0,0.04)" : "transparent",
              color: commentText.toLowerCase().includes("week off") ? "text.secondary" : "primary.main",
            }}
          />
        ) : (
          "—"
        ),
      };
    });
  }, [activeEmployeeItem]);

  const tableColumns: StandardTableColumn[] = [
    { id: "date", label: "Date" },
    { id: "projectTasks", label: "Project Tasks" },
    { id: "hours", label: "Hours" },
    { id: "days", label: "Days" },
    { id: "leave", label: "Leave" },
    { id: "compOff", label: "Comp Off" },
    { id: "comments", label: "Comments" },
  ];

  // POST Backend Export trigger
  const handleExport = async () => {
    if (!selectedProjectId) return;

    try {
      showSnackbar("Generating project report, please wait...", "info");
      
      const { blob, fileName } = await exportProjectTimesheet({
        projectId: Number(selectedProjectId),
        start: startDate.format("YYYY-MM-DD"),
        end: endDate.format("YYYY-MM-DD"),
        techStackId: filters.techStackId || undefined,
        isBillable: filters.isBillable ? true : undefined,
      }).unwrap();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSnackbar("Project timesheet report exported successfully.", "success");
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; message?: string };
      showSnackbar(
        err?.data?.message || err?.message || "Failed to export project report. Please try again.",
        "error"
      );
    }
  };

  // Reset filters
  const handleClearFilters = () => {
    setFilters({
      techStackId: null,
      isBillable: false,
    });
  };

  return (
    <Box sx={{ mt: 1, width: "100%" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        
          {/* Top Control Bar: Project Select, Date Range, Actions */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              width: "100%",
              mb: 0.5,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {activeProjectName || "Project"} 
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Showing logs from {startDate.format("MMM DD, YYYY")} to {endDate.format("MMM DD, YYYY")}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              {isProjectsLoading ? (
                <CircularProgress size={20} />
              ) : (
                <SingleSelectElement
                  label="Select Project"
                  options={projOptions}
                  value={selectedProjectId}
                  onChange={setSelectedProjectId}
                  width="12rem"
                  fullWidth={false}
                  placeholder="Select project"
                />
              )}

              <DateRangePicker
                startValue={startDate}
                endValue={endDate}
                width="16.5rem"
                onChange={(dates) => {
                  if (dates[0]) setStartDate(dates[0]);
                  if (dates[1]) setEndDate(dates[1]);
                }}
              />

              <PrimaryButton
                variant="outlined"
                startIcon={<Tune fontSize="small" />}
                onClick={() => setFilterModalOpen(true)}
                sx={{ borderRadius: "8px", textTransform: "none", py: 1 }}
              >
                Filter
              </PrimaryButton>

              <PrimaryIconButton
                variant="outlined"
                icon={<ClearAll />}
                onClick={handleClearFilters}
                title="Clear Filters"
              />

              <PrimaryIconButton
                variant="contained"
                icon={<Download />}
                onClick={handleExport}
                loading={isExporting}
                disabled={timesheetData.length === 0}
                title="Export Excel"
              />
            </Box>
          </Box>

        <Card
          elevation={0}
          sx={{
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "12px",
            p: 2.5,
            bgcolor: "background.paper",
            minHeight: "450px",
          }}
        >
          {isReportLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={12}>
              <CircularProgress size={40} />
            </Box>
          ) : timesheetData.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={12} flexDirection="column">
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                No timesheet logs found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try selecting a different project or adjusting filters.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Tabs
                value={activeEmployeeIndex}
                onChange={(_, val) => setActiveEmployeeIndex(val)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  mb: 2.5,
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    minWidth: 100,
                    py: 1,
                    borderRadius: "8px 8px 0 0",
                  },
                }}
              >
                {timesheetData.map((item: TimesheetEmployeeGroup, index: number) => {
                  const empName = item.employee.employeeName || `EMP #${item.employee.id}`;
                  return <Tab key={item.employee.id} label={empName} value={index} />;
                })}
              </Tabs>

              {/* Dynamic Metrics Summary Banner */}
              {metrics && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Card
                      elevation={0}
                      sx={{
                        p: 2,
                        border: "1px solid rgba(25, 118, 210, 0.12)",
                        borderRadius: "12px",
                        bgcolor: "rgba(25, 118, 210, 0.02)",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: "8px",
                          bgcolor: "rgba(25, 118, 210, 0.08)",
                          color: "primary.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <AccessTime fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Logged Hours
                        </Typography>
                        <Typography variant="body1" fontWeight={700} color="primary.main">
                          {metrics.totalHours} hrs
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Card
                      elevation={0}
                      sx={{
                        p: 2,
                        border: "1px solid rgba(46, 125, 50, 0.12)",
                        borderRadius: "12px",
                        bgcolor: "rgba(46, 125, 50, 0.02)",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: "8px",
                          bgcolor: "rgba(46, 125, 50, 0.08)",
                          color: "success.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CalendarMonth fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Days Logged
                        </Typography>
                        <Typography variant="body1" fontWeight={700} color="success.main">
                          {metrics.totalDays} days
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Card
                      elevation={0}
                      sx={{
                        p: 2,
                        border: "1px solid rgba(211, 47, 47, 0.12)",
                        borderRadius: "12px",
                        bgcolor: "rgba(211, 47, 47, 0.02)",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: "8px",
                          bgcolor: "rgba(211, 47, 47, 0.08)",
                          color: "error.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <EventBusy fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Leave Days
                        </Typography>
                        <Typography variant="body1" fontWeight={700} color="error.main">
                          {metrics.leaveDays} days
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Card
                      elevation={0}
                      sx={{
                        p: 2,
                        border: "1px solid rgba(237, 108, 2, 0.12)",
                        borderRadius: "12px",
                        bgcolor: "rgba(237, 108, 2, 0.02)",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: "8px",
                          bgcolor: "rgba(237, 108, 2, 0.08)",
                          color: "warning.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckCircle fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Comp Off Days
                        </Typography>
                        <Typography variant="body1" fontWeight={700} color="warning.main">
                          {metrics.compOffDays} days
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              )}

              <Box sx={{ mt: 1 }}>
                <StandardTable columns={tableColumns} rows={tableRows} />
              </Box>
            </Box>
          )}
        </Card>
      </Box>

      {/* Filter Modal */}
      <ProjectFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        initialValues={filters}
        onApply={(newFilters) => setFilters(newFilters)}
      />

      {/* Snackbar Alert */}
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          autoClose={6000}
        />
      )}
    </Box>
  );
}
