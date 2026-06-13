import type { SxProps, Theme } from '@mui/material/styles';

// Logo dimensions - proportional to SVG viewBox (460x70)
const LOGO_HEIGHT = 40;
const LOGO_ASPECT_RATIO = 460 / 70; // ~6.57
const LOGO_WIDTH = LOGO_HEIGHT * LOGO_ASPECT_RATIO;

export const logoStyles = {
  root: (disabled?: boolean) => ({
    height: LOGO_HEIGHT,
    minWidth: '100px',
    maxWidth: '195px',
    width:'100%',
    ...(disabled && { pointerEvents: 'none' }),
  }) as SxProps<Theme>,

  typography: (primaryMain: string) => ({
    color: primaryMain,
    fontWeight: 'fontWeightBold',
    transition: 'all 0.2s ease',
  }) as SxProps<Theme>,
} as const;
