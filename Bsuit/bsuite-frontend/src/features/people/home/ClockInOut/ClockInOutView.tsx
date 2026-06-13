import { Card, Chip, Typography, Stack, Box, IconButton } from "@mui/material";
import { alpha, styled, useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { PrimaryButton, PrimaryIconButton } from "../../../../components/atom/button";
import { SingleSelectElement } from "../../../../components/atom/select-field/SingleSelect";
import { Tooltip } from "../../../../components/atom/tooltip/Tooltip";
import { useState, useEffect, useMemo, useCallback } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ModalElement } from "../../../../components/dialogs/modal-element";
import TipTapEditor from "./components/TiptapEditor";
import { useGetHeaderDataQuery } from "../../../company/api/company.api";
import { useGetEmployeeInfoQuery } from "../../api/people.api";
import {
  EMPTY_LOCATION_PAYLOAD,
  useClockInMutation,
  useClockOutMutation,
} from "./api/clockInOut.api";
import type { IClockOutProjectTaskPayload } from "./api/clockInOut.api";
import {
  HALF_HOUR_SELECT_OPTIONS,
  elapsedMinutesToHalfHourSelectValue,
  hoursStringToNumber,
} from "./utils/taskHours";
import { getClientIpAddress } from "./utils/getClientIpAddress";
import { Snackbar } from "../../../../components/atom/snackbar";
import {
  attendanceApi,
  useCheckAttendanceQuery,
  useGetAttendanceAssignedProjectsQuery,
  mapAttendanceAssignedProjectsToOptions,
} from "../../me/attendance/api/attendance.api";
import { useGetEmployeeQuery } from "../../org/people/directory/api/directory.api";
import { extractApiErrorMessage } from "../../me/attendance/utils/extractApiErrorMessage";

function hasMeaningfulNotes(html: string): boolean {
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();
  return text.length > 0;
}

const TaskTable = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  overflow: "hidden",
  backgroundColor: theme.palette.background.paper,
}));

const TaskRow = styled(Stack, {
  shouldForwardProp: (p) => p !== "isEven",
})<{ isEven?: boolean }>(({ theme, isEven }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  padding: "9px 10px 9px 12px",
  gap: 8,
  backgroundColor: isEven ? theme.palette.background.paper : theme.palette.grey[50],
  borderBottom: `1px solid ${theme.palette.divider}`,
  "&:last-child": { borderBottom: "none" },
}));

const TableHead = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: "6px 10px 6px 12px",
  backgroundColor: theme.palette.grey[100],
  borderBottom: `1px solid ${theme.palette.divider}`,
  gap: 8,
  userSelect: "none",
}));

const HeadLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  lineHeight: 1,
}));

/** Matches RegulariseModal project section heading */
function ProjectSectionTitle({
  label,
  count,
  onAdd,
}: {
  label: string;
  count: number;
  onAdd: () => void;
}) {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ mb: 1 }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          sx={{
            width: 3,
            height: 16,
            borderRadius: 99,
            bgcolor: theme.palette.primary.main,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="subtitle2"
          sx={{ color: theme.palette.text.primary, letterSpacing: "-0.01em" }}
        >
          {label}
        </Typography>
        <Chip
          label={count}
          size="small"
          sx={{
            height: 17,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.primary.main,
            "& .MuiChip-label": { px: "6px" },
          }}
        />
      </Stack>
      <PrimaryIconButton
        icon={<AddIcon />}
        variant="outlined"
        onClick={onAdd}
        sx={{ textTransform: "none" }}
      >
        Add row
      </PrimaryIconButton>
    </Stack>
  );
}

type ClockOutProjectRow = { projectId: string; hoursWorked: string; description: string };

function isCompanyTaskRowComplete(hoursStr: string, notes: string): boolean {
  return hoursStringToNumber(hoursStr) > 0 && hasMeaningfulNotes(notes);
}

function isProjectTaskRowEmpty(r: ClockOutProjectRow): boolean {
  const pid = Number(r.projectId);
  return (
    (!Number.isFinite(pid) || Number.isNaN(pid) || pid <= 0) &&
    hoursStringToNumber(r.hoursWorked) <= 0 &&
    !hasMeaningfulNotes(r.description)
  );
}

