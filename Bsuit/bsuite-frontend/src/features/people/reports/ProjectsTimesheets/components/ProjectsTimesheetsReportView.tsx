import { useState } from "react";
import { Box } from "@mui/material";
import { TabsAtom, type TabItem } from "../../../../../components/tabs";
import { EmployeeTimesheetReport } from "./EmployeeTimesheetReport";
import { ProjectTimesheetReport } from "./ProjectTimesheetReport";

export default function ProjectsTimesheetsReportView() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs: TabItem[] = [
    {
      label: "Employee Timesheet",
      content: <EmployeeTimesheetReport isActive={activeTab === 0} />,
    },
    {
      label: "Project Timesheet",
      content: <ProjectTimesheetReport isActive={activeTab === 1} />,
    },
  ];

  return (
    <Box sx={{ mt: 1, width: "100%" }}>
      <TabsAtom
        tabs={tabs}
        value={activeTab}
        onChange={setActiveTab}
        sx={{ width: "100%" }}
        contentSx={{ p: 0, mt: 2, width: "100%" }}
      />
    </Box>
  );
}
export { ProjectsTimesheetsReportView };
