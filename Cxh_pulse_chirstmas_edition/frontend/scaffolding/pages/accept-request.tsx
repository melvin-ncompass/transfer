import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CONFIG } from '../../src/config-global';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Stack,
  Button,
} from '@mui/material';
import { PrimaryButton, TextButton } from '../../src/components/buttons';
import { Iconify } from '../../src/components/iconify';
import { PasswordCreationForm } from '../components/password-creation-form';
import { PasswordSuccess } from '../components/password-success';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../src/store/store';
import { useCheckRequestTokenMutation, useOnboardRequestMutation, useLogoutMutation, useRefreshTokenMutation } from '../../src/api';
import { setAccessToken } from '../../src/store/slices/authSlice';

export default function AcceptRequestPage() {
  const [checkRequestToken] = useCheckRequestTokenMutation();
  const [onboardRequest] = useOnboardRequestMutation();
  const [logout] = useLogoutMutation();
  const [refreshToken] = useRefreshTokenMutation();
  const dispatch = useDispatch();
  const [status, setStatus] = useState<'verifying' | 'approved' | 'error' | 'creating' | 'success'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [userInfo, setUserInfo] = useState<any>(null);
  const { accessToken } = useSelector((state: RootState) => state.auth as any);
  const [showLogOut, setShowLogOut] = useState(false);

  useEffect(() => {
    const verifyAndRefreshToken = async () => {
      try {
        // Always try to refresh the token (refresh token is in cookies)
        // This will work even if accessToken is not in Redux state
        const result = await refreshToken().unwrap();
        // Update the access token in the store
        dispatch(setAccessToken(result.accessToken));
        // User is logged in with valid token, show logout option
        setShowLogOut(true);
      } catch (err) {
        // Token refresh failed, user is not logged in
        // Don't show logout, let them proceed with request
        setShowLogOut(false);
      }
    };

    verifyAndRefreshToken();
  }, []);

  // Step 1: Verify request token
  useEffect(() => {
    const verifyRequest = async () => {
      if (!token) {
        setError('Invalid or missing request token.');
        setStatus('error');
        return;
      }

      try {
        const res = await checkRequestToken({ requestToken: token }).unwrap();

        setUserInfo(res);
        setStatus('approved');
        
      } catch (err: any) {
        setError(err.data?.message || err.message || 'Verification failed');
        setStatus('error');
      }
    };

    verifyRequest();
  }, [token]);

  // Step 2: Create password
  const handleCreatePassword = async (password: string) => {
    setError(null);

    try {
      setStatus('creating');
      const res = await onboardRequest({
        password,
        userInfoId: userInfo.userInfoId
      }).unwrap();
      if (res.statusCode === 201) {
        setStatus('success');
      } else {

        // throw new Error('Failed to create password');
      }
    } catch (err: any) {
      setStatus('approved'); // go back to form
    }
  };

  const handleLogOut = async () => {
    try {
      await logout().unwrap();
    } catch (logoutError) {
      console.error('Logout failed:', logoutError);
    } finally {
      setShowLogOut(false);
    }
  };

  if(showLogOut){
    return <>
      <h4 style={{ textAlign: 'center' }}>Please log out to accept the request</h4>
      <TextButton onClick={handleLogOut}>Log Out</TextButton>
    </>
  }

  return (
    <>
      <title>{`Accept Request - ${CONFIG.appName}`}</title>
        <Stack spacing={3}>
          {/* Logo/Branding */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: 'primary.main',
                mb: 1,
              }}
            >
              {CONFIG.appName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete your account setup
            </Typography>
          </Box>
            {/* Verifying */}
            {status === 'verifying' && (
              <Stack spacing={3} alignItems="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'primary.lighter',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={40} thickness={4} />
                </Box>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Verifying Your Request
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please wait while we verify your request link
                  </Typography>
                </Stack>
              </Stack>
            )}

            {/* Error */}
            {status === 'error' && (
              <Stack spacing={3} alignItems="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'error.lighter',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="mingcute:close-line" width={48} color="error.main" />
                </Box>
                <Stack spacing={2} alignItems="center">
                  <Typography variant="h5" sx={{ fontWeight: 600 }} color="error.main">
                    Verification Failed
                  </Typography>
                  <Alert severity="error" sx={{ width: '100%' }}>
                    {error || 'Invalid or expired request link. Please contact your administrator.'}
                  </Alert>
                </Stack>
              </Stack>
            )}

            {/* Create Password Form */}
            {status === 'approved' && (
              <PasswordCreationForm
                onSubmit={handleCreatePassword}
                error={error}
                loading={false}
              />
            )}

            {/* Loading */}
            {status === 'creating' && (
              <Stack spacing={3} alignItems="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'primary.lighter',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={40} thickness={4} />
                </Box>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Setting Up Your Account
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please wait while we create your password
                  </Typography>
                </Stack>
              </Stack>
            )}

            {/* Success */}
            {status === 'success' && (
              <PasswordSuccess />
            )}
        </Stack>
    </>
  );
}
