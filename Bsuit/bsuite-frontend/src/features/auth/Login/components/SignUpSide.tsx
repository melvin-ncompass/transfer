import {
  Paper,
  Stack,
  Typography,
  Button,
  Divider,
  Box,
  InputAdornment,
  IconButton,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { TextFieldElement } from "../../../../components/atom/text-field";
import { PrimaryButton } from "../../../../components/atom/button";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Checkbox } from "../../../../components/atom/check-box";
import  googleIcon  from "../../../../assets/google-icon.png"
import { OAUTH_LOGIN_PENDING_KEY } from "../../utils/sessionCrossTabSync";

import {
  flipToLogin,
  setDisplayName,
  setEmail,
  setDisplayNameError,
  setEmailError,
  setPassword,
  setPasswordError,
  setRepeatPassword,
  showSnackbar,
  toggleShowPassword,
  setRepeatPasswordError,
} from "../../authSlice";
import { useRegisterMutation } from "../../api/auth.api";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { emailRegex, isValidEmail } from "../../utils/EmailVerification";

export default function SignUpSide() {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const [register, { isLoading }] = useRegisterMutation();

  const email = useAppSelector((s) => s.auth.email);
  const password = useAppSelector((s) => s.auth.password);
  const emailError = useAppSelector((s) => s.auth.emailError);
  const passwordError = useAppSelector((s) => s.auth.passwordError);
  const displayNameError = useAppSelector((s) => s.auth.displayNameError);
  const repeatPasswordError = useAppSelector((s) => s.auth.repeatPasswordError);
  const showPassword = useAppSelector((s) => s.auth.showPassword);
  const displayName = useAppSelector((s) => s.auth.displayName);
  const repeatPassword = useAppSelector((s) => s.auth.repeatPassword);

  const [termsChecked, setTermsChecked] = useState(false);
  const [termsError, setTermsError] = useState("");

  const isFormInvalid =
  !displayName ||
  !email ||
  !password ||
  !repeatPassword ||
  !termsChecked;

  const validateDisplayName = () => {
    if (!displayName.trim()) {
      dispatch(setDisplayNameError("Display Name is required"));
      return false;
    }

    if (displayName.length < 3 || displayName.length > 50) {
      dispatch(
        setDisplayNameError("Display name must be between 3–50 characters")
      );
      return false;
    }

    if (/\d/.test(displayName)) {
      dispatch(setDisplayNameError("Display name must not contain numbers"));
      return false;
    }

    if (!/^[A-Za-z\s]+$/.test(displayName)) {
      dispatch(
        setDisplayNameError("Display name must contain only letters and spaces")
      );
      return false;
    }

    dispatch(setDisplayNameError(""));
    return true;
  };

  const validateEmail = () => {
    if (!email.trim()) {
      dispatch(setEmailError("Email is required"));
      return false;
    }

    if (!emailRegex.test(email)) {
      dispatch(setEmailError("Enter a valid email address"));
      return false;
    }

    dispatch(setEmailError(""));
    return true;
  };

  const validatePassword = () => {
    if (!password) {
      dispatch(setPasswordError("Password is required"));
      return false;
    }

    if (/\s/.test(password)) {
      dispatch(setPasswordError("Password cannot contain spaces"));
      return false;
    }

    // Minimum length
    if (password.length < 8) {
      dispatch(setPasswordError("Password must be at least 8 characters long"));
      return false;
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      dispatch(
        setPasswordError(
          "Password must contain at least one uppercase letter (A–Z)"
        )
      );
      return false;
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      dispatch(
        setPasswordError(
          "Password must contain at least one lowercase letter (a–z)"
        )
      );
      return false;
    }

    // At least one number
    if (!/[0-9]/.test(password)) {
      dispatch(
        setPasswordError("Password must contain at least one number (0–9)")
      );
      return false;
    }

    // At least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      dispatch(
        setPasswordError(
          "Password must contain at least one special character (!@#$%^&*)"
        )
      );
      return false;
    }

    dispatch(setPasswordError(""));
    return true;
  };

  const validateRepeatPassword = () => {
    if (!repeatPassword) {
      dispatch(setRepeatPasswordError("Please confirm your password"));
      return false;
    }

    if (password !== repeatPassword) {
      dispatch(setRepeatPasswordError("Passwords do not match"));
      return false;
    }

    dispatch(setRepeatPasswordError(""));
    return true;
  };

  const handleGoogleLogin = () => {
    try {
      sessionStorage.setItem(OAUTH_LOGIN_PENDING_KEY, "1");
    } catch {
      /* private mode */
    }
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}auth/oauth/`;
  };

  const handleSignUp = async () => {
    if (!validateAllFields()) {
      return;
    }

    try {
      await register({
        displayName,
        email,
        password,
      }).unwrap();

      dispatch(
        showSnackbar({
          message: "Account created successfully! Please check your email for verification.",
          color: "success",
        })
      );

      setTimeout(() => {
        dispatch(flipToLogin());
      }, 600);
    } catch (error: any) {
      const messages = error?.data?.message;

      dispatch(
        showSnackbar({
          message: Array.isArray(messages) ? messages : [messages],
          color: "error",
        })
      );
    }
  };

  const validateAllFields = () => {
  const isNameValid = validateDisplayName();
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();
  const isRepeatPasswordValid = validateRepeatPassword();
  const isTermsValid = validateTerms();

  return (
    isNameValid &&
    isEmailValid &&
    isPasswordValid &&
    isRepeatPasswordValid &&
    isTermsValid
  );
};

const validateTerms = () => {
  if (!termsChecked) {
    setTermsError("You must accept the Terms & Privacy Policy");
    return false;
  }

  setTermsError("");
  return true;
};


  return (
    <Paper
      elevation={4}
      sx={{
        position: "absolute",
        backfaceVisibility: "hidden",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        paddingX: 4,
        paddingY: 2,
        borderRadius: 3,
        transform: "rotateY(180deg)",
      }}
    >
      <Typography variant="h5" fontWeight={600} mb={2} textAlign="center">
        Sign Up
      </Typography>

      <Button
        fullWidth
        onClick={handleGoogleLogin}
        sx={{
          padding: theme.spacing(1, 2.5),
          backgroundColor: "white",
          borderRadius: 3,
          border: "1px solid #9fa6b2",
          "&:hover": {
            backgroundColor: "#f8f8f8ff",
          },
        }}
      >
        <img
          src={googleIcon}
          alt="google-icon"
          width={20}
          style={{ marginRight: 10 }}
        />
        Continue with Google
      </Button>

      <Divider sx={{ fontSize: "14px", margin: "14px" }}>OR</Divider>

      <Stack 
        component="form"
        spacing={1.5}
        onSubmit={(e) => {
          e.preventDefault();
          handleSignUp();
        }}
        >
        <TextFieldElement
          label="Display Name"
          type="text"
          required
          fullWidth
          error={!!displayNameError}
          value={displayName}
          helperText={displayNameError}
          onBlur={validateDisplayName}
          onChange={(e) => dispatch(setDisplayName(e.target.value))}
        />

        <TextFieldElement
          label="Email"
          type="email"
          required
          fullWidth
          error={!!emailError}
          value={email}
          helperText={emailError}
          onBlur={validateEmail}
          onChange={(e) => dispatch(setEmail(e.target.value))}
        />

        <TextFieldElement
          label="Password"
          type={showPassword ? "text" : "password"}
          fullWidth
          required
          error={!!passwordError}
          helperText={passwordError}
          onBlur={validatePassword}
          value={password}
          onChange={(e) => dispatch(setPassword(e.target.value))}
          slotProps={{
            input: {
              endAdornment: password.length > 0 && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => dispatch(toggleShowPassword())}
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
          type={showPassword ? "text" : "password"}
          fullWidth
          required
          error={!!repeatPasswordError}
          helperText={repeatPasswordError}
          onBlur={validateRepeatPassword}
          value={repeatPassword}
          disabled={!password}
          onChange={(e) => dispatch(setRepeatPassword(e.target.value))}
          slotProps={{
            input: {
              endAdornment: password.length > 0 && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => dispatch(toggleShowPassword())}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Box display="flex" alignItems="center" justifyContent="center">
          <Checkbox
            required={true}
            checked={termsChecked}
            onChange={(e: any) => {
              setTermsChecked(e.target.checked);
              if (e.target.checked) setTermsError("");
            }}
          />
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            I agree to the{" "}
            <Box
              component="span"
              sx={{
                "&:hover": {
                  color: "primary.main",
                  textDecoration: "underline",
                  cursor: "pointer",
                },
              }}
            >
              Terms & Privacy Policy
            </Box>
          </Typography>
        </Box>

        {termsError && (
          <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>
            {termsError}
          </Typography>
        )}

        <PrimaryButton
          fullWidth
          type='submit'
          onClick={handleSignUp}
          disabled={isLoading || isFormInvalid || !isValidEmail(email) || password !== repeatPassword}
        >
          {isLoading ? "Signing Up..." : "Sign Up"}
        </PrimaryButton>

        <Typography textAlign="center" sx={{ fontSize: 14, fontWeight: 500 }}>
          Already have an account?{" "}
          <Button variant="text" onClick={() => dispatch(flipToLogin())}>
            Sign In
          </Button>
        </Typography>
      </Stack>
    </Paper>
  );
}
