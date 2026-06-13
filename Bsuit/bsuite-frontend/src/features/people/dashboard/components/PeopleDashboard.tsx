import {
  Box,
  Card,
  Divider,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import { Chip } from "../../../../components/atom/chips/Chips";
import { useGetConfigCountQuery } from "../api/dashboard.api";
import { useSearchParams } from "react-router-dom";
import { AnalyticsBarLoader } from "../../../../components/atom/circular-progress/AnimatedBarChart";

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckIcon from '@mui/icons-material/Check';

/** Fresh config whenever the dashboard is shown again (tab switch remounts this tree). */
const CONFIG_COUNT_QUERY_OPTS = {
  refetchOnMountOrArgChange: true as const,
  refetchOnFocus: true as const,
};

const STEP_TAB_MAP: Record<string, number> = {
  paySchedule: 71,
  salaryStructure: 72,
  salaryTemplate: 72,
  departmentAndDesignation: 4,
  incomeTaxConfiguration: 71,
  leave: 6,
  shift: 6,
  weekOff: 6,
  holidayPlan: 6,
  employee: 4,
};

export function PayrollSetupDashboard() {

  const theme = useTheme();
  const { data, isLoading } = useGetConfigCountQuery(undefined, CONFIG_COUNT_QUERY_OPTS);
  const [, setSearchParams] = useSearchParams();

  if (isLoading) {
    return (
      <Card
        elevation={2}
        sx={{
          p: 7,
          overflow: "auto",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
        }}
      >
        <AnalyticsBarLoader />
      </Card>
    );
  }

  const payload = data?.data;

  // Safe defaults to prevent crashes
  const defaultSteps = {
    paySchedule: { completed: false },
    salaryStructure: { completed: false },
    salaryTemplate: { completed: false },
    departmentAndDesignation: {
      completed: false,
      departmentCount: 0,
      designationCount: 0,
    },
    incomeTaxConfiguration: { completed: false },
    leave: {
      completed: false,
      leaveTypeCount: 0,
      leavePlanCount: 0,
    },
    shift: {
      completed: false,
      shiftCount: 0,
    },
    weekOff: {
      completed: false,
      weekOffCount: 0,
    },
    holidayPlan: { completed: false },
    employee: { completed: false },
  };

  const stepsData: any = {
    ...defaultSteps,
    ...(payload?.steps ?? {}),
  };

  const stepsList = [
    {
      key: "paySchedule",
      label: "Pay Schedule",
      status: stepsData.paySchedule?.completed,
      description:
        "Configure payroll cycles, salary frequencies, and payout schedules",
    },
    {
      key: "salaryStructure",
      label: "Salary Structure",
      status: stepsData.salaryStructure?.completed,
      description:
        "Define salary components, allowances, deductions, and earnings",
    },
    {
      key: "salaryTemplate",
      label: "Salary Templates",
      status: stepsData.salaryTemplate?.completed,
      description:
        "Create reusable salary templates for employee payroll setup",
    },
    {
      key: "departmentAndDesignation",
      label: "Department & Designation",
      status: stepsData.departmentAndDesignation?.completed,
      description:
        "Organize employees by departments, teams, and job roles",
    },
    {
      key: "incomeTaxConfiguration",
      label: "Income Tax Configurations",
      status: stepsData.incomeTaxConfiguration?.completed,
      description:
        "Set up tax rules, exemptions, and payroll tax calculations",
    },
    {
      key: "leave",
      label: "Leave Types & Leave Plans",
      status: stepsData.leave?.completed,
      description:
        "Configure leave policies, leave types, and approval plans",
    },
    {
      key: "shift",
      label: "Shifts",
      status: stepsData.shift?.completed,
      description:
        "Manage employee shifts, timings, and attendance schedules",
    },
    {
      key: "weekOff",
      label: "Week Offs",
      status: stepsData.weekOff?.completed,
      description:
        "Define weekly offs and recurring employee off schedules",
    },
    {
      key: "holidayPlan",
      label: "Holiday Plans",
      status: stepsData.holidayPlan?.completed,
      description:
        "Create holiday calendars and company-wide holiday plans",
    },
    {
      key: "employee",
      label: "Employee",
      status: stepsData.employee?.completed,
      description:
        "Add employees and maintain workforce profile information",
    },
  ];

  const completedCount = stepsList.filter((s) => s.status).length;
  const totalCount = stepsList.length;
  const progress = Math.min((completedCount / totalCount) * 100, 100);

  const handleStepClick = (stepKey: string) => {
    const newParams = new URLSearchParams();

    newParams.set("tab", String(STEP_TAB_MAP[stepKey]));

    if (stepKey === "salaryTemplate") {
      newParams.set("subtab", "2");
    } else if (stepKey === "paySchedule") {
      newParams.set("mainTab", "2");
      newParams.set("subtab", "0");
    } else if (stepKey === "incomeTaxConfiguration") {
      newParams.set("mainTab", "2");
      newParams.set("subtab", "1");
    } else if (stepKey === "holidayPlan") {
      newParams.set("subtab", "2");
    } else if (stepKey === "departmentAndDesignation") {
      const deptCount =
        stepsData.departmentAndDesignation?.departmentCount || 0;

      const desigCount =
        stepsData.departmentAndDesignation?.designationCount || 0;

      if (deptCount > 0 && desigCount === 0) {
        newParams.set("subtab", "2");
      } else {
        newParams.set("subtab", "1");
      }
    } else if (stepKey === "leave") {
      const leaveTypeCount = stepsData.leave?.leaveTypeCount || 0;
      const leavePlanCount = stepsData.leave?.leavePlanCount || 0;

      newParams.set("subtab", "3");

      if (leaveTypeCount === 0) {
        newParams.set("leaveView", "TYPE");
      } else if (leavePlanCount === 0) {
        newParams.set("leaveView", "PLAN");
      } else {
        newParams.set("leaveView", "TYPE");
      }
    } else if (stepKey === "shift") {
      newParams.set("subtab", "0");
    } else if (stepKey === "weekOff") {
      newParams.set("subtab", "1");
    }

    setSearchParams(newParams);
  };

  return (
    <Card
      elevation={2}
      sx={{
        p: 4,
        overflow: "auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "flex-start",
          bgcolor: theme.palette.grey[100],
          borderRadius: 2,
          border: "1px solid #EEF2F7",
          py: 2,
          px: 4,
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h5" color="textPrimary">
            PEOPLE SETUP
          </Typography>
          <Typography variant="body2" color="textPrimary">
            Complete these steps to get your HR system ready.
          </Typography>
        </Box>
        <Box sx={{ width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="textPrimary">
              Overall Progress
            </Typography>
            <Typography variant="body2" color="textPrimary">
              {completedCount} of {totalCount} Completed
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 12, borderRadius: 4,
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
              },
            }}
          />
        </Box>
      </Box>

      <Stack spacing={2}>
        {stepsList.map((step, index) => (
          <Box
            key={step.key}
            onClick={() => handleStepClick(step.key)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 2,
              py: 2,
              px: 4,
              bgcolor: theme.palette.secondary.light,
              border: "1px solid #EEF2F7",
              transition: "all 0.2s ease",
              cursor: "pointer",

              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {step.status ? (
              <CheckIcon
                sx={{
                  width: 36,
                  height: 36,
                  padding: 0.5,
                  color: theme.palette.primary.main,
                  bgcolor: theme.palette.primary.light,
                  borderRadius: "50%",
                }}
              />
              ) : (
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    bgcolor: theme.palette.primary.light,
                    color: theme.palette.primary.main,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  {index + 1}
                </Box>
              )}
              <Box>
              <Typography variant="body1" fontWeight={"bold"} color="textPrimary">
                {step.label}
              </Typography>
              <Typography variant="body2" color="textPrimary">
                {step.description}
              </Typography>
              </Box>
            </Box>
            <Box display='flex' flexDirection='row' gap={2} alignItems='center'>
            <Chip
              size="small"
              label={step.status ? "Completed" : "Configure"}
              color={step.status ? "success" : "warning"}
              // onClick={() => {
              //   const newParams = new URLSearchParams();
              //   newParams.set("tab", String(STEP_TAB_MAP[step.key]));

              //   if (step.key === "salaryTemplate") {
              //     newParams.set("subtab", "2");
              //   } else if (step.key === "paySchedule") {
              //     newParams.set("mainTab", "2");
              //     newParams.set("subtab", "0");
              //   } else if (step.key === "incomeTaxConfiguration") {
              //     newParams.set("mainTab", "2");
              //     newParams.set("subtab", "1");
              //   } else if (step.key === "holidayPlan") {
              //     newParams.set("subtab", "2");
              //   } else if (step.key === "departmentAndDesignation") {
              //     const deptCount =
              //       stepsData.departmentAndDesignation?.departmentCount || 0;
              //     const desigCount =
              //       stepsData.departmentAndDesignation?.designationCount || 0;

              //     if (deptCount > 0 && desigCount === 0) {
              //       newParams.set("subtab", "2");
              //     } else {
              //       newParams.set("subtab", "1");
              //     }
              //   } else if (step.key === "leave") {
              //     const leaveTypeCount = stepsData.leave?.leaveTypeCount || 0;
              //     const leavePlanCount = stepsData.leave?.leavePlanCount || 0;

              //     if (leaveTypeCount === 0) {
              //       newParams.set("subtab", "3");
              //       newParams.set("leaveView", "TYPE");
              //     } else if (leavePlanCount === 0) {
              //       newParams.set("subtab", "3");
              //       newParams.set("leaveView", "PLAN");
              //     } else {
              //       newParams.set("subtab", "3");
              //       newParams.set("leaveView", "TYPE");
              //     }
              //   } else if (step.key === "shift") {
              //     newParams.set("subtab", "0");
              //   } else if (step.key === "weekOff") {
              //     newParams.set("subtab", "1");
              //   }

              //   setSearchParams(newParams);
              // }}
            />

            <ChevronRightIcon />
            </Box>
          </Box>
        ))}
      </Stack>
    </Card>
  );
}