import { Stack, Typography, Button } from "@mui/material";
import { TextFieldElement } from "../../../../components/atom/text-field";
import { PrimaryButton } from "../../../../components/atom/button";
import { useState } from "react";

import {
  closeForgot,
  setForgotStep,
  showSnackbar,
} from "../../authSlice";

import {
  useSendResetEmailMutation,
} from "../../api/auth.api";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { Verified } from "@mui/icons-material";
import { isValidEmail } from "../../utils/EmailVerification";

export default function ForgotPassword() {
  const dispatch = useAppDispatch();
  const forgotStep = useAppSelector((state) => state.auth.forgotStep);

  // --- RTK Query hooks ---
  const [sendResetEmail, { isLoading: emailLoading }] =
    useSendResetEmailMutation();

  // Local form states
  const [email, setEmail] = useState("");

  /* ---------------- Step 1: Email ---------------- */
  const handleVerifyEmail = async () => {
    if (!email) {
      dispatch(showSnackbar({ message: "Please enter an email", color: "error" }));
      return;
    }

    try {
      await sendResetEmail({ email }).unwrap();

      dispatch(
        showSnackbar({
          message: "Verification email sent!",
          color: "success",
        })
      );

      dispatch(setForgotStep("code"));
    } catch (error: any) {
      dispatch(
        showSnackbar({
          message: error?.data?.message || "Failed to send email",
          color: "error",
        })
      );
    }
  };

  /* ---------------- Step Components ---------------- */

  const renderEmailStep = () => (
    <Stack 
      component="form"
      spacing={1.5}
      onSubmit={(e) => {
        e.preventDefault();
        handleVerifyEmail();
      }}
    >
      <Typography variant="h6" textAlign="center">
        Reset Password
      </Typography>

      <TextFieldElement
        label="Enter your email"
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <PrimaryButton 
        fullWidth
        type='submit'
        onClick={handleVerifyEmail}
        disabled={emailLoading || !isValidEmail(email)}
      >
        {emailLoading ? "Sending..." : "Verify Email"}
      </PrimaryButton>

      <Button variant="text" onClick={() => dispatch(closeForgot())}>
        Back to Sign in
      </Button>
    </Stack>
  );

  const renderCodeStep = () => (
    <Stack spacing={1.5}>
      <div
        style={{
          textAlign: "center",
          width:"350px"
        }}
      >
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{ mb: 2, color: "#1A1A1A", lineHeight: 1.5 }}
        >
          Your Email has been sent successfully!{" "}
          <Verified style={{ color: "#4CAF50", verticalAlign: "middle" }} />
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "#555", mb: 1, lineHeight: 1.6 }}
        >
          Please click the reset password link in your mail.
        </Typography>
      <Button variant="text" onClick={() => dispatch(closeForgot())}>
        Back to Sign in
      </Button>
      </div>
    </Stack>
  );



  /* ---------------- Switch View ---------------- */
  if (forgotStep === "email") return renderEmailStep();
  if (forgotStep === "code") return renderCodeStep();

  return null;
}
