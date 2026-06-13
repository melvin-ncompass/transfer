import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, AppBar, Toolbar, Container, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../../components/logo';
import { getAuthUrl } from '../../../routes/utils/auth-urls';
import { AuthTab } from '../types';

type LandingHeaderProps = {
    overlay?: boolean;
    isAuthMode?: boolean;
    isLoginLoading?: boolean;
    onLoginClick?: () => void;
    onRegisterClick?: () => void;
};

const SCROLL_THRESHOLD = 100;

export function LandingHeader({ overlay = false, isAuthMode = false, isLoginLoading = false, onLoginClick, onRegisterClick }: LandingHeaderProps) {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        if (!overlay || isAuthMode) {
            setScrolled(false);
            return undefined;
        }

        const checkScroll = () => {
            const isScrolled = window.scrollY > SCROLL_THRESHOLD;
            setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
        };

        checkScroll();

        window.addEventListener('scroll', checkScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', checkScroll);
        };
    }, [overlay, isAuthMode]);

    const isOverlayMode = useMemo(() => overlay && !scrolled && !isAuthMode, [overlay, scrolled, isAuthMode]);

    const handleLoginClick = useCallback(() => {
        if (onLoginClick) {
            onLoginClick();
        } else {
            navigate('/login');
        }
    }, [onLoginClick, navigate]);

    const handleRegisterClick = useCallback(() => {
        if (onRegisterClick) {
            onRegisterClick();
        } else {
            navigate('/register');
        }
    }, [onRegisterClick, navigate]);

    const buttonStyles = useMemo(
        () => ({
            textTransform: 'none' as const,
            color: isOverlayMode ? 'white !important' : 'text.primary',
            fontWeight: 500,
            transition: 'color 0.3s ease, background-color 0.3s ease',
            '&:hover': {
                bgcolor: isOverlayMode ? 'rgba(255, 255, 255, 0.1)' : undefined,
            },
        }),
        [isOverlayMode]
    );

    const logoStyles = useMemo(
        () => ({
            '& a': {
                color: isOverlayMode ? 'white' : undefined,
            },
            // Target SVG elements in the logo for overlay mode color changes
            '& svg': {
                '& path': {
                    stroke: isOverlayMode ? 'white' : undefined,
                },
                '& text': {
                    fill: isOverlayMode ? 'white' : undefined,
                },
            },
        }),
        [isOverlayMode]
    );

    const appBarStyles = useMemo(
        () => ({
            bgcolor: isOverlayMode ? 'transparent' : 'background.paper',
            boxShadow: isOverlayMode ? 0 : 1,
            zIndex: 1100,
            top: 0,
            left: 0,
            right: 0,
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
        }),
        [isOverlayMode]
    );

    return (
        <AppBar position="fixed" sx={appBarStyles}>
            <Container maxWidth="lg">
                <Toolbar
                    disableGutters
                    sx={{
                        minHeight: { xs: 64, md: 72 },
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Box sx={logoStyles}>
                        <Logo href="/" disabled={false} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button
                            variant="text"
                            onClick={handleLoginClick}
                            disabled={isLoginLoading}
                            sx={buttonStyles}
                        >
                            {isLoginLoading ? (
                                <CircularProgress
                                    size={16}
                                    sx={{
                                        color: isOverlayMode ? 'white' : 'inherit',
                                        mr: 1
                                    }}
                                />
                            ) : (
                                'Sign in'
                            )}
                        </Button>
                        <Button variant="text" onClick={handleRegisterClick} sx={buttonStyles}>
                            Sign up
                        </Button>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}

