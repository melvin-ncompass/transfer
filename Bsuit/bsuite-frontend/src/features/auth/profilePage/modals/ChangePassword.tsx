import {
  Box,
  Stack,
  Typography,
  LinearProgress,
  IconButton,
} from "@mui/material";
import { useState, type ChangeEvent, useEffect } from "react";
import { TextFieldElement } from "../../../../components/atom/text-field";
import { PrimaryButton } from "../../../../components/atom/button";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useChangePasswordMutation } from "../../api/auth.api";
// import { useChangePassword } from "../../api/auth.api";

function ChangePassword({
  onSave,
  onCancel,
}: {
  onSave: () => void;
  onCancel?: () => void;
}) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordApi,{isLoading}] = useChangePasswordMutation();
  const [oldVis, setOldVis] = useState(false);
  const [newVis, setNewVis] = useState(false);
  const [confVis, setConfVis] = useState(false);
  const [oldError, setOldError] = useState("");
  const [newError, setNewError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0); // 0 - 100

  // --- VALIDATION ---
  const validatePassword = (text: string): string => {
    if (!text) return "This field is required";

    if (text.length < 8) return "Minimum length is 8";
    if (text.length > 50) return "Maximum length is 50";

    if (!/[a-z]/.test(text)) return "Must contain at least 1 lowercase letter";
    if (!/[A-Z]/.test(text)) return "Must contain at least 1 uppercase letter";
    if (!/\d/.test(text)) return "Must contain at least 1 number";
    if (!/[^A-Za-z0-9]/.test(text)) return "Must contain at least 1 symbol";

    return "";
  };

  // --- PASSWORD STRENGTH CHECK ---
  const calculateStrength = (password: string): number => {
    let strength = 0;

    if (password.length >= 8) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;

    return strength; // 0–100
  };

  const getStrengthLabel = (strength: number): string => {
    if (strength === 0) return "";
    if (strength < 40) return "Weak";
    if (strength < 80) return "Moderate";
    return "Strong";
  };

  // Validate new password
  const handleNewEdit = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);

    setNewError(validatePassword(value));
    setPasswordStrength(calculateStrength(value));
  };

  // Validate confirm password
  // const handleConfirmEdit = (e: ChangeEvent<HTMLInputElement>) => {
  //   const value = e.target.value;
  //   setConfirmPassword(value);

  //   const err = validatePassword(value);
  //   setConfirmError(err);
  // };

  // Handle confirm password input (validation is debounced below)
  const handleConfirmEdit = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  // Debounced validation for confirm password (runs 300ms after user stops typing)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!confirmPassword) {
        setConfirmError("");
        return;
      }

      

      if (newPassword && confirmPassword !== newPassword) {
        setConfirmError("Passwords do not match");
        return;
      }

      setConfirmError("");
    }, 300);

    return () => clearTimeout(timeout);
  }, [confirmPassword, newPassword]);

  return (
    <Box display="flex" flexDirection="column" gap={2} alignItems="start" pb={confirmError ? 0 : 2}>
      {/* OLD PASSWORD */}
      <Stack direction={"row"} width={"100%"}>
        <TextFieldElement
          error={oldError != ""}
          helperText={oldError}
          type={oldVis ? "" : "password"}
          sx={{
            width: "100%",
          }}
          value={oldPassword}
          onChange={(e) => {
            setOldPassword(e.target.value);
            setOldError(validatePassword(e.target.value));
          }}
          fullWidth
          label="Current Password"
          required
        />
        <IconButton
          onClick={() => {
            setOldVis(!oldVis);
          }}
        >
          {!oldVis ? (
            <Visibility sx={oldError != "" ? { marginBottom: "20px" } : {}} />
          ) : (
            <VisibilityOff
              sx={oldError != "" ? { marginBottom: "20px" } : {}}
            />
          )}
        </IconButton>
      </Stack>
      {/* {oldError && <Typography color="error">{oldError}</Typography>} */}

      {/* NEW PASSWORD */}
      <Stack direction={"row"} width={"100%"}>
        <TextFieldElement
          error={newError != ""}
          helperText={newError}
          type={newVis ? "" : "password"}
          value={newPassword}
          onChange={handleNewEdit}
          fullWidth
          label="New Password"
          required
        />
        <IconButton
          onClick={() => {
            setNewVis(!newVis);
          }}
        >
          {!newVis ? (
            <Visibility sx={newError != "" ? { marginBottom: "20px" } : {}} />
          ) : (
            <VisibilityOff
              sx={newError != "" ? { marginBottom: "20px" } : {}}
            />
          )}
        </IconButton>
      </Stack>
      {/* {newError && <Typography color="error">{newError}</Typography>} */}

      {/* PASSWORD STRENGTH */}
      {newPassword && (
        <Box width="100%">
          <LinearProgress
            variant="determinate"
            value={passwordStrength}
            color={
              passwordStrength < 40
                ? "error"
                : passwordStrength < 80
                  ? "primary"
                  : "success"
            }
          />
          <Typography variant="caption">
            Strength: {getStrengthLabel(passwordStrength)}
          </Typography>
        </Box>
      )}

      {/* CONFIRM PASSWORD */}
      <Stack direction={"row"} width={"100%"} alignItems={"center"}>
        <TextFieldElement
          error={confirmError != ""}
          helperText={confirmError}
          type={confVis ? "" : "password"}
          value={confirmPassword}
          onChange={handleConfirmEdit}
          fullWidth
          label="Confirm Password"
          required
        />
        <IconButton
          onClick={() => {
            setConfVis(!confVis);
          }}
        >
          {!confVis ? (
            <Visibility
              sx={confirmError != "" ? { marginBottom: "20px" } : {}}
            />
          ) : (
            <VisibilityOff
              sx={confirmError != "" ? { marginBottom: "20px" } : {}}
            />
          )}
        </IconButton>
      </Stack>

      {/* {confirmError && <Typography color="error">{confirmError}</Typography>} */}

      {/* BUTTONS */}
      <Stack direction="row" justifyContent="end" width="100%" gap={1} alignItems={"center"}>
        {/* <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton> */}
          <Typography variant="caption">
            You will be signed out of all sessions(including current) after changing your password.
          </Typography>
        <PrimaryButton
          onClick={async () => {
            const res = await changePasswordApi({
              oldPassword: oldPassword,
              newPassword: newPassword,
            });
            
            if (res.data) {
              onSave();
            } else {
              if (res.error && "data" in res.error) {
                const errData = res.error.data as { message: string };
                setOldError(errData.message);
              } else {
                setOldError("An unknown error occurred.");
              } 
            }
          }}
          disabled={
            !!oldError ||
            !!newError ||
            !!confirmError ||
            !oldPassword ||
            !newPassword ||
            !confirmPassword
          }
        >
        {isLoading ? "Changing..." : "Change"}
        </PrimaryButton>
      </Stack>
    </Box>
  );
}

export default ChangePassword;
