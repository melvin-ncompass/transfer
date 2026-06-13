import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { ConfirmDialogProps } from "../../../types/types";
import { PrimaryButton } from "../../atom/button";

export function ConfirmDialog({
  open,
  title = "Confirm Action",
  message = "Are you sure?",
  onClose,
  onConfirm,
  confirmText = "Confirm",
  confirmColor = "primary",
  maxWidth = "xs",
  disableScrollLock = false,
  disableConfirmButton = false, 
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      maxWidth={maxWidth}
      fullWidth
      disableEscapeKeyDown={true}
      disableScrollLock={disableScrollLock}
    >
      {/* Header with title and Close icon */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "'Droid Sans', 'Helvetica Neue', sans-serif",
          pb: 1,
        }}
      >
        <Typography
          variant="h6"
          component="span"
          sx={{
            fontWeight: 600,
            fontFamily: "'Droid Sans', 'Helvetica Neue', sans-serif",
          }}
        >
          {title}
        </Typography>

        {/* Close Icon */}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[600],
            "&:hover": {
              color: "primary.main",
              backgroundColor: "transparent", // disable hover background if you want
            },
            "&:focus": {
              outline: "none", // remove extra focus outline
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Body */}
      <DialogContent
        sx={{
          fontFamily: "'Droid Sans', 'Helvetica Neue', sans-serif",
          pb: 2,
        }}
      >
        {typeof message === "string" ? (
          <Typography variant="body1">{message}</Typography>
        ) : (
          message
        )}
      </DialogContent>

      {/* Only Confirm button */}
      <DialogActions sx={{ justifyContent: "flex-end", px: 3, pb: 2 }}>
        <PrimaryButton onClick={onConfirm} variant="contained" color={confirmColor} sx={{ textTransform: 'none', }} disabled={disableConfirmButton}>
          {confirmText
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase())}
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}
