import { useState, type ReactNode } from "react";
import { Box, Typography, Paper } from "@mui/material";

export interface CollapsibleCardProps {
  header: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleCard({
  header,
  children,
  defaultOpen = false,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        mb: 1,
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setOpen(!open)}
        sx={{
          cursor: "pointer",
          px: 2,
          py: 1.5,
          backgroundColor: "background.paper",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {header}
      </Box>

      {/* Content */}
      {open && (
        <Box sx={{ px: 2, py: 1 }}>
          {children}
        </Box>
      )}
    </Paper>
  );
}
