/** Shared snackbar API for attendance modals (state lives on AttendancePage) */
export type AttendanceModalSnackbarColor = "success" | "error";

export type ShowAttendanceModalSnackbar = (
  message: string,
  color: AttendanceModalSnackbarColor
) => void;
