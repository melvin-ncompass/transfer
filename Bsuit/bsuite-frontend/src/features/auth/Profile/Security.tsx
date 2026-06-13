// material-ui
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
// material-ui icons
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
// project imports
import AnimateButton from "../../../components/atom/animate-button/AnimateButton";
import { gridSpacing } from "../../../store/constant";
// hooks and state
import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../store/store";
import { setModalState } from "../profilePage/profileSlice";
import {
  useChangePasswordMutation,
  useSetNewPasswordMutation,
} from "../api/auth.api";
import { Snackbar } from "../../../components/atom/snackbar";
import { PrimaryButton } from "../../../components/atom/button";
import { TextFieldElement } from "../../../components/atom/text-field";
// ==============================||   PROFILE 3 - SECURITY ||============================== //
export default function Security() {
  const dispatch = useAppDispatch();
  const pfp = useAppSelector((state) => state.profile);
  const [changePassword] = useChangePasswordMutation();
  const [setPassword] = useSetNewPasswordMutation();
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  // Validation states
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });
  // Validation functions
  const validatePassword = (password: string): string => {
    if (!password) return "This field is required";
    if (password.length < 8) return "Minimum length is 8 characters";
    if (password.length > 50) return "Maximum length is 50 characters";
    if (!/[a-z]/.test(password))
      return "Must contain at least 1 lowercase letter";
    if (!/[A-Z]/.test(password))
      return "Must contain at least 1 uppercase letter";
    if (!/\d/.test(password)) return "Must contain at least 1 number";
    if (!/[^A-Za-z0-9]/.test(password)) return "Must contain at least 1 symbol";
    return "";
  };
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    return strength;
  };
  const getStrengthLabel = (strength: number): string => {
    if (strength === 0) return "";
    if (strength < 40) return "Weak";
    if (strength < 80) return "Moderate";
    return "Strong";
  };
  // Input change handlers with validation
  const handleCurrentPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setCurrentPassword(value);
    setCurrentPasswordError(validatePassword(value));
  };
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    setNewPasswordError(validatePassword(value));
    setPasswordStrength(calculatePasswordStrength(value));
  };
  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);

    if (!value) {
      setConfirmPasswordError("This field is required");
    } else {
      const passwordError = validatePassword(value);
      if (passwordError) {
        setConfirmPasswordError(passwordError);
      } else if (newPassword && value !== newPassword) {
        setConfirmPasswordError("Passwords do not match");
      } else {
        setConfirmPasswordError("");
      }
    }
  };
  const handleChangePassword = async () => {
    // Check for validation errors
    if (currentPasswordError || newPasswordError || confirmPasswordError) {
      setSnackbar({
        open: true,
        message: "Please fix the validation errors before submitting",
        color: "error",
      });
      return;
    }
    if ((!currentPassword && pfp.password)|| !newPassword || !confirmPassword) {
      setSnackbar({
        open: true,
        message: "All fields are required",
        color: "error",
      });
      return;
    }
    setIsChangingPassword(true);
    try {
      if (pfp.password) {
        await changePassword({
          oldPassword: currentPassword,
          newPassword,
        }).unwrap();
        setSnackbar({
          open: true,
          message: "Password changed successfully!",
          color: "success",
        });
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setCurrentPasswordError("");
        setNewPasswordError("");
        setConfirmPasswordError("");
        setPasswordStrength(0);
      } else {
        await setPassword({
          password: newPassword,
        }).unwrap();
        setSnackbar({
          open: true,
          message: "Password changed successfully!",
          color: "success",
        });
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setCurrentPasswordError("");
        setNewPasswordError("");
        setConfirmPasswordError("");
        setPasswordStrength(0);
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.data?.message || "Failed to change password",
        color: "error",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  const handleTwoFactorToggle = () => {
    dispatch(setModalState({ modal: "twoFAModal", value: true }));
  };
  return (
    <>
      <Grid container spacing={gridSpacing}>
        <Grid size={{ sm: 6, md: 8 }}>
          <Grid container spacing={gridSpacing}>
            <Grid size={12}>
              <Card>
                <CardHeader
                  title={pfp.password ? "Change Password" : "Set Password"}
                />
                <CardContent>
                  <Grid container spacing={gridSpacing}>
                    {pfp.password && (
                      <Grid size={12}>
                        <TextFieldElement
                          type={showCurrentPassword ? "text" : "password"}
                          fullWidth
                          label="Current password"
                          value={currentPassword}
                          onChange={handleCurrentPasswordChange}
                          error={!!currentPasswordError}
                          helperText={currentPasswordError}
                          slotProps={{
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={() =>
                                      setShowCurrentPassword(
                                        !showCurrentPassword,
                                      )
                                    }
                                    edge="end"
                                  >
                                    {showCurrentPassword ? (
                                      <VisibilityOff />
                                    ) : (
                                      <Visibility />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      </Grid>
                    )}
                    <Grid size={6}>
                      <TextFieldElement
                        type={showNewPassword ? "text" : "password"}
                        // id="outlined-basic10"
                        fullWidth
                        label="New Password"
                        value={newPassword}
                        onChange={handleNewPasswordChange}
                        error={!!newPasswordError}
                        helperText={newPasswordError}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={() =>
                                    setShowNewPassword(!showNewPassword)
                                  }
                                  edge="end"
                                >
                                  {showNewPassword ? (
                                    <VisibilityOff />
                                  ) : (
                                    <Visibility />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                      {newPassword && (
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={passwordStrength}
                            color={
                              passwordStrength < 40
                                ? "error"
                                : passwordStrength < 80
                                  ? "primary"
                                  : "success"
                            }
                          />
                          <Typography variant="caption">
                            Strength: {getStrengthLabel(passwordStrength)}
                          </Typography>
                        </Stack>
                      )}
                    </Grid>
                    <Grid size={6}>
                      <TextFieldElement
                        type={showConfirmPassword ? "text" : "password"}
                        // id="outlined-basic11"
                        fullWidth
                        label="Re-enter New Password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        error={!!confirmPasswordError}
                        helperText={confirmPasswordError}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                  }
                                  edge="end"
                                >
                                  {showConfirmPassword ? (
                                    <VisibilityOff />
                                  ) : (
                                    <Visibility />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={12}>
                      <Stack direction="row">
                        {pfp.password ? (
                          <AnimateButton>
                            <PrimaryButton
                              onClick={handleChangePassword}
                              disabled={
                                isChangingPassword ||
                                !!currentPasswordError ||
                                !!newPasswordError ||
                                !!confirmPasswordError ||
                                !currentPassword ||
                                !newPassword ||
                                !confirmPassword
                              }
                              loading={isChangingPassword}
                            >
                              {isChangingPassword
                                ? "Changing..."
                                : "Change Password"}
                            </PrimaryButton>
                          </AnimateButton>
                        ) : (
                          <AnimateButton>
                            <PrimaryButton
                              onClick={handleChangePassword}
                              disabled={
                                isChangingPassword ||
                              
                                !!newPasswordError ||
                                !!confirmPasswordError ||
                               
                                !newPassword ||
                                !confirmPassword
                              }
                              loading={isChangingPassword}
                            >
                              {isChangingPassword
                                ? "Setting..."
                                : "Set Password"}
                            </PrimaryButton>
                          </AnimateButton>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                  {pfp.password && (
                    <Grid size={12} mt={"10px"} sx={{ fontSize: "14px" }}>
                      Note : This will sign you out of all sessions
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        <Grid size={{ sm: 6, md: 4 }}>
          <Grid container spacing={gridSpacing}>
            <Grid size={12}>
              <Card>
                <CardHeader title="Two-Factor Authentication" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid size={12}>
                      <Typography variant="body1">
                        {pfp.twoFa
                          ? "Two-factor authentication is currently enabled. You can disable it if needed."
                          : "Two-factor authentication is currently disabled. Enable it to add an extra layer of security to your account."}
                      </Typography>
                    </Grid>
                    <Grid size={12}>
                      <Stack direction="row">
                        <AnimateButton>
                          <PrimaryButton
                            color={pfp.twoFa ? "error" : "primary"}
                            size="small"
                            onClick={handleTwoFactorToggle}
                          >
                            {pfp.twoFa ? "Disable 2FA" : "Enable 2FA"}
                          </PrimaryButton>
                        </AnimateButton>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
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
