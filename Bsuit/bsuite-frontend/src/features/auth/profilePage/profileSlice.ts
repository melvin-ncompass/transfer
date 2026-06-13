import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import rows from "./static/sessions.json";
const initialState = {
  
  pfp: "",
  twoFa: false,
  sessionsTable: false,
  sessionId: "",
  modals: {
    successEdit: false,
    pfpUpdate: false,
    pfpRemove: false,
    passwordChanged: false,
    twofactorEnabled: false,
    twofactorDisabled: false,
    sessionDeleted: false,
    logoutAllModal: false,
    pfpModal: false,
    deleteModal: false,
    changePasswordModal: false,
    twoFAModal: false,
  },
  twoFASlide: 0,
  profile: {
    displayName: "XXXX",
    email: "XXX@gmail.com",
    prevDisplayName: "XXXX",
    edit: false,
  },
  error: {
    active: false,
    message: "",
  },
  sessions: [...rows],
  password:true,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setPfp: (state, action) => {
      state.pfp = action.payload;
    },
    setModalState: (
      state,
      action: PayloadAction<{
        modal: keyof typeof initialState.modals;
        value: boolean;
      }>
    ) => {
      const { modal, value } = action.payload;
      state.modals[modal] = value;
    },
    setSessionsTable: (state, action) => {
      state.sessionsTable = action.payload;
    },
    setDisplayName: (state, action) => {
      state.profile.displayName = action.payload;
    },
    setProfileEmail: (state, action) => {
      state.profile.email = action.payload;
    },
    setTwoFA: (state, action) => {
      state.twoFa = action.payload;
    },
    setTwoFASlide: (state, action) => {
      state.twoFASlide = action.payload;
    },
    setPrevDisplayName: (state, action) => {
      state.profile.prevDisplayName = action.payload;
    },
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
    setEdit: (state, action) => {
      state.profile.edit = action.payload;
    },
    setError: (state, action) => {
      state.error.active = true;
      state.error.message = action.payload;
    },
    clearError: (state) => {
      state.error.active = false;
      state.error.message = "";
    },
    setSessions: (state, action) => {
      state.sessions = action.payload;
    },
    setPasswordProp: (state,action) => {
      state.password = action.payload;
    },
    resetProfileState: () => initialState,
  },
});

export const {
  setPfp,
  setPasswordProp,
  setModalState,
  setDisplayName,
  setProfileEmail,
  setPrevDisplayName,
  setEdit,
  setError,
  clearError,
  setTwoFA,
  setTwoFASlide,
  setSessions,
  setSessionsTable,
  setSessionId,
  resetProfileState
} = profileSlice.actions;

export default profileSlice.reducer;
