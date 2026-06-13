import { Box, Container, Stack, Typography } from '@mui/material';
import { Iconify } from '../../../components/iconify';
import { PrimaryButton } from '../../../components/buttons';
import { landingViewStyles } from '../../../styles/pages/landing.styles';

type HeroSectionProps = {
    heroImage: string;
    loading: boolean;
    onExploreClick: (e: React.MouseEvent) => void;
    isFlipped: boolean;
};

export function HeroSection({ heroImage, loading, onExploreClick, isFlipped }: HeroSectionProps) {
    return (
        <Box sx={landingViewStyles.heroFace(heroImage, isFlipped)}>
            <Container maxWidth="md" sx={landingViewStyles.heroContainer}>
                <Stack spacing={3} alignItems="center" textAlign="center">
                    <Typography variant="h1" sx={landingViewStyles.heroTitle}>
                        Kajiado County
                        <br />
                        Climate × Health Pulse
                    </Typography>
                    <Typography variant="h5" sx={landingViewStyles.heroSubtitle}>
                        An integrated observatory combining climate data, health indicators, and predictive
                        analytics to protect maternal health in Kajiado County, Kenya
                    </Typography>
                    <PrimaryButton
                        variant="contained"
                        loading={loading}
                        size="large"
                        onClick={onExploreClick}
                        endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={20} />}
                        sx={landingViewStyles.heroButton}
                        data-testid="button-explore-dashboard"
                    >
                        Explore Tool
                    </PrimaryButton>
                </Stack>
            </Container>
        </Box>
    );
}

