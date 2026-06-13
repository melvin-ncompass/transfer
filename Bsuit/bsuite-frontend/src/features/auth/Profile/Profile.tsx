// material-ui
import {
  Avatar,
  Grid,
  TextField,
  Typography,
  IconButton,
  Card,
  CardHeader,
  CardContent,
  Box,
  useTheme,
} from "@mui/material";
import { PrimaryButton } from "../../../components/atom/button";
// material-ui icons
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

// project imports
import { useState, useEffect } from "react";
import { gridSpacing } from "../../../store/constant";
import { useAppSelector, useAppDispatch } from "../../../store/store";
import {
  setModalState,
  setDisplayName,
  setPrevDisplayName,
  setEdit,
  setError,
  clearError,
} from "../profilePage/profileSlice";
import { useChangeDisplayNameMutation } from "../api/profile.api";
import { Snackbar } from "../../../components/atom/snackbar";
import { SkeletonProfileInfo } from "../../../components/atom/skeleton";

// ==============================|| PROFILE 3 - PROFILE ||============================== //

export default function Profile() {
  const dispatch = useAppDispatch();
  const pfp = useAppSelector((state) => state.profile);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  // Log the accessToken present in header
  const [changeDisplayName] = useChangeDisplayNameMutation();

  // Check if data is loading (using default placeholder values)
  const isLoading =
    pfp.profile.displayName === "XXXX" || pfp.profile.email === "XXX@gmail.com";

  // Local state for inline editing
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState(
    pfp.profile.displayName
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const validate = (text: string) => {
    // rule: required length
    if (text.trim().length < 3) return "Minimum length is 3";
    if (text.trim().length > 50) return "Maximum length is 50";

    // rule: not all numbers
    if (/^\d+$/.test(text)) return "Cannot contain only numbers";

    // rule: not only symbols
    if (/^[^a-zA-Z0-9]+$/.test(text)) return "Cannot contain only symbols";

    return "";
  };
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  // Handle edit display name
  const handleEditDisplayName = () => {
    setEditingDisplayName(true);
    setTempDisplayName(pfp.profile.displayName);
    dispatch(setPrevDisplayName(pfp.profile.displayName));
  };

  // Handle save display name
  const handleSaveDisplayName = async () => {
    if (!tempDisplayName.trim()) {
      setSnackbar({
        open: true,
        message: "Display name cannot be empty",
        color: "error",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await changeDisplayName({ displayName: tempDisplayName }).unwrap();
      dispatch(setDisplayName(tempDisplayName));
      dispatch(setEdit(false));
      setEditingDisplayName(false);
      setSnackbar({
        open: true,
        message: "Display name updated successfully!",
        color: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.data?.message || "Failed to update display name",
        color: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setTempDisplayName(pfp.profile.prevDisplayName);
    setEditingDisplayName(false);
  };

  // Sync local edit state when profile display name changes (e.g., after login switch)
  useEffect(() => {
    setTempDisplayName(pfp.profile.displayName);
    setEditingDisplayName(false);
  }, [pfp.profile.displayName]);

  const theme = useTheme();

  return (
    <>
      <Grid container spacing={gridSpacing} sx={{ alignItems: "stretch" }}>
        <Grid size={{ sm: 6, md: 4 }}>
          <Card
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <CardHeader title="Profile Picture" />
            <CardContent sx={{ textAlign: "center", flex: 1 }}>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Avatar
                    alt="Profile Picture"
                    src={pfp.pfp || undefined}
                    sx={{ width: 100, height: 100, margin: "0 auto" }}
                  />
                </Grid>
                <Grid size={12}>
                  <Typography variant="subtitle2" align="center">
                    {pfp.pfp ? "Change Your Profile Image" : "Upload Your Profile Image"}
                  </Typography>
                </Grid>
                <Grid size={12}>
                  <Box display="flex" justifyContent="center" gap={2}>
                    <PrimaryButton
                      size="small"
                      onClick={() =>
                        dispatch(
                          setModalState({ modal: "pfpModal", value: true })
                        )
                      }
                    >
                      Upload
                    </PrimaryButton>
                    {pfp.pfp && (
                      <PrimaryButton
                        size="small"
                        color="error"
                        onClick={() =>
                          dispatch(
                            setModalState({ modal: "deleteModal", value: true })
                          )
                        }
                      >
                        Delete
                      </PrimaryButton>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ sm: 6, md: 8 }}>
          <Card
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <CardHeader title="Account Information" />
            <CardContent sx={{ flex: 1 }}>
              {isLoading ? (
                <SkeletonProfileInfo lines={3} />
              ) : (
                <Grid container spacing={2}>
                  {/* Display Name */}
                  <Grid size={12}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        variant="subtitle2"
                        sx={{ minWidth: "140px" }}
                      >
                        Display Name:
                      </Typography>
                      {editingDisplayName ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <TextField
                            size="small"
                            value={tempDisplayName}
                            onChange={(e) => {
                              const validationResults = validate(
                                e.target.value
                              );
                              if (validationResults != "") {
                                dispatch(setError(validationResults));
                                //   setErrorMsg(validationResults);
                              } else {
                                dispatch(clearError());
                              }

                              setTempDisplayName(e.target.value);
                            }}
                            disabled={isUpdating}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                if (
                                  !isUpdating &&
                                  tempDisplayName.trim() &&
                                  tempDisplayName.trim() !== pfp.profile.prevDisplayName.trim() &&
                                  !pfp.error.active
                                ) {
                                  handleSaveDisplayName();
                                }
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                          />

                          <IconButton
                            size="small"
                            onClick={handleSaveDisplayName}
                            disabled={
                              isUpdating ||
                              !tempDisplayName.trim() ||
                              tempDisplayName.trim() ===
                              pfp.profile.prevDisplayName.trim() ||
                              pfp.error.active
                            }
                            color="success"
                          >
                            <CheckIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                            color="error"
                          >
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={1}
                          flex={1}
                        >
                          <Typography variant="body1" sx={{ flex: 0.23 }}>
                            {pfp.profile.displayName}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={handleEditDisplayName}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* Email */}
                  <Grid size={12}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        variant="subtitle2"
                        sx={{ minWidth: "140px" }}
                      >
                        Email:
                      </Typography>
                      <Typography variant="body1">
                        {pfp.profile.email}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </>
  );
}
