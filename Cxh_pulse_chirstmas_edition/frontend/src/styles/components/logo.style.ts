import type { SxProps, Theme } from '@mui/material/styles';

export const logoStyles = {
  root: (disabled?: boolean) => ({
    height: 27,
    ...(disabled && { pointerEvents: 'none' }),
  }) as SxProps<Theme>,

  typography: (primaryMain: string) => ({
    color: primaryMain,
    fontWeight: 'fontWeightBold',
    transition: 'all 0.2s ease',
  }) as SxProps<Theme>,
} as const;
