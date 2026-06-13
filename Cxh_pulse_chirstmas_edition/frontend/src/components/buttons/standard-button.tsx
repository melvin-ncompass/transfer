import { forwardRef } from 'react';
import Button from '@mui/material/Button';
import type { StandardButtonProps } from '../../types';
import { getButtonStyles } from '../../styles/components/button.styles';

// ----------------------------------------------------------------------

/**
 * Standard Button Components
 * 
 * 8 button variants with consistent styling and loading state support.
 * All variants extend StandardButtonProps from src/types/button.types.ts
 */

/**
 * Base button component with loading state support
 * 
 * Extends Material-UI Button with:
 * - Loading state (automatically disables and shows "Loading...")
 * - Forward ref support for DOM access
 * - Styles extracted to src/styles/components/button.styles.ts
 * 
 * Note: Use specific button variants (PrimaryButton, SecondaryButton, etc.)
 * instead of this base component for consistent styling
 * 
 * @example
 * ```tsx
 * <StandardButton loading={isSubmitting}>
 *   Submit
 * </StandardButton>
 * ```
 */
export const StandardButton = forwardRef<HTMLButtonElement, StandardButtonProps>(
  ({ loading, disabled, children, ...other }, ref) => {
    // Preserve any incoming sx prop and merge branding-aware styles on top
    const incomingSx = (other as any).sx;

    const colorProp = (other as any).color || 'primary';
    const variant = (other as any).variant || 'text';

    // Get styles from centralized style file
    const brandingSx = getButtonStyles(variant, colorProp);

    const mergedSx = Array.isArray(incomingSx)
      ? [...incomingSx, brandingSx]
      : incomingSx
      ? [incomingSx, brandingSx]
      : brandingSx;

    return (
      <Button
        ref={ref}
        disabled={disabled || loading} // Disable during loading
        {...other}
        sx={mergedSx}
      >
        {loading ? 'Loading...' : children}
      </Button>
    );
  }
);

StandardButton.displayName = 'StandardButton';

// ----------------------------------------------------------------------

/**
 * PrimaryButton - For main/primary actions
 * 
 * When to use:
 * - Form submissions
 * - Primary CTAs ("Sign Up", "Get Started")
 * - Confirm actions
 * - Most important action on a page
 * 
 * Style: Solid primary color background
 * 
 * Best practice: Use only ONE PrimaryButton per visible section
 * 
 * @example
 * ```tsx
 * <PrimaryButton onClick={handleSubmit} loading={isLoading}>
 *   Submit Form
 * </PrimaryButton>
 * ```
 */
export const PrimaryButton = forwardRef<HTMLButtonElement, StandardButtonProps>(
  (props, ref) => (
    <StandardButton
      ref={ref}
      variant="contained"
      color="primary"
      {...props}
    />
  )
);

PrimaryButton.displayName = 'PrimaryButton';

// ----------------------------------------------------------------------

/**
 * SecondaryButton - For secondary/alternative actions
 * 
 * When to use:
 * - Alternative important actions
 * - Secondary CTAs
 * - Actions that complement the primary action
 * 
 * Style: Solid secondary color background
 * 
 * @example
 * ```tsx
 * <SecondaryButton onClick={handleSaveDraft}>
 *   Save Draft
 * </SecondaryButton>
 * ```
 */
export const SecondaryButton = forwardRef<HTMLButtonElement, StandardButtonProps>(
  (props, ref) => (
    <StandardButton
      ref={ref}
      variant="contained"
      color="secondary"
      {...props}
    />
  )
);

SecondaryButton.displayName = 'SecondaryButton';

// ----------------------------------------------------------------------

/**
 * OutlinedButton - For less prominent actions
 * 
 * When to use:
 * - Secondary/tertiary actions
 * - "Cancel" buttons in dialogs
 * - Filter/toggle buttons
 * - Actions that shouldn't draw too much attention
 * 
 * Style: Border with transparent background
 * 
 * @example
 * ```tsx
 * <OutlinedButton onClick={handleCancel}>
 *   Cancel
 * </OutlinedButton>
 * ```
 */
