# Standardized Button Components

This directory contains standardized button components for the CxH Pulse application, ensuring consistent styling, behavior, and accessibility across all pages.

## Available Button Components

### 1. **PrimaryButton**
Used for primary actions (most important action on a page).
- **Color**: Primary Red (`#D32F2F`)
- **Variant**: Contained
- **Use Cases**: Submit forms, save changes, primary CTAs

```tsx
import { PrimaryButton } from 'src/components/buttons';

<PrimaryButton onClick={handleSubmit}>
  Submit
</PrimaryButton>
```

### 2. **SecondaryButton**
Used for secondary actions (important but not primary).
- **Color**: Secondary Blue (`#1565C0`)
- **Variant**: Contained
- **Use Cases**: Alternative actions, secondary CTAs

```tsx
import { SecondaryButton } from 'src/components/buttons';

<SecondaryButton onClick={handleAction}>
  Learn More
</SecondaryButton>
```

### 3. **OutlinedButton**
Used for alternative or cancel actions.
- **Color**: Primary with outline
- **Variant**: Outlined
- **Use Cases**: Cancel, back, alternative actions

```tsx
import { OutlinedButton } from 'src/components/buttons';

<OutlinedButton onClick={handleCancel}>
  Cancel
</OutlinedButton>
```

### 4. **TextButton**
Used for tertiary or subtle actions.
- **Variant**: Text
- **Use Cases**: Links, subtle actions, tertiary options

```tsx
import { TextButton } from 'src/components/buttons';

<TextButton onClick={handleView}>
  View Details
</TextButton>
```

### 5. **InheritButton**
Used for neutral actions.
- **Color**: Grey/Inherit
- **Variant**: Contained
- **Use Cases**: Neutral actions that don't require color emphasis

```tsx
import { InheritButton } from 'src/components/buttons';

<InheritButton onClick={handleAction}>
  Action
</InheritButton>
```

### 6. **SuccessButton**
Used for positive/success actions.
- **Color**: Success Green
- **Variant**: Contained
- **Use Cases**: Approve, confirm, success actions

```tsx
import { SuccessButton } from 'src/components/buttons';

<SuccessButton onClick={handleApprove}>
  Approve
</SuccessButton>
```

### 7. **ErrorButton**
Used for destructive actions.
- **Color**: Error Red
- **Variant**: Contained
- **Use Cases**: Delete, remove, destructive actions

```tsx
import { ErrorButton } from 'src/components/buttons';

<ErrorButton onClick={handleDelete}>
  Delete
</ErrorButton>
```

### 8. **WarningButton**
Used for warning/caution actions.
- **Color**: Warning Orange
- **Variant**: Contained
- **Use Cases**: Warning actions, important notifications

```tsx
import { WarningButton } from 'src/components/buttons';

<WarningButton onClick={handleWarning}>
  Proceed with Caution
</WarningButton>
```

## Button Sizes

All buttons support three sizes:
- `small`: 32px height, compact padding
- `medium`: 40px height (default)
- `large`: 48px height, generous padding

```tsx
<PrimaryButton size="small">Small</PrimaryButton>
<PrimaryButton size="medium">Medium</PrimaryButton>
<PrimaryButton size="large">Large</PrimaryButton>
```

## Additional Props

### Loading State
```tsx
<PrimaryButton loading={isLoading}>
  Save Changes
</PrimaryButton>
```

### Icons
```tsx
import { Iconify } from 'src/components/iconify';

<PrimaryButton startIcon={<Iconify icon="mingcute:add-line" />}>
  Add User
</PrimaryButton>

<OutlinedButton endIcon={<Iconify icon="eva:arrow-forward-fill" />}>
  Next
</OutlinedButton>
```

### Full Width
```tsx
<PrimaryButton fullWidth>
  Sign In
</PrimaryButton>
```

## Accessibility Features

All buttons include:
- ✅ Proper focus states with visible outlines
- ✅ Keyboard navigation support
- ✅ ARIA attributes
- ✅ Sufficient color contrast (WCAG AA compliant)
- ✅ Touch-friendly sizes (minimum 40px height)

## Best Practices

1. **Use semantic button types**: Choose the button variant that matches the action's importance
2. **Limit primary buttons**: Have only one primary button per section
3. **Destructive actions**: Always use ErrorButton for delete/remove actions
4. **Consistent sizing**: Use the same size within a button group
5. **Loading states**: Show loading indicators for async actions
6. **Icon placement**: Place icons before text for actions, after text for navigation

## Theme Integration

These buttons are fully integrated with the application theme and will automatically adapt to:
- Color scheme changes
- Dark/light mode
- Theme customizations

The theme colors are based on the Kajiado County Government branding:
- **Primary**: Red (#D32F2F) from the logo
- **Secondary**: Blue (#1565C0) from the logo text
