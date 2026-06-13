import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Role } from '../types/permissions';

/**
 * Hook to check if the current user has a specific role
 * 
 * @param role - The role to check
 * @returns true if the user has the role, false otherwise
 * 
 * @example
 * ```tsx
 * const isSuperAdmin = useRole('super_admin');
 * 
 * if (isSuperAdmin) {
 *   return <AdminPanel />;
 * }
 * ```
 */
export function useRole(role: Role): boolean {
  const user = useAppSelector(selectCurrentUser);

  if (!user) return false;

  return user.roleName === role;
}

/**
 * Hook to check if the current user has any of the specified roles
 * 
 * @param roles - Array of roles to check
 * @returns true if the user has at least one of the roles, false otherwise
 * 
 * @example
 * ```tsx
 * const isAdmin = useAnyRole(['super_admin']);
 * ```
 */
export function useAnyRole(roles: Role[]): boolean {
  const user = useAppSelector(selectCurrentUser);

  if (!user) return false;

  return roles.includes(user.roleName as Role);
}

/**
 * Hook to get the current user's role
 * 
 * @returns The user's role or null if not authenticated
 * 
 * @example
 * ```tsx
 * const userRole = useUserRole();
 * console.log('Current role:', userRole);
 * ```
 */
export function useUserRole(): Role | null {
  const user = useAppSelector(selectCurrentUser);

  if (!user) return null;

  return user.roleName as Role;
}

/**
 * Hook to check if the current user is a super admin
 * 
 * @returns true if the user is a super admin, false otherwise
 * 
 * @example
 * ```tsx
 * const isSuperAdmin = useIsSuperAdmin();
 * ```
 */
export function useIsSuperAdmin(): boolean {
  return useRole('super_admin');
}

/**
 * Hook to check if the current user is a regular user
 * 
 * @returns true if the user is a regular user, false otherwise
 * 
 * @example
 * ```tsx
 * const isRegularUser = useIsUser();
 * ```
 */
export function useIsUser(): boolean {
  return useRole('user');
}
