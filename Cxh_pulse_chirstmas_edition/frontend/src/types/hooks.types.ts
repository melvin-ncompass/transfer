/**
 * Hook Types and Interfaces
 * 
 * This file contains all type definitions for custom hooks
 */

/**
 * Return type for the useBoolean hook
 * 
 * Provides convenient methods for managing boolean state:
 * - value: Current boolean state
 * - onTrue: Set state to true
 * - onFalse: Set state to false
 * - onToggle: Toggle state
 * - setValue: Direct state setter
 */
export interface UseBooleanReturn {
  value: boolean;                                      // Current boolean value
  onTrue: () => void;                                  // Set value to true
  onFalse: () => void;                                 // Set value to false
  onToggle: () => void;                                // Toggle value
  setValue: React.Dispatch<React.SetStateAction<boolean>>; // Direct setter
}
