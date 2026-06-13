import { Box, Stack, Typography } from '@mui/material';
import { PrimaryButton } from '../../../src/components/buttons';
import { Iconify } from '../../../src/components/iconify';
import { CONFIG } from '../../../src/config-global';

interface PasswordSuccessProps {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  onButtonClick?: () => void;
}

export function PasswordSuccess({
  title = 'All Set!',
  subtitle = 'Your password has been created successfully',
  description = 'You can now log in to your account using your new credentials.',
  buttonText = 'Continue to Login',
  buttonHref = CONFIG.loginUrl,
  onButtonClick,
}: PasswordSuccessProps) {
  return (
    <Stack spacing={4} alignItems="center">
      <Box
        sx={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          bgcolor: 'success.lighter',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Iconify icon="solar:check-circle-bold" width={56} color="success.main" />
      </Box>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h4" sx={{ fontWeight: 700 }} color="success.main">
          {title}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          {subtitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {description}
        </Typography>
      </Stack>
      <PrimaryButton
        fullWidth
        href={buttonHref}
        size="large"
        sx={{ mt: 2, py: 1.5, fontWeight: 600 }}
        onClick={onButtonClick}
      >
        {buttonText}
      </PrimaryButton>
    </Stack>
  );
}
