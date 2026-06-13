import { Box, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { useCompanyCrossTabSync } from "../features/company/hooks/useCompanyCrossTabSync";
import { useSessionReplacementSync } from "../features/auth/hooks/useSessionReplacementSync";
import { useOAuthReturnNotify } from "../features/auth/hooks/useOAuthReturnNotify";

function Layout() {
  const theme = useTheme();
  useCompanyCrossTabSync();
  useSessionReplacementSync();
  useOAuthReturnNotify();

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.palette.grey[100],
      }}
    >
      <Header />
      <Box
        component="main"
        sx={{
          flex: "1",
          overflow: "auto",
          padding: "8px",
        }}
      >
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}

export default Layout;
