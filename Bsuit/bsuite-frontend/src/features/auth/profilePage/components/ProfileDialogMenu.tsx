import {
  BusinessCenter,
  BusinessRounded,
  Logout,
  Person,
} from "@mui/icons-material";
import {
  Box,
  Card,
  Divider,
  Stack,
  Typography,
  ClickAwayListener,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useLogoutMutation } from "../../api/auth.api";
import { closeSecurity, goToLogin, logout } from "../../authSlice";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { resetProfileState } from "../profileSlice";
import { baseApi } from "../../../../api/base.api";
// import { stat } from "fs";

function ProfileDialogMenu({ onClose,profileData }: { onClose: () => void, profileData: {
    displayName: string;
    email: string;
    profilePicUrl?: string;
  }; }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  // const pfp = useAppSelector((state) => state.profile);
  // const { logout } = useAuth();
  const [logoutApi] = useLogoutMutation();
  return (
    <ClickAwayListener onClickAway={onClose}>
      <Card
        sx={{
          padding: "16px",
          position: "absolute",
          width: "300px",
          top: "9vh",
          right: "15px",
          // border: `1px solid ${theme.palette.secondary.light}`,
          boxShadow: "0px 0px 2px grey",
          zIndex: 1300,
        }}
      >
        <Typography variant="h6">User Profile</Typography>
        <Stack direction={"row"} alignItems={"center"} gap={1} mt={"20px"}>
          <Box
            sx={{
              height: "75px",
              width: "75px",
              borderRadius: "50px",
               backgroundImage: profileData.profilePicUrl
      ? `url("${profileData.profilePicUrl}")`
      : "",
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
            }}
          >
            {!profileData.profilePicUrl && (
              <Person
                sx={{ fontSize: 70, color: theme.palette.secondary.main }}
              />
            )}
          </Box>
          <Stack justifyContent={"center"} height={"100%"}>
            <Typography variant="h5">{profileData.displayName}</Typography>
            <Typography fontSize={"12px"}>{profileData.email}</Typography>
          </Stack>
        </Stack>

        <Divider sx={{ my: "10px" }} />

        <Box
          component="button"
          onClick={() => {
            navigate("/company/home");
            onClose();
          }}
          sx={{
            // all: "initial",
            textAlign: "left",
            width: "100%",
            cursor: "pointer",
            display: "flex",
            gap: 1,
            alignItems: "center",
            backgroundColor: "transparent",
            border: "none",
            my: "8px",
            py: "5px",
            ":hover": {
              backgroundColor: theme.palette.grey[100],
              color: theme.palette.primary.main,
            },
          }}
        >
          <Box
            sx={{
              // padding:"4px",
              height: "40px",
              width: "40px",
              backgroundColor: theme.palette.primary.light,
              borderRadius: "4px",
              display: "flex",
              justifyContent: "center",

              alignItems: "center",
            }}
          >
            <BusinessRounded
              sx={{
                color: theme.palette.primary.main,
                height: "25px",
                width: "25px",
              }}
            />
          </Box>{" "}
          <Typography fontSize={"16px"}>Switch Company</Typography>
        </Box>
        <Box
          component="button"
          onClick={() => {
            navigate("/company/settings");
            onClose();
          }}
          sx={{
            // all: "initial",
            textAlign: "left",
            width: "100%",
            cursor: "pointer",
            display: "flex",
            gap: 1,
            alignItems: "center",
            backgroundColor: "transparent",
            border: "none",
            my: "8px",
            py: "5px",
            ":hover": {
              backgroundColor: theme.palette.grey[100],
              color: theme.palette.primary.main,
            },
          }}
        >
          <Box
            sx={{
              // padding:"4px",
              height: "40px",
              width: "40px",
              backgroundColor: theme.palette.primary.light,
              borderRadius: "4px",
              display: "flex",
              justifyContent: "center",

              alignItems: "center",
            }}
          >
            <BusinessCenter
              sx={{
                color: theme.palette.primary.main,
                height: "25px",
                width: "25px",
              }}
            />
          </Box>{" "}
          <Typography fontSize={"16px"}>Business Settings</Typography>
        </Box>
        <Box
          component="button"
          onClick={() => {
            navigate("/profile");
            onClose();
          }}
          sx={{
            // all: "initial",
            textAlign: "left",
            width: "100%",
            cursor: "pointer",
            display: "flex",
            gap: 1,
            alignItems: "center",
            backgroundColor: "transparent",
            border: "none",
            my: "8px",
            py: "5px",
            ":hover": {
              backgroundColor: theme.palette.grey[100],
              color: theme.palette.primary.main,
            },
          }}
        >
          <Box
            sx={{
              // padding:"4px",
              height: "40px",
              width: "40px",
              backgroundColor: theme.palette.primary.light,
              borderRadius: "4px",
              display: "flex",
              justifyContent: "center",

              alignItems: "center",
            }}
          >
            <Person
              sx={{
                color: theme.palette.primary.main,
                height: "25px",
                width: "25px",
              }}
            />
          </Box>{" "}
          <Typography fontSize={"16px"}>My Profile</Typography>
        </Box>

        <Box
          component="button"
          sx={{
            // all: "initial",
            textAlign: "left",
            width: "100%",
            cursor: "pointer",
            justifyContent: "center",
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: theme.palette.error.main,
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "5px",
            my: "4px",
            py: "5px",
            ":hover": {
              backgroundColor: theme.palette.error.main,
              color: "white",
            },
          }}
          onClick={async () => {
            try {
              await logoutApi();
              dispatch(resetProfileState());
              dispatch(baseApi.util.resetApiState());
            } catch (err) {
              console.error("Logout API failed:", err);
            }

            dispatch(logout());
            dispatch(closeSecurity());
            dispatch(goToLogin());

            // navigate("/login");
          }}
        >
          <Typography>Sign Out</Typography>
          <Logout />
        </Box>
      </Card>
    </ClickAwayListener>
  );
}

export default ProfileDialogMenu;
