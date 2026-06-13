/**
 * Business permission node with nested children structure
 * Supports multi-level hierarchy (e.g., DASHBOARD -> DASHBOARD_TAB_1 -> CAN_MANAGE_DATA)
 *
 * @example
 * {
 *   id: "a9f3b4bf-61a8-422b-b75c-26196a1650f6",
 *   name: "MANAGE_DASHBOARD",
 *   children: [
 *     {
 *       id: "e2a1818f-cfbf-4b84-8480-7ce8dbf28762",
 *       name: "MANAGE_DECKGL",
 *       children: []
 *     }
 *   ]
 * }
 */
export type BusinessPermissionNode = {
  id: string;
  name: string;
  children: BusinessPermissionNode[];
};

/**
 * Permission types for role-based access control
 */
export type Permission = {
  system: string[];
  business: BusinessPermissionNode[];
};

/**
 * User role types
 */
export type Role = 'user' | 'super_admin';

/**
 * Permission enum - All available permissions in the system
 * Use this enum instead of hardcoding permission strings
 */
export enum PermissionName {
  // System Permissions
  MANAGE_USER = 'MANAGE_USER',
  READ_SESSION_LOGS = 'READ_SESSION_LOGS',
  READ_ALL_SESSION_LOGS = 'READ_ALL_SESSION_LOGS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  READ_USER = 'READ_USER',
  READ_ROLES = 'READ_ROLES',
  READ_PROFILE = 'READ_PROFILE',
  READ_ALL_SETTINGS = 'READ_ALL_SETTINGS',

  // Business Permissions
  DATA = 'MANAGE_DATA',
  DASHBOARD = 'MANAGE_DASHBOARD',
  OVERVIEW = 'MANAGE_OVERVIEW',
  OVERVIEW_V2 = 'MANAGE_OVERVIEW_V2',
  DECKGL = 'MANAGE_DECKGL',
  LEAFLET = 'MANAGE_LEAFLET',
  GOOGLE_MAP = 'MANAGE_GOOGLE_MAP',
  CLIMATE = 'MANAGE_CLIMATE',
  TIMESERIES = 'MANAGE_TIMESERIES',
  PROMPTS = 'MANAGE_PROMPTS',
  CLIMATE_AND_HEALTH = 'MANAGE_CLIMATE_AND_HEALTH',
  CONFIG = 'MANAGE_CONFIG',
  HELP = 'MANAGE_HELP',
  FACILITY = 'MANAGE_FACILITY',
  TEMPERATURE = 'MANAGE_TEMPERATURE',
  FORECAST = 'MANAGE_FORECAST',
}

export const DashboardHierarchy = [
  {
    name: 'MANAGE_DASHBOARD',
    children: [
      { name: PermissionName.OVERVIEW },
      { name: PermissionName.PROMPTS },
      { name: PermissionName.CLIMATE },
      { name: PermissionName.FORECAST },
    ],
  },
];

export const BusinessPermissionHierarchy = [
  {
    name: PermissionName.DASHBOARD,
    children: [
      { name: PermissionName.OVERVIEW },
      { name: PermissionName.TIMESERIES },
      { name: PermissionName.PROMPTS },
      { name: PermissionName.CLIMATE },
    ],
  },
  {
    name: PermissionName.DATA,
  },
  {
    name: PermissionName.CONFIG,
  },
  {
    name: PermissionName.HELP,
  },
];



/**
 * Dashboard permissions hierarchy using enum values
 */
export const DashboardPermissionHierarchy = [
  {
    name: PermissionName.DASHBOARD,
    children: [
      { name: PermissionName.OVERVIEW },
      { name: PermissionName.PROMPTS },
      { name: PermissionName.CLIMATE },
      { name: PermissionName.FORECAST },
    ],
  },
];


export const DashboardPermissions = [
  PermissionName.OVERVIEW,
  PermissionName.PROMPTS,
  PermissionName.CLIMATE,
  PermissionName.FORECAST
]

/**
 * Note: All available permissions are now fetched from the API via useGetPermissionsQuery()
 * The Permission type structure supports hierarchical business permissions with nested children.
 * Use PermissionName enum for type-safe permission string references.
 */

/**
 * Utility function to extract all permission names from nested business permissions
 * Recursively traverses the tree structure to collect all permission names
 * Handles edge cases like null/undefined nodes, empty arrays, etc.
 */
