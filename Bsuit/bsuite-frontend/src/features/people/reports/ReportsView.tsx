import { Card } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TabsAtom, type TabItem } from "../../../components/tabs";
import UnderConstruction from "../../../pages/UnderConstruction";
import SalaryReportView from "./salary/SalaryReportView";
import TimeReportsView from "./Time/components/TimeReportsView";
import ProjectsTimesheetsReportView from "./ProjectsTimesheets/components/ProjectsTimesheetsReportView";

const ReportsView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubTab = parseInt(searchParams.get("subtab") || "0", 10);
  const [activeTab, setActiveTab] = useState(initialSubTab);

  useEffect(() => {
    const subtabParam = searchParams.get("subtab");
    if (subtabParam !== null && subtabParam !== "") {
      setActiveTab(parseInt(subtabParam, 10));
    }
  }, [searchParams]);

  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue);
    setSearchParams((prev) => {
      prev.set("subtab", String(newValue));
      return prev;
    });
  };

  const tabs: TabItem[] = useMemo(
    () => [
      { label: "Org", content: <UnderConstruction /> },
      { label: "Time", content: <TimeReportsView /> },
      { label: "Salary", content: <SalaryReportView /> },
      { label: "Projects & Timesheets", content: <ProjectsTimesheetsReportView /> },
      { label: "Settings", content: <UnderConstruction /> },
    ],
    [],
  );

  return (
    <Card
      elevation={2}
      sx={{
        p: 2.5,
        height: "100%",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TabsAtom
        tabs={tabs}
        value={activeTab}
        onChange={handleTabChange}
        contentSx={{ p: 0 }}
      />
    </Card>
  );
};

export default ReportsView;
