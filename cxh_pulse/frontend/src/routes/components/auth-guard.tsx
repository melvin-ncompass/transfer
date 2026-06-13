import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectIsAuthenticated, setUser } from '../../store/slices/authSlice';
import { useLazyGetCurrentUserQuery } from '../../api';
import { Box, CircularProgress } from '@mui/material';
import { getAuthUrl, saveRedirectUrl } from '../utils/auth-urls';
import { AuthTab } from '../../sections/landing/types';

type AuthGuardProps = {
  children: React.ReactNode;
};

/**
 * AuthGuard - Route Protection for Authenticated Users
 * 
 * Purpose:
 * Ensures only authenticated users can access protected routes
 * Redirects unauthenticated users to the sign-in page
 * 
 * Behavior:
 * 1. On mount, verifies if user is authenticated
 * 2. If not authenticated, redirects to sign-in page
 * 3. If authenticated, renders the requested protected page
 * 4. Shows loading spinner during verification
 * 
 * Usage:
 * Wrap protected routes with this component in your router configuration
 * 
 * @example
 * ```tsx
 * {
 *   element: (
 *     <AuthGuard>
 *       <DashboardLayout>
 *         <Outlet />
 *       </DashboardLayout>
 *     </AuthGuard>
 *   ),
 *   children: [
 *     { path: 'dashboard', element: <DashboardPage /> },
 *     { path: 'profile', element: <ProfilePage /> }
 *   ]
 * }
 * ```
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();
  const [getCurrentUser] = useLazyGetCurrentUserQuery();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    /**
     * Verifies authentication status
     * 
     * Flow:
     * 1. Checks if user has valid authentication token
     * 2. Attempts to get current user info to validate token
     * 3. If successful, allows access to protected route
     * 4. If failed (invalid/expired token), redirect to sign-in
     */
    const checkAuth = async () => {
      try {
        if (!isAuthenticated) {
          // Save redirect URL before redirecting to sign-in
          saveRedirectUrl(location.pathname, location.search);
          navigate(getAuthUrl(AuthTab.SIGN_IN), { replace: true });
          return;
        }

        // Verify the token is still valid by getting current user
        const currentUser = await getCurrentUser().unwrap();
        dispatch(setUser(currentUser));
        setIsChecking(false);
      } catch (error: any) {
        // Check if it's a 500 error (backend issue) vs auth error
        const isServerError = error?.status === 500 || error?.status === 'FETCH_ERROR';

        if (isServerError) {
          // For server errors, allow user to proceed but log the error
          console.error('Server error fetching user data:', error);
          // Set user with empty permissions so app can still function
          dispatch(setUser({
            id: '',
            email: '',
            name: '',
            permissions: { system: [], business: [] },
            userInfo: { name: '', email: '' },
          }));
          setIsChecking(false);
        } else {
          // For auth errors (401, 403), redirect to sign-in
          console.error('Auth verification failed:', error);
          saveRedirectUrl(location.pathname, location.search);
          setIsChecking(false);
          navigate(getAuthUrl(AuthTab.SIGN_IN), { replace: true });
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, navigate, dispatch, getCurrentUser, location]);

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

  // If authenticated, render the protected page
  return <>{children}</>;
}
