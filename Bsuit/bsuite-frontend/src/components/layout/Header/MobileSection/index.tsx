import { useState } from "react";
import { Drawer, IconButton, useTheme } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DrawerList from "../../Drawer";

export default function MobileSection() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (event.type === "keydown" && ((event as React.KeyboardEvent).key === "Tab" || (event as React.KeyboardEvent).key === "Shift")) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={toggleDrawer(true)}
        sx={{ ml: 1 }}
      >
        <MenuIcon />
      </IconButton>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: 250,
            boxSizing: "border-box",
          },
        }}
      >
        <DrawerList closeDrawer={() => setDrawerOpen(false)} />
      </Drawer>
    </>
  );
}
