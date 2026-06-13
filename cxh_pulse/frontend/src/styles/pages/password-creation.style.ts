import type { SxProps, Theme } from '@mui/material/styles';

const getStrengthColor = (score: number) => {
  const colors = ['theme.palette.error.main', 'error.main', 'warning.main', 'info.main', 'theme.palette.success.main'];
  return colors[score];
};

export const passwordCreationFormStyles = (passwordStrength: any) => 
   ({
    successIcon: {
      width: 64,
      height: 64,
      borderRadius: '50%',
      bgcolor: 'success.lighter',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mb: 1,
    } as SxProps<Theme>,
    title: {
      fontWeight: 600,
    } as SxProps<Theme>,
    passwordStrengthContainer: {
      mt: 1,
    } as SxProps<Theme>,
    passwordStrengthTitleContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      mb: 0.5,
    } as SxProps<Theme>,
    passwordStrengthTitle: {
      fontWeight: 600,
      color: getStrengthColor(passwordStrength.score),
    } as SxProps<Theme>,
    passwordStrengthTitleText: {
      fontWeight: 600,
      color: getStrengthColor(passwordStrength.score),
    } as SxProps<Theme>,
    linearProgress: {
      height: 6,
      borderRadius: 1,
      bgcolor: 'action.hover',
      '& .MuiLinearProgress-bar': {
        bgcolor: getStrengthColor(passwordStrength.score),
        borderRadius: 1,
      },
    } as SxProps<Theme>,
    warningText: {
      display: 'block',
      mt: 0.5,
    } as SxProps<Theme>,
    suggestionText: {
      display: 'block',
      mt: 0.5,
    } as SxProps<Theme>,
  } as const);
export const passwordCreationFormStaticStyles = {
  submitButton: {
    mt: 1,
    py: 1.5,
    fontWeight: 600,
  } as SxProps<Theme>,
} as const;