import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Temperature Legend Styles
 * 
 * Extracted sx props for temperature-legend components
 */

export const temperatureLegendStyles = {
  /**
   * Container
   */
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    zIndex: 1000,
    pointerEvents: 'none',
  } as SxProps<Theme>,

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
   * Title label (bold)
   */
  titleLabel: (textColor: string): SxProps<Theme> => ({
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
