import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { OutlinedButton } from '../buttons';
import type { ConfirmDialogProps } from '../../types';

/**
 * Reusable confirmation dialog component
 * 
 * Use this component when you need to:
 * - Confirm destructive actions (delete, remove, etc.)
 * - Get user confirmation before proceeding
 * - Display important information requiring acknowledgment
 * 
 * @example
 * ```tsx
 * const dialog = useBoolean();
 * 
 * <ConfirmDialog
 *   open={dialog.value}
 *   onClose={dialog.onFalse}
 *   title="Delete User"
 *   content="Are you sure you want to delete this user? This action cannot be undone."
 *   action={
 *     <ErrorButton onClick={handleDelete}>
 *       Delete
 *     </ErrorButton>
 *   }
 *   onCancel={dialog.onFalse}
 * />
 * ```
 */
export function ConfirmDialog({
  title,
  content,
  action,
  open,
  onClose,
  onCancel,
  ...other
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} {...other}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>
        {/* Show cancel button only if onCancel handler is provided */}
        {onCancel && (
          <OutlinedButton onClick={onCancel}>
            Cancel
          </OutlinedButton>
        )}
        {/* Primary action button (confirm, delete, etc.) */}
        {action}
      </DialogActions>
    </Dialog>
  );
}
