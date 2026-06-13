import type { ButtonProps as MuiButtonProps } from '@mui/material/Button';

/**
 * Button Types and Interfaces
 * 
 * This file contains all type definitions for button components
 */

/**
 * Extended button props with loading state support
 * 
 * Extends Material-UI ButtonProps with:
 * - loading: Shows "Loading..." text and disables the button
 * 
 * Used by all button variants (Primary, Secondary, Outlined, etc.)
 */
export interface StandardButtonProps extends MuiButtonProps {
  loading?: boolean;
}
