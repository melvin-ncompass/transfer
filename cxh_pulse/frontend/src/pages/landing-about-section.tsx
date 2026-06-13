import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { LandingHeader, LandingFooter } from '../sections/landing/components';
import { DataIntegrationDoc } from '../sections/landing/components/data-integration-doc';
import { landingViewStyles } from '../styles/pages/landing.styles';
import { ExploreSection } from '../sections/landing/components/explore-section';
import { AboutSection } from '../sections/landing/components/about-section';
import { ClimateHealthPulseDoc } from '../sections/landing/components/cxh-section';
import { delay } from 'lodash';
import { getFirstAccessibleNavPath, setUser } from '@/store/slices/authSlice';
import { useAppDispatch } from '@/store/hooks';
import { useLazyGetCurrentUserQuery } from '@/api';

export default function LandingAboutSection() {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();
    const [getCurrentUser] = useLazyGetCurrentUserQuery();
    const [isLoading, setIsLoading] = useState(false);

    const [mounted, setMounted] = useState(false);
    const [isFlipping, setIsFlipping] = useState(false);

    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const verifyAuth = useCallback(async (): Promise<{ success: boolean; navigationPath?: string }> => {
        try {
            const currentUser = await getCurrentUser().unwrap();
            dispatch(setUser(currentUser));

            const navigationPath = getFirstAccessibleNavPath(
                currentUser.navigation,
                currentUser.permissions
            );

            return { success: true, navigationPath };
        } catch {
            return { success: false };
        }
    }, [getCurrentUser, dispatch]);

    const handleBackToLanding = useCallback(() => {
        setIsFlipping(true);
        delay(() => navigate('/'), 500);
    }, [navigate]);

    const scrollTopAnimation = useCallback(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        }
    }, []);

    const handleLoginClick = useCallback(async () => {
        setIsLoading(true);
        const authResult = await verifyAuth();
        setIsLoading(false);

        if (authResult.success && authResult.navigationPath) {
            navigate(authResult.navigationPath);
        } else {
            scrollTopAnimation();
            delay(() => navigate('/login'), 500);
        }
    }, [navigate, verifyAuth, scrollTopAnimation]);

    const handleRegisterClick = useCallback(() => {
        scrollTopAnimation();
        delay(() => navigate('/register'), 500)
    }, [scrollTopAnimation, navigate]);

    const handleExploreClick = useCallback( async (e: React.MouseEvent) => {
        e.preventDefault();

        setIsLoading(true);
        const authResult = await verifyAuth();
        setIsLoading(false);
        if (authResult.success && authResult.navigationPath) {
            navigate(authResult.navigationPath);
        }
    }, [navigate, verifyAuth]);

    return (
        <Box
            ref={containerRef}
            sx={{
                ...landingViewStyles.container,
            }}
        >
            <Box sx={landingViewStyles.headerWrapperStyles}>
                <LandingHeader 
                    onLoginClick={handleLoginClick} 
                    onRegisterClick={handleRegisterClick} 
                    isLoginLoading={isLoading}
                />
            </Box>
            <Box
                sx={{
                    perspective: 1000,
                }}
            >
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        height: isFlipping ? '85vh' : 'auto',
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.8s cubic-bezier(0.4, 0.2, 0.2, 1)',
                        WebkitTransformStyle: 'preserve-3d',
                        transform: isFlipping ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                    }}
                >
                    <Box
                        sx={{
                            backfaceVisibility: 'hidden',
                        }}
                    >
                        <Container
                            maxWidth="lg"
                            sx={{
                                ...landingViewStyles.mainContent,
                                pt: 12,
                                opacity: mounted ? 1 : 0,
                                transition: 'opacity 500ms ease-out, transform 500ms ease-out',
                            }}
                        >
                            <ClimateHealthPulseDoc
                                onBack={handleBackToLanding}
                                onLoginClick={handleLoginClick}
                                onRegisterClick={handleRegisterClick}
                            />
                            <AboutSection />
                            <DataIntegrationDoc />
                            <ExploreSection onExploreClick={handleExploreClick} loading={isLoading}/>
                            <LandingFooter />
                        </Container>
                    </Box>
                </Box>
            </Box>
        </Box>
    );

}