export function extractBusinessPermissionNames(
  businessPermissions: BusinessPermissionNode[] | null | undefined
): string[] {
  if (!businessPermissions || !Array.isArray(businessPermissions)) {
    return [];
  }

  const names: string[] = [];
  const seen = new Set<string>(); // Track duplicates

  const traverse = (nodes: BusinessPermissionNode[]) => {
    if (!Array.isArray(nodes)) return;

    nodes.forEach((node) => {
      if (!node || !node.name) return;

      // Only add if not already seen (handles duplicate permission names at different levels)
      if (!seen.has(node.name)) {
        names.push(node.name);
        seen.add(node.name);
      }

      // Recursively process children
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(businessPermissions);
  return names;
}

/**
 * Helper function to check if a permission exists anywhere in the hierarchy (old behavior)
 * Used for backward compatibility when checking permissions without a parent context
 */
export function hasPermissionAnywhere(
  permissionName: string,
  permissions: Permission | null | undefined
): boolean {
  if (!permissions) return false;

  // Check system permissions
  if (permissions.system && Array.isArray(permissions.system)) {
    if (permissions.system.includes(permissionName)) {
      return true;
    }
  }

  // Check business permissions recursively
  const checkNode = (nodes: BusinessPermissionNode[] | null | undefined): boolean => {
    if (!nodes || !Array.isArray(nodes)) return false;

    for (const node of nodes) {
      if (!node) continue;

      if (node.name === permissionName) {
        return true;
      }

      // Check children recursively
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        if (checkNode(node.children)) {
          return true;
        }
      }
    }

    return false;
  };

  return checkNode(permissions.business);
}

/**
 * Utility function to check if allowed permissions exist within a parent permission's hierarchy
 *
 * This function:
 * 1. Finds the parent permission node in userPermissions
 * 2. Extracts all permission names from the children of that parent (recursively)
 * 3. Checks if any of the allowedPermissions exist in those children
 *
 * @param parentPermission - The parent permission name to search under
 * @param allowedPermissions - Single permission name or array of permission names to check for
 * @param userPermissions - User's permission object
 * @returns true if any allowedPermission exists in the parent's children hierarchy
 *
 * @example
 * // Check if MANAGE_FACILITY exists under MANAGE_DECKGL
 * hasPermissionInHierarchy('MANAGE_DECKGL', 'MANAGE_FACILITY', userPermissions)
 *
 * @example
 * // Check if any of the permissions exist under MANAGE_DASHBOARD
 * hasPermissionInHierarchy('MANAGE_DASHBOARD', ['MANAGE_DECKGL', 'MANAGE_LEAFLET'], userPermissions)
 */
export function hasPermissionInHierarchy(
  parentPermission: string,
  allowedPermissions: string[] | string,
  userPermissions: Permission | null | undefined
): boolean {
  if (!userPermissions || !parentPermission) return false;

  // Normalize allowedPermissions to array
  const allowedPerms = Array.isArray(allowedPermissions)
    ? allowedPermissions
    : [allowedPermissions];
  if (allowedPerms.length === 0) return false;

  // First, find the parent permission node in business permissions
  const findParentNode = (
    nodes: BusinessPermissionNode[] | null | undefined
  ): BusinessPermissionNode | null => {
    if (!nodes || !Array.isArray(nodes)) return null;

    for (const node of nodes) {
      if (!node) continue;

      if (node.name === parentPermission) {
        return node;
      }

      // Search in children recursively
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        const found = findParentNode(node.children);
        if (found) return found;
      }
    }

    return null;
  };

  const parentNode = findParentNode(userPermissions.business);

  // If parent node not found, return false
  if (!parentNode) return false;

  // Extract all permission names from the parent node's children (recursively)
  const extractChildrenNames = (node: BusinessPermissionNode): string[] => {
    const names: string[] = [];

    // Add the node's own name
    names.push(node.name);

    // Recursively add all children names
    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      for (const child of node.children) {
        names.push(...extractChildrenNames(child));
      }
    }

    return names;
  };

  // Get all permission names from the parent's children
  const childrenNames =
    parentNode.children && Array.isArray(parentNode.children) && parentNode.children.length > 0
      ? parentNode.children.flatMap((child) => extractChildrenNames(child))
      : [];

  // Check if any of the allowed permissions exist in the children
  return allowedPerms.some((perm) => childrenNames.includes(perm));
}

/**
 * Utility function to get all permission names from a Permission object
 * Combines system permissions and extracts names from nested business permissions
 * Handles null/undefined gracefully
 */
export function getAllPermissionNames(permissions: Permission | null | undefined): string[] {
  if (!permissions) {
    return [];
  }

  const systemPerms = Array.isArray(permissions.system) ? permissions.system : [];
  const businessPerms = extractBusinessPermissionNames(permissions.business);

  // Combine and deduplicate (in case same permission exists in both system and business)
  const allPerms = [...systemPerms, ...businessPerms];
  return Array.from(new Set(allPerms));
}

/**
 * All available roles
 */
export const ROLES: Record<Uppercase<Role>, Role> = {
  USER: 'user',
  SUPER_ADMIN: 'super_admin',
} as const;

/**
 * Default permissions for each role
 * This can be used as a fallback when permissions are not fetched from the server
 */
// export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
//   user: [
//     'READ_PROFILE',
//     'EDIT_PROFILE',
//     'READ_SESSION_LOGS',
//     'READ_ALL_SESSION_LOGS'
//   ],
//   super_admin: [
//     'READ_PROFILE',
//     'EDIT_PROFILE',
//     'CREATE_PROFILE',
//     'READ_INVITES',
//     'CREATE_INVITES',
//     'READ_ROLES',
//     'EDIT_ROLES',
//     'CREATE_ROLES',
//     'DELETE_ROLES',
//     'READ_PERMISSIONS',
//     'EDIT_PERMISSIONS',
//     'CREATE_PERMISSIONS',
//     'DELETE_PERMISSIONS',
//     'READ_USER',
//     'READ_SESSION_LOGS',
//     'READ_ALL_SESSION_LOGS',
//     'PROCESS_REQUEST',
//     'READ_SETTINGS',
//     'READ_ALL_SETTINGS'
//   ],
// };
