import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission, useAnyPermission, useAllPermissions } from '../../hooks/use-permissions';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';

type PermissionGuardProps = {
  children: ReactNode;
  /** Single permission required */
  permission?: string;
  /** Any of these permissions required (OR logic) */
  anyPermission?: string[];
  /** All of these permissions required (AND logic) */
  allPermissions?: string[];
  /** Custom fallback component to render when permission is denied */
  fallback?: ReactNode;
  /** Redirect path when permission is denied (overrides fallback) */
  redirectTo?: string;
  /** Show access denied message instead of redirecting */
  showAccessDenied?: boolean;
};

/**
 * PermissionGuard - Component-level Permission Protection
 * 
 * Purpose:
 * Controls rendering of components based on user permissions
 * Provides flexible permission checking with multiple strategies
 * 
 * Usage Examples:
 * 
 * Single Permission:
 * ```tsx
 * <PermissionGuard permission="EDIT_PROFILE">
 *   <EditButton />
 * </PermissionGuard>
 * ```
 * 
 * Any Permission (OR logic):
 * ```tsx
 * <PermissionGuard anyPermission={['CREATE_ROLES', 'EDIT_ROLES']}>
 *   <RoleManagementPanel />
 * </PermissionGuard>
 * ```
 * 
 * All Permissions (AND logic):
 * ```tsx
 * <PermissionGuard allPermissions={['READ_USER', 'EDIT_USER']}>
 *   <UserEditForm />
 * </PermissionGuard>
 * ```
 * 
 * With Custom Fallback:
 * ```tsx
 * <PermissionGuard 
 *   permission="DELETE_ROLES"
 *   fallback={<Text>You don't have permission</Text>}
 * >
 *   <DeleteButton />
 * </PermissionGuard>
 * ```
 * 
 * With Redirect:
 * ```tsx
 * <PermissionGuard permission="READ_ROLES" redirectTo="/unauthorized">
 *   <RolesPage />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  children,
  permission,
  anyPermission,
  allPermissions,
  fallback,
  redirectTo,
  showAccessDenied = false,
}: PermissionGuardProps) {
  const user = useAppSelector(selectCurrentUser);
  const hasSinglePermission = usePermission(permission!);
  const hasAnyPermission = useAnyPermission(anyPermission || []);
  const hasAllPermissions = useAllPermissions(allPermissions || []);
  const navigate = useNavigate();

  if (!user) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Determine if user has required permissions
  let hasPermission = true;

  if (permission) {
    hasPermission = hasSinglePermission;
  } else if (anyPermission && anyPermission.length > 0) {
    hasPermission = hasAnyPermission;
  } else if (allPermissions && allPermissions.length > 0) {
    hasPermission = hasAllPermissions;
  }

  // If user has permission, render children
  if (hasPermission) {
    return <>{children}</>;
  }

  // Handle permission denial
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  if (showAccessDenied) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          p: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          You don&apos;t have the required permissions to access this content.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return null;
}
