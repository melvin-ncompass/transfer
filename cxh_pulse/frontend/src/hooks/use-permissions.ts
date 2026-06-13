import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Permission, Role, getAllPermissionNames, hasPermissionAnywhere } from '../types/permissions';

/**
 * Hook to check if the current user has a specific permission
 * 
 * @param permission - The permission to check
 * @returns true if the user has the permission, false otherwise
 * 
 * @example
 * ```tsx
 * const canEditProfile = usePermission('EDIT_PROFILE');
 * 
 * if (canEditProfile) {
 *   return <EditButton />;
 * }
 * ```
 */
export function usePermission(permission: string): boolean {
  const user = useAppSelector(selectCurrentUser);

  if (!user || !user.permissions) return false;

  // Use optimized hierarchy check for single permission
  return hasPermissionAnywhere(permission, user.permissions);
}

/**
 * Hook to check if the current user has any of the specified permissions
 * 
 * @param permissions - Array of permissions to check
 * @returns true if the user has at least one of the permissions, false otherwise
 * 
 * @example
 * ```tsx
 * const canManageRoles = useAnyPermission(['EDIT_ROLES', 'DELETE_ROLES', 'CREATE_ROLES']);
 * ```
 */
export function useAnyPermission(permissions: string[]): boolean {
  const user = useAppSelector(selectCurrentUser);

  if (!user || !user.permissions) return false;

  // Extract all permission names from the nested structure
  const allPerms = getAllPermissionNames(user.permissions);
  return permissions.some(permission => allPerms.includes(permission));
}

/**
 * Hook to check if the current user has all of the specified permissions
 * 
 * @param permissions - Array of permissions to check
 * @returns true if the user has all of the permissions, false otherwise
 * 
 * @example
 * ```tsx
 * const canFullyManageRoles = useAllPermissions(['READ_ROLES', 'EDIT_ROLES', 'DELETE_ROLES']);
 * ```
 */
export function useAllPermissions(permissions: string[]): boolean {
  const user = useAppSelector(selectCurrentUser);

  if (!user || !user.permissions) return false;

  // Extract all permission names from the nested structure
  const allPerms = getAllPermissionNames(user.permissions);
  return permissions.every(permission => allPerms.includes(permission));
}

/**
 * Hook to get all permissions for the current user
 * 
 * @returns Array of permissions the user has
 * 
 * @example
 * ```tsx
 * const userPermissions = useUserPermissions();
 * console.log('User has permissions:', userPermissions);
 * ```
 */
export function useUserPermissions(): Permission {
  const user = useAppSelector(selectCurrentUser);

  if (!user) return { system: [], business: [] };

  // Return explicit permissions from the server if available
  if (user.permissions) {
    return user.permissions;
  }

  // Fallback to empty permissions
  return { system: [], business: [] };
}
