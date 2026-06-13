import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Legend Component Styles
 * 
 * Extracted sx props for legend components
 */

export const legendStyles = {
  /**
   * Choropleth legend container
   */
  choroplethContainer: (isSmallScreen: boolean): SxProps<Theme> => ({
    position: 'absolute',
    bottom: 16,
    right: isSmallScreen ? '' : 16,
    left: isSmallScreen ? 16 : '',
    zIndex: 500,
    pointerEvents: 'none',
  }),

  /**
   * Choropleth legend paper
   */
  choroplethPaper: (backgroundColor: string): SxProps<Theme> => ({
    p: 1.5,
    backgroundColor,
    backdropFilter:
      backgroundColor.includes('rgba') && backgroundColor.includes('0,')
        ? 'blur(4px)'
        : 'none',
    minWidth: 180,
  }),

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
   * Legend text
   */
  legendText: (textColor: string): SxProps<Theme> => ({
    color: textColor,
    fontSize: '10px',
    fontWeight: 'bold',
  }),

  /**
   * Legend text normal
   */
  legendTextNormal: (textColor: string): SxProps<Theme> => ({
    // color: textColor,
    fontSize: '10px',
  }),

  /**
   * Legend label (Low → High)
   */
  legendLabel: (textColor: string): SxProps<Theme> => ({
    fontSize: '9px',
    // color: textColor,
    opacity: 0.8,
  }),
};

