import type { DialogProps } from '@mui/material';
import type { ReactNode } from 'react';

/**
 * Dialog Types and Interfaces
 * 
 * This file contains all type definitions for dialog components
 */

/**
 * Props for ConfirmDialog component
 * 
 * Extends Material-UI DialogProps with custom properties:
 * - title: Dialog header text
 * - content: Dialog body content (text or components)
 * - action: Primary action button
 * - onCancel: Optional cancel handler
 */
export type ConfirmDialogProps = {
  title: string;           // Dialog title text
  content: ReactNode;      // Dialog body content (text, components, etc.)
  action: ReactNode;       // Primary action button (usually a PrimaryButton or ErrorButton)
  open: boolean;           // Controls dialog visibility
  onClose: VoidFunction;   // Called when dialog is closed (backdrop click, ESC key)
  onCancel?: VoidFunction; // Optional: Called when Cancel button is clicked
} & Omit<DialogProps, 'title' | 'open' | 'onClose' | 'content' | 'children'>;
