import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useUserPermissions } from '../hooks/use-permissions';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser, selectNavigation } from '../store/slices/authSlice';
import { PermissionName, getAllPermissionNames, hasPermissionAnywhere } from '../types/permissions';
import { homePageStyles } from '../styles/pages/home.styles';

type RouteConfig = {
  path: string;
  permission?: string;
  permissions?: string[];
};

const RedirectPriority: RouteConfig[] = [
  { path: '/dashboard' }, // Dashboard (insights) - Always accessible
  { path: '/users', permission: PermissionName.READ_USER },
  { path: '/roles', permission: PermissionName.READ_ROLES },
  { path: '/logs', permissions: [PermissionName.READ_SESSION_LOGS, PermissionName.READ_ALL_SESSION_LOGS] },
  { path: '/profile', permission: PermissionName.READ_PROFILE },
  { path: '/settings' },
  { path: '/insights' }, // Always accessible (legacy route)
];

/**
 * Home Page - Smart Landing Page
 *
 * Automatically redirects users to the first page they have access to
 * based on their permissions. This prevents redirect loops and ensures
 * users always land on a page they can access.
 */
export default function HomePage() {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const navigation = useAppSelector(selectNavigation);
  const userPermissions = useUserPermissions();

  useEffect(() => {
    // Wait for user to be loaded before redirecting
    if (!user) {
      return;
    }

    // Use user-specific navigation if available
    if (navigation.length > 0) {
      const firstAccessibleNavItem = navigation.find((item) => {
        const allowed = item.allowedPermissions;
        if (!allowed || allowed.length === 0) {
          return true;
        }
        const allPerms = getAllPermissionNames(userPermissions);
        return allowed.some((permission) => allPerms.includes(permission));
      });

      const targetPath = firstAccessibleNavItem?.path ?? navigation[0]?.path ?? '/settings';
      navigate(targetPath, { replace: true });
      return;
    }

    // Priority order of pages to redirect to
    const redirectPriority: RouteConfig[] = RedirectPriority;

    // Find the first page the user has access to
    for (const route of redirectPriority) {
      if (!route.permission && !route.permissions) {
        navigate(route.path, { replace: true });
        return;
      }

      if (route.permissions) {
        const allPerms = getAllPermissionNames(userPermissions);
        const hasPermission = route.permissions.some((permission) =>
          allPerms.includes(permission)
        );
        if (hasPermission) {
          navigate(route.path, { replace: true });
          return;
        }
      } else if (route.permission) {
        // Use optimized single permission check
        if (hasPermissionAnywhere(route.permission, userPermissions)) {
          navigate(route.path, { replace: true });
          return;
        }
      }
    }

    // Fallback: if no permissions match, go to settings
    navigate('/settings', { replace: true });
  }, [navigate, navigation, user, userPermissions]);

  // Show loading while determining where to redirect
  return (
    <Box sx={homePageStyles.loadingContainer}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Loading...
      </Typography>
    </Box>
  );
}
