import React from 'react';
import { useUserPermissions } from '../../hooks';
import { hasPermissionInHierarchy, type BusinessPermissionNode } from '../../types/permissions';

export interface WithPermissionOptions {
  allowedPermissions: string[] | string;
  parentPermission?: string; // Optional parent permission that must exist (can be first or second level)
}

export interface WithPermissionProps {
  parentPermission?: string; // Can be passed as prop at runtime
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
          return null;
        }
      } else {
        // No parent permission specified - check if user has the allowed permissions directly
        // This is a fallback for backward compatibility
        const allowedPerms = Array.isArray(normalizedOptions.allowedPermissions) 
          ? normalizedOptions.allowedPermissions 
          : [normalizedOptions.allowedPermissions];
        
        // Check system permissions
        const hasSystemPermission = userPermissions?.system && Array.isArray(userPermissions.system)
          ? allowedPerms.some(perm => userPermissions.system!.includes(perm))
          : false;
        
        // Check business permissions recursively
        const checkBusinessPermission = (nodes: BusinessPermissionNode[] | null | undefined): boolean => {
          if (!nodes || !Array.isArray(nodes)) return false;
          
          for (const node of nodes) {
            if (!node) continue;
            
            if (allowedPerms.includes(node.name)) {
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
        
        const hasBusinessPermission = checkBusinessPermission(userPermissions?.business);
        
        if (!hasSystemPermission && !hasBusinessPermission) {
          return null;
        }
      }

      // Remove parentPermission from props before passing to component
      const { parentPermission: _, ...componentProps } = props;
      return <Component {...(componentProps as P)} />;
    };

    WrappedComponent.displayName = `WithPermission(${Component.displayName || Component.name || 'Component'})`;
    
    return WrappedComponent;
  };

export { WithPermission };