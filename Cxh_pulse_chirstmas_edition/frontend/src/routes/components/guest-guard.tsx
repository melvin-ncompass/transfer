import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectIsAuthenticated, setUser } from '../../store/slices/authSlice';
import { useLazyGetCurrentUserQuery } from '../../api';
import { Box, CircularProgress } from '@mui/material';

type GuestGuardProps = {
  children: React.ReactNode;
};

/**
 * GuestGuard - Route Protection for Guest-Only Pages
 * 
 * Purpose:
 * Prevents authenticated users from accessing pages meant for guests only
 * (like sign-in, sign-up, forgot password pages)
 * 
 * Behavior:
 * 1. On mount, verifies if user is authenticated
 * 2. If authenticated, redirects to dashboard ("/")
 * 3. If not authenticated, renders the requested page
 * 4. Shows loading spinner during verification
 * 
 * Usage:
 * Wrap guest-only routes with this component in your router configuration
 * 
 * @example
 * ```tsx
 * {
 *   path: 'sign-in',
 *   element: (
 *     <GuestGuard>
 *       <AuthLayout>
 *         <SignInPage />
 *       </AuthLayout>
 *     </GuestGuard>
 *   )
 * }
 * ```
 */
export function GuestGuard({ children }: GuestGuardProps) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const navigate = useNavigate();
  const [getCurrentUser] = useLazyGetCurrentUserQuery();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    /**
     * Verifies authentication status
     * 
     * Flow:
     * 1. Attempts to get current user info (validates token)
     * 2. If successful (user is authenticated), redirect to dashboard
     * 3. If failed (invalid/expired token), allow access to guest page
     */
    const checkAuth = async () => {
        try {
          // Verify the token is still valid by getting current user
          const currentUser = await getCurrentUser().unwrap();
          dispatch(setUser(currentUser));
          // If successful, redirect to dashboard
          navigate('/dashboard');
        } catch (error: any) {
          // Check if it's a 500 error (backend issue) vs auth error
          const isServerError = error?.status === 500 || error?.status === 'FETCH_ERROR';
          
          if (isServerError) {
            // For server errors, allow access to guest page (user can try to sign in)
            console.error('Server error fetching user data:', error);
          } else {
            // For auth errors, allow access to guest page (normal flow)
            console.error('Auth verification failed:', error);
          }
          setIsChecking(false);
        }
    };

    checkAuth();
  }, [isAuthenticated, navigate, dispatch]);

  // Show loading spinner while checking authentication status
  if (isChecking) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If authenticated, return null (will redirect via navigate)
  if (isAuthenticated) {
    return null;
  }

  // If not authenticated, render the guest page
  return <>{children}</>;
}
