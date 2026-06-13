import { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useRole, useAnyRole } from '../../hooks/use-role';
import { Role } from '../../types/permissions';
import { Box, Typography, Button } from '@mui/material';

type RoleGuardProps = {
  children: ReactNode;
  /** Single role required */
  role?: Role;
  /** Any of these roles required (OR logic) */
  anyRole?: Role[];
  /** Custom fallback component to render when role check fails */
  fallback?: ReactNode;
  /** Redirect path when role check fails (overrides fallback) */
  redirectTo?: string;
  /** Show access denied message instead of redirecting */
  showAccessDenied?: boolean;
};

/**
 * RoleGuard - Component-level Role Protection
 * 
 * Purpose:
 * Controls rendering of components based on user roles
 * Provides flexible role checking with multiple strategies
 * 
 * Usage Examples:
 * 
 * Single Role:
 * ```tsx
 * <RoleGuard role="super_admin">
 *   <AdminPanel />
 * </RoleGuard>
 * ```
 * 
 * Any Role (OR logic):
 * ```tsx
 * <RoleGuard anyRole={['super_admin', 'user']}>
 *   <DashboardContent />
 * </RoleGuard>
 * ```
 * 
 * With Custom Fallback:
 * ```tsx
 * <RoleGuard 
 *   role="super_admin"
 *   fallback={<Text>Admin access required</Text>}
 * >
 *   <AdminSettings />
 * </RoleGuard>
 * ```
 * 
 * With Redirect:
 * ```tsx
 * <RoleGuard role="super_admin" redirectTo="/unauthorized">
 *   <SystemSettings />
 * </RoleGuard>
 * ```
 * 
 * For Route Protection (use in router config):
 * ```tsx
 * {
 *   path: 'admin',
 *   element: (
 *     <RoleGuard role="super_admin" redirectTo="/">
 *       <AdminDashboard />
 *     </RoleGuard>
 *   )
 * }
 * ```
 */
export function RoleGuard({
  children,
  role,
  anyRole,
  fallback,
  redirectTo,
  showAccessDenied = false,
}: RoleGuardProps) {
  const hasSingleRole = useRole(role!);
  const hasAnyRole = useAnyRole(anyRole || []);
  const navigate = useNavigate();

  // Determine if user has required role
  let hasRequiredRole = true;

  if (role) {
    hasRequiredRole = hasSingleRole;
  } else if (anyRole && anyRole.length > 0) {
    hasRequiredRole = hasAnyRole;
  }

  // If user has required role, render children
  if (hasRequiredRole) {
    return <>{children}</>;
  }

  // Handle role check failure
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
          You don&apos;t have the required role to access this content.
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

  // Default: render nothing
  return null;
}
