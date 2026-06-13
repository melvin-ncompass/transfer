import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Container, Stack, Typography } from '@mui/material';
import { LandingHeader, AuthSection, FeatureCard, MethodologySection, LandingFooter } from '../sections/landing/components';
import { landingViewStyles } from '../styles/pages/landing.styles';
import { DataIntegrationDoc } from '../sections/landing/components/data-integration-doc';
import { AuthTab, AuthTabType } from '../sections/landing/types';

// Hero image from public directory - use string path for Vite public assets
const heroImage = '/assets/images/Kajiado_County_aerial_landscape_view_52c637ec.png';

export default function GetStartedPage() {
    const [searchParams] = useSearchParams();
    const showAuthParam = searchParams.get('showAuth');
    const authTabParam = searchParams.get('authTab');

    const [isFlipped, setIsFlipped] = useState(false);
    const [authTab, setAuthTab] = useState<AuthTabType>(AuthTab.SIGN_IN);

    useEffect(() => {
        if (showAuthParam === 'true') {
            setIsFlipped(true);
        }
        if (authTabParam === AuthTab.SIGN_IN || authTabParam === AuthTab.SIGN_UP) {
            setAuthTab(authTabParam as AuthTabType);
        }
    }, [showAuthParam, authTabParam]);

    const handleLoginClick = () => {
        setAuthTab(AuthTab.SIGN_IN);
        setIsFlipped(true);
    };

    const handleRegisterClick = () => {
        setAuthTab(AuthTab.SIGN_UP);
        setIsFlipped(true);
    };

    const handleBackToContent = () => {
        setIsFlipped(false);
        // Remove URL params when going back
        window.history.replaceState({}, '', '/get-started');
    };

    return (
        <Box sx={landingViewStyles.container}>
            <LandingHeader onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />

            {/* Flip Card Container */}
            <Box sx={landingViewStyles.flipCardContainer(isFlipped)}>
                <Box sx={landingViewStyles.flipCardInner(isFlipped)}>
                    {/* Front face - Content */}
                    <Box
                        sx={{
                            position: 'absolute',
                            width: '100%',
                            minHeight: isFlipped ? '75vh' : '85vh',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Container maxWidth="lg" sx={landingViewStyles.mainContent}>
                            {/* Multi-Sectoral Data Integration Section */}
                            <DataIntegrationDoc />


                        </Container>
                    </Box>

                    {/* Back face - Auth section */}
                    <AuthSection heroImage={heroImage} authTab={authTab} onBackToHero={handleBackToContent} />
                </Box>
                <MethodologySection />
                <LandingFooter />
            </Box>

        </Box>
    );
}
