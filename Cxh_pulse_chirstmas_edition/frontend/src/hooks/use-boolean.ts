import { useCallback, useState } from 'react';
import type { UseBooleanReturn } from '../types';

/**
 * Custom hook for managing boolean state with convenient helper functions
 * 
 * Useful for:
 * - Modal open/close states
 * - Toggle switches
 * - Visibility states
 * - Loading states
 * - Any boolean flag management
 * 
 * @example
 * ```tsx
 * const dialog = useBoolean();
 * 
 * // Open dialog
 * <Button onClick={dialog.onTrue}>Open</Button>
 * 
 * // Close dialog
 * <Dialog open={dialog.value} onClose={dialog.onFalse}>
 *   ...
 * </Dialog>
 * 
 * // Toggle
 * <Switch checked={dialog.value} onChange={dialog.onToggle} />
 * ```
 * 
 * @param defaultValue - Initial boolean value (default: false)
 * @returns Object with value and helper functions
 */
export function useBoolean(defaultValue = false): UseBooleanReturn {
  const [value, setValue] = useState<boolean>(defaultValue);

  // Memoized function to set value to true
  const onTrue = useCallback(() => {
    setValue(true);
  }, []);

  // Memoized function to set value to false
  const onFalse = useCallback(() => {
    setValue(false);
  }, []);

  // Memoized function to toggle the value
  const onToggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return {
    value,
    onTrue,
    onFalse,
    onToggle,
    setValue,
  };
}
