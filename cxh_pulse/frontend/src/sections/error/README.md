# Error Section

The error section provides user-friendly error pages for handling common error scenarios in the Climate Health Pulse application.

## Overview

The error section contains components for displaying error states when users encounter issues such as accessing non-existent pages or attempting to access content without proper permissions.

## Structure

```
error/
├── not-found-view.tsx      # 404 Not Found page
├── access-denied-view.tsx   # Access Denied page
└── index.ts                # Public exports
```

## Components

### NotFoundView

The 404 Not Found page displayed when a user navigates to a route that doesn't exist.

**Features:**
- Clear error message indicating page not found
- Helpful description suggesting URL typos
- 404 illustration/image
- Navigation button to return home
- Logo display

**User Experience:**
- Friendly, non-technical error message
- Visual illustration to make the error less jarring
- Clear call-to-action to return to the application

**Styling:**
- Uses `errorSectionStyles` from `src/styles/sections/error.styles.ts`
- Centered layout with logo
- Responsive design

### AccessDeniedView

The Access Denied page displayed when a user attempts to access content without the required permissions.

**Features:**
- Clear access denied message
- Explanation that user lacks required permissions
- Contact administrator suggestion
- Access denied illustration/image
- Navigation button to return to previous page or home
- Logo display

**User Experience:**
- Clear explanation of why access was denied
- Helpful guidance on next steps
- Non-punitive tone
- Easy navigation back to accessible content

**Styling:**
- Uses `errorSectionStyles` from `src/styles/sections/error.styles.ts`
- Centered layout with logo
- Responsive design

## Styling

Both components use shared styles from `src/styles/sections/error.styles.ts`:
- `logoFixed`: Logo positioning
- `errorContainer`: Main container styles
- `errorTitle`: Title typography
- `errorDescription`: Description text styles

## Integration

### Routes

Error views are typically integrated into the routing system:

```tsx
// 404 - Catch-all route (must be last)
<Route path="*" element={<NotFoundView />} />

// Access Denied - Can be used in protected routes
<Route 
  path="/restricted" 
  element={
    <ProtectedRoute 
      fallback={<AccessDeniedView />}
      requiredPermission={PermissionName.ADMIN}
    />
  } 
/>
```

### Navigation

Both components include navigation buttons:
- **NotFoundView**: Button to navigate home using `RouterLink`
- **AccessDeniedView**: Button to navigate back using `useNavigate` hook

## Usage Examples

### Direct Usage

```tsx
import { NotFoundView, AccessDeniedView } from 'src/sections/error';

// In routes
<Route path="*" element={<NotFoundView />} />
<Route path="/denied" element={<AccessDeniedView />} />
```

### With Protected Routes

```tsx
import { AccessDeniedView } from 'src/sections/error';
import { useUserPermissions } from 'src/hooks/use-permissions';

function ProtectedComponent() {
  const permissions = useUserPermissions();
  
  if (!hasRequiredPermission(permissions)) {
    return <AccessDeniedView />;
  }
  
  return <ActualContent />;
}
```

## Best Practices

1. **User-Friendly Messages**: Use clear, non-technical language
2. **Visual Design**: Include illustrations to make errors less jarring
3. **Navigation Options**: Always provide a way to return to the application
4. **Consistent Styling**: Use shared styles for consistency
5. **Accessibility**: Ensure error messages are accessible to screen readers
6. **Responsive Design**: Ensure error pages work on all device sizes

## Related Files

- `src/routes/routes.tsx` - Route configuration
- `src/components/secured-components/` - Protected route components
- `src/styles/sections/error.styles.ts` - Styling definitions
- `src/components/logo/` - Logo component
- `src/components/buttons/` - Button components

## Future Enhancements

Potential improvements:
- Custom error codes and messages
- Error logging/reporting
- Suggested alternative pages
- Search functionality on 404 page
- Help/support links

