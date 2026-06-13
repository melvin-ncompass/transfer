import { useState, useEffect, useRef } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Typography,
  Drawer,
  IconButton,
  AppBar,
  Toolbar,
} from "@mui/material";
import { ExpandLess, ExpandMore, Menu } from "@mui/icons-material";

const sidebarItems = [
  "colors",
  "typography",
  "text colors",
  "buttons",
  "labels",
  "chips",
  "snackbars",
  {
    heading: "Form Elements",
    items: [
      "text inputs",
      "text area",
      "selection controls",
      "select inputs",
      "date input",
      "month picker",
      "year picker",
      "month-year picker",
      "date-range picker",
      "time input",
      "file upload",
      "color picker",
      "repeater input",
    ],
  },
  "dialogs",
  "tables",
  "accordion",
  "slider",
  'tabs'
];

export default function StyleGuideSidebar() {
  const [openComponents, setOpenComponents] = useState(true);
  const [openFormElements, setOpenFormElements] = useState(true);
  const [active, setActive] = useState("colors");
  const [mobileOpen, setMobileOpen] = useState(false);

  const isScrollingRef = useRef(false);

  const handleClick = (id: string) => {
    isScrollingRef.current = true;
    const el = document.getElementById(id.replace(" ", "-"));
    if (!el) return;

    const onScrollEnd = () => {
      isScrollingRef.current = false;
      setActive(id.replace(" ", "-"));
      document.removeEventListener("scrollend", onScrollEnd);
    };

    document.addEventListener("scrollend", onScrollEnd);
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    // Close drawer on mobile after click
    setMobileOpen(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-15% 0px -35% 0px", threshold: [0.1, 0.3, 0.5, 0.7, 1] }
    );

    sidebarItems.forEach((item) => {
      if (typeof item === "string") {
        const el = document.getElementById(item.replace(" ", "-"));
        if (el) observer.observe(el);
      } else {
        item.items.forEach((subItem) => {
          const el = document.getElementById(subItem.replace(" ", "-"));
          if (el) observer.observe(el);
        });
      }
    });

    return () => observer.disconnect();
  }, []);

  // --- Drawer / Sidebar Content ---
  const drawerContent = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Style Guide
      </Typography>

      <List dense>
        <ListItemButton
          onClick={() => setOpenComponents(!openComponents)}
          sx={{
            alignItems: "flex-start",
            flexDirection: "row",
            justifyContent: "space-between",
            pr: 1,
          }}
        >
          <ListItemText
            primary="Components"
            slotProps={{
              primary: {
                sx: {
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  lineHeight: 1.2,
                },
              },
            }}
          />
          <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", ml: 1 }}>
            {openComponents ? <ExpandLess /> : <ExpandMore />}
          </Box>
        </ListItemButton>

        <Collapse in={openComponents}>
          <List dense component="div" disablePadding>
            {sidebarItems.map((item) => {
              if (typeof item === "string") {
                const id = item.replace(" ", "-");
                return (
                  <ListItemButton
                    key={id}
                    onClick={() => handleClick(item)}
                    sx={{
                      pl: 3,
                      py: 0.8,
                      bgcolor: active === id ? "action.selected" : "transparent",
                      borderRadius: 1,
                    }}
                  >
                    <ListItemText
                      primary={item.charAt(0).toUpperCase() + item.slice(1)}
                      slotProps={{ primary: { fontSize: 14 } }}
                    />
                  </ListItemButton>
                );
              } else {
                return (
                  <Box key={item.heading}>
                    <ListItemButton
                      onClick={() => setOpenFormElements(!openFormElements)}
                      sx={{
                        pl: 3,
                        alignItems: "flex-start",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        pr: 1,
                      }}
                    >
                      <ListItemText
                        primary={item.heading}
                        slotProps={{
                          primary: {
                            sx: {
                              fontWeight: 600,
                              fontSize: 14,
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              lineHeight: 1.2,
                            },
                          },
                        }}
                      />
                      <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", ml: 1 }}>
                        {openFormElements ? <ExpandLess /> : <ExpandMore />}
                      </Box>
                    </ListItemButton>

                    <Collapse in={openFormElements} timeout="auto" unmountOnExit>
                      {item.items.map((subItem) => {
                        const id = subItem.replace(" ", "-");
                        return (
                          <ListItemButton
                            key={id}
                            onClick={() => handleClick(subItem)}
                            sx={{
                              pl: 4,
                              py: 0.8,
                              bgcolor: active === id ? "action.selected" : "transparent",
                              borderRadius: 1,
                            }}
                          >
                            <ListItemText
                              primary={subItem.charAt(0).toUpperCase() + subItem.slice(1)}
                              slotProps={{ primary: { fontSize: 14 } }}
                            />
                          </ListItemButton>
                        );
                      })}
                    </Collapse>
                  </Box>
                );
              }
            })}
          </List>
        </Collapse>
      </List>
    </Box>
  );

  return (
    <Box
      component="aside"
      sx={{
        flexShrink: 0,
        width: { xs: 0, md: 260 },
        minWidth: { xs: 0, md: 260 },
        overflow: { xs: "hidden", md: "visible" },
        position: "relative",
      }}
    >
      {/* AppBar with hamburger only on small screens (xs, sm) */}
      <AppBar
        position="fixed"
        sx={{
          display: { xs: "flex", md: "none" },
          backgroundColor: "#fff",
          color: "#000",
          boxShadow: "0px 1px 4px rgba(0,0,0,0.1)",
        }}
      >
        <Toolbar variant="dense">
          <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 1 }}>
            <Menu />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer only on small screens (xs, sm) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: 260,
            boxSizing: "border-box",
            scrollbarWidth: "thin",
            scrollbarColor: "grey.400 transparent",
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: "grey.400",
              borderRadius: 3,
              "&:hover": { background: "grey.500" },
            },
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Fixed Sidebar visible from md (900px) and up */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          width: 260,
          minWidth: 260,
          height: "100vh",
          position: "sticky",
          top: 0,
          borderRight: "1px solid #eee",
          overflowY: "auto",
          overflowX: "hidden",
          bgcolor: "background.paper",
          // Minimal scrollbar: thin and subtle
          scrollbarWidth: "thin",
          scrollbarColor: "grey.400 transparent",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "grey.400",
            borderRadius: 3,
            "&:hover": { background: "grey.500" },
          },
        }}
      >
        {drawerContent}
      </Box>
    </Box>
  );
}
