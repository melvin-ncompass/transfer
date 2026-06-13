import type { SxProps, Theme } from '@mui/material/styles';

export const passwordSuccessStyles = {
  successIconBox: {
    width: 96,
    height: 96,
    borderRadius: '50%',
    bgcolor: 'success.lighter',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as SxProps<Theme>,

  title: {
    fontWeight: 700,
  } as SxProps<Theme>,

  subtitle: {
    fontWeight: 500,
  } as SxProps<Theme>,

  button: {
    mt: 2,
    py: 1.5,
    fontWeight: 600,
  } as SxProps<Theme>,
} as const;
