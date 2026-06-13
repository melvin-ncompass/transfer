import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { useSearchParams } from "react-router-dom";

import OrgHomeView from "./org/OrgHomeView";
import { SalaryStructureView } from "./salary/structure/SalaryStructureView";
import { PayrunView } from "./salary/payrun/PayrunView";
import { TimeView } from "./time/TimeView";
import InboxHomeView from "./inbox/InboxView";
import DashboardView from "./dashboard/DashboardView";
import ReportsView from "./reports/ReportsView";
import ProjectsTimesheetsView from "./projects-timesheets/ProjectsTimesheetsView";
import MeHomeView from "./me/MeHomeView";
import HomeView from "./home/HomeView";
import { ApprovalView } from "./approvals/ApprovalView";
import SalaryTemplateModal from "./salary/structure/SalaryTemplate/components/SalaryTemplateModal";
import ITDeclarationModal from "./me/investments/components/ITDeclarationModal";
import EditSalaryTemplate from "./salary/structure/SalaryTemplate/components/EditSalaryTemplate";
import EmployeeOnlySalaryView from "./salary/EmployeeOnlySalaryView";

// IDs must match SideBarPeople: 1–9 top-level, 10 = Approvals, 71/72 = Salary children (PayRun, Structure), 73 = template modal
const COMPONENTS: { id: number; component: ReactNode }[] = [
  { id: 1, component: <DashboardView /> },
  { id: 2, component: <HomeView /> },
  { id: 3, component: null }, // filled below with MeHomeView
  { id: 33, component: null }, // filled below with ITDeclarationModal
  { id: 4, component: <OrgHomeView /> },
  { id: 5, component: <InboxHomeView /> },
  { id: 10, component: <ApprovalView /> },
  { id: 6, component: <TimeView /> },
  { id: 71, component: <PayrunView /> },
  { id: 72, component: null }, // filled below with setCurrentTab
  {id: 73, component: null}, // filled below with SalaryTemplateModal
  { id: 73, component: <SalaryTemplateModal /> },
  { id: 8, component: <ReportsView /> },
  { id: 9, component: <ProjectsTimesheetsView /> },
];

export default function PeopleView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = Number(searchParams.get("tab")) || 1;
  const idParam = Number(searchParams.get("id")) || null;
  const setCurrentTab = (id: number) => setSearchParams({ tab: String(id) });

  const componentsWithStructure = COMPONENTS.map((item) =>
    item.id === 72
      ? {
          id: 72,
          component: <SalaryStructureView />,
        }
      : 
      item.id === 73
      ? {
          id: 73, 
          component: <EditSalaryTemplate  setCurrentTab={setCurrentTab} />,
        }
       :
      item.id === 3
      ? {
          id: 3,
          component: <MeHomeView setcurrentTab={setCurrentTab} />,
        }
       :
      item.id === 33
      ? {
          id: 33,
          component: <ITDeclarationModal setcurrentTab={setCurrentTab} />,
        }
      : item,
  );
  const activeComponent = componentsWithStructure.find(
    (item) => item.id === tabParam,
  )?.component;

  return (
    <Box sx={{ height: "100%", width: "100%", overflow: "auto" }}>
      {activeComponent}
    </Box>
  );
}
