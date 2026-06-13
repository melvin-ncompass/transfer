import React, { useState } from "react";
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Typography,
} from "@mui/material";

const ProfileMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const username = sessionStorage.getItem("username") || "Guest";
  const firstLetter = username.charAt(0).toUpperCase();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <Avatar sx={{ bgcolor: "#434343", cursor: "pointer" }}>
          {firstLetter}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: "#161B22",
            color: "#fff",
            mt: 1.5,
            borderRadius: "10px",
            minWidth: 200,
          },
        }}
      >
        <MenuItem disabled>
          <Typography variant="body2">{username}</Typography>
        </MenuItem>
        <Divider sx={{ borderColor: "#30363d" }} />
        <MenuItem onClick={handleClose}>Profile</MenuItem>
        <MenuItem onClick={handleClose}>Settings</MenuItem>
        <Divider sx={{ borderColor: "#30363d" }} />
        <MenuItem
          onClick={() => {
            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("username");
            window.location.href = "/";
          }}
        >
          Sign Out
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProfileMenu;
