import type { SxProps, Theme } from '@mui/material/styles';
import type { ScrollbarProps } from '../../components/scrollbar/types';

/**
 * Scrollbar Styles
 * 
 * Extracted sx props for scrollbar component
 */

export const scrollbarStyles = {
  /**
   * Root container with slot props
   */
  root: (slotProps?: ScrollbarProps['slotProps']): SxProps<Theme> => ({
    // Apply custom styles to SimpleBar internal elements
    '& .simplebar-wrapper': slotProps?.wrapperSx as React.CSSProperties,
    '& .simplebar-content-wrapper': slotProps?.contentWrapperSx as React.CSSProperties,
    '& .simplebar-content': slotProps?.contentSx as React.CSSProperties,
  }),
};
