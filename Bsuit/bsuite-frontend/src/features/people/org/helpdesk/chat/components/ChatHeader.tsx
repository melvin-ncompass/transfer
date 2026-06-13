import { Box, Stack, Typography } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

interface ChatHeaderProps {
  title?: string;
  connected: boolean;
}

export default function ChatHeader({
  title = "Ticket conversation",
  connected,
}: ChatHeaderProps) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <FiberManualRecordIcon
            sx={{
              fontSize: 10,
              color: connected ? "success.main" : "warning.main",
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {connected ? "Connected" : "Disconnected"}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
