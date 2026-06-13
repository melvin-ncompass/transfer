import { useMemo } from 'react';
import { useUserPermissions } from './use-permissions';
import { getAllPermissionNames } from '../types/permissions';
import type { NavItem } from '../layouts/nav-config-dashboard';

/**
 * Hook to filter navigation items based on user permissions
 * 
 * @param navItems - Array of navigation items
 * @returns Filtered array of navigation items the user has access to
 * 
 * @example
 * ```tsx
 * const filteredNav = useFilteredNav(navData);
 * ```
 * 
 * How it works:
 * - If a nav item has no `allowedPermissions`, it's always visible
 * - If a nav item has `allowedPermissions`, user must have at least one of those permissions
 * - Uses memoization for performance
 */
export function useFilteredNav(navItems: NavItem[]): NavItem[] {
  const userPermissions = useUserPermissions();

  return useMemo(() => navItems.filter((item) => {
    // If no permissions are required, show the item
    if (!item.allowedPermissions || item.allowedPermissions.length === 0) {
      return true;
    }

    // User must have at least one of the required permissions (OR logic)
    const allPerms = getAllPermissionNames(userPermissions);
    return item.allowedPermissions.some(permission => 
      allPerms.includes(permission)
    );
  }), [navItems, userPermissions]);
}
