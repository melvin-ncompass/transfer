import { useEffect, useRef, useState } from "react";
import { Card } from "@mui/material";
import { TabsAtom, type TabItem } from "../../../components/tabs";
import MeLeaveView from "./leave/MeLeaveView";
import MeLeaveRequestsView from "./leave/MeLeaveRequestsView";
import ITDeclarationView from "./investments/components/ITDeclarationView";
import { AttendanceView } from "./attendance/AttendanceView";
// import { ApprovalView } from "./approvals/ApprovalView"; // Approvals moved to sidebar menu
import ProfileView from "./profile/components/ProfileView";
import MeDocumentsView from "./documents/MeDocumentsView";
import {
  MeExpenseClaimsView,
  type MeExpenseClaimsViewRef,
} from "./expense-claims/MeExpenseClaimsView";
import EmployeeOnlySalaryView from "../salary/EmployeeOnlySalaryView";
import TimelineView from "./timeline/components/TimelineView";
import { useSearchParams } from "react-router-dom";
import { useGetEmployeeProfileQuery } from "./profile/api/profile.api";
import { useGetEmployeeInfoQuery } from "../api/people.api";
import { useGetEmployeeQuery } from "../org/people/directory/api/directory.api";

// Main tabs (full list): Profile, Documents, Investments, Attendance, Leave, My requests, Expense Claims, …
// Only uncommented below: Profile, Investment, Attendance, Leave (+ My requests when attendance on), Expense Claims, Salary

export default function MeHomeView({
  setcurrentTab,
}: {
  setcurrentTab?: (tab: number) => void;
}) {

  const [searchParams, setSearchParams] = useSearchParams();
  const mainTabParam = searchParams.get("mainTab");
  const subtabParam = searchParams.get("subtab");

  const [mainTab, setMainTab] = useState(() => {
    if (mainTabParam != null) return Number(mainTabParam);
    if (subtabParam != null) return 1;
    return 0;
  });

  const expenseRef = useRef<MeExpenseClaimsViewRef>(null);
  const { data: empInfo } = useGetEmployeeInfoQuery();
  const employeeId = empInfo?.data?.employeeId ?? null;
  const { data: employeeRes } = useGetEmployeeQuery(employeeId!, {
    skip: employeeId == null,
  });
  const { data: profileResponse } = useGetEmployeeProfileQuery(
    String(employeeId ?? ""),
    { skip: employeeId == null }
  );

  // Notification deep-link: open the target Me sub-tab (card highlight handled in child views).
  useEffect(() => {
    if (profileResponse == null) return;

    if (mainTabParam != null) {
      setMainTab(Number(mainTabParam));
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("mainTab");
          return next;
        },
        { replace: true },
      );
      return;
    }

    // employee_documents: tab=3&subtab=0 → Documents (1) → Employee Documents (subtab 0)
    if (subtabParam != null) {
      setMainTab(1);
    }
  }, [mainTabParam, subtabParam, profileResponse, setSearchParams]);

  /** Employee record flags — portal profile often omits these nested fields. */
  const isAttendanceEnabled = Boolean(
    employeeRes?.data?.isAttendanceEnabled ??
      profileResponse?.data?.attendanceInformation?.isAttendanceEnabled,
  );
  const isPayrollEnabled = Boolean(
    employeeRes?.data?.isPayrollEnabled ??
      profileResponse?.data?.payrollInformation?.isPayrollEnabled,
  );
  const isIntern =
    (
      employeeRes?.data?.employeeType ??
      profileResponse?.data?.basicInformation?.employeeType ??
      ""
    ).toLowerCase() === "intern";
  const showInvestmentTab = !isIntern;

  let tabCursor = 2;
  const investmentMeTabIndex = showInvestmentTab ? tabCursor++ : -1;
  const attendanceMeTabIndex = isAttendanceEnabled ? tabCursor++ : -1;
  if (isAttendanceEnabled) tabCursor++;
  const myRequestsMeTabIndex = isAttendanceEnabled ? tabCursor++ : -1;
  tabCursor++;
  if (isPayrollEnabled) tabCursor++;
  const timelineMeTabIndex = tabCursor;

  const mainTabs: TabItem[] = [
    {
      label: "Profile",
      content: <ProfileView />,
    },
    {
      label: "Documents",
      content: <MeDocumentsView />,
    },
    ...(showInvestmentTab
      ? [
        {
          label: "Investment",
          content: (
            <ITDeclarationView
              parentPanelVisible={mainTab === investmentMeTabIndex}
            />
          ),
        },
      ]
      : []),

    // Attendance + Leave (only if enabled)
    ...(isAttendanceEnabled
      ? [
        {
          label: "Attendance",
          content: (
            <AttendanceView
              parentPanelVisible={
                attendanceMeTabIndex >= 0 && mainTab === attendanceMeTabIndex
              }
            />
          ),
        },
        {
          label: "Leave",
          content: <MeLeaveView />,
        },
        {
          label: "My requests",
          content: (
            <MeLeaveRequestsView
              parentPanelVisible={
                myRequestsMeTabIndex >= 0 && mainTab === myRequestsMeTabIndex
              }
            />
          ),
        },
      ]
      : []),

    {
      label: "Expense Claims",
      content: <MeExpenseClaimsView ref={expenseRef} />,
    },

    // Salary (only if payroll enabled)
    ...(isPayrollEnabled
      ? [
        {
          label: "Salary Details",
          content: <EmployeeOnlySalaryView />,
        },
      ]
      : []),

    {
      label: "Timeline",
      content: (
        <TimelineView
          parentPanelVisible={mainTab === timelineMeTabIndex}
        />
      ),
    },
  ];

  useEffect(() => {
    const maxTab = mainTabs.length - 1;
    if (mainTab > maxTab) {
      setMainTab(maxTab >= 0 ? maxTab : 0);
    }
  }, [mainTab, mainTabs.length]);

  return (
    <Card
      elevation={2}
      sx={{
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <TabsAtom
        tabs={mainTabs}
        value={mainTab}
        onChange={setMainTab}
        sx={{ height: "100%", overflow: "hidden" }}
        scrollable
        contentSx={{
          flex: 1,
          minHeight: 0,
          height: "100%",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      />
    </Card>
  );
}
