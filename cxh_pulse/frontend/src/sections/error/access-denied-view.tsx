import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { useNavigate } from 'react-router-dom';
import { Logo } from '../../components/logo';
import { errorSectionStyles } from '../../styles/sections/error.styles';

// ----------------------------------------------------------------------

export function AccessDeniedView() {
  const navigate = useNavigate();

  return (
    <>
      <Logo sx={errorSectionStyles.logoFixed} />

      <Container sx={errorSectionStyles.errorContainer}>
        <Typography variant="h3" sx={errorSectionStyles.errorTitle}>
          Access Denied
        </Typography>

        <Typography sx={errorSectionStyles.errorDescription}>
          You don&apos;t have the required permissions to access this content.
          Please contact your administrator if you believe this is an error.
        </Typography>

        <Box
          component="img"
          src="/assets/illustrations/illustration-404.svg"
          sx={errorSectionStyles.errorIllustration}
        />

        <Box sx={errorSectionStyles.errorActions}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            size="large"
          >
            Go Back
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            size="large"
          >
            Go to Home
          </Button>
        </Box>
      </Container>
    </>
  );
}
