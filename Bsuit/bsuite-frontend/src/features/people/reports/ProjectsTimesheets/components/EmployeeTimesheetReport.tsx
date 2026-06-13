import { useState, useMemo, useEffect } from "react";
import {
  Grid,
  Box,
  Typography,
  Card,
  List,
  ListItemButton,
  ListItemText,
  Badge,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import { DateRangePicker } from "../../../../../components/atom/custom-date-range-picker";
import { PrimaryIconButton } from "../../../../../components/atom/button/PrimaryIconButton";
import { PrimaryButton } from "../../../../../components/atom/button";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { Download, Tune, ClearAll, AccessTime, CalendarMonth, EventBusy, CheckCircle } from "@mui/icons-material";
import dayjs, { Dayjs } from "dayjs";
import { useGetProjectsQuery } from "../../../projects-timesheets/projects/api/project.api";
import type { TimesheetEmployeeGroup, TimesheetDayEntry } from "../../../projects-timesheets/timesheets/types/timesheet.types";
import {
  useGetEmployeeTimesheetReportQuery,
  useExportEmployeeTimesheetReportMutation,
} from "../api/projects-timesheets-report.api";
import { EmployeeFilterModal } from "./EmployeeFilterModal";
import { Snackbar } from "../../../../../components/atom/snackbar";
import type { StandardTableColumn } from "../../../../../types/types";
import { formatDateShort } from "../../../../../utils/numberFormatter";
import {
  filterTimesheetDataByProjectEmployees,
  useProjectAssignedEmployeeIds,
} from "../utils/projectTimesheetEmployees.utils";

interface EmployeeTimesheetReportProps {
  isActive?: boolean;
}

function countActiveEmployeeTimesheetFilters(filters: {
  departmentId: number[];
  assignedToProjects: boolean;
  techStackId: number[];
  projectId: number[];
  employeeId: number | null;
}): number {
  let count = 0;
  count += filters.departmentId.length;
  count += filters.techStackId.length;
  count += filters.projectId.length;
  if (filters.employeeId !== null) count += 1;
  if (!filters.assignedToProjects) count += 1;
  return count;
}

export function EmployeeTimesheetReport({
  isActive = false,
}: EmployeeTimesheetReportProps) {
  // Date ranges (May 2026 default as in image)
  const [startDate, setStartDate] = useState<Dayjs>(dayjs("2026-05-01"));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs("2026-05-31"));

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Filters State
  const [filters, setFilters] = useState({
    departmentId: [] as number[],
    assignedToProjects: true,
    techStackId: [] as number[],
    projectId: [] as number[],
    employeeId: null as number | null,
  });

  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const activeFilterCount = useMemo(
    () => countActiveEmployeeTimesheetFilters(filters),
    [filters],
  );

  // Subtab Employee Selector
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
  const [exportEmployeeTimesheet, { isLoading: isExporting }] = useExportEmployeeTimesheetReportMutation();

  const reportProjects = useMemo(
    () => (projects ?? []).filter((p) => !p.isArchived),
    [projects],
  );

  /** Sidebar list — when project filter is set, only those projects are shown */
  const visibleProjects = useMemo(() => {
    if (filters.projectId.length === 0) return reportProjects;
    const allowed = new Set(filters.projectId);
    return reportProjects.filter((p) => allowed.has(p.id));
  }, [reportProjects, filters.projectId]);

  const reportProjectOptions = useMemo(
    () =>
      reportProjects.map((p) => ({
        label: p.projectName,
        value: String(p.id),
      })),
    [reportProjects],
  );

  // Selected project mapping
  useEffect(() => {
    if (!filters.assignedToProjects || visibleProjects.length === 0) return;

    const isSelectedVisible =
      selectedProjectId !== null &&
      visibleProjects.some((p) => p.id === selectedProjectId);

    if (selectedProjectId === null || !isSelectedVisible) {
      setSelectedProjectId(visibleProjects[0].id);
    }
  }, [visibleProjects, selectedProjectId, filters.assignedToProjects]);

  const queryArgs = useMemo(() => {
    const args: {
      start: string;
      end: string;
      assignedToProjects: boolean;
      departmentId?: number[];
      techStackId?: number[];
      projectId?: number[];
      employeeId?: number[];
    } = {
      start: startDate.format("YYYY-MM-DD"),
      end: endDate.format("YYYY-MM-DD"),
      assignedToProjects: filters.assignedToProjects,
      employeeId: filters.employeeId ? [filters.employeeId] : [],
    };
    if (filters.departmentId.length > 0) args.departmentId = filters.departmentId;

    if (filters.assignedToProjects) {
      if (filters.techStackId.length > 0) args.techStackId = filters.techStackId;

      if (selectedProjectId !== null) {
        args.projectId = [selectedProjectId];
      } else if (filters.projectId.length > 0) {
        args.projectId = filters.projectId;
      }
    }

    return args;
  }, [startDate, endDate, filters, selectedProjectId]);

  const { data: timesheetResponse, isFetching: isTimesheetLoading, refetch } =
    useGetEmployeeTimesheetReportQuery(queryArgs, {
      skip: !startDate || !endDate || (filters.assignedToProjects && selectedProjectId === null),
      refetchOnMountOrArgChange: true,
    });

  useEffect(() => {
    if (!isActive || (filters.assignedToProjects && selectedProjectId === null)) return;
    void refetch();
  }, [isActive, selectedProjectId, filters.assignedToProjects, refetch]);

  const rawTimesheetData = useMemo(
    () =>
      (timesheetResponse?.data ?? []) as TimesheetEmployeeGroup[],
    [timesheetResponse],
  );
  const shouldFilterByProject =
    filters.assignedToProjects && selectedProjectId !== null;
  const { employeeIds, isFetching: isProjectEmployeesFetching } =
    useProjectAssignedEmployeeIds(
      shouldFilterByProject ? selectedProjectId : null,
    );

  const timesheetData = useMemo(
    () =>
      filterTimesheetDataByProjectEmployees(
        rawTimesheetData,
        employeeIds,
        shouldFilterByProject,
        !isProjectEmployeesFetching,
      ),
    [
      rawTimesheetData,
      employeeIds,
      shouldFilterByProject,
      isProjectEmployeesFetching,
    ],
  );

  const isReportLoading =
    isTimesheetLoading ||
    (shouldFilterByProject && isProjectEmployeesFetching);

  // Reset active employee index on query update
  useEffect(() => {
    setActiveEmployeeIndex(0);
  }, [timesheetResponse, selectedProjectId, employeeIds]);

  const activeEmployeeItem = timesheetData[activeEmployeeIndex];

  // Selected project details
  const activeProjectName = useMemo(() => {
    return visibleProjects.find((p) => p.id === selectedProjectId)?.projectName || "";
  }, [visibleProjects, selectedProjectId]);

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
        companyTasks: renderTaskList(day.companyTasks ?? []),
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

  // Standard Table Columns
  const tableColumns: StandardTableColumn[] = [
    { id: "date", label: "Date" },
    { id: "projectTasks", label: "Project Tasks" },
    { id: "companyTasks", label: "Payroll Company Task" },
    { id: "hours", label: "Hours" },
    { id: "days", label: "Days" },
    { id: "leave", label: "Leave" },
    { id: "compOff", label: "Comp Off" },
    { id: "comments", label: "Comments" },
  ];

  // POST Backend Export trigger
  const handleExport = async () => {
    try {
      showSnackbar("Generating report, please wait...", "info");
      
      const { blob, fileName } = await exportEmployeeTimesheet(queryArgs).unwrap();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSnackbar("Employee timesheet report exported successfully.", "success");
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; message?: string };
      showSnackbar(
        err?.data?.message || err?.message || "Failed to export employee report. Please try again.",
        "error"
      );
    }
  };

  // Handle Apply Filter Modal
  const handleApplyFilters = (newFilters: typeof filters) => {
    const allowedProjectIds = new Set(reportProjects.map((p) => p.id));
    const projectId = newFilters.projectId.filter((id) => allowedProjectIds.has(id));
    const nextFilters = { ...newFilters, projectId };

    setFilters(nextFilters);
    if (nextFilters.assignedToProjects) {
      const nextVisible =
        projectId.length > 0
          ? reportProjects.filter((p) => projectId.includes(p.id))
          : reportProjects;

      if (projectId.length > 0) {
        setSelectedProjectId(projectId[0]);
      } else if (selectedProjectId === null && nextVisible.length > 0) {
        setSelectedProjectId(nextVisible[0].id);
      } else if (
        selectedProjectId !== null &&
        !nextVisible.some((p) => p.id === selectedProjectId)
      ) {
        setSelectedProjectId(nextVisible[0]?.id ?? null);
      }
    } else {
      setSelectedProjectId(null);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      departmentId: [],
      assignedToProjects: true,
      techStackId: [],
      projectId: [],
      employeeId: null,
    });
    if (reportProjects.length > 0) {
      setSelectedProjectId(reportProjects[0].id);
    }
  };

  return (
    <Box sx={{ mt: 1, width: "100%" }}>
      <Grid container spacing={3} sx={{ width: "100%" }}>
        {/* Left Sidebar */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
              height: "100%",
              minHeight: "450px",
              minWidth: { md: 220 },
              bgcolor: "background.paper",
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
                Projects
              </Typography>
              
              {isProjectsLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {visibleProjects.map((proj) => {
                    const isSelected = selectedProjectId === proj.id;
                    return (
                      <ListItemButton
                        key={proj.id}
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setFilters((prev) => ({ ...prev, assignedToProjects: true }));
                        }}
                        sx={{
                          borderRadius: "8px",
                          mb: 0.5,
                          bgcolor: isSelected ? "primary.lighter" : "transparent",
                          color: isSelected ? "primary.main" : "text.secondary",
                          "&:hover": {
                            bgcolor: isSelected ? "primary.lighter" : "rgba(0, 0, 0, 0.04)",
                          },
                        }}
                      >
                        <ListItemText
                          primary={proj.projectName}
                          primaryTypographyProps={{
                            variant: "body2",
                            fontWeight: isSelected ? 600 : 500,
                            sx: { whiteSpace: "normal", wordBreak: "break-word" },
                          }}
                        />
                        {proj.totalEmployees !== undefined && (
                          <Badge
                            badgeContent={proj.totalEmployees}
                            color={isSelected ? "primary" : "default"}
                            sx={{
                              "& .MuiBadge-badge": {
                                right: 10,
                                top: 0,
                                bgcolor: isSelected ? "primary.main" : "rgba(0,0,0,0.06)",
                                color: isSelected ? "#fff" : "text.secondary",
                              },
                            }}
                          />
                        )}
                      </ListItemButton>
                    );
                  })}
                  {!visibleProjects.length && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", mt: 1 }}>
                      No active projects
                    </Typography>
                  )}
                </List>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Right Content Panel */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            
            {/* Top Row: Cohesive Controls Header */}
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
                <DateRangePicker
                  startValue={startDate}
                  endValue={endDate}
                  width="16.5rem"
                  onChange={(dates) => {
                    if (dates[0]) setStartDate(dates[0]);
                    if (dates[1]) setEndDate(dates[1]);
                  }}
                />
                <Badge
                  badgeContent={activeFilterCount}
                  color="error"
                  invisible={activeFilterCount === 0}
                  overlap="rectangular"
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                >
                  <PrimaryButton
                    variant="outlined"
                    startIcon={<Tune fontSize="small" />}
                    onClick={() => setFilterModalOpen(true)}
                    sx={{ borderRadius: "8px", textTransform: "none", py: 1 }}
                  >
                    Filter
                  </PrimaryButton>
                </Badge>
                
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

            {/* Main Content Area */}
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
                    Try adjusting the date range or filter criteria.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {/* Horizontal Scroll bar of Employee Names */}
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

                  {/* StandardTable for the active employee */}
                  <Box sx={{ mt: 1 }}>
                    <StandardTable columns={tableColumns} rows={tableRows} />
                  </Box>
                </Box>
              )}
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Filter Modal */}
      <EmployeeFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        projectOptions={reportProjectOptions}
        initialValues={filters}
        onApply={handleApplyFilters}
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
