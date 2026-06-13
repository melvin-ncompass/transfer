import { ToggleButton, ToggleButtonGroup, Box, useTheme } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import type { TimesheetGroupMode } from "../types/timesheet.types";

interface GroupByToggleProps {
  value: TimesheetGroupMode;
  onChange: (value: TimesheetGroupMode) => void;
}

export function GroupByToggle({ value, onChange }: GroupByToggleProps) {
  const theme = useTheme();

  return (
    <Box>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, next) => {
          if (next) onChange(next);
        }}
        size="small"
        sx={{ height: 32 }}
      >
        <ToggleButton
          value="byEmployee"
          sx={{
            textTransform: "none",
            px: 2,
            gap: 0.75,
            "&.Mui-selected": {
              backgroundColor: theme.palette.action.selected,
              color: theme.palette.primary.main,
            },
          }}
        >
          <PersonOutlineIcon sx={{ fontSize: 18 }} />
          Group by Employee
        </ToggleButton>
        <ToggleButton
          value="byDate"
          sx={{
            textTransform: "none",
            px: 2,
            gap: 0.75,
            "&.Mui-selected": {
              backgroundColor: theme.palette.action.selected,
              color: theme.palette.primary.main,
            },
          }}
        >
          <CalendarTodayIcon sx={{ fontSize: 18 }} />
          Group by Dates
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
