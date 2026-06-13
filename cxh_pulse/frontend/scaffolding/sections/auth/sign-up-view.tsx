import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import { LinearProgress, useTheme, Stack } from '@mui/material';

import { useSignupMutation } from '../../../src/api';

import { Iconify } from '../../../src/components/iconify';
import { PrimaryButton } from '../../../src/components/buttons';
import { ProgressSnackbar } from '../../../src/components/snackbar';


import zxcvbn from 'zxcvbn';
import { RouterLink } from '@/routes/components';

// ----------------------------------------------------------------------

export function SignUpView() {
  const theme = useTheme();
  const [signup] = useSignupMutation();

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    invalidEmail: '',
    name: '',
    phone: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'success' | 'error',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lengthValue, setLengthValue] = useState('');
  const maxLength = 50;
  const isLimitError = lengthValue.length + 1 > maxLength;
  const [showHelper, setShowHelper] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordStrength, setNewPasswordStrength] = useState<any>({});
  const [confirmPasswordStrength, setConfirmPasswordStrength] = useState<any>({});

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  // name validation check 
  const isNameValid = formData.name.trim().length > 0;


  const strengthLabels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }));
  }, []);

  //name specific to track count
  const handleInputNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (value.length > 0) {
      setShowHelper(true);
    } else {
      setShowHelper(false);
    }
    setLengthValue(e.target.value);
  };

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const trimmedValue = e.target.value.trim();
    setFormData({
      ...formData,
      name: trimmedValue,
    });
    setLengthValue(trimmedValue);
    if (trimmedValue.length > 0) {
      setShowHelper(true);
    } else {
      setShowHelper(false);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'phone') {
      value = value.replace(/[^0-9]/g, '');
    }
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const trimmedValue = e.target.value.trim();
    setFormData({
      ...formData,
      email: trimmedValue,
    });
  };

  const getStrengthColor = (score: number) => {
    const colors = ['error.main', 'error.main', 'warning.main', 'info.main', 'success.main'];
    return colors[score];
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const resetErrors = () => {
    setErrors({
      email: '',
      invalidEmail: '',
      name: '',
      phone: '',
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();
    if (!formData.email) {
      setErrors((prev) => ({
        ...prev,
        email: 'Email is required',
      }));
    }

    if (!formData.name) {
      setErrors((prev) => ({
        ...prev,
        name: 'Name is required',
      }));
    }

    // if (!formData.phone) {
    //   setErrors((prev) => ({
    //     ...prev,
    //     phone: 'Phone number is required',
    //   }));
    // }

    if (!validateEmail(formData.email)) {
      setErrors((prev) => ({
        ...prev,
        invalidEmail: 'Invalid email format',
      }));
    }

    if (!formData.email || !formData.name || !formData.password) {
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
      }).unwrap();

      // Show success message
      setSnackbar({
        open: true,
        message: 'Your request has been submitted successfully',
        severity: 'success',
      });

      // Reset form
      setFormData({
        email: '',
        name: '',
        phone: '',
        password: '',
      });
      setNewPassword('');
      setConfirmPassword('');
      setLengthValue('');
      setShowHelper(false);
      setNewPasswordStrength({ score: 0, feedback: {} });
      setConfirmPasswordStrength({ score: 0, feedback: {} });
      resetErrors();
    } catch (error) {
      const errorMsg = (error as any).response?.data?.message || (error as any).data?.message || '';
      setSnackbar({
        open: true,
        message: `Registration failed. ${errorMsg || 'Please contact support.'}`,
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisablePasswordButton = () => {
    if (!newPassword || !confirmPassword) {
      return true;
    }

    if (newPassword !== confirmPassword) {
      return true;
    }
    return false;
  };

  const handleNewPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value.replace(/\s/g, '');
    const name = e.target.name;

    setNewPassword(value);
    setFormData({ ...formData, [name]: value });

    if (value) {
      const result = zxcvbn(value);
      setNewPasswordStrength(result);
    } else {
      setNewPasswordStrength({ score: 0, feedback: {} });
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value.replace(/\s/g, '');
    setConfirmPassword(value);

    if (value) {
      const result = zxcvbn(value);
      setConfirmPasswordStrength(result);
    } else {
      setConfirmPasswordStrength({ score: 0, feedback: {} });
    }
  };


  const renderForm = (
    <form onSubmit={handleSignIn}>
      {/* Name Field */}
      <TextField
        fullWidth
        name="name"
        label="Name*"
        value={formData.name}
        onChange={handleInputNameChange}
        onBlur={handleNameBlur}
        error={isLimitError}
        helperText={
          showHelper
            ? isLimitError
              ? `Input cannot exceed ${maxLength} characters`
              : `${lengthValue.length}/${maxLength} characters`
            : ''
        }
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { maxLength },
        }}
      />

      {/* Email Field */}
      <TextField
        fullWidth
        name="email"
        label="Email address*"
        autoComplete='new-email'
        value={formData.email}
        onChange={handleInputChange}
        onBlur={handleEmailBlur}
        error={!!errors.email || !!errors.invalidEmail}
        helperText={errors.email || errors.invalidEmail}
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { maxLength }
        }}
      />

      {/* Phone Field
      <TextField
        type='tel'
        fullWidth
        name="phone"
        label="Phone number"
        value={formData.phone}
        onChange={handleInputChange}
        error={!!errors.phone}
        helperText={errors.phone}
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { maxLength }
        }}
      /> */}

      {/* New Password Field */}
      <TextField
        label="New Password"
        type={showNewPassword ? 'text' : 'password'}
        fullWidth
        name="password"
        autoComplete='new-password'
        value={newPassword}
        required
        onKeyDown={(e) => {
          if (e.key === ' ') {
            e.preventDefault();
          }
        }}
        onChange={handleNewPasswordChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="solar:shield-keyhole-bold-duotone" width={24} color="text.secondary" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                <Iconify
                  icon={showNewPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                  width={20}
                />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
        slotProps={{ htmlInput: { maxLength } }}
      />

      {/* Password Strength Indicator */}
      {newPassword && (
        <>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              Password Strength
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: getStrengthColor(newPasswordStrength.score),
              }}
            >
              {strengthLabels[newPasswordStrength.score]}
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={(newPasswordStrength.score + 1) * 20}
            sx={{
              height: 6,
              borderRadius: 1,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                bgcolor: getStrengthColor(newPasswordStrength.score),
                borderRadius: 1,
              },
              mb: 1,
            }}
          />

          {newPasswordStrength.feedback?.warning && (
            <Typography variant="caption" color="warning.main" display="block" sx={{ mb: 0.5 }}>
              {newPasswordStrength.feedback.warning}
            </Typography>
          )}
          {newPasswordStrength.feedback?.suggestions?.length > 0 && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              {newPasswordStrength.feedback.suggestions[0]}
            </Typography>
          )}
          {newPassword.length > 49 && (
            <Typography variant="caption" color="error" display="block" sx={{ mb: 1 }}>
              Max limit: {maxLength}
            </Typography>
          )}
        </>
      )}

      {/* Confirm Password Field */}
      <TextField
        label="Confirm Password"
        type={showConfirmPassword ? 'text' : 'password'}
        fullWidth
        value={confirmPassword}
        onKeyDown={(e) => {
          if (e.key === ' ') {
            e.preventDefault();
          }
        }}
        onChange={handleConfirmPasswordChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="solar:shield-keyhole-bold-duotone" width={24} color="text.secondary" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {confirmPassword.length > 0 && (
                <Iconify
                  icon={
                    !handleDisablePasswordButton()
                      ? 'solar:check-circle-bold'
                      : 'solar:close-circle-bold'
                  }
                  width={20}
                  color={
                    !handleDisablePasswordButton()
                      ? theme.palette.success.main
                      : theme.palette.error.main
                  }
                  sx={{ mr: 0.5 }}
                />
              )}
              <IconButton
                sx={{ p: 0.1 }}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                edge="end"
                size="small"
              >
                <Iconify
                  icon={showConfirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                  width={20}
                />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
        slotProps={{ htmlInput: { maxLength } }}
      />

      {/* Submit Button */}
      <PrimaryButton
        fullWidth
        size="large"
        type="submit"
        disabled={
          isLoading ||
          !validateEmail(formData.email) ||
          !isNameValid ||
          newPassword !== confirmPassword ||
          !newPassword ||
          !confirmPassword
        }
        startIcon={isLoading ? <Iconify icon="svg-spinners:180-ring" width={20} /> : undefined}
      >
        {isLoading ? 'Submitting...' : 'Request approval'}
      </PrimaryButton>
      <ProgressSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </form>
  );

  return (
    <>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 5,
        }}
      >
        <Typography variant="h5">Sign Up</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          Already have an account?
          <RouterLink
            href="/login"
            style={{ marginLeft: 6, cursor: 'pointer' }}
          >
            Sign in
          </RouterLink>
        </Typography>
      </Box>
      {renderForm}
    </>
  );
}
