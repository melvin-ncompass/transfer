import type { SxProps, Theme } from '@mui/material/styles';

const getStrengthColor = (score: number) => {
  const colors = ['error.main', 'error.main', 'warning.main', 'info.main', 'success.main'];
  return colors[score];
};

export const profileStyles = {
  card: {
    bgcolor: 'background.paper',
  } as SxProps<Theme>,

  profileHeaderBox: {
    p: 3,
  } as SxProps<Theme>,

  avatarContainer: {
    position: 'relative',
  } as SxProps<Theme>,

  avatar: {
    width: 120,
    height: 120,
    fontSize: '3rem',
    fontWeight: 600,
    border: 4,
    borderColor: 'background.paper',
    boxShadow: 2,
  } as SxProps<Theme>,

  editAvatarButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    bgcolor: 'primary.main',
    color: 'white',
    '&:hover': { bgcolor: 'primary.dark' },
    width: 36,
    height: 36,
    boxShadow: 2,
  } as SxProps<Theme>,

  userInfoBox: {
    flex: 1,
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'column', md: 'column' },
    alignItems: { xs: 'center', sm: 'flex-start', md: 'flex-start', lg: 'flex-start' },
  } as SxProps<Theme>,

  userNameTypography: {
    mb: 0.5,
    fontWeight: 600,
  } as SxProps<Theme>,

  userEmailTypography: {
    mb: 1,
  } as SxProps<Theme>,

  roleBadge: {
    display: 'inline-flex',
    px: 1.5,
    py: 0.5,
    borderRadius: 1,
    bgcolor: 'primary.lighter',
    color: 'primary.main',
  } as SxProps<Theme>,

  roleBadgeText: {
    fontWeight: 600,
  } as SxProps<Theme>,

  avatarHintTypography: {
    mt: 2,
    display: 'block',
  } as SxProps<Theme>,

  avatarHintIcon: {
    mr: 0.5,
    verticalAlign: 'middle',
  } as SxProps<Theme>,

  accordion: {
    '&:before': { display: 'none' },
    boxShadow: 'none',
    bgcolor: 'transparent',
  } as SxProps<Theme>,

  accordionSummary: {
    px: 3,
    minHeight: 56,
    '&.Mui-expanded': { minHeight: 56 },
  } as SxProps<Theme>,

  accordionIconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 1.5,
    bgcolor: 'background.paper',
    color: 'text.secondary',
  } as SxProps<Theme>,

  accordionTitle: {
    fontWeight: 600,
  } as SxProps<Theme>,

  accordionDetails: {
    px: 3,
    pt: 2,
    pb: 3,
  } as SxProps<Theme>,

  helperTextTypography: (nameLength: number, maxLength: number) => ({
    color: nameLength >= maxLength ? 'error.main' : 'text.secondary',
  }) as SxProps<Theme>,

  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 2,
    mt: 1,
  } as SxProps<Theme>,

  passwordStrengthContainer: {
    mt: 1,
  } as SxProps<Theme>,

  passwordStrengthHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    mb: 0.5,
  } as SxProps<Theme>,

  passwordStrengthLabel: (score: number) => ({
    fontWeight: 600,
    color: getStrengthColor(score),
  }) as SxProps<Theme>,

  passwordStrengthProgress: (score: number) => ({
    height: 6,
    borderRadius: 1,
    bgcolor: 'action.hover',
    '& .MuiLinearProgress-bar': {
      bgcolor: getStrengthColor(score),
      borderRadius: 1,
    },
  }) as SxProps<Theme>,

  passwordFeedbackText: {
    display: 'block',
    mt: 0.5,
  } as SxProps<Theme>,

  passwordMaxLimitText: {
    display: 'block',
    mt: 0.5,
  } as SxProps<Theme>,

  snackbarAlert: {
    width: '100%',
  } as SxProps<Theme>,

  cropImageContainer: {
    width: '100%',
    maxWidth: '500px',
    maxHeight: '500px',
    mx: 'auto',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as SxProps<Theme>,

  cropImagePlaceholder: {
    py: 2,
    textAlign: 'center',
  } as SxProps<Theme>,

  discardButton: {
    minWidth: 90,
  } as SxProps<Theme>,
} as const;
