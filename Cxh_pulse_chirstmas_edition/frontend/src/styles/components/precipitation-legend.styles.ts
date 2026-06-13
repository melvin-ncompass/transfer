import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Precipitation Legend Styles
 * 
 * Extracted sx props for precipitation-legend component
 */

export const precipitationLegendStyles = {
  /**
   * Container
   */
  container: (bottomOffset: number): SxProps<Theme> => ({
    position: 'absolute',
    bottom: 16 + bottomOffset,
    left: 16,
    zIndex: 1000,
    pointerEvents: 'none',
  }),

  /**
   * Paper container
   */
  paper: {
    p: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    minWidth: 180,
  } as SxProps<Theme>,

  /**
   * Color bar
   */
  colorBar: {
    width: '100%',
    height: 20,
    borderRadius: 1,
    border: '1px solid rgba(255, 255, 255, 0.3)',
  } as SxProps<Theme>,

  /**
   * Min/Max label (bold)
   */
  minMaxLabel: (textColor: string): SxProps<Theme> => ({
    fontWeight: 'bold',
    color: textColor,
    fontSize: '11px',
  }),

  /**
   * Value label (normal)
   */
  valueLabel: (textColor: string): SxProps<Theme> => ({
    color: textColor,
    fontSize: '10px',
  }),

  /**
   * Low to High label
   */
  lowHighLabel: (textColor: string): SxProps<Theme> => ({
    fontSize: '9px',
    color: textColor,
    opacity: 0.8,
  }),
};
