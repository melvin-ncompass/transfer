import { Box } from "@mui/system";
import { TabsAtom, type TabItem } from "../../../../../../../components/tabs";
import PayslipView from "./payslips/Payslips";
import TdsView from "./tds/TdsView";

function DirectoryDocsView() {
  // Constant Variables
  const tabs: TabItem[] = [
    {
      label: "Payslips",
      content:<PayslipView />
    },
    {
      label: "TDS",
      content: <TdsView />
    },
  ];
  return (
    <Box>
      <TabsAtom tabs={tabs} />
    </Box>
  );
}

export default DirectoryDocsView;