function isProjectTaskRowComplete(r: ClockOutProjectRow): boolean {
  const pid = Number(r.projectId);
  return (
    Number.isFinite(pid) &&
    !Number.isNaN(pid) &&
    pid > 0 &&
    hoursStringToNumber(r.hoursWorked) > 0 &&
    hasMeaningfulNotes(r.description)
  );
}

function buildClockOutProjectPayloads(rows: ClockOutProjectRow[]): IClockOutProjectTaskPayload[] {
  return rows
    .map((r) => ({
      projectId: Number(r.projectId),
      timeInHours: String(hoursStringToNumber(r.hoursWorked)),
      description: r.description ?? "",
    }))
    .filter(
      (t) =>
        Number.isFinite(t.projectId) &&
        !Number.isNaN(t.projectId) &&
        t.projectId > 0 &&
        parseFloat(t.timeInHours) > 0 &&
        hasMeaningfulNotes(t.description),
    );
}

/** Elapsed minutes since clock-in; null if unknown or invalid. */
function getElapsedMinutesSinceClockIn(
  clockInTimeIso: string | undefined,
  now: Dayjs,
): number | null {
  if (!clockInTimeIso) return null;
  const start = dayjs(clockInTimeIso);
  if (!start.isValid()) return null;
  return now.diff(start, "minute");
}

/** Same breakdown as the “X hrs Y mins since login” line (full hours + remainder minutes). */
function formatElapsedSinceLogin(clockInTimeIso: string | undefined, now: Dayjs): string {
  const totalMins = getElapsedMinutesSinceClockIn(clockInTimeIso, now);
  if (totalMins === null || totalMins < 0) return "";
  const start = dayjs(clockInTimeIso!);
  const fullHours = now.diff(start, "hour");
  const minutesRemainder = totalMins % 60;
  return `${fullHours} hrs ${minutesRemainder} mins`;
}

