import { Box, Button, Stack, Typography } from "@mui/material";
import { PrimaryButton } from "../../../../components/atom/button";
import { useState } from "react";
import { goToLogin, openSecurity, setAccessToken, showSnackbar } from "../../authSlice";

import { useVerifyTwoFAMutation } from "../../api/auth.api";
import { useAppDispatch } from "../../../../store/store";
import { useNavigate } from "react-router-dom";
import { baseApi } from "../../../../api/base.api";
import { setSessionId } from "../../profilePage/profileSlice";
import { notifySessionReplaced } from "../../utils/sessionCrossTabSync";

export default function TwoFA() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [verifyTwoFA, { isLoading }] = useVerifyTwoFAMutation();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");

  const handleOtpChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpVerify = async () => {
  const code = otp.join("");

  if (code.length !== 6) {
    setOtpError("Please enter a valid 6-digit code");
    return;
  }

  setOtpError("");

  try {
    const tempToken = sessionStorage.getItem("temp_token");

    if (!tempToken) {
      dispatch(
        showSnackbar({
          message: "Missing temporary token. Please sign in again.",
          color: "error",
        })
      );
      dispatch(goToLogin());
      return;
    }

    const res = await verifyTwoFA({
      tempToken,
      method: "google",
      code: Number(code),
    }).unwrap();

    // Backend returns final tokens:
    const { accessToken, sessionId } = res.data as {
      accessToken?: string;
      sessionId?: string;
    };

    if (!accessToken) {
      dispatch(
        showSnackbar({
          message: "Verification failed — no token received",
          color: "error",
        })
      );
      return;
    }

    dispatch(setAccessToken(accessToken));
    if (sessionId) {
      dispatch(setSessionId(sessionId));
    }
    // Invalidate cached profile data so ProtectedRoute refetches with the new token
    dispatch(baseApi.util.invalidateTags(["Profile"]));
    notifySessionReplaced(sessionId);
    // dispatch(goToLogin()); // Reset step to "login" for next time

    dispatch(
      showSnackbar({
        message: "Two-factor verification successful!",
        color: "success",
      })
    );

    // redirect
    navigate("/profile");

  } catch (error: any) {
    dispatch(
      showSnackbar({
        message: error?.data?.message || "Invalid OTP. Try again.",
        color: "error",
      })
    );
  }
};


  return (
    <Stack spacing={2}>
      <Typography variant="h6" textAlign="center">
        Two-Factor Authentication
      </Typography>

      <Typography variant="body2" textAlign="center">
        Enter the 6-digit code from your authenticator.
      </Typography>

      <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mt: 1 }}>
        {otp.map((digit, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(e.target.value, i)}
            onKeyDown={(e) => handleOtpKeyDown(e, i)}
            style={{
              width: "42px",
              height: "50px",
              textAlign: "center",
              fontSize: "20px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              outline: "none",
            }}
          />
        ))}
      </Box>

      {otpError && (
        <Typography
          variant="body2"
          color="error"
          textAlign="center"
          sx={{ mt: 1 }}
        >
          {otpError}
        </Typography>
      )}

      <PrimaryButton
        fullWidth
        variant="contained"
        onClick={handleOtpVerify}
        disabled={isLoading}
      >
        {isLoading ? "Verifying..." : "Verify"}
      </PrimaryButton>

      <Typography
        role="button"
        tabIndex={0}
        textAlign="center"
        sx={{
          cursor: "pointer",
          color: "#474747ff",
          fontSize: "14px",
          "&:hover": { color: "primary.main", textDecoration: "underline" },
        }}
        onClick={() => dispatch(openSecurity())}
      >
        Problems with 2FA? 
      </Typography>

      <Button variant="text" onClick={() => dispatch(goToLogin())}>
        Back to Sign in
      </Button>
    </Stack>
  );
}
