# Role & Permission Guard System

This guide explains how to use the role and permission-based access control system in the application.

## Table of Contents

1. [Overview](#overview)
2. [Available Permissions](#available-permissions)
3. [Available Roles](#available-roles)
4. [Guards](#guards)
5. [Hooks](#hooks)
6. [Usage Examples](#usage-examples)

---

## Overview

The application implements a comprehensive role and permission-based access control system with:

- **Type-safe permissions and roles** defined in TypeScript
- **Guard components** for protecting routes and components
- **Hooks** for checking permissions and roles in your components
- **Flexible permission checking** (single, any, all)

---

## Available Permissions

The following permissions are available in the system:

```typescript
- READ_PROFILE
- EDIT_PROFILE
- CREATE_PROFILE
- READ_INVITES
- CREATE_INVITES
- READ_ROLES
- EDIT_ROLES
- CREATE_ROLES
- DELETE_ROLES
- READ_PERMISSIONS
- EDIT_PERMISSIONS
- CREATE_PERMISSIONS
- DELETE_PERMISSIONS
- READ_USER
- READ_SESSION_LOGS
- READ_ALL_SESSION_LOGS
- PROCESS_REQUEST
```

---

## Available Roles

Two roles are supported:

- **`user`** - Regular user with limited permissions
- **`super_admin`** - Administrator with full permissions

### Default Role Permissions

**User:**
- READ_PROFILE
- EDIT_PROFILE
- READ_SESSION_LOGS

**Super Admin:**
- All permissions

---

## Guards

### 1. AuthGuard

Protects routes that require authentication. Redirects unauthenticated users to `/sign-in`.

**Usage in Routes:**
```tsx
{
  element: (
    <AuthGuard>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </AuthGuard>
  ),
  children: [
    { path: 'dashboard', element: <DashboardPage /> },
    { path: 'profile', element: <ProfilePage /> }
  ]
}
```

### 2. PermissionGuard

Protects components based on user permissions. Supports:
- Single permission check
- Any permission check (OR logic)
- All permissions check (AND logic)

**Props:**
- `permission?: Permission` - Single permission required
- `anyPermission?: Permission[]` - Any of these permissions required
- `allPermissions?: Permission[]` - All of these permissions required
- `fallback?: ReactNode` - Custom component to show when permission denied
- `redirectTo?: string` - Redirect path when permission denied
- `showAccessDenied?: boolean` - Show default access denied message

**Examples:**

```tsx
// Single permission
<PermissionGuard permission="EDIT_PROFILE">
  <EditButton />
</PermissionGuard>

// Any permission (OR logic)
<PermissionGuard anyPermission={['CREATE_ROLES', 'EDIT_ROLES']}>
  <RoleManagementPanel />
</PermissionGuard>

// All permissions (AND logic)
<PermissionGuard allPermissions={['READ_USER', 'EDIT_USER']}>
  <UserEditForm />
</PermissionGuard>

// With custom fallback
<PermissionGuard 
  permission="DELETE_ROLES"
  fallback={<Text>You don't have permission to delete roles</Text>}
>
  <DeleteButton />
</PermissionGuard>

// With redirect
<PermissionGuard permission="READ_ROLES" redirectTo="/unauthorized">
  <RolesPage />
</PermissionGuard>

// Show access denied message
<PermissionGuard permission="READ_ROLES" showAccessDenied>
  <RolesPage />
</PermissionGuard>
```

### 3. RoleGuard

Protects components based on user roles.

**Props:**
- `role?: Role` - Single role required
- `anyRole?: Role[]` - Any of these roles required
- `fallback?: ReactNode` - Custom component to show when role check fails
- `redirectTo?: string` - Redirect path when role check fails
- `showAccessDenied?: boolean` - Show default access denied message

**Examples:**

```tsx
// Single role
<RoleGuard role="super_admin">
  <AdminPanel />
</RoleGuard>

// Any role (OR logic)
<RoleGuard anyRole={['super_admin', 'user']}>
  <DashboardContent />
</RoleGuard>

// With custom fallback
<RoleGuard 
  role="super_admin"
  fallback={<Text>Admin access required</Text>}
>
  <AdminSettings />
</RoleGuard>

// In routes with redirect
{
  path: 'admin',
  element: (
    <RoleGuard role="super_admin" redirectTo="/">
      <AdminDashboard />
    </RoleGuard>
  )
}
```

### 4. GuestGuard

Protects routes that should only be accessible to non-authenticated users (login, signup, etc.). Redirects authenticated users to dashboard.

**Usage:**
```tsx
{
  path: 'sign-in',
  element: (
    <GuestGuard>
      <AuthLayout>
        <SignInPage />
      </AuthLayout>
    </GuestGuard>
  )
}
```

---

## Hooks

### Permission Hooks

#### `usePermission(permission: Permission): boolean`

Check if user has a specific permission.

```tsx
const canEditProfile = usePermission('EDIT_PROFILE');

if (canEditProfile) {
  return <EditButton />;
}
```

#### `useAnyPermission(permissions: Permission[]): boolean`

Check if user has any of the specified permissions (OR logic).

```tsx
const canManageRoles = useAnyPermission(['EDIT_ROLES', 'DELETE_ROLES', 'CREATE_ROLES']);
```

#### `useAllPermissions(permissions: Permission[]): boolean`

Check if user has all of the specified permissions (AND logic).

```tsx
const canFullyManageRoles = useAllPermissions(['READ_ROLES', 'EDIT_ROLES', 'DELETE_ROLES']);
```

#### `useUserPermissions(): Permission[]`

Get all permissions for the current user.

```tsx
const userPermissions = useUserPermissions();
console.log('User has permissions:', userPermissions);
```

### Role Hooks

#### `useRole(role: Role): boolean`

Check if user has a specific role.

```tsx
const isSuperAdmin = useRole('super_admin');

if (isSuperAdmin) {
  return <AdminPanel />;
}
```

#### `useAnyRole(roles: Role[]): boolean`

Check if user has any of the specified roles.

```tsx
const isAdmin = useAnyRole(['super_admin']);
```

#### `useUserRole(): Role | null`

Get the current user's role.

```tsx
const userRole = useUserRole();
console.log('Current role:', userRole);
```

#### `useIsSuperAdmin(): boolean`

Check if user is a super admin.

```tsx
const isSuperAdmin = useIsSuperAdmin();
```

#### `useIsUser(): boolean`

Check if user is a regular user.

```tsx
const isRegularUser = useIsUser();
```

### Navigation Filtering Hook

#### `useFilteredNav(navItems: NavItem[]): NavItem[]`

Filters navigation items based on user permissions. Automatically hides nav items the user doesn't have access to.

```tsx
const filteredNav = useFilteredNav(navData);
```

**How it works:**
- If a nav item has no `allowedPermissions`, it's always visible
- If a nav item has `allowedPermissions`, user must have at least one of those permissions (OR logic)
- Uses memoization for performance

**Example NavItem with permissions:**
```tsx
export const navData = [
  {
    title: 'User',
    path: '/users',
    icon: icon('ic-user'),
    allowedPermissions: ['READ_USER'],
  },
  {
    title: 'Roles',
    path: '/roles',
    icon: icon('ic-roles'),
    allowedPermissions: ['READ_ROLES'],
  },
  {
    title: 'Logs',
    path: '/logs',
    icon: icon('ic-logs'),
    allowedPermissions: ['READ_SESSION_LOGS', 'READ_ALL_SESSION_LOGS'], // User needs ANY of these
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: icon('ic-settings'),
    // No permissions = always visible
  }
];
```

---

## Usage Examples

### Example 1: Conditional Rendering in Components

```tsx
import { usePermission, useRole } from 'src/hooks';

function UserManagementPage() {
  const canEditUsers = usePermission('EDIT_USER');
  const canDeleteUsers = usePermission('DELETE_USER');
  const isSuperAdmin = useRole('super_admin');

  return (
    <div>
      <h1>User Management</h1>
      
      {canEditUsers && (
        <Button onClick={handleEdit}>Edit User</Button>
      )}
      
      {canDeleteUsers && (
        <Button onClick={handleDelete}>Delete User</Button>
      )}
      
      {isSuperAdmin && (
        <AdminControls />
      )}
    </div>
  );
}
```

### Example 2: Protected Route Configuration

```tsx
// routes/sections.tsx
import { AuthGuard, PermissionGuard, RoleGuard } from './components';

export const routesSection: RouteObject[] = [
  {
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { 
        path: 'users', 
        element: (
          <PermissionGuard permission="READ_USER" redirectTo="/profile">
            <UserPage />
          </PermissionGuard>
        ) 
      },
      { 
        path: 'roles', 
        element: (
          <PermissionGuard permission="READ_ROLES" showAccessDenied>
            <RolePage />
          </PermissionGuard>
        ) 
      },
      {
        path: 'admin',
        element: (
          <RoleGuard role="super_admin" redirectTo="/">
            <AdminPage />
          </RoleGuard>
        )
      }
    ]
  }
];
```

### Example 3: Inline Permission Checks

```tsx
import { PermissionGuard } from 'src/routes/components';

function ProfilePage() {
  return (
    <div>
      <h1>Profile</h1>
      
      <PermissionGuard permission="EDIT_PROFILE">
        <EditProfileButton />
      </PermissionGuard>
      
      <PermissionGuard 
        anyPermission={['READ_SESSION_LOGS', 'READ_ALL_SESSION_LOGS']}
        fallback={<Text>You cannot view session logs</Text>}
      >
        <SessionLogsSection />
      </PermissionGuard>
    </div>
  );
}
```

### Example 4: Complex Permission Logic

```tsx
import { useAllPermissions, useAnyRole } from 'src/hooks';

function RoleManagementPanel() {
  // User must have ALL of these permissions
  const canFullyManageRoles = useAllPermissions([
    'READ_ROLES',
    'EDIT_ROLES',
    'CREATE_ROLES',
    'DELETE_ROLES'
  ]);

  // User must be super_admin
  const isAdmin = useAnyRole(['super_admin']);

  if (!isAdmin || !canFullyManageRoles) {
    return <AccessDenied />;
  }

  return <RoleManagementUI />;
}
```

### Example 5: Navigation and Account Menu Filtering

The navigation sidebar and account popover menu automatically filter out menu items based on user permissions:

```tsx
// nav-config-dashboard.tsx
import { Permission } from 'src/types/permissions';

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  allowedPermissions?: Permission[];
};

export const navData: NavItem[] = [
  {
    title: 'User',
    path: '/',
    icon: icon('ic-user'),
    allowedPermissions: ['READ_USER'], // Only visible if user has READ_USER permission
  },
  {
    title: 'Role',
    path: '/roles',
    icon: icon('ic-roles'),
    allowedPermissions: ['READ_ROLES'],
  },
  {
    title: 'Log',
    path: '/logs',
    icon: icon('ic-logs'),
    allowedPermissions: ['READ_SESSION_LOGS', 'READ_ALL_SESSION_LOGS'], // Visible if user has ANY of these
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: icon('ic-settings'),
    // No allowedPermissions = always visible to authenticated users
  }
];

// In your navigation component (automatically filtered)
import { useFilteredNav } from 'src/hooks/use-nav-filter';

function NavContent({ data }) {
  const filteredNav = useFilteredNav(data);
  
  return (
    <nav>
      {filteredNav.map((item) => (
        <NavItem key={item.path} {...item} />
      ))}
    </nav>
  );
}

// Account popover menu also supports permission filtering
export const _account = [
  {
    label: 'Home',
    href: '/',
    icon: <Icon />,
    allowedPermissions: ['READ_USER'],
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: <Icon />,
    allowedPermissions: ['READ_PROFILE'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Icon />,
    // No permissions = always visible
  }
];
```

### Example 6: Smart Landing Page (Preventing Redirect Loops)

To prevent redirect loops when users don't have permission to access the index route, create a smart landing page that redirects to the first accessible page:

```tsx
// pages/home.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserPermissions } from 'src/hooks/use-permissions';
import { Permission } from 'src/types/permissions';

type RouteConfig = {
  path: string;
  permission?: Permission;
  permissions?: Permission[];
};

export default function HomePage() {
  const navigate = useNavigate();
  const userPermissions = useUserPermissions();

  useEffect(() => {
    // Priority order of pages to redirect to
    const redirectPriority: RouteConfig[] = [
      { path: '/users', permission: 'READ_USER' },
      { path: '/roles', permission: 'READ_ROLES' },
      { path: '/logs', permissions: ['READ_SESSION_LOGS', 'READ_ALL_SESSION_LOGS'] },
      { path: '/profile', permission: 'READ_PROFILE' },
      { path: '/settings' }, // Always accessible fallback
    ];

    // Find the first page the user has access to
    for (const route of redirectPriority) {
      if (!route.permission && !route.permissions) {
        navigate(route.path, { replace: true });
        return;
      }

      if (route.permissions) {
        const hasPermission = route.permissions.some((p: Permission) => 
          userPermissions.includes(p)
        );
        if (hasPermission) {
          navigate(route.path, { replace: true });
          return;
        }
      } else if (route.permission && userPermissions.includes(route.permission)) {
        navigate(route.path, { replace: true });
        return;
      }
    }

    // Fallback to settings if no permissions match
    navigate('/settings', { replace: true });
  }, [navigate, userPermissions]);

  return <LoadingSpinner />;
}

// In routes
export const routesSection: RouteObject[] = [
  {
    element: <DashboardLayout><Outlet /></DashboardLayout>,
    children: [
      { index: true, element: <HomePage /> }, // Smart landing page
      { 
        path: 'users', 
        element: (
          <PermissionGuard permission="READ_USER" showAccessDenied>
            <UserPage />
          </PermissionGuard>
        ) 
      },
      // ... other routes
    ]
  }
];
```

**Why this approach?**
- Prevents redirect loops when users lack permission for the index route
- Automatically directs users to the most relevant page based on their permissions
- Provides a fallback route (Settings) that all users can access
- Improves user experience by avoiding "Access Denied" messages on login

---

## Server Integration

The system supports two modes for permissions:

1. **Explicit Permissions**: Permissions fetched from the server and stored in `user.info.permissions`
2. **Role-based Fallback**: If no explicit permissions are provided, the system falls back to default role-based permissions defined in `ROLE_PERMISSIONS`

### Updating User Permissions

When fetching user data from the server, ensure the response includes:

```typescript
{
  id: string;
  email: string;
  name: string;
  permissions?: Permission[];  // Optional: explicit permissions from server
  info: {
    name: string;
    email: string;
    role: 'user' | 'super_admin';
    avatar?: string;
  };
}
```

**Important**: The `permissions` array should be at the root level of the user object, not nested inside `info`.

If `permissions` array is provided, it will be used. Otherwise, the system uses default role permissions based on the user's role.

---

## Best Practices

1. **Use AuthGuard for all protected routes** - Wrap your dashboard layout with AuthGuard
2. **Use PermissionGuard for feature-specific access** - Protect individual features/components
3. **Use RoleGuard sparingly** - Prefer permission-based checks over role-based for flexibility
4. **Combine guards when needed** - You can nest guards for complex requirements
5. **Show appropriate feedback** - Use `fallback` or `showAccessDenied` to inform users why they can't access something
6. **Keep permissions granular** - Define specific permissions for specific actions
7. **Use smart landing pages** - Create a home page that redirects users to the first page they have access to, preventing redirect loops

---

## Type Safety

All permissions and roles are TypeScript types, providing:
- Autocomplete in your IDE
- Compile-time type checking
- Prevention of typos

```typescript
// ✅ Type-safe
<PermissionGuard permission="READ_PROFILE">

// ❌ Will cause TypeScript error
<PermissionGuard permission="INVALID_PERMISSION">
```

---

## Testing

When testing components with guards or permission hooks, mock the Redux store with appropriate user permissions:

```typescript
const mockStore = {
  auth: {
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      permissions: ['READ_PROFILE', 'EDIT_PROFILE', 'READ_USER'],
      info: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'super_admin'
      }
    },
    accessToken: 'mock-token',
    isAuthenticated: true
  }
};
```
