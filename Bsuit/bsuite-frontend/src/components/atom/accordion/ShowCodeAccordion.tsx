import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import type { ShowCodeAccordionProps } from "../../../types/types";

export function ShowCodeAccordion({
  code,
  label = "Show Code",
  labelOpen = "Hide Code",
  sx,
}: ShowCodeAccordionProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Box
      sx={{
        border: "1px solid #ccc",
        borderRadius: 1,
        overflow: "hidden",
        ...sx,
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          bgcolor: "grey.200",
          p: 1.5,
          cursor: "pointer",
        }}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Typography variant="body2">{open ? labelOpen : label}</Typography>
        {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
      </Stack>

      {/* Code content */}
      {open && (
        <Box
          sx={{
            bgcolor: "grey.900",
            color: "white",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            whiteSpace: "pre-wrap",
            overflowX: "auto",
            borderRadius: 2,
            p: 2,
          }}
        >
          {code}
        </Box>
      )}
    </Box>
  );
}
