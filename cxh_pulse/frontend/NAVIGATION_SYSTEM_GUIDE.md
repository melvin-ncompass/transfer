# Dynamic Navigation System Guide

## Overview
The application now uses a dynamic navigation system that displays menu items and controls route access based on the user's permissions from the API.

## How It Works

### 1. API Response Structure
When a user logs in or their profile is fetched, the API returns navigation data:

```json
{
  "data": {
    "navigation": [
      {
        "title": "Users",
        "path": "/users",
        "allowedPermissions": ["MANAGE_USER"]
      },
      {
        "title": "Roles",
        "path": "/roles",
        "allowedPermissions": ["MANAGE_ROLES"]
      }
    ],
    "permissions": ["MANAGE_USER", "MANAGE_ROLES", ...]
  }
}
```

### 2. State Management (Redux)

**Auth Slice** (`src/store/slices/authSlice.ts`):
- Added `navigation` array to auth state
- Added `NavigationItem` interface
- Updated reducers to store navigation data:
  - `setUser` - Sets navigation when user data is loaded
  - `loginSuccess` - Sets navigation on successful login
  - `logout` - Clears navigation on logout
  - `loadUser` - Sets navigation when user is loaded
- Added `selectNavigation` selector to retrieve navigation

### 3. Navigation Display

**Dashboard Layout** (`src/layouts/dashboard/layout.tsx`):
- Retrieves navigation from Redux using `selectNavigation`
- Converts API navigation to internal format using `convertApiNavigationToNavData`
- Falls back to static `navData` if API navigation is not available
- Passes dynamic navigation to both `NavDesktop` and `NavMobile` components

**Nav Config** (`src/layouts/nav-config-dashboard.tsx`):
- Added `iconMap` to map paths to icons
- Created `convertApiNavigationToNavData` function to transform API navigation
- Maintains static `navData` as fallback

### 4. Route Protection

**NavigationGuard** (`src/routes/components/navigation-guard.tsx`):
- New guard component that checks if user has access to a route
- Compares current path with user's navigation data
- Redirects to first available path if access is denied
- Works alongside existing `PermissionGuard`

**Routes** (`src/routes/sections.tsx`):
- All protected routes now wrapped with `NavigationGuard`
- Double protection: NavigationGuard + PermissionGuard
- Example:
  ```tsx
  <NavigationGuard path="/users">
    <PermissionGuard permission="READ_USER" showAccessDenied>
      <UserPage />
    </PermissionGuard>
  </NavigationGuard>
  ```

## Flow Diagram

```
User Login
    ↓
API Returns User Data + Navigation
    ↓
Redux Auth Slice Stores Navigation
    ↓
Dashboard Layout Reads Navigation
    ↓
Converts to NavItem Format
    ↓
Displays in Sidebar (NavDesktop/NavMobile)
    ↓
User Clicks Route
    ↓
NavigationGuard Checks Access
    ↓
If Allowed → PermissionGuard → Page
If Denied → Redirect to First Available Path
```

## Key Features

✅ **Dynamic Menu**: Sidebar only shows items user has access to
✅ **Route Protection**: Users can't access routes not in their navigation
✅ **Fallback Support**: Uses static navigation if API data unavailable
✅ **Icon Mapping**: Automatically assigns correct icons to menu items
✅ **Graceful Degradation**: Works with existing permission system

## Adding New Routes

To add a new route with navigation control:

1. **Update API** to include the route in user's navigation data
2. **Add icon mapping** in `nav-config-dashboard.tsx`:
   ```tsx
   const iconMap: Record<string, React.ReactNode> = {
     '/new-route': <Iconify icon="..." />,
   };
   ```
3. **Add route** in `sections.tsx`:
   ```tsx
   {
     path: 'new-route',
     element: (
       <NavigationGuard path="/new-route">
         <PermissionGuard permission="PERMISSION_NAME">
           <NewPage />
         </PermissionGuard>
       </NavigationGuard>
     ),
   }
   ```

## Testing

To test the navigation system:

1. Login with different user roles
2. Check sidebar displays only allowed routes
3. Try accessing routes directly via URL
4. Verify redirect to first available route if access denied
5. Test fallback to static navigation if API fails

## Troubleshooting

**Navigation not showing:**
- Check API response includes `navigation` array
- Verify Redux state has navigation data
- Check browser console for errors

**Routes not protected:**
- Ensure `NavigationGuard` wraps the route
- Verify path matches exactly (including leading `/`)
- Check navigation data in Redux DevTools

**Icons missing:**
- Add path to `iconMap` in `nav-config-dashboard.tsx`
- Ensure icon component is imported
