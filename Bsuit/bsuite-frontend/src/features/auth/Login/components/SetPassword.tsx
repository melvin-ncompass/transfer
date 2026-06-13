import { useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { Snackbar } from "../../../../components/atom/snackbar";
import { motion } from "framer-motion";
import { useSetPasswordMutation } from "../../api/auth.api";
import { PrimaryButton } from "../../../../components/atom/button";
import { TextFieldElement } from "../../../../components/atom/text-field";
import { Box, Paper, Typography, useTheme, IconButton, InputAdornment } from "@mui/material";
import { Verified, Visibility, VisibilityOff } from "@mui/icons-material";


export default function SetPassword() {
  const { token } = useParams();
  const [setPassword, { isLoading }] = useSetPasswordMutation();
  const theme = useTheme();

  const [password, setPasswordValue] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [repeatPasswordError, setRepeatPasswordError] = useState("");
  const [success, setSuccess] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "info" as "success" | "error" | "info" | "warning",
  });

  const validatePassword = () => {
    const regex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!password) {
      setPasswordError("Password is required");
      return false;
    } else if (!regex.test(password)) {
      setPasswordError(
        "Must be 8+ chars, 1 uppercase, 1 number, and 1 special character."
      );
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateRepeatPassword = () => {
    if (!repeatPassword) {
      setRepeatPasswordError("Please confirm your password");
      return false;
    } else if (repeatPassword !== password) {
      setRepeatPasswordError("Passwords do not match");
      return false;
    }
    setRepeatPasswordError("");
    return true;
  };

  const handleSetPassword = async () => {
    const validPassword = validatePassword();
    const validRepeat = validateRepeatPassword();
    if (!validPassword || !validRepeat) return;

    if (!token) {
      setSnackbar({
        open: true,
        message: "Invalid or missing token.",
        color: "error",
      });
      return;
    }

    try {
      const res = await setPassword({
        token,
        password,
        confirmPassword: repeatPassword,
      }).unwrap();

      setSnackbar({
        open: true,
        message: res.message || "Password set successfully!",
        color: "success",
      });
      setSuccess(true);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message:
          error?.data?.message || "Failed to set password. Try again.",
        color: "error",
      });
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", height: "100vh" }}>
        {/* LEFT SIDE */}
        <Box
          sx={{
            width: { xs: "0%", sm: "40%", md: "60%" },
            display: { xs: "none", sm: "flex" },
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            textAlign: "center",
            p: 4,
            backgroundColor: "#eeededff",
            boxShadow: "inset 0 5px 70px #0000001a",
            overflowY: "auto",
          }}
        >
          <motion.div
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <Typography variant="h3" color="primary.main">
              Welcome to BSuite
            </Typography>

            {/* <Typography
              variant="h6"
              color="primary.main"
              sx={{
                mt: 2,
                maxWidth: 700,
                whiteSpace: "pre-wrap",
                overflow: "hidden",
                display: { xs: "none", sm: "none", md: "block" },
              }}
            >
              &nbsp; A single place where you can handle all your accounting
              business stuff and human resource management.
            </Typography> */}
          </motion.div>
        </Box>

        {/* RIGHT SIDE */}
        <Box
          sx={{
            width: { xs: "100%", sm: "60%", md: "40%" },
            display: "flex",
            justifyContent: "center",
            overflowY: "hidden",
            mt: 1,
          }}
        >
          <div style={{ perspective: "1000px", width: "100%", maxWidth: 420 }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Paper
                elevation={4}
                sx={{
                  position: "absolute",
                  width: "100%",
                  padding: 4,
                  borderRadius: 3,
                  backfaceVisibility: "hidden",
                  overflow: "hidden",
                  minHeight: 340,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {success ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      minHeight: 260,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2,
                        width: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1.5,
                          width: "100%",
                        }}
                      >
                        <Typography
                          variant="h5"
                          color="primary.main"
                          sx={{ fontWeight: 700, textAlign: "center" }}
                        >
                          Password Set Successfully!
                        </Typography>
                        <Verified
                          sx={{
                            color: theme.palette.success.main,
                            fontSize: 26,
                            ml: 0.5,
                            verticalAlign: "middle",
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body1" sx={{ color: "text.secondary", mb: 3, textAlign: "center" }}>
                      Your password has been updated. You can now log in with your credentials.
                    </Typography>
                    <RouterLink to="/login" style={{ textDecoration: "none", width: "100%" }}>
                      <PrimaryButton
                        variant="contained"
                        fullWidth
                      >
                        Back to Sign In
                      </PrimaryButton>
                    </RouterLink>
                  </Box>
                ) : (
                  <>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                      Set a New Password
                    </Typography>

                    <TextFieldElement
                      label="New Password"
                      type={showPassword ? "text" : "password"}
                      fullWidth
                      value={password}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      onBlur={validatePassword}
                      error={!!passwordError}
                      helperText={passwordError}
                      slotProps={{
                        input: {
                          endAdornment: password.length > 0 && (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword((v) => !v)}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />

                    <TextFieldElement
                      label="Confirm Password"
                      type={showRepeatPassword ? "text" : "password"}
                      fullWidth
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      onBlur={validateRepeatPassword}
                      error={!!repeatPasswordError}
                      helperText={repeatPasswordError}
                      sx={{ mt: 2 }}
                      slotProps={{
                        input: {
                          endAdornment: repeatPassword.length > 0 && (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowRepeatPassword((v) => !v)}
                                edge="end"
                              >
                                {showRepeatPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />

                    <PrimaryButton
                      variant="contained"
                      fullWidth
                      sx={{ mt: 3 }}
                      onClick={handleSetPassword}
                      disabled={isLoading}
                    >
                      {isLoading ? "Setting..." : "Set Password"}
                    </PrimaryButton>
                  </>
                )}
              </Paper>
            </div>
          </div>
        </Box>
      </Box>

      {/* Snackbar */}
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          autoClose={3000}
        />
      )}
    </>
  );
}
