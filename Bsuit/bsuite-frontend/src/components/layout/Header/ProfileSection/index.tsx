import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { logout, goToLogin } from "../../../../features/auth/authSlice";
import { baseApi } from "../../../../api/base.api";
import { closeSecurity } from "../../../../features/auth/authSlice";
import { useLogoutMutation } from "../../../../features/auth/api/auth.api";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import {
  Avatar,
  Box,
  Divider,
  List,
  Menu,
  Stack,
  Typography,
} from "@mui/material";
import { Logout, Person } from "@mui/icons-material";
import User1 from "../../../../assets/user1.svg";
import { resetProfileState } from "../../../../features/auth/profilePage/profileSlice";
import CompanySwitcher from "./CompanySwitcher";
import MenuItem from "./MenuItem";
import ThemeSelector from "./ThemeSelector";

interface HeaderData {
  data?: {
    companyId?: string;
    companyName?: string;
    companyLogo?: string;
    userDisplayName?: string;
    userEmail?: string;
    userProfilePic?: string;
  };
}

export default function ProfileSection({ headerData }: { headerData: HeaderData | undefined }) {
  const dispatch = useDispatch();
  const [logoutApi] = useLogoutMutation();

  const theme = useTheme();

  const navigate = useNavigate();
  const location = useLocation();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  useEffect(() => {
    const navHandler = () => setSelectedIndex(-1);
    window.addEventListener("navClicked", navHandler);
    return () => {
      window.removeEventListener("navClicked", navHandler);
    };
  }, []);
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === "/company/settings") {
      setSelectedIndex(0);
    } else if (currentPath === "/company/home") {
      setSelectedIndex(1);
    } else if (currentPath === "/profile") {
      setSelectedIndex(2);
    } else {
      setSelectedIndex(-1);
    }
  }, [location.pathname]);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleListItemClick = (index: number, route: string = "") => {
    setSelectedIndex(index);
    window.dispatchEvent(new CustomEvent("profileClicked"));
    handleClose();
    if (route) navigate(route);
  };

  return (
    <Stack direction="row" alignItems="center" gap={2} sx={{ ml: 1.5 }}>
      <Box
        onClick={handleClick}
        sx={{
          cursor: "pointer",
          "&:hover": {
            opacity: 0.8,
          },
        }}
      >
        <Avatar
          src={headerData?.data?.userProfilePic || User1}
          alt="user-avatar"
          sx={{ width:34, height: 34, bgcolor: "transparent" }}
        />
      </Box>

      <CompanySwitcher
        currentCompanyId={headerData?.data?.companyId}
        currentCompanyName={headerData?.data?.companyName}
        currentCompanyLogo={headerData?.data?.companyLogo}
      />
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 250,
              borderRadius: 2,
              boxShadow: theme.shadows[10],
              overflow: "hidden",
              background: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            },
          },
        }}
      >
        <Box sx={{ p: 1.5, pb: 1 }}>
          <Stack spacing={0.5}>
            <Stack direction="row" alignItems="center" gap={0.75}>
              <Avatar
                src={headerData?.data?.userProfilePic || User1}
                alt="user-avatar"
                sx={{ width: 28, height: 28 }}
              />
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    lineHeight: 1.2,
                  }}
                >
                  {headerData?.data?.userDisplayName || "User"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: "0.9rem",
                    lineHeight: 1.2,
                  }}
                >
                  {headerData?.data?.userEmail || ""}
                </Typography>
              </Box>
            </Stack>
            <ThemeSelector />
          </Stack>
        </Box>
        <Divider />
        <List
          component="nav"
          sx={{
            width: "100%",
            pt: 0,
            "& .MuiListItemButton-root": {
              py: 0.75,
              px: 1.5,
              minHeight: "auto",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            },
          }}
        >
          <MenuItem
            icon={<Person sx={{ fontSize: 16 }} />}
            text="My Profile"
            onClick={() => handleListItemClick(2, "/profile")}
            selected={selectedIndex === 2}
          />
          <Divider />
          <MenuItem
            icon={<Logout sx={{ fontSize: 16 }} />}
            text="Logout"
            onClick={async () => {
              setSelectedIndex(3);
              window.dispatchEvent(new CustomEvent("profileClicked"));
              handleClose();
              dispatch(resetProfileState());
              dispatch(baseApi.util.resetApiState());
              dispatch(logout());
              dispatch(goToLogin());
              dispatch(closeSecurity());
              dispatch(resetProfileState());
              const res = await logoutApi();
              if (res.data) {
                navigate("/login");
              }
            }}
            selected={selectedIndex === 3}
            color={theme.palette.error.main}
          />
        </List>
      </Menu>
    </Stack>
  );
}
