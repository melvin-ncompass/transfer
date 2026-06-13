import React from "react";
import { Dialog, CircularProgress, Typography } from "@mui/material";

interface LoadingDialogProps {
  open: boolean;
  message?: string;
}

const LoadingDialog: React.FC<LoadingDialogProps> = ({ open, message }) => {
  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          borderRadius: 2,
        },
      }}
    >
      <CircularProgress />
      <Typography variant="body2">{message || "Loading..."}</Typography>
    </Dialog>
  );
};

export default LoadingDialog;
