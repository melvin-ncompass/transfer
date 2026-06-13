import { Box } from "@mui/material";
import { AttendancePage } from "./components/AttendancePage";

/** Fill tab panel height so only the log table scrolls, not the outer Card / tabs panel. */
export const AttendanceView = ({
  id,
  parentPanelVisible,
}: {
  id?: number;
  /** When set (Me home), refetches when the user returns to this tab after clock-in/out on Home. */
  parentPanelVisible?: boolean;
}) => {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <AttendancePage id={id!} parentPanelVisible={parentPanelVisible} />
    </Box>
  );
};