export const OutlinedButton = forwardRef<HTMLButtonElement, StandardButtonProps>(
  (props, ref) => (
    <StandardButton
      ref={ref}
      variant="outlined"
      color="primary"
      {...props}
    />
  )
);

OutlinedButton.displayName = 'OutlinedButton';

// ----------------------------------------------------------------------

/**
 * TextButton - For minimal/tertiary actions
 * 
 * When to use:
 * - Links that should look like buttons
 * - "Learn More", "Skip" actions
 * - In-line actions within text
 * - Navigation within forms
 * 
 * Style: Text only, no background or border
 * 
 * @example
 * ```tsx
 * <TextButton onClick={handleSkip}>
 *   Skip this step
 * </TextButton>
 * ```
 */
export const TextButton = forwardRef<HTMLButtonElement, StandardButtonProps>(
  (props, ref) => (
    <StandardButton
      ref={ref}
      variant="text"
      color="primary"
      {...props}
    />
  )
);

TextButton.displayName = 'TextButton';

// ----------------------------------------------------------------------

/**
 * InheritButton - For neutral/custom styled actions
 * 
 * When to use:
 * - Actions that need to blend with the UI
 * - Custom colored buttons
 * - Buttons in toolbars or nav bars
 * 
 * Style: Inherits color from parent, solid background
 * 
 * @example
 * ```tsx
 * <InheritButton onClick={handleAction}>
 *   Action
 * </InheritButton>
 * ```
 */
export const InheritButton = forwardRef<HTMLButtonElement, StandardButtonProps>(
  (props, ref) => (
    <StandardButton
      ref={ref}
      variant="contained"
      color="inherit"
      {...props}
    />
  )
);

InheritButton.displayName = 'InheritButton';

// ----------------------------------------------------------------------

/**
 * SuccessButton - For positive/confirmation actions
 * 
 * When to use:
 * - "Approve", "Accept" actions
 * - Confirming successful operations
 * - Positive state changes
 * 
 * Style: Green/success color background
 * 
 * @example
 * ```tsx
 * <SuccessButton onClick={handleApprove}>
 *   Approve Request
 * </SuccessButton>
 * ```
 */
export const SuccessButton = forwardRef<HTMLButtonElement, StandardButtonProps>(
  (props, ref) => (
    <StandardButton
      ref={ref}
      variant="contained"
      color="success"
      {...props}
    />
  )
);

SuccessButton.displayName = 'SuccessButton';

// ----------------------------------------------------------------------

/**
 * ErrorButton - For destructive/dangerous actions
 * 
 * When to use:
 * - "Delete", "Remove" actions
 * - Irreversible operations
 * - Destructive state changes
 * 
 * Style: Red/error color background
 * 
 * ⚠️ IMPORTANT: Always show a confirmation dialog before executing!
 * 
 * @example
 * ```tsx
 * const dialog = useBoolean();
 * 
 * <ErrorButton onClick={dialog.onTrue}>
 *   Delete User
 * </ErrorButton>
 * 
 * <ConfirmDialog
 *   open={dialog.value}
 *   onClose={dialog.onFalse}
 *   title="Delete User"
 *   content="Are you sure? This cannot be undone."
 *   action={
 *     <ErrorButton onClick={handleDelete}>
 *       Delete
 *     </ErrorButton>
 *   }
 * />
 * ```
 */
export const ErrorButton = forwardRef<HTMLButtonElement, StandardButtonProps>(
  (props, ref) => (
    <StandardButton
      ref={ref}
      variant="contained"
      color="error"
      {...props}
    />
  )
);

ErrorButton.displayName = 'ErrorButton';

// ----------------------------------------------------------------------

/**
 * WarningButton - For caution-required actions
 * 
 * When to use:
 * - Actions with potential risks
 * - "Force Update", "Override" actions
 * - Operations that need user attention
 * 
 * Style: Orange/warning color background
 * 
 * @example
 * ```tsx
 * <WarningButton onClick={handleForceSync}>
 *   Force Sync
 * </WarningButton>
 * ```
 */
export const WarningButton = forwardRef<HTMLButtonElement, StandardButtonProps>(
  (props, ref) => (
    <StandardButton
      ref={ref}
      variant="contained"
      color="warning"
      {...props}
    />
  )
);

WarningButton.displayName = 'WarningButton';
