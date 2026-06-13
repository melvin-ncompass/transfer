import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Snackbar } from "../../../components/atom/snackbar";
import { motion } from "framer-motion";
import { useConfirmResetPasswordMutation } from "../../auth/api/auth.api";
import { PrimaryButton } from "../../../components/atom/button";
import { TextFieldElement } from "../../../components/atom/text-field";
import { Box, Paper, Typography } from "@mui/material";
import { Verified } from "@mui/icons-material";
import { useAppDispatch } from "../../../store/store";
import { goToLogin } from "../authSlice";
 
export default function ConfirmResetPassword() {
  const { token } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [confirmResetPassword, { isLoading }] =
    useConfirmResetPasswordMutation();

  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
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

  const handleConfirmReset = async () => {
    const validPassword = validatePassword();
    const validRepeat = validateRepeatPassword();
    if (!validPassword || !validRepeat) return;

    try {
      const res = await confirmResetPassword({
        token: token!,  // must pass non-null
        password,
      }).unwrap();

      setSnackbar({
        open: true,
        message: res.message || "Password reset successful!",
        color: "success",
      });

      setSuccess(true);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message:
          error?.data?.message || "Password reset failed. Try again.",
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
                }}
              >
                {!success ? (
                  <>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                      Set a New Password
                    </Typography>

                    <TextFieldElement
                      label="New Password"
                      type="password"
                      fullWidth
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={validatePassword}
                      error={!!passwordError}
                      helperText={passwordError}
                    />

                    <TextFieldElement
                      label="Confirm Password"
                      type="password"
                      fullWidth
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      onBlur={validateRepeatPassword}
                      error={!!repeatPasswordError}
                      helperText={repeatPasswordError}
                      sx={{ mt: 2 }}
                    />

                    <PrimaryButton
                      variant="contained"
                      fullWidth
                      sx={{ mt: 3 }}
                      onClick={handleConfirmReset}
                      disabled={isLoading}
                    >
                      {isLoading ? "Updating..." : "Reset Password"}
                    </PrimaryButton>
                  </>
                ) : (
                  <>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      sx={{ mb: 2, color: "#1A1A1A", lineHeight: 1.5 }}
                    >
                      Your password has been reset successfully!{" "}
                      <Verified
                        style={{ color: "#4CAF50", verticalAlign: "middle" }}
                      />
                    </Typography>

                    <Typography
                      variant="body1"
                      sx={{ color: "#555", mb: 3, lineHeight: 1.6 }}
                    >
                      You can now sign in to your account and continue.
                    </Typography>

                    <PrimaryButton
                      onClick={() => {
                        dispatch(goToLogin());
                        navigate("/login");
                      }}
                      fullWidth
                    >
                      Back to Sign In
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
