import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Location Component Styles
 * 
 * Extracted sx props for location components
 */

export const locationStyles = {
  /**
   * Option container
   */
  optionContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 0.75,
  } as SxProps<Theme>,

  /**
   * Icon
   */
  icon: {
    color: 'primary.main',
    flexShrink: 0,
  } as SxProps<Theme>,

  /**
   * Empty icon placeholder
   */
  emptyIcon: {
    width: 18,
    flexShrink: 0,
  } as SxProps<Theme>,

  /**
   * Option text
   */
  optionText: {
    flex: 1,
  } as SxProps<Theme>,

  /**
   * Group header
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
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  } as SxProps<Theme>,

  /**
   * Autocomplete container
   */
  autocomplete: (maxWidth: string | number): SxProps<Theme> => ({
    maxWidth:{xs:'100%'},
    width: '100%',
  }),

  /**
   * List container
   */
  listContainer: {
    p: 0,
    m: 0,
  } as SxProps<Theme>,
};

