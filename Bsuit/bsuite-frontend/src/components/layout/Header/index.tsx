import {
  Box,
  AppBar,
  Toolbar,
  Stack,
  useTheme,
  useMediaQuery,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import ProfileSection from "./ProfileSection";
import NotificationSection from "./NotificationSection";
import MobileSection from "./MobileSection";
import FullScreenSection from "./FullScreenSection";
import NavigationSection from "./NavigationSection";
import AppLauncher from "./AppLauncherSection";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";
import { useGetHeaderDataQuery } from "../../../features/company/api/company.api";
import { useMemo } from "react";
import Logo from "./Logo";

export default function Header({ onSidebarToggle }: { onSidebarToggle?: () => void }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const { data: headerData } = useGetHeaderDataQuery(undefined, {
    skip: !accessToken,
  });

  // Detect current app context
  const currentUrl = location.pathname.toLowerCase();
  const isPeople = currentUrl.includes("/people");
  const currentApp = useMemo(() => {
    if (
      currentUrl.startsWith("/books") ||
      currentUrl.startsWith("/company") ||
      currentUrl.startsWith("/profile")
    ) {
      return "books";
    } else if (currentUrl.startsWith("/people")) {
      return "people";
    }
    return null;
  }, [currentUrl]);

  const currentAppLabel = currentApp === "books" ? "Books" : currentApp === "people" ? "People" : "";

  const hasCompany = Boolean(headerData?.data?.companyId);
console.log(hasCompany)
  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
          zIndex: 1200,
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 1, },
            height: "56px",
          }}
        >
          {/* --- Left Section: Logo + App Name --- */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            {isMobile && !(window.location.pathname.includes("/profile")||window.location.pathname.includes("/company"))  && <MobileSection />}

            <Box
              onClick={() => navigate("/profile")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
              }}
            >
              {/* Logo */}
              <Logo width={32} height={32} />
              {/* Brand + App name */}
              {/* <Typography
                sx={{
                  fontSize: { xs: "17px", sm: "18px", md: "20px" },
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                }}
              >
                BSuite
                {currentAppLabel && (
                  <Typography
                    component="span"
                    variant="subtitle2"
                    sx={{
                      ml: 1,
                      color: theme.palette.text.primary,
                    }}
                  >
                    — {currentAppLabel}
                  </Typography>
                )}
              </Typography> */}
            {window.location.pathname.includes("/profile") ?  <Typography
                sx={{
                  fontSize: { xs: "17px", sm: "18px", md: "20px" },
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                }}
              >
                BSuite
              </Typography>:<Typography
                sx={{
                  fontSize: { xs: "17px", sm: "18px", md: "20px" },
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                }}
              >
                {currentAppLabel}
              </Typography>}
            </Box>
          </Stack>

          {/* Navigation Menu (conditionally hidden) */}
          {!isPeople && <NavigationSection />}

          <Box sx={{ flexGrow: 1 }} />

          <NotificationSection />

          {!isMobile && (
            <Box sx={{ display: { xs: "none", lg: "block" } }}>
              <FullScreenSection />
            </Box>
          )}

          {/* Pass current app down */}
          {hasCompany && <AppLauncher currentApp={currentApp} />}

          <ProfileSection headerData={headerData} />
        </Toolbar>
      </AppBar>

      {/* AppBar Spacer */}
      <Box sx={{ height: "56px" }} />
    </>
  );
}
