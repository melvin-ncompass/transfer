import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ForgotStep = "email" | "code" | "reset";

interface SnackbarState {
  open: boolean;
  message: string | string[];
  color: "success" | "error" | "info" | "warning";
}

interface AuthUIState {
  isFlipped: boolean;
  snackbar: SnackbarState;
  twoFAMethods: [];

  step: "login" | "2fa";

  // Forgot password
  isForgotOpen: boolean;
  forgotStep: ForgotStep;
  isSecurityOpen: boolean;
  // Form fields
  email: string;
  password: string;
  showPassword: boolean;

  repeatPassword: string;
  displayName: string;
  // Errors
  emailError: string;
  passwordError: string;
  repeatPasswordError: string;
  displayNameError?:string;
  accessToken?: string | null;
  isInitializing: boolean;
}

const initialState: AuthUIState = {
  accessToken: null,
  isFlipped: false,

  snackbar: {
    open: false,
    message: "",
    color: "info",
  },

  step: "login",

  isForgotOpen: false,
  forgotStep: "email",
  isSecurityOpen: false,
  email: "",
  password: "",
  showPassword: false,
  repeatPassword: "",
  displayName: "",
  emailError: "",
  passwordError: "",
  repeatPasswordError: "",
  displayNameError: "",
  twoFAMethods: [],
  isInitializing: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /* ----------- FLIP CARD ---------------- */
    flipToSignup: (state) => {
      state.isFlipped = true;
      state.email = "";
      state.password = "";
      state.passwordError = "";
      state.emailError = "";
      state.displayNameError = "";
      state.repeatPasswordError = "";
      state.showPassword = false;
    },
    flipToLogin: (state) => {
      state.isFlipped = false;
      // state.email = "";
      state.password = "";
      state.displayName = "";
      state.repeatPassword = "";
      state.passwordError = "";
      state.emailError = "";
      state.showPassword = false;
    },

    /* ----------- SNACKBAR ----------------- */
    showSnackbar: (
      state,
      action: PayloadAction<{ message: string | string[]; color: SnackbarState["color"] }>
    ) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        color: action.payload.color,
      };
    },
    closeSnackbar: (state) => {
      state.snackbar.open = false;
    },

    /* ----------- LOGIN FLOW --------------- */
    goTo2FA: (state) => {
      state.step = "2fa";
    },
    goToLogin: (state) => {
      state.step = "login";
      state.password = "";
      state.snackbar = { open: false, message: "", color: "info" }; 
    },
    /* ----------- FORGOT PASSWORD ---------- */
    openForgot: (state) => {
      state.isForgotOpen = true;
      state.forgotStep = "email";
    },
    closeForgot: (state) => {
      state.isForgotOpen = false;
      state.forgotStep = "email";
    },
    setForgotStep: (state, action: PayloadAction<ForgotStep>) => {
      state.forgotStep = action.payload;
    },

    openSecurity: (state) => {
      state.isSecurityOpen = true;
    },
    closeSecurity: (state) => {
      state.isSecurityOpen = false;
      state.step = "login";
      state.email = "";
      state.password = "";
      state.snackbar = { open: false, message: "", color: "info" }; 
    },
    setTwoFAMethods: (state, action) => {
      state.twoFAMethods = action.payload;
    },
    setEmail: (state, action) => {
      state.email = action.payload;
    },
    setPassword: (state, action) => {
      state.password = action.payload;
    },
    setRepeatPassword: (state, action) => {
      state.repeatPassword = action.payload;
    },

    toggleShowPassword: (state) => {
      state.showPassword = !state.showPassword;
    },

    setDisplayName: (state, action) => {
      state.displayName = action.payload;
    },

    setEmailError: (state, action) => {
      state.emailError = action.payload;
    },
    setPasswordError: (state, action) => {
      state.passwordError = action.payload;
    },
    setRepeatPasswordError: (state, action) => {
      state.repeatPasswordError = action.payload;
    },
    setDisplayNameError: (state, action) => {
      state.displayNameError = action.payload;
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    finishInitialization: (state) => {
      state.isInitializing = false;
    },
    logout: (state) => {
      state.accessToken = null;
      state.email = "";
      state.password = "";
      state.snackbar = { open: false, message: "", color: "info" }; 
    },
  },
});

export const {
  flipToSignup,
  flipToLogin,
  showSnackbar,
  closeSnackbar,
  goTo2FA,
  setEmail,
  setPassword,
  setDisplayNameError,
  setEmailError,
  setPasswordError,
  setDisplayName,
  setRepeatPassword,
  setRepeatPasswordError,
  setAccessToken,
  finishInitialization,
  toggleShowPassword,
  setTwoFAMethods,
  goToLogin,
  openForgot,
  closeForgot,
  setForgotStep,
  openSecurity,
  closeSecurity,
  logout
} = authSlice.actions;

export default authSlice.reducer;
