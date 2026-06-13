import { Button, Divider, Stack, Typography, useTheme } from "@mui/material";
import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { PrimaryButton } from "../../../../components/atom/button";
import { TextFieldElement } from "../../../../components/atom/text-field";
import { useNavigate } from "react-router-dom";
import googleIcon from "../../../../assets/google-icon.png"

import { permissionApi } from "../../../../api/permission.api";
import { useLoginMutation } from "../../api/auth.api";

import {
  flipToSignup,
  goTo2FA,
  openForgot,
  openSecurity,
  setAccessToken,
  setEmail,
  setEmailError,
  setPassword,
  setPasswordError,
  setTwoFAMethods,
  showSnackbar,
  toggleShowPassword,
} from "../../authSlice";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { setSessionId } from "../../profilePage/profileSlice";
import { useSetCompanyIdMutation } from "../../../company/api/company.api";
import { notifyCompanyChanged } from "../../../company/utils/companyCrossTabSync";
import {
  notifySessionReplaced,
  OAUTH_LOGIN_PENDING_KEY,
} from "../../utils/sessionCrossTabSync";
import { baseApi } from "../../../../api/base.api";
import { emailRegex, isValidEmail } from "../../utils/EmailVerification";
import { useLazyGetEmployeeInfoQuery } from "../../../people/api/people.api";

export default function LoginForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [setCompanyId] = useSetCompanyIdMutation();

  const [login, { isLoading }] = useLoginMutation();
  const [getEmployeeInfo] = useLazyGetEmployeeInfoQuery();
  const email = useAppSelector((s) => s.auth.email);
  const password = useAppSelector((s) => s.auth.password);
  const emailError = useAppSelector((s) => s.auth.emailError);
  const passwordError = useAppSelector((s) => s.auth.passwordError);
  const showPassword = useAppSelector((s) => s.auth.showPassword);

  const theme = useTheme();
  /* ---------------- VALIDATION ---------------- */
  const validateEmail = () => {
    if (!email) {
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

    if (password.length < 8) {
      dispatch(setPasswordError("Password must be at least 8 characters long"));
      return false;
    }

    dispatch(setPasswordError(""));
    return true;
  };

  const validateForm = () => validateEmail() && validatePassword();

  /* ---------------- LOGIN HANDLER ---------------- */
  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      const res = await login({ email, password }).unwrap();
      const data = res.data;

      dispatch(setSessionId(data.sessionId));

      // ----------------- CASE 1: 2FA REQUIRED -----------------
      if (data.twoFARequired) {
        sessionStorage.setItem("temp_token", data.tempToken);
        dispatch(setAccessToken(null));
        // Save methods to redux
        dispatch(setTwoFAMethods(data.methods));

        // If ONLY "questions" is present → open the security questions screen
        if (data.methods.length === 1 && data.methods[0] === "questions") {
          dispatch(openSecurity());
        } else {
          // Multiple methods → open generic 2FA screen
          dispatch(goTo2FA());
        }
        // Clear any existing accessToken from Redux to prevent interference with 2FA verification
        // The tempToken will be used in the Authorization header instead

        dispatch(
          showSnackbar({
            message: "Two-factor authentication required",
            color: "info",
          })
        );

        return;
      }

      // ----------------- CASE 2: NORMAL LOGIN -----------------
      const { accessToken, defaultCompany } = data;
      if (!accessToken) {
        dispatch(
          showSnackbar({
            message: "No access token received",
            color: "error",
          })
        );
        return;
      }
      dispatch(setAccessToken(accessToken));
      // Invalidate cached profile data so ProtectedRoute refetches with the new token
      dispatch(baseApi.util.invalidateTags(["Profile"]));
      notifySessionReplaced(data.sessionId);

      if (defaultCompany) {
        try {
          await setCompanyId({ companyId: defaultCompany }).unwrap();
          notifyCompanyChanged(defaultCompany);

          try {
            const permissionsResponse = await dispatch(
              permissionApi.endpoints.getUserPermissions.initiate(undefined, { forceRefetch: true })
            ).unwrap();
            const employeeInfo = await getEmployeeInfo().unwrap();
            console.log(employeeInfo);

            const permissions: string[] = permissionsResponse?.data?.permissions || [];

            if (permissions.includes("view_transactions")) {
              navigate("/books/transact/home");
            } else if (permissions.includes("view_coa")) {
              navigate("/books/coa/home");
            } else if (permissions.includes("view_insights")) {
              navigate("/books/insights");
            }
            else if (employeeInfo?.data?.isEmployee === true) {
              navigate("/people/home");
            }
            else {

              navigate("/profile");
            }
          } catch (permError) {
            const employeeInfo = await getEmployeeInfo().unwrap();

            if (employeeInfo?.data?.isEmployee === true) {
              console.log(employeeInfo)
              navigate("/people/home");
            } else {
              console.error("Failed to fetch permissions:", permError);
              navigate("/profile");
            }
          }
        } catch (companyError: any) {
          console.error("Failed to set company ID:", companyError);
          // Don't fail the login if company ID setting fails
          navigate("/profile");
        }
      } else {
        navigate("/profile");
      }
      dispatch(showSnackbar({
        message: "Sign in successful!",
        color: "success",
      }));
    } catch (error: any) {
      dispatch(
        showSnackbar({
          message: error?.data?.message || "Sign in failed. Try again.",
          color: "error",
        })
      );
    }
  };


  /* ---------------- GOOGLE LOGIN ---------------- */
  const handleGoogleLogin = () => {
    try {
      sessionStorage.setItem(OAUTH_LOGIN_PENDING_KEY, "1");
    } catch {
      /* private mode */
    }
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}auth/oauth/`;
  };

  return (
    <>
      <Typography variant="h5" textAlign="center" mb={3}>
        Sign In
      </Typography>
      <Button
        fullWidth
        onClick={handleGoogleLogin}
        sx={{
          padding: theme.spacing(1, 2.5),
          backgroundColor: "white",
          borderRadius: 5,
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
          handleLogin();
        }}
      >
        <TextFieldElement
          label="Email"
          type="email"
          fullWidth
          required
          value={email}
          onChange={(e) => dispatch(setEmail(e.target.value))}
          onBlur={validateEmail}
          error={!!emailError}
          helperText={emailError}
        />

        <TextFieldElement
          label="Password"
          type={showPassword ? "text" : "password"}
          fullWidth
          required
          value={password}
          onChange={(e) => dispatch(setPassword(e.target.value))}
          onBlur={validatePassword}
          error={!!passwordError}
          helperText={passwordError}
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

        <PrimaryButton
          fullWidth
          type='submit'
          onClick={handleLogin}
          disabled={isLoading || !isValidEmail(email)}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </PrimaryButton>

        <Typography
          textAlign="center"
          sx={{
            cursor: "pointer",
            color: "#474747ff",
            fontSize: "14px",
            "&:hover": { color: "primary.main", textDecoration: "underline" },
          }}
          onClick={() => dispatch(openForgot())}
        >
          Forgot your password?
        </Typography>
        {/* Forgot Password (Redux controls UI) */}

        {/* Flip to signup */}
        <Typography
          textAlign="center"
          sx={{ fontSize: "14px", fontWeight: 500 }}
        >
          Don’t have an account?{" "}
          <Button variant="text" onClick={() => dispatch(flipToSignup())}>
            Sign Up
          </Button>
        </Typography>
      </Stack>
    </>
  );
}
