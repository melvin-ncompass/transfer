import { Box, Typography } from "@mui/material";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";

interface EmptyChatProps {
  connected: boolean;
  historyLoaded: boolean;
}

export default function EmptyChat({ connected, historyLoaded }: EmptyChatProps) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        py: 6,
        px: 2,
        color: "text.secondary",
      }}
    >
      <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 40, opacity: 0.5 }} />
      <Typography variant="subtitle2" color="text.primary">
        No messages yet
      </Typography>
      <Typography variant="body2" align="center">
        {!connected
          ? "Connecting to the conversation…"
          : historyLoaded
            ? "Start the conversation by sending a message below."
            : "Loading conversation history…"}
      </Typography>
    </Box>
  );
}
