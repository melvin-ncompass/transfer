import { useState, useMemo } from 'react';
import {
  Alert,
  Box,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Iconify } from '../../../src/components/iconify';
import zxcvbn from 'zxcvbn';
import { useTheme } from '@mui/material';
import { PrimaryButton } from '../../../src/components/buttons';

interface PasswordCreationFormProps {
  onSubmit: (password: string, confirmPassword: string) => Promise<void> | void;
  error?: string | null;
  loading?: boolean;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  showHeader?: boolean;
}

export function PasswordCreationForm({
  onSubmit,
  error,
  loading = false,
  title = 'Create Your Password',
  subtitle = 'Set up a secure password to access your account',
  buttonText = 'Create Password',
  showHeader = true,
}: PasswordCreationFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const theme = useTheme();

  // Calculate password strength using zxcvbn
  const passwordStrength = useMemo(() => {
    if (!password) return null;
    return zxcvbn(password);
  }, [password]);

  const getStrengthColor = (score: number) => {
    const colors = ['theme.palette.error.main', 'error.main', 'warning.main', 'info.main', 'theme.palette.success.main'];
    return colors[score];
  };

  const getStrengthLabel = (score: number) => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[score];
  };

  // Check if passwords match
  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  // Check if form has changed and is valid
  const isFormValid = useMemo(() => password.length > 0 && confirmPassword.length > 0 && password === confirmPassword, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    await onSubmit(password, confirmPassword);
  };

  const displayError = error || localError;

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {/* Header */}
        {showHeader && (
          <Stack spacing={1} alignItems="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'success.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <Iconify icon="solar:check-circle-bold" width={36} color="theme.palette.success.main" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }} align="center">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {subtitle}
            </Typography>
          </Stack>
        )}

        {displayError && (
          <Alert severity="error" icon={<Iconify icon="mingcute:close-line" width={24} />}>
            {displayError}
          </Alert>
        )}

        {/* Password Fields */}
        <Stack spacing={2.5}>
          <Box>
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:shield-keyhole-bold-duotone" width={24} color="text.secondary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={20} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {passwordStrength && (
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Password Strength
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600,
                      color: getStrengthColor(passwordStrength.score)
                    }}
                  >
                    {getStrengthLabel(passwordStrength.score)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(passwordStrength.score + 1) * 20}
                  sx={{
                    height: 6,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getStrengthColor(passwordStrength.score),
                      borderRadius: 1,
                    },
                  }}
                />
                {passwordStrength.feedback.warning && (
                  <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                    {passwordStrength.feedback.warning}
                  </Typography>
                )}
                {passwordStrength.feedback.suggestions.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {passwordStrength.feedback.suggestions[0]}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <Box>
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setConfirmPasswordTouched(true)}
              required
              error={confirmPasswordTouched && confirmPassword.length > 0 && passwordsMatch === false}
              helperText={
                confirmPasswordTouched && confirmPassword.length > 0 && passwordsMatch === false
                  ? 'Passwords do not match'
                  : ''
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:shield-keyhole-bold-duotone" width={24} color="text.secondary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {confirmPassword.length > 0 && passwordsMatch !== null && (
                        <Iconify 
                          icon={passwordsMatch ? 'solar:check-circle-bold' : 'solar:close-circle-bold'} 
                          width={20} 
                          color={passwordsMatch ? `${theme.palette.success.main}` : `${theme.palette.error.main}`}
                        />
                      )}
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        aria-label="toggle password visibility"
                      >
                        <Iconify icon={showConfirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={20} />
                      </IconButton>
                    </Stack>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Stack>

        <PrimaryButton
          fullWidth
          type="submit"
          size="large"
          disabled={loading || !isFormValid}
          sx={{ mt: 1, py: 1.5, fontWeight: 600 }}
        >
          {buttonText}
        </PrimaryButton>
      </Stack>
    </form>
  );
}
