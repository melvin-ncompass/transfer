import {
  Box,
  Card,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useGetEmployeeQuery } from "../api/directory.api";
import { TabsAtom, type TabItem } from "../../../../../../components/tabs";
import EmployeeProfileView from "../components/EmployeeProfileView";
import SalaryDetails from "../components/SalaryDetails";
import DirectoryDocsView from "../components/empDocs/DirectoryDocsView";
import OrganizationInvestmentsView from "../components/OrganizationInvestmentsView";
import DirectoryEmpDocsView from "../components/DirectoryEmpDocsView";
import EmployeeExpenseClaimsView from "../components/EmployeeExpenseClaimsView";
import { AttendanceView } from "../../../../me/attendance/AttendanceView";
import MeLeaveView from "../../../../me/leave/MeLeaveView";
import MeLeaveRequestsView from "../../../../me/leave/MeLeaveRequestsView";
import { useGetEmployeeInfoQuery } from "../../../../api/people.api";
import EmployeeOnlySalaryView from "../../../../salary/EmployeeOnlySalaryView";
import TimelineView from "../../../../me/timeline/components/TimelineView";

function getEmployeeDisplayName(emp: {
  contact?: {
    name?: string;
    firstName?: string;
    middleName?: string | null;
    lastName?: string | null;
  };
}): string {
  const c = emp.contact;
  if (!c) return "—";
  if (c.name) return c.name;
  const parts = [c.firstName, c.middleName, c.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : "—";
}

export default function EmployeeDetailsLayoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: empInfo } = useGetEmployeeInfoQuery();

  const initialTab = Number(searchParams.get("Etab") ?? 0);
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tab: number) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("Etab", String(tab));
      return next;
    });
  };

  const employeeId = id ? parseInt(id, 10) : NaN;
  const { data: response, isLoading, isError } = useGetEmployeeQuery(employeeId, {
    skip: !id || !Number.isFinite(employeeId),
  });
  const employee = response?.data;

  if (!id || !Number.isFinite(employeeId)) {
    return (
      <Box p={3}>
        <Typography color="error">Invalid employee ID</Typography>
      </Box>
    );
  }

  if (isError || (!isLoading && !employee)) {
    return (
      <Box p={3}>
        <Typography color="error">Employee not found</Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          width: "100%",
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box p={3}>
        <Typography color="error">Employee not found</Typography>
      </Box>
    );
  }

  const displayName = getEmployeeDisplayName(employee);
  const employeeIdDisplay = employee.employeeId ?? "—";
  // Numeric DB id used by the profile API (same format as /employee/info returns)
  const profileApiId = String(employee.id);
  // const { data: empData } = useGetEmployeeQuery(Number(profileApiId)!, { skip: !profileApiId });

  /** Investments is always tab index 2: Profile(0), Documents(1), Investments(2), … */
  const investmentsTabIndex = 2;
  const timelineTabIndex =
    3 +
    (response?.data?.isPayrollEnabled ? 1 : 0) +
    (response?.data?.isAttendanceEnabled ? 3 : 0) +
    2;

  // Build tabs dynamically so the Profile tab has access to the correct employee ID
  const EMPLOYEE_DETAIL_TABS: TabItem[] = [
    {
      label: "Profile",
      content: <EmployeeProfileView employeeId={profileApiId} />,
    },
    {
      label: "Documents",
      content: <DirectoryDocsView />
    },
    {
      label: "Investments",
      content: (
        <OrganizationInvestmentsView
          employeeId={Number(profileApiId)}
          parentPanelVisible={activeTab === investmentsTabIndex}
        />
      ),
    },
    ...(response?.data?.isPayrollEnabled
      ? [
        {
          label: "Salary Details",
          content: empInfo?.data?.isAdmin ? <SalaryDetails /> : <EmployeeOnlySalaryView id={Number(profileApiId)} />,
        },
      ]
      : []),
    ...(response?.data?.isAttendanceEnabled
      ? [
        {
          label: "Attendance",
          content: <AttendanceView id={Number(profileApiId)} />,
        },
        {
          label: "Leave",
          content: <MeLeaveView id={Number(profileApiId)} />,
        },
        {
          label: "Requests",
          content: <MeLeaveRequestsView id={Number(profileApiId)} title="Requests" />,
        },
      ]
      : []),

    {
      label: "Employee Documents",
      content: <DirectoryEmpDocsView id={Number(profileApiId)} />
    },
    {
      label: "Expense Claims",
      content: (
        <EmployeeExpenseClaimsView
          employeeEmail={
            employee.workEmail?.trim() ||
            employee.contact?.email?.trim() ||
            employee.personalEmail?.trim() ||
            ""
          }
        />
      ),
    },
    {
      label: "Timeline",
      content: (
        <TimelineView
          employeeId={profileApiId}
          parentPanelVisible={activeTab === timelineTabIndex}
        />
      ),
    },
  ];

  return (
    <Box sx={{ pb: 3 }}>
      <Card variant="outlined" sx={{ boxShadow: 2 }}>
        {/* Header: back + name + employee ID */}
        <Box
          sx={{
            p: 2.5,
            pb: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "grey.50",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton
              onClick={() => navigate("/people/home?tab=4")}
              size="small"
              sx={{
                bgcolor: "white",
                border: "1px solid",
                borderColor: "grey.300",
                "&:hover": { bgcolor: "grey.100" },
              }}
              aria-label="Back to directory"
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={600} noWrap>
                {displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {employeeIdDisplay}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Tabs */}
        <TabsAtom
          tabs={EMPLOYEE_DETAIL_TABS}
          value={activeTab}
          onChange={handleTabChange}
          defaultValue={0}
          scrollable
          contentSx={{ pt: 2, px: 1, pb: 3 }}
        />
      </Card>
    </Box>
  );
}