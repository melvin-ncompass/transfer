import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
import { setUser, getFirstAccessibleNavPath } from '../../store/slices/authSlice';
import { useLazyGetCurrentUserQuery } from '../../api';
import { landingViewStyles } from '../../styles/pages/landing.styles';

import { HeroSection, LandingHeader } from './components';
import { delay } from 'lodash';

const heroImage = '/assets/images/Kajiado_County_aerial_landscape_view_52c637ec.webp';

export function LandingView() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [getCurrentUser] = useLazyGetCurrentUserQuery();

    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const backFaceContentRef = useRef<HTMLDivElement>(null);
    const flipCardInnerRef = useRef<HTMLDivElement>(null);
    const flipCardContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isFlipped && backFaceContentRef.current && flipCardInnerRef.current) {
            requestAnimationFrame(() => {
                if (backFaceContentRef.current && flipCardInnerRef.current) {
                    const contentHeight = backFaceContentRef.current.scrollHeight;
                    const viewportHeight = window.innerHeight;
                    const minHeight = Math.max(contentHeight - 100, viewportHeight * 0.70);
                    flipCardInnerRef.current.style.minHeight = `${minHeight}px`;
                }
            });
        } else if (flipCardInnerRef.current) {
            flipCardInnerRef.current.style.minHeight = '85vh';
        }
    }, [isFlipped,]);

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

    const handleGetStartedClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();

        setIsFlipped(true);
        delay(() => navigate('/about'), 500);
    }, [navigate]);

    const handleLoginClick = useCallback(async () => {
        setIsLoginLoading(true);
        const authResult = await verifyAuth();
        setIsLoginLoading(false);

        if (authResult.success && authResult.navigationPath) {
            navigate(authResult.navigationPath);
        } else {
            setIsFlipped(true);
            delay(() => navigate('/login'), 500);
        }
    }, [navigate, verifyAuth]);

    const handleRegisterClick = useCallback(() => {
        setIsFlipped(true);
        delay(() => navigate('/register'), 500);
    }, [navigate]);

    return (
        <Box sx={landingViewStyles.container}>
            <Box sx={landingViewStyles.headerWrapperStyles}>
                <LandingHeader
                    overlay={!isFlipped}
                    isLoginLoading={isLoginLoading}
                    onLoginClick={handleLoginClick}
                    onRegisterClick={handleRegisterClick}
                />
            </Box>

            <Box ref={flipCardContainerRef} sx={landingViewStyles.flipCardContainer(isFlipped)}>
                <Box
                    ref={flipCardInnerRef}
                    sx={landingViewStyles.flipCardInner(isFlipped)}
                >
                    <HeroSection
                        heroImage={heroImage}
                        loading={isLoginLoading}
                        onExploreClick={handleGetStartedClick}
                        buttonText="Get Started"
                        useFlipCard
                    />
                </Box>
            </Box>
        </Box>
    );
}
