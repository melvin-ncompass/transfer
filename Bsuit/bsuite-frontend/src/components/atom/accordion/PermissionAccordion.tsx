import React from "react";
import {
  Box,
  Collapse,
  Typography,
  ListItemButton,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Checkbox } from "../check-box";

export interface PermissionAccordionProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  level?: number;
  showCheckbox?: boolean;
  checkboxProps?: React.ComponentProps<typeof Checkbox>;
  children?: React.ReactNode;
}

export const PermissionAccordion: React.FC<PermissionAccordionProps> = ({
  title,
  open,
  onToggle,
  level = 0,
  showCheckbox = false,
  checkboxProps,
  children,
}) => {
  const theme = useTheme();

  return (
    <Box>
      {/* HEADER ROW */}
      <ListItemButton
        onClick={onToggle}
        sx={{
          // pl: 2 + level * 4,
          pl: 0 + level * 4,
          pr: 2,
          py: 1,
          mb: 1.5,
          borderRadius: 1,
          display: "grid",
          gridTemplateColumns: "24px 32px 1fr",
          alignItems: "center",
          bgcolor:
            level === 0
              ? theme.palette.action.hover
              : "transparent",
          "&:hover": {
            bgcolor: theme.palette.action.hover,
          },
        }}
      >
        {/* Expand Icon Column */}
        <Box display="flex" justifyContent="center">
          {open ? (
            <ExpandMoreIcon fontSize="small" />
          ) : (
            <ChevronRightIcon fontSize="small" />
          )}
        </Box>

        {/* Checkbox Column */}
        <Box display="flex" justifyContent="center">
          {showCheckbox && checkboxProps && (
            <Checkbox
              {...checkboxProps}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </Box>

        {/* Label Column */}
        <Typography fontWeight={600} fontSize={14}>
          {title}
        </Typography>
      </ListItemButton>

      {/* CHILDREN */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box
          sx={{
            // ml: 2 + level * 4,
            // ml: 0 + level * 4,
            pl: 1,
            borderLeft: "1px dashed",
            borderColor: "divider",
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};
