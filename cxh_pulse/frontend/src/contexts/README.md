# Breadcrumb Context

## Overview
The breadcrumb system allows pages to dynamically set their breadcrumb navigation paths. Breadcrumbs are displayed automatically at the top of the DashboardContent area.

## Usage

### In Your Page Component

```tsx
import { useEffect } from 'react';
import { useBreadcrumbs } from 'src/contexts/breadcrumb-context';
import { Iconify } from 'src/components/iconify';

export function YourPageView() {
  const { setBreadcrumbs } = useBreadcrumbs();

  // Set breadcrumbs when component mounts
  useEffect(() => {
    setBreadcrumbs([
      {
        label: 'Dashboard',
        href: '/',
        icon: <Iconify icon="solar:home-angle-bold-duotone" width={20} />,
      },
      {
        label: 'Settings',
        href: '/settings',
        icon: <Iconify icon="solar:settings-bold-duotone" width={20} />,
      },
      {
        label: 'Email Configuration',
        // No href means this is the current page (non-clickable)
      },
    ]);

    // Cleanup: reset breadcrumbs when component unmounts
    return () => {
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs]);

  return (
    // Your component content
  );
}
```

## API

### `useBreadcrumbs()`
Returns an object with:
- `breadcrumbs`: Array of current breadcrumb items
- `setBreadcrumbs(items)`: Function to update breadcrumbs

### BreadcrumbItem Interface
```typescript
interface BreadcrumbItem {
  label: string;        // Text to display
  href?: string;        // Link URL (optional, omit for current page)
  icon?: ReactNode;     // Icon to display before label (optional)
}
```

## Features
- ✅ Automatic display in layout
- ✅ Clickable navigation links
- ✅ Custom icons per item
- ✅ Automatic cleanup on unmount
- ✅ Last item is non-clickable (current page)
- ✅ Arrow separator between items

## Examples

### Simple breadcrumb without icons
```tsx
setBreadcrumbs([
  { label: 'Home', href: '/' },
  { label: 'Users', href: '/users' },
  { label: 'John Doe' },
]);
```

### With custom icons
```tsx
setBreadcrumbs([
  { 
    label: 'Dashboard', 
    href: '/',
    icon: <Iconify icon="solar:home-angle-bold-duotone" width={20} />
  },
  { 
    label: 'Roles',
    icon: <Iconify icon="solar:shield-user-bold-duotone" width={20} />
  },
]);
```
