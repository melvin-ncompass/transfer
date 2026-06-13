import { Box, Button, Card, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Iconify } from '../../../components/iconify';
import { SignInView } from '../../../../scaffolding/sections/auth';
import { landingViewStyles } from '../../../styles/pages/landing.styles';
import { LandingHeader } from './landing-header';
import { useCallback, useState } from 'react';
import { delay } from 'lodash';
import { getFirstAccessibleNavPath, setUser } from '@/store/slices/authSlice';
import { useDispatch } from 'react-redux';
import { useLazyGetCurrentUserQuery } from '@/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [getCurrentUser] = useLazyGetCurrentUserQuery();
  const [isLoading, setIsLoading] = useState(false);


  const verifyAuth = useCallback(async (): Promise<{ success: boolean; navigationPath?: string }> => {
    try {
      const currentUser = await getCurrentUser().unwrap();
      dispatch(setUser(currentUser));

      const navigationPath = getFirstAccessibleNavPath(
        currentUser.navigation,
        currentUser.permissions
      );

      return { success: true, navigationPath };
    } catch {
      return { success: false };
    }
  }, [getCurrentUser, dispatch]);

  const handleLoginClick = useCallback(async () => {
    setIsLoading(true);
    const authResult = await verifyAuth();
    setIsLoading(false);

    if (authResult.success && authResult.navigationPath) {
      navigate(authResult.navigationPath);
    } else {
      delay(() => navigate('/login'), 500);
    }
  }, [navigate, verifyAuth]);

  return (
    <Box sx={landingViewStyles.container}>
      <Box sx={landingViewStyles.headerWrapperStyles}>
        <LandingHeader 
          onLoginClick={handleLoginClick} 
          isLoginLoading={isLoading} 
        />
      </Box>
      <Box sx={landingViewStyles.authStandaloneFace}>
        <Box sx={landingViewStyles.authFaceContent}>
          <Container maxWidth="sm">
            <Card sx={landingViewStyles.authCard('/assets/auth/login-hero.webp')}>
              <Box sx={landingViewStyles.authCardOverlay} />
              <Box sx={landingViewStyles.authCardContent}>
                <Button
                  startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
                  onClick={() => navigate('/about')}
                  sx={landingViewStyles.backButton}
                >
                  Back
                </Button>
                <Box sx={landingViewStyles.authContainer}>
                  <SignInView />
                </Box>
              </Box>
            </Card>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
