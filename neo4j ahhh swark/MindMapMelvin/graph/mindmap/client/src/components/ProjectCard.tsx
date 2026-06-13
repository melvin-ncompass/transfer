import { Card, Typography, IconButton, Menu, MenuItem, Box } from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import React, { useState } from "react";

interface ProjectCardProps {
  project: { id: number; projectname: string };
  onView: (id: number) => void;
  onDelete: (id: number) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onView, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card
      sx={{
        height: 180,
        width: 180,
        bgcolor: "#1f2937",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        borderRadius: "10%",
        color: "#ffffff",
        position: "relative",
      }}
    >
      <Box sx={{ position: "absolute", top: 8, right: 8 }}>
        <IconButton onClick={handleMenuClick} sx={{ color: "#fff" }}>
          <MoreVertIcon />
        </IconButton>
      </Box>

      <Typography variant="body1">{project.projectname}</Typography>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: "#161B22",
            color: "#fff",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleClose();
            onView(project.id);
          }}
        >
          View Project
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            onDelete(project.id);
          }}
        >
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default ProjectCard;
