import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { PrimaryButton } from "../../../../../../components/atom/button";

export function SkipEmployeeModal({
  open,
  onClose,
  onConfirm,
  isSubmitting,
  employeeNames,
  payPeriodRange,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting: boolean;
  employeeNames: string[];
  payPeriodRange?: string;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason("");
      setTouched(false);
    }
  }, [open]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleConfirm = () => {
    setTouched(true);
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  const isReasonEmpty = !reason.trim();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Skip Employee?
        </Typography>
        <IconButton size="small" onClick={handleClose} disabled={isSubmitting}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Warning alert */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            bgcolor: "#fff0f3",
            border: "1px solid #f5c6cb",
            borderRadius: 1.5,
            p: 1.5,
            mb: 2.5,
          }}
        >
          <ErrorOutlineIcon sx={{ color: "error.main", fontSize: 20, mt: 0.1 }} />
          <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
            Once you skip an employee(s) from the pay run, you will not be able
            to pay them later for this pay cycle.
          </Typography>
        </Box>

        {/* Employee + Period info */}
        <Box display="flex" gap={3} mb={2.5}>
          <Box
            sx={{
              borderLeft: "3px solid",
              borderColor: "warning.main",
              pl: 1.5,
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              Employee
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {employeeNames.join(", ")}
            </Typography>
          </Box>
          </Box> 
        <Box display="flex" gap={3} mb={2.5}>    
          {payPeriodRange && (
            <Box
              sx={{
                borderLeft: "3px solid",
                borderColor: "warning.main",
                pl: 1.5,
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Payroll Period
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {payPeriodRange}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Reason field */}
        <Typography variant="body2" mb={1}>
          Please enter a reason?{" "}
          <Typography component="span" color="error" variant="body2">
            *
          </Typography>
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          error={touched && isReasonEmpty}
          helperText={touched && isReasonEmpty ? "Reason is required." : undefined}
          inputProps={{ maxLength: 500 }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <PrimaryButton
          variant="contained"
          onClick={handleConfirm}
          disabled={isSubmitting}
          size="small"
        >
          {isSubmitting ? "Skipping..." : "Yes"}
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}
