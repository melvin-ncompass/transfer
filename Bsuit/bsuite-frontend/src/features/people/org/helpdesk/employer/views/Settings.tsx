import  { Box } from "@mui/system";
import { TabsAtom, type TabItem } from "../../../../../../components/tabs";
import TicketCategory from "../settings/TicketCategory";
import BusinessHours from "../settings/BusinessHours";
import CannedResponses from "../settings/CannedResponses";
import ClosingReasons from "../settings/ClosingReasons";
import SlaMapping from "../settings/SlaMapping";
import EscalationRules from "../settings/EscalationRules";

function Settings() {
  const settingsTabs: TabItem[] = [
    {
      label: "Ticket Categories",
      content:<TicketCategory/>
    },
    // {
    //   label: "SLA Mapping",
    //   content:<SlaMapping/>
    // },
    // {
    //   label: "Escalation Rules",
    //   content:<EscalationRules/>
    // },
    {
      label: "Business Hours",
      content:<BusinessHours/>
    },
    {
      label: "Canned Responses",
      content:<CannedResponses />
    },
    {
      label: "Closing Reasons",
      content:<ClosingReasons />
    },
  ];

  return (
    <Box height={"100%"}>
      <TabsAtom
        tabs={settingsTabs}
        sx={{ height: "100%" }}
        contentSx={{ height: "100%" }}
      />
    </Box>
  );
}

export default Settings;
