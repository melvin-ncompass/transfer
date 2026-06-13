import { useState, useEffect, type ChangeEvent } from "react";
import {
  Box,
  Stack,
  TextField,
  IconButton,
  Typography,
  LinearProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { PrimaryButton } from "../../../../../components/atom/button";


function SetPassword({ onSubmit }: { onSubmit: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passVis, setPassVis] = useState(false);
  const [confirmVis, setConfirmVis] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const [strength, setStrength] = useState(0); // 0–100

  // ---------------------------------------------
  // VALIDATION
  // ---------------------------------------------
  const validatePassword = (text: string): string => {
    if (!text) return "This field is required";
    if (text.length < 8) return "Minimum length is 8";
    if (!/[A-Z]/.test(text)) return "Must contain an uppercase letter";
    if (!/[a-z]/.test(text)) return "Must contain a lowercase letter";
    if (!/\d/.test(text)) return "Must contain a number";
    if (!/[^A-Za-z0-9]/.test(text)) return "Must contain a symbol";
    return "";
  };

  const calculateStrength = (value: string): number => {
    let s = 0;
    if (value.length >= 8) s += 20;
    if (/[A-Z]/.test(value)) s += 20;
    if (/[a-z]/.test(value)) s += 20;
    if (/\d/.test(value)) s += 20;
    if (/[^A-Za-z0-9]/.test(value)) s += 20;
    return s;
  };

  const getStrengthLabel = (n: number) => {
    if (n === 0) return "";
    if (n < 40) return "Weak";
    if (n < 80) return "Moderate";
    return "Strong";
  };

  // ---------------------------------------------
  // HANDLERS
  // ---------------------------------------------
  const onPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setPassword(v);

    const err = validatePassword(v);
    setPasswordError(err);
    setStrength(calculateStrength(v));
  };

  const onConfirmChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirm(e.target.value);
  };

  // Debounced confirm validation
  useEffect(() => {
    const t = setTimeout(() => {
      if (!confirm) {
        setConfirmError("");
        return;
      }

      const err = validatePassword(confirm);
      if (err) {
        setConfirmError(err);
        return;
      }

      if (password !== confirm) {
        setConfirmError("Passwords do not match");
        return;
      }

      setConfirmError("");
    }, 300);

    return () => clearTimeout(t);
  }, [confirm, password]);

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {/* PASSWORD */}
      <Stack direction="row" width="100%">
        <TextField
          label="Password"
          type={passVis ? "text" : "password"}
          value={password}
          onChange={onPasswordChange}
          error={!!passwordError}
          helperText={passwordError}
          fullWidth
        />
        <IconButton onClick={() => setPassVis(!passVis)}>
          {passVis ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </Stack>

      {/* STRENGTH METER */}
      {password && (
        <Box>
          <LinearProgress
            variant="determinate"
            value={strength}
            color={
              strength < 40
                ? "error"
                : strength < 80
                ? "primary"
                : "success"
            }
          />
          <Typography variant="caption">
            Strength: {getStrengthLabel(strength)}
          </Typography>
        </Box>
      )}

      {/* CONFIRM PASSWORD */}
      <Stack direction="row" width="100%">
        <TextField
          label="Confirm Password"
          type={confirmVis ? "text" : "password"}
          value={confirm}
          onChange={onConfirmChange}
          error={!!confirmError}
          helperText={confirmError}
          fullWidth
        />
        <IconButton onClick={() => setConfirmVis(!confirmVis)}>
          {confirmVis ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </Stack>

      {/* SUBMIT BUTTON */}
      <PrimaryButton
        disabled={
          !password ||
          !confirm ||
          !!passwordError ||
          !!confirmError
        }
        onClick={() => onSubmit(password)}
      >
        Save Password
      </PrimaryButton>
    </Box>
  );
}

export default SetPassword;
