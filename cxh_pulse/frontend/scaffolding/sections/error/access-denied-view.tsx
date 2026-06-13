import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { useNavigate } from 'react-router-dom';
import { Logo } from '../../../src/components/logo';

// ----------------------------------------------------------------------

export function AccessDeniedView() {
  const navigate = useNavigate();

  return (
    <>
      <Logo sx={{ position: 'fixed', top: 20, left: 20 }} />

      <Container
        sx={{
          py: 10,
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h3" sx={{ mb: 2 }}>
          Access Denied
        </Typography>

        <Typography sx={{ color: 'text.secondary', maxWidth: 480, textAlign: 'center' }}>
          You don&apos;t have the required permissions to access this content.
          Please contact your administrator if you believe this is an error.
        </Typography>

        <Box
          component="img"
          src="/assets/illustrations/illustration-404.svg"
          sx={{
            width: 320,
            height: 'auto',
            my: { xs: 5, sm: 10 },
          }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
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
