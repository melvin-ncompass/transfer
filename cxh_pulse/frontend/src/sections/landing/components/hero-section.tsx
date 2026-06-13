import { Box, Container, Stack, Typography } from '@mui/material';
import { Iconify } from '../../../components/iconify';
import { PrimaryButton } from '../../../components/buttons';
import { landingViewStyles } from '../../../styles/pages/landing.styles';

type HeroSectionProps = {
    heroImage: string;
    loading: boolean;
    onExploreClick: (e: React.MouseEvent) => void;
    buttonText?: string;
    useFlipCard?: boolean;
};

export function HeroSection({ heroImage, loading, onExploreClick, buttonText = 'Get Started', useFlipCard = false }: HeroSectionProps) {
    // When useFlipCard is true, hero is inside flip card, so use absolute positioning
    const heroStyles = useFlipCard
        ? {
            ...landingViewStyles.heroFace,
            position: 'absolute' as const,
            top: 0,
            left: 0,
            width: '100%',
            height: '85vh',
            mt: 0,
            pt: { xs: '64px', md: '72px' }, // Padding to account for header height
            backfaceVisibility: 'hidden' as const,
            WebkitBackfaceVisibility: 'hidden' as const,
            MozBackfaceVisibility: 'hidden' as const,  // Firefox prefix
            transform: 'rotateY(0deg)',  // Explicit transform for Firefox 3D transform space
            zIndex: 1,
        }
        : landingViewStyles.heroFace;

    return (
        <Box sx={heroStyles}>
            <img
                src={heroImage}
                alt="Kajiado aerial landscape view"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: -2,
                }}
            />
            <Box
                sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6))',
                zIndex: -1,
                }}
            />
            <Container maxWidth="md" sx={landingViewStyles.heroContainer}>
                <Stack spacing={3} alignItems="center" textAlign="center">
                    <Typography variant="h1" sx={landingViewStyles.heroTitle}>
                        Climate × Health Pulse
                    </Typography>
                    <Typography variant="h5" sx={landingViewStyles.heroSubtitle}>
                        An integrated observatory combining localized climate data, health indicators and predictive
                        analytics to protect people vulnerable to climate-sensitive health risks
                    </Typography>
                    <PrimaryButton
                        variant="contained"
                        loading={loading}
                        size="large"
                        onClick={onExploreClick}
                        endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={20} />}
                        sx={landingViewStyles.heroButton}
                        data-testid="button-get-started"
                    >
                        {buttonText}
                    </PrimaryButton>
                </Stack>
            </Container>
        </Box>
    );
}

