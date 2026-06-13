import { Avatar, Box, Stack, Typography } from "@mui/material";
import CardAtom from "../../../../../components/atom/card/Card";
import { Chip } from "../../../../../components/atom/chips";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import type { ProjectEmployee } from "./ProjectDetailsSection";
import dayjs from "dayjs";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Tooltip } from "../../../../../components/atom/tooltip";

interface EmployeeCardProps {
  emp: ProjectEmployee;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, emp: ProjectEmployee) => void;
  handleViewRevisions: (emp: ProjectEmployee) => void;
}

export function EmployeeCard({ emp, onMenuOpen, handleViewRevisions }: EmployeeCardProps) {
  const fullName = [emp.employee.name, emp.employee.lastName]
    .filter(Boolean)
    .join(" ");

  const formattedDate = dayjs(emp.startDate).format("MMM DD, YYYY");

  return (
    <CardAtom
      elevation={1}
      sx={{
        p: 2,
        width: 230,
        minHeight: 195,
        borderRadius: 2.5,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "1px solid",
        borderColor: "grey.200",
        position: "relative",
        transition: "box-shadow 0.2s, transform 0.15s",
        "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          fontWeight: 600,
          color: "text.secondary",
          fontSize: "0.68rem",
          letterSpacing: 0.5,
        }}
      >
        {emp.employee.empId ?? "-"}
      </Typography>

      <PrimaryIconButton
        size="small"
        variant="outlined"
        icon={<MoreVertIcon fontSize="small" sx={{ color: "text.secondary", fontSize: "1.2rem" }} />}
        onClick={(e) => onMenuOpen(e, emp)}
        sx={{
          position: "absolute",
          top: 2,
          right: 2,
        }}
      />

      {/* Details */}
      <Box display="flex" flexDirection="column" alignItems="center" mt={2.5} gap={0.5}>
        <Avatar
          src={emp.employee.profileImage}
          sx={{
            width: 54,
            height: 54,
            bgcolor: "grey.200",
            color: "grey.600",
            fontSize: "1.4rem",
            fontWeight: 700,
          }}
        >
          {emp.employee.name?.charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="caption" fontWeight={600} textAlign="center" mt={0.5}>
          {fullName}
        </Typography>
        {emp.techStack && (
          <Typography variant="caption" color="text.secondary">
            {emp.techStack.techStackName}
          </Typography>
        )}
        {emp.tag && (
          <Typography variant="caption" color="text.secondary">
            {emp.tag.tagName}
          </Typography>
        )}
        <Chip
          label={emp.isBillable ? "Billable" : "Non-Billable"}
          size="small"
          sx={{
            mt: 0.5,
            fontSize: "0.65rem",
            height: 20,
            fontWeight: 600,
            bgcolor: emp.isBillable ? "#e3f0ff" : "#f5f5f5",
            color: emp.isBillable ? "#1565c0" : "text.secondary",
            border: "1px solid",
            borderColor: emp.isBillable ? "#90caf9" : "grey.300",
          }}
        />
        <Chip
          label={emp.isArchived ? "Archived" : "Active"}
          size="small"
          color={emp.isArchived ? "error" : "success"}
          sx={{
            mt: 0.5,
            fontSize: "0.65rem",
            height: 20,
            fontWeight: 600,
          }}
        />
      </Box>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mt={1.5}
        px={0.5}
      >
        <Stack direction="row" alignItems="center" spacing={0.4}>
          <CalendarTodayIcon sx={{ fontSize: 12, color: "text.secondary" }} />
          <Tooltip title={`Start: ${formattedDate}`}>
            <Typography variant="caption" color="text.secondary">
              {formattedDate}
            </Typography>
          </Tooltip>
        </Stack>
        <Typography
          variant="caption"
          sx={{
            color: "secondary.main",
            cursor: "pointer",
            fontWeight: 500,
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={() => handleViewRevisions(emp)}
        >
          View Revisions
        </Typography>
      </Stack>
    </CardAtom>
  );
}