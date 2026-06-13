import React from 'react';
import { useUserPermissions } from '../../hooks';
import { hasPermissionInHierarchy, type BusinessPermissionNode } from '../../types/permissions';
import { Box, Typography } from '@mui/material';

export interface WithPermissionOptions {
  allowedPermissions: string[] | string;
  parentPermission?: string; // Optional parent permission that must exist (can be first or second level)
  showFallback?: boolean;
}

export interface WithPermissionProps {
  parentPermission?: string; // Can be passed as prop at runtime
  showFallback?: boolean; // Pass boolean to display fallback message or null by default
}

const WithPermission =
  <P extends object>(
    Component: React.ComponentType<P>,
    options: string[] | string | WithPermissionOptions
  ) => {
    // Normalize options to handle both old and new API
    const normalizedOptions: WithPermissionOptions =
      typeof options === 'string' || Array.isArray(options)
        ? { allowedPermissions: options }
        : options;

    const WrappedComponent = (props: P & WithPermissionProps) => {
      const userPermissions = useUserPermissions();

      // Get parent permission from props (runtime) or options (compile-time)
      const parentPermission = props.parentPermission || normalizedOptions.parentPermission;

      const showFallback = props.showFallback ?? normalizedOptions.showFallback ?? false;

      // If parent permission is specified, check if allowed permissions exist within that parent's hierarchy
      if (parentPermission) {
        /**
         * hasPermissionInHierarchy handles:
         * 1. Finding the parent permission at any level (first level like MANAGE_DASHBOARD or second level like MANAGE_DECKGL)
         * 2. Checking if allowed permissions are descendants (at any depth) of that parent
         * 
         * Example:
         * - parentPermission: "MANAGE_DASHBOARD" (first level)
         * - allowedPermissions: "MANAGE_FACILITY" 
         * - Result: true (because MANAGE_FACILITY is a descendant of MANAGE_DASHBOARD through MANAGE_DECKGL)
         * 
         * Example:
         * - parentPermission: "MANAGE_LEAFLET" (second level)
         * - allowedPermissions: "MANAGE_FACILITY"
         * - Result: false (because MANAGE_FACILITY is not a descendant of MANAGE_LEAFLET)
         */
        const hasPermission = hasPermissionInHierarchy(
          parentPermission,
          normalizedOptions.allowedPermissions,
          userPermissions
        );
        if (!hasPermission) {
          return showFallback ?
            <Box sx={{
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
            </Box>
            : null;
        }
      } else {
        // No parent permission specified - check if user has the allowed permissions directly
        // This is a fallback for backward compatibility
        const allowedPerms = Array.isArray(normalizedOptions.allowedPermissions)
          ? normalizedOptions.allowedPermissions
          : [normalizedOptions.allowedPermissions];

        // Helper to check if a permission exists in system or business permissions
        const hasPermission = (perm: string): boolean => {
          // Check system permissions
          if (userPermissions?.system && Array.isArray(userPermissions.system)) {
            if (userPermissions.system.includes(perm)) {
              return true;
            }
          }

          // Check business permissions recursively
          const checkBusinessPermission = (nodes: BusinessPermissionNode[] | null | undefined): boolean => {
            if (!nodes || !Array.isArray(nodes)) return false;

            for (const node of nodes) {
              if (!node) continue;

              if (node.name === perm) {
                return true;
              }

              if (node.children && Array.isArray(node.children) && node.children.length > 0) {
                if (checkBusinessPermission(node.children)) {
                  return true;
                }
              }
            }

            return false;
          };

          return checkBusinessPermission(userPermissions?.business);
        };

        // Check if user has ANY of the required permissions (OR logic)
        const hasAnyPermission = allowedPerms.some(perm => hasPermission(perm));

        if (!hasAnyPermission) {
          return showFallback ?
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
            </Box>
            : null;
        }
      }

      // Remove parentPermission and showFallback from props before passing to component
      // We already extracted these above, so we omit them here
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { parentPermission: _, showFallback: __, ...componentProps } = props;
      return <Component {...(componentProps as P)} />;
    };

    WrappedComponent.displayName = `WithPermission(${Component.displayName || Component.name || 'Component'})`;

    return WrappedComponent;
  };

export { WithPermission };