import { Box } from "@mui/system";
import { TabsAtom, type TabItem } from "../../../../../components/tabs";
import { DateRangePicker } from "../../../../../components/atom/custom-date-range-picker";
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import type { StandardTableColumn } from "../../../../../types/types";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { PrimaryButton } from "../../../../../components/atom/button";
import { useGetNextPayableQuery } from "../../../salary/payrun/runpayroll/api/payrun.api";
import { Download } from "@mui/icons-material";
import { Snackbar } from "../../../../../components/atom/snackbar";
import {
  useGetAttendaceReportQuery,
  useExportAttendanceReportMutation,
  useExportLeaveReportMutation,
  useGetLeaveReportQuery,
} from "../api/time-report.api";
import { PrimaryIconButton } from "../../../../../components/atom/button/PrimaryIconButton";

function TimeReportsView() {
  const [startDate, setStartDate] = useState<Dayjs>();
  const [endDate, setEndDate] = useState<Dayjs>();
  const [activeTab, setActiveTab] = useState(0);
  const { data: nextData } = useGetNextPayableQuery();
  const [exportLeaveReport, { isLoading: isExportingLeave }] = useExportLeaveReportMutation();
  const [exportAttendanceReport, { isLoading: isExportingAttendance }] = useExportAttendanceReportMutation();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "info" });

  const showSnackbar = (message: string, color: "success" | "error" | "info" | "warning" = "success") => {
    setSnackbar({ open: true, message, color });
  };

  const getBackendMessage = (err: unknown, fallback: string) => {
    const e = err as any;
    return (
      e?.data?.message ||
      e?.data?.error ||
      e?.error ||
      e?.message ||
      fallback
    );
  };

  const { data: leaveData } = useGetLeaveReportQuery(
    {
      startDate: startDate?.format("YYYY-MM-DD")!,
      endDate: endDate?.format("YYYY-MM-DD")!,
    },
    { skip: !startDate || !endDate,refetchOnMountOrArgChange:true },
  );
  useEffect(() => {
    if (nextData?.cycleStart && nextData?.cycleEnd) {
      setStartDate(dayjs(nextData.cycleStart));
      setEndDate(dayjs(nextData.cycleEnd));
    }
  }, [nextData]);
  const { data: attendanceData } = useGetAttendaceReportQuery(
    {
      startDate: startDate?.format("YYYY-MM-DD")!,
      endDate: endDate?.format("YYYY-MM-DD")!,
    },
    { skip: !startDate || !endDate,refetchOnMountOrArgChange:true },
  );

  const handleExportLeaveReport = async () => {
    if (!startDate || !endDate) return;
    const start = startDate.format("YYYY-MM-DD");
    const end = endDate.format("YYYY-MM-DD");

    try {
      const { blob, fileName } = await exportLeaveReport({
        startDate: start,
        endDate: end,
      }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSnackbar("Leave report downloaded successfully.", "success");
    } catch (error) {
      showSnackbar(getBackendMessage(error, "Failed to export leave report."), "error");
    }
  };

  const handleExportAttendanceReport = async () => {
    if (!startDate || !endDate) return;
    const start = startDate.format("YYYY-MM-DD");
    const end = endDate.format("YYYY-MM-DD");

    try {
      // Backend sends the report to mail (xlsx).
      const res = await exportAttendanceReport({ startDate: start, endDate: end }).unwrap();
      showSnackbar(
        (res as any)?.message || "Attendance report export request submitted. Report will be sent to your email.",
        "success",
      );
    } catch (error) {
      showSnackbar(getBackendMessage(error, "Failed to export attendance report."), "error");
    }
  };

  //   columns

  const AttendanceColumns: StandardTableColumn[] = [
    { id: "employee", label: "Employee" },
    { id: "workingDays", label: "Working Days" },
    { id: "attendance", label: "Attendance" },
    { id: "lopActual", label: "LOP Days (Actual)" },
    { id: "lopConsidered", label: "LOP Days (Considered)" },
    { id: "lopTotal", label: "LOP Days (Total)" },
    { id: "payableDays", label: "Payable Days" },
  ];
  const LeaveColumns: StandardTableColumn[] = [
  { id: "employee", label: "Employee" },
  { id: "casualLeave", label: "Casual Leave" },
  { id: "collegeLeave", label: "College Leave" },
  { id: "compensatoryOff", label: "Compensatory Off" },
  { id: "maternityLeave", label: "Maternity Leave" },
  { id: "paternityLeave", label: "Paternity Leave" },
  { id: "unpaidLeave", label: "Unpaid Leave" },
];
  const attendanceRows =
    attendanceData?.data?.map((item: any) => {
      return {
        employee: item.employee, // replace with name if you have employee data
        workingDays: item.workingDays,
        attendance: item.attendance,
        lopActual: item.actualLop,
        lopConsidered: item.leaveConsidered, // adjust if different logic exists
        lopTotal: item.totalLop,
        payableDays:item.paidDays,
      };
    }) ?? [];
 const leaveRows =
  leaveData?.data?.map((item: any) => {
    // helper to get value by leave name
    const getLeave = (name: string) =>
      item.leaveStats.find((l: any) => l.leaveTypeName === name)
        ?.consumed ?? 0;

    return {
      employee: item.employee,
      casualLeave: getLeave("Casual Leave"),
      collegeLeave: getLeave("College Leave"),
      compensatoryOff: getLeave("Compensatory Off"),
      maternityLeave: getLeave("Maternity Leave"),
      paternityLeave: getLeave("Paternity Leave"),
      unpaidLeave: getLeave("Unpaid Leave"),
    };
  }) ?? [];
  const tabs: TabItem[] = [
    {
      label: "Attendance",
      content: (
        <StandardTable columns={AttendanceColumns} rows={attendanceRows} />
      ),
    },
    {
      label: "Leave",
      content: <StandardTable columns={LeaveColumns} rows={leaveRows} />,
    },
  ];
  return (
    <Box mt={1}>
      <TabsAtom
        tabs={tabs}
        value={activeTab}
        onChange={setActiveTab}
        action={
          <Box display="flex" alignItems="center" gap={1.5} width={"100%"}>
            <DateRangePicker
              startValue={startDate}
              endValue={endDate}
              width="16.5rem"
              onChange={(dates) => {
                setStartDate(dates[0]!);
                setEndDate(dates[1]!);
              }}
            />
            {activeTab === 1 && (
              <PrimaryIconButton
                onClick={handleExportLeaveReport}
                disabled={!startDate || !endDate}
                loading={isExportingLeave}
                icon={<Download  />}
                variant="contained"
                title="Export Leave"
              />
            )}
            {activeTab === 0 && (
              <PrimaryIconButton
                onClick={handleExportAttendanceReport}
                disabled={!startDate || !endDate}
                loading={isExportingAttendance}
                icon={<Download  />}
                variant="contained"
                title="Export Attendance"
              />
            )}
          </Box>
        }
      />

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          autoClose={5000}
        />
      )}
    </Box>
  );
}

export default TimeReportsView;