function ClockInOutView() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { data } = useGetHeaderDataQuery();
  const { data: employeeInfo } = useGetEmployeeInfoQuery();
  const { data: employeeDetails } = useGetEmployeeQuery(employeeInfo?.data?.employeeId!, {
    skip: !employeeInfo?.data?.employeeId,
  });
  const employeeId = String(employeeInfo?.data?.employeeId ?? "");
  const { data: attendanceData, refetch: refetchCheckAttendance } = useCheckAttendanceQuery(
    Number(employeeId),
    { skip: !employeeId },
  );
  const [clockIn] = useClockInMutation();
  const [clockOut] = useClockOutMutation();

  const [currentTime, setCurrentTime] = useState(dayjs());
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"in" | "out">("in");
  const [messageHtml, setMessageHtml] = useState("");
  /** Clock-out only — hours for the single company task row (Regularise-style) */
  const [companyHoursStr, setCompanyHoursStr] = useState("");
  const [companyTasksHtml, setCompanyTasksHtml] = useState("");
  const [projectRows, setProjectRows] = useState<ClockOutProjectRow[]>([]);
  /** Bump to remount TipTap editors (they only read initial `content`) */
  const [clockOutEditorKey, setClockOutEditorKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const employeeNumericId = Number(employeeInfo?.data?.employeeId ?? 0);
  const {
    data: assignedProjectRows = [],
    isLoading: projectsLoading,
    isError: projectsError,
  } = useGetAttendanceAssignedProjectsQuery(employeeNumericId, {
    skip:
      !showModal ||
      modalType !== "out" ||
      !employeeInfo?.data?.employeeId,
  });
  const projectOptions = useMemo(
    () => mapAttendanceAssignedProjectsToOptions(assignedProjectRows),
    [assignedProjectRows],
  );

  const showProjectTasksSection =
    !projectsLoading && !projectsError && projectOptions.length > 0;

  useEffect(() => {
    if (!showProjectTasksSection) {
      setProjectRows([]);
    }
  }, [showProjectTasksSection]);

  /** Each project at most one row — options exclude projects picked on other rows (current row keeps its value). */
  const projectOptionsByRow = useMemo(
    () =>
      projectRows.map((row, rowIndex) => {
        const takenElsewhere = new Set(
          projectRows
            .map((r, i) => (i !== rowIndex && r.projectId ? r.projectId : null))
            .filter((id): id is string => id != null && id !== ""),
        );
        return projectOptions.filter(
          (opt) => !takenElsewhere.has(opt.value) || opt.value === row.projectId,
        );
      }),
    [projectRows, projectOptions],
  );

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "info" });

  const showMessage = (msg: string, color: "success" | "error" = "success") => {
    setSnackbar({ open: true, message: msg, color });
  };
  const isMessageEmpty =
    !messageHtml || messageHtml.replace(/<[^>]*>/g, "").trim().length === 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const syncAttendanceAfterPunch = useCallback(() => {
    const numericId = Number(employeeId);
    if (!Number.isFinite(numericId) || numericId <= 0) return;

    const now = dayjs();
    dispatch(
      attendanceApi.util.invalidateTags([
        "Attendance",
        {
          type: "Attendance",
          id: `calendar-${numericId}-${now.year()}-${now.month() + 1}`,
        },
      ]),
    );
    void refetchCheckAttendance();
  }, [dispatch, employeeId, refetchCheckAttendance]);

  const resetClockOutForm = useCallback(
    (at: Dayjs) => {
      setCompanyTasksHtml("");
      setProjectRows([]);
      setCompanyHoursStr(
        elapsedMinutesToHalfHourSelectValue(
          getElapsedMinutesSinceClockIn(
            attendanceData?.data?.clockInTime as string | undefined,
            at,
          ),
        ),
      );
    },
    [attendanceData?.data?.clockInTime],
  );

  const handleActionClick = () => {
    const isOut = Boolean(attendanceData?.data?.clockedIn);
    setModalType(isOut ? "out" : "in");
    setMessageHtml("");
    if (isOut) {
      resetClockOutForm(currentTime);
      setClockOutEditorKey((k) => k + 1);
    }
    setShowModal(true);
  };

  const addProjectRow = () => {
    setProjectRows((rows) => [...rows, { projectId: "", hoursWorked: "", description: "" }]);
  };
  const removeProjectRow = (index: number) => {
    setProjectRows((rows) => rows.filter((_, i) => i !== index));
  };
  const updateProjectRow = (index: number, field: keyof ClockOutProjectRow, val: string) => {
    setProjectRows((rows) =>
      rows.map((r, i) => (i === index ? { ...r, [field]: val } : r)),
    );
  };

  const clockOutTasksPreview = useMemo(
    () => ({
      project: buildClockOutProjectPayloads(projectRows),
    }),
    [projectRows],
  );

  /** At least one full company task or one full project row (company is optional). */
  const hasAtLeastOneClockOutTask =
    isCompanyTaskRowComplete(companyHoursStr, companyTasksHtml) ||
    clockOutTasksPreview.project.length > 0;

  const hasCompleteProjectTask = useMemo(
    () =>
      showProjectTasksSection &&
      projectRows.some((r) => isProjectTaskRowComplete(r)),
    [showProjectTasksSection, projectRows],
  );

  /** Company row started but invalid (hours vs notes mismatch). Ignored when a project row is complete. */
  const isCompanyTaskPartial = useMemo(() => {
    const h = hoursStringToNumber(companyHoursStr);
    const notes = companyTasksHtml;
    return (
      (h > 0 && !hasMeaningfulNotes(notes)) || (hasMeaningfulNotes(notes) && h <= 0)
    );
  }, [companyHoursStr, companyTasksHtml]);

  const hasIncompleteClockOutRows = useMemo(() => {
    if (!showProjectTasksSection) {
      return isCompanyTaskPartial;
    }
    const projectIncomplete = projectRows.some(
      (r) => !isProjectTaskRowEmpty(r) && !isProjectTaskRowComplete(r),
    );
    const companyIncompleteBlocking = isCompanyTaskPartial && !hasCompleteProjectTask;
    return projectIncomplete || companyIncompleteBlocking;
  }, [
    showProjectTasksSection,
    projectRows,
    isCompanyTaskPartial,
    hasCompleteProjectTask,
  ]);

  const totalClockOutHours = useMemo(() => {
    let sum = 0;
    if (isCompanyTaskRowComplete(companyHoursStr, companyTasksHtml)) {
      sum += hoursStringToNumber(companyHoursStr);
    }
    for (const r of projectRows) {
      if (isProjectTaskRowComplete(r)) {
        sum += hoursStringToNumber(r.hoursWorked);
      }
    }
    return sum;
  }, [companyHoursStr, companyTasksHtml, projectRows]);

  function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }, // turning high accuracy takes longer
      );
    });
  }

  const handleSave = async () => {
    if (!employeeId) {
      showMessage("Employee ID not found. Please relogin.", "error");
      return;
    }

    if (modalType === "in" && isMessageEmpty) {
      showMessage("Please enter a clock-in message.", "error");
      return;
    }

    if (modalType === "out") {
      if (hasIncompleteClockOutRows) {
        showMessage(
          showProjectTasksSection
            ? "Complete every project row you started (hours + explanation). Company work is optional when at least one project row is complete; otherwise finish or clear the company row."
            : "Complete the company task: hours worked and task explanation are both required.",
          "error",
        );
        return;
      }

      const projectTasksPayload = buildClockOutProjectPayloads(projectRows);
      if (!isCompanyTaskRowComplete(companyHoursStr, companyTasksHtml) && projectTasksPayload.length === 0) {
        showMessage(
          showProjectTasksSection
            ? "Add at least one company or project task with hours worked and a task explanation."
            : "Add a company task with hours worked and a task explanation.",
          "error",
        );
        return;
      }

      if (totalClockOutHours <= 0) {
        showMessage("Enter a valid time in hours (greater than zero).", "error");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let locationPayload = EMPTY_LOCATION_PAYLOAD;
      const ipPromise = getClientIpAddress();

      try {
        const { lat, lng } = await getCurrentPosition();
        const ip = await ipPromise;
        locationPayload = {
          lat,
          lng,
          address: "",
          device: "",
          ip,
        };
      } catch (err) {
        const code = (err as GeolocationPositionError)?.code;
        if (code === GeolocationPositionError.PERMISSION_DENIED) {
          void ipPromise;
        } else if (code === GeolocationPositionError.TIMEOUT) {
          showMessage("Location request timed out. Please check your connection and try again.", "error");
          return;
        } else {
          showMessage("Unable to retrieve your location. Please try again.", "error");
          return;
        }
      }

      if (modalType === "in") {
        await clockIn({
          employeeId,
          clockInMessage: messageHtml,
          locationPayload,
        }).unwrap();
        syncAttendanceAfterPunch();
        showMessage("Successfully clocked in.");
        setShowModal(false);
        return;
      }

      const companyTasksForApi = companyTasksHtml.trim();
      const projectTasksPayload = buildClockOutProjectPayloads(projectRows);

      await clockOut({
        employeeId,
        locationPayload,
        timeInHours: String(totalClockOutHours),
        companyTasks: companyTasksForApi,
        projectTasks: projectTasksPayload,
      }).unwrap();

      syncAttendanceAfterPunch();
      showMessage("Successfully clocked out.");
      setShowModal(false);
    } catch (err: unknown) {
      showMessage(extractApiErrorMessage(err), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmitClockOut =
    hasAtLeastOneClockOutTask &&
    !hasIncompleteClockOutRows &&
    totalClockOutHours > 0;

  const clockInSaveDisabled = isSubmitting || isMessageEmpty;
  const clockInSubmitTooltipTitle = isSubmitting
    ? "Saving your clock-in message…"
    : isMessageEmpty
      ? "Enter a clock-in message to enable Save."
      : "";

  const clockOutSaveDisabled = isSubmitting || !canSubmitClockOut;
  const clockOutSubmitTooltipTitle = useMemo(() => {
    if (isSubmitting) return "Submitting clock-out…";
    if (canSubmitClockOut) return "";
    if (!hasAtLeastOneClockOutTask) {
      return showProjectTasksSection
        ? "Add a full company task (hours + explanation) or at least one full project row (project, hours, explanation)."
        : "Add a full company task (hours + explanation).";
    }
    if (hasIncompleteClockOutRows) {
      if (showProjectTasksSection) {
        const projectIncomplete = projectRows.some(
          (r) => !isProjectTaskRowEmpty(r) && !isProjectTaskRowComplete(r),
        );
        if (projectIncomplete) {
          return "Finish every project row you started: select a project, hours, and add a task explanation.";
        }
        return "Complete the company row (hours + explanation together), or add a full project row.";
      }
      return "Complete the company row (hours + explanation together).";
    }
    if (totalClockOutHours <= 0) {
      return "Total time must be greater than zero.";
    }
    return "Complete the form to submit.";
  }, [
    isSubmitting,
    canSubmitClockOut,
    hasAtLeastOneClockOutTask,
    hasIncompleteClockOutRows,
    totalClockOutHours,
    projectRows,
    showProjectTasksSection,
  ]);

  return (
    <Card
      elevation={2}
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 0.5,
        bgcolor: "secondary.light",
      }}
    >
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
      <Stack direction="row" alignItems="center" justifyContent={"space-between"}>
        <Stack direction={"row"} alignItems="center" gap={1}>
          <Typography variant="h6" fontWeight="bold">
            {data?.data?.userDisplayName}
          </Typography>
          <Typography
            component="span"
            variant="caption"
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.success.main, 0.25),
              color: "success.contrastText",
            }}
          >
            {employeeDetails?.data?.employeeId}
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          color="text.primary"
          sx={{
            border: "none",
            textDecoration: "underline",
            cursor: "pointer",
            ":hover": { color: "primary.main" },
            transition: "color 0.3s",
          }}
          component={"button"}
          onClick={() => {
            navigate("?tab=3&mainTab=3");
          }}
        >
          View All
        </Typography>
      </Stack>


      {attendanceData && (
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack>
            <Stack direction="row" alignItems="baseline" gap={0.5}>
              <Typography variant="h6" fontWeight="bold">
                {currentTime.format("h:mm")}
              </Typography>
              <Typography variant="body2">{currentTime.format(":ss A")}</Typography>
            </Stack>
            <Typography variant="caption" ml={0.5}>
              {currentTime.format("ddd, DD MMM YYYY")}
            </Typography>
            {attendanceData?.data?.clockedIn && attendanceData?.data.clockedOut && (
              <Typography variant="caption">You have clocked out for the day</Typography>
            )}
          </Stack>

          {attendanceData?.data.clockedIn ? (
            !attendanceData?.data.clockedOut ? (
              <PrimaryButton
                onClick={handleActionClick}
                size="small"
                sx={{ fontSize: "0.7rem" }}
                color={"error"}
              >
                Clock Out
              </PrimaryButton>
            ) : null
          ) : (
            !attendanceData?.data.clockedOut && (
              <PrimaryButton
                onClick={handleActionClick}
                size="small"
                sx={{ fontSize: "0.7rem" }}
                color={"success"}
              >
                Clock In
              </PrimaryButton>
            )
          )}
        </Stack>
      )}

      <ModalElement
        open={showModal}
        onClose={() => !isSubmitting && setShowModal(false)}
        title={
          modalType === "in" ? (
            "Clock in message"
          ) : (
            <Stack spacing={0}>
              <Typography variant="subtitle1" fontWeight={600} lineHeight={1.2}>
                Clock out
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatElapsedSinceLogin(
                  attendanceData?.data?.clockInTime as string | undefined,
                  currentTime,
                )}{" "}
                since login
              </Typography>
            </Stack>
          )
        }
        maxWidth={modalType === "out" ? "md" : "sm"}
      >
        <Stack spacing={2.5} sx={{ pt: 0, maxHeight: "70vh", overflow: "auto" }}>
          {modalType === "in" ? (
            <>
              <TipTapEditor onChange={(html) => setMessageHtml(html)} />
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                <Tooltip
                  title={clockInSubmitTooltipTitle}
                  placement="top"
                  disableHoverListener={!clockInSaveDisabled}
                >
                  <Box component="span" sx={{ display: "inline-block" }}>
                    <PrimaryButton
                      onClick={handleSave}
                      disabled={clockInSaveDisabled}
                    >
                      {isSubmitting ? "Saving..." : "Save"}
                    </PrimaryButton>
                  </Box>
                </Tooltip>
              </Box>
            </>
          ) : (
            <>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      width: 3,
                      height: 16,
                      borderRadius: 99,
                      bgcolor: "primary.main",
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Company task
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Non-project work for this shift — hours and task explanation (same pattern as Regularise).
                </Typography>
                <TaskTable>
                  <TableHead>
                    <Box sx={{ width: 158, flexShrink: 0 }}>
                      <HeadLabel variant="overline" display="block">
                        Hours worked
                      </HeadLabel>
                    </Box>
                    <HeadLabel variant="overline" sx={{ flex: 1 }}>
                      Task explanation
                    </HeadLabel>
                  </TableHead>
                  <TaskRow isEven>
                    <Box sx={{ width: 168, flexShrink: 0 }}>
                      <SingleSelectElement
                        label=""
                        value={companyHoursStr}
                        onChange={setCompanyHoursStr}
                        options={HALF_HOUR_SELECT_OPTIONS}
                        placeholder="Hours"
                        fullWidth
                        clearable
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <TipTapEditor
                        key={`company-${clockOutEditorKey}`}
                        content={companyTasksHtml}
                        onChange={setCompanyTasksHtml}
                        compact
                      />
                    </Box>
                  </TaskRow>
                </TaskTable>
              </Box>

              {showProjectTasksSection && (
                <Box>
                  <ProjectSectionTitle
                    label="Project task"
                    count={projectRows.length}
                    onAdd={addProjectRow}
                  />
                  {projectRows.length > 0 ? (
                    <TaskTable>
                      <TableHead>
                        <HeadLabel variant="overline" sx={{ width: 150, flexShrink: 0 }}>
                          Project
                        </HeadLabel>
                        <Box sx={{ width: 138, flexShrink: 0 }}>
                          <HeadLabel variant="overline" display="block">
                            Hours worked
                          </HeadLabel>
                        </Box>
                        <HeadLabel variant="overline" sx={{ flex: 1 }}>
                          Task explanation
                        </HeadLabel>
                        <Box sx={{ width: 40, flexShrink: 0 }} />
                      </TableHead>
                      {projectRows.map((row, index) => (
                        <TaskRow key={index} isEven={index % 2 === 0}>
                          <Box sx={{ width: 150, flexShrink: 0 }}>
                            <SingleSelectElement
                              label=""
                              value={row.projectId}
                              onChange={(v) => updateProjectRow(index, "projectId", v)}
                              options={projectOptionsByRow[index] ?? []}
                              disabled={projectsLoading}
                              placeholder={projectsLoading ? "Loading…" : "Project"}
                            />
                          </Box>
                          <Box sx={{ width: 148, flexShrink: 0 }}>
                            <SingleSelectElement
                              label=""
                              value={row.hoursWorked}
                              onChange={(v) => updateProjectRow(index, "hoursWorked", v)}
                              options={HALF_HOUR_SELECT_OPTIONS}
                              placeholder="Hours"
                              fullWidth
                              clearable
                            />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <TipTapEditor
                              key={`proj-${clockOutEditorKey}-${index}-${row.projectId}`}
                              content={row.description}
                              onChange={(html) => updateProjectRow(index, "description", html)}
                              compact
                            />
                          </Box>
                          <Tooltip title="Remove row" placement="top">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeProjectRow(index)}
                              sx={{ mt: "1px", flexShrink: 0, alignSelf: "flex-start" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TaskRow>
                      ))}
                    </TaskTable>
                  ) : null}
                </Box>
              )}

              <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
                <Tooltip
                  title={clockOutSubmitTooltipTitle}
                  placement="top"
                  disableHoverListener={!clockOutSaveDisabled}
                >
                  <Box component="span" sx={{ display: "inline-block" }}>
                    <PrimaryButton
                      onClick={handleSave}
                      disabled={clockOutSaveDisabled}
                    >
                      {isSubmitting ? "Saving..." : "Submit"}
                    </PrimaryButton>
                  </Box>
                </Tooltip>
              </Box>
            </>
          )}
        </Stack>
      </ModalElement>
    </Card>
  );
}

export default ClockInOutView;
