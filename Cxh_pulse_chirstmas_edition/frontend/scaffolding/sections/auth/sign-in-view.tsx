import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import { Alert, Snackbar } from '@mui/material';

import { useLazyGetCurrentUserQuery, useLoginMutation } from '../../../src/api';
import { getFirstAccessibleNavPath, setAccessToken, setUser } from '../../../src/store/slices/authSlice';

import { Iconify } from '../../../src/components/iconify';
import { PrimaryButton } from '../../../src/components/buttons';
import { useNavigate } from 'react-router-dom';
import { RouterLink } from '../../../src/routes/components';

// ----------------------------------------------------------------------

export function SignInView() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [signInClicked, setSignInClicked] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    invalidEmail: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [getCurrentUser] = useLazyGetCurrentUserQuery();
  const handleCloseSnackbar = useCallback(() => {
  setSnackbar(prev => ({
    ...prev,
    open: false,
  }));
}, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const resetErrors = () => {
    setErrors({
      email: '',
      password: '',
      invalidEmail: '',
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInClicked(true);
    resetErrors();
    if (!formData.email) {
      setErrors(prev => ({
        ...prev,
        email: 'Email is required',
      }));
    }

    if (!formData.password) {
      setErrors(prev => ({
        ...prev,
        password: 'Password is required',
      }));
    }

    if(!validateEmail(formData.email)) {
      setErrors(prev => ({
        ...prev,
        invalidEmail: 'Invalid email format',
      }));
    }

    if (errors.email || errors.password || !validateEmail(formData.email)) {
      return;
    }

    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
      }).unwrap();
      
      dispatch(setAccessToken(response.accessToken));

      const currentUser = await getCurrentUser().unwrap();
      dispatch(setUser(currentUser));
      
      // Use getFirstAccessibleNavPath to properly check permissions
      const userNavigation = getFirstAccessibleNavPath(
        currentUser.navigation,
        currentUser.permissions
      );
      
      // Use replace: true to avoid adding to history and prevent back button issues
      navigate(userNavigation, { replace: true });
      setSignInClicked(false);
    } catch (error) {
      setSignInClicked(false);
      setSnackbar({
        open: true,
        message: 'Login failed. Please check your credentials and try again.',
      });
    }
  };
  

  const renderForm = (
    <form onSubmit={handleSignIn}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          flexDirection: 'column',
        }}
      >
        <TextField
          fullWidth
          name="email"
          label="Email address"
          value={formData.email}
          onChange={handleInputChange}
          error={!!errors.email || !!errors.invalidEmail}
          helperText={errors.email || errors.invalidEmail}
          sx={{ mb: 3 }}
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />

        <RouterLink href="/forgot-password" style={{ marginBottom: "4px" }}>
          Forgot password?
        </RouterLink> 

        <TextField
          fullWidth
          name="password"
          label="Password"
          value={formData.password}
          onChange={handleInputChange}
          type={showPassword ? 'text' : 'password'}
          error={!!errors.password}
          helperText={errors.password}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)} 
                    edge="end"
                  >
                    <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 3 }}
        />

        <PrimaryButton
          fullWidth
          size="large"
          type="submit"
          disabled={isLoading || signInClicked || !formData.password || !validateEmail(formData.email)}
        >
          {isLoading || signInClicked ? 'Signing in...' : 'Sign in'}
        </PrimaryButton>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
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
        <Typography variant="h5">Sign in</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          Don’t have an account?
          <RouterLink href="/?showAuth=true&authTab=sign-up" style={{ marginLeft: 4, cursor: 'pointer' }}>
            Get started
          </RouterLink>
        </Typography>
      </Box>
      {renderForm}
    </>
  );
}
