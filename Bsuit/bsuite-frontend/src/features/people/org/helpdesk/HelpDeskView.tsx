import { Box } from "@mui/system";
import { TabsAtom, type TabItem } from "../../../../components/tabs";
import { useSearchParams } from "react-router-dom";
import Summary from "./employer/views/Summary";
import Tickets from "./employer/views/Tickets";
import Settings from "./employer/views/Settings";
import MyTickets from "./employee/views/MyTickets";
import Following from "./employee/views/Following";
import HelpdeskReports from "./employer/views/HelpdeskReports";

function HelpDeskView({employer}:{employer:boolean}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const helpdeskTab = Number(searchParams.get("helpdeskTab") ?? 0);
  const employerTabs :TabItem[] = [
    {
        label:"Summary",
        content:<Summary/>
    },{
        label:"Tickets",
        content:<Tickets/>
    },{
        label:"Reports",
        content:<HelpdeskReports/>  
    },{
        label:"Settings",
        content:<Settings/>
    },
  ]

  const employeeTabs:TabItem[] = [
   {
        label:"My Tickets",
        content:<MyTickets/>
    },
    {
      label:"Following",
      content:<Following/>
    }
  ] 
  const handleTabChange = (tab: number) => {
    setSearchParams((prev) => {
      prev.set("helpdeskTab", String(tab));
      return prev;
    });
  };

  return (
    <Box height={"100%"}>
      <TabsAtom
        tabs={employer ? employerTabs : employeeTabs}
        value={Number.isNaN(helpdeskTab) ? 0 : helpdeskTab}
        onChange={handleTabChange}
        sx={{height:"100%"}}
        contentSx={{height:"100%"}}
      />
    </Box>
  );
}

export default HelpDeskView;
