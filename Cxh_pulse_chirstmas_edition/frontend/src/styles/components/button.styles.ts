import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Button Styles
 * 
 * Extracted sx props for button components to improve maintainability
 * and enable better code organization.
 */

export const buttonStyles = {
  /**
   * Standard button base styles
   */
  base: {
    minHeight: 40,
  } as SxProps<Theme>,

  /**
   * Loading button styles
   */
  loading: {
    opacity: 0.6,
    cursor: 'not-allowed',
  } as SxProps<Theme>,

  /**
   * Button variant styles
   */
  contained: {
    '&:hover': {
      filter: 'brightness(0.95)',
    },
    '&.Mui-disabled': {
      opacity: 0.6,
    },
  } as SxProps<Theme>,

  outlined: {
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.04)',
    },
  } as SxProps<Theme>,

  text: {
    background: 'transparent',
  } as SxProps<Theme>,
};

/**
 * Helper function to get button styles based on variant and color
 */
export const getButtonStyles = (
  variant: 'contained' | 'outlined' | 'text',
  color: string
): SxProps<Theme> => {
  const baseStyles: Record<string, any> = {};

  // Map MUI color names to CSS variable names
  const cssVarFor = (col: string) => {
    switch (col) {
      case 'primary':
        return { value: 'var(--brand-accent)', contrast: 'var(--brand-accent-contrast)' };
      case 'secondary':
        return { value: 'var(--brand-secondary)', contrast: 'var(--brand-secondary-contrast)' };
      case 'success':
        return { value: 'var(--brand-success)', contrast: 'var(--brand-success-contrast)' };
      case 'warning':
        return { value: 'var(--brand-warning)', contrast: 'var(--brand-warning-contrast)' };
      case 'error':
        return { value: 'var(--brand-error)', contrast: 'var(--brand-error-contrast)' };
      default:
        return { value: undefined, contrast: undefined };
    }
  };

  const cssVars = cssVarFor(color);

  if (cssVars.value) {
    if (variant === 'contained') {
      baseStyles.backgroundColor = cssVars.value;
      baseStyles.color = cssVars.contrast || 'inherit';
      baseStyles['&:hover'] = { filter: 'brightness(0.95)' };
      baseStyles['&.Mui-disabled'] = { opacity: 0.6 };
    } else if (variant === 'outlined') {
      baseStyles.borderColor = cssVars.value;
      baseStyles.color = cssVars.value;
      baseStyles['&:hover'] = { backgroundColor: 'rgba(0,0,0,0.04)' };
    } else if (variant === 'text') {
      baseStyles.color = cssVars.value;
      baseStyles.background = 'transparent';
    }
  }

  return baseStyles;
};

