import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Snackbar } from "../../../../components/atom/snackbar";
import { motion } from "framer-motion";
import { useTwoFaRecoverySetPasswordMutation } from "../../api/auth.api";
import { PrimaryButton } from "../../../../components/atom/button";
import { TextFieldElement } from "../../../../components/atom/text-field";
import { Box, Paper, Typography, useTheme, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";


export default function TwoFARecovery() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [setPassword, { isLoading }] = useTwoFaRecoverySetPasswordMutation();
  const theme = useTheme();

  const [password, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

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

  const handleSetPassword = async () => {
    const validPassword = validatePassword();
    if (!validPassword) return;

    if (!token) {
      setSnackbar({
        open: true,
        message: "Invalid or missing token.",
        color: "error",
      });
      return;
    }

    try {
        await setPassword({ token, password }).unwrap();
        navigate("/profile");
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
                <>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    Enter your password
                  </Typography>

                  <TextFieldElement
                    label="Password"
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

                  <PrimaryButton
                    variant="contained"
                    fullWidth
                    sx={{ mt: 3 }}
                    onClick={handleSetPassword}
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </PrimaryButton>
                </>
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
