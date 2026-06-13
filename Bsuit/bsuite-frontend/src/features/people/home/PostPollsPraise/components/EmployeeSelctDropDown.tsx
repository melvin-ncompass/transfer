import {
  Avatar,
  Box,
  CircularProgress,
  Paper,
  Typography,
  ClickAwayListener,
  Portal,
} from "@mui/material";
import { getDepartmentName, getDesignationName } from "../../../org/people/directory/types/employee.types";


// ─── Types ─────────────────────────────────────────────────────────────

interface EmployeeDropdownProps {
  employees: any[];
  loading?: boolean;
  onSelect: (emp: any) => void;

  // optional
  onClose?: () => void;
  search?: string;

  // positioning
  portal?: boolean;
  position?: {
    top: number;
    left: number;
  };

  width?: number;
  maxHeight?: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function nameToHue(name: string): number {
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return Math.abs(hash) % 360;
}

// ─── Component ─────────────────────────────────────────────────────────

export default function EmployeeDropdown({
  employees,
  loading,
  onSelect,
  onClose,
  portal = false,
  position,
  width = 300,
  maxHeight = 320,
}: EmployeeDropdownProps) {
  const content = (
    <Paper
      elevation={4}
      sx={{
        position: portal ? "fixed" : "relative",
        top: portal ? position?.top : undefined,
        left: portal ? position?.left : undefined,
        zIndex: 1400,
        width,
        maxHeight,
        overflowY: "auto",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 3,
          }}
        >
          <CircularProgress size={20} />
        </Box>
      ) : employees.length === 0 ? (
        <Box
          sx={{
            py: 2.5,
            textAlign: "center",
          }}
        >
          <Typography
            variant="body2"
            color="text.disabled"
          >
            No employees found
          </Typography>
        </Box>
      ) : (
        employees.map((emp) => {
          const fullName = [
            emp.contact?.name,
            emp.contact?.middleName,
            emp.contact?.lastName,
          ]
            .filter(Boolean)
            .join(" ");

          const designation =
            getDesignationName(emp) ??
            getDepartmentName(emp);

          const hue = nameToHue(fullName);

          return (
            <Box
              key={emp.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(emp);
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.25,
                cursor: "pointer",
                transition: "background 0.15s",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  fontSize: 13,
                  fontWeight: 600,
                  bgcolor: `hsl(${hue}, 55%, 42%)`,
                  flexShrink: 0,
                }}
              >
                {getInitials(fullName)}
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  noWrap
                  sx={{
                    lineHeight: 1.3,
                  }}
                >
                  {fullName}
                </Typography>

                {designation && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{
                      lineHeight: 1.3,
                    }}
                  >
                    {designation}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })
      )}
    </Paper>
  );

  if (portal) {
    return (
      <Portal>
        {onClose ? (
          <ClickAwayListener onClickAway={onClose}>
            {content}
          </ClickAwayListener>
        ) : (
          content
        )}
      </Portal>
    );
  }

  return onClose ? (
    <ClickAwayListener onClickAway={onClose}>
      {content}
    </ClickAwayListener>
  ) : (
    content
  );
}