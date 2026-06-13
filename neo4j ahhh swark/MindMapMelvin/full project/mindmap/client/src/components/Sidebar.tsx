import React from "react";
import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import Logo from "../assets/logo.webp";

const drawerWidth = 240;

interface SidebarProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "🚀 Onboarding Workflow", path: "/workflow" },
    { label: "Mindmaps", path: "/mindmaps" },
    { label: "Preprocess", path: "/preprocess" },
    { label: "Project Mindmap", path: "/mindmap" },
    { label: "About", path: "/about" },
    { label: "Profile", path: "/profile" },
  ];

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={() => setOpen(false)}
      sx={{
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          bgcolor: "#161B22",
          color: "#fff",
        },
      }}
    >
      {/* Logo + Close Button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 2,
          mt: 1,
        }}
      >
        <img
          src={Logo}
          alt="App Logo"
          style={{
            width: "40px",
            height: "auto",
            borderRadius: "90%",
            cursor: "pointer",
            transform: "scale(1.2)",
          }}
          onClick={() => navigate("/dashboard")}
        />

        <IconButton onClick={() => setOpen(false)} sx={{ color: "#fff" }}>
          <FaArrowLeft />
        </IconButton>
      </Box>

      {/* Menu Items */}
      <Box sx={{ mt: 2, overflow: "auto" }}>
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.label}
                onClick={() => navigate(item.path)}
                sx={{
                  borderLeft: isActive
                    ? "3px solid #fff"
                    : "3px solid transparent",
                  bgcolor: isActive ? "#1F2937" : "transparent",
                  "&:hover": {
                    bgcolor: "#1F2937",
                  },
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? "bold" : "normal",
                  }}
                  sx={{ pl: 2 }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
