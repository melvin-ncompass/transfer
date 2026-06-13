import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Indicator Select Styles
 * 
 * Extracted sx props for indicator-select component
 */

export const indicatorSelectStyles = {
  /**
   * Loading container
   */
  loadingContainer: (maxWidth: number) => ({
    maxWidth,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  }) as SxProps<Theme>,

  /**
   * Loading text field
   */
  loadingTextField: {
    flex: 1,
  } as SxProps<Theme>,

  /**
   * Text field input styles
   */
  textField: (textColor: string) => ({
    '& .MuiInputBase-input::placeholder': {
      color: textColor,
      opacity: 1,
    },
    '& .MuiInputBase-input': {
      // Input text should always be visible - use theme text color
      color: 'text.primary',
    },
    '& .MuiInputLabel-root': {
      // Label should always be visible - use theme text color
      color: 'text.secondary',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      // Focused label uses primary color for better visibility
      color: 'primary.main',
    },
  }) as SxProps<Theme>,

  /**
   * Option container in list
   */
  optionContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 0.75,
  } as SxProps<Theme>,

  /**
   * Selected icon
   */
  selectedIcon: {
    color: 'primary.main',
    flexShrink: 0,
  } as SxProps<Theme>,

  /**
   * Empty space for unselected option
   */
  emptySpace: {
    flexShrink: 0,
  } as SxProps<Theme>,

  /**
   * Option text
   */
  optionText: {
    flex: 1,
  } as SxProps<Theme>,

  /**
   * Divider before population section
   */
  divider: {
    my: 1,
  } as SxProps<Theme>,

  /**
   * Group header container
   */
  groupHeader: {
    position: 'sticky',
    top: -7,
    backgroundColor: 'background.paper',
    zIndex: 100,
    fontWeight: 600,
    fontSize: '0.875rem',
    borderBottom: 1,
    borderColor: 'divider',
    px: 2,
    // Ensure background is opaque and stays on top
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  } as SxProps<Theme>,

  /**
   * Group header for population section (hidden)
   */
  groupHeaderPopulation: {
    position: 'sticky',
    top: -7,
    backgroundColor: 'background.paper',
    zIndex: 100,
    fontWeight: 600,
    fontSize: '0.875rem',
    borderBottom: 1,
    borderColor: 'divider',
    px: 2,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'none', // Hide section label for population (it's just a divider separator)
  } as SxProps<Theme>,

  /**
   * Group list container
   */
  groupList: {
    p: 0,
    m: 0,
  } as SxProps<Theme>,

  /**
   * Autocomplete container
   */
  autocomplete: (maxWidth: number) => ({
    maxWidth,
    width: '100%',
  }) as SxProps<Theme>,
};
