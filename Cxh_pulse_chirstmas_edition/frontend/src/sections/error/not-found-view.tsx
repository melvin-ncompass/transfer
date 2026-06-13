import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from '../../routes/components';

import { Logo } from '../../components/logo';
import { InheritButton } from '../../components/buttons';
import { errorSectionStyles } from '../../styles/sections/error.styles';

// ----------------------------------------------------------------------

export function NotFoundView() {
  return (
    <>
      <Logo sx={errorSectionStyles.logoFixed} />

      <Container sx={errorSectionStyles.errorContainer}>
        <Typography variant="h3" sx={errorSectionStyles.errorTitle}>
          Sorry, page not found!
        </Typography>

        <Typography sx={errorSectionStyles.errorDescription}>
          Sorry, we couldn&apos;t find the page you&apos;re looking for. Perhaps you&apos;ve mistyped the URL? Be
          sure to check your spelling.
        </Typography>

        <Box
          component="img"
          src="/assets/illustrations/illustration-404.svg"
          sx={errorSectionStyles.errorIllustration}
        />

        <InheritButton component={RouterLink} href="/" size="large">
          Go to home
        </InheritButton>
      </Container>
    </>
  );
}
